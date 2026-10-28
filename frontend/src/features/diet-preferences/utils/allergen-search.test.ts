import { describe, it, expect } from 'vitest';
import { searchAllergens } from './allergen-search';
import type { AllergenOption } from '../types/allergen.model';

const options: AllergenOption[] = [
  {
    code: 'PEANUT',
    label: 'Đậu phộng (lạc)',
    description: '',
    searchTerms: ['đậu phộng', 'lạc', 'peanut'],
  },
  {
    code: 'SESAME',
    label: 'Mè (vừng)',
    description: '',
    searchTerms: ['vừng trắng', 'sesame oil'],
  },
];
describe('named allergy search', () => {
  it.each(['lạc', 'LAC', 'đậu phộng', 'dau phong', 'peanut'])(
    'resolves approved term %s',
    (query) => {
      expect(searchAllergens(options, query)).toEqual({ items: [options[0]], suggested: false });
    }
  );
  it('finds aliases of ingredient derivatives', () => {
    expect(searchAllergens(options, 'sesame oil').items).toEqual([options[1]]);
  });
  it('returns explicit typo suggestions without modifying the catalog', () => {
    const result = searchAllergens(options, 'đậu phụng');
    expect(result.suggested).toBe(true);
    expect(result.items).toEqual([options[0]]);
    expect(options[0].label).toBe('Đậu phộng (lạc)');
  });
  it('keeps an unsupported name unselected', () => {
    expect(searchAllergens(options, 'thành phần chưa từng có').items).toEqual([]);
    expect(searchAllergens(options, 'xyz').items).toEqual([]);
  });
});
