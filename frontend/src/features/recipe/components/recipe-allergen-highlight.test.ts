import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RecipeAllergenHighlight } from './recipe-allergen-highlight';

describe('personal allergy warning visibility', () => {
  it('renders nothing for a guest, missing assessment, or no saved allergy match', () => {
    expect(renderToStaticMarkup(createElement(RecipeAllergenHighlight))).toBe('');
    expect(renderToStaticMarkup(createElement(RecipeAllergenHighlight, { warnings: [] }))).toBe('');
  });

  it('shows the matched peanut allergy and its ingredient, without a soy warning', () => {
    const html = renderToStaticMarkup(
      createElement(RecipeAllergenHighlight, {
        warnings: [
          {
            kind: 'ALLERGEN',
            identifier: 'PEANUT',
            label: 'Đậu phộng (lạc)',
            ingredientNames: ['Sốt đậu phộng'],
          },
        ],
      })
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain('Đậu phộng (lạc)');
    expect(html).toContain('Sốt đậu phộng');
    expect(html).not.toContain('Đậu nành');
  });

  it('shows a matched specific ingredient allergy even without a broad allergen group', () => {
    const html = renderToStaticMarkup(
      createElement(RecipeAllergenHighlight, {
        warnings: [
          {
            kind: 'INGREDIENT',
            identifier: 'shiitake-id',
            label: 'Nấm hương',
            ingredientNames: ['Hỗn hợp nấm'],
          },
        ],
      })
    );
    expect(html).toContain('Nấm hương');
    expect(html).toContain('Hỗn hợp nấm');
  });
});
