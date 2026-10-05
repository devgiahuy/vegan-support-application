/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { shoppingMapper } from './shopping.mapper';

test('shopping request sends correct recipe/custom identities without UI fields', () => {
  assert.deepEqual(
    shoppingMapper.toRequest([
      { sourceType: 'RECIPE', id: 'recipe', name: 'Soup', servings: 2 },
      {
        sourceType: 'CUSTOM_MEAL',
        id: 'custom',
        name: 'Private meal',
        servings: 3,
      },
    ]),
    {
      meals: [
        { sourceType: 'RECIPE', recipeId: 'recipe', servings: 2 },
        { sourceType: 'CUSTOM_MEAL', customMealId: 'custom', servings: 3 },
      ],
    }
  );
});

test('unresolved lines and conversion assumptions are preserved separately from gaps', () => {
  const result = shoppingMapper.toModel({
    items: [
      {
        ingredient: { id: 'i', name: 'Tofu' },
        required: { value: 500, unit: 'g' },
        available: { value: 200, unit: 'g' },
        missing: { value: 300, unit: 'g' },
        surplus: { value: 0, unit: 'g' },
        confidence: 0.7,
        conversionAssumptions: ['Reviewed mass conversion'],
        sourceMeals: [],
      },
    ],
    unresolvedItems: [
      {
        name: 'Unknown greens',
        required: { value: 1, unit: 'bunch' },
        reasonCode: 'REVIEWED_CONVERSION_UNAVAILABLE',
        explanation: 'No reviewed conversion',
        sourceMeals: [],
      },
    ],
    summary: {
      selectedMealCount: 1,
      readyItemCount: 1,
      missingItemCount: 1,
      unresolvedItemCount: 1,
    },
    pantryAsOf: '2026-10-03T00:00:00Z',
  });
  assert.equal(result.items[0].missing, '300 g');
  assert.equal(result.items[0].needsPurchase, true);
  assert.deepEqual(result.items[0].assumptions, ['Reviewed mass conversion']);
  assert.equal(result.unresolvedItems[0].required, '1 bunch');
  assert.equal(result.unresolvedItems[0].explanation, 'No reviewed conversion');
});
