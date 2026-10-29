import { describe, expect, it } from 'vitest';
import {
  toAiUsagePage,
  toAiUsageRequest,
  toRevenueRequest,
  toRevenueStats,
} from '@/features/admin-insights/mappers/admin-insights.mapper';

describe('admin insights mapper', () => {
  it('maps revenue overview, series and statuses', () => {
    const stats = toRevenueStats({
      window: {
        from: '2026-10-01T00:00:00.000Z',
        to: '2026-10-27T00:00:00.000Z',
        granularity: 'week',
      },
      overview: { revenueVnd: '245000', paidOrders: 2, buyers: 1, averageOrderVnd: 122500 },
      series: [
        { bucketStart: '2026-10-19T17:00:00.000Z', revenueVnd: 0, paidOrders: 0 },
        { bucketStart: '2026-10-26T17:00:00.000Z', revenueVnd: 245000, paidOrders: 2 },
      ],
      statuses: {
        total: 4,
        counts: [
          { status: 'PAID', count: 2 },
          { status: 'EXPIRED', count: 2 },
        ],
        successRate: 0.5,
      },
    });
    expect(stats.paidOrders).toBe(2);
    expect(stats.revenueLabel).toContain('245');
    expect(stats.maxBucketRevenue).toBe(245000);
    expect(stats.series[1]).toMatchObject({ label: 'Tuần 27/10', paidOrders: 2 });
    expect(stats.statuses[0]).toMatchObject({ label: 'Đã thanh toán', shareLabel: '50%' });
    expect(stats.successRateLabel).toBe('50%');
  });

  it('fails closed for malformed revenue payloads', () => {
    const stats = toRevenueStats(null);
    expect(stats).toMatchObject({
      paidOrders: 0,
      series: [],
      averageOrderLabel: '—',
      successRateLabel: '—',
      maxBucketRevenue: 0,
    });
  });

  it('builds revenue windows from presets', () => {
    const now = new Date('2026-10-27T10:00:00.000Z');
    expect(toRevenueRequest({ preset: '7d', granularity: 'day' }, now)).toEqual({
      from: '2026-10-20T10:00:00.000Z',
      to: '2026-10-27T10:00:00.000Z',
      granularity: 'day',
    });
    expect(toRevenueRequest({ preset: '12m', granularity: 'month' }, now).from).toBe(
      '2025-10-27T10:00:00.000Z'
    );
  });

  it('serializes usage filters in Vietnam time and omits empty values', () => {
    expect(
      toAiUsageRequest({ feature: 'ALL', outcome: 'ALL', user: '  ', from: '', to: '' }, 1)
    ).toEqual({ page: 1, limit: 20 });
    expect(
      toAiUsageRequest(
        {
          feature: 'FRIDGE',
          outcome: 'RELEASED',
          user: ' an@x.vn ',
          from: '2026-10-01',
          to: '2026-10-02',
        },
        3
      )
    ).toEqual({
      page: 3,
      limit: 20,
      feature: 'FRIDGE',
      outcome: 'RELEASED',
      user: 'an@x.vn',
      from: '2026-09-30T17:00:00.000Z',
      to: '2026-10-02T16:59:59.999Z',
    });
  });

  it('maps usage rows with sources, outcomes and unknown values', () => {
    const page = toAiUsagePage({
      success: true,
      data: [
        {
          id: 'chat:1',
          feature: 'CHAT',
          occurredAt: '2026-10-27T03:00:00.000Z',
          user: { id: 'u', displayName: 'An', email: 'an@x.vn' },
          quotaSource: 'FREE_DAILY',
          quotaCharged: 0,
          outcome: 'SPENT',
          aiStatus: 'SUCCESS',
          provider: 'openai',
          modelId: 'model-a',
          inputTokens: 12,
          outputTokens: 30,
          latencyMs: 800,
          errorCode: null,
        },
        { id: 'usage:2', feature: 'X', quotaSource: 'Y', outcome: 'Z', user: null },
      ],
      meta: { page: 1, limit: 20, total: '2', totalPages: 1 },
    });
    expect(page.total).toBe(2);
    expect(page.items[0]).toMatchObject({
      featureLabel: 'Chat AI',
      quotaSourceLabel: 'Miễn phí hằng ngày',
      outcomeLabel: 'Đã dùng',
      aiStatusLabel: 'Thành công',
      providerLabel: 'openai / model-a',
      tokensLabel: '12 / 30',
      latencyLabel: '800 ms',
    });
    expect(page.items[1]).toMatchObject({
      feature: 'UNKNOWN',
      quotaSource: 'UNKNOWN',
      outcome: 'UNKNOWN',
      userName: 'Tài khoản đã xóa',
      tokensLabel: '—',
    });
  });
});
