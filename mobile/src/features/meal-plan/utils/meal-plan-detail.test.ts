/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { detailLinesOf, groupConstraintDetails } from './constraint-details';
import { resolveDailyTargets } from './nutrition-targets';

test('violations with the same dish and reasons are merged into one line with all meals', () => {
  const groups = groupConstraintDetails([
    { itemId: '1', name: 'Phở chay', date: '2026-11-17', mealType: 'DINNER', reasons: [{ code: 'ALLERGY', detail: 'có nấm' }] },
    { itemId: '2', name: 'Phở chay', date: '2026-11-22', mealType: 'DINNER', reasons: [{ code: 'ALLERGY', detail: 'có nấm' }] },
    { itemId: '3', name: 'Cháo', date: '2026-11-19', mealType: 'BREAKFAST', reasons: [{ code: 'ALLERGY', detail: 'có nấm' }] },
  ]);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0]!.locations, ['Tối 17/11', 'Tối 22/11']);
  assert.deepEqual(groups[1]!.locations, ['Sáng 19/11']);
});

test('detail is split on semicolons and newlines and blank parts are dropped', () => {
  assert.deepEqual(detailLinesOf('Món A: có dị ứng;  Món B: chưa rõ; ;'), ['Món A: có dị ứng', 'Món B: chưa rõ']);
  assert.deepEqual(detailLinesOf('A\nB'), ['A', 'B']);
  assert.deepEqual(detailLinesOf(''), []);
});

test('backend targets win over the calorie-based fallback', () => {
  const backend = { proteinGrams: 80, fatGrams: 40, carbohydrateGrams: 200, fiberGrams: 25, tolerancePercent: 20, sourceDetail: 'BE' };
  assert.equal(resolveDailyTargets({ estimatedTargets: backend, targetCalories: 1500 }), backend);
});

test('fallback targets follow 20/30/50 percent of calories and 14 g fiber per 1000 kcal', () => {
  const targets = resolveDailyTargets({ estimatedTargets: null, targetCalories: 1500 });
  assert.equal(targets.proteinGrams, 75);
  assert.equal(targets.fatGrams, 50);
  assert.equal(targets.carbohydrateGrams, 187.5);
  assert.equal(targets.fiberGrams, 21);
  assert.equal(targets.tolerancePercent, 15);
});

test('fallback uses 2000 kcal when the plan has no calorie target', () => {
  assert.equal(resolveDailyTargets({ estimatedTargets: null, targetCalories: 0 }).proteinGrams, 100);
});
