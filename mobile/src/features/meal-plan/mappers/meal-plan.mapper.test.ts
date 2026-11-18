import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mealPlanMapper } from './meal-plan.mapper';

test('maps structured allergy reasons and tolerates old summaries', () => {
  const plan = mealPlanMapper.toModel({
    userSummary: {
      status: 'HARD_CONSTRAINT_BLOCKED', hardConstraintsPreserved: false,
      hardViolations: [{ itemId: 'item', name: 'Cháo nấm', date: '2026-11-19', mealType: 'DINNER', reasons: [{ code: 'ALLERGY', detail: 'có nấm hương khớp dị ứng đã khai báo' }] }],
    },
  });
  assert.equal(plan.userSummary?.hardViolations[0]?.reasons[0]?.detail, 'có nấm hương khớp dị ứng đã khai báo');
  assert.deepEqual(mealPlanMapper.toModel({ userSummary: { detail: 'Cảnh báo cũ' } }).userSummary?.hardViolations, []);
});

test('current dietary compatibility remains visible independently of a saved plan summary', () => {
  const plan = mealPlanMapper.toModel({
    userSummary: { hardConstraintsPreserved: true },
    compatibility: { status: 'NEEDS_REVIEW', dietaryRevision: 3, affectedMealCount: 1,
      items: [{ itemId: 'meal', name: 'Trứng chiên', reasons: ['FOOD_GROUP_EXCLUSION'] }] },
  });
  assert.equal(plan.compatibility?.status, 'NEEDS_REVIEW');
  assert.equal(plan.compatibility?.items[0]?.itemId, 'meal');
  assert.match(plan.compatibility?.items[0]?.reasonLabels[0] ?? '', /thực phẩm bạn đã chọn kiêng/);
});
