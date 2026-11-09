import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { contributorApi } from './contributor.api';

describe('contributor API response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps applications and pagination metadata', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: {
        data: [{ id: 'application-1', status: 'PENDING' }],
        meta: { page: 2, total: 11, totalPages: 3 },
      },
    });
    const result = await contributorApi.getMyApplications(2);
    expect(result.items[0].id).toBe('application-1');
    expect(result.metadata).toMatchObject({ page: 2, totalItems: 11, totalPages: 3 });
  });

  it('maps the revocation result from the response data', async () => {
    vi.spyOn(api, 'patch').mockResolvedValueOnce({
      data: { data: { userId: 'user-1', role: 'MEMBER', reason: 'Lý do' } },
    });
    await expect(contributorApi.revokeContributor('user-1', 'Lý do')).resolves.toMatchObject({
      userId: 'user-1',
      role: 'MEMBER',
      reason: 'Lý do',
    });
  });
});
