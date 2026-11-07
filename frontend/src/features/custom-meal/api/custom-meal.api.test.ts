import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { customMealApi } from './custom-meal.api';

describe('custom meal response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reads the documented list envelope and maps records', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          records: [{ id: 'meal-1', name: 'Đậu hũ', createdAt: '', updatedAt: '' }],
          pagination: { page: 2, limit: 10, total: 11, totalPages: 2 },
        },
      },
    });
    const result = await customMealApi.getCustomMeals({ page: 2 });
    expect(result.items[0]).toMatchObject({ id: 'meal-1', name: 'Đậu hũ' });
    expect(result.pagination).toMatchObject({ page: 2, totalItems: 11 });
  });

  it('rejects a flat or missing list payload instead of showing an empty list', async () => {
    vi.spyOn(api, 'get')
      .mockResolvedValueOnce({ data: { records: [], pagination: {} } })
      .mockResolvedValueOnce({ data: { success: true, data: null } });
    await expect(customMealApi.getCustomMeals()).rejects.toThrow('không đúng định dạng');
    await expect(customMealApi.getCustomMeals()).rejects.toThrow('không đúng định dạng');
  });

  it('maps a detail response after unwrapping it', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: { id: 'meal-2', name: 'Bún chay', createdAt: '', updatedAt: '' },
      },
    });
    expect(await customMealApi.getCustomMealDetail('meal-2')).toMatchObject({
      id: 'meal-2',
      name: 'Bún chay',
    });
  });
});
