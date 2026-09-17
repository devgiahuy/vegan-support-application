import { describe, expect, it } from 'vitest';
import { mealPlanMapper } from './meal-plan.mapper';
import type {
  DeleteMealPlanResponseDto,
  MealPlanListResponseDto,
  MealPlanResponseDto,
} from '../types/meal-plan.dto';
import { MealPlanGoal, MealType, NutritionDataQuality } from '@/common/enums';

const detailEnvelope: MealPlanResponseDto = {
  success: true,
  data: {
    id: 'plan-1',
    weekStart: '2026-09-14',
    goal: 'LOSE',
    targetCalories: '1800',
    version: 2,
    lockVersion: 2,
    supersedesMealPlanId: null,
    warnings: ['CALORIE_TOLERANCE_WIDENED', 'RECIPE_REPEATED', null, 'CUSTOM_CODE'],
    nutritionDataQuality: 'PARTIAL',
    micronutrientSummary: { vitaminB12Mcg: null, recipesWithData: 10, filledRecipeCount: 20 },
    filledSlots: 20,
    totalSlots: 21,
    createdAt: '2026-09-14T00:00:00.000Z',
    items: [
      {
        id: 'slot-1',
        date: '2026-09-14',
        mealType: 'BREAKFAST',
        status: 'FILLED',
        recipe: {
          id: 'recipe-1',
          title: 'Cháo yến mạch',
          calories: '350',
          protein: 12,
          carbs: 60,
          fat: 8,
          servings: 1,
        },
      },
      { id: 'slot-2', date: '2026-09-14', mealType: 'LUNCH', status: 'UNFILLED' },
      null,
    ],
    shoppingList: [{ ingredientId: 'ing-1', name: 'Cà rốt', quantity: '300', unit: 'g' }],
  },
  meta: null,
};

