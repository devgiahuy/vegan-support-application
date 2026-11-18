/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getMealProgramErrorMessage } from './meal-program-errors';

function apiError(code: string, fields?: Record<string, unknown>) {
  return {
    isAxiosError: true,
    response: { status: 409, data: { success: false, error: { code, message: 'x', fields } } },
  };
}

test('a changed dietary revision asks the user to reload instead of selecting fasting dates', () => {
  assert.match(getMealProgramErrorMessage(apiError('DIETARY_REVISION_CONFLICT')), /Hồ sơ ăn uống đã thay đổi/);
});

test('MEAL_PROGRAM_HARD_CONSTRAINT_VIOLATION converts zero-based week indexes', () => {
  const message = getMealProgramErrorMessage(
    apiError('MEAL_PROGRAM_HARD_CONSTRAINT_VIOLATION', { weekIndexes: ['0', '2'] })
  );
  assert.match(message, /tuần 1, 3/);
});
