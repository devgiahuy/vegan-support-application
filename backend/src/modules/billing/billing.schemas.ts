import { z } from '../../common/validation/zod.js';

const benefits = {
  chatCredits: z.number().int().nonnegative(),
  fridgeCredits: z.number().int().nonnegative(),
  receiptCredits: z.number().int().nonnegative(),
  pantrySlots: z.number().int().nonnegative(),
};
export const createBillingOrderSchema = z
  .object({
    productId: z.string().trim().min(1).max(80),
    idempotencyKey: z.string().trim().min(8).max(160),
  })
  .strict();
export const billingIdSchema = z.object({ id: z.string().uuid() }).strict();
export const billingListQuerySchema = z
  .object({ page: z.coerce.number().int().min(1).max(10000).default(1) })
  .strict();
export const sandboxQuerySchema = z
  .object({ token: z.string().regex(/^[a-f0-9]{128}$/i) })
  .strict();
export const sandboxBodySchema = z
  .object({
    token: z.string().regex(/^[a-f0-9]{128}$/i),
    outcome: z.enum(['PAID', 'CANCELLED', 'FAILED']),
  })
  .strict();
export const billingProductSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    version: z.number().int().positive(),
    priceVnd: z.number().int().positive(),
    ...benefits,
  })
  .strict();
export const billingCatalogSchema = z
  .object({
    enabled: z.boolean(),
    provider: z.enum(['sandbox', 'vnpay']),
    simulated: z.boolean(),
    products: z.array(billingProductSchema),
  })
  .strict();
export const billingOrderSchema = z
  .object({
    id: z.string().uuid(),
    productId: z.string(),
    productName: z.string(),
    priceVnd: z.number().int().positive(),
    ...benefits,
    provider: z.enum(['sandbox', 'vnpay']),
    simulated: z.boolean(),
    status: z.enum(['PENDING', 'PAID', 'CANCELLED', 'FAILED', 'EXPIRED']),
    checkoutUrl: z.string().url().nullable(),
    createdAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    paidAt: z.string().datetime().nullable(),
  })
  .strict();
export const billingOrdersSchema = z
  .object({
    items: z.array(billingOrderSchema),
    page: z.number().int(),
    totalPages: z.number().int(),
    total: z.number().int(),
  })
  .strict();
export const entitlementSchema = z
  .object({
    enabled: z.boolean(),
    provider: z.enum(['sandbox', 'vnpay']),
    simulated: z.boolean(),
    ...benefits,
    chatReserved: z.number().int().nonnegative(),
    fridgeReserved: z.number().int().nonnegative(),
    receiptReserved: z.number().int().nonnegative(),
    pantryUsed: z.number().int().nonnegative(),
    pantryLimit: z.number().int().positive().nullable(),
    fridgeMaxImages: z.number().int().positive(),
    receiptMaxImages: z.number().int().positive(),
    scanMaxAttempts: z.number().int().positive(),
    ledger: z.array(
      z
        .object({
          id: z.string(),
          feature: z.enum(['CHAT', 'FRIDGE', 'RECEIPT', 'PANTRY']),
          delta: z.number().int(),
          reason: z.string(),
          createdAt: z.string().datetime(),
        })
        .strict(),
    ),
  })
  .strict();
export const billingEnvelope = <T extends z.ZodType>(data: T) =>
  z.object({ success: z.literal(true), data }).strict();
