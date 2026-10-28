import {
  BaseMapper,
  pickField,
  safeArray,
  safeBoolean,
  safeDate,
  safeEnum,
  safeNumber,
  safeString,
} from '@/lib/mapper';
import type {
  ReviewNutritionActorDto,
  ReviewNutritionAuditDto,
  ReviewNutritionJobDto,
  ReviewNutritionMetricDto,
  ReviewNutritionOverrideRequestDto,
  ReviewNutritionPanelDto,
  ReviewNutritionPanelResponseDto,
  ReviewNutritionUncoveredDto,
} from '../types/review-nutrition.dto';
import {
  ReviewNutritionJobState,
  ReviewNutritionMetricKey,
  ReviewNutritionOrigin,
  type ReviewNutritionActor,
  type ReviewNutritionAuditEntry,
  type ReviewNutritionJob,
  type ReviewNutritionMetric,
  type ReviewNutritionOverrideValues,
  type ReviewNutritionPanel,
  type ReviewNutritionUncoveredIngredient,
} from '../types/review-nutrition.model';

export const REVIEW_NUTRITION_METRICS: ReadonlyArray<{
  key: ReviewNutritionMetricKey;
  label: string;
  unit: string;
}> = [
  { key: ReviewNutritionMetricKey.CALORIES, label: 'Năng lượng', unit: 'kcal' },
  { key: ReviewNutritionMetricKey.PROTEIN, label: 'Protein', unit: 'g' },
  { key: ReviewNutritionMetricKey.CARBS, label: 'Carbohydrate', unit: 'g' },
  { key: ReviewNutritionMetricKey.FAT, label: 'Chất béo', unit: 'g' },
  { key: ReviewNutritionMetricKey.FIBER, label: 'Chất xơ', unit: 'g' },
];

const ACTIVE_JOB_STATES = new Set<ReviewNutritionJobState>([
  ReviewNutritionJobState.QUEUED,
  ReviewNutritionJobState.RUNNING,
  ReviewNutritionJobState.RETRY_SCHEDULED,
]);

export function getReviewMetricLabel(raw: unknown): string {
  return REVIEW_NUTRITION_METRICS.find((item) => item.key === raw)?.label ?? safeString(raw, '—');
}

export function parseReviewNutritionOrigin(raw: unknown): ReviewNutritionOrigin | null {
  if (raw === null || raw === undefined || raw === '') return null;
  return safeEnum(raw, ReviewNutritionOrigin, ReviewNutritionOrigin.UNKNOWN);
}

export function getReviewNutritionOriginLabel(origin: ReviewNutritionOrigin | null): string {
  switch (origin) {
    case ReviewNutritionOrigin.CANONICAL_CALCULATED:
      return 'Dữ liệu chuẩn';
    case ReviewNutritionOrigin.AI_ESTIMATED:
      return 'AI ước tính';
    case ReviewNutritionOrigin.VERIFIED_OVERRIDE:
      return 'Người duyệt sửa';
    case ReviewNutritionOrigin.USER_PROVIDED:
      return 'Người dùng nhập';
    case null:
      return 'Chưa có';
    default:
      return 'Không rõ nguồn';
  }
}

export function getUncoveredReasonLabel(reason: string): string {
  switch (reason) {
    case 'UNRESOLVED_INGREDIENT':
      return 'Nguyên liệu tự do, chưa khớp dữ liệu chuẩn';
    case 'MISSING_CANONICAL_PROFILE':
      return 'Chưa có hồ sơ dinh dưỡng USDA';
    case 'UNIT_CONVERSION_UNAVAILABLE':
      return 'Không quy đổi được đơn vị sang gram';
    case 'MISSING_NUTRIENT_VALUES':
      return 'Hồ sơ chưa có giá trị dinh dưỡng';
    case 'MISSING_REVIEW_METRICS':
      return 'Hồ sơ thiếu một số chỉ số';
    default:
      return 'Chưa tính được từ dữ liệu chuẩn';
  }
}

export function getJobStateLabel(state: ReviewNutritionJobState): string {
  switch (state) {
    case ReviewNutritionJobState.QUEUED:
      return 'Đang chờ chạy';
    case ReviewNutritionJobState.RUNNING:
      return 'AI đang ước tính';
    case ReviewNutritionJobState.RETRY_SCHEDULED:
      return 'Đã hẹn thử lại';
    case ReviewNutritionJobState.SUCCEEDED:
      return 'AI đã ước tính xong';
    case ReviewNutritionJobState.FAILED:
      return 'AI ước tính thất bại';
    case ReviewNutritionJobState.CANCELLED:
      return 'Đã huỷ';
    default:
      return 'Không rõ';
  }
}

