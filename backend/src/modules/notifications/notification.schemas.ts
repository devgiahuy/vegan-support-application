import { z } from '../../common/validation/zod.js';

export const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  unreadOnly: z.enum(['true', 'false']).default('false'),
}).strict();

export const notificationIdParamsSchema = z.object({ id: z.string().uuid() }).strict();

export const notificationItemSchema = z.object({
  id: z.string().uuid(),
  type: z.enum([
    'POST_APPROVED', 'POST_REJECTED', 'VIDEO_APPROVED', 'VIDEO_REJECTED',
    'CONTRIBUTOR_APPROVED', 'CONTRIBUTOR_REJECTED', 'CONTRIBUTOR_REVOKED',
    'REPORT_RESOLVED', 'MODERATION_OUTCOME', 'STORAGE_QUOTA_WARNING', 'AI_VERIFICATION_CREATED',
    'AI_VERIFICATION_CHANGED', 'RESTAURANT_APPROVED', 'RESTAURANT_REJECTED',
  ]),
  title: z.string(),
  summary: z.string().nullable(),
  link: z.string().nullable(),
  payloadVersion: z.literal(1),
  payload: z.union([
    z.object({ sourceId: z.string().uuid() }).strict(),
    z.object({ thresholdPercent: z.number().int() }).strict(),
  ]),
  read: z.boolean(),
  readAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  expiresAt: z.iso.datetime(),
});

export const notificationListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.array(notificationItemSchema),
  meta: z.object({ page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number() }),
});
export const unreadCountEnvelopeSchema = z.object({ success: z.literal(true), data: z.object({ count: z.number() }) });
export const markReadEnvelopeSchema = z.object({ success: z.literal(true), data: z.object({ id: z.string().uuid(), read: z.literal(true) }) });
export const markAllReadEnvelopeSchema = z.object({ success: z.literal(true), data: z.object({ updatedCount: z.number() }) });

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
