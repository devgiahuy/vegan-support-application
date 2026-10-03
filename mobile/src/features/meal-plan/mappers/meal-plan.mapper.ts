import { MealPlanGoal, MealType, NutritionDataQuality } from '@/common/enums';
import { BaseMapper, pickField, safeArray, safeBoolean, safeDate, safeEnum, safeNumber, safeString } from '@/lib/mapper';
import type { PaginationResult } from '@/types/api';
import type {
  DeleteMealPlanResponseDto,
  EstimatedMacroDto,
  GenerateMealPlanRequestDto,
  ManualAddMealItemRequestDto,
  MealPlanDayDto,
  MealPlanDto,
  MealPlanListResponseDto,
  MealPlanResponseDto,
  MealPlanWarningDetailDto,
  MealSlotDto,
  ShoppingListItemDto,
  SwapMealPlanItemRequestDto,
} from '../types/meal-plan.dto';
import type {
  EstimatedMacros,
  GenerateMealPlanInput,
  ManualAddMealInput,
  MealPlan,
  MealPlanDay,
  MealSlot,
  MealSourceType,
  PlanUserSummary,
  PlanWarning,
  ShoppingListItem,
} from '../types/meal-plan.model';

const GOAL_LABELS: Record<MealPlanGoal, string> = {
  [MealPlanGoal.MAINTAIN]: 'Giữ cân',
  [MealPlanGoal.LOSE]: 'Giảm cân',
  [MealPlanGoal.GAIN]: 'Tăng cân',
};

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  [MealType.BREAKFAST]: 'Sáng',
  [MealType.LUNCH]: 'Trưa',
  [MealType.DINNER]: 'Tối',
};

const QUALITY_LABELS: Record<NutritionDataQuality, string> = {
  [NutritionDataQuality.COMPLETE]: 'Đầy đủ',
  [NutritionDataQuality.PARTIAL]: 'Một phần',
  [NutritionDataQuality.UNAVAILABLE]: 'Chưa có dữ liệu',
};

const WARNING_MESSAGES: Record<string, string> = {
  CALORIE_TOLERANCE_WIDENED: 'Đã nới dung sai năng lượng lên ±20% để đủ món phù hợp.',
  RECIPE_REPEATED: 'Một số món lặp lại do kho món phù hợp có hạn.',
  SHOPPING_UNIT_NOT_COMBINED: 'Một số nguyên liệu giữ dòng riêng do đơn vị chưa tương thích.',
  MICRONUTRIENT_DATA_PARTIAL: 'Dữ liệu vi chất chưa đầy đủ cho một số món.',
  MICRONUTRIENT_DATA_UNAVAILABLE: 'Chưa có dữ liệu vi chất để phân tích cho thực đơn này.',
  UNFILLED_SLOT: 'Có bữa chưa tìm được món phù hợp với luật ăn của bạn.',
  NUTRITION_TARGET_OUTSIDE_TOLERANCE: 'Một số ngày có ước tính dinh dưỡng lệch so với mục tiêu tham khảo.',
};

const WEEKDAY_LABELS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

function toDateLabel(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return date;
  return `${match[3]}/${match[2]}`;
}

/** `Thứ hai, 29/09` — tính theo UTC để không lệch ngày theo múi giờ máy. */
function toDayLabel(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return date;
  const value = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(value.getTime())) return date;
  return `${WEEKDAY_LABELS[value.getUTCDay()]}, ${match[3]}/${match[2]}`;
}

