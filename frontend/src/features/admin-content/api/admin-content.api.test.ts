import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { adminContentApi } from './admin-content.api';

describe('admin content response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns a typed detail model instead of the raw backend DTO', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: { success: true, data: { id: 'p1', type: 'BLOG', revision: { title: 'Bài viết' } } },
    });
    const detail = await adminContentApi.getContent('p1');
    expect(detail).toMatchObject({ type: 'BLOG', content: { id: 'p1', title: 'Bài viết' } });
    expect(detail.content).not.toHaveProperty('revision');
  });

  it('rejects missing content data', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { success: true, data: null } });
    await expect(adminContentApi.getContent('missing')).rejects.toThrow('Không tìm thấy nội dung.');
  });

  it('merges published content and preserves pagination totals', async () => {
    vi.spyOn(api, 'get')
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: [{ id: 'p1', type: 'RECIPE' }],
          meta: { page: 1, total: 2, totalPages: 2 },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: [{ id: 'p2', type: 'BLOG' }],
          meta: { page: 1, total: 3, totalPages: 1 },
        },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: [], meta: { page: 1, total: 0, totalPages: 0 } },
      });
    const result = await adminContentApi.listContent({ page: 1, limit: 10 }, 'user-1');
    expect(result.rows).toHaveLength(2);
    expect(result).toMatchObject({ totalItems: 5, totalPages: 2, source: 'published-only' });
  });
});
