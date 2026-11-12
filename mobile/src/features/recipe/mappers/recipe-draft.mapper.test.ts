/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { recipeDraftMapper } from './recipe-draft.mapper';

test('request trims, de-duplicates and limits ingredient names', () => {
  const dto = recipeDraftMapper.toDto({ title: '  Cơm  ', description: ' ngon ', ingredientNames: [' Đậu hũ ', 'đậu hũ', '', 'Nấm'] });
  assert.deepEqual(dto, { title: 'Cơm', description: 'ngon', ingredientNames: ['Đậu hũ', 'Nấm'] });
});

test('request allows blank title/description and only sends valid user-entered numbers', () => {
  const blank = recipeDraftMapper.toDto({ title: '', description: '', ingredientNames: ['Nấm'] });
  assert.deepEqual(blank, { title: '', description: '', ingredientNames: ['Nấm'] });

  const entered = recipeDraftMapper.toDto({
    title: '', description: '', servings: 4, prepTimeMinutes: 0, cookTimeMinutes: 20, ingredientNames: ['Nấm'],
  });
  assert.equal(entered.servings, 4);
  assert.equal(entered.prepTimeMinutes, 0);
  assert.equal(entered.cookTimeMinutes, 20);

  const invalid = recipeDraftMapper.toDto({
    title: '', description: '', servings: 0, prepTimeMinutes: -1, cookTimeMinutes: 1.5, ingredientNames: ['Nấm'],
  });
  assert.deepEqual(Object.keys(invalid).sort(), ['description', 'ingredientNames', 'title']);
});

test('draft exposes AI suggested title and description', () => {
  const model = recipeDraftMapper.toModel({
    data: { draft: { title: ' Đậu hũ sốt cà ', excerpt: 'Món chay nhanh.', recipe: { servings: 2 } } },
  });
  assert.equal(model.title, 'Đậu hũ sốt cà');
  assert.equal(model.description, 'Món chay nhanh.');
  assert.equal(recipeDraftMapper.toModel(undefined).title, '');
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
