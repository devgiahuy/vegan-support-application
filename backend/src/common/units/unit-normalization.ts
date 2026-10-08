import { normalizeVietnameseText } from '../../modules/catalog/catalog.normalization.js';

const GRAM_UNITS = new Set(['g', 'gram', 'grams']);
const KILOGRAM_UNITS = new Set(['kg', 'kilogram', 'kilograms']);
const MILLIGRAM_UNITS = new Set(['mg', 'milligram', 'milligrams']);
const COUNT_UNITS = new Set(['cai', 'piece', 'pieces', 'pc', 'pcs', 'unit', 'units']);

export function normalizeDisplayUnit(unit: string): string {
  const normalized = normalizeVietnameseText(unit);
  if (GRAM_UNITS.has(normalized)) return 'g';
  if (KILOGRAM_UNITS.has(normalized)) return 'kg';
  if (COUNT_UNITS.has(normalized)) return 'cái';
  return unit.trim().toLocaleLowerCase('vi');
}

export function massFactorToGrams(unit: string): number | null {
  const normalized = normalizeVietnameseText(unit);
  if (GRAM_UNITS.has(normalized)) return 1;
  if (KILOGRAM_UNITS.has(normalized)) return 1_000;
  if (MILLIGRAM_UNITS.has(normalized)) return 0.001;
  return null;
}

export function normalizeAggregationUnit(unit: string): { unit: string; factor: number } {
  const massFactor = massFactorToGrams(unit);
  if (massFactor !== null) return { unit: 'g', factor: massFactor };
  const normalized = normalizeVietnameseText(unit);
  if (['l', 'lit', 'liter'].includes(normalized)) return { unit: 'ml', factor: 1_000 };
  if (['ml', 'mililit'].includes(normalized)) return { unit: 'ml', factor: 1 };
  const displayUnit = normalizeDisplayUnit(unit);
  return { unit: displayUnit, factor: 1 };
}
