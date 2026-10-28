/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { recipeDraftMapper } from './recipe-draft.mapper';

test('request trims, de-duplicates and limits ingredient names', () => {
  const dto = recipeDraftMapper.toDto({ title: '  Cơm  ', description: ' ngon ', ingredientNames: [' Đậu hũ ', 'đậu hũ', '', 'Nấm'] });
  assert.deepEqual(dto, { title: 'Cơm', description: 'ngon', ingredientNames: ['Đậu hũ', 'Nấm'] });
});

test('draft keeps AI values as suggestions and drops unusable rows', () => {
  const model = recipeDraftMapper.toModel({
    success: true,
    data: {
      draft: {
        recipe: {
          servings: 2, prepTimeMinutes: 10, cookTimeMinutes: 15, difficulty: 'easy',
          ingredients: [{ displayName: 'Đậu hũ', amount: 200, unit: 'g' }, { displayName: 'Muối', amount: 0, unit: 'g' }],
          steps: [{ instruction: 'Chiên đậu', durationMinutes: 5, affectedIngredientPositions: [0, -1] }, { instruction: '' }],
        },
      },
      ingredientConfidence: [0.8, 0.4], confidence: 0.7, assumptions: ['1 miếng ~ 100g', null],
      provenance: { provider: 'openai', model: 'm', templateVersion: 'recipe-draft-v1' },
    },
  });
  assert.equal(model.difficulty, 'EASY');
  assert.equal(model.ingredients.length, 1);
  assert.equal(model.ingredients[0].confidence, 0.8);
  assert.equal(model.steps.length, 1);
  assert.deepEqual(model.steps[0].affectedIngredientPositions, [0]);
  assert.deepEqual(model.assumptions, ['1 miếng ~ 100g']);
  assert.equal(model.provenance?.provider, 'openai');
});

test('an empty response never fabricates ingredients or steps', () => {
  const model = recipeDraftMapper.toModel(undefined);
  assert.deepEqual([model.ingredients.length, model.steps.length], [0, 0]);
  assert.equal(model.provenance, null);
});
