import { describe, it, expect } from 'vitest';
import { isFooterHidden, HIDDEN_FOOTER_PREFIXES } from './site-footer-routes';

describe('site-footer-routes', () => {
  it('defines correct hidden prefixes', () => {
    expect(HIDDEN_FOOTER_PREFIXES).toContain('/assistant');
    expect(HIDDEN_FOOTER_PREFIXES).toContain('/meal-plans');
    expect(HIDDEN_FOOTER_PREFIXES).toContain('/restaurants');
  });

  it('hides footer on /meal-plans and subpaths', () => {
    expect(isFooterHidden('/meal-plans')).toBe(true);
    expect(isFooterHidden('/meal-plans/weekly')).toBe(true);
    expect(isFooterHidden('/meal-plans/plan-123')).toBe(true);
  });

  it('hides footer on /restaurants and subpaths', () => {
    expect(isFooterHidden('/restaurants')).toBe(true);
    expect(isFooterHidden('/restaurants/nearby')).toBe(true);
    expect(isFooterHidden('/restaurants/search')).toBe(true);
  });

  it('hides footer on /assistant', () => {
    expect(isFooterHidden('/assistant')).toBe(true);
  });

  it('keeps footer visible on content routes', () => {
    expect(isFooterHidden('/')).toBe(false);
    expect(isFooterHidden('/recipes')).toBe(false);
    expect(isFooterHidden('/recipes/rec-001')).toBe(false);
    expect(isFooterHidden('/categories')).toBe(false);
    expect(isFooterHidden('/blogs')).toBe(false);
    expect(isFooterHidden('/profile')).toBe(false);
  });

  it('handles null, empty, or undefined safely', () => {
    expect(isFooterHidden(null)).toBe(false);
    expect(isFooterHidden(undefined)).toBe(false);
    expect(isFooterHidden('')).toBe(false);
  });
});
