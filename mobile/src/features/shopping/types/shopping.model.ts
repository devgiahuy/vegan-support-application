export interface SelectedShoppingMeal {
  sourceType: 'RECIPE' | 'CUSTOM_MEAL';
  id: string;
  name: string;
  servings: number;
}
export interface ShoppingItem {
  id: string;
  name: string;
  required: string;
  available: string;
  missing: string;
  surplus: string;
  needsPurchase: boolean;
  confidencePercent: number;
  assumptions: string[];
  mealNames: string[];
}
export interface ShoppingPreview {
  items: ShoppingItem[];
  unresolvedItems: {
    name: string;
    required: string;
    reason: string;
    explanation: string;
    mealNames: string[];
  }[];
  selectedMealCount: number;
  missingItemCount: number;
  pantryAsOf: string;
}
