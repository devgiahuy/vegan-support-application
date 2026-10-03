/** DTO phân tích thực đơn — khớp OpenAPI backend (`MealPlanAnalysis`). */
export interface MealAnalysisRequestDto {
  expectedPlanVersion: number;
  items?: {
    itemId: string;
    servings?: number;
  }[];
}

export interface MealWarningAffectedItemDto {
  itemId?: string;
  date?: string;
  mealType?: string;
  sourceType?: string;
  name?: string;
  servings?: number | string | null;
}

export interface MealWarningDto {
  id?: string;
  code?: string;
  title?: string;
  detail?: string;
  suggestion?: string;
  severity?: string;
  severityLabel?: string;
  scope?: string;
  scopeLabel?: string;
  targetDate?: string;
  mealType?: string | null;
  targetComparison?: string | null;
  evidenceGrade?: string;
  source?: {
    code?: string;
    name?: string;
    version?: string;
    recordId?: string;
    url?: string | null;
  } | null;
  measured?: { value?: number | string; unit?: string } | null;
  limit?: { value?: number | string; unit?: string } | null;
  explanation?: string;
  suggestedAdjustment?: string | null;
  confidence?: number | string | null;
  advisory?: boolean;
  incompleteDataNotes?: (string | null)[] | null;
  affectedItems?: (MealWarningAffectedItemDto | null)[] | null;
  affectedIngredients?: ({ ingredientId?: string; name?: string } | null)[] | null;
}

export interface MealAnalysisSummaryDto {
  warningCount?: number | string;
  highCount?: number | string;
  cautionCount?: number | string;
  infoCount?: number | string;
  selectedItemCount?: number | string;
  userStatus?: string;
  title?: string;
  detail?: string;
  advisoryCount?: number | string;
  hardConstraintViolationCount?: number | string;
  hardConstraintsPreserved?: boolean;
}

export interface MealAnalysisEstimatedNutritionDto {
  estimated?: boolean;
  targetSource?: string;
  targetSourceDetail?: string;
  tolerancePercent?: number | string;
  targets?: {
    proteinGrams?: number | string | null;
    fiberGrams?: number | string | null;
    fatGrams?: number | string | null;
    carbohydrateGrams?: number | string | null;
  } | null;
}

export interface MealAnalysisDto {
  id?: string;
  mealPlanId?: string;
  version?: number | string;
  status?: string;
  algorithmVersion?: string;
  planVersion?: number | string;
  analyzedItemIds?: (string | null)[] | null;
  warnings?: (MealWarningDto | null)[] | null;
  summary?: MealAnalysisSummaryDto | null;
  confidence?: number | string | null;
  incompleteData?: (string | null)[] | null;
  estimatedNutrition?: MealAnalysisEstimatedNutritionDto | null;
  ruleVersions?: (string | null)[] | null;
  disclaimer?: string;
  createdAt?: string;
}

export interface MealAnalysisResponseDto {
  success?: boolean;
  data?: MealAnalysisDto | null;
  meta?: null;
}
