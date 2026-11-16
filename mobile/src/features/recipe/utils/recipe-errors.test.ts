/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getContentErrorMessage } from './recipe-errors';

function apiError(code: string, fields?: Record<string, unknown>) {
  return { isAxiosError: true, response: { status: 422, data: { success: false, error: { code, message: 'x', fields } } } };
}

test('RECIPE_NUTRITION_REQUIRED lists the missing metrics from fields.missingMetrics', () => {
  const message = getContentErrorMessage(apiError('RECIPE_NUTRITION_REQUIRED', { missingMetrics: ['calories', 'vitaminB12Mcg'] }));
  assert.match(message, /năng lượng, vitamin B12/);
  assert.match(message, /Phân loại/);
});

test('RECIPE_NUTRITION_REQUIRED still reads well without the field list', () => {
  const message = getContentErrorMessage(apiError('RECIPE_NUTRITION_REQUIRED'));
  assert.match(message, /6 chỉ số dinh dưỡng/);
  assert.doesNotMatch(message, /còn thiếu/);
});
