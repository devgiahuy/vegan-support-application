import { dietaryImpactSchema } from '../dietary-impact/dietary-impact.schemas.js';
import { ActivityLevel, AllergySeverity, HealthDataSource, HealthSex } from '@prisma/client';
import { z, mediaUrlSchema } from '../../common/validation/zod.js';
import { userResponseSchema } from '../auth/auth.schemas.js';

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

export const updateBasicProfileRequestSchema = z
  .object({
    displayName: z.string().trim().min(2).max(100).optional(),
    avatarUrl: mediaUrlSchema.nullable().optional(),
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

export const DIETARY_POLICY_VERSION = 1;
export const dietRuleSelectionSchema = z
  .object({
    allowEggs: z.boolean(),
    allowDairy: z.boolean(),
    allowHoney: z.boolean(),
    allowFivePungent: z.boolean(),
  })
  .strict();
export const dietRulePreviewSchema = z
  .object({
    code: z.string(),
    label: z.string(),
    allowed: z.boolean(),
  })
  .strict();
export const dietRulePreviewResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        policyVersion: z.number().int().positive(),
        selection: dietRuleSelectionSchema,
        constraints: z.array(dietRulePreviewSchema),
      })
      .strict(),
    meta: z.null(),
  })
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
    policyVersion: z.number().int().positive(),
    expectedDietaryRevision: z.number().int().nonnegative(),
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
    ingredientAllergies: z
      .array(
        z
          .object({
            ingredientId: z.string().uuid(),
            severity: z.enum(AllergySeverity).default('MODERATE'),
          })
          .strict(),
      )
      .max(100)
      .refine(
        (items) => new Set(items.map((item) => item.ingredientId)).size === items.length,
        'Nguyên liệu dị ứng không được trùng lặp',
      )
      .optional(),
  })
  .strict();

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

const effectiveConstraintSchema = z
  .object({
    priority: z.number().int().min(1).max(4),
    source: z.enum(['ALLERGY', 'INGREDIENT_EXCLUSION', 'FOOD_GROUP']),
    code: z.string(),
    label: z.string(),
    hardConstraint: z.literal(true),
  })
  .strict();
export const dietPreferenceSchema = dietRuleSelectionSchema
  .extend({
    impact: dietaryImpactSchema.optional(),
    impactUnavailable: z.boolean().optional(),
    policyVersion: z.number().int().positive(),
    dietaryRevision: z.number().int().positive(),
    confirmedAt: z.string().datetime(),
    requiresRuleReview: z.boolean(),
    allergies: z.array(allergySchema),
    ingredientAllergies: z.array(
      z
        .object({
          ingredientId: z.string().uuid(),
          ingredientName: z.string(),
          severity: z.enum(AllergySeverity),
          ingredientActive: z.boolean(),
        })
        .strict(),
    ),
    ingredientExclusions: z.array(ingredientExclusionSchema),
    effectiveConstraints: z.object({ always: z.array(effectiveConstraintSchema) }).strict(),
  })
  .strict();

export const dietPreferenceResponseSchema = z
  .object({ success: z.literal(true), data: dietPreferenceSchema, meta: z.null() })
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
export type HealthProfileOutput = z.infer<typeof healthProfileSchema>;
export type DietRulePreviewOutput = z.infer<typeof dietRulePreviewSchema>;
export type DietPreferenceOutput = z.infer<typeof dietPreferenceSchema>;
export type ProfileOutput = z.infer<typeof profileSchema>;
