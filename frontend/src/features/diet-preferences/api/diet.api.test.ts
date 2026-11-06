import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { dietApi } from './diet.api';

describe('diet API response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps preview rules and explicit schedule dates from response envelopes', async () => {
    vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: { data: { ruleSetVersion: 2, rules: [{ id: 'rule-1', hardConstraint: true }] } },
    });
    vi.spyOn(api, 'put').mockResolvedValueOnce({
      data: { data: { timezone: 'Asia/Ho_Chi_Minh', dates: ['2026-11-05'] } },
    });
    const preview = await dietApi.previewDietRules({
      dietPattern: 'VEGAN',
      practiceSchedule: 'PERIODIC',
      tradition: 'NONE',
    });
    expect(preview.ruleSetVersion).toBe(2);
    expect(preview.rules[0].isHard).toBe(true);
    expect((await dietApi.saveDietSchedule({ dates: ['2026-11-05'] })).dates).toEqual([
      '2026-11-05',
    ]);
  });
});
