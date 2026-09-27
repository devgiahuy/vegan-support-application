/**
 * Clean UI Models for Pantry-aware Shopping Gaps (Phase 22).
 * Formatted for user consumption with Vietnamese labels and helper properties.
 */

export interface FormattedAmount {
  value: number;
  unit: string;
  formatted: string;
}

export interface SourceMealInfo {
  sourceType: 'RECIPE' | 'CUSTOM_MEAL';
  typeLabel: string;
  id: string;
  name: string;
  servings: number;
}

export interface ShoppingGapItem {
  ingredientId: string;
  ingredientName: string;
  required: FormattedAmount;
  available: FormattedAmount;
  missing: FormattedAmount;
  surplus: FormattedAmount;
  isFullyAvailable: boolean;
  isPartiallyMissing: boolean;
  isCompletelyMissing: boolean;
  confidence: number;
  confidencePercent: number;
  conversionAssumptions: string[];
  sourceMeals: SourceMealInfo[];
}

export type ShoppingGapUnresolvedReasonCode =
  'INGREDIENT_UNRESOLVED' | 'REVIEWED_CONVERSION_UNAVAILABLE';

export interface ShoppingGapUnresolvedItem {
  name: string;
  required: FormattedAmount;
  reasonCode: ShoppingGapUnresolvedReasonCode;
  reasonLabel: string;
  explanation: string;
  sourceMeals: SourceMealInfo[];
}

export interface ShoppingGapSummary {
  selectedMealCount: number;
  readyItemCount: number;
  missingItemCount: number;
  unresolvedItemCount: number;
}

export interface ShoppingGapPreview {
  items: ShoppingGapItem[];
  readyItems: ShoppingGapItem[];
  missingItems: ShoppingGapItem[];
  unresolvedItems: ShoppingGapUnresolvedItem[];
  summary: ShoppingGapSummary;
  pantryAsOfDate: Date | null;
  formattedPantryAsOf: string;
}

export interface SelectedMealInput {
  sourceType: 'RECIPE' | 'CUSTOM_MEAL';
  recipeId?: string;
  customMealId?: string;
  servings: number;
}

export interface ShoppingGapPreviewInput {
  meals: SelectedMealInput[];
}
