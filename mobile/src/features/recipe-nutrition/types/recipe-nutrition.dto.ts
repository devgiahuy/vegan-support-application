/** DTO dinh dưỡng công thức theo cách nấu — khớp OpenAPI backend (`RecipeNutritionEstimateResponse`). */
export interface NutrientValueDto {
  nutrientCode?: string;
  nutrientName?: string;
  unit?: string;
  amount?: number | string | null;
  origin?: string;
  confidence?: number | string | null;
  min?: number | string | null;
  max?: number | string | null;
}

export interface NutritionAssumptionDto {
  code?: string;
  message?: string;
  origin?: string;
}

export interface NutritionSourceVersionDto {
  sourceCode?: string;
  sourceVersion?: string;
  sourceRecordId?: string;
  kind?: string;
}

export interface UncoveredIngredientDto {
  recipeIngredientId?: string | null;
  position?: number | string;
  displayName?: string;
  reason?: string;
}

export interface RecipeNutritionEstimateDto {
  id?: string | null;
  revisionId?: string;
  postId?: string;
  postVersion?: number | string;
  estimateVersion?: number | string | null;
  status?: string | null;
  stale?: boolean;
  calculationVersion?: string;
  servings?: number | string;
  totalRawGrams?: number | string;
  totalCookedGrams?: number | string;
  totalNutrients?: (NutrientValueDto | null)[] | null;
  perServingNutrients?: (NutrientValueDto | null)[] | null;
  uncoveredIngredients?: (UncoveredIngredientDto | null)[] | null;
  sourceVersions?: (NutritionSourceVersionDto | null)[] | null;
  assumptions?: (NutritionAssumptionDto | null)[] | null;
  confidence?: number | string | null;
  ai?: {
    used?: boolean;
    provider?: string | null;
    modelId?: string | null;
    status?: string | null;
    providerDown?: boolean;
  } | null;
  disclaimer?: string;
  createdAt?: string | null;
}

export interface RecipeNutritionEstimateResponseDto {
  success?: boolean;
  data?: RecipeNutritionEstimateDto | null;
  meta?: null;
}

export interface RecipeNutritionStatusResponseDto {
  success?: boolean;
  data?: {
    postId?: string;
    revisionId?: string;
    currentEstimateId?: string | null;
    currentStatus?: string | null;
    stale?: boolean;
    latestAiJob?: {
      id?: string;
      provider?: string;
      modelId?: string;
      status?: string;
      errorCode?: string | null;
      startedAt?: string;
      completedAt?: string | null;
    } | null;
  } | null;
}

export interface RecipeNutritionHistoryResponseDto {
  success?: boolean;
  data?: (RecipeNutritionEstimateDto | null)[] | null;
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number } | null;
}

/** Body `POST /posts/:id/nutrition/preview`. */
export interface RecipeNutritionPreviewRequestDto {
  useAiFallback: boolean;
}

/** Body `POST /posts/:id/nutrition/recalculate`. */
export interface RecipeNutritionRecalculateRequestDto {
  useAiFallback: boolean;
  expectedPostVersion?: number;
}
