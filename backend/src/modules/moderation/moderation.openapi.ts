import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import {
  adminCommentListResponseSchema,
  adminCommentResponseSchema,
  adminCommentsQuerySchema,
  adminReportsQuerySchema,
  adminUserListResponseSchema,
  adminUserResponseSchema,
  adminUsersQuerySchema,
  createReportRequestSchema,
  moderationIdParamsSchema,
  reportListResponseSchema,
  reportResponseSchema,
  resolveReportRequestSchema,
  reviewDecisionRequestSchema,
  reviewQueueItemResponseSchema,
  reviewQueueListResponseSchema,
  reviewQueueQuerySchema,
  updateCommentStatusRequestSchema,
  updateUserStatusRequestSchema,
} from './moderation.schemas.js';

const authenticated = [{ BearerAuth: [] }, { AccessTokenCookie: [] }];

function jsonBody(schema: ZodType) {
  return { required: true, content: { 'application/json': { schema } } };
}

function errors(errorSchema: ZodType, description: string, codes: string[]) {
  return {
    description,
    content: {
      'application/json': {
        schema: errorSchema,
        examples: Object.fromEntries(
          codes.map((code) => [
            code,
            {
              value: {
                success: false,
                error: {
                  code,
                  message: description,
                  requestId: '0781d468-5eb1-4bd0-9671-e4ca33b76462',
                },
              },
            },
          ]),
        ),
      },
    },
  };
}

