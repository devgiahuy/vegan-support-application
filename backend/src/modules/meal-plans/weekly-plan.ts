import { MealType } from '@prisma/client';

export const WEEKLY_MEAL_ORDER = [
  MealType.BREAKFAST,
  MealType.LUNCH,
  MealType.DINNER,
] as const;

export function buildWeeklySlotBlueprint(weekStart: Date) {
  return Array.from({ length: 7 }, (_, dayIndex) => {
    const date = new Date(weekStart);
    date.setUTCDate(date.getUTCDate() + dayIndex);
    return WEEKLY_MEAL_ORDER.map((mealType, mealIndex) => ({
      date,
      mealType,
      position: dayIndex * WEEKLY_MEAL_ORDER.length + mealIndex,
    }));
  }).flat();
}
