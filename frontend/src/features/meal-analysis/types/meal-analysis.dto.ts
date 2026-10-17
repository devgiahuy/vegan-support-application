/**
 * DTO phân tích khẩu phần & độ tương thích thực đơn tuần (Phase 18).
 * Theo `backend/docs/prompts/phase-18-meal-analysis.md` và `specs/010-meal-analysis/contracts/meal-analysis-api.md`.
 * Cấm bọc 2 tầng APIResponse<> tại đây.
 */

export interface AffectedPlanItemDto {
  itemId?: string;
  item_id?: string;
  planItemId?: string;
  plan_item_id?: string;
  dishId?: string;
  dish_id?: string;
  dishType?: string;
  dish_type?: string;
  sourceType?: string;
  source_type?: string;
  dishName?: string;
  dish_name?: string;
  name?: string;
  servings?: number | string | null;
  date?: string;
  mealType?: string;
  meal_type?: string;
  ingredientId?: string | null;
  ingredient_id?: string | null;
  ingredientName?: string | null;
  ingredient_name?: string | null;
  amount?: number | string | null;
  unit?: string | null;
}

export interface SwapSuggestionDto {
  suggestedDishId?: string;
  suggested_dish_id?: string;
  dishType?: string;
  dish_type?: string;
  dishName?: string;
  dish_name?: string;
  coverImageUrl?: string | null;
  cover_image_url?: string | null;
  calories?: number | string | null;
  matchReason?: string;
  match_reason?: string;
  resolvesWarningCodes?: (string | null)[] | null;
  resolves_warning_codes?: (string | null)[] | null;
}

export interface MealWarningDto {
  id?: string;
  code?: string;
  title?: string;
  severity?: string;
  scope?: string;
  targetDate?: string;
  target_date?: string;
  mealType?: string | null;
  meal_type?: string | null;
  evidenceGrade?: string;
  evidence_grade?: string;
  evidenceSource?: string;
  evidence_source?: string;
  source?: {
    code?: string;
    name?: string;
    version?: string;
    recordId?: string;
    url?: string | null;
  } | null;
  ruleVersion?: string;
  rule_version?: string;
  confidence?: number | string | null;
  measured?: { value?: number | string; unit?: string } | null;
  limit?: { value?: number | string; unit?: string } | null;
  measuredValue?: number | string | null;
  measured_value?: number | string | null;
  limitValue?: number | string | null;
  limit_value?: number | string | null;
  unit?: string | null;
  excessPercent?: number | string | null;
  excess_percent?: number | string | null;
  explanation?: string;
  suggestedAdjustment?: string | null;
  suggested_adjustment?: string | null;
  detail?: string;
  suggestion?: string | null;
  severityLabel?: string;
  severity_label?: string;
  scopeLabel?: string;
  scope_label?: string;
  targetComparison?: 'ABOVE' | 'BELOW' | string | null;
  target_comparison?: 'ABOVE' | 'BELOW' | string | null;
  advisory?: boolean;
  incompleteDataNotes?: string[] | string | null;
  incomplete_data_notes?: string[] | string | null;
  affectedItems?: AffectedPlanItemDto[] | null;
  affected_items?: AffectedPlanItemDto[] | null;
  affectedIngredients?: Array<{ ingredientId?: string; name?: string }> | null;
  suggestedSwaps?: SwapSuggestionDto[] | null;
  suggested_swaps?: SwapSuggestionDto[] | null;
}

export interface AnalysisSummaryDto {
  totalWarnings?: number | string;
  total_warnings?: number | string;
  dangerCount?: number | string;
  danger_count?: number | string;
  highCount?: number | string;
  high_count?: number | string;
  warningCount?: number | string;
  warning_count?: number | string;
  cautionCount?: number | string;
  caution_count?: number | string;
  infoCount?: number | string;
  info_count?: number | string;
  selectedItemCount?: number | string;
  selected_item_count?: number | string;
  userStatus?: string;
  user_status?: string;
  title?: string;
  detail?: string;
  advisoryCount?: number | string;
  advisory_count?: number | string;
  hardConstraintViolationCount?: number | string;
  hard_constraint_violation_count?: number | string;
  hardConstraintsPreserved?: boolean;
  hard_constraints_preserved?: boolean;
  dailyLimitViolations?: number | string;
  daily_limit_violations?: number | string;
  compatibilityViolations?: number | string;
  compatibility_violations?: number | string;
  sameDishCount?: number | string;
  same_dish_count?: number | string;
  sameMealCount?: number | string;
  same_meal_count?: number | string;
  sameDayCount?: number | string;
  same_day_count?: number | string;
}

export interface MacroTargetsDto {
  proteinGrams?: number | null;
  fiberGrams?: number | null;
  fatGrams?: number | null;
  carbohydrateGrams?: number | null;
}

export interface DayEstimatedNutritionDto {
  date?: string;
  totals?: {
    proteinGrams?: number | null;
    fiberGrams?: number | null;
    fatGrams?: number | null;
    carbohydrateGrams?: number | null;
  };
  confidence?: number;
  uncertaintyNotes?: string[];
}

export interface EstimatedNutritionAnalysisDto {
  estimated?: boolean;
  targetSource?: string;
  target_source?: string;
  targetSourceDetail?: string;
  target_source_detail?: string;
  tolerancePercent?: number;
  tolerance_percent?: number;
  targets?: MacroTargetsDto;
  days?: DayEstimatedNutritionDto[];
}

export interface MealPlanAnalysisResponseDto {
  id?: string;
  mealPlanId?: string;
  meal_plan_id?: string;
  version?: number | string;
  analysisVersion?: number | string;
  analysis_version?: number | string;
  planVersion?: number | string;
  planLockVersion?: number | string;
  plan_lock_version?: number | string;
  status?: 'CURRENT' | 'STALE' | string;
  algorithmVersion?: string;
  algorithm_version?: string;
  analyzedItemIds?: string[] | null;
  analyzedAt?: string;
  analyzed_at?: string;
  createdAt?: string;
  created_at?: string;
  confidence?: number | string | null;
  overallConfidence?: number | string | null;
  overall_confidence?: number | string | null;
  incompleteData?: string[] | null;
  hasIncompleteData?: boolean;
  has_incomplete_data?: boolean;
  incompleteDataNotes?: string | string[] | null;
  incomplete_data_notes?: string | string[] | null;
  ruleVersions?: string[] | null;
  disclaimer?: string | null;
  summary?: AnalysisSummaryDto | null;
  warnings?: MealWarningDto[] | null;
  estimatedNutrition?: EstimatedNutritionAnalysisDto | null;
}

/** Payload gửi lên `POST /meal-plans/:id/analyze` */
export interface AnalyzeMealPlanRequestDto {
  expectedPlanVersion: number;
  items?: Array<{ itemId: string; servings?: number }>;
}
