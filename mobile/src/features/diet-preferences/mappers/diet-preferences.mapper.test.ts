import assert from 'node:assert/strict';
import { test } from 'node:test';

import { dietPreferencesMapper } from './diet-preferences.mapper';
import type { SaveDietPreferencesInput } from '../types/diet-preferences.model';

const input: SaveDietPreferencesInput = {
  allowEggs: true, allowDairy: false, allowHoney: true, allowFivePungent: false,
  policyVersion: 1, expectedDietaryRevision: 3,
  allergies: [{ allergenCode: 'EGG', label: 'Trứng', severity: 'SEVERE' }],
  ingredientAllergies: [],
  ingredientExclusions: [{ ingredientId: 'id', ingredientName: ' Tỏi ', reason: ' ' }],
};

test('save serializes independent allowances and keeps allergies when their group is allowed', () => {
  const dto = dietPreferencesMapper.toSaveDto(input);
  assert.equal(dto.allowEggs, true);
  assert.equal(dto.allowDairy, false);
  assert.equal(dto.allowHoney, true);
  assert.equal(dto.allergies[0]?.allergenCode, 'EGG');
  assert.deepEqual(dto.ingredientAllergies, []);
  assert.deepEqual(dto.ingredientExclusions, [{ ingredientId: 'id', ingredientName: 'Tỏi' }]);
  assert.equal('tradition' in dto, false);
  assert.equal('practiceSchedule' in dto, false);
  assert.equal('rules' in dto, false);
});

test('omission of ingredient allergies preserves the API omission semantics', () => {
  const { ingredientAllergies, ...without } = input;
  assert.deepEqual(ingredientAllergies, []);
  assert.equal('ingredientAllergies' in dietPreferencesMapper.toSaveDto(without), false);
});

test('a committed save with unavailable impact remains saved and explicitly unassessed', () => {
  const saved = dietPreferencesMapper.toSavedModel({ data: {
    ...input, dietaryRevision: 4, impactUnavailable: true,
  } });
  assert.equal(saved.preference.dietaryRevision, 4);
  assert.equal(saved.impactUnavailable, true);
  assert.equal(saved.impact, null);
});

test('a zero-impact assessment is distinct from a missing assessment', () => {
  const saved = dietPreferencesMapper.toSavedModel({ data: {
    ...input, dietaryRevision: 4,
    impact: { dietaryRevision: 4, assessedFrom: '2026-11-18', affectedMealCount: 0, affectedPlanCount: 0, plans: [] },
  } });
  assert.equal(saved.impactUnavailable, false);
  assert.equal(saved.impact?.affectedMealCount, 0);
});
