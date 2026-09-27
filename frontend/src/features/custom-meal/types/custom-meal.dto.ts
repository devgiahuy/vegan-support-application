/**
 * DTOs cho Custom Meals (Phase 17)
 * Phản chiếu chính xác schema từ Backend OpenAPI và Zod validation
 */

export interface CustomMealPhotoDto {
  id?: string;
  assetId?: string;
  position?: number;
  secureUrl?: string;
  url?: string;
  sortOrder?: number;
  isCover?: boolean;
  fileSizeBytes?: number;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
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
  position?: number;
  displayName?: string;
  amount?: number;
  unit?: string;
  resolutionStatus?: 'RESOLVED' | 'UNRESOLVED';
  ingredientId?: string | null;
  ingredient?: {
    id: string;
    canonicalName: string;
  } | null;
  // Fallback alias cho frontend mapper
  name?: string;
  quantity?: number;
  isCustom?: boolean;
  calculatedNutrients?: CustomMealIngredientNutrientsDto | null;
}

export interface CustomMealTagDto {
  tag?: string;
  normalizedTag?: string;
}

export interface CustomMealResponseDto {
  id: string;
  ownerId: string;
  name: string;
  notes?: string | null;
  servings?: number;
  sourceNote?: string | null;
  userCalories?: number | null;
  userProteinGrams?: number | null;
  userCarbsGrams?: number | null;
  userFatGrams?: number | null;
  // Fallback alias
  userProtein?: number | null;
  userCarbs?: number | null;
  userFat?: number | null;
  calculatedCalories?: number | null;
  calculatedProtein?: number | null;
  calculatedCarbs?: number | null;
  calculatedFat?: number | null;
  nutritionCoverage?: string;
  coverageRatio?: number;
  isFullyCovered?: boolean;
  unmatchedIngredientCount?: number;
  deletePolicy?: 'BLOCK' | 'RETAIN_SNAPSHOT';
  tags?: Array<string | CustomMealTagDto>;
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
  userProteinGrams?: number | null;
  userCarbsGrams?: number | null;
  userFatGrams?: number | null;
  calculatedCalories?: number | null;
  nutritionCoverage?: string;
  coverageRatio?: number;
  isFullyCovered?: boolean;
  tags?: Array<string | CustomMealTagDto>;
  photos?: CustomMealPhotoDto[];
  coverPhotoUrl?: string | null;
  photoCount?: number;
  ingredientCount?: number;
  ingredients?: CustomMealIngredientDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomMealTagStatDto {
  name: string;
  count: number;
}

export interface CustomMealListResponseDto {
  records?: CustomMealResponseDto[];
  items?: CustomMealListItemDto[];
  pagination: {
    page: number;
    limit: number;
    total?: number;
    totalItems?: number;
    totalPages: number;
  };
  availableTags?: CustomMealTagStatDto[];
}

export interface CreateCustomMealIngredientRequestDto {
  position: number;
  displayName: string;
  amount: number;
  unit: string;
  ingredientId?: string; // Không gửi nếu null/undefined để tránh lỗi Zod strict
}

export interface CreateCustomMealRequestDto {
  name: string;
  notes?: string;
  servings?: number;
  sourceNote?: string;
  userCalories?: number;
  userProteinGrams?: number;
  userCarbsGrams?: number;
  userFatGrams?: number;
  deletePolicy?: 'BLOCK' | 'RETAIN_SNAPSHOT';
  tags?: string[];
  ingredients: CreateCustomMealIngredientRequestDto[];
}

export interface UpdateCustomMealRequestDto {
  name?: string;
  notes?: string | null;
  servings?: number;
  sourceNote?: string | null;
  userCalories?: number | null;
  userProteinGrams?: number | null;
  userCarbsGrams?: number | null;
  userFatGrams?: number | null;
  deletePolicy?: 'BLOCK' | 'RETAIN_SNAPSHOT';
  tags?: string[];
  ingredients?: CreateCustomMealIngredientRequestDto[];
}

export interface AttachCustomMealPhotoRequestDto {
  assetId: string;
  position?: number;
}

export interface ReorderCustomMealPhotosRequestDto {
  orderedAssetIds: string[];
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
