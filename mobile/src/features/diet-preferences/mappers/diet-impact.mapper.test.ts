import assert from 'node:assert/strict';
import { test } from 'node:test';

import { dietImpactMapper, toDietaryCompatibility } from './diet-impact.mapper';

test('impact preserves meal identity, multiple reasons, uncertainty and confirmed program versions', () => {
  const impact = dietImpactMapper.toModel({
    dietaryRevision: 2, affectedPlanCount: 1, affectedMealCount: 1,
    plans: [{ planId: 'p', weekStart: '2026-11-16', expectedVersion: 2, status: 'NEEDS_REVIEW', canRepair: false,
      programs: [{ id: 'program', title: 'Lộ trình', status: 'CONFIRMED', expectedVersion: 4 }],
      items: [{ itemId: 'meal', name: 'Món trứng', date: '2026-11-18', mealType: 'DINNER',
        reasons: ['FOOD_GROUP_EXCLUSION', 'INGREDIENT_DIETARY_UNCERTAIN'], unverified: true }],
    }],
  });
  assert.equal(impact.affectedMealCount, 1);
  assert.equal(impact.plans[0]?.programs[0]?.expectedVersion, 4);
  assert.equal(impact.plans[0]?.items[0]?.reasonLabels.length, 2);
  assert.equal(impact.plans[0]?.items[0]?.mealTypeLabel, 'Bữa tối');
  assert.equal(impact.plans[0]?.items[0]?.unverified, true);
});

test('unknown compatibility status cannot become a compatible assessment', () => {
  assert.equal(toDietaryCompatibility({ status: 'NEW_SERVER_STATE' })?.status, 'NEEDS_REVIEW');
  assert.equal(toDietaryCompatibility(null), null);
});

test('replacement preview preserves unknown nutrition as null and no-op status', () => {
  const preview = dietImpactMapper.toRepairPreview({ proposalId: 'p', plans: [{
    status: 'UNCHANGED', beforeNutrition: { calories: null }, afterNutrition: { calories: 0 },
  }] });
  assert.equal(preview.plans[0]?.status, 'UNCHANGED');
  assert.equal(preview.plans[0]?.beforeNutrition.calories, null);
  assert.equal(preview.plans[0]?.afterNutrition.calories, 0);
  assert.equal(preview.plans[0]?.afterNutrition.proteinGrams, null);
});

test('an unknown apply status is a failure and cannot produce a false success result', () => {
  const result = dietImpactMapper.toRepairResult({ results: [{ planId: 'p', status: 'UNKNOWN', remainingAffectedMeals: 2 }] });
  assert.equal(result.results[0]?.status, 'FAILED');
  assert.equal(result.results[0]?.remainingAffectedMeals, 2);
});
