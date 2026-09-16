import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import {
  behaviorEventResponseSchema,
  createBehaviorEventRequestSchema,
  deleteBehaviorHistoryResponseSchema,
  personalizationResponseSchema,
  recommendationQuerySchema,
  recommendationResponseSchema,
  updatePersonalizationRequestSchema,
} from './recommendation.schemas.js';

const authenticated = [{ BearerAuth: [] }, { AccessTokenCookie: [] }];
const errorResponse = (schema: ZodType, description: string, codes: string[]) => ({
  description,
  content: {
    'application/json': {
      schema,
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
});

export function registerRecommendationOpenApi(
  registry: OpenAPIRegistry,
  errorSchema: ZodType,
): void {
  const eventRequest = registry.register(
    'CreateBehaviorEventRequest',
    createBehaviorEventRequestSchema,
  );
  const eventResponse = registry.register('BehaviorEventResponse', behaviorEventResponseSchema);
  const preferenceRequest = registry.register(
    'UpdatePersonalizationRequest',
    updatePersonalizationRequestSchema,
  );
  const preferenceResponse = registry.register(
    'PersonalizationResponse',
    personalizationResponseSchema,
  );
  const deleteResponse = registry.register(
    'DeleteBehaviorHistoryResponse',
    deleteBehaviorHistoryResponseSchema,
  );
  const recommendations = registry.register('RecommendationResponse', recommendationResponseSchema);

  registry.registerPath({
    method: 'post',
    path: '/api/v1/behavior-events',
    tags: ['Recommendations'],
    summary: 'Ghi nhận behavior event đã consent',
    description:
      'Chỉ nhận metadata allowlist; CHAT_TOPIC chỉ nhận topic code, không nhận raw chat text. SEARCH, VIEW_RECIPE và CHAT_TOPIC dedupe theo cửa sổ 5 phút; mọi request có idempotency key.',
    operationId: 'createBehaviorEvent',
    security: authenticated,
    request: {
      body: { required: true, content: { 'application/json': { schema: eventRequest } } },
    },
    responses: {
      201: {
        description: 'Event mới đã được ghi nhận',
        content: { 'application/json': { schema: eventResponse } },
      },
      200: {
        description: 'Event trùng đã được dedupe',
        content: { 'application/json': { schema: eventResponse } },
      },
      400: errorResponse(errorSchema, 'Payload hoặc thời điểm event không hợp lệ', [
        'VALIDATION_ERROR',
        'BEHAVIOR_EVENT_TIME_INVALID',
        'INVALID_SEARCH_QUERY',
      ]),
      401: errorResponse(errorSchema, 'Yêu cầu access token hợp lệ', [
        'AUTH_REQUIRED',
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: errorResponse(errorSchema, 'Consent hoặc ownership không hợp lệ', [
        'PERSONALIZATION_CONSENT_REQUIRED',
        'BEHAVIOR_EVENT_NOT_OWNED',
        'ACCOUNT_BANNED',
      ]),
      404: errorResponse(errorSchema, 'Recipe target không còn published', [
        'BEHAVIOR_EVENT_INVALID_TARGET',
      ]),
      409: errorResponse(errorSchema, 'Idempotency key conflict', [
        'BEHAVIOR_IDEMPOTENCY_CONFLICT',
      ]),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/users/me/personalization',
    tags: ['Recommendations'],
    summary: 'Đọc personalization consent',
    operationId: 'getPersonalizationPreference',
    security: authenticated,
    responses: {
      200: {
        description: 'Consent hiện tại',
        content: { 'application/json': { schema: preferenceResponse } },
      },
      401: errorResponse(errorSchema, 'Yêu cầu access token hợp lệ', [
        'AUTH_REQUIRED',
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: errorResponse(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
    },
  });
  registry.registerPath({
    method: 'put',
    path: '/api/v1/users/me/personalization',
    tags: ['Recommendations'],
    summary: 'Bật hoặc tắt personalization',
    operationId: 'updatePersonalizationPreference',
    security: authenticated,
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: preferenceRequest,
            example: { enabled: true, consentVersion: 'behavior-personalization-v1' },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Consent đã cập nhật',
        content: { 'application/json': { schema: preferenceResponse } },
      },
      409: errorResponse(errorSchema, 'Consent version không được hỗ trợ', [
        'PERSONALIZATION_CONSENT_VERSION_UNSUPPORTED',
      ]),
      400: errorResponse(errorSchema, 'Payload consent không hợp lệ', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Yêu cầu access token hợp lệ', [
        'AUTH_REQUIRED',
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: errorResponse(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
    },
  });
  registry.registerPath({
    method: 'delete',
    path: '/api/v1/users/me/behavior-history',
    tags: ['Recommendations'],
    summary: 'Xóa toàn bộ behavior history của chính mình',
    operationId: 'deleteBehaviorHistory',
    security: authenticated,
    responses: {
      200: {
        description: 'History đã xóa, consent được giữ nguyên',
        content: { 'application/json': { schema: deleteResponse } },
      },
      401: errorResponse(errorSchema, 'Yêu cầu access token hợp lệ', [
        'AUTH_REQUIRED',
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: errorResponse(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
    },
  });
  registry.registerPath({
    method: 'get',
    path: '/api/v1/recommendations/home',
    tags: ['Recommendations'],
    summary: 'Recommendation home đã áp hard constraints',
    description:
      'Candidate pool gồm tối đa 200 Recipe published mới nhất sau khi hard-filter allergy, explicit exclusion, diet pattern và enabled tradition. behavioral-v1 dùng lookback 30 ngày, half-life 14 ngày, tối đa 2 reason codes. Cold start xếp theo rating/popularity. Tie-break: rating average, rating count, vote count, bookmark count, publishedAt, UUID.',
    operationId: 'getHomeRecommendations',
    security: authenticated,
    request: { query: recommendationQuerySchema },
    responses: {
      200: {
        description: 'Recipe recommendations',
        content: { 'application/json': { schema: recommendations } },
      },
      400: errorResponse(errorSchema, 'Query recommendation không hợp lệ', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Yêu cầu access token hợp lệ', [
        'AUTH_REQUIRED',
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: errorResponse(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
    },
  });
}
