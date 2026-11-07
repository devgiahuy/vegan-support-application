import { afterEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import api from '@/lib/axios';
import { authApi } from './auth.api';

describe('authentication response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps session and profile data from envelopes', async () => {
    vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: { data: { accessToken: 'token', user: { id: 'user-1' } } },
    });
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { data: { id: 'user-1' } } });
    expect((await authApi.login({ email: 'a@example.com', password: 'secret' })).user.id).toBe(
      'user-1'
    );
    expect((await authApi.getMe()).id).toBe('user-1');
  });

  it('accepts both nested and legacy flat refresh responses', async () => {
    vi.spyOn(axios, 'post')
      .mockResolvedValueOnce({ data: { data: { accessToken: 'nested' } } })
      .mockResolvedValueOnce({ data: { accessToken: 'flat' } });
    await expect(authApi.refreshToken()).resolves.toBe('nested');
    await expect(authApi.refreshToken()).resolves.toBe('flat');
  });
});
