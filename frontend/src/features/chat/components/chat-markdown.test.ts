import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChatMarkdown } from './chat-markdown';

describe('chat answer Markdown', () => {
  it('renders a Vietnamese meal table with semantic headings and column headers', () => {
    const html = renderToStaticMarkup(
      createElement(ChatMarkdown, {
        content:
          '### Thực đơn chay\n\n| Bữa | Món ăn | Đạm |\n| --- | --- | ---: |\n| **Sáng** | Đậu hũ | 18 g |\n\n**Tổng:** khoảng 70 g.',
      })
    );
    expect(html).toContain('<h4');
    expect(html).toContain('Thực đơn chay');
    expect(html).toContain('<table');
    expect(html).toContain('scope="col"');
    expect(html).toContain('<strong');
    expect(html).toContain('Đậu hũ');
    expect(html).not.toContain('| ---');
  });
  it('supports nested lists, links, code and an unfinished streamed fence without losing text', () => {
    const html = renderToStaticMarkup(
      createElement(ChatMarkdown, {
        content:
          '1. **Bữa sáng**\n   - Đậu hũ\n\n[Xem thêm](https://example.com)\n\n```text\nGiữ  khoảng trắng\n',
      })
    );
    expect(html).toContain('<ol');
    expect(html).toContain('<ul');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('<pre');
    expect(html).toContain('Giữ  khoảng trắng');
  });
  it('does not execute raw HTML, unsafe links or load generated images', () => {
    const html = renderToStaticMarkup(
      createElement(ChatMarkdown, {
        content:
          '<script>alert(1)</script>\n\n[unsafe](javascript:alert%281%29)\n\n![Ảnh minh họa](https://example.com/tracker.png)',
      })
    );
    expect(html).not.toContain('<script');
    expect(html).not.toContain('href="javascript:');
    expect(html).not.toContain('<img');
    expect(html).toContain('Ảnh minh họa');
  });
});
