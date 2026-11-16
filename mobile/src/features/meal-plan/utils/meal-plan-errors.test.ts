/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getMealPlanErrorMessage } from './meal-plan-errors';

function apiError(code: string, fields?: Record<string, unknown>) {
  return { isAxiosError: true, response: { status: 409, data: { success: false, error: { code, message: 'x', fields } } } };
}

test('unverified ingredients are explained as "cannot verify", not as a violation, and name the ingredients', () => {
  const message = getMealPlanErrorMessage(apiError('MEAL_PLAN_INGREDIENTS_UNVERIFIED', { reasons: ['UNRESOLVED_INGREDIENT'], unverifiedIngredients: ['Tự do', ' Nấm lạ '] }));
  assert.match(message, /Tự do, Nấm lạ/);
  assert.match(message, /không phải vi phạm/);
});

test('unverified ingredients message works without the ingredient list; hard violation keeps its own wording', () => {
  assert.match(getMealPlanErrorMessage(apiError('MEAL_PLAN_INGREDIENTS_UNVERIFIED')), /Chưa xác minh được/);
  assert.match(getMealPlanErrorMessage(apiError('MEAL_PLAN_HARD_CONSTRAINT_VIOLATION')), /vi phạm chế độ ăn/);
});
