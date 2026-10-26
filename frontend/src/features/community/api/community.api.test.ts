import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { communityApi, USE_FIXTURES } from './community.api';

describe('communityApi bookmarks', () => {
  afterEach(() => vi.restoreAllMocks());

  it('calls the backend PUT bookmark endpoint when saving a recipe', async () => {
    const spy = vi.spyOn(api, 'put').mockResolvedValueOnce({
      data: { success: true, data: { postId: 'recipe-1', bookmarked: true }, meta: null },
    });

    await communityApi.putBookmark('recipe-1');

    expect(USE_FIXTURES).toBe(false);
    expect(spy).toHaveBeenCalledWith(API_ENDPOINTS.COMMUNITY.BOOKMARK('recipe-1'), undefined, {
      showErrorToast: true,
    });
  });

  it('calls the backend DELETE bookmark endpoint when removing a saved recipe', async () => {
    const spy = vi.spyOn(api, 'delete').mockResolvedValueOnce({
      data: { success: true, data: { postId: 'recipe-1', bookmarked: false }, meta: null },
    });

    await communityApi.deleteBookmark('recipe-1');

    expect(spy).toHaveBeenCalledWith(API_ENDPOINTS.COMMUNITY.BOOKMARK('recipe-1'), {
      showErrorToast: true,
    });
  });
});
