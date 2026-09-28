import { EvidenceGrade, FoodRuleSeverity, InteractionScope, MealType } from '@prisma/client';
import { z } from '../../common/validation/zod.js';
import { dateOnlySchema } from '../profile/profile.schemas.js';

export const MEAL_ANALYSIS_ALGORITHM_VERSION = 'meal-analysis-v1' as const;

export const mealAnalysisParamsSchema = z.object({ id: z.string().uuid() }).strict();

export const mealAnalysisRequestSchema = z
  .object({
    expectedPlanVersion: z.number().int().positive(),
    items: z
      .array(
        z
          .object({ itemId: z.string().uuid(), servings: z.number().positive().max(20).default(1) })
          .strict(),
      )
      .min(1)
      .max(21)
      .optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const ids = value.items?.map((item) => item.itemId) ?? [];
    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: 'custom', path: ['items'], message: 'itemId không được trùng' });
    }
  });

const measuredValueSchema = z
  .object({ value: z.number().nonnegative(), unit: z.string().min(1) })
  .strict();

const affectedItemSchema = z
  .object({
    itemId: z.string().uuid(),
    date: dateOnlySchema,
    mealType: z.enum(MealType),
    sourceType: z.enum(['RECIPE', 'CUSTOM_MEAL']),
    name: z.string(),
    servings: z.number().positive(),
  })
  .strict();

const affectedIngredientSchema = z
  .object({ ingredientId: z.string().uuid(), name: z.string() })
  .strict();

export const mealAnalysisWarningSchema = z
  .object({
    code: z.enum([
      'NUTRIENT_LIMIT_EXCEEDED',
      'INGREDIENT_GUIDELINE_EXCEEDED',
      'INGREDIENT_INTERACTION',
      'PORTION_MULTIPLIER_HIGH',
    ]),
    severity: z.enum(FoodRuleSeverity),
    scope: z.enum(InteractionScope),
    evidenceGrade: z.enum(EvidenceGrade),
    source: z
      .object({
        code: z.string(),
        name: z.string(),
        version: z.string(),
        recordId: z.string(),
        url: z.string().url().nullable(),
      })
      .strict(),
    applicability: z.record(z.string(), z.unknown()),
    affectedItems: z.array(affectedItemSchema).min(1),
    affectedIngredients: z.array(affectedIngredientSchema),
    measured: measuredValueSchema.nullable(),
    limit: measuredValueSchema.nullable(),
    explanation: z.string(),
    suggestedAdjustment: z.string(),
    confidence: z.number().min(0).max(1),
    advisory: z.boolean(),
    incompleteDataNotes: z.array(z.string()),
  })
  .strict();

export const mealAnalysisDataSchema = z
  .object({
    id: z.string().uuid(),
    mealPlanId: z.string().uuid(),
    version: z.number().int().positive(),
    status: z.enum(['CURRENT', 'STALE']),
    algorithmVersion: z.string(),
    planVersion: z.number().int().positive(),
    analyzedItemIds: z.array(z.string().uuid()),
    warnings: z.array(mealAnalysisWarningSchema),
    summary: z
      .object({
        warningCount: z.number().int().nonnegative(),
        highCount: z.number().int().nonnegative(),
        cautionCount: z.number().int().nonnegative(),
        infoCount: z.number().int().nonnegative(),
        selectedItemCount: z.number().int().nonnegative(),
      })
      .strict(),
    confidence: z.number().min(0).max(1),
    incompleteData: z.array(z.string()),
    ruleVersions: z.array(z.string()),
    disclaimer: z.string(),
    createdAt: z.string().datetime(),
  })
  .strict();

export const mealAnalysisResponseSchema = z
  .object({ success: z.literal(true), data: mealAnalysisDataSchema, meta: z.null() })
  .strict();

export type MealAnalysisInput = z.infer<typeof mealAnalysisRequestSchema>;
export type MealAnalysisWarning = z.infer<typeof mealAnalysisWarningSchema>;
