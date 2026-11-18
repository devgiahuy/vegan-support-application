import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { SHOPPING_LISTS_ENDPOINTS } from '@/features/receipt/constants/shopping-lists.endpoints';
import { shoppingApi } from './shopping.api';

describe('shoppingApi', () => {
  afterEach(() => vi.restoreAllMocks());

  it('passes silent: true when previewing shopping gaps so hook owns error toast', async () => {
    const postSpy = vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          items: [],
          unresolved: [],
          summary: {
            selectedMealCount: 1,
            readyItemCount: 0,
            missingItemCount: 0,
            unresolvedItemCount: 0,
          },
          pantryAsOf: '2026-11-18T00:00:00.000Z',
        },
        meta: null,
      },
    });

    const preview = await shoppingApi.previewShoppingGaps([
      { sourceType: 'RECIPE', recipeId: 'rec-1', servings: 2 },
    ]);

    expect(preview.summary.selectedMealCount).toBe(1);
    expect(postSpy).toHaveBeenCalledWith(
      SHOPPING_LISTS_ENDPOINTS.PREVIEW,
      {
        meals: [{ sourceType: 'RECIPE', recipeId: 'rec-1', servings: 2 }],
      },
      { silent: true }
    );
  });
});
