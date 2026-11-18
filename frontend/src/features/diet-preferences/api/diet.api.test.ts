import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { dietApi } from './diet.api';
const flags = { allowEggs: true, allowDairy: false, allowHoney: true, allowFivePungent: false };
describe('diet API contract', () => {
  afterEach(() => vi.restoreAllMocks());
  it('sends independent options and revision without removed fields', async () => {
    const put = vi.spyOn(api, 'put').mockResolvedValue({
      data: { data: { ...flags, dietaryRevision: 4, policyVersion: 1, impactUnavailable: true } },
    });
    const input = {
      ...flags,
      policyVersion: 1,
      expectedDietaryRevision: 3,
      allergies: [{ allergenCode: 'EGG', label: 'Trứng', severity: 'MODERATE' }],
      ingredientAllergies: [],
      ingredientExclusions: [],
    };
    const result = await dietApi.saveDietPreferences(input);
    expect(put.mock.calls[0][1]).toEqual(input);
    expect(result.allowDairy).toBe(false);
    expect(result.impactUnavailable).toBe(true);
    expect(result.allergies).toEqual([]);
  });
  it('maps policy preview', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({
      data: {
        data: {
          policyVersion: 1,
          selection: flags,
          constraints: [{ code: 'EGG', label: 'Trứng', allowed: true }],
        },
      },
    });
    expect((await dietApi.previewDietRules(flags)).constraints[0].allowed).toBe(true);
  });
});
