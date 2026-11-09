import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { mealProgramApi } from './meal-program.api';

describe('meal program list response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps the documented list array and top-level pagination', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: [{ id: 'p1' }],
        meta: { page: 2, limit: 10, total: 12, totalPages: 2 },
      },
    });
    const first = await mealProgramApi.getMealPrograms({ page: 2 });
    expect(first.items[0].id).toBe('p1');
    expect(first.pagination).toMatchObject({ page: 2, totalItems: 12 });
  });

  it('rejects the obsolete nested list shape', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: { success: true, data: { items: [{ id: 'p1' }] }, meta: { page: 1 } },
    });
    await expect(mealProgramApi.getMealPrograms()).rejects.toThrow('không đúng định dạng');
  });

  it('rejects a missing detail instead of returning an empty program model', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { success: true, data: null } });
    await expect(mealProgramApi.getMealProgramDetail('missing')).rejects.toThrow(
      'không đúng định dạng'
    );
  });
});
