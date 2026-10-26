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

export type NutritionMetric = 'calories' | 'proteinGrams' | 'carbsGrams' | 'fatGrams' | 'fiberGrams';

/** Nguồn của một chỉ số: người dùng nhập, tính từ dữ liệu chuẩn, hoặc AI ước tính (chưa xác minh). */
export type NutritionOrigin = 'USER_PROVIDED' | 'CANONICAL_CALCULATED' | 'AI_ESTIMATED';

/** Chỉ các giá trị người dùng tự nhập (null = không có override nhập tay). */
export interface ManualNutrition {
  calories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
  fiberGrams: number | null;
}

export interface CustomMeal {
  id: string;
  name: string;
  notes: string | null;
  servings: number;
  sourceNote: string | null;
  /**
   * Giá trị đang hiển thị của cả món; `null` = chưa có dữ liệu (không phải 0). Có thể là số tự tính hoặc
   * AI ước tính — xem `nutritionOrigins`. KHÔNG dùng để điền lại form (xem `manual`).
   */
  calories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
  fiberGrams: number | null;
  /** Mức bao phủ dữ liệu dinh dưỡng của backend (`COMPLETE`/`PARTIAL`/...). */
  nutritionCoverage: string;
  nutritionCoverageLabel: string;
  /** Chỉ phần người dùng tự nhập; dùng để điền form sửa, tránh biến số tự tính thành override nhập tay. */
  manual: ManualNutrition;
  /** Nguồn từng chỉ số do BE báo; thiếu = không rõ. */
  nutritionOrigins: Partial<Record<NutritionMetric, NutritionOrigin>>;
  /** Có chỉ số do AI ước tính (chưa được xác minh). */
  hasAiEstimate: boolean;
  /** Giả định/độ không chắc chắn/lưu ý để người dùng hiểu số liệu. */
  nutritionNotes: string[];
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
