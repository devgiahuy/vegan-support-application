import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { MemberStatus, UserRole } from '@/common/enums';
import { AUTH_QUERY_KEYS } from '@/features/auth/queries/auth.queries';
import { ADMIN_CONTENT_QUERY_KEYS } from '@/features/admin-content/queries/admin-content.queries';
import { COMMUNITY_KEYS } from '@/features/community/queries/community.queries';
import { POST_QUERY_KEYS } from '@/features/post/queries/post.queries';
import { RECIPE_QUERY_KEYS } from '@/features/recipe/queries/recipe.queries';
import { CONTENT_REVIEW_KEYS } from '@/features/review/queries/review.queries';
import { VIDEO_QUERY_KEYS } from '@/features/video/queries/video.queries';
import type { DetailedProfile } from '../types/profile.model';
import { PROFILE_QUERY_KEYS, syncProfileUpdateCaches } from './profile.queries';

describe('syncProfileUpdateCaches', () => {
  it('đồng bộ user/store và vô hiệu hóa cache recipe, video, article và community sau khi sửa hồ sơ', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const setUser = vi.fn();

    queryClient.setQueryData(RECIPE_QUERY_KEYS.detail('rec-1'), { id: 'rec-1' });
    queryClient.setQueryData(VIDEO_QUERY_KEYS.detail('vid-1'), { id: 'vid-1' });
    queryClient.setQueryData(POST_QUERY_KEYS.articleDetail('post-1'), { id: 'post-1' });
    queryClient.setQueryData(COMMUNITY_KEYS.thread('rec-1'), { items: [] });

    const detailed: DetailedProfile = {
      user: {
        id: 'user-1',
        email: 'contributor@example.com',
        displayName: 'Demo Platform Contributor',
        avatarUrl: 'https://res.cloudinary.com/demo/image/upload/avatar.png',
        role: UserRole.CONTRIBUTOR,
        status: MemberStatus.ACTIVE,
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
        contributorApplication: null,
        initials: 'DC',
      },
      health: null,
      diet: null,
      memberSince: '01/09/2026',
    };

    syncProfileUpdateCaches(queryClient, detailed, setUser);

    expect(setUser).toHaveBeenCalledWith(detailed.user);
    expect(queryClient.getQueryData(PROFILE_QUERY_KEYS.detail())).toEqual(detailed);
    expect(queryClient.getQueryData(AUTH_QUERY_KEYS.me())).toEqual(detailed.user);

    const invalidatedKeys = invalidateSpy.mock.calls.map(([filters]) => filters?.queryKey);
    expect(invalidatedKeys).toEqual(
      expect.arrayContaining([
        PROFILE_QUERY_KEYS.all,
        RECIPE_QUERY_KEYS.all,
        VIDEO_QUERY_KEYS.all,
        POST_QUERY_KEYS.all,
        COMMUNITY_KEYS.all,
        ADMIN_CONTENT_QUERY_KEYS.all,
        CONTENT_REVIEW_KEYS.all,
      ])
    );

    expect(queryClient.getQueryState(RECIPE_QUERY_KEYS.detail('rec-1'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(VIDEO_QUERY_KEYS.detail('vid-1'))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(POST_QUERY_KEYS.articleDetail('post-1'))?.isInvalidated).toBe(
      true
    );
    expect(queryClient.getQueryState(COMMUNITY_KEYS.thread('rec-1'))?.isInvalidated).toBe(true);
  });
});
