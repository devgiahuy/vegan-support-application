/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { recipeMapper } from './recipe.mapper';
import type { RecipeDetailDto } from '../types/recipe.dto';

function dto(overrides: Record<string, unknown> = {}): RecipeDetailDto {
  return {
    id: 'recipe-1',
    status: 'PUBLISHED',
    revision: { title: 'Phở nấm', body: 'Nội dung' },
    recipe: {
      servings: 2,
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      difficulty: 'MEDIUM',
      ingredients: [],
      steps: [],
    },
    ...overrides,
  } as unknown as RecipeDetailDto;
}

test('missing nutrition stays null instead of becoming zero', () => {
  const recipe = recipeMapper.toModel(dto());
  assert.equal(recipe.nutrition.calories, null);
  assert.equal(recipe.nutrition.protein, null);
  assert.equal(recipe.nutrition.vitaminB12, null);
});

test('a real zero nutrient value is kept, not treated as missing', () => {
  const recipe = recipeMapper.toModel(
    dto({ recipe: { servings: 1, nutrition: { calories: 0, proteinGrams: 12.5 }, ingredients: [], steps: [] } })
  );
  assert.equal(recipe.nutrition.calories, 0);
  assert.equal(recipe.nutrition.protein, 12.5);
});

test('unknown difficulty falls back to the easiest level and total time adds prep and cook', () => {
  const recipe = recipeMapper.toModel(
    dto({ recipe: { difficulty: 'IMPOSSIBLE', prepTimeMinutes: 5, cookTimeMinutes: 25, ingredients: [], steps: [] } })
  );
  assert.equal(recipe.difficulty, 'EASY');
  assert.equal(recipe.totalTimeMinutes, 30);
});

test('steps without text are dropped and the rest are ordered by position', () => {
  const recipe = recipeMapper.toModel(
    dto({
      recipe: {
        servings: 2,
        ingredients: [],
        steps: [
          { position: 2, instruction: 'Bước ba' },
          { position: 0, instruction: 'Bước một' },
          { position: 1, instruction: '' },
        ],
      },
    })
  );
  assert.deepEqual(
    recipe.steps.map((step) => step.instruction),
    ['Bước một', 'Bước ba']
  );
});

test('ingredients keep their canonical id only when the backend sent one', () => {
  const recipe = recipeMapper.toModel(
    dto({
      recipe: {
        servings: 2,
        ingredients: [
          { position: 0, displayName: 'Nấm', amount: 200, unit: 'g', ingredientId: 'canonical-1' },
          { position: 1, displayName: 'Hành', amount: 1, unit: 'củ' },
        ],
        steps: [],
      },
    })
  );
  assert.equal(recipe.ingredients[0].ingredientId, 'canonical-1');
  assert.equal(recipe.ingredients[1].ingredientId, null);
});

test('pagination keeps the applied safety constraints returned by the backend', () => {
  const result = recipeMapper.toPaginationFromEnvelope([dto()], {
    page: 2,
    limit: 20,
    total: 41,
    totalPages: 3,
    appliedConstraints: {
      authenticated: true,
      dietPattern: 'VEGAN',
      allergyCount: 2,
      ingredientExclusionCount: 1,
      traditions: [],
      forDate: '2026-10-13',
    },
  });
  assert.equal(result.items.length, 1);
  assert.equal(result.metadata.page, 2);
  assert.equal(result.metadata.totalItems, 41);
  assert.equal(result.metadata.appliedConstraints?.allergyCount, 2);
  assert.equal(result.metadata.appliedConstraints?.dietPattern, 'VEGAN');
});

test('pagination without constraints does not invent any', () => {
  const result = recipeMapper.toPaginationFromEnvelope([dto()], { page: 1, total: 1 });
  assert.equal(result.metadata.appliedConstraints, undefined);
});
