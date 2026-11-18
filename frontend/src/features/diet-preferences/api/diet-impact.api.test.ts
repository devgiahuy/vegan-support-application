import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { dietImpactApi } from './diet-impact.api';
import { DIET_IMPACT_ENDPOINTS } from '../constants/diet-impact.endpoints';
import type { DietPreferenceDraft } from '../types/diet.model';

const draft: DietPreferenceDraft = {
  allowEggs: false,
  allowDairy: true,
  allowHoney: false,
  allowFivePungent: true,
  policyVersion: 1,
  expectedDietaryRevision: 2,
  allergies: [{ allergenCode: 'EGG', label: 'Trứng', severity: 'SEVERE' }],
  ingredientAllergies: [],
  ingredientExclusions: [{ ingredientId: 'ingredient', ingredientName: ' Tỏi ', reason: '' }],
};
describe('dietary impact API', () => {
  afterEach(() => vi.restoreAllMocks());
  it('serializes full draft constraints and maps a no-impact assessment', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          dietaryRevision: 2,
          assessedFrom: '2026-11-18',
          affectedPlanCount: 0,
          affectedMealCount: 0,
          plans: [],
        },
      },
    });
    const result = await dietImpactApi.preview(draft);
    expect(post.mock.calls[0][0]).toBe(DIET_IMPACT_ENDPOINTS.PREVIEW);
    expect(post.mock.calls[0][1]).toMatchObject({
      allowEggs: false,
      allowDairy: true,
      expectedDietaryRevision: 2,
      allergies: [{ allergenCode: 'EGG', severity: 'SEVERE' }],
      ingredientExclusions: [{ ingredientName: 'Tỏi' }],
    });
    expect(post.mock.calls[0][1]).not.toHaveProperty('dietPattern');
    expect(result.affectedMealCount).toBe(0);
  });
  it('rejects missing impact output rather than treating it as no affected meals', async () => {
    vi.spyOn(api, 'post').mockResolvedValueOnce({ data: { success: true } });
    await expect(dietImpactApi.preview(draft)).rejects.toThrow('Chưa kiểm tra');
  });
  it('deduplicates repair plans and retains the expected profile revision', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: { data: { proposalId: 'proposal', dietaryRevision: 3, plans: [] } },
    });
    await dietImpactApi.previewRepair({
      planIds: ['one', 'one', 'two'],
      expectedDietaryRevision: 3,
    });
    expect(post.mock.calls[0][1]).toEqual({ planIds: ['one', 'two'], expectedDietaryRevision: 3 });
  });
  it('keeps apply retry identity and failed plan results', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: {
        data: {
          dietaryRevision: 3,
          results: [
            {
              planId: 'one',
              status: 'FAILED',
              message: 'Đã thay đổi',
              remainingAffectedMeals: 2,
            },
          ],
        },
      },
    });
    const input = { proposalId: 'proposal', idempotencyKey: 'retry-key' };
    const result = await dietImpactApi.applyRepair(input);
    expect(post.mock.calls[0][1]).toEqual(input);
    expect(result.results[0].status).toBe('FAILED');
    expect(result.results[0].remainingAffectedMeals).toBe(2);
  });
  it('does not treat an unreadable apply response as successful', async () => {
    vi.spyOn(api, 'post').mockResolvedValueOnce({ data: { success: true } });
    await expect(
      dietImpactApi.applyRepair({ proposalId: 'proposal', idempotencyKey: 'key' })
    ).rejects.toThrow('Chưa đọc');
  });
});
