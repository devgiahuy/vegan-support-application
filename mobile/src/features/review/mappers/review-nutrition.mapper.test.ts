/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reviewNutritionMapper } from './review-nutrition.mapper';
import { ReviewNutritionMetricKey, ReviewNutritionOrigin } from '../types/review-nutrition.model';
import { diffNutritionDrafts, initialNutritionDrafts, parseNutritionDraft } from '../utils/review-nutrition-draft';
import { getContentReviewErrorMessage, getReviewNutritionErrorMessage } from '../utils/content-review-errors';

const metric = (key: string, finalValue: number | null, extra: Record<string, unknown> = {}) => ({
  metric: key,
  unit: key === 'calories' ? 'kcal' : 'g',
  estimate: { value: finalValue, partialValue: null, origin: 'CANONICAL_CALCULATED', confidence: 0.82 },
  override: null,
  finalValue,
  finalOrigin: finalValue === null ? null : 'CANONICAL_CALCULATED',
  ...extra,
});

const panelDto = (overrides: Record<string, unknown> = {}) => ({
  revisionId: 'r1',
  postId: 'p1',
  revisionVersion: 2,
  servings: 4,
  canEdit: true,
  canApprove: true,
  missingMetrics: [],
  metrics: [
    metric('calories', 420),
    metric('proteinGrams', 18.5),
    metric('carbsGrams', 60),
    metric('fatGrams', 12),
    metric('fiberGrams', 9),
  ],
  estimate: { id: 'e1', confidence: 0.82, aiUsed: false },
  uncoveredIngredients: [],
  aiJob: null,
  previousApproved: null,
  audit: [],
  ...overrides,
});

function apiError(code: string) {
  return { isAxiosError: true, response: { status: 409, data: { success: false, error: { code, message: 'x' } } } };
}

test('panel maps the five metrics in fixed order with source labels', () => {
  const panel = reviewNutritionMapper.toResponse({ success: true, data: panelDto(), meta: null });
  assert.deepEqual(panel.metrics.map((item) => item.key), Object.values(ReviewNutritionMetricKey));
  assert.equal(panel.metrics[0]!.finalValue, 420);
  assert.equal(panel.metrics[0]!.finalOriginLabel, 'Dữ liệu chuẩn');
  assert.equal(panel.metrics[0]!.confidencePercent, 82);
  assert.equal(panel.canApprove, true);
  assert.equal(panel.hasEstimate, true);
});

test('approval fails closed when metrics are missing or the backend says no', () => {
  const missing = reviewNutritionMapper.toModel(
    panelDto({ canApprove: true, missingMetrics: ['fiberGrams'], metrics: [metric('calories', 420), metric('fiberGrams', null)] })
  );
  assert.equal(missing.canApprove, false);
  assert.deepEqual(missing.missingMetricLabels, ['Chất xơ']);
  assert.equal(missing.metrics.find((item) => item.key === 'fiberGrams')!.isMissing, true);
  assert.equal(reviewNutritionMapper.toModel(panelDto({ canApprove: false })).canApprove, false);
  assert.equal(reviewNutritionMapper.toModel(null).canApprove, false);
});

test('active AI job states are flagged for polling and failed jobs expose a reason', () => {
  const running = reviewNutritionMapper.toModel(panelDto({ aiJob: { id: 'j', state: 'RETRY_SCHEDULED', attemptCount: 1, maxAttempts: 4, nextAttemptAt: '2026-10-28T03:00:00.000Z' } }));
  assert.equal(running.aiJob?.isActive, true);
  assert.equal(running.aiJob?.stateLabel, 'Đã hẹn thử lại');
  const failed = reviewNutritionMapper.toModel(panelDto({ aiJob: { id: 'j', state: 'FAILED', attemptCount: 4, maxAttempts: 4, errorCode: 'AI_INVALID_OUTPUT' } }));
  assert.equal(failed.aiJob?.isActive, false);
  assert.equal(failed.aiJob?.isFailed, true);
  assert.equal(failed.aiJob?.errorLabel, 'AI trả về dữ liệu sai định dạng');
});

