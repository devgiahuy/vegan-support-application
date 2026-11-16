import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ChatPurchasedAllowance } from './allowance-notice';
import { QuotaBanner } from '@/features/chat/components/quota-banner';

describe('free chat and purchased balance display', () => {
  it('does not label zero purchased credits as exhausted while 49 free turns remain', () => {
    const balance = renderToStaticMarkup(createElement(ChatPurchasedAllowance, { credits: 0 }));
    const quota = renderToStaticMarkup(
      createElement(QuotaBanner, {
        quota: {
          used: 1,
          limit: 50,
          remaining: 49,
          paidRemaining: 0,
          resetAtLabel: '00:00',
          exhausted: false,
        },
      })
    );
    expect(balance).toContain('Lượt chat mua thêm:');
    expect(balance).toContain('không bao gồm lượt miễn phí');
    expect(balance).not.toContain('Đã hết lượt');
    expect(balance).not.toContain('bg-amber');
    expect(quota).toContain('49/50');
    expect(quota).not.toContain('Bạn đã dùng hết');
  });
  it('shows exhaustion only when the authoritative total quota is exhausted', () => {
    const html = renderToStaticMarkup(
      createElement(QuotaBanner, {
        quota: {
          used: 50,
          limit: 50,
          remaining: 0,
          paidRemaining: 0,
          resetAtLabel: '00:00',
          exhausted: true,
        },
      })
    );
    expect(html).toContain('Bạn đã dùng hết lượt hiện có');
  });
  it('keeps purchased turns usable when daily free turns are depleted', () => {
    const html = renderToStaticMarkup(
      createElement(QuotaBanner, {
        quota: {
          used: 50,
          limit: 50,
          remaining: 0,
          paidRemaining: 2,
          resetAtLabel: '00:00',
          exhausted: false,
        },
      })
    );
    expect(html).toContain('2 lượt mua thêm');
    expect(html).not.toContain('Bạn đã dùng hết');
  });
});
