import { PantryItemSource, ReceiptCandidateStatus, ReceiptJobStatus } from '@prisma/client';
import { z } from '../../common/validation/zod.js';

const idempotencyKeySchema = z.string().trim().min(8).max(160);
const currencySchema = z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/);

export const createReceiptJobSchema = z
  .object({
    imageAssetIds: z.array(z.string().uuid()).min(1).max(8),
    idempotencyKey: idempotencyKeySchema,
  })
  .strict()
  .refine((input) => new Set(input.imageAssetIds).size === input.imageAssetIds.length, {
    message: 'Image asset IDs must be unique',
    path: ['imageAssetIds'],
  });

export const receiptJobParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const receiptCandidateParamsSchema = z
  .object({ id: z.string().uuid(), candidateId: z.string().uuid() })
  .strict();

export const updateReceiptCandidateSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    ingredientId: z.string().uuid().nullable().optional(),
    detectedName: z.string().trim().min(1).max(160).optional(),
    lineText: z.string().trim().min(1).max(300).optional(),
    quantity: z.number().positive().max(999_999_999).nullable().optional(),
    unit: z.string().trim().min(1).max(40).nullable().optional(),
    unitPrice: z.number().nonnegative().max(999_999_999_999).nullable().optional(),
    lineTotal: z.number().nonnegative().max(999_999_999_999).nullable().optional(),
    currency: currencySchema.nullable().optional(),
    confidence: z.number().min(0).max(1).optional(),
    uncertaintyNote: z.string().trim().min(1).max(500).nullable().optional(),
    decision: z.enum(['KEEP', 'REJECT']).optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).some((key) => key !== 'expectedVersion'), {
    message: 'Provide at least one candidate change',
  });

export const confirmReceiptJobSchema = z
  .object({
    candidates: z
      .array(
        z
          .object({ id: z.string().uuid(), expectedVersion: z.number().int().positive() })
          .strict(),
      )
      .min(1)
      .max(200),
    idempotencyKey: idempotencyKeySchema,
  })
  .strict()
  .refine((input) => new Set(input.candidates.map((item) => item.id)).size === input.candidates.length, {
    message: 'Candidate IDs must be unique',
    path: ['candidates'],
  });

export const retryReceiptJobSchema = z.object({ idempotencyKey: idempotencyKeySchema }).strict();

const selectedMealSchema = z.discriminatedUnion('sourceType', [
  z
    .object({
      sourceType: z.literal('RECIPE'),
      recipeId: z.string().uuid(),
      servings: z.number().positive().max(100),
    })
    .strict(),
  z
    .object({
      sourceType: z.literal('CUSTOM_MEAL'),
      customMealId: z.string().uuid(),
      servings: z.number().positive().max(100),
    })
    .strict(),
]);

export const shoppingGapPreviewSchema = z
  .object({ meals: z.array(selectedMealSchema).min(1).max(50) })
  .strict();

const receiptImageSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int().nonnegative(),
  url: z.string().url(),
  status: z.enum(['PENDING', 'PROCESSED', 'FAILED']),
  issue: z.string().nullable(),
});

const receiptCandidateSchema = z.object({
  id: z.string().uuid(),
  imageId: z.string().uuid(),
  lineText: z.string(),
  name: z.string(),
  ingredientSuggestion: z
    .object({ id: z.string().uuid(), name: z.string(), confidence: z.number().min(0).max(1) })
    .nullable(),
  quantity: z.object({ value: z.number().positive().nullable(), unit: z.string().nullable() }),
  pricing: z.object({
    unitPrice: z.number().nonnegative().nullable(),
    lineTotal: z.number().nonnegative().nullable(),
    currency: z.string().nullable(),
  }),
  confidence: z.number().min(0).max(1),
  uncertaintyNote: z.string().nullable(),
  status: z.nativeEnum(ReceiptCandidateStatus),
  version: z.number().int().positive(),
});

export const receiptJobResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.nativeEnum(ReceiptJobStatus),
  progress: z.object({ completedImages: z.number().int(), totalImages: z.number().int() }),
  receipt: z.object({
    merchantName: z.string().nullable(),
    purchasedAt: z.string().nullable(),
    currency: z.string().nullable(),
    totalAmount: z.number().nullable(),
    confidence: z.number().nullable(),
  }),
  images: z.array(receiptImageSchema),
  candidates: z.array(receiptCandidateSchema),
  attempt: z.number().int().nonnegative(),
  issue: z.object({ code: z.string(), message: z.string() }).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  confirmedAt: z.string().datetime().nullable(),
});

export const receiptJobEnvelopeSchema = z.object({
  success: z.literal(true),
  data: receiptJobResponseSchema,
});

export const receiptConfirmationEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.object({
    job: receiptJobResponseSchema,
    pantryChanges: z.array(
      z.object({
        candidateId: z.string().uuid(),
        action: z.enum(['CREATED', 'UPDATED']),
        pantryItem: z.object({
          id: z.string().uuid(),
          ingredient: z.object({ id: z.string().uuid(), name: z.string() }).nullable(),
          unmatchedText: z.string().nullable(),
          quantity: z.number(),
          unit: z.string(),
          source: z.nativeEnum(PantryItemSource),
          confidence: z.number(),
          confirmationStatus: z.literal('CONFIRMED'),
          purchasedAt: z.string().nullable(),
          version: z.number().int().positive(),
        }),
      }),
    ),
  }),
});

const amountSchema = z.object({ value: z.number().nonnegative(), unit: z.string() });
const sourceMealSchema = z.object({
  sourceType: z.enum(['RECIPE', 'CUSTOM_MEAL']),
  id: z.string().uuid(),
  name: z.string(),
  servings: z.number().positive(),
});

export const shoppingGapEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(
      z.object({
        ingredient: z.object({ id: z.string().uuid(), name: z.string() }),
        required: amountSchema,
        available: amountSchema,
        missing: amountSchema,
        surplus: amountSchema,
        confidence: z.number().min(0).max(1),
        conversionAssumptions: z.array(z.string()),
        sourceMeals: z.array(sourceMealSchema),
      }),
    ),
    unresolvedItems: z.array(
      z.object({
        name: z.string(),
        required: amountSchema,
        reasonCode: z.enum(['INGREDIENT_UNRESOLVED', 'REVIEWED_CONVERSION_UNAVAILABLE']),
        explanation: z.string(),
        sourceMeals: z.array(sourceMealSchema),
      }),
    ),
    summary: z.object({
      selectedMealCount: z.number().int(),
      readyItemCount: z.number().int(),
      missingItemCount: z.number().int(),
      unresolvedItemCount: z.number().int(),
    }),
    pantryAsOf: z.string().datetime(),
  }),
});

export type CreateReceiptJobInput = z.infer<typeof createReceiptJobSchema>;
export type UpdateReceiptCandidateInput = z.infer<typeof updateReceiptCandidateSchema>;
export type ConfirmReceiptJobInput = z.infer<typeof confirmReceiptJobSchema>;
export type RetryReceiptJobInput = z.infer<typeof retryReceiptJobSchema>;
export type ShoppingGapPreviewInput = z.infer<typeof shoppingGapPreviewSchema>;
