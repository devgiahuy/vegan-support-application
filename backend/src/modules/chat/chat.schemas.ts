import { ChatFeedbackValue, ChatMessageRole, ChatMessageStatus } from '@prisma/client';
import { z } from '../../common/validation/zod.js';
import { topicCodeSchema } from '../recommendations/recommendation.schemas.js';

export const CHAT_DISCLAIMER =
  'Thông tin chỉ mang tính tham khảo, không thay thế tư vấn từ chuyên gia dinh dưỡng hoặc bác sĩ.';

export const createChatSessionRequestSchema = z
  .object({ title: z.string().trim().min(1).max(160).optional() })
  .strict();

export const chatSessionParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const chatMessageParamsSchema = z.object({ id: z.string().uuid() }).strict();

export const chatListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export const chatMessageListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

export const sendChatMessageRequestSchema = z
  .object({
    content: z.string().trim().min(1).max(2_000),
    idempotencyKey: z.string().trim().min(8).max(120),
  })
  .strict();

export const chatFeedbackRequestSchema = z
  .object({
    value: z.enum(ChatFeedbackValue),
    reason: z.string().trim().min(1).max(500).optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.value === ChatFeedbackValue.DOWN && !value.reason) {
      context.addIssue({
        code: 'custom',
        path: ['reason'],
        message: 'Cần nhập lý do khi đánh giá DOWN',
      });
    }
  });

const chatSessionSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    ownerType: z.enum(['AUTHENTICATED', 'GUEST']),
    expiresAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

const chatFeedbackSchema = z
  .object({
    value: z.enum(ChatFeedbackValue),
    reason: z.string().nullable(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export const chatMessageSchema = z
  .object({
    id: z.string().uuid(),
    sessionId: z.string().uuid(),
    role: z.enum(ChatMessageRole),
    status: z.enum(ChatMessageStatus),
    content: z.string(),
    provider: z.string().nullable(),
    modelId: z.string().nullable(),
    fallback: z.boolean(),
    topicCodes: z.array(topicCodeSchema),
    disclaimer: z.string().nullable(),
    feedback: chatFeedbackSchema.nullable(),
    completedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
  })
  .strict();

const quotaSchema = z
  .object({
    limit: z.number().int().positive(),
    used: z.number().int().nonnegative(),
    remaining: z.number().int().nonnegative(),
    resetAt: z.string().datetime(),
  })
  .strict();

const itemResponse = <T extends z.ZodType>(data: T) =>
  z.object({ success: z.literal(true), data, meta: z.null() }).strict();

export const chatSessionResponseSchema = itemResponse(chatSessionSchema);
export const chatSessionListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(chatSessionSchema),
    meta: z
      .object({
        page: z.number().int().positive(),
        limit: z.number().int().positive(),
        total: z.number().int().nonnegative(),
        totalPages: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export const chatMessageListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(chatMessageSchema),
    meta: z
      .object({
        page: z.number().int().positive(),
        limit: z.number().int().positive(),
        total: z.number().int().nonnegative(),
        totalPages: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export const chatFeedbackResponseSchema = itemResponse(
  z
    .object({
      messageId: z.string().uuid(),
      value: z.enum(ChatFeedbackValue),
      reason: z.string().nullable(),
      updatedAt: z.string().datetime(),
    })
    .strict(),
);

export const chatSseEventSchema = z.discriminatedUnion('event', [
  z
    .object({
      event: z.literal('message_start'),
      data: z
        .object({
          requestMessageId: z.string().uuid(),
          assistantMessageId: z.string().uuid(),
          replayed: z.boolean(),
        })
        .strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('content_delta'),
      data: z.object({ delta: z.string().min(1) }).strict(),
    })
    .strict(),
  z
    .object({
      event: z.literal('message_complete'),
      data: z.object({ message: chatMessageSchema, quota: quotaSchema }).strict(),
    })
    .strict(),
  z.object({ event: z.literal('quota'), data: quotaSchema }).strict(),
  z
    .object({
      event: z.literal('error'),
      data: z
        .object({
          code: z.string(),
          message: z.string(),
          retryable: z.boolean(),
          partial: z.boolean(),
        })
        .strict(),
    })
    .strict(),
]);

export type CreateChatSessionInput = z.infer<typeof createChatSessionRequestSchema>;
export type ChatListQuery = z.infer<typeof chatListQuerySchema>;
export type ChatMessageListQuery = z.infer<typeof chatMessageListQuerySchema>;
export type ChatSessionParams = z.infer<typeof chatSessionParamsSchema>;
export type ChatMessageParams = z.infer<typeof chatMessageParamsSchema>;
export type SendChatMessageInput = z.infer<typeof sendChatMessageRequestSchema>;
export type ChatFeedbackInput = z.infer<typeof chatFeedbackRequestSchema>;
export type ChatSseEvent = z.infer<typeof chatSseEventSchema>;
