import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { CATEGORIES_ENDPOINTS } from '@/features/category/constants/categories.endpoints';
import { categoryApi } from './category.api';

describe('categoryApi.getTree', () => {
  afterEach(() => vi.restoreAllMocks());

  it('unwraps the response and returns sorted category models', async () => {
    const request = vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          { id: 'b', sortOrder: 2 },
          { id: 'a', sortOrder: 1 },
        ],
      },
    });

    const categories = await categoryApi.getTree();

    expect(request).toHaveBeenCalledWith(CATEGORIES_ENDPOINTS.TREE, { params: {}, silent: true });
    expect(categories.map((category) => category.id)).toEqual(['a', 'b']);
  });

  it('returns an empty list when the response has no data', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { success: true, data: null } });
    await expect(categoryApi.getTree()).resolves.toEqual([]);
  });
});
