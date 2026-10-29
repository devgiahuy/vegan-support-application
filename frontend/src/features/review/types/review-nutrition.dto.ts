/**
 * DTO thô của panel dinh dưỡng cho người duyệt công thức
 * GET/PATCH /api/v1/admin/content-review/:revisionId/nutrition
 * POST /api/v1/admin/content-review/:revisionId/nutrition/recalculate
 */

export interface ReviewNutritionActorDto {
  id?: string;
  displayName?: string;
  role?: string;
}

export interface ReviewNutritionMetricDto {
  metric?: string;
  unit?: string;
  estimate?: {
    value?: number | null;
    partialValue?: number | null;
    origin?: string | null;
    confidence?: number | null;
  } | null;
  override?: {
    value?: number;
    updatedBy?: ReviewNutritionActorDto | null;
    updatedAt?: string;
  } | null;
  /** Số tác giả tự nhập (USER_PROVIDED), null khi để trống */
  author?: number | null;
  deviationPercent?: number | null;
  deviationWarning?: boolean;
  finalValue?: number | null;
  finalOrigin?: string | null;
}

export interface ReviewNutritionUncoveredDto {
  position?: number;
  displayName?: string;
  reason?: string;
  missingMetrics?: string[];
  aiEstimated?: boolean;
}

export interface ReviewNutritionJobDto {
  id?: string;
  state?: string;
  trigger?: string | null;
  attemptCount?: number;
  maxAttempts?: number;
  nextAttemptAt?: string | null;
  errorCode?: string | null;
  startedAt?: string;
  completedAt?: string | null;
  updatedAt?: string;
}

export interface ReviewNutritionMetricValuesDto {
  calories?: number | null;
  proteinGrams?: number | null;
  carbsGrams?: number | null;
  fatGrams?: number | null;
  fiberGrams?: number | null;
}

export interface ReviewNutritionAuditDto {
  id?: string;
  metric?: string;
  action?: string;
  previousValue?: number | null;
  previousOrigin?: string | null;
  newValue?: number | null;
  newOrigin?: string | null;
  reason?: string | null;
  actor?: ReviewNutritionActorDto | null;
  createdAt?: string;
}

export interface ReviewNutritionPanelDto {
  revisionId?: string;
  postId?: string;
  revisionVersion?: number;
  revisionStatus?: string;
  servings?: number;
  canEdit?: boolean;
  canApprove?: boolean;
  missingMetrics?: string[];
  metrics?: ReviewNutritionMetricDto[];
  estimate?: {
    id?: string;
    version?: number;
    confidence?: number;
    aiUsed?: boolean;
    calculationVersion?: string;
    disclaimer?: string;
    createdAt?: string;
  } | null;
  uncoveredIngredients?: ReviewNutritionUncoveredDto[];
  aiJob?: ReviewNutritionJobDto | null;
  previousApproved?: {
    revisionId?: string;
    revisionVersion?: number;
    reviewedAt?: string | null;
    values?: ReviewNutritionMetricValuesDto;
    overriddenMetrics?: string[];
  } | null;
  audit?: ReviewNutritionAuditDto[];
}

export interface ReviewNutritionPanelResponseDto {
  success: boolean;
  data: ReviewNutritionPanelDto;
  meta: null;
}

/** null xoá giá trị sửa tay, số đặt giá trị sửa tay, bỏ key = giữ nguyên */
export interface ReviewNutritionOverrideRequestDto {
  values: ReviewNutritionMetricValuesDto;
  reason?: string;
}
