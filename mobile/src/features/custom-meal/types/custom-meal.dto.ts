export interface CustomMealPhotoDto {
  id?: string;
  url?: string;
  secureUrl?: string;
  sortOrder?: number | string;
  position?: number | string;
  isCover?: boolean;
  fileSizeBytes?: number | string;
  mimeType?: string;
  createdAt?: string;
}

export interface CustomMealIngredientDto {
  id?: string;
  ingredientId?: string | null;
  name?: string;
  displayName?: string;
  quantity?: number | string;
  amount?: number | string;
  unit?: string;
  isCustom?: boolean;
}

export interface CustomMealDto {
  id?: string;
  ownerId?: string;
  name?: string;
  notes?: string | null;
  servings?: number | string;
  sourceNote?: string | null;
  userCalories?: number | string | null;
  userProtein?: number | string | null;
  userProteinGrams?: number | string | null;
  userCarbs?: number | string | null;
  userCarbsGrams?: number | string | null;
  userFat?: number | string | null;
  userFatGrams?: number | string | null;
  calculatedCalories?: number | string | null;
  coverageRatio?: number | string;
  isFullyCovered?: boolean;
  unmatchedIngredientCount?: number | string;
  tags?: string[];
  photos?: CustomMealPhotoDto[];
  coverPhotoUrl?: string | null;
  photoCount?: number | string;
  ingredientCount?: number | string;
  ingredients?: CustomMealIngredientDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomMealTagDto {
  name?: string;
  count?: number | string;
}

export interface CustomMealListResponseDto {
  success?: true;
  data?: {
    records?: CustomMealDto[];
    items?: CustomMealDto[];
    pagination?: {
      page?: number;
      limit?: number;
      total?: number;
      totalItems?: number;
      totalPages?: number;
    };
    availableTags?: CustomMealTagDto[];
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalItems?: number;
    totalPages?: number;
  } | null;
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
  ingredientId?: string | null;
}

export interface CreateCustomMealRequestDto {
  name: string;
  notes?: string | null;
  servings?: number;
  sourceNote?: string | null;
  userCalories?: number | null;
  userProteinGrams?: number | null;
  userCarbsGrams?: number | null;
  userFatGrams?: number | null;
  deletePolicy?: 'BLOCK' | 'RETAIN_SNAPSHOT';
  ingredients?: CreateCustomMealIngredientRequestDto[];
  tags?: string[];
}

export type UpdateCustomMealRequestDto = Partial<CreateCustomMealRequestDto>;

