import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { adminCategoryApi } from './admin-category.api';

describe('adminCategoryApi response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps category data and pagination metadata from the response', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: {
        data: [{ id: 'cat-1', name: 'Rau' }],
        meta: { page: 2, limit: 10, total: 25, totalPages: 3 },
      },
    });
    const result = await adminCategoryApi.listCategories();
    expect(result.items[0].id).toBe('cat-1');
    expect(result.metadata).toMatchObject({ page: 2, totalItems: 25, totalPages: 3 });
  });

  it('maps the archive data from the response', async () => {
    vi.spyOn(api, 'delete').mockResolvedValueOnce({
      data: { data: { id: 'cat-1', status: 'ARCHIVED' } },
    });
    await expect(adminCategoryApi.archiveCategory('cat-1')).resolves.toEqual({
      id: 'cat-1',
      status: 'ARCHIVED',
    });
  });
});