export function registerModerationOpenApi(registry: OpenAPIRegistry, errorSchema: ZodType): void {
  const reviewList = registry.register('ReviewQueueListResponse', reviewQueueListResponseSchema);
  const reviewItem = registry.register('ReviewQueueItemResponse', reviewQueueItemResponseSchema);
  const report = registry.register('ModerationReportResponse', reportResponseSchema);
  const reportList = registry.register('ModerationReportListResponse', reportListResponseSchema);
  const user = registry.register('AdminModerationUserResponse', adminUserResponseSchema);
  const userList = registry.register(
    'AdminModerationUserListResponse',
    adminUserListResponseSchema,
  );
  const comment = registry.register('AdminModerationCommentResponse', adminCommentResponseSchema);
  const commentList = registry.register(
    'AdminModerationCommentListResponse',
    adminCommentListResponseSchema,
  );
  const authErrors = [
    'AUTH_REQUIRED',
    'INVALID_ACCESS_TOKEN',
    'TOKEN_EXPIRED',
    'STALE_ACCESS_TOKEN',
  ];

  registry.registerPath({
    method: 'get',
    path: '/api/v1/review-queue/posts',
    tags: ['Moderation'],
    summary: 'List post revisions awaiting editorial or Admin moderation review',
    description:
      'Approved Contributors see clean Member PENDING_REVIEW revisions. Admin also sees FLAGGED and QUARANTINED revisions with rule reason codes, score, version, report count and priority.',
    operationId: 'listPostReviewQueue',
    security: authenticated,
    request: { query: reviewQueueQuerySchema },
    responses: {
      200: { description: 'Review queue', content: { 'application/json': { schema: reviewList } } },
      400: errors(errorSchema, 'Filter không hợp lệ', ['VALIDATION_ERROR']),
      401: errors(errorSchema, 'Yêu cầu access token hợp lệ', authErrors),
      403: errors(errorSchema, 'Contributor subtype/Admin permission required', [
        'FORBIDDEN',
        'ACCOUNT_BANNED',
      ]),
    },
  });

  for (const action of ['approve', 'reject'] as const) {
    registry.registerPath({
      method: 'patch',
      path: `/api/v1/review-queue/posts/{id}/${action}`,
      tags: ['Moderation'],
      summary: `${action === 'approve' ? 'Approve' : 'Reject'} latest post revision`,
      description:
        'Reason is mandatory. Self-review is forbidden. The latest revision and post are locked transactionally; flagged/quarantined decisions require Admin. A prior published revision remains public while a newer revision is pending or rejected.',
      operationId: `${action}PostReview`,
      security: authenticated,
      request: { params: moderationIdParamsSchema, body: jsonBody(reviewDecisionRequestSchema) },
      responses: {
        200: {
          description: 'Review decision and audit recorded',
          content: { 'application/json': { schema: reviewItem } },
        },
        400: errors(errorSchema, 'ID hoặc reason không hợp lệ', ['VALIDATION_ERROR']),
        401: errors(errorSchema, 'Yêu cầu access token hợp lệ', authErrors),
        403: errors(errorSchema, 'Review boundary violated', [
          'FORBIDDEN',
          'SELF_APPROVAL_FORBIDDEN',
          'ADMIN_REVIEW_REQUIRED',
        ]),
        404: errors(errorSchema, 'Không tìm thấy target', ['NOT_FOUND']),
        409: errors(errorSchema, 'Concurrent/already decided review', [
          'REVIEW_CONFLICT',
          'REVIEW_ALREADY_DECIDED',
          'CONTENT_AUTHOR_INACTIVE',
        ]),
      },
    });
  }

  registry.registerPath({
    method: 'post',
    path: '/api/v1/reports',
    tags: ['Moderation'],
    summary: 'Report a visible post or comment',
    description:
      'One OPEN report per reporter and target. Priority becomes HIGH at five distinct active reporters; this never confirms a violation automatically.',
    operationId: 'createModerationReport',
    security: authenticated,
    request: { body: jsonBody(createReportRequestSchema) },
    responses: {
      201: { description: 'Report created', content: { 'application/json': { schema: report } } },
      400: errors(errorSchema, 'Report input không hợp lệ', ['VALIDATION_ERROR']),
      401: errors(errorSchema, 'Yêu cầu access token hợp lệ', authErrors),
      403: errors(errorSchema, 'Self-report hoặc account boundary', [
        'SELF_REPORT_FORBIDDEN',
        'ACCOUNT_BANNED',
      ]),
      404: errors(errorSchema, 'Target không visible', ['NOT_FOUND']),
      409: errors(errorSchema, 'Active report đã tồn tại', ['DUPLICATE_ACTIVE_REPORT']),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/reports',
    tags: ['Moderation Admin'],
    summary: 'Admin list reports',
    operationId: 'listModerationReportsAdmin',
    security: authenticated,
    request: { query: adminReportsQuerySchema },
    responses: {
      200: {
        description: 'Report queue/history',
        content: { 'application/json': { schema: reportList } },
      },
      400: errors(errorSchema, 'Filter không hợp lệ', ['VALIDATION_ERROR']),
      401: errors(errorSchema, 'Yêu cầu access token hợp lệ', authErrors),
      403: errors(errorSchema, 'Admin only', ['FORBIDDEN', 'ACCOUNT_BANNED']),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/admin/reports/{id}/resolve',
    tags: ['Moderation Admin'],
    summary: 'Resolve all active reports for the same target with an Admin decision',
    description:
      'Supports NO_VIOLATION, WARN, HIDE, RESTORE, DEMOTE and BAN. Every decision requires a reason and stores related report IDs in the audit trail.',
    operationId: 'resolveModerationReportAdmin',
    security: authenticated,
    request: { params: moderationIdParamsSchema, body: jsonBody(resolveReportRequestSchema) },
    responses: {
      200: {
        description: 'Reports resolved and decision audited',
        content: { 'application/json': { schema: report } },
      },
      400: errors(errorSchema, 'Decision không hợp lệ', ['VALIDATION_ERROR']),
      401: errors(errorSchema, 'Yêu cầu access token hợp lệ', authErrors),
      403: errors(errorSchema, 'Admin only/protected account', [
        'FORBIDDEN',
        'PROTECTED_ADMIN_ACCOUNT',
      ]),
      404: errors(errorSchema, 'Report/target không tồn tại', ['NOT_FOUND']),
      409: errors(errorSchema, 'Report decision conflict', [
        'REPORT_ALREADY_RESOLVED',
        'REPORT_REVIEW_CONFLICT',
        'DEMOTION_NOT_APPLICABLE',
        'CONTENT_STATE_CONFLICT',
        'CONTENT_AUTHOR_INACTIVE',
      ]),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/users',
    tags: ['Moderation Admin'],
    summary: 'Admin search and filter users',
    operationId: 'listUsersAdmin',
    security: authenticated,
    request: { query: adminUsersQuerySchema },
    responses: {
      200: {
        description: 'User administration list',
        content: { 'application/json': { schema: userList } },
      },
      400: errors(errorSchema, 'Filter không hợp lệ', ['VALIDATION_ERROR']),
      401: errors(errorSchema, 'Yêu cầu access token hợp lệ', authErrors),
      403: errors(errorSchema, 'Admin only', ['FORBIDDEN', 'ACCOUNT_BANNED']),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/admin/users/{id}/status',
    tags: ['Moderation Admin'],
    summary: 'Lock, unlock, ban, unban or delete a user account',
    description:
      'Ban hides only currently visible posts/comments with USER_BANNED. Unban restores only items still hidden for exactly that reason. Delete revokes sessions, anonymizes the account and schedules private-data purge in 30 days.',
    operationId: 'updateUserStatusAdmin',
    security: authenticated,
    request: { params: moderationIdParamsSchema, body: jsonBody(updateUserStatusRequestSchema) },
    responses: {
      200: {
        description: 'User state changed and audited',
        content: { 'application/json': { schema: user } },
      },
      400: errors(errorSchema, 'Status/reason không hợp lệ', ['VALIDATION_ERROR']),
      401: errors(errorSchema, 'Yêu cầu access token hợp lệ', authErrors),
      403: errors(errorSchema, 'Self/protected Admin boundary', [
        'SELF_MODERATION_FORBIDDEN',
        'PROTECTED_ADMIN_ACCOUNT',
        'FORBIDDEN',
      ]),
      404: errors(errorSchema, 'Không tìm thấy user', ['NOT_FOUND']),
      409: errors(errorSchema, 'Invalid user state transition', ['USER_STATUS_CONFLICT']),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/comments',
    tags: ['Moderation Admin'],
    summary: 'Admin list comments for moderation',
    operationId: 'listCommentsAdmin',
    security: authenticated,
    request: { query: adminCommentsQuerySchema },
    responses: {
      200: {
        description: 'Comment moderation list',
        content: { 'application/json': { schema: commentList } },
      },
      400: errors(errorSchema, 'Filter không hợp lệ', ['VALIDATION_ERROR']),
      401: errors(errorSchema, 'Yêu cầu access token hợp lệ', authErrors),
      403: errors(errorSchema, 'Admin only', ['FORBIDDEN', 'ACCOUNT_BANNED']),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/admin/comments/{id}/status',
    tags: ['Moderation Admin'],
    summary: 'Admin hide or restore a comment',
    description:
      'Author-deleted comments cannot be restored. A reason and audit action are always recorded.',
    operationId: 'updateCommentStatusAdmin',
    security: authenticated,
    request: { params: moderationIdParamsSchema, body: jsonBody(updateCommentStatusRequestSchema) },
    responses: {
      200: {
        description: 'Comment status changed',
        content: { 'application/json': { schema: comment } },
      },
      400: errors(errorSchema, 'Status/reason không hợp lệ', ['VALIDATION_ERROR']),
      401: errors(errorSchema, 'Yêu cầu access token hợp lệ', authErrors),
      403: errors(errorSchema, 'Admin only', ['FORBIDDEN', 'ACCOUNT_BANNED']),
      404: errors(errorSchema, 'Không tìm thấy comment', ['NOT_FOUND']),
      409: errors(errorSchema, 'Comment state conflict', [
        'COMMENT_NOT_MODERATABLE',
        'COMMENT_STATUS_CONFLICT',
        'CONTENT_AUTHOR_INACTIVE',
      ]),
    },
  });
}
