export interface MealAnalysisRequestDto {
  expectedPlanVersion: number;
  items?: {
    itemId: string;
    servings?: number;
  }[];
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
  source?: string;
  confidence?: number | string | null;
  measured?: number | string | null;
  measuredValue?: number | string | null;
  measured_value?: number | string | null;
  limit?: number | string | null;
  limitValue?: number | string | null;
  limit_value?: number | string | null;
  unit?: string | null;
  explanation?: string;
  suggestedAdjustment?: string | null;
  suggested_adjustment?: string | null;
  advisory?: string | null;
  affectedItems?: {
    planItemId?: string;
    itemId?: string;
    dishName?: string;
    dish_name?: string;
  }[];
  affected_items?: {
    planItemId?: string;
    itemId?: string;
    dishName?: string;
    dish_name?: string;
  }[];
  affectedIngredients?: (string | null)[] | null;
  affected_ingredients?: (string | null)[] | null;
}

export interface MealAnalysisSummaryDto {
  warningCount?: number | string;
  warning_count?: number | string;
  highCount?: number | string;
  high_count?: number | string;
  cautionCount?: number | string;
  caution_count?: number | string;
  infoCount?: number | string;
  info_count?: number | string;
  selectedItemCount?: number | string;
  selected_item_count?: number | string;
  totalWarnings?: number | string;
  total_warnings?: number | string;
  dangerCount?: number | string;
  danger_count?: number | string;
}

export interface MealAnalysisDto {
  id?: string;
  mealPlanId?: string;
  meal_plan_id?: string;
  version?: number | string;
  status?: string;
  algorithmVersion?: string;
  algorithm_version?: string;
  planVersion?: number | string;
  plan_version?: number | string;
  planLockVersion?: number | string;
  plan_lock_version?: number | string;
  analysisVersion?: number | string;
  analysis_version?: number | string;
  analyzedItemIds?: (string | null)[] | null;
  analyzed_item_ids?: (string | null)[] | null;
  warnings?: MealWarningDto[] | null;
  summary?: MealAnalysisSummaryDto | null;
  confidence?: number | string | null;
  overallConfidence?: number | string | null;
  overall_confidence?: number | string | null;
  incompleteData?: (string | null)[] | null;
  incomplete_data?: (string | null)[] | null;
  hasIncompleteData?: boolean;
  has_incomplete_data?: boolean;
  incompleteDataNotes?: string | null;
  incomplete_data_notes?: string | null;
  ruleVersions?: (string | null)[] | null;
  rule_versions?: (string | null)[] | null;
  disclaimer?: string;
  createdAt?: string;
  created_at?: string;
  analyzedAt?: string;
  analyzed_at?: string;
}

export interface MealAnalysisResponseDto {
  success?: boolean;
  data?: MealAnalysisDto | null;
  meta?: null;
}
