import { EvidenceGrade, FoodRuleSeverity, InteractionScope, MealType } from '@prisma/client';
import { z } from '../../common/validation/zod.js';
import { dateOnlySchema } from '../profile/profile.schemas.js';

export const MEAL_ANALYSIS_ALGORITHM_VERSION = 'meal-analysis-v3-user-facing-warnings' as const;

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
      'MACRO_TARGET_EXCEEDED',
      'MACRO_TARGET_BELOW_RANGE',
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
    title: z.string(),
    detail: z.string(),
    suggestion: z.string(),
    severityLabel: z.enum(['Thông tin', 'Nên lưu ý']),
    scopeLabel: z.string(),
    targetDate: dateOnlySchema,
    mealType: z.enum(MealType).nullable(),
    targetComparison: z.enum(['ABOVE', 'BELOW']).nullable(),
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
        userStatus: z.enum([
          'NO_SERIOUS_ISSUE',
          'ADVISORY_ADJUSTMENTS',
          'HARD_CONSTRAINT_VIOLATION',
        ]),
        title: z.string(),
        detail: z.string(),
        advisoryCount: z.number().int().nonnegative(),
        hardConstraintViolationCount: z.number().int().nonnegative(),
        hardConstraintsPreserved: z.boolean(),
      })
      .strict(),
    confidence: z.number().min(0).max(1),
    incompleteData: z.array(z.string()),
    incompleteDataSummary: z
      .object({
        affectedMealCount: z.number().int().nonnegative(),
        title: z.string().nullable(),
        detail: z.string().nullable(),
        suggestion: z.string().nullable(),
      })
      .strict(),
    estimatedNutrition: z
      .object({
        estimated: z.literal(true),
        targetSource: z.literal('HEALTH_PROFILE_TDEE_GOAL_CONFIG'),
        targetSourceDetail: z.string(),
        tolerancePercent: z.number().positive(),
        targets: z
          .object({
            proteinGrams: z.number().nonnegative(),
            fiberGrams: z.number().nonnegative(),
            fatGrams: z.number().nonnegative(),
            carbohydrateGrams: z.number().nonnegative(),
          })
          .strict(),
        days: z.array(
          z
            .object({
              date: dateOnlySchema,
              totals: z
                .object({
                  proteinGrams: z.number().nonnegative().nullable(),
                  fiberGrams: z.number().nonnegative().nullable(),
                  fatGrams: z.number().nonnegative().nullable(),
                  carbohydrateGrams: z.number().nonnegative().nullable(),
                })
                .strict(),
              confidence: z.number().min(0).max(1),
              uncertaintyNotes: z.array(z.string()),
            })
            .strict(),
        ),
      })
      .strict(),
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
