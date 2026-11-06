import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { aiGovernanceApi } from './ai-governance.api';

describe('AI governance response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps request data and pagination metadata', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: {
        data: [{ id: 'request-1', capability: 'CHAT' }],
        meta: { page: 2, total: 11, totalPages: 3 },
      },
    });
    const result = await aiGovernanceApi.getRequests({ page: 2 });
    expect(result.items[0].id).toBe('request-1');
    expect(result.metadata).toMatchObject({ page: 2, totalItems: 11, totalPages: 3 });
  });

  it('maps health metrics and feature data from envelopes', async () => {
    vi.spyOn(api, 'get')
      .mockResolvedValueOnce({ data: { data: { last24Hours: { total: 12 } } } })
      .mockResolvedValueOnce({ data: { data: [{ capability: 'CHAT', enabled: true }] } });
    expect((await aiGovernanceApi.getHealth()).total24h).toBe(12);
    expect((await aiGovernanceApi.getFeatures())[0]).toMatchObject({
      capability: 'CHAT',
      enabled: true,
    });
  });
});
