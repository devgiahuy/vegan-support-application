/**
 * Clean UI Models cho Custom Meals (Phase 17)
 * Dành riêng cho UI layer tiêu thụ
 */

export interface CustomMealPhoto {
  id: string;
  url: string;
  sortOrder: number;
  isCover: boolean;
  fileSizeBytes: number;
  mimeType: string;
  createdAt: string;
}

export interface CustomMealIngredientNutrients {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface CustomMealIngredient {
  id: string;
  ingredientId: string | null;
  name: string;
  quantity: number;
  unit: string;
  isCustom: boolean;
  calculatedNutrients: CustomMealIngredientNutrients | null;
}

export interface CustomMeal {
  id: string;
  ownerId: string;
  name: string;
  notes: string | null;
  servings: number;
  sourceNote: string | null;

  // Dinh dưỡng do người dùng tự nhập
  userCalories: number | null;
  userProtein: number | null;
  userCarbs: number | null;
  userFat: number | null;

  // Dinh dưỡng tính toán từ nguyên liệu chuẩn
  calculatedCalories: number | null;
  calculatedProtein: number | null;
  calculatedCarbs: number | null;
  calculatedFat: number | null;

  // Tỷ lệ bao phủ dinh dưỡng
  coverageRatio: number;
  isFullyCovered: boolean;
  unmatchedIngredientCount: number;

  tags: string[];
  photos: CustomMealPhoto[];
  coverPhoto: CustomMealPhoto | null;
  ingredients: CustomMealIngredient[];

  createdAt: string;
  updatedAt: string;
}

export interface CustomMealListItem {
  id: string;
  name: string;
  notes: string | null;
  servings: number;
  sourceNote: string | null;
  userCalories: number | null;
  calculatedCalories: number | null;
  coverageRatio: number;
  isFullyCovered: boolean;
  tags: string[];
  coverPhotoUrl: string | null;
  photoCount: number;
  ingredientCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserTagItem {
  name: string;
  count: number;
}

export interface CustomMealListResult {
  items: CustomMealListItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  availableTags: UserTagItem[];
}

export interface CustomMealPlanUsage {
  planItemId: string;
  planId: string;
  planTitle: string;
  date: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  servings: number;
}

export interface CustomMealDeleteCheckResult {
  canDelete: boolean;
  usages: CustomMealPlanUsage[];
  message: string;
}
