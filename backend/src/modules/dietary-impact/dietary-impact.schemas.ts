import { MealType, MealProgramStatus } from '@prisma/client';
import { z } from '../../common/validation/zod.js';

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const affectedMealSchema = z
  .object({
    itemId: z.string().uuid(),
    date,
    mealType: z.enum(MealType),
    name: z.string(),
    reasons: z.array(z.string()),
    unverified: z.boolean(),
  })
  .strict();
export const compatibilitySchema = z
  .object({
    status: z.enum(['COMPATIBLE', 'NEEDS_REVIEW', 'HISTORICAL']),
    dietaryRevision: z.number().int().nonnegative(),
    assessedFrom: date,
    affectedMealCount: z.number().int().nonnegative(),
    items: z.array(affectedMealSchema),
  })
  .strict();
export const programReferenceSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string(),
    status: z.enum(MealProgramStatus),
    expectedVersion: z.number().int().positive(),
  })
  .strict();
export const impactPlanSchema = z
  .object({
    planId: z.string().uuid(),
    weekStart: date,
    expectedVersion: z.number().int().positive(),
    status: z.enum(['COMPATIBLE', 'NEEDS_REVIEW', 'HISTORICAL']),
    canRepair: z.boolean(),
    programs: z.array(programReferenceSchema),
    items: z.array(affectedMealSchema),
  })
  .strict();
export const dietaryImpactSchema = z
  .object({
    dietaryRevision: z.number().int().nonnegative(),
    assessedFrom: date,
    affectedPlanCount: z.number().int().nonnegative(),
    affectedMealCount: z.number().int().nonnegative(),
    plans: z.array(impactPlanSchema),
  })
  .strict();
const envelope = <T extends z.ZodType>(data: T) =>
  z.object({ success: z.literal(true), data, meta: z.null() }).strict();
export const dietaryImpactResponseSchema = envelope(dietaryImpactSchema);
const planIds = z
  .array(z.string().uuid())
  .min(1)
  .max(20)
  .refine((ids) => new Set(ids).size === ids.length, 'Thực đơn không được trùng');
export const repairPreviewRequestSchema = z
  .object({
    planIds,
    expectedDietaryRevision: z.number().int().positive(),
  })
  .strict();
export const repairApplyRequestSchema = z
  .object({
    proposalId: z.string().uuid(),
    idempotencyKey: z.string().trim().min(8).max(120),
  })
  .strict();
export const programRevisionRequestSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    idempotencyKey: z.string().trim().min(8).max(120),
  })
  .strict();
export const repairReplacementSchema = z
  .object({
    itemId: z.string().uuid(),
    date,
    mealType: z.enum(MealType),
    beforeName: z.string(),
    afterName: z.string(),
    recipeId: z.string().uuid(),
    servings: z.number().positive(),
    calories: z.number().nonnegative().nullable(),
  })
  .strict();
export const repairNutritionSchema = z
  .object({
    calories: z.number().nonnegative().nullable(),
    proteinGrams: z.number().nonnegative().nullable(),
    fiberGrams: z.number().nonnegative().nullable(),
    fatGrams: z.number().nonnegative().nullable(),
    carbohydrateGrams: z.number().nonnegative().nullable(),
  })
  .strict();
export const repairShoppingItemSchema = z
  .object({
    ingredientId: z.string().uuid(),
    canonicalName: z.string(),
    amount: z.number().positive(),
    unit: z.string(),
    sourceItemCount: z.number().int().positive(),
  })
  .strict();
export const repairPlanSchema = z
  .object({
    planId: z.string().uuid(),
    weekStart: date,
    expectedVersion: z.number().int().positive(),
    status: z.enum(['READY', 'NO_CANDIDATES', 'PROGRAM_REVISION_REQUIRED', 'UNCHANGED']),
    message: z.string(),
    programs: z.array(programReferenceSchema),
    replacements: z.array(repairReplacementSchema),
    beforeNutrition: repairNutritionSchema,
    afterNutrition: repairNutritionSchema,
    shoppingBefore: z.array(repairShoppingItemSchema),
    shoppingAfter: z.array(repairShoppingItemSchema),
  })
  .strict();
export const repairPreviewSchema = z
  .object({
    proposalId: z.string().uuid(),
    expiresAt: z.string().datetime(),
    dietaryRevision: z.number().int().positive(),
    plans: z.array(repairPlanSchema),
  })
  .strict();
export const repairResultSchema = z
  .object({
    planId: z.string().uuid(),
    status: z.enum(['UPDATED', 'UNCHANGED', 'FAILED', 'PROGRAM_REVISION_REQUIRED']),
    message: z.string(),
    remainingAffectedMeals: z.number().int().nonnegative(),
  })
  .strict();
export const repairApplySchema = z
  .object({ dietaryRevision: z.number().int().positive(), results: z.array(repairResultSchema) })
  .strict();
export const repairPreviewResponseSchema = envelope(repairPreviewSchema);
export const repairApplyResponseSchema = envelope(repairApplySchema);
export type DietaryImpact = z.infer<typeof dietaryImpactSchema>;
export type Compatibility = z.infer<typeof compatibilitySchema>;
export type AffectedMeal = z.infer<typeof affectedMealSchema>;
export type ProgramReference = z.infer<typeof programReferenceSchema>;
export type RepairPreviewInput = z.infer<typeof repairPreviewRequestSchema>;
export type RepairApplyInput = z.infer<typeof repairApplyRequestSchema>;
export type RepairPlan = z.infer<typeof repairPlanSchema>;
export type RepairResult = z.infer<typeof repairResultSchema>;
