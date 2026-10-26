import type { EstimatedMacros, EstimatedTargets, MealSlot } from '../types/meal-plan.model';

/** Ngưỡng thận trọng tuyệt đối cho chất xơ (g/ngày), đồng bộ với backend `FIBER_UPPER_CAUTION_GRAMS`. */
const FIBER_UPPER_CAUTION_GRAMS = 70;
const DEFAULT_DAILY_CALORIES = 2000;
const DEFAULT_TOLERANCE_PERCENT = 20;

export interface DayNutritionInfo {
  dayCalories: number;
  protein: number;
  fat: number;
  fiber: number | null;
  carbs: number;
  isCalorieOver: boolean;
  isProteinOver: boolean;
  isFatOver: boolean;
  isFiberOver: boolean;
  overWarnings: string[];
}

function sum(slots: MealSlot[], pick: (slot: MealSlot) => number): number {
  return Math.round(slots.reduce((total, slot) => total + (pick(slot) || 0), 0) * 100) / 100;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Tổng dinh dưỡng một ngày và các chỉ số vượt mức — cùng quy tắc với `computeDayNutrition` của web: ưu tiên tổng ước
 * tính của backend, nếu thiếu thì cộng từ các bữa; chất xơ là mức tối thiểu nên chỉ báo khi rất cao.
 */
export function computeDayNutrition(
  slots: MealSlot[],
  estimatedTotals: EstimatedMacros | null,
  targetCalories: number,
  targets: EstimatedTargets | null
): DayNutritionInfo {
  const filled = slots.filter((slot) => slot.filled);
  const dayCalories = sum(filled, (slot) => slot.calories);
  const slotFiber = sum(filled, (slot) => slot.fiber);

  const protein = estimatedTotals?.proteinGrams ?? sum(filled, (slot) => slot.protein);
  const fat = estimatedTotals?.fatGrams ?? sum(filled, (slot) => slot.fat);
  const carbs = estimatedTotals?.carbohydrateGrams ?? sum(filled, (slot) => slot.carbs);
  const fiber = estimatedTotals?.fiberGrams ?? (slotFiber > 0 ? slotFiber : null);

  const dailyCalories = targetCalories > 0 ? targetCalories : DEFAULT_DAILY_CALORIES;
  const toleranceFactor = 1 + (targets?.tolerancePercent ?? DEFAULT_TOLERANCE_PERCENT) / 100;

  const maxCalories = dailyCalories * toleranceFactor;
  const targetProtein = targets?.proteinGrams ?? Math.round((dailyCalories * 0.15) / 4);
  const maxProtein = targetProtein * toleranceFactor;
  const targetFat = targets?.fatGrams ?? Math.round((dailyCalories * 0.25) / 9);
  const maxFat = targetFat * toleranceFactor;
  const targetFiber = targets?.fiberGrams ?? Math.round((dailyCalories / 1000) * 14);
  const maxFiber = Math.max(targetFiber * toleranceFactor, FIBER_UPPER_CAUTION_GRAMS);

  const overWarnings: string[] = [];

  const isCalorieOver = dayCalories > maxCalories;
  if (isCalorieOver) {
    overWarnings.push(
      `Calo vượt ${Math.round(dayCalories - maxCalories)} kcal (${dayCalories} / mục tiêu ~${dailyCalories} kcal, tối đa ~${Math.round(maxCalories)} kcal)`
    );
  }
  const isProteinOver = targetProtein > 0 && protein > maxProtein;
  if (isProteinOver) {
    overWarnings.push(
      `Chất đạm vượt ${round1(protein - maxProtein)}g (${protein}g / mục tiêu ~${targetProtein}g, tối đa ~${Math.round(maxProtein)}g)`
    );
  }
  const isFatOver = targetFat > 0 && fat > maxFat;
  if (isFatOver) {
    overWarnings.push(
      `Chất béo vượt ${round1(fat - maxFat)}g (${fat}g / mục tiêu ~${targetFat}g, tối đa ~${Math.round(maxFat)}g)`
    );
  }
  const isFiberOver = targetFiber > 0 && fiber !== null && fiber > maxFiber;
  if (isFiberOver) {
    overWarnings.push(
      `Chất xơ rất cao: ${fiber}g/ngày (mục tiêu tối thiểu ~${targetFiber}g). Nên tăng chất xơ từ từ và uống đủ nước.`
    );
  }

  return {
    dayCalories,
    protein,
    fat,
    fiber,
    carbs,
    isCalorieOver,
    isProteinOver,
    isFatOver,
    isFiberOver,
    overWarnings,
  };
}
