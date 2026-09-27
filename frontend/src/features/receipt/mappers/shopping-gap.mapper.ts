import { BaseMapper, pickField, safeArray, safeDate, safeNumber, safeString } from '@/lib/mapper';
import type {
  AmountDto,
  SelectedMealReqDto,
  ShoppingGapItemDto,
  ShoppingGapPreviewReqDto,
  ShoppingGapResponseDto,
  ShoppingGapSummaryDto,
  ShoppingGapUnresolvedItemDto,
  ShoppingGapUnresolvedReasonCodeDto,
  SourceMealDto,
} from '../types/shopping-gap.dto';
import type {
  FormattedAmount,
  SelectedMealInput,
  ShoppingGapItem,
  ShoppingGapPreview,
  ShoppingGapSummary,
  ShoppingGapUnresolvedItem,
  ShoppingGapUnresolvedReasonCode,
  SourceMealInfo,
} from '../types/shopping-gap.model';

const UNRESOLVED_REASON_LABELS: Record<ShoppingGapUnresolvedReasonCode, string> = {
  INGREDIENT_UNRESOLVED: 'Chưa khớp nguyên liệu chuẩn',
  REVIEWED_CONVERSION_UNAVAILABLE: 'Chưa hỗ trợ quy đổi đơn vị',
};

const SOURCE_MEAL_TYPE_LABELS: Record<'RECIPE' | 'CUSTOM_MEAL', string> = {
  RECIPE: 'Công thức',
  CUSTOM_MEAL: 'Món ăn tùy chỉnh',
};

export class ShoppingGapMapper extends BaseMapper<ShoppingGapResponseDto, ShoppingGapPreview> {
  toModel(dto: ShoppingGapResponseDto | null | undefined): ShoppingGapPreview {
    const rawItems = pickField<ShoppingGapItemDto[]>(dto, ['items'], []);
    const items: ShoppingGapItem[] = safeArray<ShoppingGapItemDto, ShoppingGapItem>(
      rawItems,
      (item) => this.toItemModel(item)
    );

    const rawUnresolved = pickField<ShoppingGapUnresolvedItemDto[]>(
      dto,
      ['unresolvedItems', 'unresolved_items'],
      []
    );
    const unresolvedItems: ShoppingGapUnresolvedItem[] = safeArray<
      ShoppingGapUnresolvedItemDto,
      ShoppingGapUnresolvedItem
    >(rawUnresolved, (u) => this.toUnresolvedItemModel(u));

    const readyItems = items.filter((i) => i.isFullyAvailable);
    const missingItems = items.filter((i) => !i.isFullyAvailable);

    // Summary
    const summaryDto = pickField<ShoppingGapSummaryDto | null>(dto, ['summary'], null);
    const summary: ShoppingGapSummary = {
      selectedMealCount: safeNumber(summaryDto?.selectedMealCount, 0),
      readyItemCount: safeNumber(summaryDto?.readyItemCount, readyItems.length),
      missingItemCount: safeNumber(summaryDto?.missingItemCount, missingItems.length),
      unresolvedItemCount: safeNumber(summaryDto?.unresolvedItemCount, unresolvedItems.length),
    };

    const pantryAsOfDate = safeDate(pickField(dto, ['pantryAsOf', 'pantry_as_of'], null));
    const formattedPantryAsOf = pantryAsOfDate
      ? pantryAsOfDate.toLocaleString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Thời điểm hiện tại';

    return {
      items,
      readyItems,
      missingItems,
      unresolvedItems,
      summary,
      pantryAsOfDate,
      formattedPantryAsOf,
    };
  }

