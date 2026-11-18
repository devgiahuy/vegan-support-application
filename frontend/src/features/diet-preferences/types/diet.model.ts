import type { FoodAllowances } from './food-allowances.model';
import type { DietaryImpact } from './diet-impact.model';

export interface Allergy {
  allergenCode: string;
  label: string;
  severity: string;
}
export interface IngredientExclusion {
  ingredientId: string | null;
  ingredientName: string;
  reason: string;
}
export interface IngredientAllergy {
  ingredientId: string;
  ingredientName: string;
  severity: string;
  ingredientActive: boolean;
}

export interface DietPreference extends FoodAllowances {
  selectionValid: boolean;
  policyVersion: number;
  dietaryRevision: number;
  confirmedAt: Date | null;
  requiresRuleReview: boolean;
  allergies: Allergy[];
  ingredientAllergies: IngredientAllergy[];
  ingredientExclusions: IngredientExclusion[];
  effectiveConstraints: { always: string[] };
  impact?: DietaryImpact;
  impactUnavailable: boolean;
}

export interface DietPreferenceDraft extends FoodAllowances {
  policyVersion: number;
  expectedDietaryRevision: number;
  allergies: Allergy[];
  ingredientAllergies?: IngredientAllergy[];
  ingredientExclusions: IngredientExclusion[];
}

export interface DietPreview {
  policyVersion: number;
  selection: FoodAllowances;
  constraints: Array<{ code: string; label: string; allowed: boolean }>;
}

export const foodSummary = (preference: FoodAllowances) =>
  [
    preference.allowEggs ? 'Ăn trứng' : 'Kiêng trứng',
    preference.allowDairy ? 'Ăn sữa' : 'Kiêng sữa',
    preference.allowHoney ? 'Ăn mật ong' : 'Kiêng mật ong',
    preference.allowFivePungent ? 'Ăn ngũ vị tân' : 'Kiêng ngũ vị tân',
  ].join(' · ');
