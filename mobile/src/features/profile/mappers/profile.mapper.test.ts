import assert from 'node:assert/strict';
import { test } from 'node:test';

import { toDietSummary } from './profile.mapper';

test('all sixteen allowance combinations retain false and independent egg/dairy/honey choices', () => {
  for (let bits = 0; bits < 16; bits += 1) {
    const input = {
      allowEggs: Boolean(bits & 1), allowDairy: Boolean(bits & 2),
      allowHoney: Boolean(bits & 4), allowFivePungent: Boolean(bits & 8),
      policyVersion: 1, dietaryRevision: 2,
    };
    const result = toDietSummary(input);
    assert.ok(result);
    assert.equal(result.allowEggs, input.allowEggs);
    assert.equal(result.allowDairy, input.allowDairy);
    assert.equal(result.allowHoney, input.allowHoney);
    assert.equal(result.allowFivePungent, input.allowFivePungent);
    assert.equal(result.dietaryRevision, 2);
    assert.equal('tradition' in result, false);
    assert.equal('scheduleDates' in result, false);
  }
});

test('an absent or malformed profile cannot become four false allowances that overwrite a saved profile', () => {
  assert.equal(toDietSummary(null), null);
  assert.equal(toDietSummary({ allowEggs: false, allowDairy: false, allowHoney: false, dietaryRevision: 1 }), null);
  assert.equal(toDietSummary({ allowEggs: false, allowDairy: false, allowHoney: false, allowFivePungent: false }), null);
});

test('known positive allergies and unresolved specific ingredients remain available for correction', () => {
  const result = toDietSummary({
    allowEggs: true, allowDairy: true, allowHoney: true, allowFivePungent: true, dietaryRevision: 1,
    allergies: [{ allergenCode: 'MILK', label: 'Sữa', severity: 'SEVERE' }],
    ingredientAllergies: [{ ingredientId: 'id', ingredientName: 'Đậu', severity: 'MODERATE', ingredientActive: false }],
    ingredientExclusions: [{ ingredientId: 'garlic', ingredientName: 'Tỏi', reason: 'Không dùng' }],
  });
  assert.equal(result?.allergies[0]?.allergenCode, 'MILK');
  assert.equal(result?.ingredientAllergies[0]?.ingredientActive, false);
  assert.equal(result?.ingredientExclusions[0]?.ingredientId, 'garlic');
});
