import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import type { ZodType } from 'zod';
import { z } from '../../common/validation/zod.js';
import {
  chatFeedbackRequestSchema,
  chatFeedbackResponseSchema,
  chatListQuerySchema,
  chatMessageListQuerySchema,
  chatMessageListResponseSchema,
  chatMessageParamsSchema,
  chatSessionListResponseSchema,
  chatSessionParamsSchema,
  chatSessionResponseSchema,
  createChatSessionRequestSchema,
  sendChatMessageRequestSchema,
} from './chat.schemas.js';

const authenticated = [{ BearerAuth: [] }, { AccessTokenCookie: [] }];
const guestOrAuthenticated = [
  { BearerAuth: [] },
  { AccessTokenCookie: [] },
  { ChatGuestCookie: [] },
  {},
];

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

export function registerChatOpenApi(registry: OpenAPIRegistry, errorSchema: ZodType): void {
  registry.registerComponent('securitySchemes', 'ChatGuestCookie', {
    type: 'apiKey',
    in: 'cookie',
    name: 'chatGuest',
    description:
      'Signed HttpOnly guest identity do backend cấp; client không được tự tạo hoặc gửi guestId trong payload.',
  });
  const createRequest = registry.register(
    'CreateChatSessionRequest',
    createChatSessionRequestSchema,
  );
  const sendRequest = registry.register('SendChatMessageRequest', sendChatMessageRequestSchema);
  const feedbackRequest = registry.register('ChatFeedbackRequest', chatFeedbackRequestSchema);
  const sessionResponse = registry.register('ChatSessionResponse', chatSessionResponseSchema);
  const sessionListResponse = registry.register(
    'ChatSessionListResponse',
    chatSessionListResponseSchema,
  );
  const messageListResponse = registry.register(
    'ChatMessageListResponse',
    chatMessageListResponseSchema,
  );
  const feedbackResponse = registry.register('ChatFeedbackResponse', chatFeedbackResponseSchema);
  const sseStream = registry.register(
    'ChatSseStream',
    z.string().openapi({
      description:
        'SSE events: message_start, content_delta, message_complete, quota, error. data là JSON theo event type; chỉ cache assistant message sau message_complete.',
      example:
        'event: message_start\ndata: {"requestMessageId":"0781d468-5eb1-4bd0-9671-e4ca33b76462","assistantMessageId":"1781d468-5eb1-4bd0-9671-e4ca33b76462","replayed":false}\n\nevent: content_delta\ndata: {"delta":"Đậu hũ là một nguồn đạm..."}\n\nevent: message_complete\ndata: {"message":{"id":"1781d468-5eb1-4bd0-9671-e4ca33b76462"},"quota":{"limit":20,"used":1,"remaining":19,"resetAt":"2026-09-16T17:00:00.000Z"}}\n\n',
    }),
  );

  registry.registerPath({
    method: 'post',
    path: '/api/v1/chat/sessions',
    tags: ['AI Chat'],
    summary: 'Tạo private chat session cho authenticated user hoặc guest',
    description:
      'Guest nhận signed HttpOnly chatGuest cookie và session hết hạn sau 7 ngày. Authenticated session không hết hạn tự động và luôn private.',
    operationId: 'createChatSession',
    security: guestOrAuthenticated,
    request: {
      body: {
        required: true,
        content: { 'application/json': { schema: createRequest } },
      },
    },
    responses: {
      201: {
        description: 'Private chat session đã tạo',
        content: { 'application/json': { schema: sessionResponse } },
      },
      400: errorResponse(errorSchema, 'Payload session không hợp lệ', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Access token được gửi nhưng không hợp lệ', [
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: errorResponse(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/chat/sessions',
    tags: ['AI Chat'],
    summary: 'List private chat sessions của authenticated user',
    operationId: 'listChatSessions',
    security: authenticated,
    request: { query: chatListQuerySchema },
    responses: {
      200: {
        description: 'Session summaries phân trang',
        content: { 'application/json': { schema: sessionListResponse } },
      },
      400: errorResponse(errorSchema, 'Pagination không hợp lệ', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Yêu cầu đăng nhập', [
        'AUTH_REQUIRED',
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: errorResponse(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/chat/sessions/{id}/messages',
    tags: ['AI Chat'],
    summary: 'Đọc message history theo ownership',
    operationId: 'listChatMessages',
    security: guestOrAuthenticated,
    request: { params: chatSessionParamsSchema, query: chatMessageListQuerySchema },
    responses: {
      200: {
        description: 'Message history private; assistant message luôn trả fixed disclaimer',
        content: { 'application/json': { schema: messageListResponse } },
      },
      400: errorResponse(errorSchema, 'ID hoặc pagination không hợp lệ', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Access token được gửi nhưng không hợp lệ', [
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: errorResponse(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
      404: errorResponse(errorSchema, 'Session không tồn tại hoặc không thuộc identity', [
        'NOT_FOUND',
      ]),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/chat/sessions/{id}/messages',
    tags: ['AI Chat'],
    summary: 'Stream nutrition answer qua SSE',
    description:
      'OpenAI Responses API được bọc sau internal SSE contract. Quota chỉ consume sau provider completion; fallback, validation, moderation block, timeout, abort và partial error không consume. Reset 00:00 Asia/Ho_Chi_Minh. Retry cùng idempotencyKey replay completed response hoặc tiếp tục an toàn mà không trừ quota hai lần.',
    operationId: 'streamChatMessage',
    security: guestOrAuthenticated,
    request: {
      params: chatSessionParamsSchema,
      body: {
        required: true,
        content: { 'application/json': { schema: sendRequest } },
      },
    },
    responses: {
      200: {
        description:
          'SSE stream. error event có thể xuất hiện sau HTTP 200; message chỉ hoàn chỉnh khi nhận message_complete.',
        content: { 'text/event-stream': { schema: sseStream } },
      },
      400: errorResponse(errorSchema, 'Payload message không hợp lệ', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Access token được gửi nhưng không hợp lệ', [
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: errorResponse(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
      404: errorResponse(errorSchema, 'Session không tồn tại hoặc không thuộc identity', [
        'NOT_FOUND',
      ]),
      409: errorResponse(errorSchema, 'Idempotency hoặc concurrent request conflict', [
        'CHAT_IDEMPOTENCY_CONFLICT',
        'CHAT_REQUEST_IN_PROGRESS',
      ]),
      429: errorResponse(errorSchema, 'Daily quota hoặc guest network rate limit', [
        'AI_QUOTA_EXCEEDED',
        'AI_RATE_LIMITED',
      ]),
      503: errorResponse(errorSchema, 'Chatbot bị tắt bằng configuration', ['AI_FEATURE_DISABLED']),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/v1/chat/messages/{id}/feedback',
    tags: ['AI Chat'],
    summary: 'Upsert feedback cho owned assistant message',
    operationId: 'upsertChatFeedback',
    security: guestOrAuthenticated,
    request: {
      params: chatMessageParamsSchema,
      body: {
        required: true,
        content: { 'application/json': { schema: feedbackRequest } },
      },
    },
    responses: {
      200: {
        description: 'Feedback upserted; DOWN bắt buộc có reason',
        content: { 'application/json': { schema: feedbackResponse } },
      },
      400: errorResponse(errorSchema, 'Feedback không hợp lệ', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Access token được gửi nhưng không hợp lệ', [
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: errorResponse(errorSchema, 'Tài khoản bị cấm', ['ACCOUNT_BANNED']),
      404: errorResponse(errorSchema, 'Message không tồn tại hoặc không thuộc identity', [
        'NOT_FOUND',
      ]),
    },
  });
}
