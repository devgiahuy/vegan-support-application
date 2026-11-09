import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { moderationApi } from './moderation.api';

describe('moderation API response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps report list and metadata', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: { data: [{ id: 'report-1' }], meta: { page: 2, total: 11, totalPages: 3 } },
    });
    const result = await moderationApi.getReports({ page: 2 });
    expect(result.items[0].id).toBe('report-1');
    expect(result.metadata).toMatchObject({ page: 2, totalItems: 11, totalPages: 3 });
  });

  it('retains the protected admin flag for a status response', async () => {
    vi.spyOn(api, 'patch').mockResolvedValueOnce({
      data: { data: { id: 'user-1', role: 'ADMIN', status: 'ACTIVE' } },
    });
    const { MemberStatus } = await import('@/common/enums');
    expect(
      (await moderationApi.updateUserStatus('user-1', MemberStatus.ACTIVE, 'reason'))
        .isProtectedAdmin
    ).toBe(true);
  });
});
