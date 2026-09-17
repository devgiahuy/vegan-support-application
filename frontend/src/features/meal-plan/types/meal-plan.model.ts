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
  recipeId: string;
  recipeTitle: string;
  calories: number;
  formattedCalories: string;
  protein: number;
  carbs: number;
  fat: number;
  servings: number;
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
  shoppingList: ShoppingListItem[];
  warnings: PlanWarning[];
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
