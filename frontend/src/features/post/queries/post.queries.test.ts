import { afterEach, describe, expect, it, vi } from 'vitest';
import { PostStatus, PostType } from '@/common/enums';
import { reviewApi } from '@/features/review/api/review.api';
import { PostReviewStatus } from '@/features/review/types/content-review.model';
import type { Article } from '../types/post.model';
import { ArticleSubmitForReviewError, submitSavedArticle } from './post.queries';

function makeSavedArticle(overrides?: Partial<Article>): Article {
  return {
    id: 'art-1',
    title: 'Cẩm nang dinh dưỡng thuần chay',
    slug: 'cam-nang-dinh-duong',
    status: PostStatus.DRAFT,
    statusLabel: 'Bản nháp',
    version: 1,
    revisionId: 'rev-art-1',
    revisionVersion: 1,
    revisionStatus: PostStatus.DRAFT,
    publishedRevisionVersion: null,
    author: { id: 'usr-1', name: 'Demo Contributor', avatarUrl: null },
    category: { id: 'cat-1', name: 'Dinh dưỡng' },
    coverImageUrl: 'https://example.com/article.jpg',
    excerpt: 'Tóm tắt',
    content: 'Nội dung bài viết',
    tags: [],
    readingTimeMinutes: 3,
    publishedAt: null,
    formattedPublishedAt: '',
    stats: { views: 0, likes: 0, comments: 0 },
    ...overrides,
  };
}

describe('submitSavedArticle', () => {
  afterEach(() => vi.restoreAllMocks());

  it('calls reviewApi.submitPost and marks article PUBLISHED when auto-published', async () => {
    const publishedDate = new Date('2026-11-10T04:20:00.000Z');
    const submitSpy = vi.spyOn(reviewApi, 'submitPost').mockResolvedValueOnce({
      postId: 'art-1',
      type: PostType.BLOG,
      slug: 'cam-nang-dinh-duong',
      title: 'Cẩm nang dinh dưỡng thuần chay',
      postStatus: PostReviewStatus.PUBLISHED,
      postStatusLabel: 'Đã xuất bản',
      version: 1,
      revisionId: 'rev-art-1',
      revisionVersion: 1,
      revisionStatus: PostReviewStatus.PUBLISHED,
      revisionStatusLabel: 'Đã xuất bản',
      publishedRevisionVersion: 1,
      publishedAt: publishedDate,
      formattedPublishedAt: '10/11/2026',
      isAutoPublished: true,
    });

    const saved = makeSavedArticle();
    const result = await submitSavedArticle(saved);

    expect(submitSpy).toHaveBeenCalledWith('art-1', {
      revisionId: 'rev-art-1',
      expectedVersion: 1,
    });
    expect(result.status).toBe(PostStatus.PUBLISHED);
    expect(result.statusLabel).toBe('Đã xuất bản');
    expect(result.revisionStatus).toBe(PostStatus.PUBLISHED);
    expect(result.publishedRevisionVersion).toBe(1);
    expect(result.publishedAt).toEqual(publishedDate);
    expect(result.formattedPublishedAt).toBe('10/11/2026');
  });

  it('preserves dual-revision PENDING_REVIEW status separately from post status', async () => {
    vi.spyOn(reviewApi, 'submitPost').mockResolvedValueOnce({
      postId: 'art-1',
      type: PostType.BLOG,
      slug: 'cam-nang-dinh-duong',
      title: 'Cẩm nang dinh dưỡng thuần chay v2',
      postStatus: PostReviewStatus.PUBLISHED,
      postStatusLabel: 'Đã xuất bản',
      version: 2,
      revisionId: 'rev-art-2',
      revisionVersion: 2,
      revisionStatus: PostReviewStatus.PENDING_REVIEW,
      revisionStatusLabel: 'Đang chờ duyệt',
      publishedRevisionVersion: 1,
      publishedAt: null,
      formattedPublishedAt: '',
      isAutoPublished: false,
    });

    const saved = makeSavedArticle({
      version: 2,
      revisionId: 'rev-art-2',
      revisionVersion: 2,
    });
    const result = await submitSavedArticle(saved);

    expect(result.status).toBe(PostStatus.PUBLISHED);
    expect(result.revisionStatus).toBe(PostStatus.PENDING_REVIEW);
    expect(result.publishedRevisionVersion).toBe(1);
  });

  it('wraps submitPost failures and missing version info in ArticleSubmitForReviewError', async () => {
    const saved = makeSavedArticle();
    vi.spyOn(reviewApi, 'submitPost').mockRejectedValueOnce(new Error('Network error'));

    await expect(submitSavedArticle(saved)).rejects.toSatisfy(
      (err: unknown) => err instanceof ArticleSubmitForReviewError && err.article === saved
    );

    const missingRevision = makeSavedArticle({ revisionId: undefined });
    await expect(submitSavedArticle(missingRevision)).rejects.toSatisfy(
      (err: unknown) =>
        err instanceof ArticleSubmitForReviewError && err.article === missingRevision
    );
  });
});
