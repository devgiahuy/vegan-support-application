import type { MealPlanGoal, MealType, NutritionDataQuality } from '@/common/enums';

export interface MealSlot {
  id: string;
  date: string;
  dateLabel: string;
  mealType: MealType;
  mealTypeLabel: string;
  filled: boolean;
  unfilledReason: string | null;
  recipeId: string;
  recipeTitle: string;
  calories: number;
  formattedCalories: string;
  targetCalories: number;
  warningCodes: string[];
}

export interface ShoppingListItem {
  ingredientId: string | null;
  name: string;
  quantity: number;
  unit: string;
  displayLine: string;
}

export interface PlanWarning {
  code: string;
  message: string;
}

export interface MealPlan {
  id: string;
  weekStart: string;
  formattedWeekRange: string;
  goal: MealPlanGoal;
  goalLabel: string;
  targetCalories: number;
  version: number;
  lockVersion: number;
  supersedesMealPlanId: string | null;
  filledSlots: number;
  totalSlots: number;
  items: MealSlot[];
  shoppingList: ShoppingListItem[];
  warnings: PlanWarning[];
  nutritionDataQuality: NutritionDataQuality;
  nutritionDataQualityLabel: string;
  vitaminB12Mcg: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface MealPlanListQueryParams {
  page?: number;
  limit?: number;
  weekStart?: string;
}

export interface GenerateMealPlanInput {
  weekStart: string;
  goal: MealPlanGoal;
  idempotencyKey: string;
  seed?: string;
  supersedesMealPlanId?: string;
}
