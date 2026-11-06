import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { COMMUNITY_ENDPOINTS } from '@/features/community/constants/community.endpoints';
import { communityApi, USE_FIXTURES } from './community.api';

describe('communityApi bookmarks', () => {
  afterEach(() => vi.restoreAllMocks());

  it('calls the backend PUT bookmark endpoint when saving a recipe', async () => {
    const spy = vi.spyOn(api, 'put').mockResolvedValueOnce({
      data: { success: true, data: { postId: 'recipe-1', bookmarked: true }, meta: null },
    });

    await communityApi.putBookmark('recipe-1');

    expect(USE_FIXTURES).toBe(false);
    expect(spy).toHaveBeenCalledWith(COMMUNITY_ENDPOINTS.BOOKMARK('recipe-1'), undefined, {
      showErrorToast: true,
    });
  });

  it('calls the backend DELETE bookmark endpoint when removing a saved recipe', async () => {
    const spy = vi.spyOn(api, 'delete').mockResolvedValueOnce({
      data: { success: true, data: { postId: 'recipe-1', bookmarked: false }, meta: null },
    });

    await communityApi.deleteBookmark('recipe-1');

    expect(spy).toHaveBeenCalledWith(COMMUNITY_ENDPOINTS.BOOKMARK('recipe-1'), {
      showErrorToast: true,
    });
  });
});

describe('communityApi response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps comment data and pagination metadata', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: {
        data: [{ id: 'c1', content: 'Chào bạn' }],
        meta: { page: 2, total: 11, totalPages: 3 },
      },
    });
    const result = await communityApi.getThread({ postId: 'p1', page: 2 });
    expect(result.items[0].content).toBe('Chào bạn');
    expect(result.metadata).toMatchObject({ page: 2, totalItems: 11, totalPages: 3 });
  });

  it('maps summary and vote from their response data', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: { data: { postId: 'p1', voteCount: 7, viewer: { voted: true } } },
    });
    vi.spyOn(api, 'put').mockResolvedValueOnce({
      data: { data: { postId: 'p1', voted: true, voteCount: 7 } },
    });
    expect(await communityApi.getSummary('p1')).toMatchObject({ postId: 'p1', viewerVoted: true });
    await expect(communityApi.putVote('p1')).resolves.toEqual({
      postId: 'p1',
      voted: true,
      voteCount: 7,
    });
  });
});
