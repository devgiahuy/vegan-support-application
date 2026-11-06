import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { profileApi } from './profile.api';

describe('profile API response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps profile data from GET and PATCH response envelopes', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: { success: true, data: { id: 'user-1', displayName: 'An' } },
    });
    vi.spyOn(api, 'patch').mockResolvedValueOnce({
      data: { success: true, data: { id: 'user-1', displayName: 'Bình' } },
    });
    expect((await profileApi.getDetailedProfile()).user.id).toBe('user-1');
    expect((await profileApi.patchBasicProfile({ displayName: 'Bình' })).user.displayName).toBe(
      'Bình'
    );
  });
});
