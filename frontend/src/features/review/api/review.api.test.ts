import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { CONTENT_REVIEW_ENDPOINTS } from '@/common/constants/endpoints/content-review.endpoints';
import { PostType } from '@/common/enums';
import { PostReviewStatus } from '../types/content-review.model';
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

  it('maps submitPost auto-published and pending review responses accurately', async () => {
    const postSpy = vi
      .spyOn(api, 'post')
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            id: 'post-auto-1',
            type: 'RECIPE',
            slug: 'dau-hu-xao-nam',
            status: 'PUBLISHED',
            version: 1,
            publishedRevisionVersion: 1,
            publishedAt: '2026-11-10T04:00:00.000Z',
            revision: {
              id: 'rev-auto-1',
              version: 1,
              status: 'PUBLISHED',
              title: 'Đậu hũ xào nấm rơm',
            },
          },
          meta: null,
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            id: 'post-pending-1',
            type: 'BLOG',
            slug: 'cam-nang-an-chay',
            status: 'PUBLISHED',
            version: 2,
            publishedRevisionVersion: 1,
            revision: {
              id: 'rev-pending-2',
              version: 2,
              status: 'PENDING_REVIEW',
              title: 'Cẩm nang ăn chay v2',
            },
          },
          meta: null,
        },
      });

    const autoPublished = await reviewApi.submitPost('post-auto-1', {
      revisionId: 'rev-auto-1',
      expectedVersion: 1,
    });
    expect(postSpy).toHaveBeenNthCalledWith(1, CONTENT_REVIEW_ENDPOINTS.SUBMIT('post-auto-1'), {
      revisionId: 'rev-auto-1',
      expectedVersion: 1,
    });
    expect(autoPublished).toMatchObject({
      postId: 'post-auto-1',
      type: PostType.RECIPE,
      postStatus: PostReviewStatus.PUBLISHED,
      revisionStatus: PostReviewStatus.PUBLISHED,
      publishedRevisionVersion: 1,
      isAutoPublished: true,
    });

    const pendingResult = await reviewApi.submitPost('post-pending-1', {
      revisionId: 'rev-pending-2',
      expectedVersion: 2,
    });
    expect(pendingResult).toMatchObject({
      postId: 'post-pending-1',
      type: PostType.BLOG,
      postStatus: PostReviewStatus.PUBLISHED,
      revisionStatus: PostReviewStatus.PENDING_REVIEW,
      publishedRevisionVersion: 1,
      isAutoPublished: false,
    });
  });

  it('rejects an invalid submitPost envelope', async () => {
    vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: { success: false, data: null },
    });

    await expect(
      reviewApi.submitPost('post-bad', { revisionId: 'rev-bad', expectedVersion: 1 })
    ).rejects.toThrow('Phản hồi nộp nội dung không đúng định dạng.');
  });
});
