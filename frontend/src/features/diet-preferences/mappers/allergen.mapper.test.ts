import { describe, it, expect } from 'vitest';
import { allergenMapper } from './allergen.mapper';

describe('AllergenMapper', () => {
  it('maps named catalog and aliases without inventing selectable codes', () => {
    expect(
      allergenMapper.catalog({
        success: true,
        data: [
          {
            code: 'PEANUT',
            label: 'Đậu phộng (lạc)',
            description: null,
            searchTerms: ['lạc', 'peanut'],
          },
          { label: 'Không có định danh' },
        ],
      })
    ).toEqual([
      { code: 'PEANUT', label: 'Đậu phộng (lạc)', description: '', searchTerms: ['lạc', 'peanut'] },
    ]);
  });
  it('handles missing data conservatively', () => {
    expect(allergenMapper.catalog({ data: null })).toEqual([]);
    expect(allergenMapper.toModel(null).code).toBe('');
  });
});
