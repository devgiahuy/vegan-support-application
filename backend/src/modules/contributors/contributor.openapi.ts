import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import {
  adminContributorApplicationsQuerySchema,
  contributorApplicationListResponseSchema,
  contributorApplicationParamsSchema,
  contributorApplicationResponseSchema,
  contributorRevocationResponseSchema,
  contributorUserParamsSchema,
  inviteContributorRequestSchema,
  ownContributorApplicationsQuerySchema,
  reviewContributorApplicationRequestSchema,
  revokeContributorRequestSchema,
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
  const revocationResponse = registry.register(
    'ContributorRevocationResponse',
    contributorRevocationResponseSchema,
  );

  registry.registerPath({
    method: 'post',
    path: '/api/v1/contributor-applications',
    tags: ['Contributors'],
    summary: 'Gửi Contributor application',
    description:
      'Chỉ Member được apply. User có thể khai báo ORGANIZATION_AFFILIATION hoặc PLATFORM_TRACK_RECORD; application PENDING không cấp quyền. ADMIN_INVITED bị cấm trên public/profile path. Certificate không được thu thập hoặc xác minh trong MVP.',
    operationId: 'submitContributorApplication',
    security: authenticated,
    request: { body: jsonBody(submitContributorApplicationRequestSchema) },
    responses: {
      201: {
        description: 'Application PENDING đã tạo; role vẫn là MEMBER',
        content: { 'application/json': { schema: applicationResponse } },
      },
      400: errorResponse(errorSchema, 'Application input không hợp lệ', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Yêu cầu access token hợp lệ', authenticationCodes),
      403: errorResponse(errorSchema, 'Chỉ Member ACTIVE được apply', [
        'ACCOUNT_BANNED',
        'CONTRIBUTOR_APPLICATION_NOT_ALLOWED',
      ]),
      409: errorResponse(errorSchema, 'Application xung đột state/cooldown', [
        'CONTRIBUTOR_APPLICATION_PENDING',
        'CONTRIBUTOR_REAPPLY_NOT_ALLOWED',
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
        description: 'Application mới nhất trước, gồm approval basis/evidence và cooldown',
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
        description: 'Application queue/history theo status, claimed basis, source hoặc applicant',
        content: { 'application/json': { schema: applicationListResponse } },
      },
      400: errorResponse(errorSchema, 'Filter hoặc pagination không hợp lệ', [
        'VALIDATION_ERROR',
      ]),
      401: errorResponse(errorSchema, 'Yêu cầu access token hợp lệ', authenticationCodes),
      403: errorResponse(errorSchema, 'Chỉ Admin được truy cập', [
        'ACCOUNT_BANNED',
        'FORBIDDEN',
      ]),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/admin/contributor-invitations',
    tags: ['Contributor Admin'],
    summary: 'Admin tạo Contributor invitation PENDING',
    description:
      'Tạo application nguồn ADMIN_INVITATION và lưu inviter/reason. User vẫn là MEMBER cho tới một quyết định APPROVE thủ công với basis ADMIN_INVITED.',
    operationId: 'inviteContributorAdmin',
    security: authenticated,
    request: { body: jsonBody(inviteContributorRequestSchema) },
    responses: {
      201: {
        description: 'Invitation application PENDING đã tạo',
        content: { 'application/json': { schema: applicationResponse } },
      },
      400: errorResponse(errorSchema, 'Invitation input không hợp lệ', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Yêu cầu access token hợp lệ', authenticationCodes),
      403: errorResponse(errorSchema, 'Admin authorization hoặc self-invite không hợp lệ', [
        'FORBIDDEN',
        'SELF_APPROVAL_FORBIDDEN',
      ]),
      409: errorResponse(errorSchema, 'Target không thể được mời', [
        'CONTRIBUTOR_APPLICATION_PENDING',
        'CONTRIBUTOR_INVITATION_NOT_ALLOWED',
      ]),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/admin/contributor-applications/{id}/review',
    tags: ['Contributor Admin'],
    summary: 'Admin approve/reject Contributor application',
    description:
      'APPROVE bắt buộc final approvalBasis và reason; role/profile/evidence/decision/session revocation được cập nhật transactionally. PLATFORM_TRACK_RECORD chụp immutable post/interaction snapshot. ORGANIZATION_AFFILIATION giữ claim/reference nhưng không xác minh certificate. ADMIN_INVITED chỉ hợp lệ cho invitation path. REJECT giữ role MEMBER và đặt cooldown 30 ngày.',
    operationId: 'reviewContributorApplicationAdmin',
    security: authenticated,
    request: {
      params: contributorApplicationParamsSchema,
      body: jsonBody(reviewContributorApplicationRequestSchema),
    },
    responses: {
      200: {
        description: 'Application đã review và decision audit đã ghi',
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
      409: errorResponse(errorSchema, 'Application/basis không còn reviewable', [
        'CONTRIBUTOR_APPLICATION_ALREADY_REVIEWED',
        'CONTRIBUTOR_APPLICATION_NOT_REVIEWABLE',
        'CONTRIBUTOR_APPROVAL_BASIS_INVALID',
      ]),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/v1/admin/contributors/{userId}/revoke',
    tags: ['Contributor Admin'],
    summary: 'Admin thu hồi Contributor status',
    description:
      'Thu hồi yêu cầu reason, giữ nguyên approval profile/evidence, ghi immutable REVOKED decision, đổi role về MEMBER và revoke mọi refresh session trong cùng transaction.',
    operationId: 'revokeContributorAdmin',
    security: authenticated,
    request: {
      params: contributorUserParamsSchema,
      body: jsonBody(revokeContributorRequestSchema),
    },
    responses: {
      200: {
        description: 'Contributor status đã được thu hồi và audit',
        content: { 'application/json': { schema: revocationResponse } },
      },
      400: errorResponse(errorSchema, 'User ID hoặc reason không hợp lệ', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Yêu cầu access token hợp lệ', authenticationCodes),
      403: errorResponse(errorSchema, 'Admin authorization/self action không hợp lệ', [
        'ACCOUNT_BANNED',
        'FORBIDDEN',
        'SELF_APPROVAL_FORBIDDEN',
      ]),
      409: errorResponse(errorSchema, 'Contributor không còn active', [
        'CONTRIBUTOR_REVOCATION_NOT_APPLICABLE',
      ]),
    },
  });
}