test('overrides, uncovered ingredients, previous values and audit are mapped', () => {
  const panel = reviewNutritionMapper.toModel(
    panelDto({
      metrics: [metric('calories', 500, { override: { value: 500, updatedBy: { id: 'u', displayName: 'Mai', role: 'CONTRIBUTOR' }, updatedAt: '2026-10-28T02:00:00.000Z' }, finalOrigin: 'VERIFIED_OVERRIDE' })],
      uncoveredIngredients: [{ position: 1, displayName: 'Nấm đặc biệt', reason: 'MISSING_CANONICAL_PROFILE', missingMetrics: ['calories'], aiEstimated: true }],
      previousApproved: { revisionVersion: 1, reviewedAt: '2026-10-20T02:00:00.000Z', values: { calories: 400 }, overriddenMetrics: ['calories'] },
      audit: [{ id: 'a1', metric: 'calories', action: 'CLEAR_OVERRIDE', previousValue: 500, previousOrigin: 'VERIFIED_OVERRIDE', newValue: 420, newOrigin: 'CANONICAL_CALCULATED', actor: { displayName: 'Mai' } }],
    })
  );
  assert.equal(panel.metrics[0]!.override?.updatedBy.displayName, 'Mai');
  assert.equal(panel.metrics[0]!.finalOrigin, ReviewNutritionOrigin.VERIFIED_OVERRIDE);
  assert.equal(panel.uncoveredIngredients[0]!.reasonLabel, 'Chưa có hồ sơ dinh dưỡng USDA');
  assert.deepEqual(panel.uncoveredIngredients[0]!.missingMetricLabels, ['Năng lượng']);
  assert.equal(panel.previousApproved?.values[0]!.value, 400);
  assert.equal(panel.previousApproved?.values[0]!.overridden, true);
  assert.equal(panel.audit[0]!.actionLabel, 'Bỏ giá trị sửa tay');
});

test('override request only carries changed metrics, clamps negatives and trims the reason', () => {
  const body = reviewNutritionMapper.toOverrideRequest({ calories: 480, fiberGrams: null, fatGrams: -3 }, '  đối chiếu USDA  ');
  assert.deepEqual(body, { values: { calories: 480, fatGrams: 0, fiberGrams: null }, reason: 'đối chiếu USDA' });
  assert.deepEqual(reviewNutritionMapper.toOverrideRequest({ calories: 1 }), { values: { calories: 1 } });
});

test('draft parsing accepts comma decimals and rejects negative, huge or non numeric input', () => {
  assert.equal(parseNutritionDraft('12,5'), 12.5);
  assert.equal(parseNutritionDraft('  '), null);
  assert.equal(parseNutritionDraft('-1'), 'invalid');
  assert.equal(parseNutritionDraft('100000'), 'invalid');
  assert.equal(parseNutritionDraft('abc'), 'invalid');
});

test('diff only sends edited metrics, clears overrides on empty input and flags invalid input', () => {
  const panel = reviewNutritionMapper.toModel(
    panelDto({ metrics: [metric('calories', 420), metric('proteinGrams', 18.5, { override: { value: 18.5, updatedBy: {}, updatedAt: '2026-10-28T02:00:00.000Z' }, finalOrigin: 'VERIFIED_OVERRIDE' }), metric('carbsGrams', 60), metric('fatGrams', 12), metric('fiberGrams', null)] })
  );
  const drafts = initialNutritionDrafts(panel.metrics);
  assert.deepEqual(diffNutritionDrafts(panel.metrics, drafts), { changes: {}, hasInvalid: false });
  const edited = diffNutritionDrafts(panel.metrics, { ...drafts, calories: '450', proteinGrams: '', fiberGrams: '7,5' });
  assert.deepEqual(edited.changes, { calories: 450, proteinGrams: null, fiberGrams: 7.5 });
  assert.equal(edited.hasInvalid, false);
  assert.equal(diffNutritionDrafts(panel.metrics, { ...drafts, fatGrams: 'x' }).hasInvalid, true);
});

test('business error codes map to Vietnamese messages', () => {
  assert.match(getContentReviewErrorMessage(apiError('RECIPE_NUTRITION_INCOMPLETE')), /5 chỉ số dinh dưỡng/);
  assert.match(getReviewNutritionErrorMessage(apiError('SELF_APPROVAL_FORBIDDEN')), /do chính mình tạo/);
  assert.match(getReviewNutritionErrorMessage(apiError('REVIEW_ALREADY_DECIDED')), /không còn ở trạng thái chờ duyệt/);
  assert.match(getReviewNutritionErrorMessage(apiError('INVALID_CONTENT')), /không phải công thức/);
});
