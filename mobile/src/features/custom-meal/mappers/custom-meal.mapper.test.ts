/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { customMealMapper } from './custom-meal.mapper';
import type { CustomMealFormValues } from '../types/custom-meal.model';

const BASE = { id: 'm1', name: 'Cơm', servings: 1, ingredients: [], photos: [], tags: [] };

test('automatic and AI values are shown but never treated as manual overrides', () => {
  const meal = customMealMapper.toModel({
    ...BASE,
    userCalories: 520,
    userProteinGrams: 18,
    userCarbsGrams: 70,
    nutritionMetadata: {
      metrics: {
        calories: { origin: 'USER_PROVIDED' },
        proteinGrams: { origin: 'CANONICAL_CALCULATED' },
        carbsGrams: { origin: 'AI_ESTIMATED' },
      },
      assumptions: ['1 bát cơm ~ 200g'],
      ai: { used: true },
    },
  });
  assert.equal(meal.calories, 520);
  assert.equal(meal.proteinGrams, 18);
  assert.deepEqual(meal.manual, { calories: 520, proteinGrams: null, carbsGrams: null, fatGrams: null, fiberGrams: null });
  assert.equal(meal.hasAiEstimate, true);
  assert.equal(meal.nutritionOrigins.carbsGrams, 'AI_ESTIMATED');
  assert.ok(meal.nutritionNotes.includes('1 bát cơm ~ 200g'));
});

test('legacy meals without metadata keep their values as manual', () => {
  const meal = customMealMapper.toModel({ ...BASE, userCalories: 300 });
  assert.equal(meal.manual.calories, 300);
  assert.equal(meal.hasAiEstimate, false);
});

test('update sends null only for a cleared manual override', () => {
  const initial = customMealMapper.toModel({ ...BASE, userCalories: 300, userProteinGrams: 10 });
  const values: CustomMealFormValues = {
    name: 'Cơm',
    notes: '',
    servings: 1,
    sourceNote: '',
    userCalories: null,
    userProteinGrams: 10,
    userCarbsGrams: null,
    userFatGrams: null,
    userFiberGrams: null,
    tags: [],
    ingredients: [],
  };
  const dto = customMealMapper.toUpdateDto(values, initial);
  assert.equal(dto.userCalories, null);
  assert.equal(dto.userProteinGrams, 10);
  assert.equal('userCarbsGrams' in dto, false);
});

test('explicit zero is preserved as a manual value', () => {
  const values: CustomMealFormValues = {
    name: 'Nước',
    notes: '',
    servings: 1,
    sourceNote: '',
    userCalories: 0,
    userProteinGrams: null,
    userCarbsGrams: null,
    userFatGrams: null,
    userFiberGrams: null,
    tags: [],
    ingredients: [],
  };
  assert.equal(customMealMapper.toCreateDto(values).userCalories, 0);
});