describe('MealPlanMapper', () => {
  it('map detail đầy đủ: goal, version, week range, calories số-dạng-chuỗi', () => {
    const plan = mealPlanMapper.toDetailModel(detailEnvelope);
    expect(plan.id).toBe('plan-1');
    expect(plan.goal).toBe(MealPlanGoal.LOSE);
    expect(plan.goalLabel).toBe('Giảm cân');
    expect(plan.version).toBe(2);
    expect(plan.lockVersion).toBe(2);
    expect(plan.formattedWeekRange).toBe('14/09 – 20/09');
    expect(plan.targetCalories).toBe(1800);
    expect(plan.filledSlots).toBe(20);
  });

  it('map slot FILLED đọc recipe + format kcal', () => {
    const plan = mealPlanMapper.toDetailModel(detailEnvelope);
    const slot = plan.items[0];
    expect(slot.filled).toBe(true);
    expect(slot.mealType).toBe(MealType.BREAKFAST);
    expect(slot.mealTypeLabel).toBe('Sáng');
    expect(slot.recipeTitle).toBe('Cháo yến mạch');
    expect(slot.calories).toBe(350);
    expect(slot.formattedCalories).toBe('350 kcal');
    expect(slot.unfilledReason).toBeNull();
  });

  it('map slot UNFILLED + lọc phần tử null trong items', () => {
    const plan = mealPlanMapper.toDetailModel(detailEnvelope);
    // 3 phần tử thô (1 null) → BaseMapper giữ null? toSlotList map trực tiếp nên null thành defaults
    expect(plan.items).toHaveLength(3);
    const unfilled = plan.items[1];
    expect(unfilled.filled).toBe(false);
    expect(unfilled.unfilledReason).toContain('Không có món phù hợp');
    expect(unfilled.recipeTitle).toBe('');
  });

  it('warnings: lọc null, dịch mã BE, giữ mã lạ nguyên văn', () => {
    const plan = mealPlanMapper.toDetailModel(detailEnvelope);
    expect(plan.warnings).toHaveLength(3);
    expect(plan.warnings[0].code).toBe('CALORIE_TOLERANCE_WIDENED');
    expect(plan.warnings[0].message).toContain('±20%');
    expect(plan.warnings[2]).toEqual({ code: 'CUSTOM_CODE', message: 'CUSTOM_CODE' });
  });

  it('B12 null khi backend không có dữ liệu, quality PARTIAL', () => {
    const plan = mealPlanMapper.toDetailModel(detailEnvelope);
    expect(plan.vitaminB12Mcg).toBeNull();
    expect(plan.nutritionDataQuality).toBe(NutritionDataQuality.PARTIAL);
    expect(plan.nutritionDataQualityLabel).toBe('Một phần');
  });

  it('shopping list gộp displayLine từ số-dạng-chuỗi', () => {
    const plan = mealPlanMapper.toDetailModel(detailEnvelope);
    expect(plan.shoppingList).toHaveLength(1);
    expect(plan.shoppingList[0].displayLine).toBe('300 g Cà rốt');
    expect(plan.shoppingList[0].ingredientId).toBe('ing-1');
  });

  it('envelope null → defaults an toàn', () => {
    const plan = mealPlanMapper.toDetailModel(null);
    expect(plan.id).toBe('');
    expect(plan.items).toEqual([]);
    expect(plan.shoppingList).toEqual([]);
    expect(plan.warnings).toEqual([]);
    expect(plan.goal).toBe(MealPlanGoal.MAINTAIN);
    expect(plan.vitaminB12Mcg).toBeNull();
  });

  it('đọc snake_case của BE', () => {
    const plan = mealPlanMapper.toModel({
      id: 'p2',
      week_start: '2026-09-21',
      target_calories: 2000,
      lock_version: 3,
      created_at: '2026-09-21T00:00:00.000Z',
    });
    expect(plan.weekStart).toBe('2026-09-21');
    expect(plan.targetCalories).toBe(2000);
    expect(plan.lockVersion).toBe(3);
    expect(plan.formattedWeekRange).toBe('21/09 – 27/09');
  });

  it('toListModel chuẩn hóa meta catalog về PaginationResult', () => {
    const envelope: MealPlanListResponseDto = {
      success: true,
      data: [{ id: 'a', weekStart: '2026-09-14', goal: 'MAINTAIN' }, null],
      meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
    };
    const result = mealPlanMapper.toListModel(envelope);
    expect(result.items).toHaveLength(2);
    expect(result.metadata.totalItems).toBe(2);
    expect(result.metadata.hasNextPage).toBe(false);
    expect(result.items[0].items).toEqual([]);
  });

  it('toListModel meta thiếu → fallback theo số item', () => {
    const result = mealPlanMapper.toListModel({ success: true, data: [], meta: null });
    expect(result.items).toEqual([]);
    expect(result.metadata.page).toBe(1);
  });

  it('toDeleteModel đọc id + deleted', () => {
    const envelope: DeleteMealPlanResponseDto = {
      success: true,
      data: { id: 'plan-9', deleted: true },
      meta: null,
    };
    expect(mealPlanMapper.toDeleteModel(envelope)).toEqual({ id: 'plan-9', deleted: true });
    expect(mealPlanMapper.toDeleteModel(null)).toEqual({ id: '', deleted: false });
  });

  it('toGenerateDto chỉ gửi field BE cho phép', () => {
    const dto = mealPlanMapper.toGenerateDto({
      weekStart: '2026-09-14',
      goal: MealPlanGoal.GAIN,
      idempotencyKey: 'key-1',
    });
    expect(dto).toEqual({ weekStart: '2026-09-14', goal: 'GAIN', idempotencyKey: 'key-1' });
  });

  it('toSwapDto gửi expectedVersion + idempotencyKey', () => {
    expect(mealPlanMapper.toSwapDto(4, 'key-2')).toEqual({
      expectedVersion: 4,
      idempotencyKey: 'key-2',
    });
  });

  it('shape thật live (2026-09-16): calories ở slot-level, recipe không nutrition', () => {
    const plan = mealPlanMapper.toModel({
      id: 'live-1',
      weekStart: '2026-09-21',
      items: [
        {
          id: 'slot-live',
          date: '2026-09-21',
          mealType: 'LUNCH',
          position: 2,
          status: 'FILLED',
          targetCalories: 575,
          calories: 520,
          tolerancePercent: 15,
          recipe: { id: 'r1', revisionId: 'rev-1', slug: 'com-rau', title: 'Cơm rau' },
          reasonCodes: [],
          warningCodes: [],
        },
      ],
      shoppingList: [
        { ingredientId: 'ing-1', canonicalName: 'Bông cải xanh', amount: 1520, unit: 'g' },
      ],
      warnings: ['MICRONUTRIENT_DATA_PARTIAL'],
    });
    const slot = plan.items[0];
    expect(slot.calories).toBe(520);
    expect(slot.formattedCalories).toBe('520 kcal');
    expect(slot.recipeTitle).toBe('Cơm rau');
    expect(slot.protein).toBe(0);
    expect(plan.shoppingList[0].displayLine).toBe('1520 g Bông cải xanh');
    expect(plan.warnings[0].message).toContain('vi chất');
  });
});
