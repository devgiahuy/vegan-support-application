/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pantryMapper } from './pantry.mapper';
import { isValidDateInput } from '../lib/date-input';

test('missing grams stays unknown; backend expiry status wins over client clock', () => {
  const item = pantryMapper.toModel({
    unmatchedText: 'Đậu',
    conversion: { status: 'UNKNOWN', normalizedGrams: null },
    expiresAt: '2099-01-01',
    expiryStatus: 'ALERT',
    daysUntilExpiry: 1,
  });
  assert.equal(item.conversion.normalizedGrams, null);
  assert.equal(item.expiryStatus, 'ALERT');
  assert.equal(item.daysRemaining, 1);
});

test('manual create sends one identity, omits blank note and retains operation key', () => {
  const values = {
    ingredientId: 'canonical-id',
    unmatchedText: 'not sent',
    quantity: 2,
    unit: 'g',
    freshnessNote: '',
    idempotencyKey: 'same-request-key',
  };
  const dto = pantryMapper.toCreateDto(values);
  assert.equal(dto.ingredientId, 'canonical-id');
  assert.equal(dto.unmatchedText, undefined);
  assert.equal(dto.freshnessNote, undefined);
  assert.equal(pantryMapper.toCreateDto(values).idempotencyKey, dto.idempotencyKey);
});

test('quantity adjustments use signed delta only for ADJUST', () => {
  const values = {
    amount: -3,
    unit: 'g',
    reason: 'Correction',
    expectedVersion: 7,
    idempotencyKey: 'adjust-key',
  };
  assert.deepEqual(pantryMapper.toAdjustmentDto({ ...values, type: 'ADJUST' }), {
    type: 'ADJUST',
    deltaQuantity: -3,
    unit: 'g',
    reason: 'Correction',
    expectedVersion: 7,
    idempotencyKey: 'adjust-key',
  });
  const consume = pantryMapper.toAdjustmentDto({
    ...values,
    amount: 3,
    type: 'CONSUME',
  });
  assert.equal('quantity' in consume && consume.quantity, 3);
  assert.equal('deltaQuantity' in consume, false);
});

test('empty observation fields become explicit null to clear dates and note', () => {
  assert.deepEqual(
    pantryMapper.toUpdateDto({
      expectedVersion: 2,
      purchasedAt: '',
      openedAt: '',
      expiresAt: '',
      freshnessNote: '',
    }),
    {
      expectedVersion: 2,
      purchasedAt: null,
      openedAt: null,
      expiresAt: null,
      freshnessNote: null,
    }
  );
});

test('date validation rejects calendar rollover and accepts leap days', () => {
  assert.equal(isValidDateInput('2026-02-30'), false);
  assert.equal(isValidDateInput('2026-02-29'), false);
  assert.equal(isValidDateInput('2028-02-29'), true);
  assert.equal(isValidDateInput(''), true);
});

test('merge preserves each optimistic version and confirmation key', () => {
  const values = {
    targetItemId: 'a',
    items: [
      { id: 'a', expectedVersion: 3 },
      { id: 'b', expectedVersion: 9 },
    ],
    idempotencyKey: 'merge-key',
  };
  assert.deepEqual(pantryMapper.toMergeDto(values), values);
});
