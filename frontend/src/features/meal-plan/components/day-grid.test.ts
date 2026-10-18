import { describe, expect, it } from 'vitest';
import {
  formatDayLabel,
  normalizeDate,
  MEAL_ORDER,
  MEAL_TYPE_LABELS,
  computeDayNutrition,
} from './day-grid';
import { MealType } from '@/common/enums';

describe('DayGrid Helpers & Logic', () => {
  describe('normalizeDate', () => {
    it('giữ nguyên YYYY-MM-DD và cắt bỏ phần time nếu là ISO timestamp', () => {
      expect(normalizeDate('2026-09-28')).toBe('2026-09-28');
      expect(normalizeDate('2026-09-28T00:00:00.000Z')).toBe('2026-09-28');
      expect(normalizeDate('2026-09-28T14:30:15.123+07:00')).toBe('2026-09-28');
      expect(normalizeDate('')).toBe('');
    });
  });

  describe('formatDayLabel', () => {
    it('định dạng nhãn ngày tiếng Việt chuẩn theo UTC (thứ + dd/mm)', () => {
      // 2026-09-28 là Thứ Hai
      expect(formatDayLabel('2026-09-28')).toBe('Thứ Hai, 28/09');
      // Chuỗi ISO có timestamp vẫn format chính xác Thứ Hai
      expect(formatDayLabel('2026-09-28T07:30:00.000Z')).toBe('Thứ Hai, 28/09');
      // 2026-10-04 là Chủ Nhật
      expect(formatDayLabel('2026-10-04')).toBe('Chủ Nhật, 04/10');
      // Fallback khi chuỗi không đúng định dạng regex
      expect(formatDayLabel('invalid-date', 'Thứ Hai')).toBe('Thứ Hai, invalid-date');
    });

    it('sử dụng fallbackDayOfWeek nếu truyền vào', () => {
      expect(formatDayLabel('2026-09-28', 'Thứ Hai')).toBe('Thứ Hai, 28/09');
    });
  });

  describe('MEAL_ORDER & MEAL_TYPE_LABELS', () => {
    it('thứ tự bữa ăn cố định luôn là Sáng -> Trưa -> Tối', () => {
      expect(MEAL_ORDER).toEqual([MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER]);
    });

    it('nhãn hiển thị tiếng Việt chính xác cho 3 bữa', () => {
      expect(MEAL_TYPE_LABELS[MealType.BREAKFAST]).toBe('Sáng');
      expect(MEAL_TYPE_LABELS[MealType.LUNCH]).toBe('Trưa');
      expect(MEAL_TYPE_LABELS[MealType.DINNER]).toBe('Tối');
    });
  });

  describe('computeDayNutrition', () => {
    const mockSlot = (
      mealType: MealType,
      cal: number,
      protein: number,
      fat: number,
      carbs: number,
      filled = true
    ) => ({
      id: `slot-${mealType}`,
      date: '2026-10-05',
      mealType,
      mealTypeLabel: MEAL_TYPE_LABELS[mealType],
      filled,
      unfilledReason: filled ? null : 'Chưa xếp món',
      unresolvedCode: null,
      recipeId: filled ? `recipe-${mealType}` : '',
      recipeTitle: filled ? `Món ${mealType}` : '',
      coverImageUrl: null,
      sourceType: 'RECIPE' as const,
      isCustomMeal: false,
      customMealId: null,
      customMealName: null,
      customMealCoverage: null,
      calories: cal,
      formattedCalories: `${cal} kcal`,
      protein,
      carbs,
      fat,
      fiber: 0,
      servings: 1,
    });

    it('tính đúng tổng calo, protein, fat, fiber khi trong ngưỡng cho phép', () => {
      const slots = {
        [MealType.BREAKFAST]: mockSlot(MealType.BREAKFAST, 500, 20, 15, 60),
        [MealType.LUNCH]: mockSlot(MealType.LUNCH, 700, 30, 20, 80),
        [MealType.DINNER]: mockSlot(MealType.DINNER, 600, 25, 18, 70),
      };

      const result = computeDayNutrition(slots, null, 2000, {
        tolerancePercent: 20,
        proteinGrams: 80,
        fatGrams: 60,
        fiberGrams: 30,
        carbohydrateGrams: 250,
        estimated: true,
        source: 'TEST',
        sourceDetail: 'Test targets',
      });

      expect(result.dayCalories).toBe(1800);
      expect(result.protein).toBe(75);
      expect(result.fat).toBe(53);
      expect(result.hasWarning).toBe(false);
      expect(result.overWarnings).toHaveLength(0);
    });

    it('phát hiện và cảnh báo khi calo hoặc chất béo, protein vượt ngưỡng tối đa', () => {
      const slots = {
        [MealType.BREAKFAST]: mockSlot(MealType.BREAKFAST, 900, 50, 45, 100),
        [MealType.LUNCH]: mockSlot(MealType.LUNCH, 1100, 60, 50, 120),
        [MealType.DINNER]: mockSlot(MealType.DINNER, 800, 40, 35, 90),
      };

      // target 2000 kcal, tolerance 20% -> max 2400 kcal
      // target protein 80g -> max 96g
      // target fat 60g -> max 72g
      const result = computeDayNutrition(slots, null, 2000, {
        tolerancePercent: 20,
        proteinGrams: 80,
        fatGrams: 60,
        fiberGrams: 30,
        carbohydrateGrams: 250,
        estimated: true,
        source: 'TEST',
        sourceDetail: 'Test targets',
      });

      expect(result.dayCalories).toBe(2800);
      expect(result.isCalorieOver).toBe(true);
      expect(result.isProteinOver).toBe(true);
      expect(result.isFatOver).toBe(true);
      expect(result.hasWarning).toBe(true);
      expect(result.overWarnings.length).toBeGreaterThanOrEqual(3);
      expect(result.overWarnings[0]).toContain('Calo vượt');
    });

    it('tổng hợp chính xác chất xơ và tinh bột từ các ô bữa ăn khi không có estimatedTotals', () => {
      const slots = {
        [MealType.BREAKFAST]: {
          ...mockSlot(MealType.BREAKFAST, 560, 19, 12, 91),
          fiber: 10,
        },
        [MealType.LUNCH]: {
          ...mockSlot(MealType.LUNCH, 600, 25, 14, 85),
          fiber: 10,
        },
        [MealType.DINNER]: {
          ...mockSlot(MealType.DINNER, 520, 20, 10, 75),
          fiber: 10,
        },
      };

      const result = computeDayNutrition(slots, null, 2000, null);

      expect(result.dayCalories).toBe(1680);
      expect(result.protein).toBe(64);
      expect(result.fat).toBe(36);
      expect(result.carbs).toBe(251);
      expect(result.fiber).toBe(30);
      expect(result.hasWarning).toBe(false);
    });

    it('ưu tiên giá trị từ estimatedTotals khi backend đã tổng hợp sẵn', () => {
      const slots = {
        [MealType.BREAKFAST]: {
          ...mockSlot(MealType.BREAKFAST, 560, 19, 12, 91),
          fiber: 15,
        },
        [MealType.LUNCH]: mockSlot(MealType.LUNCH, 0, 0, 0, 0, false),
        [MealType.DINNER]: mockSlot(MealType.DINNER, 0, 0, 0, 0, false),
      };

      const backendEstimatedTotals = {
        proteinGrams: 70,
        fiberGrams: 35,
        fatGrams: 40,
        carbohydrateGrams: 220,
        estimated: true,
        confidence: 0.95,
        uncertaintyNotes: [],
      };

      const result = computeDayNutrition(slots, backendEstimatedTotals, 2000, null);

      expect(result.protein).toBe(70);
      expect(result.fiber).toBe(35);
      expect(result.fat).toBe(40);
      expect(result.carbs).toBe(220);
    });
  });
});
