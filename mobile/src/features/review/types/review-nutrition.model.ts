export enum ReviewNutritionMetricKey {
  CALORIES = 'calories',
  PROTEIN = 'proteinGrams',
  CARBS = 'carbsGrams',
  FAT = 'fatGrams',
  FIBER = 'fiberGrams',
}

export enum ReviewNutritionOrigin {
  CANONICAL_CALCULATED = 'CANONICAL_CALCULATED',
  AI_ESTIMATED = 'AI_ESTIMATED',
  VERIFIED_OVERRIDE = 'VERIFIED_OVERRIDE',
  USER_PROVIDED = 'USER_PROVIDED',
  UNKNOWN = 'UNKNOWN',
}

export enum ReviewNutritionJobState {
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  RETRY_SCHEDULED = 'RETRY_SCHEDULED',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface ReviewNutritionActor {
  id: string;
  displayName: string;
  role: string;
}

export interface ReviewNutritionMetric {
  key: ReviewNutritionMetricKey;
  label: string;
  unit: string;
  estimateValue: number | null;
  /** Tổng một phần (khi còn nguyên liệu thiếu) — chỉ để tham khảo. */
  partialValue: number | null;
  estimateOrigin: ReviewNutritionOrigin | null;
  confidencePercent: number | null;
  override: {
    value: number;
    updatedBy: ReviewNutritionActor;
    formattedUpdatedAt: string;
  } | null;
  finalValue: number | null;
  finalOrigin: ReviewNutritionOrigin | null;
  finalOriginLabel: string;
  isMissing: boolean;
}

export interface ReviewNutritionUncoveredIngredient {
  position: number;
  displayName: string;
  reason: string;
  reasonLabel: string;
  missingMetricLabels: string[];
  aiEstimated: boolean;
}

export interface ReviewNutritionJob {
  id: string;
  state: ReviewNutritionJobState;
  stateLabel: string;
  isActive: boolean;
  isFailed: boolean;
  attemptCount: number;
  maxAttempts: number;
  formattedNextAttemptAt: string;
  errorCode: string | null;
  errorLabel: string | null;
}

export interface ReviewNutritionAuditEntry {
  id: string;
  metricLabel: string;
  action: 'SET_OVERRIDE' | 'CLEAR_OVERRIDE';
  actionLabel: string;
  previousValue: number | null;
  previousOriginLabel: string;
  newValue: number | null;
  newOriginLabel: string;
  reason: string | null;
  actor: ReviewNutritionActor;
  formattedCreatedAt: string;
}

export interface ReviewNutritionPreviousApproved {
  revisionVersion: number;
  formattedReviewedAt: string;
  values: {
    key: ReviewNutritionMetricKey;
    label: string;
    unit: string;
    value: number | null;
    overridden: boolean;
  }[];
}

export interface ReviewNutritionPanel {
  revisionId: string;
  postId: string;
  revisionVersion: number;
  servings: number;
  canEdit: boolean;
  canApprove: boolean;
  missingMetricLabels: string[];
  metrics: ReviewNutritionMetric[];
  hasEstimate: boolean;
  estimateConfidencePercent: number | null;
  uncoveredIngredients: ReviewNutritionUncoveredIngredient[];
  aiJob: ReviewNutritionJob | null;
  previousApproved: ReviewNutritionPreviousApproved | null;
  audit: ReviewNutritionAuditEntry[];
}

/** Giá trị form người duyệt gửi lên: number = sửa tay, null = bỏ sửa tay. */
export type ReviewNutritionOverrideValues = Partial<Record<ReviewNutritionMetricKey, number | null>>;
