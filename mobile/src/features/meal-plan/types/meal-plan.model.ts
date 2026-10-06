import type { MealPlanGoal, MealType, NutritionDataQuality } from '@/common/enums';

export type MealSourceType = 'RECIPE' | 'CUSTOM_MEAL';

export interface MealSlot {
  id: string;
  date: string;
  dateLabel: string;
  mealType: MealType;
  mealTypeLabel: string;
  filled: boolean;
  unfilledReason: string | null;
  /** Nguồn món: công thức hay bữa ăn tự tạo; null khi ô trống. */
  sourceType: MealSourceType | null;
  isCustomMeal: boolean;
  /** Id công thức (rỗng nếu ô trống hoặc là món tự tạo). */
  recipeId: string;
  customMealId: string;
  /** Tên món hiển thị (công thức hoặc bữa ăn tự tạo). */
  recipeTitle: string;
  coverImageUrl: string | null;
  /** Số khẩu phần của ô; null khi backend không trả. */
  servings: number | null;
  /** Mức bao phủ dinh dưỡng của bữa tự tạo (ví dụ khi thiếu dữ liệu). */
  customMealCoverage: string | null;
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

export interface PlanWarningSlot {
  itemId: string;
  date: string;
  mealTypeLabel: string;
  name: string;
}

export interface PlanWarning {
  code: string;
  message: string;
  severityLabel: string;
  isWarning: boolean;
  detail: string | null;
  suggestion: string | null;
  affectedSlots: PlanWarningSlot[];
}

/** Tổng quan do backend tính — để hiển thị đúng mức nghiêm trọng mà không tự suy diễn. */
export interface PlanUserSummary {
  status: 'NO_SERIOUS_ISSUE' | 'ADVISORY_ADJUSTMENTS' | 'HARD_CONSTRAINT_BLOCKED';
  title: string;
  detail: string;
  suggestion: string | null;
}

/** Ước tính 4 chất sinh năng lượng/xơ; mỗi chỉ số `null` = chưa đủ dữ liệu (không phải 0). */
export interface EstimatedMacros {
  proteinGrams: number | null;
  fiberGrams: number | null;
  fatGrams: number | null;
  carbohydrateGrams: number | null;
}

export interface MealPlanDay {
  date: string;
  dateLabel: string;
  estimatedTotals: EstimatedMacros | null;
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
  userSummary: PlanUserSummary | null;
  days: MealPlanDay[];
  /** Mục tiêu ước tính mỗi ngày theo hồ sơ sức khỏe; null khi backend chưa trả. */
  estimatedTargets: EstimatedMacros | null;
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

/** Chọn tay một món (công thức hoặc bữa tự tạo) cho một ô của thực đơn. */
export interface ManualAddMealInput {
  planId: string;
  itemId: string;
  expectedVersion: number;
  idempotencyKey: string;
  sourceType: MealSourceType;
  recipeId?: string;
  customMealId?: string;
  servings?: number;
}
