import type { MealPlanGoal, MealType, NutritionDataQuality } from '@/common/enums';

/** Ô bữa trong thực đơn tuần. */
export interface MealSlot {
  /** `itemId` dùng cho swap. */
  id: string;
  date: string;
  mealType: MealType;
  mealTypeLabel: string;
  filled: boolean;
  unfilledReason: string | null;
  unresolvedCode: string | null;
  recipeId: string;
  recipeTitle: string;
  sourceType: 'RECIPE' | 'CUSTOM_MEAL';
  isCustomMeal: boolean;
  customMealId: string | null;
  customMealName: string | null;
  customMealCoverage: string | null;
  calories: number;
  formattedCalories: string;
  protein: number;
  carbs: number;
  fat: number;
  servings: number;
}

export interface DayEstimatedTotals {
  proteinGrams: number | null;
  fiberGrams: number | null;
  fatGrams: number | null;
  carbohydrateGrams: number | null;
  estimated: boolean;
  confidence: number;
  uncertaintyNotes: string[];
}

export interface MealPlanDay {
  date: string;
  dayOfWeek: string;
  dayOfWeekLabel: string;
  slots: {
    breakfast: MealSlot | null;
    lunch: MealSlot | null;
    dinner: MealSlot | null;
  };
  estimatedTotals: DayEstimatedTotals | null;
}

export interface EstimatedNutritionTargets {
  proteinGrams: number | null;
  fiberGrams: number | null;
  fatGrams: number | null;
  carbohydrateGrams: number | null;
  estimated: boolean;
  source: string;
  sourceDetail: string;
  tolerancePercent: number;
}

export interface PlanWarningAffectedSlot {
  itemId?: string;
  date: string;
  mealType: string;
}

export interface PlanWarningDetail {
  code: string;
  severity: string;
  severityLabel: string;
  title: string;
  detail: string;
  suggestion: string | null;
  affectedSlots: PlanWarningAffectedSlot[];
}

export interface PlanUserSummary {
  status: string;
  title: string;
  detail: string;
  suggestion: string | null;
  hardConstraintsPreserved: boolean;
}

/** Dòng danh sách đi chợ đã gộp. */
export interface ShoppingListItem {
  ingredientId: string | null;
  name: string;
  quantity: number;
  unit: string;
  /** Chuỗi hiển thị ghép sẵn, vd "300 g Cà rốt". */
  displayLine: string;
}

/** Cảnh báo của thực đơn: mã gốc + diễn giải tiếng Việt. */
export interface PlanWarning {
  code: string;
  message: string;
}

/**
 * Thực đơn tuần dùng cho UI. List-item có `items`/`shoppingList` rỗng
 * (backend chỉ trả summary); detail có đủ 21 slots.
 */
export interface MealPlan {
  id: string;
  /** `YYYY-MM-DD`, luôn là Thứ Hai. */
  weekStart: string;
  formattedWeekRange: string;
  goal: MealPlanGoal;
  goalLabel: string;
  targetCalories: number;
  /** Dùng làm `expectedVersion` cho swap/delete. */
  version: number;
  lockVersion: number;
  supersedesMealPlanId: string | null;
  filledSlots: number;
  totalSlots: number;
  items: MealSlot[];
  days: MealPlanDay[];
  estimatedNutritionTargets: EstimatedNutritionTargets | null;
  shoppingList: ShoppingListItem[];
  warnings: PlanWarning[];
  warningDetails: PlanWarningDetail[];
  userSummary: PlanUserSummary | null;
  nutritionDataQuality: NutritionDataQuality;
  nutritionDataQualityLabel: string;
  vitaminB12Mcg: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** Tham số query danh sách phiên bản. */
export interface MealPlanListQueryParams {
  page?: number;
  limit?: number;
  weekStart?: string;
}

/** Input tạo thực đơn (client sinh `idempotencyKey` trước khi gửi). */
export interface GenerateMealPlanInput {
  weekStart: string;
  goal: MealPlanGoal;
  idempotencyKey: string;
  seed?: string;
  supersedesMealPlanId?: string;
}
