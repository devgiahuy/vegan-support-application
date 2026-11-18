import type { DietaryImpactDto } from './diet-impact.dto';

export interface FoodAllowancesDto {
  allowEggs: boolean;
  allowDairy: boolean;
  allowHoney: boolean;
  allowFivePungent: boolean;
}
export interface DietRulePreviewResponseDto {
  success?: boolean;
  data?: {
    policyVersion?: number;
    selection?: Partial<FoodAllowancesDto>;
    constraints?: { code?: string; label?: string; allowed?: boolean }[];
  } | null;
}
export interface SaveDietPreferencesRequestDto extends FoodAllowancesDto {
  policyVersion: number;
  expectedDietaryRevision: number;
  allergies: { allergenCode: string; label?: string; severity?: string }[];
  ingredientAllergies?: { ingredientId: string; severity?: string }[];
  ingredientExclusions: { ingredientId?: string; ingredientName: string; reason?: string }[];
}
export interface DietPreferenceDto extends Partial<FoodAllowancesDto> {
  policyVersion?: number;
  dietaryRevision?: number;
  confirmedAt?: string;
  requiresRuleReview?: boolean;
  allergies?: { allergenCode?: string; label?: string | null; severity?: string | null; active?: boolean }[];
  ingredientAllergies?: { ingredientId?: string; ingredientName?: string; severity?: string; ingredientActive?: boolean }[];
  ingredientExclusions?: { ingredientId?: string | null; ingredientName?: string; reason?: string | null; active?: boolean }[];
  impact?: DietaryImpactDto;
  impactUnavailable?: boolean;
}
export interface DietPreferenceResponseDto {
  success?: boolean;
  data?: DietPreferenceDto | null;
}
