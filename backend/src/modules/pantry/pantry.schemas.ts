import {
  PantryAdjustmentType,
  PantryConfirmationStatus,
  PantryConversionStatus,
  PantryItemSource,
} from '@prisma/client';
import { z } from '../../common/validation/zod.js';
import { dateOnlySchema } from '../profile/profile.schemas.js';

const quantitySchema = z.number().min(0).max(999_999_999);
const positiveQuantitySchema = quantitySchema.refine(
  (value) => value > 0,
  'Quantity must be positive',
);
const idempotencyKeySchema = z.string().trim().min(8).max(160);

const identitySchema = z
  .object({
    ingredientId: z.string().uuid().optional(),
    unmatchedText: z.string().trim().min(1).max(160).optional(),
  })
  .refine((value) => Boolean(value.ingredientId) !== Boolean(value.unmatchedText), {
    message: 'Provide exactly one of ingredientId or unmatchedText',
  });

const dateFields = {
  purchasedAt: dateOnlySchema.nullable().optional(),
  openedAt: dateOnlySchema.nullable().optional(),
  expiresAt: dateOnlySchema.nullable().optional(),
};

export const createPantryItemSchema = z
  .object({
    ...identitySchema.shape,
    quantity: positiveQuantitySchema,
    unit: z.string().trim().min(1).max(40),
    confidence: z.number().min(0).max(1).default(1),
    ...dateFields,
    freshnessNote: z.string().trim().min(1).max(1000).optional(),
    idempotencyKey: idempotencyKeySchema,
  })
  .strict()
  .refine((value) => Boolean(value.ingredientId) !== Boolean(value.unmatchedText), {
    message: 'Provide exactly one of ingredientId or unmatchedText',
  });

export const updatePantryItemSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    confidence: z.number().min(0).max(1).optional(),
    ...dateFields,
    freshnessNote: z.string().trim().min(1).max(1000).nullable().optional(),
  })
  .strict();

export const pantryItemIdParamsSchema = z.object({ id: z.string().uuid() }).strict();

export const pantryListQuerySchema = z
  .object({
    page: z.preprocess((value) => Number(value), z.number().int().min(1)).default(1),
    limit: z.preprocess((value) => Number(value), z.number().int().min(1).max(100)).default(20),
    ingredientId: z.string().uuid().optional(),
    source: z.nativeEnum(PantryItemSource).optional(),
    confirmationStatus: z.nativeEnum(PantryConfirmationStatus).optional(),
    conversionStatus: z.nativeEnum(PantryConversionStatus).optional(),
    search: z.string().trim().min(1).max(160).optional(),
    expiresFrom: dateOnlySchema.optional(),
    expiresTo: dateOnlySchema.optional(),
    includeZero: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .default(false),
  })
  .strict();

export const expiringSoonQuerySchema = z
  .object({
    asOf: dateOnlySchema.optional(),
    days: z.preprocess((value) => Number(value), z.number().int().min(0).max(90)).default(7),
    page: z.preprocess((value) => Number(value), z.number().int().min(1)).default(1),
    limit: z.preprocess((value) => Number(value), z.number().int().min(1).max(100)).default(20),
  })
  .strict();

export const createAdjustmentSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal(PantryAdjustmentType.CONSUME),
      quantity: positiveQuantitySchema,
      unit: z.string().trim().min(1).max(40),
      expectedVersion: z.number().int().positive(),
      idempotencyKey: idempotencyKeySchema,
      reason: z.string().trim().min(1).max(1000).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal(PantryAdjustmentType.RESTORE),
      quantity: positiveQuantitySchema,
      unit: z.string().trim().min(1).max(40),
      expectedVersion: z.number().int().positive(),
      idempotencyKey: idempotencyKeySchema,
      reason: z.string().trim().min(1).max(1000).optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal(PantryAdjustmentType.ADJUST),
      deltaQuantity: z
        .number()
        .min(-999_999_999)
        .max(999_999_999)
        .refine((value) => value !== 0),
      unit: z.string().trim().min(1).max(40),
      expectedVersion: z.number().int().positive(),
      idempotencyKey: idempotencyKeySchema,
      reason: z.string().trim().min(1).max(1000),
    })
    .strict(),
]);

export const adjustmentListQuerySchema = z
  .object({
    page: z.preprocess((value) => Number(value), z.number().int().min(1)).default(1),
    limit: z.preprocess((value) => Number(value), z.number().int().min(1).max(100)).default(20),
  })
  .strict();

