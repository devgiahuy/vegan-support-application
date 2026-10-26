/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatIneligibilityReason, getIneligibilityReasonLabel } from './recipe-eligibility';

test('getIneligibilityReasonLabel maps known codes and falls back safely', () => {
  assert.equal(getIneligibilityReasonLabel('DIET_PATTERN'), 'Không đúng kiểu ăn của bạn');
  assert.equal(getIneligibilityReasonLabel('SOMETHING_NEW'), 'Không phù hợp với hồ sơ của bạn');
});

test('formatIneligibilityReason lists offending ingredients when present', () => {
  assert.equal(
    formatIneligibilityReason({ code: 'DIET_PATTERN', label: 'Không đúng kiểu ăn của bạn', ingredientNames: ['Sữa bò'] }),
    'Không đúng kiểu ăn của bạn: Sữa bò'
  );
  assert.equal(
    formatIneligibilityReason({ code: 'TRADITION_RULE', label: 'Vi phạm quy tắc', ingredientNames: [] }),
    'Vi phạm quy tắc'
  );
});
