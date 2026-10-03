/** DTO bữa ăn tự tạo — khớp OpenAPI backend (`CustomMealResponse`, `CustomMealListResponse`). */
export interface CustomMealPhotoDto {
  id?: string;
  assetId?: string;
  position?: number | string;
  secureUrl?: string;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface CustomMealIngredientDto {
  id?: string;
  position?: number | string;
  displayName?: string;
  amount?: number | string;
  unit?: string;
  resolutionStatus?: string;
  ingredientId?: string | null;
  ingredient?: { id?: string; canonicalName?: string } | null;
}

export interface CustomMealTagDto {
  tag?: string;
  normalizedTag?: string;
}

export interface CustomMealDto {
  id?: string;
  ownerId?: string;
  name?: string;
  notes?: string | null;
  servings?: number | string;
  sourceNote?: string | null;
  userCalories?: number | string | null;
  userProteinGrams?: number | string | null;
  userCarbsGrams?: number | string | null;
  userFatGrams?: number | string | null;
  userFiberGrams?: number | string | null;
  nutritionCoverage?: string;
  deletePolicy?: string;
  tags?: (CustomMealTagDto | string | null)[];
  photos?: (CustomMealPhotoDto | null)[];
  ingredients?: (CustomMealIngredientDto | null)[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomMealListResponseDto {
  success?: true;
  data?: {
    records?: (CustomMealDto | null)[];
    pagination?: {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
    };
  };
  meta?: null;
}

export interface CustomMealResponseDto {
  success?: true;
  data?: CustomMealDto;
  meta?: null;
}

export interface CreateCustomMealIngredientRequestDto {
  position?: number;
  displayName: string;
  amount: number;
  unit: string;
  ingredientId?: string;
}

export interface CreateCustomMealRequestDto {
  name: string;
  notes?: string | null;
  servings?: number;
  sourceNote?: string | null;
  userCalories?: number;
  userProteinGrams?: number;
  userCarbsGrams?: number;
  userFatGrams?: number;
  userFiberGrams?: number;
  deletePolicy?: 'BLOCK' | 'RETAIN_SNAPSHOT';
  ingredients?: CreateCustomMealIngredientRequestDto[];
  tags?: string[];
}

export type UpdateCustomMealRequestDto = Partial<CreateCustomMealRequestDto>;
