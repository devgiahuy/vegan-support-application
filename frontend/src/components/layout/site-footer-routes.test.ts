import { describe, it, expect } from 'vitest';
import { isFooterHidden, HIDDEN_FOOTER_PREFIXES } from './site-footer-routes';

describe('site-footer-routes', () => {
  it('defines correct hidden prefixes', () => {
    expect(HIDDEN_FOOTER_PREFIXES).toContain('/assistant');
    expect(HIDDEN_FOOTER_PREFIXES).toContain('/meal-plans');
    expect(HIDDEN_FOOTER_PREFIXES).toContain('/restaurants');
    expect(HIDDEN_FOOTER_PREFIXES).toContain('/pantry');
    expect(HIDDEN_FOOTER_PREFIXES).not.toContain('/receipts/scan');
    expect(HIDDEN_FOOTER_PREFIXES).toContain('/profile');
    expect(HIDDEN_FOOTER_PREFIXES).toContain('/recipes/new');
  });

  it('hides footer on /pantry and both scan routes', () => {
    expect(isFooterHidden('/pantry')).toBe(true);
    expect(isFooterHidden('/pantry/scan')).toBe(true);
    expect(isFooterHidden('/pantry/scan/fridge')).toBe(true);
    expect(isFooterHidden('/pantry/scan/receipt')).toBe(true);
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

  it('hides footer on /profile and subpaths', () => {
    expect(isFooterHidden('/profile')).toBe(true);
    expect(isFooterHidden('/profile/settings')).toBe(true);
  });

  it('hides footer on /recipes/new and its subpaths', () => {
    expect(isFooterHidden('/recipes/new')).toBe(true);
    expect(isFooterHidden('/recipes/new/step-1')).toBe(true);
  });

  it('keeps footer visible on content routes', () => {
    expect(isFooterHidden('/')).toBe(false);
    expect(isFooterHidden('/recipes')).toBe(false);
    expect(isFooterHidden('/recipes/rec-001')).toBe(false);
    expect(isFooterHidden('/categories')).toBe(false);
    expect(isFooterHidden('/blogs')).toBe(false);
  });

  it('handles null, empty, or undefined safely', () => {
    expect(isFooterHidden(null)).toBe(false);
    expect(isFooterHidden(undefined)).toBe(false);
    expect(isFooterHidden('')).toBe(false);
  });
});
