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

  it('Phase 18: ánh xạ slot chứa món ăn cá nhân (CUSTOM_MEAL)', () => {
    const plan = mealPlanMapper.toModel({
      id: 'plan-custom-1',
      weekStart: '2026-09-28',
      items: [
        {
          id: 'slot-custom-1',
          date: '2026-09-28',
          mealType: 'DINNER',
          position: 3,
          status: 'FILLED',
          sourceType: 'CUSTOM_MEAL',
          targetCalories: 600,
          calories: 550,
          servings: 2,
          customMeal: {
            id: 'cm-uuid-1',
            name: 'Salad đậu hũ hạt chia sốt bơ',
            nutritionCoverage: 'FULL',
          },
          reasonCodes: [],
          warningCodes: [],
        },
      ],
    });
    const slot = plan.items[0];
    expect(slot.isCustomMeal).toBe(true);
    expect(slot.sourceType).toBe('CUSTOM_MEAL');
    expect(slot.customMealId).toBe('cm-uuid-1');
    expect(slot.customMealName).toBe('Salad đậu hũ hạt chia sốt bơ');
    expect(slot.recipeTitle).toBe('Salad đậu hũ hạt chia sốt bơ');
    expect(slot.calories).toBe(550);
    expect(slot.servings).toBe(2);
    expect(slot.customMealCoverage).toBe('FULL');
  });

  it('Phase 18 v4.1: ánh xạ days 7x3, estimatedNutritionTargets, warningDetails, userSummary, và unresolved slot', () => {
    const plan = mealPlanMapper.toModel({
      id: 'plan-v41-1',
      weekStart: '2026-09-28',
      days: [
        {
          date: '2026-09-28',
          dayOfWeek: 'MONDAY',
          slots: {
            breakfast: {
              id: 'slot-mon-bf',
              date: '2026-09-28',
              mealType: 'BREAKFAST',
              status: 'UNFILLED',
              unresolved: {
                code: 'UNFILLED_SLOT',
                reason: 'Không còn món hard-compatible nào cho bữa sáng.',
                hardConstraintsPreserved: true,
              },
            },
            lunch: null,
            dinner: null,
          },
          estimatedTotals: {
            proteinGrams: 45,
            fiberGrams: 28,
            fatGrams: 30,
            carbohydrateGrams: 160,
            estimated: true,
            confidence: 0.95,
            uncertaintyNotes: ['Ước tính dinh dưỡng theo công thức'],
          },
        },
      ],
      estimatedNutritionTargets: {
        proteinGrams: 50,
        fiberGrams: 30,
        fatGrams: 35,
        carbohydrateGrams: 180,
        estimated: true,
        source: 'HEALTH_PROFILE_TDEE_GOAL_CONFIG',
        sourceDetail: 'TDEE 2000 kcal x factor 0.9',
        tolerancePercent: 15,
      },
      warningDetails: [
        {
          code: 'MACRO_TARGET_OUTSIDE_TOLERANCE',
          severity: 'CAUTION',
          severityLabel: 'Lưu ý',
          title: 'Chất béo vượt mục tiêu',
          detail: 'Lượng chất béo ngày Thứ Hai cao hơn mục tiêu ước tính.',
          suggestion: 'Giảm bớt khẩu phần dầu.',
          affectedSlots: [{ itemId: 'slot-mon-bf', date: '2026-09-28', mealType: 'BREAKFAST' }],
        },
      ],
      userSummary: {
        status: 'ADVISORY_ADJUSTMENTS',
        title: 'Có một số khuyến nghị điều chỉnh',
        detail: 'Thực đơn tuần có một số lưu ý về tỷ lệ dinh dưỡng.',
        suggestion: 'Bạn có thể xem chi tiết cảnh báo.',
        hardConstraintsPreserved: true,
      },
    });

    expect(plan.days).toHaveLength(1);
    expect(plan.days[0].dayOfWeekLabel).toBe('Thứ Hai');
    expect(plan.days[0].slots.breakfast?.filled).toBe(false);
    expect(plan.days[0].slots.breakfast?.unresolvedCode).toBe('UNFILLED_SLOT');
    expect(plan.days[0].slots.breakfast?.unfilledReason).toBe(
      'Không còn món hard-compatible nào cho bữa sáng.'
    );
    expect(plan.days[0].estimatedTotals?.proteinGrams).toBe(45);

    expect(plan.estimatedNutritionTargets?.proteinGrams).toBe(50);
    expect(plan.estimatedNutritionTargets?.tolerancePercent).toBe(15);

    expect(plan.warningDetails).toHaveLength(1);
    expect(plan.warningDetails[0].title).toBe('Chất béo vượt mục tiêu');
    expect(plan.warningDetails[0].severityLabel).toBe('Lưu ý');

    expect(plan.userSummary?.status).toBe('ADVISORY_ADJUSTMENTS');
    expect(plan.userSummary?.hardConstraintsPreserved).toBe(true);
  });

  it('chuẩn hóa date khi backend trả về chuỗi ISO có time (split T)', () => {
    const plan = mealPlanMapper.toModel({
      id: 'plan-iso',
      weekStart: '2026-09-28T00:00:00.000Z',
      items: [
        {
          id: 'item-1',
          date: '2026-09-28T07:30:00.000Z',
          mealType: 'BREAKFAST',
          status: 'FILLED',
          recipe: { id: 'r-1', title: 'Cháo nấm', calories: 300 },
        },
      ],
      days: [
        {
          date: '2026-09-28T00:00:00.000Z',
          dayOfWeek: 'MONDAY',
          slots: {
            breakfast: {
              id: 'item-1',
              date: '2026-09-28T07:30:00.000Z',
              mealType: 'BREAKFAST',
              status: 'FILLED',
            },
          },
        },
      ],
    });

    expect(plan.weekStart).toBe('2026-09-28');
    expect(plan.items[0].date).toBe('2026-09-28');
    expect(plan.days[0].date).toBe('2026-09-28');
    expect(plan.days[0].slots.breakfast?.date).toBe('2026-09-28');
  });

  it('tự động tổng hợp days từ items theo date và mealType khi days rỗng', () => {
    const plan = mealPlanMapper.toModel({
      id: 'plan-auto-days',
      weekStart: '2026-09-28',
      items: [
        {
          id: 'slot-din',
          date: '2026-09-28',
          mealType: 'DINNER',
          status: 'FILLED',
          recipe: { id: 'r-din', title: 'Canh rau' },
        },
        {
          id: 'slot-bf',
          date: '2026-09-28',
          mealType: 'BREAKFAST',
          status: 'FILLED',
          recipe: { id: 'r-bf', title: 'Bánh mì' },
        },
        {
          id: 'slot-lu',
          date: '2026-09-28',
          mealType: 'LUNCH',
          status: 'FILLED',
          recipe: { id: 'r-lu', title: 'Cơm chay' },
        },
        {
          id: 'slot-tue-bf',
          date: '2026-09-29',
          mealType: 'BREAKFAST',
          status: 'FILLED',
          recipe: { id: 'r-tue-bf', title: 'Phở chay' },
        },
      ],
    });

    expect(plan.days).toHaveLength(2);
    expect(plan.days[0].date).toBe('2026-09-28');
    expect(plan.days[0].dayOfWeekLabel).toBe('Thứ Hai');
    expect(plan.days[0].slots.breakfast?.recipeTitle).toBe('Bánh mì');
    expect(plan.days[0].slots.lunch?.recipeTitle).toBe('Cơm chay');
    expect(plan.days[0].slots.dinner?.recipeTitle).toBe('Canh rau');

    expect(plan.days[1].date).toBe('2026-09-29');
    expect(plan.days[1].dayOfWeekLabel).toBe('Thứ Ba');
    expect(plan.days[1].slots.breakfast?.recipeTitle).toBe('Phở chay');
    expect(plan.days[1].slots.lunch).toBeNull();
  });

  it('map slot UNFILLED fallback unresolvedCode từ warningCodes khi không có unresolved object', () => {
    const plan = mealPlanMapper.toModel({
      id: 'plan-unfilled-warning',
      weekStart: '2026-10-05',
      items: [
        {
          id: 'slot-unfilled-1',
          date: '2026-10-05',
          mealType: 'LUNCH',
          status: 'UNFILLED',
          warningCodes: ['UNFILLED_SLOT'],
        },
      ],
    });

    const slot = plan.items[0];
    expect(slot.filled).toBe(false);
    expect(slot.unresolvedCode).toBe('UNFILLED_SLOT');
    expect(slot.unfilledReason).toContain('Không có món phù hợp');
  });

  it('map đúng các chỉ số dinh dưỡng macro ở slot-level (proteinGrams, fiberGrams, fatGrams, carbohydrateGrams)', () => {
    const plan = mealPlanMapper.toModel({
      id: 'plan-slot-macros',
      weekStart: '2026-10-05',
      items: [
        {
          id: 'slot-1',
          date: '2026-10-05',
          mealType: 'BREAKFAST',
          status: 'FILLED',
          calories: 560,
          proteinGrams: 19,
          fiberGrams: 15,
          fatGrams: 12,
          carbohydrateGrams: 91,
          recipe: {
            id: 'r-1',
            title: 'Cháo Hạt Sen Đậu Đỏ Yến Mạch',
          },
        },
      ],
    });

    const slot = plan.items[0];
    expect(slot.filled).toBe(true);
    expect(slot.calories).toBe(560);
    expect(slot.protein).toBe(19);
    expect(slot.fiber).toBe(15);
    expect(slot.fat).toBe(12);
    expect(slot.carbs).toBe(91);
  });
});
