export interface SelectedShoppingMeal {
  sourceType: 'RECIPE' | 'CUSTOM_MEAL';
  id: string;
  name: string;
  servings: number;
}
export type ShoppingItemStatus = 'READY' | 'PARTIAL' | 'MISSING';
export interface ShoppingItem {
  id: string;
  name: string;
  required: string;
  available: string;
  missing: string;
  surplus: string;
  needsPurchase: boolean;
  /** Đã đủ / thiếu một phần (trong tủ có một ít) / chưa có gì trong tủ. */
  status: ShoppingItemStatus;
  /** Trong tủ có sẵn một lượng > 0 (để tô màu cột "Có sẵn"). */
  hasAvailable: boolean;
  confidencePercent: number;
  assumptions: string[];
  mealNames: string[];
}
export interface ShoppingUnresolvedItem {
  name: string;
  required: string;
  reason: string;
  explanation: string;
  mealNames: string[];
}
export interface ShoppingPreview {
  items: ShoppingItem[];
  unresolvedItems: ShoppingUnresolvedItem[];
  selectedMealCount: number;
  readyItemCount: number;
  missingItemCount: number;
  unresolvedItemCount: number;
  pantryAsOf: string;
  /** `HH:mm dd/MM/yyyy` theo giờ máy. */
  formattedPantryAsOf: string;
}
