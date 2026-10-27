import { z } from '../../common/validation/zod.js';

export const revenueGranularitySchema = z.enum(['day', 'week', 'month']);
export const revenueQuerySchema = z
  .object({
    from: z.iso.datetime().optional(),
    to: z.iso.datetime().optional(),
    granularity: revenueGranularitySchema.default('day'),
  })
  .strict();

export const usageFeatureSchema = z.enum(['CHAT', 'FRIDGE', 'RECEIPT']);
export const usageOutcomeSchema = z.enum(['HELD', 'SPENT', 'RELEASED']);
export const usageQuotaSourceSchema = z.enum([
  'FREE_DAILY',
  'SUBSCRIPTION',
  'CREDITS',
  'NONE',
  'UNKNOWN',
]);
export const usageQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).max(10000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    feature: usageFeatureSchema.optional(),
    outcome: usageOutcomeSchema.optional(),
    user: z.string().trim().min(1).max(120).optional(),
    from: z.iso.datetime().optional(),
    to: z.iso.datetime().optional(),
  })
  .strict();

const orderStatusSchema = z.enum(['PENDING', 'PAID', 'CANCELLED', 'FAILED', 'EXPIRED']);
export const revenueStatsSchema = z
  .object({
    window: z
      .object({
        from: z.iso.datetime(),
        to: z.iso.datetime(),
        granularity: revenueGranularitySchema,
        timezone: z.literal('Asia/Ho_Chi_Minh'),
      })
      .strict(),
    currency: z.literal('VND'),
    overview: z
      .object({
        revenueVnd: z.number().int().nonnegative(),
        paidOrders: z.number().int().nonnegative(),
        buyers: z.number().int().nonnegative(),
        averageOrderVnd: z.number().int().nonnegative().nullable(),
      })
      .strict()
      .describe('PAID orders by paidAt within the window; simulated sandbox orders excluded'),
    series: z
      .array(
        z
          .object({
            bucketStart: z.iso.datetime(),
            revenueVnd: z.number().int().nonnegative(),
            paidOrders: z.number().int().nonnegative(),
          })
          .strict(),
      )
      .describe('Contiguous buckets in Asia/Ho_Chi_Minh; weeks start Monday; empty buckets are 0'),
    statuses: z
      .object({
        total: z.number().int().nonnegative(),
        counts: z.array(
          z.object({ status: orderStatusSchema, count: z.number().int().nonnegative() }).strict(),
        ),
        successRate: z.number().min(0).max(1).nullable(),
      })
      .strict()
      .describe('Orders by createdAt within the window; elapsed PENDING orders count as EXPIRED'),
  })
  .strict();

export const usageTraceItemSchema = z
  .object({
    id: z.string(),
    feature: usageFeatureSchema,
    occurredAt: z.iso.datetime(),
    user: z
      .object({ id: z.string().uuid(), displayName: z.string(), email: z.string() })
      .strict()
      .nullable(),
    quotaSource: usageQuotaSourceSchema,
    quotaCharged: z
      .number()
      .int()
      .nonnegative()
      .describe('Paid allowance units held or spent; free daily chat and released usage are 0'),
    outcome: usageOutcomeSchema,
    aiStatus: z.string().nullable(),
    provider: z.string().nullable(),
    modelId: z.string().nullable(),
    inputTokens: z.number().int().nullable(),
    outputTokens: z.number().int().nullable(),
    latencyMs: z.number().int().nullable(),
    errorCode: z.string().nullable(),
  })
  .strict();
export const usageTracePageSchema = z
  .object({
    success: z.literal(true),
    data: z.array(usageTraceItemSchema),
    meta: z
      .object({
        page: z.number().int(),
        limit: z.number().int(),
        total: z.number().int(),
        totalPages: z.number().int(),
      })
      .strict(),
  })
  .strict();
export const revenueStatsEnvelopeSchema = z
  .object({ success: z.literal(true), data: revenueStatsSchema })
  .strict();

export type RevenueQuery = z.infer<typeof revenueQuerySchema>;
export type UsageQuery = z.infer<typeof usageQuerySchema>;
export type UsageTraceItem = z.infer<typeof usageTraceItemSchema>;
export type RevenueGranularity = z.infer<typeof revenueGranularitySchema>;
