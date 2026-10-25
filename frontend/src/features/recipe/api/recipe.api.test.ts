import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { recipeApi } from './recipe.api';

vi.mock('@/lib/axios', () => ({ default: { get: vi.fn() } }));

describe('filtered recipe discovery', () => {
  beforeEach(() => vi.resetAllMocks());

  it('propagates network failures instead of returning unfiltered fixtures', async () => {
    const failure = new Error('Network Error');
    vi.mocked(api.get).mockRejectedValue(failure);
    await expect(recipeApi.getRecipes()).rejects.toBe(failure);
  });

  it('preserves an empty result after backend allergy filtering', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: {
        success: true,
        data: [],
        meta: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          appliedConstraints: {
            authenticated: true,
            allergyCount: 1,
            ingredientExclusionCount: 0,
            dietPattern: null,
            traditions: [],
            forDate: '2026-10-25',
          },
        },
      },
    });
    const result = await recipeApi.getRecipes();
    expect(result.items).toEqual([]);
    expect(result.metadata.totalItems).toBe(0);
    expect(result.metadata.appliedConstraints?.allergyCount).toBe(1);
  });
});
