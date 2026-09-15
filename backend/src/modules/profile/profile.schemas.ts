import {
  ActivityLevel,
  AllergySeverity,
  DietPattern,
  DietRuleSource,
  HealthDataSource,
  HealthSex,
  PracticeSchedule,
  Tradition,
} from '@prisma/client';
import { z } from '../../common/validation/zod.js';
import { userResponseSchema } from '../auth/auth.schemas.js';

const TIMEZONE = 'Asia/Ho_Chi_Minh' as const;

function isValidDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có định dạng YYYY-MM-DD')
  .refine(isValidDateOnly, 'Ngày không hợp lệ');

const uniqueDateListSchema = z
  .array(dateOnlySchema)
  .max(366)
  .refine((dates) => new Set(dates).size === dates.length, 'Danh sách ngày không được trùng lặp');

export const updateBasicProfileRequestSchema = z
  .object({
    displayName: z.string().trim().min(2).max(100).optional(),
    avatarUrl: z
      .string()
      .trim()
      .url()
      .max(2_048)
      .refine((value) => /^https?:\/\//.test(value), 'Avatar URL phải dùng HTTP hoặc HTTPS')
      .nullable()
      .optional(),
  })
  .strict()
  .refine((input) => input.displayName !== undefined || input.avatarUrl !== undefined, {
    message: 'Cần cung cấp ít nhất một trường để cập nhật',
  });

export const healthProfileRequestSchema = z
  .object({
    heightCm: z.number().min(80).max(250),
    weightKg: z.number().min(20).max(500),
    age: z.number().int().min(13).max(120),
    sex: z.enum(HealthSex),
    activityLevel: z.enum(ActivityLevel),
  })
  .strict();

export const healthProfileSchema = healthProfileRequestSchema
  .extend({
    bmi: z.number().nonnegative(),
    bmr: z.number().positive(),
    tdee: z.number().positive(),
    dataSource: z.enum(HealthDataSource),
    updatedAt: z.string().datetime(),
  })
  .strict();

export const healthProfileResponseSchema = z
  .object({ success: z.literal(true), data: healthProfileSchema, meta: z.null() })
  .strict();

export const dietRuleSelectionSchema = z
  .object({
    dietPattern: z.enum(DietPattern),
    practiceSchedule: z.enum(PracticeSchedule),
    tradition: z.enum(Tradition),
  })
  .strict();

export const dietRulePreviewSchema = z
  .object({
    id: z.string().uuid(),
    code: z.string(),
    label: z.string(),
    description: z.string(),
    defaultEnabled: z.boolean(),
    hardConstraint: z.boolean(),
    source: z.enum(DietRuleSource),
    version: z.number().int().positive(),
  })
  .strict();

export const dietRulePreviewResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        ruleSetVersion: z.number().int().positive(),
        selection: dietRuleSelectionSchema,
        rules: z.array(dietRulePreviewSchema),
      })
      .strict(),
    meta: z.null(),
  })
  .strict();

const selectedDietRuleSchema = z
  .object({ ruleDefinitionId: z.string().uuid(), enabled: z.boolean() })
  .strict();

const allergyInputSchema = z
  .object({
    allergenCode: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .transform((value) =>
        value
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '_')
          .replace(/^_+|_+$/g, ''),
      )
      .refine((value) => value.length > 0, 'Allergen code không hợp lệ'),
    label: z.string().trim().min(1).max(160).optional(),
    severity: z.enum(AllergySeverity).optional(),
  })
  .strict();

const ingredientExclusionInputSchema = z
  .object({
    ingredientId: z.string().uuid().optional(),
    ingredientName: z.string().trim().min(1).max(160),
    reason: z.string().trim().min(1).max(500).optional(),
  })
  .strict();