function toWeekRange(weekStart: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(weekStart);
  if (!match) return weekStart;
  const start = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(start.getTime())) return weekStart;
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  const fmt = (date: Date): string =>
    `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  return `${fmt(start)} - ${fmt(end)}`;
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = safeNumber(value, Number.NaN);
  return Number.isNaN(parsed) ? null : parsed;
}

function toMacros(dto: EstimatedMacroDto | null | undefined): EstimatedMacros | null {
  if (!dto || typeof dto !== 'object') return null;
  return {
    proteinGrams: nullableNumber(dto.proteinGrams),
    fiberGrams: nullableNumber(dto.fiberGrams),
    fatGrams: nullableNumber(dto.fatGrams),
    carbohydrateGrams: nullableNumber(dto.carbohydrateGrams),
  };
}

function stringList(value: unknown): string[] {
  return safeArray<string | null, string>(value as (string | null)[] | null | undefined, (item) => safeString(item)).filter(
    (item) => item.length > 0
  );
}

export class MealPlanMapper extends BaseMapper<MealPlanDto, MealPlan> {
  toModel(dto: MealPlanDto | null | undefined): MealPlan {
    const goal = safeEnum(pickField(dto, ['goal'], 'MAINTAIN'), MealPlanGoal, MealPlanGoal.MAINTAIN);
    const quality = safeEnum(
      pickField(dto, ['nutritionDataQuality', 'nutrition_data_quality'], 'UNAVAILABLE'),
      NutritionDataQuality,
      NutritionDataQuality.UNAVAILABLE
    );
    const weekStart = safeString(pickField(dto, ['weekStart', 'week_start'], ''));
    const version = safeNumber(pickField(dto, ['version'], 1));
    const summary = pickField(dto, ['micronutrientSummary', 'micronutrient_summary'], null) as
      | MealPlanDto['micronutrientSummary']
      | null;
    const b12Raw = summary ? safeNumber(pickField(summary, ['vitaminB12Mcg', 'vitamin_b12_mcg'], NaN), NaN) : NaN;
    const supersedes = safeString(pickField(dto, ['supersedesMealPlanId'], ''));

    return {
      id: safeString(pickField(dto, ['id'], '')),
      weekStart,
      formattedWeekRange: toWeekRange(weekStart),
      goal,
      goalLabel: GOAL_LABELS[goal],
      targetCalories: safeNumber(pickField(dto, ['targetCalories', 'target_calories'], 0)),
      version,
      lockVersion: safeNumber(pickField(dto, ['lockVersion', 'lock_version'], version)),
      supersedesMealPlanId: supersedes.length > 0 ? supersedes : null,
      filledSlots: safeNumber(pickField(dto, ['filledSlots', 'filled_slots'], 0)),
      totalSlots: safeNumber(pickField(dto, ['totalSlots', 'total_slots'], 21)),
      items: this.toSlotList(pickField(dto, ['items'], null) as (MealSlotDto | null)[] | null),
      shoppingList: this.toShoppingList(
        pickField(dto, ['shoppingList', 'shopping_list'], null) as (ShoppingListItemDto | null)[] | null
      ),
      warnings: this.toWarnings(pickField(dto, ['warningDetails'], null), pickField(dto, ['warnings'], null)),
      userSummary: this.toUserSummary(pickField(dto, ['userSummary'], null)),
      days: this.toDays(pickField(dto, ['days'], null)),
      estimatedTargets: toMacros(pickField(dto, ['estimatedNutritionTargets'], null)),
      nutritionDataQuality: quality,
      nutritionDataQualityLabel: QUALITY_LABELS[quality],
      vitaminB12Mcg: Number.isNaN(b12Raw) ? null : b12Raw,
      createdAt: safeDate(pickField(dto, ['createdAt', 'created_at'], null)),
      updatedAt: safeDate(pickField(dto, ['updatedAt', 'updated_at'], null)),
    };
  }

  private toSlotList(dtos: (MealSlotDto | null)[] | null | undefined): MealSlot[] {
    return safeArray<MealSlotDto | null, MealSlot>(dtos, (item) => this.toSlot(item));
  }

  private toSlot(dto: MealSlotDto | null | undefined): MealSlot {
    const recipe = pickField(dto, ['recipe'], null) as MealSlotDto['recipe'];
    const customMeal = pickField(dto, ['customMeal'], null) as MealSlotDto['customMeal'];
    const hasRecipe = recipe !== null && typeof recipe === 'object';
    const hasCustomMeal = customMeal !== null && typeof customMeal === 'object';
    const status = safeString(pickField(dto, ['status'], '')).toUpperCase();
    const filled = (hasRecipe || hasCustomMeal) && status !== 'UNFILLED';
    const mealType = safeEnum(pickField(dto, ['mealType', 'meal_type'], 'BREAKFAST'), MealType, MealType.BREAKFAST);
    const date = safeString(pickField(dto, ['date'], ''));
    const calories = filled ? safeNumber(pickField(dto, ['calories'], 0)) : 0;
    const unresolved = pickField(dto, ['unresolved'], null) as MealSlotDto['unresolved'];
    const sourceType: MealSourceType | null = !filled ? null : hasCustomMeal ? 'CUSTOM_MEAL' : 'RECIPE';
    const servings = nullableNumber(pickField(dto, ['servings'], null));

    return {
      id: safeString(pickField(dto, ['id', 'itemId', 'item_id'], '')),
      date,
      dateLabel: toDateLabel(date),
      mealType,
      mealTypeLabel: MEAL_TYPE_LABELS[mealType],
      filled,
      unfilledReason: filled
        ? null
        : safeString(
            pickField(unresolved, ['reason'], pickField(dto, ['reason', 'unfilledReason'], '')),
            'Không có món phù hợp với luật ăn của bạn.'
          ) || 'Không có món phù hợp với luật ăn của bạn.',
      sourceType,
      isCustomMeal: sourceType === 'CUSTOM_MEAL',
      recipeId: filled && hasRecipe ? safeString(pickField(recipe, ['id'], '')) : '',
      customMealId: filled && hasCustomMeal ? safeString(pickField(customMeal, ['id'], '')) : '',
      recipeTitle: !filled
        ? ''
        : hasCustomMeal
          ? safeString(pickField(customMeal, ['name'], 'Món tự tạo'))
          : safeString(pickField(recipe, ['title', 'name'], 'Món chay')),
      coverImageUrl: filled && hasRecipe ? safeString(pickField(recipe, ['coverImageUrl'], '')) || null : null,
      servings,
      customMealCoverage:
        filled && hasCustomMeal ? safeString(pickField(customMeal, ['nutritionCoverage'], '')) || null : null,
      calories,
      formattedCalories: `${calories} kcal`,
      targetCalories: safeNumber(pickField(dto, ['targetCalories', 'target_calories'], 0)),
      warningCodes: stringList(pickField(dto, ['warningCodes'], null)),
    };
  }

  private toShoppingList(dtos: (ShoppingListItemDto | null)[] | null | undefined): ShoppingListItem[] {
    return safeArray<ShoppingListItemDto | null, ShoppingListItem>(dtos, (item) => {
      const name = safeString(pickField(item, ['canonicalName', 'canonical_name', 'name', 'ingredientName'], ''));
      const quantity = safeNumber(pickField(item, ['amount', 'quantity'], 0));
      const unit = safeString(pickField(item, ['unit'], ''));
      const ingredientId = safeString(pickField(item, ['ingredientId', 'ingredient_id'], ''));
      const displayLine = [quantity > 0 ? String(quantity) : '', unit, name].filter((part) => part.length > 0).join(' ');
      return {
        ingredientId: ingredientId.length > 0 ? ingredientId : null,
        name,
        quantity,
        unit,
        displayLine,
      };
    }).filter((item) => item.displayLine.length > 0);
  }

  /** Ưu tiên `warningDetails` (có diễn giải, gợi ý, ô bị ảnh hưởng); fallback về mã cảnh báo cũ. */
  private toWarnings(details: unknown, codes: unknown): PlanWarning[] {
    const detailed = safeArray<MealPlanWarningDetailDto | null, PlanWarning>(
      details as (MealPlanWarningDetailDto | null)[] | null | undefined,
      (warning) => {
        const code = safeString(pickField(warning, ['code'], ''));
        const severity = safeString(pickField(warning, ['severity'], 'INFO')).toUpperCase();
        const affected = safeArray<
          { itemId?: string; date?: string; mealType?: string; name?: string },
          { itemId: string; date: string; mealTypeLabel: string; name: string }
        >(pickField(warning, ['affectedSlots'], null), (slot) => {
          const mealType = safeEnum(pickField(slot, ['mealType'], 'BREAKFAST'), MealType, MealType.BREAKFAST);
          return {
            itemId: safeString(pickField(slot, ['itemId'], '')),
            date: safeString(pickField(slot, ['date'], '')),
            mealTypeLabel: MEAL_TYPE_LABELS[mealType],
            name: safeString(pickField(slot, ['name'], '')),
          };
        });
        return {
          code,
          message: safeString(pickField(warning, ['message'], '')) || WARNING_MESSAGES[code] || code,
          severityLabel: safeString(pickField(warning, ['severityLabel'], '')) || 'Thông tin',
          isWarning: severity === 'WARNING',
          detail: safeString(pickField(warning, ['detail'], '')) || null,
          suggestion: safeString(pickField(warning, ['suggestion'], '')) || null,
          affectedSlots: affected,
        };
      }
    ).filter((warning) => warning.code.length > 0);
    if (detailed.length > 0) return detailed;

    return stringList(codes).map((code) => ({
      code,
      message: WARNING_MESSAGES[code] ?? code,
      severityLabel: 'Thông tin',
      isWarning: false,
      detail: null,
      suggestion: null,
      affectedSlots: [],
    }));
  }

  private toUserSummary(dto: MealPlanDto['userSummary'] | null | undefined): PlanUserSummary | null {
    if (!dto || typeof dto !== 'object') return null;
    const raw = safeString(pickField(dto, ['status'], 'NO_SERIOUS_ISSUE')).toUpperCase();
    const status: PlanUserSummary['status'] =
      raw === 'ADVISORY_ADJUSTMENTS' || raw === 'HARD_CONSTRAINT_BLOCKED' ? raw : 'NO_SERIOUS_ISSUE';
    return {
      status,
      title: safeString(pickField(dto, ['title'], '')),
      detail: safeString(pickField(dto, ['detail'], '')),
      suggestion: safeString(pickField(dto, ['suggestion'], '')) || null,
    };
  }

  private toDays(dtos: (MealPlanDayDto | null)[] | null | undefined): MealPlanDay[] {
    return safeArray<MealPlanDayDto | null, MealPlanDay>(dtos, (day) => {
      const date = safeString(pickField(day, ['date'], ''));
      return {
        date,
        dateLabel: toDayLabel(date),
        estimatedTotals: toMacros(pickField(day, ['estimatedTotals'], null)),
      };
    }).filter((day) => day.date.length > 0);
  }

  toListModel(dto: MealPlanListResponseDto | null | undefined): PaginationResult<MealPlan> {
    const rawItems = pickField(dto, ['data'], null) as (MealPlanDto | null)[] | null;
    const items = this.toModelList(safeArray<MealPlanDto | null, MealPlanDto | null>(rawItems, (item) => item));
    const meta = pickField(dto, ['meta'], null) as MealPlanListResponseDto['meta'];
    const page = safeNumber(pickField(meta, ['page'], 1));
    const limit = safeNumber(pickField(meta, ['limit'], 10));
    const totalItems = safeNumber(pickField(meta, ['total'], items.length));
    const totalPages = safeNumber(pickField(meta, ['totalPages', 'total_pages'], 1));

    return {
      items,
      metadata: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  toDetailModel(dto: MealPlanResponseDto | null | undefined): MealPlan {
    return this.toModel(pickField(dto, ['data'], null) as MealPlanDto | null);
  }

  toDeleteModel(dto: DeleteMealPlanResponseDto | null | undefined): { id: string; deleted: boolean } {
    const data = pickField(dto, ['data'], null) as DeleteMealPlanResponseDto['data'];
    return {
      id: safeString(pickField(data, ['id'], '')),
      deleted: safeBoolean(pickField(data, ['deleted'], false)),
    };
  }

  toGenerateDto(input: GenerateMealPlanInput): GenerateMealPlanRequestDto {
    return {
      weekStart: input.weekStart,
      goal: input.goal,
      idempotencyKey: input.idempotencyKey,
      ...(input.seed ? { seed: input.seed } : {}),
      ...(input.supersedesMealPlanId ? { supersedesMealPlanId: input.supersedesMealPlanId } : {}),
    };
  }

  toSwapDto(expectedVersion: number, idempotencyKey: string): SwapMealPlanItemRequestDto {
    return { expectedVersion, idempotencyKey };
  }

  toManualAddDto(input: ManualAddMealInput): ManualAddMealItemRequestDto {
    return {
      expectedVersion: input.expectedVersion,
      idempotencyKey: input.idempotencyKey,
      sourceType: input.sourceType,
      ...(input.sourceType === 'RECIPE' && input.recipeId ? { recipeId: input.recipeId } : {}),
      ...(input.sourceType === 'CUSTOM_MEAL' && input.customMealId ? { customMealId: input.customMealId } : {}),
      ...(input.servings ? { servings: input.servings } : {}),
    };
  }
}

export const mealPlanMapper = new MealPlanMapper();
