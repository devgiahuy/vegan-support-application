import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { pantryApi } from './pantry.api';

describe('pantry list response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps pantry data and pagination for both list endpoints', async () => {
    vi.spyOn(api, 'get')
      .mockResolvedValueOnce({
        data: { data: [{ id: 'item-1' }], meta: { page: 2, limit: 10, total: 11, totalPages: 2 } },
      })
      .mockResolvedValueOnce({
        data: { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } },
      });
    const list = await pantryApi.getItems({ page: 2 });
    expect(list.items[0].id).toBe('item-1');
    expect(list.metadata).toMatchObject({ page: 2, totalItems: 11 });
    expect((await pantryApi.getExpiringSoon()).items).toEqual([]);
  });
});
