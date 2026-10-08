interface AmountDto {
  value: number;
  unit: string;
}
interface SourceMealDto {
  sourceType: 'RECIPE' | 'CUSTOM_MEAL';
  id: string;
  name: string;
  servings: number;
}
export interface ShoppingPreviewDto {
  items: {
    ingredient: { id: string; name: string };
    required: AmountDto;
    available: AmountDto;
    missing: AmountDto;
    surplus: AmountDto;
    confidence: number;
    conversionAssumptions: string[];
    sourceMeals: SourceMealDto[];
  }[];
  unresolvedItems: {
    name: string;
    required: AmountDto;
    reasonCode: 'INGREDIENT_UNRESOLVED' | 'REVIEWED_CONVERSION_UNAVAILABLE';
    explanation: string;
    sourceMeals: SourceMealDto[];
  }[];
  summary: {
    selectedMealCount: number;
    readyItemCount: number;
    missingItemCount: number;
    unresolvedItemCount: number;
  };
  pantryAsOf: string;
}
export interface ShoppingPreviewRequestDto {
  meals: (
    | { sourceType: 'RECIPE'; recipeId: string; servings: number }
    | { sourceType: 'CUSTOM_MEAL'; customMealId: string; servings: number }
  )[];
}
