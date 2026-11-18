import type { SaveDietPreferencesRequestDto } from './diet.dto';
export interface ImpactMealDto {
  itemId?: string;
  date?: string;
  mealType?: string;
  name?: string;
  reasons?: string[];
  unverified?: boolean;
}
export interface ProgramReferenceDto {
  id?: string;
  title?: string;
  status?: string;
  expectedVersion?: number;
}
export interface CompatibilityDto {
  status?: string;
  dietaryRevision?: number;
  assessedFrom?: string;
  affectedMealCount?: number;
  items?: ImpactMealDto[];
}
export interface ImpactPlanDto {
  planId?: string;
  weekStart?: string;
  expectedVersion?: number;
  status?: string;
  canRepair?: boolean;
  programs?: ProgramReferenceDto[];
  items?: ImpactMealDto[];
}
export interface DietaryImpactDto {
  dietaryRevision?: number;
  assessedFrom?: string;
  affectedPlanCount?: number;
  affectedMealCount?: number;
  plans?: ImpactPlanDto[];
}
export interface DietaryImpactResponseDto {
  success?: boolean;
  data?: DietaryImpactDto;
}
export type DietaryImpactRequestDto = SaveDietPreferencesRequestDto;
export interface RepairPreviewRequestDto {
  planIds: string[];
  expectedDietaryRevision: number;
}
export interface RepairApplyRequestDto {
  proposalId: string;
  idempotencyKey: string;
}
export interface RepairNutritionDto {
  calories?: number | null;
  proteinGrams?: number | null;
  fiberGrams?: number | null;
  fatGrams?: number | null;
  carbohydrateGrams?: number | null;
}
export interface RepairShoppingDto {
  ingredientId?: string;
  canonicalName?: string;
  amount?: number;
  unit?: string;
  sourceItemCount?: number;
}
export interface RepairReplacementDto {
  itemId?: string;
  date?: string;
  mealType?: string;
  beforeName?: string;
  afterName?: string;
  recipeId?: string;
  servings?: number;
  calories?: number | null;
}
export interface RepairPlanDto {
  planId?: string;
  weekStart?: string;
  expectedVersion?: number;
  status?: string;
  message?: string;
  programs?: ProgramReferenceDto[];
  replacements?: RepairReplacementDto[];
  beforeNutrition?: RepairNutritionDto;
  afterNutrition?: RepairNutritionDto;
  shoppingBefore?: RepairShoppingDto[];
  shoppingAfter?: RepairShoppingDto[];
}
export interface RepairPreviewResponseDto {
  data?: {
    proposalId?: string;
    expiresAt?: string;
    dietaryRevision?: number;
    plans?: RepairPlanDto[];
  };
}
export interface RepairApplyResponseDto {
  data?: {
    dietaryRevision?: number;
    results?: {
      planId?: string;
      status?: string;
      message?: string;
      remainingAffectedMeals?: number;
    }[];
  };
}
export interface ProgramRevisionRequestDto {
  expectedVersion: number;
  idempotencyKey: string;
}
