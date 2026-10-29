import {
  NutritionValueOrigin,
  RecipeNutritionJobState,
  RecipeNutritionJobTrigger,
  Role,
} from '@prisma/client';
import { z } from '../../common/validation/zod.js';
import { REVIEW_METRIC_KEYS } from './recipe-nutrition-review.metrics.js';

export const reviewNutritionMetricSchema = z.enum(REVIEW_METRIC_KEYS);

export const revisionIdParamsSchema = z.object({ id: z.string().uuid() }).strict();

const overrideValueSchema = z.number().finite().nonnegative().max(99_999).nullable().optional();

export const reviewNutritionOverrideRequestSchema = z
  .object({
    values: z
      .object({
        calories: overrideValueSchema,
        proteinGrams: overrideValueSchema,
        carbsGrams: overrideValueSchema,
        fatGrams: overrideValueSchema,
        fiberGrams: overrideValueSchema,
      })
      .strict()
      .refine(
        (values) => Object.values(values).some((value) => value !== undefined),
        'Cần ít nhất một chỉ số để cập nhật',
      )
      .describe(
        'Per-serving values. A number sets a reviewer override; null clears it back to the calculated estimate; an omitted key is unchanged.',
      ),
    reason: z.string().trim().min(1).max(500).optional(),
  })
  .strict();

const actorSchema = z
  .object({ id: z.string().uuid(), displayName: z.string(), role: z.enum(Role) })
  .strict();

const metricSchema = z
  .object({
    metric: reviewNutritionMetricSchema,
    unit: z.string(),
    estimate: z
      .object({
        value: z.number().nonnegative().nullable(),
        partialValue: z.number().nonnegative().nullable(),
        origin: z.enum(NutritionValueOrigin).nullable(),
        confidence: z.number().min(0).max(1).nullable(),
      })
      .strict(),
    author: z
      .number()
      .nonnegative()
      .nullable()
      .describe('Per-serving value the author typed (USER_PROVIDED); null when left blank.'),
    deviationPercent: z
      .number()
      .nonnegative()
      .nullable()
      .describe('|author − system estimate| / system estimate × 100; null without both values.'),
    deviationWarning: z
      .boolean()
      .describe('True when deviationPercent exceeds 30 (reviewer should double-check).'),
    override: z
      .object({
        value: z.number().nonnegative(),
        updatedBy: actorSchema,
        updatedAt: z.string().datetime(),
      })
      .strict()
      .nullable(),
    finalValue: z.number().nonnegative().nullable(),
    finalOrigin: z.enum(NutritionValueOrigin).nullable(),
  })
  .strict();

const metricValuesSchema = z
  .object({
    calories: z.number().nonnegative().nullable(),
    proteinGrams: z.number().nonnegative().nullable(),
    carbsGrams: z.number().nonnegative().nullable(),
    fatGrams: z.number().nonnegative().nullable(),
    fiberGrams: z.number().nonnegative().nullable(),
  })
  .strict();

export const reviewNutritionPanelSchema = z
  .object({
    revisionId: z.string().uuid(),
    postId: z.string().uuid(),
    revisionVersion: z.number().int().positive(),
    revisionStatus: z.string(),
    servings: z.number().int().positive(),
    canEdit: z.boolean(),
    canApprove: z.boolean(),
    missingMetrics: z.array(reviewNutritionMetricSchema),
    metrics: z.array(metricSchema),
    estimate: z
      .object({
        id: z.string().uuid(),
        version: z.number().int().positive(),
        confidence: z.number().min(0).max(1),
        aiUsed: z.boolean(),
        calculationVersion: z.string(),
        disclaimer: z.string(),
        createdAt: z.string().datetime(),
      })
      .strict()
      .nullable(),
    uncoveredIngredients: z.array(
      z
        .object({
          position: z.number().int().nonnegative(),
          displayName: z.string(),
          reason: z
            .string()
            .describe(
              'UNRESOLVED_INGREDIENT, MISSING_CANONICAL_PROFILE, UNIT_CONVERSION_UNAVAILABLE, MISSING_NUTRIENT_VALUES or MISSING_REVIEW_METRICS (profile lacks some of the five metrics).',
            ),
          missingMetrics: z.array(reviewNutritionMetricSchema),
          aiEstimated: z.boolean(),
        })
        .strict(),
    ),
    aiJob: z
      .object({
        id: z.string().uuid(),
        state: z.enum(RecipeNutritionJobState),
        trigger: z.enum(RecipeNutritionJobTrigger).nullable(),
        attemptCount: z.number().int().nonnegative(),
        maxAttempts: z.number().int().positive(),
        nextAttemptAt: z.string().datetime().nullable(),
        errorCode: z.string().nullable(),
        startedAt: z.string().datetime(),
        completedAt: z.string().datetime().nullable(),
        updatedAt: z.string().datetime(),
      })
      .strict()
      .nullable(),
    previousApproved: z
      .object({
        revisionId: z.string().uuid(),
        revisionVersion: z.number().int().positive(),
        reviewedAt: z.string().datetime().nullable(),
        values: metricValuesSchema,
        overriddenMetrics: z.array(reviewNutritionMetricSchema),
      })
      .strict()
      .nullable()
      .describe(
        'Reference only: values approved for the previous published revision are never carried over.',
      ),
    audit: z.array(
      z
        .object({
          id: z.string().uuid(),
          metric: reviewNutritionMetricSchema,
          action: z.enum(['SET_OVERRIDE', 'CLEAR_OVERRIDE']),
          previousValue: z.number().nonnegative().nullable(),
          previousOrigin: z.enum(NutritionValueOrigin).nullable(),
          newValue: z.number().nonnegative().nullable(),
          newOrigin: z.enum(NutritionValueOrigin).nullable(),
          reason: z.string().nullable(),
          actor: actorSchema,
          createdAt: z.string().datetime(),
        })
        .strict(),
    ),
  })
  .strict();

export const reviewNutritionPanelResponseSchema = z
  .object({ success: z.literal(true), data: reviewNutritionPanelSchema, meta: z.null() })
  .strict();

export type RevisionIdParams = z.infer<typeof revisionIdParamsSchema>;
export type ReviewNutritionOverrideInput = z.infer<typeof reviewNutritionOverrideRequestSchema>;
export type ReviewNutritionPanel = z.infer<typeof reviewNutritionPanelSchema>;
