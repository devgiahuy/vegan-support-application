import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { recommendationApi } from './recommendation.api';

describe('recommendation API response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps the returned items and applied constraint metadata', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: {
        data: [{ id: 'recipe-1' }],
        meta: { personalized: true, appliedConstraints: { allergyCount: 1 } },
      },
    });
    const result = await recommendationApi.getHome();
    expect(result.items.map((item) => item.id)).toEqual(['recipe-1']);
    expect(result.meta).toMatchObject({
      personalized: true,
      constraintsSummary: 'Đã lọc: 1 dị ứng',
    });
  });

  it('maps the personalization consent response', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: { data: { enabled: true, consentVersion: 'v1' } },
    });
    await expect(recommendationApi.getConsent()).resolves.toMatchObject({
      enabled: true,
      consentVersion: 'v1',
    });
  });
});
