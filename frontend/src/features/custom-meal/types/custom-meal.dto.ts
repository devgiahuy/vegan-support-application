/**
 * DTOs cho Custom Meals (Phase 17)
 * Phản chiếu schema từ Backend OpenAPI
 */

export interface CustomMealPhotoDto {
  id?: string;
  url?: string;
  sortOrder?: number;
  isCover?: boolean;
  fileSizeBytes?: number;
  mimeType?: string;
  createdAt?: string;
}

export interface CustomMealIngredientNutrientsDto {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

export interface CustomMealIngredientDto {
  id?: string;
  ingredientId?: string | null;
  name?: string;
  quantity?: number;
  unit?: string;
  isCustom?: boolean;
  calculatedNutrients?: CustomMealIngredientNutrientsDto | null;
}

export interface CustomMealResponseDto {
  id: string;
  ownerId: string;
  name: string;
  notes?: string | null;
  servings?: number;
  sourceNote?: string | null;
  userCalories?: number | null;
  userProtein?: number | null;
  userCarbs?: number | null;
  userFat?: number | null;
  calculatedCalories?: number | null;
  calculatedProtein?: number | null;
  calculatedCarbs?: number | null;
  calculatedFat?: number | null;
  coverageRatio?: number;
  isFullyCovered?: boolean;
  unmatchedIngredientCount?: number;
  tags?: string[];
  photos?: CustomMealPhotoDto[];
  ingredients?: CustomMealIngredientDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomMealListItemDto {
  id: string;
  name: string;
  notes?: string | null;
  servings?: number;
  sourceNote?: string | null;
  userCalories?: number | null;
  calculatedCalories?: number | null;
  coverageRatio?: number;
  isFullyCovered?: boolean;
  tags?: string[];
  coverPhotoUrl?: string | null;
  photoCount?: number;
  ingredientCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomMealTagStatDto {
  name: string;
  count: number;
}

export interface CustomMealListResponseDto {
  items: CustomMealListItemDto[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  availableTags?: CustomMealTagStatDto[];
}

export interface CreateCustomMealIngredientRequestDto {
  ingredientId?: string | null;
  name: string;
  quantity: number;
  unit: string;
}

export interface CreateCustomMealRequestDto {
  name: string;
  notes?: string | null;
  servings?: number;
  sourceNote?: string | null;
  userCalories?: number | null;
  userProtein?: number | null;
  userCarbs?: number | null;
  userFat?: number | null;
  tags?: string[];
  ingredients?: CreateCustomMealIngredientRequestDto[];
}

export interface UpdateCustomMealPhotoOrderItemDto {
  photoId: string;
  sortOrder: number;
  isCover?: boolean;
}

export interface UpdateCustomMealRequestDto {
  name?: string;
  notes?: string | null;
  servings?: number;
  sourceNote?: string | null;
  userCalories?: number | null;
  userProtein?: number | null;
  userCarbs?: number | null;
  userFat?: number | null;
  tags?: string[];
  ingredients?: CreateCustomMealIngredientRequestDto[];
  photoOrder?: UpdateCustomMealPhotoOrderItemDto[];
}

export interface AttachMediaRequestDto {
  file: File;
  isCover?: boolean;
}

export interface CustomMealPlanUsageDto {
  planItemId?: string;
  planId?: string;
  planTitle?: string;
  date?: string;
  mealType?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  servings?: number;
}

export interface CustomMealInUseErrorDto {
  usages?: CustomMealPlanUsageDto[];
}
