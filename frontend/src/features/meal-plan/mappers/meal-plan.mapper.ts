import {
  BaseMapper,
  pickField,
  safeArray,
  safeDate,
  safeEnum,
  safeNumber,
  safeString,
} from '@/lib/mapper';
import type { PaginationResult } from '@/types/api';
import type {
  DeleteMealPlanResponseDto,
  GenerateMealPlanRequestDto,
  MealPlanDto,
  MealPlanListResponseDto,
  MealPlanResponseDto,
  MealSlotDto,
  ShoppingListItemDto,
  SwapMealPlanItemRequestDto,
} from '../types/meal-plan.dto';
import type {
  GenerateMealPlanInput,
  MealPlan,
  MealSlot,
  PlanWarning,
  ShoppingListItem,
} from '../types/meal-plan.model';
import { MealPlanGoal, MealType, NutritionDataQuality } from '@/common/enums';

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
  SHOPPING_UNIT_NOT_COMBINED: 'Một số nguyên liệu giữ dòng riêng do đơn vị không tương thích.',
  MICRONUTRIENT_DATA_PARTIAL: 'Dữ liệu vi chất chưa đầy đủ cho một số món.',
  UNFILLED_SLOT: 'Ô trống: không có món nào phù hợp với luật ăn của bạn.',
};

/** `YYYY-MM-DD` (Thứ Hai) → `dd/mm – dd/mm` (Thứ Hai – Chủ Nhật). */
function toWeekRange(weekStart: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(weekStart);
  if (!match) return weekStart;
  const start = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(start.getTime())) return weekStart;
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date): string =>
    `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  return `${fmt(start)} – ${fmt(end)}`;
}

/**
 * MealPlanMapper: list summary (không slots), detail 21 slots + shopping list,
 * payload generate/swap. Envelope `{success, data, meta}` đọc trực tiếp.
 */
export class MealPlanMapper extends BaseMapper<MealPlanDto, MealPlan> {
  toModel(dto: MealPlanDto | null | undefined): MealPlan {
    const goal = safeEnum(
      pickField(dto, ['goal'], 'MAINTAIN'),
      MealPlanGoal,
      MealPlanGoal.MAINTAIN
    );
    const quality = safeEnum(
      pickField(dto, ['nutritionDataQuality', 'nutrition_data_quality'], 'UNAVAILABLE'),
      NutritionDataQuality,
      NutritionDataQuality.UNAVAILABLE
    );
    const weekStart = safeString(pickField(dto, ['weekStart', 'week_start'], ''));
    const version = safeNumber(pickField(dto, ['version'], 1));
    const summary = pickField(dto, ['micronutrientSummary', 'micronutrient_summary'], null) as
      MealPlanDto['micronutrientSummary'] | null;
    const b12Raw = summary
      ? safeNumber(pickField(summary, ['vitaminB12Mcg', 'vitamin_b12_mcg'], NaN), NaN)
      : NaN;
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
        pickField(dto, ['shoppingList', 'shopping_list'], null) as
          (ShoppingListItemDto | null)[] | null
      ),
      warnings: this.toWarnings(pickField(dto, ['warnings'], null) as unknown),
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
    const status = safeString(pickField(dto, ['status'], '')).toUpperCase();
    const filled = recipe !== null && typeof recipe === 'object' && status !== 'UNFILLED';
    const mealType = safeEnum(
      pickField(dto, ['mealType', 'meal_type'], 'BREAKFAST'),
      MealType,
      MealType.BREAKFAST
    );
    // Calories ưu tiên ở slot-level (shape thật), fallback recipe-level (biến thể).
    const calories = filled
      ? safeNumber(pickField(dto, ['calories'], pickField(recipe, ['calories'], 0)))
      : 0;
    const protein = filled ? safeNumber(pickField(recipe, ['protein'], 0)) : 0;
    const carbs = filled ? safeNumber(pickField(recipe, ['carbs'], 0)) : 0;
    const fat = filled ? safeNumber(pickField(recipe, ['fat'], 0)) : 0;
    return {
      id: safeString(pickField(dto, ['id', 'itemId', 'item_id'], '')),
      date: safeString(pickField(dto, ['date'], '')),
      mealType,
      mealTypeLabel: MEAL_TYPE_LABELS[mealType],
      filled,
      unfilledReason: filled
        ? null
        : safeString(
            pickField(
              dto,
              ['reason', 'unfilledReason'],
              'Không có món phù hợp với luật ăn của bạn.'
            )
          ),
      recipeId: filled ? safeString(pickField(recipe, ['id'], '')) : '',
      recipeTitle: filled ? safeString(pickField(recipe, ['title', 'name'], 'Món chay')) : '',
      calories,
      formattedCalories: `${calories} kcal`,
      protein,
      carbs,
      fat,
      servings: filled ? safeNumber(pickField(recipe, ['servings'], 1)) : 0,
    };
  }

  private toShoppingList(
    dtos: (ShoppingListItemDto | null)[] | null | undefined
  ): ShoppingListItem[] {
    return safeArray<ShoppingListItemDto | null, ShoppingListItem>(dtos, (item) => {
      const name = safeString(
        pickField(item, ['canonicalName', 'canonical_name', 'name', 'ingredientName'], '')
      );
      const quantity = safeNumber(pickField(item, ['amount', 'quantity'], 0));
      const unit = safeString(pickField(item, ['unit'], ''));
      const ingredientId = safeString(pickField(item, ['ingredientId', 'ingredient_id'], ''));
      const displayLine = [quantity > 0 ? String(quantity) : '', unit, name]
        .filter((part) => part.length > 0)
        .join(' ');
      return {
        ingredientId: ingredientId.length > 0 ? ingredientId : null,
        name,
        quantity,
        unit,
        displayLine,
      };
    }).filter((item) => item.displayLine.length > 0);
  }

  private toWarnings(val: unknown): PlanWarning[] {
    return safeArray<string | null, PlanWarning>(val, (code) => {
      const normalized = safeString(code);
      if (normalized.length === 0) return { code: '', message: '' };
      return {
        code: normalized,
        message: WARNING_MESSAGES[normalized] ?? normalized,
      };
    }).filter((warning) => warning.code.length > 0);
  }

  /** `GET /meal-plans` — data là mảng summary. */
  toListModel(dto: MealPlanListResponseDto | null | undefined): PaginationResult<MealPlan> {
    const rawItems = pickField(dto, ['data'], null) as (MealPlanDto | null)[] | null;
    const items = this.toModelList(
      safeArray<MealPlanDto | null, MealPlanDto | null>(rawItems, (item) => item)
    );
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

  /** `POST /meal-plans/generate` / `GET /meal-plans/:id` / swap → 1 detail. */
  toDetailModel(dto: MealPlanResponseDto | null | undefined): MealPlan {
    const data = pickField(dto, ['data'], null) as MealPlanDto | null;
    return this.toModel(data);
  }

  /** `DELETE /meal-plans/:id` → `{id, deleted}`. */
  toDeleteModel(dto: DeleteMealPlanResponseDto | null | undefined): {
    id: string;
    deleted: boolean;
  } {
    const data = pickField(dto, ['data'], null) as DeleteMealPlanResponseDto['data'];
    return {
      id: safeString(pickField(data, ['id'], '')),
      deleted: pickField<boolean>(data, ['deleted'], false),
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
}

export const mealPlanMapper = new MealPlanMapper();
