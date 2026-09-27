/**
 * Raw Backend Data Transfer Objects (DTO) for Shopping Gap Preview (Phase 22).
 * Strictly mapped from backend/src/modules/receipts/receipt.schemas.ts.
 */

export interface AmountDto {
  value: number;
  unit: string;
}

export interface SourceMealDto {
  sourceType: 'RECIPE' | 'CUSTOM_MEAL';
  id: string;
  name: string;
  servings: number;
}

export interface ShoppingGapItemDto {
  ingredient: {
    id: string;
    name: string;
  };
  required: AmountDto;
  available: AmountDto;
  missing: AmountDto;
  surplus: AmountDto;
  confidence: number;
  conversionAssumptions: string[];
  sourceMeals: SourceMealDto[];
}

export type ShoppingGapUnresolvedReasonCodeDto =
  'INGREDIENT_UNRESOLVED' | 'REVIEWED_CONVERSION_UNAVAILABLE';

export interface ShoppingGapUnresolvedItemDto {
  name: string;
  required: AmountDto;
  reasonCode: ShoppingGapUnresolvedReasonCodeDto;
  explanation: string;
  sourceMeals: SourceMealDto[];
}

export interface ShoppingGapSummaryDto {
  selectedMealCount: number;
  readyItemCount: number;
  missingItemCount: number;
  unresolvedItemCount: number;
}

export interface ShoppingGapResponseDto {
  items: ShoppingGapItemDto[];
  unresolvedItems: ShoppingGapUnresolvedItemDto[];
  summary: ShoppingGapSummaryDto;
  pantryAsOf: string;
}

export interface SelectedMealRecipeReqDto {
  sourceType: 'RECIPE';
  recipeId: string;
  servings: number;
}

export interface SelectedMealCustomReqDto {
  sourceType: 'CUSTOM_MEAL';
  customMealId: string;
  servings: number;
}

export type SelectedMealReqDto = SelectedMealRecipeReqDto | SelectedMealCustomReqDto;

export interface ShoppingGapPreviewReqDto {
  meals: SelectedMealReqDto[];
}

export interface ShoppingGapEnvelopeDto {
  success: true;
  data: ShoppingGapResponseDto;
}
