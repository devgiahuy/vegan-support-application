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
  it('keeps sandbox disclosure and provider identity', () => {
    expect(orderMapper.toModel({ provider: 'sandbox' }).simulated).toBe(true);
    expect(
      catalogMapper.toModel({ enabled: true, provider: 'vnpay', simulated: false }).providerLabel
    ).toBe('VNPAY Sandbox');
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
        provider: 'sandbox',
        checkoutUrl: 'http://localhost:4100/checkout',
      }).checkoutUrl
    ).toBe('http://localhost:4100/checkout');
  });
});
