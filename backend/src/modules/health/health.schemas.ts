import { z } from '../../common/validation/zod.js';

export const healthResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        status: z.literal('ok'),
        database: z.object({ status: z.literal('up') }).strict(),
        environment: z.enum(['development', 'test', 'production']),
        timestamp: z.string().datetime(),
        uptimeSeconds: z.number().nonnegative(),
        requestId: z.string().min(1),
      })
      .strict(),
    meta: z.null(),
  })
  .strict();

export const healthUnavailableResponseSchema = z
  .object({
    success: z.literal(false),
    error: z
      .object({
        code: z.literal('DATABASE_UNAVAILABLE'),
        message: z.string().min(1),
        fields: z.object({ database: z.array(z.literal('down')).length(1) }).strict(),
        requestId: z.string().min(1),
      })
      .strict(),
  })
  .strict();
