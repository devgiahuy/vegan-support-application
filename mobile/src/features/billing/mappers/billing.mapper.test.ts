/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { catalogMapper, entitlementMapper, orderMapper } from './billing.mapper';
test('billing fails closed and keeps simulated provider disclosure', () => {
  assert.equal(catalogMapper.toModel({ enabled: true, provider: 'unknown' }).enabled, false);
  assert.equal(catalogMapper.toModel({ provider: 'sandbox' }).simulated, true);
});
test('billing normalizes available/held counts and over-limit Pantry', () => {
  const model = entitlementMapper.toModel({
    chatCredits: '2',
    chatReserved: '1',
    pantryUsed: '25',
    pantryLimit: '20',
  });
  assert.equal(model.chatCredits, 2);
  assert.equal(model.pantryFull, true);
  assert.match(model.usageRows[0]!.note, /1 đang giữ chỗ/);
});
test('billing never opens unsafe or terminal checkout URLs', () => {
  assert.equal(
    orderMapper.toModel({
      status: 'PENDING',
      provider: 'sandbox',
      checkoutUrl: 'javascript:alert(1)',
    }).checkoutUrl,
    null
  );
  assert.equal(
    orderMapper.toModel({
      status: 'PAID',
      provider: 'sandbox',
      checkoutUrl: 'https://example.test',
    }).checkoutUrl,
    null
  );
});
