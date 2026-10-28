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

test('DIET_SCHEDULE_REQUIRED lists every missing week from the backend', () => {
  const message = getMealProgramErrorMessage(
    apiError('DIET_SCHEDULE_REQUIRED', { weekStarts: ['2026-11-02', '2026-11-09'] })
  );
  assert.match(message, /02\/11\/2026, 09\/11\/2026/);
});

test('DIET_SCHEDULE_REQUIRED without fields keeps the generic guidance', () => {
  assert.match(getMealProgramErrorMessage(apiError('DIET_SCHEDULE_REQUIRED')), /chay kỳ/);
});

test('MEAL_PROGRAM_HARD_CONSTRAINT_VIOLATION converts zero-based week indexes', () => {
  const message = getMealProgramErrorMessage(
    apiError('MEAL_PROGRAM_HARD_CONSTRAINT_VIOLATION', { weekIndexes: ['0', '2'] })
  );
  assert.match(message, /tuần 1, 3/);
});
