import { describe, expect, it } from 'vitest';
import {
  catalogMapper,
  entitlementMapper,
  orderMapper,
  productMapper,
} from '@/features/billing/mappers/billing.mapper';

describe('billing mapper', () => {
  it('fails closed for absent provider and malformed catalog', () => {
    expect(catalogMapper.toModel(null)).toMatchObject({
      enabled: false,
      simulated: true,
      products: [],
    });
    expect(catalogMapper.toModel({ enabled: true, provider: 'unknown' }).enabled).toBe(false);
    expect(productMapper.toModel(null).canBuy).toBe(false);
  });
  it('normalizes string amounts and formats package benefits', () => {
    const product = productMapper.toModel({
      id: 'combo',
      priceVnd: '69000',
      chatCredits: '100',
      pantrySlots: '50',
    });
    expect(product.canBuy).toBe(true);
    expect(product.benefitLabels).toEqual(['100 lượt chat AI', '50 ô tủ đồ ăn']);
    expect(product.priceLabel).toContain('69');
  });
  it('never offers checkout for unknown/terminal status or unsafe URL', () => {
    expect(
      orderMapper.toModel({
        status: 'PAID',
        provider: 'sandbox',
        checkoutUrl: 'https://example.test',
      }).checkoutUrl
    ).toBeNull();
    expect(
      orderMapper.toModel({
        status: 'PENDING',
        provider: 'sandbox',
        checkoutUrl: 'javascript:alert(1)',
      }).checkoutUrl
    ).toBeNull();
    expect(orderMapper.toModel({ status: 'invented' }).status).toBe('UNKNOWN');
  });
  it('preserves historical providers without allowing new purchases', () => {
    expect(orderMapper.toModel({ provider: 'sandbox' }).simulated).toBe(true);
    expect(
      catalogMapper.toModel({ enabled: true, provider: 'vnpay', simulated: false }).providerLabel
    ).toBe('VNPAY Sandbox cũ · Chỉ xem');
    expect(catalogMapper.toModel({ enabled: true, provider: 'vnpay' }).enabled).toBe(false);
    expect(catalogMapper.toModel({ enabled: true, provider: 'sandbox' }).enabled).toBe(false);
  });
  it('counts full/over-limit Pantry and preserves disabled limit', () => {
    expect(entitlementMapper.toModel({ pantryUsed: '22', pantryLimit: '20' }).pantryFull).toBe(
      true
    );
    expect(entitlementMapper.toModel({ pantryUsed: 5, pantryLimit: null }).pantryFull).toBe(false);
    expect(entitlementMapper.toModel({ chatCredits: '-1' }).chatCredits).toBe(0);
  });
  it('maps held counts and ledger strings safely', () => {
    const model = entitlementMapper.toModel({
      chatCredits: '2',
      chatReserved: '1',
      ledger: [{ feature: 'CHAT', delta: '-1', reason: 'USAGE_RESERVED', createdAt: 'invalid' }],
    });
    expect(model.usageRows[0].note).toContain('1 đang giữ chỗ');
    expect(model.ledger[0]).toMatchObject({
      featureLabel: 'Chat AI',
      deltaLabel: '-1',
      reasonLabel: 'Giữ chỗ cho tác vụ',
      createdAtLabel: 'Chưa có',
    });
  });
  it('maps empty history and a validated pending checkout', () => {
    expect(orderMapper.toOrders(null)).toEqual({ items: [], page: 1, totalPages: 0, total: 0 });
    expect(
      orderMapper.toModel({
        status: 'PENDING',
        provider: 'payos',
        checkoutUrl: 'https://pay.payos.vn/web/' + 'a'.repeat(32),
      }).checkoutUrl
    ).toBe('https://pay.payos.vn/web/' + 'a'.repeat(32));
  });
  it('recognizes real payOS and fails closed for contradictory simulation flags', () => {
    expect(
      catalogMapper.toModel({ enabled: true, provider: 'payos', simulated: false })
    ).toMatchObject({
      provider: 'payos',
      enabled: true,
      simulated: false,
      providerLabel: 'payOS · Chuyển khoản / QR',
    });
    expect(
      catalogMapper.toModel({ enabled: true, provider: 'payos', simulated: true }).enabled
    ).toBe(false);
    expect(catalogMapper.toModel({ enabled: false, provider: 'payos' }).enabled).toBe(false);
  });
  it('rejects lookalike checkout hosts and keeps legacy orders read-only', () => {
    for (const url of [
      'http://pay.payos.vn/web/' + 'a'.repeat(32),
      'https://pay.payos.vn.evil.test/web/' + 'a'.repeat(32),
      'https://evil.test',
      'https://user:pass@pay.payos.vn/web/' + 'a'.repeat(32),
    ]) {
      expect(
        orderMapper.toModel({ status: 'PENDING', provider: 'payos', checkoutUrl: url }).checkoutUrl
      ).toBeNull();
    }
    expect(
      orderMapper.toModel({
        status: 'PENDING',
        provider: 'sandbox',
        checkoutUrl: 'http://localhost:4100/checkout',
      })
    ).toMatchObject({ provider: 'sandbox', checkoutUrl: null, pending: false });
    expect(
      orderMapper.toModel({
        status: 'PENDING',
        provider: 'vnpay',
        checkoutUrl: 'https://sandbox.vnpayment.vn/checkout',
      })
    ).toMatchObject({ provider: 'vnpay', checkoutUrl: null, pending: false });
  });
  it('groups duration plans with savings and keeps one-time packs separate', () => {
    const catalog = catalogMapper.toModel({
      enabled: true,
      provider: 'payos',
      products: [
        { id: 'chat-100', priceVnd: 29000, chatCredits: 100, durationMonths: null },
        {
          id: 'combo-12m',
          priceVnd: 580000,
          chatCredits: 100,
          pantrySlots: 50,
          durationMonths: 12,
          periodDays: 30,
        },
        {
          id: 'combo-1m',
          priceVnd: 69000,
          chatCredits: 100,
          pantrySlots: 50,
          durationMonths: 1,
          periodDays: 30,
        },
        {
          id: 'combo-3m',
          priceVnd: '176000',
          chatCredits: 100,
          pantrySlots: 50,
          durationMonths: '3',
          periodDays: 30,
        },
      ],
    });
    expect(catalog.oneTimeProducts.map((p) => p.id)).toEqual(['chat-100']);
    expect(catalog.durationPlans.map((p) => [p.id, p.durationLabel, p.savingsPercent])).toEqual([
      ['combo-1m', '1 tháng', 0],
      ['combo-3m', '3 tháng', 15],
      ['combo-12m', '1 năm', 30],
    ]);
    expect(catalog.durationPlans[0]?.periodBenefitLabels).toEqual([
      '100 lượt chat AI mỗi 30 ngày',
      '+50 ô tủ đồ ăn khi còn hạn',
    ]);
    expect(catalog.oneTimeProducts[0]?.periodBenefitLabels).toEqual([]);
    expect(orderMapper.toModel({ durationMonths: 3 }).durationLabel).toBe('3 tháng');
  });
  it('adds active subscription period credits to available allowances', () => {
    const model = entitlementMapper.toModel({
      enabled: true,
      provider: 'payos',
      chatCredits: 5,
      fridgeCredits: 1,
      receiptCredits: 0,
      subscription: {
        productId: 'combo-3m',
        endsAt: '2027-01-25T00:00:00.000Z',
        periodEndsAt: '2026-11-26T00:00:00.000Z',
        periodDays: 30,
        chatCredits: 90,
        fridgeCredits: 10,
        receiptCredits: 10,
        pantrySlots: 50,
        chatPerPeriod: 100,
        fridgePerPeriod: 10,
        receiptPerPeriod: 10,
      },
    });
    expect(model.chatAvailable).toBe(95);
    expect(model.fridgeAvailable).toBe(11);
    expect(model.subscription?.periodRows[0]).toEqual({ label: 'Chat AI', value: '90 / 100' });
    expect(model.usageRows[0]?.value).toBe('95 lượt');
    expect(entitlementMapper.toModel({ subscription: null }).subscription).toBeNull();
  });
});
