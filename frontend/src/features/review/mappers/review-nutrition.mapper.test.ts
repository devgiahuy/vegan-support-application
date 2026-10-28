import { describe, expect, it } from 'vitest';
import {
  getJobErrorLabel,
  getReviewNutritionOriginLabel,
  reviewNutritionMapper,
} from './review-nutrition.mapper';
import type { ReviewNutritionPanelResponseDto } from '../types/review-nutrition.dto';
import {
  ReviewNutritionJobState,
  ReviewNutritionMetricKey,
  ReviewNutritionOrigin,
} from '../types/review-nutrition.model';

const actor = { id: 'admin-1', displayName: 'Quản trị viên', role: 'ADMIN' };

const response: ReviewNutritionPanelResponseDto = {
  success: true,
  meta: null,
  data: {
    revisionId: 'rev-2',
    postId: 'post-1',
    revisionVersion: 2,
    revisionStatus: 'PENDING_REVIEW',
    servings: 2,
    canEdit: true,
    canApprove: false,
    missingMetrics: ['fiberGrams'],
    metrics: [
      {
        metric: 'calories',
        unit: 'kcal',
        estimate: {
          value: 293.6,
          partialValue: 293.6,
          origin: 'CANONICAL_CALCULATED',
          confidence: 0.85,
        },
        override: null,
        finalValue: 293.6,
        finalOrigin: 'CANONICAL_CALCULATED',
      },
      {
        metric: 'proteinGrams',
        unit: 'g',
        estimate: { value: 6, partialValue: 6, origin: 'AI_ESTIMATED', confidence: 0.3 },
        override: { value: 7.5, updatedBy: actor, updatedAt: '2026-10-28T10:05:00.000Z' },
        finalValue: 7.5,
        finalOrigin: 'VERIFIED_OVERRIDE',
      },
      {
        metric: 'fiberGrams',
        unit: 'g',
        estimate: {
          value: null,
          partialValue: 1.2,
          origin: 'CANONICAL_CALCULATED',
          confidence: 0.8,
        },
        override: null,
        finalValue: null,
        finalOrigin: null,
      },
    ],
    estimate: {
      id: 'est-1',
      version: 3,
      confidence: 0.42,
      aiUsed: true,
      calculationVersion: 'recipe-nutrition-v1',
      disclaimer: 'Chỉ mang tính tham khảo.',
      createdAt: '2026-10-28T10:00:00.000Z',
    },
    uncoveredIngredients: [
      {
        position: 1,
        displayName: 'Rau thơm',
        reason: 'UNRESOLVED_INGREDIENT',
        missingMetrics: ['fiberGrams'],
        aiEstimated: true,
      },
    ],
    aiJob: {
      id: 'job-1',
      state: 'RETRY_SCHEDULED',
      trigger: 'SUBMIT',
      attemptCount: 2,
      maxAttempts: 4,
      nextAttemptAt: '2026-10-28T10:12:00.000Z',
      errorCode: 'AI_PROVIDER_ERROR',
      startedAt: '2026-10-28T10:00:00.000Z',
      completedAt: null,
      updatedAt: '2026-10-28T10:07:00.000Z',
    },
    previousApproved: {
      revisionId: 'rev-1',
      revisionVersion: 1,
      reviewedAt: '2026-10-20T08:00:00.000Z',
      values: { calories: 63, proteinGrams: 2.5, carbsGrams: 10, fatGrams: 1.25, fiberGrams: 4.26 },
      overriddenMetrics: ['fiberGrams'],
    },
    audit: [
      {
        id: 'audit-1',
        metric: 'proteinGrams',
        action: 'SET_OVERRIDE',
        previousValue: 6,
        previousOrigin: 'AI_ESTIMATED',
        newValue: 7.5,
        newOrigin: 'VERIFIED_OVERRIDE',
        reason: 'Đối chiếu bảng thành phần',
        actor,
        createdAt: '2026-10-28T10:05:00.000Z',
      },
    ],
  },
};