export const saveDietPreferencesRequestSchema = dietRuleSelectionSchema
  .extend({
    ruleSetVersion: z.number().int().positive(),
    rules: z
      .array(selectedDietRuleSchema)
      .min(1)
      .refine(
        (rules) => new Set(rules.map((rule) => rule.ruleDefinitionId)).size === rules.length,
        'Rule ID không được trùng lặp',
      ),
    scheduleDates: uniqueDateListSchema.optional(),
    allergies: z
      .array(allergyInputSchema)
      .max(50)
      .default([])
      .refine(
        (allergies) =>
          new Set(allergies.map((allergy) => allergy.allergenCode)).size === allergies.length,
        'Allergen code không được trùng lặp',
      ),
    ingredientExclusions: z.array(ingredientExclusionInputSchema).max(100).default([]),
  })
  .strict();

export const updateDietScheduleRequestSchema = z.object({ dates: uniqueDateListSchema }).strict();

export const allergySchema = z
  .object({
    id: z.string().uuid(),
    allergenCode: z.string(),
    label: z.string().nullable(),
    severity: z.enum(AllergySeverity).nullable(),
    active: z.boolean(),
  })
  .strict();

export const ingredientExclusionSchema = z
  .object({
    id: z.string().uuid(),
    ingredientId: z.string().uuid().nullable(),
    ingredientName: z.string(),
    normalizedName: z.string(),
    reason: z.string().nullable(),
    active: z.boolean(),
  })
  .strict();

const savedDietRuleSchema = dietRulePreviewSchema.extend({ enabled: z.boolean() }).strict();

const effectiveConstraintSchema = z
  .object({
    priority: z.number().int().min(1).max(4),
    source: z.enum(['ALLERGY', 'INGREDIENT_EXCLUSION', 'DIET_PATTERN']),
    code: z.string(),
    label: z.string(),
    hardConstraint: z.literal(true),
  })
  .strict();

const scheduledTraditionSchema = z
  .object({
    practiceSchedule: z.enum(PracticeSchedule),
    timezone: z.literal(TIMEZONE),
    dates: z.array(dateOnlySchema),
    rules: z.array(savedDietRuleSchema),
  })
  .strict();

export const dietPreferenceSchema = dietRuleSelectionSchema
  .extend({
    ruleSetVersion: z.number().int().positive(),
    confirmedAt: z.string().datetime(),
    requiresRuleReview: z.boolean(),
    rules: z.array(savedDietRuleSchema),
    schedule: z.object({ timezone: z.literal(TIMEZONE), dates: z.array(dateOnlySchema) }).strict(),
    allergies: z.array(allergySchema),
    ingredientExclusions: z.array(ingredientExclusionSchema),
    effectiveConstraints: z
      .object({
        always: z.array(effectiveConstraintSchema),
        scheduledTradition: scheduledTraditionSchema,
      })
      .strict(),
  })
  .strict();

export const dietPreferenceResponseSchema = z
  .object({ success: z.literal(true), data: dietPreferenceSchema, meta: z.null() })
  .strict();

export const dietScheduleResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        practiceSchedule: z.enum(PracticeSchedule),
        timezone: z.literal(TIMEZONE),
        dates: z.array(dateOnlySchema),
      })
      .strict(),
    meta: z.null(),
  })
  .strict();

export const profileSchema = userResponseSchema
  .extend({
    healthProfile: healthProfileSchema.nullable(),
    dietPreference: dietPreferenceSchema.nullable(),
  })
  .strict();

export const profileResponseSchema = z
  .object({ success: z.literal(true), data: profileSchema, meta: z.null() })
  .strict();

export type UpdateBasicProfileInput = z.infer<typeof updateBasicProfileRequestSchema>;
export type HealthProfileInput = z.infer<typeof healthProfileRequestSchema>;
export type DietRuleSelectionInput = z.infer<typeof dietRuleSelectionSchema>;
export type SaveDietPreferencesInput = z.infer<typeof saveDietPreferencesRequestSchema>;
export type UpdateDietScheduleInput = z.infer<typeof updateDietScheduleRequestSchema>;
export type HealthProfileOutput = z.infer<typeof healthProfileSchema>;
export type DietRulePreviewOutput = z.infer<typeof dietRulePreviewSchema>;
export type DietPreferenceOutput = z.infer<typeof dietPreferenceSchema>;
export type ProfileOutput = z.infer<typeof profileSchema>;
