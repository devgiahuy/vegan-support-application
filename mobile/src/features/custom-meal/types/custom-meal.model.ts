export interface CustomMealPhoto {
  id: string;
  url: string;
  sortOrder: number;
  isCover: boolean;
  mimeType: string;
}

export type IngredientResolutionStatus = 'EXACT' | 'AMBIGUOUS' | 'UNKNOWN';

export interface CustomMealIngredient {
  id: string;
  ingredientId: string | null;
  displayName: string;
  /** Tên nguyên liệu chuẩn khi đã liên kết danh mục; null khi là tên tự nhập. */
  canonicalName: string | null;
  resolutionStatus: IngredientResolutionStatus;
  amount: number;
  unit: string;
}

export interface CustomMeal {
  id: string;
  name: string;
  notes: string | null;
  servings: number;
  sourceNote: string | null;
  /** Dinh dưỡng do người dùng tự nhập; `null` = chưa nhập (không phải 0). */
  calories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
  fiberGrams: number | null;
  /** Mức bao phủ dữ liệu dinh dưỡng của backend (`COMPLETE`/`PARTIAL`/...). */
  nutritionCoverage: string;
  nutritionCoverageLabel: string;
  tags: string[];
  photos: CustomMealPhoto[];
  coverPhotoUrl: string | null;
  photoCount: number;
  ingredientCount: number;
  /** Số nguyên liệu chưa liên kết được với danh mục chuẩn. */
  unlinkedIngredientCount: number;
  ingredients: CustomMealIngredient[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomMealListResult {
  items: CustomMeal[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface CustomMealFormValues {
  name: string;
  notes: string;
  servings: number;
  sourceNote: string;
  userCalories: number | null;
  userProteinGrams: number | null;
  userCarbsGrams: number | null;
  userFatGrams: number | null;
  userFiberGrams: number | null;
  tags: string[];
  ingredients: CustomMealIngredient[];
}