export const mergePreviewSchema = z
  .object({ itemIds: z.array(z.string().uuid()).min(2).max(50) })
  .strict()
  .refine((value) => new Set(value.itemIds).size === value.itemIds.length, {
    message: 'Item IDs must be unique',
  });

export const mergePantryItemsSchema = z
  .object({
    targetItemId: z.string().uuid(),
    items: z
      .array(
        z.object({ id: z.string().uuid(), expectedVersion: z.number().int().positive() }).strict(),
      )
      .min(2)
      .max(50),
    idempotencyKey: idempotencyKeySchema,
  })
  .strict()
  .refine((value) => value.items.some((item) => item.id === value.targetItemId), {
    message: 'targetItemId must be included in items',
  })
  .refine((value) => new Set(value.items.map((item) => item.id)).size === value.items.length, {
    message: 'Item IDs must be unique',
  });

export const deletePantryItemQuerySchema = z
  .object({ expectedVersion: z.preprocess((value) => Number(value), z.number().int().positive()) })
  .strict();

const conversionSchema = z.object({
  status: z.nativeEnum(PantryConversionStatus),
  normalizedGrams: z.number().nullable(),
  source: z.string().nullable(),
  version: z.string().nullable(),
  confidence: z.number().nullable(),
});

export const pantryItemResponseSchema = z.object({
  id: z.string().uuid(),
  ingredient: z.object({ id: z.string().uuid(), name: z.string() }).nullable(),
  unmatchedText: z.string().nullable(),
  quantity: z.number(),
  unit: z.string(),
  conversion: conversionSchema,
  source: z.nativeEnum(PantryItemSource),
  confidence: z.number(),
  confirmationStatus: z.nativeEnum(PantryConfirmationStatus),
  purchasedAt: z.string().nullable(),
  openedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  freshnessNote: z.string().nullable(),
  version: z.number().int().positive(),
});

export const pantryAdjustmentResponseSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(PantryAdjustmentType),
  input: z.object({ quantity: z.number(), unit: z.string() }),
  appliedDelta: z.object({ quantity: z.number(), normalizedGrams: z.number().nullable() }),
  balance: z.object({
    beforeQuantity: z.number(),
    afterQuantity: z.number(),
    beforeGrams: z.number().nullable(),
    afterGrams: z.number().nullable(),
  }),
  versionBefore: z.number().int().nonnegative(),
  versionAfter: z.number().int().positive(),
  reason: z.string().nullable(),
  mergedFromItemId: z.string().uuid().nullable(),
  createdAt: z.string(),
});

export const pantryItemEnvelopeSchema = z.object({
  success: z.literal(true),
  data: pantryItemResponseSchema,
});
export const pantryListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.array(pantryItemResponseSchema),
  meta: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});
export const pantryAdjustmentEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.object({ item: pantryItemResponseSchema, adjustment: pantryAdjustmentResponseSchema }),
});
export const pantryAdjustmentListEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.array(pantryAdjustmentResponseSchema),
  meta: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int(),
    totalPages: z.number().int(),
  }),
});
export const mergePreviewEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.object({
    canMerge: z.boolean(),
    identity: z.object({ ingredientId: z.string().uuid().nullable(), label: z.string() }),
    targetItemId: z.string().uuid(),
    itemCount: z.number().int(),
    result: z.object({
      quantity: z.number(),
      unit: z.string(),
      normalizedGrams: z.number().nullable(),
      conversionStatus: z.nativeEnum(PantryConversionStatus),
    }),
    warnings: z.array(z.string()),
  }),
});

export type CreatePantryItemInput = z.infer<typeof createPantryItemSchema>;
export type UpdatePantryItemInput = z.infer<typeof updatePantryItemSchema>;
export type PantryListQuery = z.infer<typeof pantryListQuerySchema>;
export type ExpiringSoonQuery = z.infer<typeof expiringSoonQuerySchema>;
export type CreateAdjustmentInput = z.infer<typeof createAdjustmentSchema>;
export type AdjustmentListQuery = z.infer<typeof adjustmentListQuerySchema>;
export type MergePreviewInput = z.infer<typeof mergePreviewSchema>;
export type MergePantryItemsInput = z.infer<typeof mergePantryItemsSchema>;
