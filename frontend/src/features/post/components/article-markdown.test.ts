import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ArticleMarkdown } from './article-markdown';

describe('ArticleMarkdown', () => {
  it('renders numbered list with bold items correctly without leaving literal **', () => {
    const markdown = `### 3. Nguồn nên dùng
1. **Thực phẩm tăng cường:** sữa thực vật, ngũ cốc ăn sáng.
2. **Viên bổ sung:** dạng cyanocobalamin.
3. **Theo dõi:** người ăn thuần chay lâu năm.`;

    const html = renderToStaticMarkup(createElement(ArticleMarkdown, { content: markdown }));

    // Headings and list elements must be separated
    expect(html).toContain('<h3');
    expect(html).toContain('3. Nguồn nên dùng</h3>');
    expect(html).toContain('<ol');
    expect(html).toContain('<li');

    // Bold text must be in strong tags, NOT literal **
    expect(html).toContain(
      '<strong class="font-semibold text-foreground">Thực phẩm tăng cường:</strong>'
    );
    expect(html).toContain('<strong class="font-semibold text-foreground">Viên bổ sung:</strong>');
    expect(html).toContain('<strong class="font-semibold text-foreground">Theo dõi:</strong>');
    expect(html).not.toContain('**');
  });

  it('renders unordered list with bullet items', () => {
    const markdown = `### 2. Những nguồn không đáng tin
- Tảo spirulina, rong biển nori.
- Rau chưa rửa kỹ hay nước giếng.`;

    const html = renderToStaticMarkup(createElement(ArticleMarkdown, { content: markdown }));

    expect(html).toContain('<h3');
    expect(html).toContain('<ul');
    expect(html).toContain('<li');
    expect(html).toContain('Tảo spirulina, rong biển nori.');
  });

  it('renders GFM markdown table properly', () => {
    const markdown = `| Thực phẩm | Protein |
|---|---|
| Đậu hũ | 8,1 g |
| Tempeh | 20,3 g |`;

    const html = renderToStaticMarkup(createElement(ArticleMarkdown, { content: markdown }));

    expect(html).toContain('<table');
    expect(html).toContain('<thead');
    expect(html).toContain('<tbody');
    expect(html).toContain('Thực phẩm');
    expect(html).toContain('Đậu hũ');
    expect(html).not.toContain('|---|---|');
  });

  it('returns null when content is empty', () => {
    const html = renderToStaticMarkup(createElement(ArticleMarkdown, { content: '' }));
    expect(html).toBe('');
  });
});
