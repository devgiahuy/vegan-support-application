import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { postApi } from './post.api';
import { recipeApi } from '@/features/recipe/api/recipe.api';
import { videoApi } from '@/features/video/api/video.api';

describe('READY content API response failures', () => {
  afterEach(() => vi.restoreAllMocks());

  it('propagates list failures instead of returning fixture content', async () => {
    const failure = new Error('Máy chủ không khả dụng');
    vi.spyOn(api, 'get').mockRejectedValue(failure);
    await expect(postApi.getArticles()).rejects.toBe(failure);
    await expect(recipeApi.getRecipes()).rejects.toBe(failure);
    await expect(videoApi.getVideos()).rejects.toBe(failure);
  });

  it('propagates detail and related-content failures', async () => {
    const failure = new Error('Không tải được nội dung');
    vi.spyOn(api, 'get').mockRejectedValue(failure);
    await expect(postApi.getArticleDetail('p1')).rejects.toBe(failure);
    await expect(recipeApi.getRecipeDetail('p1')).rejects.toBe(failure);
    await expect(videoApi.getVideoDetail('p1')).rejects.toBe(failure);
    await expect(postApi.getRelatedPosts('p1')).rejects.toBe(failure);
  });

  it('does not report a successful delete when the backend fails', async () => {
    const failure = new Error('Không xóa được');
    vi.spyOn(api, 'delete').mockRejectedValue(failure);
    await expect(postApi.deleteArticle('p1')).rejects.toBe(failure);
    await expect(recipeApi.deleteRecipe('p1')).rejects.toBe(failure);
    await expect(videoApi.deleteVideo('p1')).rejects.toBe(failure);
  });
});
