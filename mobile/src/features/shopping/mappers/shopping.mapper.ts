import { BaseMapper } from '@/lib/mapper';
import type { ShoppingPreviewDto, ShoppingPreviewRequestDto } from '../types/shopping.dto';
import type { SelectedShoppingMeal, ShoppingPreview } from '../types/shopping.model';
function amount(value: { value: number; unit: string }): string {
  return `${value.value.toLocaleString('vi-VN')} ${value.unit}`;
}
export class ShoppingMapper extends BaseMapper<ShoppingPreviewDto, ShoppingPreview> {
  toRequest(meals: SelectedShoppingMeal[]): ShoppingPreviewRequestDto {
    return {
      meals: meals.map((meal) =>
        meal.sourceType === 'RECIPE'
          ? { sourceType: 'RECIPE', recipeId: meal.id, servings: meal.servings }
          : {
              sourceType: 'CUSTOM_MEAL',
              customMealId: meal.id,
              servings: meal.servings,
            }
      ),
    };
  }
  toModel(dto: ShoppingPreviewDto | null | undefined): ShoppingPreview {
    if (!dto) throw new Error('Không nhận được kết quả đối chiếu tủ bếp.');
    return {
      items: dto.items.map((item) => ({
        id: item.ingredient.id,
        name: item.ingredient.name,
        required: amount(item.required),
        available: amount(item.available),
        missing: amount(item.missing),
        surplus: amount(item.surplus),
        needsPurchase: item.missing.value > 0,
        confidencePercent: Math.round(item.confidence * 100),
        assumptions: item.conversionAssumptions ?? [],
        mealNames: item.sourceMeals.map((meal) => `${meal.name} (${meal.servings} phần)`),
      })),
      unresolvedItems: dto.unresolvedItems.map((item) => ({
        name: item.name,
        required: amount(item.required),
        reason:
          item.reasonCode === 'INGREDIENT_UNRESOLVED'
            ? 'Chưa xác định nguyên liệu chuẩn'
            : 'Chưa có quy đổi được kiểm duyệt',
        explanation: item.explanation,
        mealNames: item.sourceMeals.map((meal) => meal.name),
      })),
      selectedMealCount: dto.summary.selectedMealCount,
      missingItemCount: dto.summary.missingItemCount,
      pantryAsOf: dto.pantryAsOf,
    };
  }
}
export const shoppingMapper = new ShoppingMapper();
