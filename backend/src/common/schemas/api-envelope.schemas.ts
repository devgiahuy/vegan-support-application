import { z } from '../validation/zod.js';

export const errorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z
      .object({
        code: z.string().min(1),
        message: z.string().min(1),
        fields: z.record(z.string(), z.array(z.string())).optional(),
        requestId: z.string().min(1),
      })
      .strict(),
  })
  .strict();
