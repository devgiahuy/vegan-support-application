import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { reviewApi } from './review.api';

describe('review nutrition response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps the nutrition panel after checking the envelope', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { success: true, data: {} } });
    expect((await reviewApi.getNutritionPanel('revision-1')).metrics).toHaveLength(5);
  });

  it('rejects a response without nutrition data', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { success: false, data: null } });
    await expect(reviewApi.getNutritionPanel('revision-1')).rejects.toThrow(
      'Phản hồi dinh dưỡng kiểm duyệt không đúng định dạng.'
    );
  });
});
