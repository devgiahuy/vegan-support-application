import {
  AiRequestStatus,
  NutritionValueOrigin,
  RecipeNutritionEstimateStatus,
} from '@prisma/client';
import { z } from '../../common/validation/zod.js';

export const CALCULATION_VERSION = 'recipe-nutrition-v1' as const;
export const NUTRITION_DISCLAIMER =
  'Nutrition estimates are educational guidance only. Cooking conditions, ingredient variation, and missing data can change actual values.';

export const postIdParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const nutritionEstimateIdParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const nutritionHistoryQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();
export const nutritionPreviewRequestSchema = z
  .object({
    useAiFallback: z.boolean().default(false),
  })
  .strict();
export const nutritionRecalculateRequestSchema = z
  .object({
    useAiFallback: z.boolean().default(false),
    expectedPostVersion: z.number().int().positive().optional(),
  })
  .strict();

const nutrientAmountSchema = z
  .object({
    nutrientCode: z.string(),
    nutrientName: z.string(),
    unit: z.string(),
    amount: z.number().nonnegative(),
    origin: z.enum(NutritionValueOrigin),
    confidence: z.number().min(0).max(1),
    min: z.number().nonnegative().nullable(),
    max: z.number().nonnegative().nullable(),
  })
  .strict();

const sourceVersionSchema = z
  .object({
    sourceCode: z.string(),
    sourceVersion: z.string(),
    sourceRecordId: z.string(),
    kind: z.string(),
  })
  .strict();

const assumptionSchema = z
  .object({
    code: z.string(),
    message: z.string(),
    origin: z.enum(NutritionValueOrigin),
  })
  .strict();

const uncoveredIngredientSchema = z
  .object({
    recipeIngredientId: z.string().uuid().nullable(),
    position: z.number().int().nonnegative(),
    displayName: z.string(),
    reason: z.string(),
  })
  .strict();

const estimateLineSchema = z
  .object({
    id: z.string().uuid().nullable(),
    recipeIngredientId: z.string().uuid().nullable(),
    ingredientId: z.string().uuid().nullable(),
    position: z.number().int().nonnegative(),
    displayName: z.string(),
    origin: z.enum(NutritionValueOrigin),
    normalizedRawGrams: z.number().nonnegative().nullable(),
    edibleRawGrams: z.number().nonnegative().nullable(),
    yieldFactor: z.number().positive().nullable(),
    cookedGrams: z.number().nonnegative().nullable(),
    nutrients: z.array(nutrientAmountSchema),
    sourceVersions: z.array(sourceVersionSchema),
    assumptions: z.array(assumptionSchema),
    confidence: z.number().min(0).max(1),
    uncertainty: z.record(z.string(), z.unknown()),
    uncoveredReason: z.string().nullable(),
  })
  .strict();

const estimateSchema = z
  .object({
    id: z.string().uuid().nullable(),
    revisionId: z.string().uuid(),
    postId: z.string().uuid(),
    postVersion: z.number().int().positive(),
    estimateVersion: z.number().int().positive().nullable(),
    status: z.enum(RecipeNutritionEstimateStatus).nullable(),
    stale: z.boolean(),
    calculationVersion: z.literal(CALCULATION_VERSION),
    recipeFingerprint: z.string(),
    servings: z.number().int().positive(),
    totalRawGrams: z.number().nonnegative(),
    totalCookedGrams: z.number().nonnegative(),
    totalNutrients: z.array(nutrientAmountSchema),
    perServingNutrients: z.array(nutrientAmountSchema),
    lines: z.array(estimateLineSchema),
    uncoveredIngredients: z.array(uncoveredIngredientSchema),
    sourceVersions: z.array(sourceVersionSchema),
    assumptions: z.array(assumptionSchema),
    confidence: z.number().min(0).max(1),
    uncertainty: z.record(z.string(), z.unknown()),
    ai: z
      .object({
        used: z.boolean(),
        provider: z.string().nullable(),
        modelId: z.string().nullable(),
        status: z.enum(AiRequestStatus).nullable(),
        providerDown: z.boolean(),
      })
      .strict(),
    disclaimer: z.string(),
    createdAt: z.string().datetime().nullable(),
  })
  .strict();

const statusSchema = z
  .object({
    postId: z.string().uuid(),
    revisionId: z.string().uuid(),
    currentEstimateId: z.string().uuid().nullable(),
    currentStatus: z.enum(RecipeNutritionEstimateStatus).nullable(),
    stale: z.boolean(),
    latestAiJob: z
      .object({
        id: z.string().uuid(),
        provider: z.string(),
        modelId: z.string(),
        status: z.enum(AiRequestStatus),
        errorCode: z.string().nullable(),
        startedAt: z.string().datetime(),
        completedAt: z.string().datetime().nullable(),
      })
      .strict()
      .nullable(),
  })
  .strict();

const paginationMetaSchema = z
  .object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();

export const nutritionEstimateResponseSchema = z
  .object({ success: z.literal(true), data: estimateSchema, meta: z.null() })
  .strict();
export const nutritionHistoryResponseSchema = z
  .object({ success: z.literal(true), data: z.array(estimateSchema), meta: paginationMetaSchema })
  .strict();
export const nutritionStatusResponseSchema = z
  .object({ success: z.literal(true), data: statusSchema, meta: z.null() })
  .strict();

export type PostIdParams = z.infer<typeof postIdParamsSchema>;
export type NutritionHistoryQuery = z.infer<typeof nutritionHistoryQuerySchema>;
export type NutritionPreviewInput = z.infer<typeof nutritionPreviewRequestSchema>;
export type NutritionRecalculateInput = z.infer<typeof nutritionRecalculateRequestSchema>;
export type NutritionEstimateOutput = z.infer<typeof estimateSchema>;
