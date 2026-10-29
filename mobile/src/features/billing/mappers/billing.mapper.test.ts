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
test('payOS catalog uses real payment disclosure and disables unavailable/retired providers', () => {
  const catalog = catalogMapper.toModel({ enabled: true, provider: 'payos', simulated: false });
  assert.equal(catalog.enabled, true);
  assert.equal(catalog.simulated, false);
  assert.equal(catalog.provider, 'payos');
  for (const provider of ['sandbox', 'vnpay', 'UNKNOWN']) {
    assert.equal(catalogMapper.toModel({ enabled: true, provider }).enabled, false);
  }
  assert.equal(
    catalogMapper.toModel({ enabled: true, provider: 'payos', simulated: true }).enabled,
    false
  );
  assert.equal(catalogMapper.toModel({ enabled: false, provider: 'payos' }).enabled, false);
});
test('payOS checkout accepts the hosted URL and rejects lookalike hosts', () => {
  const url = 'https://pay.payos.vn/web/' + 'a'.repeat(32);
  assert.equal(
    orderMapper.toModel({ status: 'PENDING', provider: 'payos', checkoutUrl: url }).checkoutUrl,
    url
  );
  for (const unsafe of [
    'http://pay.payos.vn/web/' + 'a'.repeat(32),
    'https://pay.payos.vn.evil.test/web/' + 'a'.repeat(32),
    'https://user:pass@pay.payos.vn/web/' + 'a'.repeat(32),
  ]) {
    assert.equal(
      orderMapper.toModel({ status: 'PENDING', provider: 'payos', checkoutUrl: unsafe })
        .checkoutUrl,
      null
    );
  }
});
test('historical orders preserve their provider without checkout or polling', () => {
  for (const provider of ['sandbox', 'vnpay']) {
    const order = orderMapper.toModel({
      provider,
      status: 'PENDING',
      checkoutUrl: 'https://pay.payos.vn/web/' + 'a'.repeat(32),
    });
    assert.equal(order.provider, provider);
    assert.equal(order.checkoutUrl, null);
    assert.equal(order.pending, false);
    assert.match(order.providerLabel, /Chỉ xem/);
  }
});
test('catalog splits one-time packs from duration plans and computes savings against the 1-month plan', () => {
  const catalog = catalogMapper.toModel({
    enabled: true,
    provider: 'payos',
    products: [
      { id: 'chat-pack', name: 'Chat', priceVnd: 20000, chatCredits: 50, durationMonths: null },
      { id: 'combo-12m', name: 'Combo năm', priceVnd: 580000, chatCredits: 100, fridgeCredits: 10, receiptCredits: 10, pantrySlots: 50, durationMonths: 12, periodDays: 30 },
      { id: 'combo-1m', name: 'Combo tháng', priceVnd: 69000, chatCredits: 100, fridgeCredits: 10, receiptCredits: 10, pantrySlots: 50, durationMonths: 1, periodDays: 30 },
    ],
  });
  assert.deepEqual(catalog.oneTimeProducts.map((item) => item.id), ['chat-pack']);
  assert.deepEqual(catalog.durationPlans.map((item) => item.id), ['combo-1m', 'combo-12m']);
  assert.equal(catalog.durationPlans[0]!.savingsPercent, 0);
  assert.equal(catalog.durationPlans[1]!.durationLabel, '1 năm');
  assert.equal(catalog.durationPlans[1]!.savingsPercent, 30);
  assert.match(catalog.durationPlans[0]!.periodBenefitLabels[0]!, /100 lượt chat AI mỗi 30 ngày/);
  assert.equal(catalog.durationPlans[0]!.periodBenefitLabels.at(-1), '+50 ô tủ đồ ăn khi còn hạn');
});
test('entitlements without subscription keep permanent balances and null subscription', () => {
  const model = entitlementMapper.toModel({ chatCredits: 5, subscription: null });
  assert.equal(model.subscription, null);
  assert.equal(model.chatAvailable, 5);
});
test('entitlements add period credits on top of permanent balances and label new ledger reasons', () => {
  const model = entitlementMapper.toModel({
    chatCredits: 5,
    fridgeCredits: 1,
    pantryLimit: 70,
    subscription: {
      productId: 'combo-1m',
      endsAt: '2026-11-27T00:00:00.000Z',
      periodEndsAt: '2026-11-27T00:00:00.000Z',
      periodDays: 30,
      chatCredits: 80,
      fridgeCredits: 9,
      receiptCredits: 10,
      pantrySlots: 50,
      chatPerPeriod: 100,
      fridgePerPeriod: 10,
      receiptPerPeriod: 10,
    },
    ledger: [{ id: 'l1', feature: 'CHAT', delta: 100, reason: 'SUBSCRIPTION_PERIOD_GRANT' }],
  });
  assert.equal(model.chatAvailable, 85);
  assert.equal(model.fridgeAvailable, 10);
  assert.equal(model.usageRows[0]!.value, '85 lượt');
  assert.match(model.usageRows[0]!.note, /gồm 80 lượt chu kỳ gói/);
  assert.equal(model.subscription?.periodRows[0]!.value, '80 / 100');
  assert.equal(model.ledger[0]!.reasonLabel, 'Cấp lượt chu kỳ gói tiện ích');
});
test('subscription without an end date is ignored and orders expose their duration', () => {
  assert.equal(entitlementMapper.toModel({ subscription: { chatCredits: 3 } }).subscription, null);
  assert.equal(orderMapper.toModel({ durationMonths: 3 }).durationLabel, '3 tháng');
  assert.equal(orderMapper.toModel({}).durationLabel, 'Mua một lần');
});
