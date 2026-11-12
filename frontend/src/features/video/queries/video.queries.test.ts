import { afterEach, describe, expect, it, vi } from 'vitest';
import { PostStatus, PostType, VideoSource } from '@/common/enums';
import { reviewApi } from '@/features/review/api/review.api';
import { PostReviewStatus } from '@/features/review/types/content-review.model';
import type { Video } from '../types/video.model';
import { submitSavedVideo, VideoSubmitForReviewError } from './video.queries';

function makeSavedVideo(overrides?: Partial<Video>): Video {
  return {
    id: 'vid-1',
    title: 'Video làm đậu hũ sốt cà chua',
    slug: 'video-lam-dau-hu-sot-ca-chua',
    status: PostStatus.DRAFT,
    statusLabel: 'Bản nháp',
    version: 1,
    revisionId: 'rev-vid-1',
    revisionVersion: 1,
    revisionStatus: PostStatus.DRAFT,
    publishedRevisionVersion: null,
    author: { id: 'usr-1', name: 'Demo Contributor', avatarUrl: null },
    category: { id: 'cat-1', name: 'Món kho' },
    coverImageUrl: 'https://example.com/thumb.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=sample12345',
    videoSource: VideoSource.YOUTUBE,
    durationSeconds: 180,
    formattedDuration: '03:00',
    description: 'Hướng dẫn chi tiết',
    ingredients: [],
    steps: [],
    publishedAt: null,
    formattedPublishedAt: '',
    stats: { views: 0, likes: 0, comments: 0 },
    ...overrides,
  };
}

describe('submitSavedVideo', () => {
  afterEach(() => vi.restoreAllMocks());

  it('calls reviewApi.submitPost and marks video PUBLISHED when auto-published', async () => {
    const publishedDate = new Date('2026-11-10T04:25:00.000Z');
    const submitSpy = vi.spyOn(reviewApi, 'submitPost').mockResolvedValueOnce({
      postId: 'vid-1',
      type: PostType.VIDEO,
      slug: 'video-lam-dau-hu-sot-ca-chua',
      title: 'Video làm đậu hũ sốt cà chua',
      postStatus: PostReviewStatus.PUBLISHED,
      postStatusLabel: 'Đã xuất bản',
      version: 1,
      revisionId: 'rev-vid-1',
      revisionVersion: 1,
      revisionStatus: PostReviewStatus.PUBLISHED,
      revisionStatusLabel: 'Đã xuất bản',
      publishedRevisionVersion: 1,
      publishedAt: publishedDate,
      formattedPublishedAt: '10/11/2026',
      isAutoPublished: true,
    });

    const saved = makeSavedVideo();
    const result = await submitSavedVideo(saved);

    expect(submitSpy).toHaveBeenCalledWith('vid-1', {
      revisionId: 'rev-vid-1',
      expectedVersion: 1,
    });
    expect(result.status).toBe(PostStatus.PUBLISHED);
    expect(result.statusLabel).toBe('Đã xuất bản');
    expect(result.revisionStatus).toBe(PostStatus.PUBLISHED);
    expect(result.publishedRevisionVersion).toBe(1);
    expect(result.publishedAt).toEqual(publishedDate);
    expect(result.formattedPublishedAt).toBe('10/11/2026');
  });

  it('preserves QUARANTINED / FLAGGED status accurately without marking PUBLISHED', async () => {
    vi.spyOn(reviewApi, 'submitPost').mockResolvedValueOnce({
      postId: 'vid-1',
      type: PostType.VIDEO,
      slug: 'video-lam-dau-hu-sot-ca-chua',
      title: 'Video làm đậu hũ sốt cà chua',
      postStatus: PostReviewStatus.QUARANTINED,
      postStatusLabel: 'Tạm giữ kiểm dịch',
      version: 1,
      revisionId: 'rev-vid-1',
      revisionVersion: 1,
      revisionStatus: PostReviewStatus.FLAGGED,
      revisionStatusLabel: 'Bị cảnh báo',
      publishedRevisionVersion: null,
      publishedAt: null,
      formattedPublishedAt: '',
      isAutoPublished: false,
    });

    const saved = makeSavedVideo();
    const result = await submitSavedVideo(saved);

    expect(result.status).toBe(PostStatus.QUARANTINED);
    expect(result.revisionStatus).toBe(PostStatus.FLAGGED);
    expect(result.publishedRevisionVersion).toBeNull();
  });

  it('wraps submitPost failures and missing version info in VideoSubmitForReviewError', async () => {
    const saved = makeSavedVideo();
    vi.spyOn(reviewApi, 'submitPost').mockRejectedValueOnce(new Error('State conflict'));

    await expect(submitSavedVideo(saved)).rejects.toSatisfy(
      (err: unknown) => err instanceof VideoSubmitForReviewError && err.video === saved
    );

    const missingRevision = makeSavedVideo({ revisionId: undefined });
    await expect(submitSavedVideo(missingRevision)).rejects.toSatisfy(
      (err: unknown) => err instanceof VideoSubmitForReviewError && err.video === missingRevision
    );
  });
});