export function getJobErrorLabel(code: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case 'AI_PROVIDER_UNAVAILABLE':
      return 'Dịch vụ AI đang tắt hoặc chưa cấu hình';
    case 'AI_TIMEOUT':
      return 'AI phản hồi quá thời gian chờ';
    case 'AI_PROVIDER_ERROR':
      return 'Dịch vụ AI trả về lỗi';
    case 'AI_INVALID_OUTPUT':
      return 'AI trả về dữ liệu sai định dạng';
    case 'WORKER_INTERRUPTED':
      return 'Máy chủ khởi động lại khi đang chạy';
    case 'ESTIMATE_BUILD_FAILED':
    case 'ESTIMATE_SAVE_FAILED':
      return 'Không lưu được kết quả ước tính';
    case 'SUPERSEDED':
      return 'Đã thay bằng lần tính mới';
    case 'REVISION_DECIDED':
    case 'REVISION_NOT_PENDING':
      return 'Bản nộp đã được quyết định';
    case 'CANONICAL_DATA_COMPLETE':
      return 'Dữ liệu chuẩn đã đủ, không cần AI';
    default:
      return 'Lỗi không xác định';
  }
}

function formatDateTime(date: Date | null): string {
  if (!date) return '—';
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function nullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toActor(dto: ReviewNutritionActorDto | null | undefined): ReviewNutritionActor {
  return {
    id: safeString(dto?.id),
    displayName: safeString(dto?.displayName, 'Người duyệt'),
    role: safeString(dto?.role, 'ADMIN'),
  };
}

function toPercent(value: unknown): number | null {
  const parsed = nullableNumber(value);
  return parsed === null ? null : Math.round(parsed * 100);
}

export class ReviewNutritionMapper extends BaseMapper<
  ReviewNutritionPanelDto,
  ReviewNutritionPanel
> {
  toModel(dto: ReviewNutritionPanelDto | null | undefined): ReviewNutritionPanel {
    const metricsDto = safeArray<ReviewNutritionMetricDto>(dto?.metrics);
    const metrics = REVIEW_NUTRITION_METRICS.map((definition) =>
      this.toMetric(
        metricsDto.find((item) => item.metric === definition.key),
        definition
      )
    );
    const missingMetricLabels = safeArray<unknown, string>(dto?.missingMetrics, (item) =>
      getReviewMetricLabel(item)
    );
    const estimate = dto?.estimate ?? null;
    const previous = dto?.previousApproved ?? null;
    const overriddenMetrics = safeArray<string>(previous?.overriddenMetrics);

    return {
      revisionId: safeString(dto?.revisionId),
      postId: safeString(dto?.postId),
      revisionVersion: safeNumber(dto?.revisionVersion, 1),
      servings: safeNumber(dto?.servings, 1),
      canEdit: safeBoolean(dto?.canEdit, false),
      // Fail-closed: chỉ cho duyệt khi backend xác nhận đủ chỉ số
      canApprove: safeBoolean(dto?.canApprove, false) && missingMetricLabels.length === 0,
      missingMetricLabels,
      metrics,
      hasEstimate: Boolean(estimate?.id),
      estimateConfidencePercent: toPercent(estimate?.confidence),
      estimateAiUsed: safeBoolean(estimate?.aiUsed, false),
      uncoveredIngredients: safeArray<
        ReviewNutritionUncoveredDto,
        ReviewNutritionUncoveredIngredient
      >(dto?.uncoveredIngredients, (item) => this.toUncovered(item)),
      aiJob: dto?.aiJob ? this.toJob(dto.aiJob) : null,
      previousApproved: previous
        ? {
            revisionVersion: safeNumber(previous.revisionVersion, 1),
            formattedReviewedAt: formatDateTime(safeDate(previous.reviewedAt)),
            values: REVIEW_NUTRITION_METRICS.map((definition) => ({
              key: definition.key,
              label: definition.label,
              unit: definition.unit,
              value: nullableNumber(previous.values?.[definition.key]),
              overridden: overriddenMetrics.includes(definition.key),
            })),
          }
        : null,
      audit: safeArray<ReviewNutritionAuditDto, ReviewNutritionAuditEntry>(dto?.audit, (item) =>
        this.toAudit(item)
      ),
    };
  }

  toResponse(response: ReviewNutritionPanelResponseDto | null | undefined): ReviewNutritionPanel {
    return this.toModel(pickField<ReviewNutritionPanelDto | null>(response, ['data'], null));
  }

  /** Chỉ gửi các chỉ số có thay đổi; null = bỏ giá trị sửa tay */
  toOverrideRequest(
    values: ReviewNutritionOverrideValues,
    reason?: string
  ): ReviewNutritionOverrideRequestDto {
    const payload: ReviewNutritionOverrideRequestDto['values'] = {};
    for (const definition of REVIEW_NUTRITION_METRICS) {
      const value = values[definition.key];
      if (value === undefined) continue;
      payload[definition.key] = value === null ? null : Math.max(0, value);
    }
    const trimmed = reason?.trim();
    return { values: payload, ...(trimmed ? { reason: trimmed } : {}) };
  }

  private toMetric(
    dto: ReviewNutritionMetricDto | undefined,
    definition: (typeof REVIEW_NUTRITION_METRICS)[number]
  ): ReviewNutritionMetric {
    const finalValue = nullableNumber(dto?.finalValue);
    const finalOrigin = finalValue === null ? null : parseReviewNutritionOrigin(dto?.finalOrigin);
    const override = dto?.override;
    const overrideValue = nullableNumber(override?.value);
    const overrideUpdatedAt = safeDate(override?.updatedAt);
    return {
      key: definition.key,
      label: definition.label,
      unit: safeString(dto?.unit, definition.unit),
      estimateValue: nullableNumber(dto?.estimate?.value),
      partialValue: nullableNumber(dto?.estimate?.partialValue),
      estimateOrigin: parseReviewNutritionOrigin(dto?.estimate?.origin),
      confidencePercent: toPercent(dto?.estimate?.confidence),
      override:
        override && overrideValue !== null
          ? {
              value: overrideValue,
              updatedBy: toActor(override.updatedBy),
              updatedAt: overrideUpdatedAt,
              formattedUpdatedAt: formatDateTime(overrideUpdatedAt),
            }
          : null,
      finalValue,
      finalOrigin,
      finalOriginLabel: getReviewNutritionOriginLabel(finalOrigin),
      isMissing: finalValue === null,
    };
  }

  private toUncovered(dto: ReviewNutritionUncoveredDto): ReviewNutritionUncoveredIngredient {
    const reason = safeString(dto?.reason, 'UNKNOWN');
    return {
      position: safeNumber(dto?.position, 0),
      displayName: safeString(dto?.displayName, 'Nguyên liệu'),
      reason,
      reasonLabel: getUncoveredReasonLabel(reason),
      missingMetricLabels: safeArray<unknown, string>(dto?.missingMetrics, (item) =>
        getReviewMetricLabel(item)
      ),
      aiEstimated: safeBoolean(dto?.aiEstimated, false),
    };
  }

  private toJob(dto: ReviewNutritionJobDto): ReviewNutritionJob {
    const state = safeEnum(dto.state, ReviewNutritionJobState, ReviewNutritionJobState.FAILED);
    const nextAttemptAt = safeDate(dto.nextAttemptAt);
    const errorCode = dto.errorCode ? safeString(dto.errorCode) : null;
    return {
      id: safeString(dto.id),
      state,
      stateLabel: getJobStateLabel(state),
      isActive: ACTIVE_JOB_STATES.has(state),
      isFailed: state === ReviewNutritionJobState.FAILED,
      attemptCount: safeNumber(dto.attemptCount, 0),
      maxAttempts: safeNumber(dto.maxAttempts, 1),
      nextAttemptAt,
      formattedNextAttemptAt: formatDateTime(nextAttemptAt),
      errorCode,
      errorLabel: getJobErrorLabel(errorCode),
      updatedAt: safeDate(dto.updatedAt),
    };
  }

  private toAudit(dto: ReviewNutritionAuditDto): ReviewNutritionAuditEntry {
    const action = dto?.action === 'CLEAR_OVERRIDE' ? 'CLEAR_OVERRIDE' : 'SET_OVERRIDE';
    return {
      id: safeString(dto?.id),
      metricLabel: getReviewMetricLabel(dto?.metric),
      action,
      actionLabel: action === 'CLEAR_OVERRIDE' ? 'Bỏ giá trị sửa tay' : 'Sửa tay',
      previousValue: nullableNumber(dto?.previousValue),
      previousOriginLabel: getReviewNutritionOriginLabel(
        parseReviewNutritionOrigin(dto?.previousOrigin)
      ),
      newValue: nullableNumber(dto?.newValue),
      newOriginLabel: getReviewNutritionOriginLabel(parseReviewNutritionOrigin(dto?.newOrigin)),
      reason: dto?.reason ? safeString(dto.reason) : null,
      actor: toActor(dto?.actor),
      formattedCreatedAt: formatDateTime(safeDate(dto?.createdAt)),
    };
  }
}

export const reviewNutritionMapper = new ReviewNutritionMapper();
