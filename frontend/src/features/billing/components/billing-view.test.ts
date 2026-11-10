import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { catalogMapper, orderMapper } from '@/features/billing/mappers/billing.mapper';
import { DurationPlanCard, OrderRow } from '@/features/billing/components/billing-view';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('BillingView duration and order display', () => {
  it('renders duration plan toggles without duplicating 30/90/360 ngày', () => {
    const catalog = catalogMapper.toModel({
      enabled: true,
      provider: 'payos',
      products: [
        {
          id: 'combo-1m',
          name: 'Gói tiện ích 30 ngày',
          description:
            'Mỗi 30 ngày: 300 lượt chat, 30 lượt mỗi loại phân tích; thêm 50 ô tủ đồ ăn khi còn hạn.',
          priceVnd: 69000,
          chatCredits: 300,
          fridgeCredits: 30,
          receiptCredits: 30,
          pantrySlots: 50,
          durationMonths: 1,
          periodDays: 30,
        },
        {
          id: 'combo-3m',
          name: 'Gói tiện ích 90 ngày',
          description:
            'Mỗi 30 ngày: 300 lượt chat, 30 lượt mỗi loại phân tích; thêm 50 ô tủ đồ ăn khi còn hạn.',
          priceVnd: 176000,
          chatCredits: 300,
          fridgeCredits: 30,
          receiptCredits: 30,
          pantrySlots: 50,
          durationMonths: 3,
          periodDays: 30,
        },
        {
          id: 'combo-12m',
          name: 'Gói tiện ích 360 ngày',
          description:
            'Mỗi 30 ngày: 300 lượt chat, 30 lượt mỗi loại phân tích; thêm 50 ô tủ đồ ăn khi còn hạn.',
          priceVnd: 580000,
          chatCredits: 300,
          fridgeCredits: 30,
          receiptCredits: 30,
          pantrySlots: 50,
          durationMonths: 12,
          periodDays: 30,
        },
      ],
    });

    const html = renderToStaticMarkup(
      React.createElement(DurationPlanCard, {
        plans: catalog.durationPlans,
        enabled: true,
        pendingProductId: null,
        onBuy: vi.fn(),
      })
    );

    expect(html).toContain('Gói tiện ích 30 ngày');
    expect(html).toContain('Gói tiện ích 90 ngày');
    expect(html).toContain('Gói tiện ích 360 ngày');
    expect(html).not.toContain('30 ngày · 30 ngày');
    expect(html).not.toContain('90 ngày · 90 ngày');
    expect(html).not.toContain('360 ngày · 360 ngày');
  });

  it('appends duration in OrderRow only when productName omits it', () => {
    const sameNameOrder = orderMapper.toModel({
      id: 'ord-1',
      productId: 'combo-1m',
      productName: 'Gói tiện ích 30 ngày',
      durationMonths: 1,
      priceVnd: 69000,
      provider: 'payos',
      status: 'PAID',
    });
    const customNameOrder = orderMapper.toModel({
      id: 'ord-2',
      productId: 'combo-vip',
      productName: 'Gói Cơ Bản',
      durationMonths: 3,
      priceVnd: 176000,
      provider: 'payos',
      status: 'PAID',
    });

    const sameNameHtml = renderToStaticMarkup(
      React.createElement(OrderRow, {
        order: sameNameOrder,
        onRefresh: vi.fn(),
        refreshing: false,
      })
    );
    const customNameHtml = renderToStaticMarkup(
      React.createElement(OrderRow, {
        order: customNameOrder,
        onRefresh: vi.fn(),
        refreshing: false,
      })
    );

    expect(sameNameHtml).toContain('Gói tiện ích 30 ngày');
    expect(sameNameHtml).not.toContain('30 ngày · 30 ngày');
    expect(customNameHtml).toContain('Gói Cơ Bản');
    expect(customNameHtml).toContain('90 ngày');
  });
});
