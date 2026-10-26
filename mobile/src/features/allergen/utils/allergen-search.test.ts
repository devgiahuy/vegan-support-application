/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { searchAllergens } from './allergen-search';
import type { AllergenOption } from '../types/allergen.model';

const CATALOG: AllergenOption[] = [
  { code: 'PEANUT', label: 'Đậu phộng', description: null, searchTerms: ['lạc', 'peanut'] },
  { code: 'SESAME', label: 'Mè', description: null, searchTerms: ['vừng', 'sesame'] },
  { code: 'TREE_NUT', label: 'Hạt cây', description: null, searchTerms: ['hạt điều', 'hạnh nhân'] },
];

test('searchAllergens matches label and synonyms without diacritics', () => {
  assert.deepEqual(searchAllergens(CATALOG, 'dau phong').map((o) => o.code), ['PEANUT']);
  assert.deepEqual(searchAllergens(CATALOG, 'vung').map((o) => o.code), ['SESAME']);
  assert.deepEqual(searchAllergens(CATALOG, 'hat').map((o) => o.code), ['TREE_NUT']);
});

test('searchAllergens never returns an empty-query match or already selected codes', () => {
  assert.deepEqual(searchAllergens(CATALOG, '  '), []);
  assert.deepEqual(searchAllergens(CATALOG, 'peanut', new Set(['PEANUT'])), []);
});

test('searchAllergens does not guess typos', () => {
  assert.deepEqual(searchAllergens(CATALOG, 'dau phog'), []);
});
