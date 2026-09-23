/**
 * DTO phân tích khẩu phần & độ tương thích thực đơn tuần (Phase 18).
 * Theo `backend/docs/prompts/phase-18-meal-analysis.md` và `specs/010-meal-analysis/contracts/meal-analysis-api.md`.
 * Cấm bọc 2 tầng APIResponse<> tại đây.
 */

export interface AffectedPlanItemDto {
  planItemId?: string;
  plan_item_id?: string;
  dishId?: string;
  dish_id?: string;
  dishType?: string;
  dish_type?: string;
  dishName?: string;
  dish_name?: string;
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
  ruleVersion?: string;
  rule_version?: string;
  confidence?: number | string | null;
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
  affectedItems?: AffectedPlanItemDto[] | null;
  affected_items?: AffectedPlanItemDto[] | null;
  suggestedSwaps?: SwapSuggestionDto[] | null;
  suggested_swaps?: SwapSuggestionDto[] | null;
}

export interface AnalysisSummaryDto {
  totalWarnings?: number | string;
  total_warnings?: number | string;
  dangerCount?: number | string;
  danger_count?: number | string;
  warningCount?: number | string;
  warning_count?: number | string;
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

export interface MealPlanAnalysisResponseDto {
  id?: string;
  mealPlanId?: string;
  meal_plan_id?: string;
  planLockVersion?: number | string;
  plan_lock_version?: number | string;
  analysisVersion?: number | string;
  analysis_version?: number | string;
  analyzedAt?: string;
  analyzed_at?: string;
  overallConfidence?: number | string | null;
  overall_confidence?: number | string | null;
  hasIncompleteData?: boolean;
  has_incomplete_data?: boolean;
  incompleteDataNotes?: string | null;
  incomplete_data_notes?: string | null;
  summary?: AnalysisSummaryDto | null;
  warnings?: MealWarningDto[] | null;
}
