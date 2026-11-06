import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { reviewApi } from './review.api';

describe('content review response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps the review queue and its pagination', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: [{ postId: 'post-1', revisionId: 'revision-1' }],
        meta: { page: 2, limit: 10, total: 11, totalPages: 2 },
      },
    });
    const result = await reviewApi.getAdminQueue({ page: 2 });
    expect(result.items[0].postId).toBe('post-1');
    expect(result.metadata).toMatchObject({ page: 2, totalItems: 11 });
  });

  it('maps review history and rejects an invalid detail envelope', async () => {
    vi.spyOn(api, 'get')
      .mockResolvedValueOnce({ data: { success: true, data: { postId: 'post-1', revisions: [] } } })
      .mockResolvedValueOnce({ data: { success: false, data: null } });
    expect((await reviewApi.getReviewHistory('post-1')).postId).toBe('post-1');
    await expect(reviewApi.getAdminDetail('missing')).rejects.toThrow(
      'Không tìm thấy chi tiết bản nháp kiểm duyệt.'
    );
  });
});
