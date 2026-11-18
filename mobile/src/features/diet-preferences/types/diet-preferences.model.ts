import type { FoodAllowanceSelection } from './food-allowances.model';
import type { DietaryImpact } from './diet-impact.model';
import type { DietPreferenceSummary } from '@/features/profile/types/profile.model';

export interface DietRulePreview {
  policyVersion: number;
  selection: FoodAllowanceSelection;
  constraints: { code: string; label: string; allowed: boolean }[];
}
export interface DraftAllergy {
  allergenCode: string;
  label: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
}
export interface DraftIngredientAllergy {
  ingredientId: string;
  ingredientName: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
}
export interface DraftIngredientExclusion {
  ingredientName: string;
  ingredientId?: string;
  reason?: string;
}
export interface SaveDietPreferencesInput extends FoodAllowanceSelection {
  policyVersion: number;
  expectedDietaryRevision: number;
  allergies: DraftAllergy[];
  ingredientAllergies?: DraftIngredientAllergy[];
  ingredientExclusions: DraftIngredientExclusion[];
}
export interface SavedDietPreferences {
  preference: DietPreferenceSummary;
  impact: DietaryImpact | null;
  impactUnavailable: boolean;
}