  toItemModel(dto: ShoppingGapItemDto | null | undefined): ShoppingGapItem {
    const ingredientId = safeString(pickField(dto, ['ingredient.id'], ''));
    const ingredientName = safeString(pickField(dto, ['ingredient.name'], 'Nguyên liệu'));

    const required = this.toAmountModel(pickField<AmountDto | null>(dto, ['required'], null));
    const available = this.toAmountModel(pickField<AmountDto | null>(dto, ['available'], null));
    const missing = this.toAmountModel(pickField<AmountDto | null>(dto, ['missing'], null));
    const surplus = this.toAmountModel(pickField<AmountDto | null>(dto, ['surplus'], null));

    const isFullyAvailable = missing.value === 0;
    const isPartiallyMissing = available.value > 0 && missing.value > 0;
    const isCompletelyMissing = available.value === 0;

    const confidence = safeNumber(pickField(dto, ['confidence'], 1));
    const confidencePercent = Math.round(confidence * 100);

    const rawAssumptions = pickField<string[]>(
      dto,
      ['conversionAssumptions', 'conversion_assumptions'],
      []
    );
    const conversionAssumptions = safeArray(rawAssumptions, (a) => safeString(a));

    const rawSourceMeals = pickField<SourceMealDto[]>(dto, ['sourceMeals', 'source_meals'], []);
    const sourceMeals = safeArray<SourceMealDto, SourceMealInfo>(rawSourceMeals, (sm) =>
      this.toSourceMealModel(sm)
    );

    return {
      ingredientId,
      ingredientName,
      required,
      available,
      missing,
      surplus,
      isFullyAvailable,
      isPartiallyMissing,
      isCompletelyMissing,
      confidence,
      confidencePercent,
      conversionAssumptions,
      sourceMeals,
    };
  }

  toUnresolvedItemModel(
    dto: ShoppingGapUnresolvedItemDto | null | undefined
  ): ShoppingGapUnresolvedItem {
    const name = safeString(pickField(dto, ['name'], 'Nguyên liệu chưa xác định'));
    const required = this.toAmountModel(pickField<AmountDto | null>(dto, ['required'], null));

    const rawReason = safeString(
      pickField(dto, ['reasonCode', 'reason_code'], 'INGREDIENT_UNRESOLVED')
    ) as ShoppingGapUnresolvedReasonCodeDto;
    const reasonCode: ShoppingGapUnresolvedReasonCode = [
      'INGREDIENT_UNRESOLVED',
      'REVIEWED_CONVERSION_UNAVAILABLE',
    ].includes(rawReason)
      ? rawReason
      : 'INGREDIENT_UNRESOLVED';

    const reasonLabel = UNRESOLVED_REASON_LABELS[reasonCode] || 'Chưa thể quy đổi';
    const explanation = safeString(pickField(dto, ['explanation'], ''));

    const rawSourceMeals = pickField<SourceMealDto[]>(dto, ['sourceMeals', 'source_meals'], []);
    const sourceMeals = safeArray<SourceMealDto, SourceMealInfo>(rawSourceMeals, (sm) =>
      this.toSourceMealModel(sm)
    );

    return {
      name,
      required,
      reasonCode,
      reasonLabel,
      explanation,
      sourceMeals,
    };
  }

  toAmountModel(dto: AmountDto | null | undefined): FormattedAmount {
    const value = safeNumber(pickField(dto, ['value'], 0));
    const unit = safeString(pickField(dto, ['unit'], ''));
    const formatted = `${value.toLocaleString('vi-VN')} ${unit}`.trim();

    return {
      value,
      unit,
      formatted,
    };
  }

  toSourceMealModel(dto: SourceMealDto | null | undefined): SourceMealInfo {
    const rawType = safeString(pickField(dto, ['sourceType', 'source_type'], 'RECIPE'));
    const sourceType: 'RECIPE' | 'CUSTOM_MEAL' =
      rawType === 'CUSTOM_MEAL' ? 'CUSTOM_MEAL' : 'RECIPE';
    const typeLabel = SOURCE_MEAL_TYPE_LABELS[sourceType] || 'Món ăn';
    const id = safeString(pickField(dto, ['id'], ''));
    const name = safeString(pickField(dto, ['name'], 'Món ăn'));
    const servings = safeNumber(pickField(dto, ['servings'], 1));

    return {
      sourceType,
      typeLabel,
      id,
      name,
      servings,
    };
  }

  toPreviewRequestDto(meals: SelectedMealInput[]): ShoppingGapPreviewReqDto {
    const mappedMeals: SelectedMealReqDto[] = meals.map((m) => {
      if (m.sourceType === 'CUSTOM_MEAL') {
        return {
          sourceType: 'CUSTOM_MEAL',
          customMealId: m.customMealId || m.recipeId || '',
          servings: m.servings,
        };
      }
      return {
        sourceType: 'RECIPE',
        recipeId: m.recipeId || m.customMealId || '',
        servings: m.servings,
      };
    });

    return {
      meals: mappedMeals,
    };
  }
}

export const shoppingGapMapper = new ShoppingGapMapper();