describe('ReviewNutritionMapper', () => {
  it('maps the five review metrics in fixed order, filling absent ones as missing', () => {
    const panel = reviewNutritionMapper.toResponse(response);

    expect(panel.metrics.map((metric) => metric.key)).toEqual([
      ReviewNutritionMetricKey.CALORIES,
      ReviewNutritionMetricKey.PROTEIN,
      ReviewNutritionMetricKey.CARBS,
      ReviewNutritionMetricKey.FAT,
      ReviewNutritionMetricKey.FIBER,
    ]);
    const carbs = panel.metrics[2];
    expect(carbs.isMissing).toBe(true);
    expect(carbs.finalOrigin).toBeNull();
    expect(carbs.finalOriginLabel).toBe('Chưa có');
  });

  it('keeps source labels, confidence and reviewer overrides', () => {
    const panel = reviewNutritionMapper.toResponse(response);
    const [calories, protein] = panel.metrics;

    expect(calories.finalOrigin).toBe(ReviewNutritionOrigin.CANONICAL_CALCULATED);
    expect(calories.finalOriginLabel).toBe('Dữ liệu chuẩn');
    expect(calories.confidencePercent).toBe(85);
    expect(protein.finalValue).toBe(7.5);
    expect(protein.finalOrigin).toBe(ReviewNutritionOrigin.VERIFIED_OVERRIDE);
    expect(protein.estimateOrigin).toBe(ReviewNutritionOrigin.AI_ESTIMATED);
    expect(protein.override?.updatedBy.displayName).toBe('Quản trị viên');
    expect(protein.override?.updatedAt).toBeInstanceOf(Date);
  });

  it('never presents a partial sum as the value of a missing metric', () => {
    const fiber = reviewNutritionMapper.toResponse(response).metrics[4];

    expect(fiber.finalValue).toBeNull();
    expect(fiber.partialValue).toBe(1.2);
    expect(fiber.isMissing).toBe(true);
  });

  it('maps job state, retry schedule and error label', () => {
    const job = reviewNutritionMapper.toResponse(response).aiJob;

    expect(job?.state).toBe(ReviewNutritionJobState.RETRY_SCHEDULED);
    expect(job?.isActive).toBe(true);
    expect(job?.isFailed).toBe(false);
    expect(job?.attemptCount).toBe(2);
    expect(job?.maxAttempts).toBe(4);
    expect(job?.nextAttemptAt).toBeInstanceOf(Date);
    expect(job?.errorLabel).toBe('Dịch vụ AI trả về lỗi');
  });

  it('maps uncovered ingredients, previous approved reference and audit', () => {
    const panel = reviewNutritionMapper.toResponse(response);

    expect(panel.uncoveredIngredients[0]).toMatchObject({
      displayName: 'Rau thơm',
      reasonLabel: 'Nguyên liệu tự do, chưa khớp dữ liệu chuẩn',
      missingMetricLabels: ['Chất xơ'],
      aiEstimated: true,
    });
    expect(panel.previousApproved?.revisionVersion).toBe(1);
    expect(panel.previousApproved?.values.find((item) => item.key === 'fiberGrams')).toMatchObject({
      value: 4.26,
      overridden: true,
    });
    expect(panel.audit[0]).toMatchObject({
      metricLabel: 'Protein',
      actionLabel: 'Sửa tay',
      previousValue: 6,
      previousOriginLabel: 'AI ước tính',
      newValue: 7.5,
      newOriginLabel: 'Người duyệt sửa',
      reason: 'Đối chiếu bảng thành phần',
    });
    expect(panel.missingMetricLabels).toEqual(['Chất xơ']);
    expect(panel.estimateConfidencePercent).toBe(42);
  });

  it('fails closed on null input: no metrics, cannot edit or approve', () => {
    const panel = reviewNutritionMapper.toModel(null);

    expect(panel.canApprove).toBe(false);
    expect(panel.canEdit).toBe(false);
    expect(panel.hasEstimate).toBe(false);
    expect(panel.aiJob).toBeNull();
    expect(panel.metrics).toHaveLength(5);
    expect(panel.metrics.every((metric) => metric.isMissing)).toBe(true);
  });

  it('does not allow approval when backend says canApprove but lists missing metrics', () => {
    const panel = reviewNutritionMapper.toModel({ canApprove: true, missingMetrics: ['fatGrams'] });
    expect(panel.canApprove).toBe(false);
  });

  it('builds override request with only provided metrics, null clears, reason trimmed', () => {
    expect(
      reviewNutritionMapper.toOverrideRequest(
        { [ReviewNutritionMetricKey.FIBER]: 4.2, [ReviewNutritionMetricKey.CALORIES]: null },
        '  đối chiếu  '
      )
    ).toEqual({ values: { calories: null, fiberGrams: 4.2 }, reason: 'đối chiếu' });
    expect(reviewNutritionMapper.toOverrideRequest({ proteinGrams: 3 }, '   ')).toEqual({
      values: { proteinGrams: 3 },
    });
  });

  it('labels unknown origins and error codes safely', () => {
    expect(getReviewNutritionOriginLabel(ReviewNutritionOrigin.UNKNOWN)).toBe('Không rõ nguồn');
    expect(getJobErrorLabel(null)).toBeNull();
    expect(getJobErrorLabel('SOMETHING_NEW')).toBe('Lỗi không xác định');
  });
});
