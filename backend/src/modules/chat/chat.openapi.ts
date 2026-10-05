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
      'Signed HttpOnly guest identity do backend c?p; client kh�ng du?c t? t?o ho?c g?i guestId trong payload.',
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
        'SSE events: message_start, content_delta, message_complete, quota, error. data l� JSON theo event type; ch? cache assistant message sau message_complete.',
      example:
        'event: message_start\ndata: {"requestMessageId":"0781d468-5eb1-4bd0-9671-e4ca33b76462","assistantMessageId":"1781d468-5eb1-4bd0-9671-e4ca33b76462","replayed":false}\n\nevent: content_delta\ndata: {"delta":"�?u hu l� m?t ngu?n d?m..."}\n\nevent: message_complete\ndata: {"message":{"id":"1781d468-5eb1-4bd0-9671-e4ca33b76462"},"quota":{"limit":20,"used":1,"remaining":19,"resetAt":"2026-09-16T17:00:00.000Z"}}\n\n',
    }),
  );

  registry.registerPath({
    method: 'post',
    path: '/api/v1/chat/sessions',
    tags: ['AI Chat'],
    summary: 'T?o private chat session cho authenticated user ho?c guest',
    description:
      'Guest nh?n signed HttpOnly chatGuest cookie v� session h?t h?n sau 7 ng�y. Authenticated session kh�ng h?t h?n t? d?ng v� lu�n private.',
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
        description: 'Private chat session d� t?o',
        content: { 'application/json': { schema: sessionResponse } },
      },
      400: errorResponse(errorSchema, 'Payload session kh�ng h?p l?', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Access token du?c g?i nhung kh�ng h?p l?', [
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: errorResponse(errorSchema, 'T�i kho?n b? c?m', ['ACCOUNT_BANNED']),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/chat/sessions',
    tags: ['AI Chat'],
    summary: 'List private chat sessions c?a authenticated user',
    operationId: 'listChatSessions',
    security: authenticated,
    request: { query: chatListQuerySchema },
    responses: {
      200: {
        description: 'Session summaries ph�n trang',
        content: { 'application/json': { schema: sessionListResponse } },
      },
      400: errorResponse(errorSchema, 'Pagination kh�ng h?p l?', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Y�u c?u dang nh?p', [
        'AUTH_REQUIRED',
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: errorResponse(errorSchema, 'T�i kho?n b? c?m', ['ACCOUNT_BANNED']),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/v1/chat/sessions/{id}/messages',
    tags: ['AI Chat'],
    summary: '�?c message history theo ownership',
    operationId: 'listChatMessages',
    security: guestOrAuthenticated,
    request: { params: chatSessionParamsSchema, query: chatMessageListQuerySchema },
    responses: {
      200: {
        description: 'Message history private; assistant message lu�n tr? fixed disclaimer',
        content: { 'application/json': { schema: messageListResponse } },
      },
      400: errorResponse(errorSchema, 'ID ho?c pagination kh�ng h?p l?', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Access token du?c g?i nhung kh�ng h?p l?', [
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: errorResponse(errorSchema, 'T�i kho?n b? c?m', ['ACCOUNT_BANNED']),
      404: errorResponse(errorSchema, 'Session kh�ng t?n t?i ho?c kh�ng thu?c identity', [
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
      'OpenAI Responses API du?c b?c sau internal SSE contract. Quota ch? consume sau provider completion; fallback, validation, moderation block, timeout, abort v� partial error kh�ng consume. Khi moderation provider b? t?t ho?c kh�ng kh? d?ng, generated answer b? gi? l?i v� tr? static unavailable advisory v?i fallback=true. Reset 00:00 Asia/Ho_Chi_Minh. Retry c�ng idempotencyKey replay completed response ho?c ti?p t?c an to�n m� kh�ng tr? quota hai l?n.',
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
          'SSE stream. error event c� th? xu?t hi?n sau HTTP 200; message ch? ho�n ch?nh khi nh?n message_complete.',
        content: { 'text/event-stream': { schema: sseStream } },
      },
      400: errorResponse(errorSchema, 'Payload message kh�ng h?p l?', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Access token du?c g?i nhung kh�ng h?p l?', [
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: errorResponse(errorSchema, 'T�i kho?n b? c?m', ['ACCOUNT_BANNED']),
      404: errorResponse(errorSchema, 'Session kh�ng t?n t?i ho?c kh�ng thu?c identity', [
        'NOT_FOUND',
      ]),
      409: errorResponse(errorSchema, 'Idempotency ho?c concurrent request conflict', [
        'CHAT_IDEMPOTENCY_CONFLICT',
        'CHAT_REQUEST_IN_PROGRESS',
      ]),
      429: errorResponse(errorSchema, 'Daily quota ho?c guest network rate limit', [
        'AI_QUOTA_EXCEEDED',
        'AI_RATE_LIMITED',
      ]),
      503: errorResponse(errorSchema, 'Chatbot b? t?t b?ng configuration', ['AI_FEATURE_DISABLED']),
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
        description: 'Feedback upserted; DOWN b?t bu?c c� reason',
        content: { 'application/json': { schema: feedbackResponse } },
      },
      400: errorResponse(errorSchema, 'Feedback kh�ng h?p l?', ['VALIDATION_ERROR']),
      401: errorResponse(errorSchema, 'Access token du?c g?i nhung kh�ng h?p l?', [
        'INVALID_ACCESS_TOKEN',
        'TOKEN_EXPIRED',
      ]),
      403: errorResponse(errorSchema, 'T�i kho?n b? c?m', ['ACCOUNT_BANNED']),
      404: errorResponse(errorSchema, 'Message kh�ng t?n t?i ho?c kh�ng thu?c identity', [
        'NOT_FOUND',
      ]),
    },
  });
}
