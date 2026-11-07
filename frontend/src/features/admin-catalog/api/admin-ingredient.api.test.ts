import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { adminIngredientApi } from './admin-ingredient.api';

describe('admin ingredient API response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps list metadata and alias response', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: { data: [{ id: 'i1', name: 'Đậu' }], meta: { page: 2, total: 11, totalPages: 2 } },
    });
    vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: { data: { id: 'i1', name: 'Đậu', aliases: [{ id: 'a1', alias: 'đỗ' }] } },
    });
    const list = await adminIngredientApi.listIngredients({ page: 2 });
    expect(list.metadata).toMatchObject({ page: 2, totalItems: 11 });
    expect((await adminIngredientApi.addAlias('i1', 'đỗ')).aliases[0].alias).toBe('đỗ');
  });
});
