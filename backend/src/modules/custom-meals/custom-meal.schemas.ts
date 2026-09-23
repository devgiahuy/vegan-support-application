import { CustomMealDeletePolicy, IngredientResolutionStatus } from '@prisma/client';
import { z } from '../../common/validation/zod.js';

const positiveInt = z.number().int().min(1);
const positiveDecimal = z.number().positive().max(99_999);

export const customMealIngredientInputSchema = z
  .object({
    position: z.number().int().min(0).max(199),
    displayName: z.string().trim().min(1).max(160),
    amount: positiveDecimal,
    unit: z.string().trim().min(1).max(40),
    ingredientId: z.string().uuid().optional(),
  })
  .strict();

export const createCustomMealSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    notes: z.string().trim().min(1).max(5_000).optional(),
    servings: positiveInt.max(99).default(1),
    sourceNote: z.string().trim().min(1).max(500).optional(),
    userCalories: z.number().int().min(0).max(99_999).optional(),
    userProteinGrams: positiveDecimal.optional(),
    userCarbsGrams: positiveDecimal.optional(),
    userFatGrams: positiveDecimal.optional(),
    deletePolicy: z.nativeEnum(CustomMealDeletePolicy).default(CustomMealDeletePolicy.BLOCK),
    ingredients: z
      .array(customMealIngredientInputSchema)
      .max(100)
      .default([])
      .refine(
        (ings) => new Set(ings.map((i) => i.position)).size === ings.length,
        'Vị trí nguyên liệu không được trùng lặp',
      ),
    tags: z
      .array(z.string().trim().min(1).max(80))
      .max(30)
      .default([]),
  })
  .strict();

export const updateCustomMealSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    notes: z.string().trim().min(1).max(5_000).nullable().optional(),
    servings: positiveInt.max(99).optional(),
    sourceNote: z.string().trim().min(1).max(500).nullable().optional(),
    userCalories: z.number().int().min(0).max(99_999).nullable().optional(),
    userProteinGrams: positiveDecimal.nullable().optional(),
    userCarbsGrams: positiveDecimal.nullable().optional(),
    userFatGrams: positiveDecimal.nullable().optional(),
    deletePolicy: z.nativeEnum(CustomMealDeletePolicy).optional(),
    ingredients: z
      .array(customMealIngredientInputSchema)
      .max(100)
      .optional()
      .refine(
        (ings) =>
          ings === undefined ||
          new Set(ings.map((i) => i.position)).size === ings.length,
        'Vị trí nguyên liệu không được trùng lặp',
      ),
    tags: z
      .array(z.string().trim().min(1).max(80))
      .max(30)
      .optional(),
  })
  .strict();

export const customMealIdParamsSchema = z.object({ id: z.string().uuid() }).strict();

export const customMealListQuerySchema = z
  .object({
    page: z
      .preprocess((v) => Number(v), z.number().int().min(1))
      .default(1),
    limit: z
      .preprocess((v) => Number(v), z.number().int().min(1).max(50))
      .default(20),
    tag: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

export const attachPhotoSchema = z
  .object({
    assetId: z.string().uuid(),
    position: z.number().int().min(0).max(9).default(0),
  })
  .strict();

export const removePhotoParamsSchema = z
  .object({ id: z.string().uuid(), assetId: z.string().uuid() })
  .strict();

export const reorderPhotosSchema = z
  .object({
    orderedAssetIds: z
      .array(z.string().uuid())
      .min(1)
      .max(10)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        'Asset IDs không được trùng lặp',
      ),
  })
  .strict();

export type CreateCustomMealInput = z.infer<typeof createCustomMealSchema>;
export type UpdateCustomMealInput = z.infer<typeof updateCustomMealSchema>;
export type CustomMealListQuery = z.infer<typeof customMealListQuerySchema>;
export type AttachPhotoInput = z.infer<typeof attachPhotoSchema>;
export type ReorderPhotosInput = z.infer<typeof reorderPhotosSchema>;

// Response shapes (for OpenAPI)
export const customMealIngredientResponseSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int(),
  displayName: z.string(),
  amount: z.number(),
  unit: z.string(),
  resolutionStatus: z.nativeEnum(IngredientResolutionStatus),
  ingredientId: z.string().uuid().nullable(),
  ingredient: z.object({ id: z.string().uuid(), canonicalName: z.string() }).nullable(),
});

export const customMealPhotoResponseSchema = z.object({
  id: z.string().uuid(),
  assetId: z.string().uuid(),
  position: z.number().int(),
  secureUrl: z.string(),
  mimeType: z.string().nullable(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
});

export const customMealTagResponseSchema = z.object({
  tag: z.string(),
  normalizedTag: z.string(),
});

export const customMealResponseSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  name: z.string(),
  notes: z.string().nullable(),
  servings: z.number().int(),
  sourceNote: z.string().nullable(),
  userCalories: z.number().int().nullable(),
  userProteinGrams: z.number().nullable(),
  userCarbsGrams: z.number().nullable(),
  userFatGrams: z.number().nullable(),
  nutritionCoverage: z.string(),
  deletePolicy: z.nativeEnum(CustomMealDeletePolicy),
  ingredients: z.array(customMealIngredientResponseSchema),
  photos: z.array(customMealPhotoResponseSchema),
  tags: z.array(customMealTagResponseSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const customMealListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    records: z.array(customMealResponseSchema),
    pagination: z.object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    }),
  }),
});
