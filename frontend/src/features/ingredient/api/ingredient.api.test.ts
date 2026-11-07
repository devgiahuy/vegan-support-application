import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { ingredientApi } from './ingredient.api';

describe('ingredient API response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps ingredient list metadata and resolution data', async () => {
    vi.spyOn(api, 'get')
      .mockResolvedValueOnce({
        data: { data: [{ id: 'i1', name: 'Đậu' }], meta: { page: 2, total: 21, totalPages: 3 } },
      })
      .mockResolvedValueOnce({
        data: { data: { query: 'đậu', match: 'EXACT', candidates: [{ id: 'i1', name: 'Đậu' }] } },
      });
    const list = await ingredientApi.searchIngredients({ page: 2 });
    expect(list.items[0].id).toBe('i1');
    expect(list.metadata).toMatchObject({ page: 2, totalItems: 21, totalPages: 3 });
    const resolution = await ingredientApi.resolveIngredient('đậu');
    expect(resolution.match).toBe('EXACT');
    expect(resolution.candidates[0].id).toBe('i1');
  });
});
