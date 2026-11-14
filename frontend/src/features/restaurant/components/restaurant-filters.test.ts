import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { RestaurantFilters } from './restaurant-filters';

describe('restaurant directory filters', () => {
  it('keeps keyword/radius/advanced filters and removes the diet-type control', () => {
    const noop = () => undefined;
    const html = renderToStaticMarkup(
      createElement(RestaurantFilters, {
        query: '',
        radiusM: 5000,
        advanced: {},
        searchMode: 'NEARBY',
        onQueryChange: noop,
        onRadiusChange: noop,
        onAdvancedChange: noop,
        onClearAll: noop,
      })
    );
    expect(html).toContain('restaurant-query');
    expect(html).toContain('restaurant-radius');
    expect(html).not.toContain('restaurant-diet');
    expect(html).not.toContain('Loại quán chay');
  });
});
