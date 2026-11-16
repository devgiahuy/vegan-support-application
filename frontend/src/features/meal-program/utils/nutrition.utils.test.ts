import { describe, expect, it } from 'vitest';
import { formatNutrient, roundToDecimals } from './nutrition.utils';

describe('nutrition.utils', () => {
  it('roundToDecimals should correctly round float values to 2 decimal places', () => {
    expect(roundToDecimals(1975.8900000000003, 2)).toBe(1975.89);
    expect(roundToDecimals(616.33, 2)).toBe(616.33);
    expect(roundToDecimals(526.23, 2)).toBe(526.23);
    expect(roundToDecimals(291.6100000004, 2)).toBe(291.61);
    expect(roundToDecimals(200, 2)).toBe(200);
    expect(roundToDecimals(0, 2)).toBe(0);
    expect(roundToDecimals(NaN, 2)).toBe(0);
  });

  it('formatNutrient should format numbers cleanly for UI display', () => {
    expect(formatNutrient(1975.8900000000003)).toBe('1975.89');
    expect(formatNutrient(616.33)).toBe('616.33');
    expect(formatNutrient(200)).toBe('200');
    expect(formatNutrient(null)).toBe('0');
    expect(formatNutrient(undefined)).toBe('0');
  });
});
