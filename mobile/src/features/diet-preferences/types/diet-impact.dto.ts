export interface DietaryAffectedMealDto {
  itemId?: string;
  date?: string;
  mealType?: string;
  name?: string;
  reasons?: string[];
  unverified?: boolean;
}
export interface DietaryProgramReferenceDto {
  id?: string;
  title?: string;
  status?: string;
  expectedVersion?: number;
}
export interface DietaryCompatibilityDto {
  status?: string;
  dietaryRevision?: number;
  assessedFrom?: string;
  affectedMealCount?: number;
  items?: DietaryAffectedMealDto[];
}
export interface DietaryImpactDto {
  dietaryRevision?: number;
  assessedFrom?: string;
  affectedPlanCount?: number;
  affectedMealCount?: number;
  plans?: {
    planId?: string;
    weekStart?: string;
    expectedVersion?: number;
    status?: string;
    canRepair?: boolean;
    programs?: DietaryProgramReferenceDto[];
    items?: DietaryAffectedMealDto[];
  }[];
}
export interface DietaryImpactResponseDto { success?: boolean; data?: DietaryImpactDto | null }
export interface DietaryRepairNutritionDto {
  calories?: number | null;
  proteinGrams?: number | null;
  fiberGrams?: number | null;
  fatGrams?: number | null;
  carbohydrateGrams?: number | null;
}
export interface DietaryRepairShoppingDto {
  ingredientId?: string;
  canonicalName?: string;
  amount?: number;
  unit?: string;
  sourceItemCount?: number;
}
export interface DietaryRepairPreviewDto {
  proposalId?: string;
  expiresAt?: string;
  dietaryRevision?: number;
  plans?: {
    planId?: string;
    weekStart?: string;
    expectedVersion?: number;
    status?: string;
    message?: string;
    programs?: DietaryProgramReferenceDto[];
    replacements?: {
      itemId?: string;
      date?: string;
      mealType?: string;
      beforeName?: string;
      afterName?: string;
      recipeId?: string;
      servings?: number;
      calories?: number | null;
    }[];
    beforeNutrition?: DietaryRepairNutritionDto;
    afterNutrition?: DietaryRepairNutritionDto;
    shoppingBefore?: DietaryRepairShoppingDto[];
    shoppingAfter?: DietaryRepairShoppingDto[];
  }[];
}
export interface DietaryRepairPreviewResponseDto { success?: boolean; data?: DietaryRepairPreviewDto | null }
export interface DietaryRepairResultDto {
  dietaryRevision?: number;
  results?: { planId?: string; status?: string; message?: string; remainingAffectedMeals?: number }[];
}
export interface DietaryRepairApplyResponseDto { success?: boolean; data?: DietaryRepairResultDto | null }
export interface DietaryRepairPreviewRequestDto { planIds: string[]; expectedDietaryRevision: number }
export interface DietaryRepairApplyRequestDto { proposalId: string; idempotencyKey: string }
export interface DietaryProgramRevisionRequestDto { expectedVersion: number; idempotencyKey: string }
