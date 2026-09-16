import {
  MealGoal,
  MealSlotStatus,
  MealType,
  NutritionDataQuality,
  RecipeDifficulty,
} from '@prisma/client';
import { z } from '../../common/validation/zod.js';
import { dateOnlySchema } from '../profile/profile.schemas.js';

export const MEAL_PLAN_ALGORITHM_VERSION = 'weekly-deterministic-v1' as const;

export const mealPlanWarningCodeSchema = z.enum([
  'CALORIE_TOLERANCE_WIDENED',
  'RECIPE_REPEATED',
  'UNFILLED_SLOT',
  'SHOPPING_UNIT_NOT_COMBINED',
  'MICRONUTRIENT_DATA_PARTIAL',
  'MICRONUTRIENT_DATA_UNAVAILABLE',
]);

export const generateMealPlanRequestSchema = z
  .object({
    weekStart: dateOnlySchema.refine(
      (value) => new Date(`${value}T00:00:00.000Z`).getUTCDay() === 1,
      'weekStart phải là thứ Hai',
    ),
    goal: z.enum(MealGoal),
    idempotencyKey: z.string().trim().min(8).max(120),
    seed: z.string().trim().min(1).max(120).optional(),
    supersedesMealPlanId: z.string().uuid().optional(),
  })
  .strict();

export const mealPlanListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    weekStart: dateOnlySchema.optional(),
  })
  .strict();

export const mealPlanParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const mealPlanItemParamsSchema = z
  .object({ id: z.string().uuid(), itemId: z.string().uuid() })
  .strict();

export const swapMealPlanItemRequestSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    idempotencyKey: z.string().trim().min(8).max(120),
    seed: z.string().trim().min(1).max(120).optional(),
  })
  .strict();

export const deleteMealPlanQuerySchema = z
  .object({ expectedVersion: z.coerce.number().int().positive() })
  .strict();

const recipeSummarySchema = z
  .object({
    id: z.string().uuid(),
    revisionId: z.string().uuid(),
    slug: z.string(),
    title: z.string(),
    coverImageUrl: z.string().url().nullable(),
    difficulty: z.enum(RecipeDifficulty),
  })
  .strict();

const mealPlanItemSchema = z
  .object({
    id: z.string().uuid(),
    date: dateOnlySchema,
    mealType: z.enum(MealType),
    position: z.number().int().nonnegative(),
    status: z.enum(MealSlotStatus),
    targetCalories: z.number().int().positive(),
    calories: z.number().int().positive().nullable(),
    tolerancePercent: z.number().min(0).max(100).nullable(),
    recipe: recipeSummarySchema.nullable(),
    reasonCodes: z.array(z.string()).max(3),
    warningCodes: z.array(mealPlanWarningCodeSchema),
  })
  .strict();

const shoppingItemSchema = z
  .object({
    ingredientId: z.string().uuid(),
    canonicalName: z.string(),
    amount: z.number().positive(),
    unit: z.string(),
    sourceItemCount: z.number().int().positive(),
  })
  .strict();

const micronutrientSummarySchema = z
  .object({
    vitaminB12Mcg: z.number().nonnegative().nullable(),
    recipesWithData: z.number().int().nonnegative(),
    filledRecipeCount: z.number().int().nonnegative(),
  })
  .strict();

const mealPlanSummarySchema = z
  .object({
    id: z.string().uuid(),
    weekStart: dateOnlySchema,
    goal: z.enum(MealGoal),
    targetCalories: z.number().int().positive(),
    version: z.number().int().positive(),
    lockVersion: z.number().int().positive(),
    supersedesMealPlanId: z.string().uuid().nullable(),
    algorithmVersion: z.string().min(1),
    recommendationVersion: z.string(),
    warnings: z.array(mealPlanWarningCodeSchema),
    nutritionDataQuality: z.enum(NutritionDataQuality),
    micronutrientSummary: micronutrientSummarySchema,
    explanation: z.string().nullable(),
    filledSlots: z.number().int().min(0).max(21),
    totalSlots: z.literal(21),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

const mealPlanDetailSchema = mealPlanSummarySchema
  .extend({
    constraintSnapshot: z.record(z.string(), z.unknown()),
    items: z.array(mealPlanItemSchema).length(21),
    shoppingList: z.array(shoppingItemSchema),
  })
  .strict();

export const mealPlanResponseSchema = z
  .object({ success: z.literal(true), data: mealPlanDetailSchema, meta: z.null() })
  .strict();

export const mealPlanListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(mealPlanSummarySchema),
    meta: z
      .object({
        page: z.number().int().positive(),
        limit: z.number().int().positive(),
        total: z.number().int().nonnegative(),
        totalPages: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();

export const deleteMealPlanResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.object({ id: z.string().uuid(), deleted: z.literal(true) }).strict(),
    meta: z.null(),
  })
  .strict();

export type GenerateMealPlanInput = z.infer<typeof generateMealPlanRequestSchema>;
export type MealPlanListQuery = z.infer<typeof mealPlanListQuerySchema>;
export type MealPlanParams = z.infer<typeof mealPlanParamsSchema>;
export type MealPlanItemParams = z.infer<typeof mealPlanItemParamsSchema>;
export type SwapMealPlanItemInput = z.infer<typeof swapMealPlanItemRequestSchema>;
export type DeleteMealPlanQuery = z.infer<typeof deleteMealPlanQuerySchema>;
export type MealPlanWarningCode = z.infer<typeof mealPlanWarningCodeSchema>;
