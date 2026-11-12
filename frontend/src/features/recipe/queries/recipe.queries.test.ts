import { afterEach, describe, expect, it, vi } from 'vitest';
import { PostStatus, RecipeDifficulty } from '@/common/enums';
import { reviewApi } from '@/features/review/api/review.api';
import { PostReviewStatus } from '@/features/review/types/content-review.model';
import { PostType } from '@/common/enums';
import type { Recipe } from '../types/recipe.model';
import { RecipeSubmitForReviewError, submitSavedRecipe } from './recipe.queries';

function makeSavedRecipe(overrides?: Partial<Recipe>): Recipe {
  return {
    id: 'rec-1',
    title: 'Đậu hũ xào nấm rơm',
    slug: 'dau-hu-xao-nam-rom',
    status: PostStatus.DRAFT,
    statusLabel: 'Bản nháp',
    version: 1,
    revisionId: 'rev-1',
    revisionVersion: 1,
    revisionStatus: PostStatus.DRAFT,
    publishedRevisionVersion: null,
    author: { id: 'usr-1', name: 'Demo Contributor', avatarUrl: null },
    category: { id: 'cat-1', name: 'Món xào' },
    difficulty: RecipeDifficulty.EASY,
    image: 'https://example.com/cover.jpg',
    minutes: 25,
    kcal: 200,
    protein: 10,
    publishedAt: null,
    formattedPublishedAt: '',
    ...overrides,
  };
}

describe('submitSavedRecipe', () => {
  afterEach(() => vi.restoreAllMocks());

  it('calls reviewApi.submitPost and marks recipe PUBLISHED when auto-published', async () => {
    const publishedDate = new Date('2026-11-10T04:15:00.000Z');
    const submitSpy = vi.spyOn(reviewApi, 'submitPost').mockResolvedValueOnce({
      postId: 'rec-1',
      type: PostType.RECIPE,
      slug: 'dau-hu-xao-nam-rom',
      title: 'Đậu hũ xào nấm rơm',
      postStatus: PostReviewStatus.PUBLISHED,
      postStatusLabel: 'Đã xuất bản',
      version: 1,
      revisionId: 'rev-1',
      revisionVersion: 1,
      revisionStatus: PostReviewStatus.PUBLISHED,
      revisionStatusLabel: 'Đã xuất bản',
      publishedRevisionVersion: 1,
      publishedAt: publishedDate,
      formattedPublishedAt: '10/11/2026',
      isAutoPublished: true,
    });

    const saved = makeSavedRecipe();
    const result = await submitSavedRecipe(saved);

    expect(submitSpy).toHaveBeenCalledWith('rec-1', {
      revisionId: 'rev-1',
      expectedVersion: 1,
    });
    expect(result.status).toBe(PostStatus.PUBLISHED);
    expect(result.statusLabel).toBe('Đã xuất bản');
    expect(result.revisionStatus).toBe(PostStatus.PUBLISHED);
    expect(result.publishedRevisionVersion).toBe(1);
    expect(result.publishedAt).toEqual(publishedDate);
    expect(result.formattedPublishedAt).toBe('10/11/2026');
  });

  it('preserves separate revisionStatus for dual-revision non-published submissions', async () => {
    vi.spyOn(reviewApi, 'submitPost').mockResolvedValueOnce({
      postId: 'rec-1',
      type: PostType.RECIPE,
      slug: 'dau-hu-xao-nam-rom',
      title: 'Đậu hũ xào nấm rơm v2',
      postStatus: PostReviewStatus.PUBLISHED,
      postStatusLabel: 'Đã xuất bản',
      version: 2,
      revisionId: 'rev-2',
      revisionVersion: 2,
      revisionStatus: PostReviewStatus.PENDING_REVIEW,
      revisionStatusLabel: 'Đang chờ duyệt',
      publishedRevisionVersion: 1,
      publishedAt: new Date('2026-10-01T00:00:00.000Z'),
      formattedPublishedAt: '01/10/2026',
      isAutoPublished: false,
    });

    const saved = makeSavedRecipe({
      version: 2,
      revisionId: 'rev-2',
      revisionVersion: 2,
      publishedRevisionVersion: 1,
    });
    const result = await submitSavedRecipe(saved);

    expect(result.status).toBe(PostStatus.PUBLISHED);
    expect(result.revisionStatus).toBe(PostStatus.PENDING_REVIEW);
    expect(result.publishedRevisionVersion).toBe(1);
  });

  it('wraps submitPost failures and missing version info in RecipeSubmitForReviewError', async () => {
    const saved = makeSavedRecipe();
    vi.spyOn(reviewApi, 'submitPost').mockRejectedValueOnce(new Error('Conflict 409'));

    await expect(submitSavedRecipe(saved)).rejects.toSatisfy(
      (err: unknown) => err instanceof RecipeSubmitForReviewError && err.recipe === saved
    );

    const missingRevision = makeSavedRecipe({ revisionId: undefined });
    await expect(submitSavedRecipe(missingRevision)).rejects.toSatisfy(
      (err: unknown) => err instanceof RecipeSubmitForReviewError && err.recipe === missingRevision
    );
  });
});
