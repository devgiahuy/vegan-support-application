import type { FoodAllowances } from './food-allowances.model';
import type { DietaryImpactDto } from './diet-impact.dto';
export interface AllergyDto {
  allergenCode?: string;
  label?: string;
  severity?: string;
  active?: boolean;
}
export interface IngredientAllergyDto {
  ingredientId?: string;
  ingredientName?: string;
  severity?: string;
  ingredientActive?: boolean;
}
export interface IngredientExclusionDto {
  ingredientId?: string | null;
  ingredientName?: string;
  reason?: string | null;
  active?: boolean;
}
export interface SaveDietPreferencesRequestDto extends FoodAllowances {
  policyVersion: number;
  expectedDietaryRevision: number;
  allergies: { allergenCode: string; label?: string; severity?: string }[];
  ingredientAllergies?: { ingredientId: string; severity?: string }[];
  ingredientExclusions: { ingredientId?: string; ingredientName: string; reason?: string }[];
}
export interface PreferenceDto extends Partial<FoodAllowances> {
  policyVersion?: number;
  dietaryRevision?: number;
  confirmedAt?: string;
  requiresRuleReview?: boolean;
  allergies?: AllergyDto[];
  ingredientAllergies?: IngredientAllergyDto[];
  ingredientExclusions?: IngredientExclusionDto[];
  effectiveConstraints?: { always?: { code?: string; label?: string }[] };
  impact?: DietaryImpactDto;
  impactUnavailable?: boolean;
}
export interface DietPreferenceResponseDto {
  data?: PreferenceDto | null;
  success?: boolean;
}
export type DietRulePreviewRequestDto = FoodAllowances;
export interface DietRulePreviewResponseDto {
  data?: {
    policyVersion?: number;
    selection?: Partial<FoodAllowances>;
    constraints?: { code?: string; label?: string; allowed?: boolean }[];
  };
}
