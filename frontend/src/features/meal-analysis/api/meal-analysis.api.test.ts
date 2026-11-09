import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { mealAnalysisApi } from './meal-analysis.api';

describe('meal analysis response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps both wrapped and legacy unwrapped analysis data', async () => {
    vi.spyOn(api, 'get')
      .mockResolvedValueOnce({ data: { data: { id: 'analysis-1', planLockVersion: 2 } } })
      .mockResolvedValueOnce({ data: { id: 'analysis-2', planLockVersion: 2 } });
    expect((await mealAnalysisApi.getCurrentAnalysis('p1', 2))?.id).toBe('analysis-1');
    expect((await mealAnalysisApi.getCurrentAnalysis('p1', 2))?.id).toBe('analysis-2');
  });

  it('returns null only when no analysis exists', async () => {
    vi.spyOn(api, 'get').mockRejectedValueOnce(
      Object.assign(new Error('not found'), {
        isAxiosError: true,
        response: { status: 404, data: { error: { code: 'MEAL_ANALYSIS_NOT_FOUND' } } },
      })
    );
    expect(await mealAnalysisApi.getCurrentAnalysis('p1')).toBeNull();
  });

  it('propagates stale and network errors to the query error state', async () => {
    const stale = Object.assign(new Error('stale'), {
      isAxiosError: true,
      response: { status: 409, data: { error: { code: 'MEAL_ANALYSIS_STALE' } } },
    });
    const network = new Error('network');
    vi.spyOn(api, 'get').mockRejectedValueOnce(stale).mockRejectedValueOnce(network);
    await expect(mealAnalysisApi.getCurrentAnalysis('p1')).rejects.toBe(stale);
    await expect(mealAnalysisApi.getCurrentAnalysis('p1')).rejects.toBe(network);
  });

  it('rejects a malformed success response instead of mapping an empty analysis', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { success: true, data: null } });
    await expect(mealAnalysisApi.getCurrentAnalysis('p1')).rejects.toThrow('không đúng định dạng');
  });
});
