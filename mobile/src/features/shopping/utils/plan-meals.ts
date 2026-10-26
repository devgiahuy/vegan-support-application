import type { MealSlot } from '@/features/meal-plan/types/meal-plan.model';
import type { SelectedShoppingMeal } from '../types/shopping.model';

const MAX_MEALS = 50;
const MAX_SERVINGS = 100;

/**
 * Gom các ô đã có món của một thực đơn thành danh sách món cho `POST /shopping-lists/preview`.
 * Cùng một món xuất hiện nhiều bữa thì cộng dồn khẩu phần (tối đa 100); ô trống bị bỏ qua.
 */
export function mealsFromPlan(slots: MealSlot[]): SelectedShoppingMeal[] {
  const merged = new Map<string, SelectedShoppingMeal>();
  for (const slot of slots) {
    if (!slot.filled) continue;
    const isCustom = slot.sourceType === 'CUSTOM_MEAL' || slot.isCustomMeal;
    const id = isCustom ? slot.customMealId : slot.recipeId;
    if (!id) continue;
    const sourceType = isCustom ? 'CUSTOM_MEAL' : 'RECIPE';
    const key = `${sourceType}:${id}`;
    const servings = slot.servings && slot.servings > 0 ? slot.servings : 1;
    const existing = merged.get(key);
    if (existing) {
      existing.servings = Math.min(MAX_SERVINGS, existing.servings + servings);
    } else {
      merged.set(key, { sourceType, id, name: slot.recipeTitle, servings: Math.min(MAX_SERVINGS, servings) });
    }
  }
  return Array.from(merged.values()).slice(0, MAX_MEALS);
}
