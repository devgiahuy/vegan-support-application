import { MealGoal, MealProgramStatus, MealProgramWeekStatus } from '@prisma/client';
import { z } from '../../common/validation/zod.js';
import { dateOnlySchema } from '../profile/profile.schemas.js';

export const MEAL_PROGRAM_ALGORITHM_VERSION = 'multi-week-program-v1' as const;
export const MEAL_PROGRAM_MIN_WEEKS = 2;
export const MEAL_PROGRAM_ABSOLUTE_MAX_WEEKS = 12;
export const MEAL_PROGRAM_ABSOLUTE_MAX_ALTERNATIVES = 3;
export const MEAL_PROGRAM_ABSOLUTE_MAX_STORED_ALTERNATIVES = 5;

function validTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

const mondaySchema = dateOnlySchema.refine(
  (value) => new Date(`${value}T00:00:00.000Z`).getUTCDay() === 1,
  'startDate phải là thứ Hai',
);

export const createMealProgramRequestSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    goal: z.enum(MealGoal),
    startDate: mondaySchema,
    timezone: z.string().trim().min(1).max(64).refine(validTimeZone, 'timezone IANA không hợp lệ'),
    horizonWeeks: z.number().int().min(MEAL_PROGRAM_MIN_WEEKS).max(MEAL_PROGRAM_ABSOLUTE_MAX_WEEKS),
    alternativesPerWeek: z
      .number()
      .int()
      .min(1)
      .max(MEAL_PROGRAM_ABSOLUTE_MAX_ALTERNATIVES)
      .default(2),
    seed: z.string().trim().min(1).max(120).optional(),
    idempotencyKey: z.string().trim().min(8).max(120),
  })
  .strict();

export const mealProgramListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    status: z.enum(MealProgramStatus).optional(),
  })
  .strict();

export const mealProgramParamsSchema = z.object({ id: z.string().uuid() }).strict();

const mutationBase = {
  expectedVersion: z.number().int().positive(),
  idempotencyKey: z.string().trim().min(8).max(120),
};

export const patchMealProgramRequestSchema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('UPDATE_METADATA'),
      ...mutationBase,
      title: z.string().trim().min(1).max(200),
    })
    .strict(),
  z
    .object({
      action: z.literal('SELECT_ALTERNATIVE'),
      ...mutationBase,
      weekIndex: z.number().int().nonnegative(),
      alternativeRank: z
        .number()
        .int()
        .nonnegative()
        .max(MEAL_PROGRAM_ABSOLUTE_MAX_STORED_ALTERNATIVES - 1),
    })
    .strict(),
  z
    .object({
      action: z.literal('REGENERATE_WEEK'),
      ...mutationBase,
      weekIndex: z.number().int().nonnegative(),
      seed: z.string().trim().min(1).max(120).optional(),
      selectGenerated: z.boolean().default(true),
    })
    .strict(),
  z.object({ action: z.literal('REANALYZE'), ...mutationBase }).strict(),
  z.object({ action: z.literal('CONFIRM'), ...mutationBase }).strict(),
]);

const alternativeSchema = z
  .object({
    id: z.string().uuid(),
    rank: z.number().int().nonnegative(),
    mealPlanId: z.string().uuid(),
    selected: z.boolean(),
    snapshot: z.record(z.string(), z.unknown()),
    createdAt: z.string().datetime(),
  })
  .strict();

const weekSchema = z
  .object({
    id: z.string().uuid(),
    weekIndex: z.number().int().nonnegative(),
    weekStart: dateOnlySchema,
    status: z.enum(MealProgramWeekStatus),
    selectedAlternativeRank: z.number().int().nonnegative().nullable(),
    projectionStatus: z.enum(['CURRENT', 'STALE']),
    failure: z.record(z.string(), z.unknown()).nullable(),
    alternatives: z.array(alternativeSchema),
  })
  .strict();

const programAnalysisSchema = z
  .object({
    id: z.string().uuid(),
    version: z.number().int().positive(),
    status: z.enum(['CURRENT', 'STALE']),
    invalidatedFromWeekIndex: z.number().int().nonnegative().nullable(),
    warnings: z.array(z.record(z.string(), z.unknown())),
    nutritionSummary: z
      .object({
        horizonWeeks: z.number().int().positive(),
        analyzedWeeks: z.number().int().nonnegative(),
        totalCalories: z.number().nonnegative(),
        averageDailyCalories: z.number().nonnegative(),
        totalVitaminB12Mcg: z.number().nonnegative().nullable(),
        averageWeeklyVitaminB12Mcg: z.number().nonnegative().nullable(),
        incompleteWeekIndexes: z.array(z.number().int().nonnegative()),
      })
      .strict(),
    weeklyAnalyses: z.array(z.record(z.string(), z.unknown())),
    createdAt: z.string().datetime(),
  })
  .strict();

const mealProgramSummarySchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    goal: z.enum(MealGoal),
    startDate: dateOnlySchema,
    endDate: dateOnlySchema,
    timezone: z.string(),
    horizonWeeks: z.number().int().min(MEAL_PROGRAM_MIN_WEEKS),
    status: z.enum(MealProgramStatus),
    version: z.number().int().positive(),
    readyWeeks: z.number().int().nonnegative(),
    failedWeeks: z.number().int().nonnegative(),
    confirmedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

const mealProgramDetailSchema = mealProgramSummarySchema
  .extend({
    generationParameters: z.record(z.string(), z.unknown()),
    failureSummary: z.record(z.string(), z.unknown()).nullable(),
    weeks: z.array(weekSchema),
    analysis: programAnalysisSchema.nullable(),
  })
  .strict();

export const mealProgramResponseSchema = z
  .object({ success: z.literal(true), data: mealProgramDetailSchema, meta: z.null() })
  .strict();

export const mealProgramListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(mealProgramSummarySchema),
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

export type CreateMealProgramInput = z.infer<typeof createMealProgramRequestSchema>;
export type MealProgramListQuery = z.infer<typeof mealProgramListQuerySchema>;
export type PatchMealProgramInput = z.infer<typeof patchMealProgramRequestSchema>;
