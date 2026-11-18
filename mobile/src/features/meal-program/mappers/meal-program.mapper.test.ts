import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mealProgramMapper } from './meal-program.mapper';

test('a revised draft keeps source links and selected copied plan IDs for the repair action', () => {
  const program = mealProgramMapper.toModel({
    id: 'revision', status: 'DRAFT', sourceProgramId: 'source', effectiveFrom: '2026-11-19',
    compatibility: { status: 'NEEDS_REVIEW', dietaryRevision: 4, affectedMealCount: 1 },
    weeks: [{ id: 'week', selectedAlternativeRank: 0,
      alternatives: [{ id: 'alternative', rank: 0, mealPlanId: 'copied-plan', selected: true }] }],
  });
  assert.equal(program.sourceProgramId, 'source');
  assert.equal(program.isConfirmed, false);
  assert.equal(program.compatibility?.status, 'NEEDS_REVIEW');
  assert.equal(program.weeks[0]?.alternatives[0]?.selected, true);
  assert.equal(program.weeks[0]?.alternatives[0]?.mealPlanId, 'copied-plan');
});
