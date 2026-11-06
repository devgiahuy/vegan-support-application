import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { adminInsightsApi } from './admin-insights.api';

describe('admin insights response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps usage rows and pagination metadata from the response', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: {
        data: [{ id: 'trace-1', feature: 'CHAT' }],
        meta: { page: 2, total: 21, totalPages: 3 },
      },
    });
    const result = await adminInsightsApi.usage({ page: 2, limit: 10 });
    expect(result.items[0].id).toBe('trace-1');
    expect(result).toMatchObject({ page: 2, total: 21, totalPages: 3 });
  });
});
