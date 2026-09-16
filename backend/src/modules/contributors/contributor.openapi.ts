import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import {
  adminContributorApplicationsQuerySchema,
  contributorApplicationListResponseSchema,
  contributorApplicationParamsSchema,
  contributorApplicationResponseSchema,
  ownContributorApplicationsQuerySchema,
  reviewContributorApplicationRequestSchema,
  submitContributorApplicationRequestSchema,
} from './contributor.schemas.js';

const authenticated = [{ BearerAuth: [] }, { AccessTokenCookie: [] }];
const authenticationCodes = [
  'AUTH_REQUIRED',
  'INVALID_ACCESS_TOKEN',
  'TOKEN_EXPIRED',
  'STALE_ACCESS_TOKEN',
];

function errorResponse(errorSchema: ZodType, description: string, codes: string[]) {
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

function jsonBody(schema: ZodType) {
  return { required: true, content: { 'application/json': { schema } } };
}

export function registerContributorOpenApi(registry: OpenAPIRegistry, errorSchema: ZodType): void {
  const applicationResponse = registry.register(
    'ContributorApplicationResponse',
    contributorApplicationResponseSchema,
  );
  const applicationListResponse = registry.register(
    'ContributorApplicationListResponse',
    contributorApplicationListResponseSchema,
  );

  registry.registerPath({
    method: 'post',
    path: '/api/v1/contributor-applications',
    tags: ['Contributors'],
    summary: 'Gửi Contributor application hoặc yêu cầu đổi subtype',
    description:
      'Member và Contributor dùng cùng state machine với registration request. Requested type không cấp quyền; một user chỉ có một PENDING và application bị reject chỉ được gửi lại sau 30 ngày. MVP không thu thập hoặc xác minh certificate.',
    operationId: 'submitContributorApplication',
    security: authenticated,
    request: { body: jsonBody(submitContributorApplicationRequestSchema) },
    responses: {
      201: {
        description: 'Application PENDING đã tạo; role/profile hiện tại chưa thay đổi',
        content: { 'application/json': { schema: applicationResponse } },
      },
      400: errorResponse(errorSchema, 'Application input không hợp lệ', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Yêu cầu access token hợp lệ', authenticationCodes),
      403: errorResponse(errorSchema, 'Tài khoản bị cấm hoặc không được apply', [
        'ACCOUNT_BANNED',
        'CONTRIBUTOR_APPLICATION_NOT_ALLOWED',
      ]),
      409: errorResponse(errorSchema, 'Application xung đột state/cooldown', [
        'CONTRIBUTOR_APPLICATION_PENDING',
        'CONTRIBUTOR_REAPPLY_NOT_ALLOWED',
        'CONTRIBUTOR_TYPE_UNCHANGED',
      ]),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/contributor-applications/me',
    tags: ['Contributors'],
    summary: 'List lịch sử Contributor application của current user',
    operationId: 'listOwnContributorApplications',
    security: authenticated,
    request: { query: ownContributorApplicationsQuerySchema },
    responses: {
      200: {
        description: 'Application mới nhất trước, gồm review/cooldown status',
        content: { 'application/json': { schema: applicationListResponse } },
      },
      400: errorResponse(errorSchema, 'Pagination không hợp lệ', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Yêu cầu access token hợp lệ', authenticationCodes),
      403: errorResponse(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/admin/contributor-applications',
    tags: ['Contributor Admin'],
    summary: 'Admin list/filter Contributor applications',
    operationId: 'listContributorApplicationsAdmin',
    security: authenticated,
    request: { query: adminContributorApplicationsQuerySchema },
    responses: {
      200: {
        description: 'Application queue/history theo status, type, source hoặc applicant query',
        content: { 'application/json': { schema: applicationListResponse } },
      },
      400: errorResponse(errorSchema, 'Filter hoặc pagination không hợp lệ', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Yêu cầu access token hợp lệ', authenticationCodes),
      403: errorResponse(errorSchema, 'Chỉ Admin được truy cập', ['ACCOUNT_BANNED', 'FORBIDDEN']),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/admin/contributor-applications/{id}/review',
    tags: ['Contributor Admin'],
    summary: 'Admin approve/reject Contributor application',
    description:
      'APPROVE bắt buộc final contributorType, approvalBasis và reviewNote; cập nhật role/profile atomically và revoke mọi refresh session của applicant. REJECT bắt buộc reviewNote và đặt cooldown 30 ngày. Không có certificate verification trong MVP.',
    operationId: 'reviewContributorApplicationAdmin',
    security: authenticated,
    request: {
      params: contributorApplicationParamsSchema,
      body: jsonBody(reviewContributorApplicationRequestSchema),
    },
    responses: {
      200: {
        description: 'Application đã review',
        content: { 'application/json': { schema: applicationResponse } },
      },
      400: errorResponse(errorSchema, 'ID hoặc review input không hợp lệ', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Yêu cầu access token hợp lệ', authenticationCodes),
      403: errorResponse(errorSchema, 'Admin authorization hoặc self-approval không hợp lệ', [
        'ACCOUNT_BANNED',
        'FORBIDDEN',
        'SELF_APPROVAL_FORBIDDEN',
      ]),
      404: errorResponse(errorSchema, 'Không tìm thấy application', ['NOT_FOUND']),
      409: errorResponse(errorSchema, 'Application không còn reviewable', [
        'CONTRIBUTOR_APPLICATION_ALREADY_REVIEWED',
        'CONTRIBUTOR_APPLICATION_NOT_REVIEWABLE',
      ]),
    },
  });
}
