import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { mealPlanApi } from './meal-plan.api';

describe('meal plan API response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps list metadata and detail from their envelopes', async () => {
    vi.spyOn(api, 'get')
      .mockResolvedValueOnce({
        data: { data: [{ id: 'plan-1' }], meta: { page: 2, total: 21, totalPages: 3 } },
      })
      .mockResolvedValueOnce({ data: { data: { id: 'plan-2', version: 4 } } });
    const list = await mealPlanApi.getPlans({ page: 2 });
    expect(list.items[0].id).toBe('plan-1');
    expect(list.metadata).toMatchObject({ page: 2, totalItems: 21, totalPages: 3 });
    expect((await mealPlanApi.getPlanDetail('plan-2')).id).toBe('plan-2');
  });

  it('maps swap and deletion results from their envelopes', async () => {
    vi.spyOn(api, 'patch').mockResolvedValueOnce({ data: { data: { id: 'plan-1', version: 5 } } });
    vi.spyOn(api, 'delete').mockResolvedValueOnce({
      data: { data: { id: 'plan-1', deleted: true } },
    });
    expect((await mealPlanApi.swapItem('plan-1', 'slot-1', 4, 'key')).id).toBe('plan-1');
    await expect(mealPlanApi.deletePlan('plan-1', 5)).resolves.toEqual({
      id: 'plan-1',
      deleted: true,
    });
  });
});
