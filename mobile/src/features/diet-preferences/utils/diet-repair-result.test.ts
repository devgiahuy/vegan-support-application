import assert from 'node:assert/strict';
import { test } from 'node:test';

import { summarizeDietRepair } from './diet-repair-result';

test('a partially successful batch never reports that all plans were repaired', () => {
  const summary = summarizeDietRepair({
    dietaryRevision: 2,
    results: [
      { planId: 'a', status: 'UPDATED', message: '', remainingAffectedMeals: 0 },
      { planId: 'b', status: 'FAILED', message: 'Không có món thay', remainingAffectedMeals: 3 },
    ],
  });
  assert.equal(summary.complete, false);
  assert.equal(summary.updatedPlans, 1);
  assert.equal(summary.unresolvedPlans, 1);
  assert.equal(summary.remainingMeals, 3);
});

test('remaining incompatible meals take precedence over an UPDATED status', () => {
  assert.equal(summarizeDietRepair({
    dietaryRevision: 3,
    results: [{ planId: 'a', status: 'UPDATED', message: '', remainingAffectedMeals: 1 }],
  }).complete, false);
});

test('a confirmed program awaiting a revision remains unresolved even with no meal count', () => {
  assert.equal(summarizeDietRepair({
    dietaryRevision: 4,
    results: [{ planId: 'a', status: 'PROGRAM_REVISION_REQUIRED', message: '', remainingAffectedMeals: 0 }],
  }).complete, false);
});

test('an empty result is not presented as a successful update', () => {
  const result = summarizeDietRepair({ dietaryRevision: 1, results: [] });
  assert.equal(result.complete, false);
  assert.match(result.detail, /Không có thay đổi/);
});

test('a fully rechecked update and unchanged compatible plan can complete together', () => {
  const result = summarizeDietRepair({
    dietaryRevision: 2,
    results: [
      { planId: 'a', status: 'UPDATED', message: '', remainingAffectedMeals: 0 },
      { planId: 'b', status: 'UNCHANGED', message: '', remainingAffectedMeals: 0 },
    ],
  });
  assert.equal(result.complete, true);
  assert.equal(result.updatedPlans, 1);
});
