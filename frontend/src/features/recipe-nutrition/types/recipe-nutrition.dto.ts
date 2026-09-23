export type NutritionValueOriginDto =
  'CANONICAL_CALCULATED' | 'AI_ESTIMATED' | 'USER_PROVIDED' | 'VERIFIED_OVERRIDE';

export type RecipeNutritionEstimateStatusDto = 'CURRENT' | 'HISTORICAL' | 'STALE';

export type AiRequestStatusDto = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface NutrientAmountDto {
  nutrientCode: string;
  nutrientName: string;
  unit: string;
  amount: number;
  origin: NutritionValueOriginDto;
  confidence: number;
  min: number | null;
  max: number | null;
}

export interface SourceVersionDto {
  sourceCode: string;
  sourceVersion: string;
  sourceRecordId: string;
  kind: string;
}

export interface AssumptionDto {
  code: string;
  message: string;
  origin: NutritionValueOriginDto;
}

export interface UncoveredIngredientDto {
  recipeIngredientId: string | null;
  position: number;
  displayName: string;
  reason: string;
}

export interface EstimateLineDto {
  id: string | null;
  recipeIngredientId: string | null;
  ingredientId: string | null;
  position: number;
  displayName: string;
  origin: NutritionValueOriginDto;
  normalizedRawGrams: number | null;
  edibleRawGrams: number | null;
  yieldFactor: number | null;
  cookedGrams: number | null;
  nutrients: NutrientAmountDto[];
  sourceVersions: SourceVersionDto[];
  assumptions: AssumptionDto[];
  confidence: number;
  uncertainty: Record<string, unknown>;
  uncoveredReason: string | null;
}

export interface RecipeNutritionAiInfoDto {
  used: boolean;
  provider: string | null;
  modelId: string | null;
  status: AiRequestStatusDto | null;
  providerDown: boolean;
}

export interface RecipeNutritionEstimateDto {
  id: string | null;
  revisionId: string;
  postId: string;
  postVersion: number;
  estimateVersion: number | null;
  status: RecipeNutritionEstimateStatusDto | null;
  stale: boolean;
  calculationVersion: 'recipe-nutrition-v1';
  recipeFingerprint: string;
  servings: number;
  totalRawGrams: number;
  totalCookedGrams: number;
  totalNutrients: NutrientAmountDto[];
  perServingNutrients: NutrientAmountDto[];
  lines: EstimateLineDto[];
  uncoveredIngredients: UncoveredIngredientDto[];
  sourceVersions: SourceVersionDto[];
  assumptions: AssumptionDto[];
  confidence: number;
  uncertainty: Record<string, unknown>;
  ai: RecipeNutritionAiInfoDto;
  disclaimer: string;
  createdAt: string | null;
}

export interface RecipeNutritionStatusDto {
  postId: string;
  revisionId: string;
  currentEstimateId: string | null;
  currentStatus: RecipeNutritionEstimateStatusDto | null;
  stale: boolean;
  latestAiJob: {
    id: string;
    provider: string;
    modelId: string;
    status: AiRequestStatusDto;
    errorCode: string | null;
    startedAt: string;
    completedAt: string | null;
  } | null;
}

export interface PaginationMetaDto {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface RecipeNutritionEstimateResponseDto {
  success: true;
  data: RecipeNutritionEstimateDto;
  meta: null;
}

export interface RecipeNutritionHistoryResponseDto {
  success: true;
  data: RecipeNutritionEstimateDto[];
  meta: PaginationMetaDto;
}

export interface RecipeNutritionStatusResponseDto {
  success: true;
  data: RecipeNutritionStatusDto;
  meta: null;
}

export interface RecipeNutritionPreviewRequestDto {
  useAiFallback?: boolean;
}

export interface RecipeNutritionRecalculateRequestDto {
  useAiFallback?: boolean;
  expectedPostVersion?: number;
}
