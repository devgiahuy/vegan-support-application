import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { recipeDraftApi } from './recipe-draft.api';

describe('recipeDraftApi response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps the draft data and rejects an invalid envelope', async () => {
    vi.spyOn(api, 'post')
      .mockResolvedValueOnce({ data: { success: true, data: { draft: { title: 'Đậu hũ' } } } })
      .mockResolvedValueOnce({ data: { success: true, data: null } });
    const prompt = { title: 'Đậu hũ', description: 'Món chay', ingredientNames: ['đậu'] };
    expect((await recipeDraftApi.generateDraft(prompt)).title).toBe('Đậu hũ');
    await expect(recipeDraftApi.generateDraft(prompt)).rejects.toThrow(
      'Phản hồi gợi ý công thức AI không đúng định dạng.'
    );
  });
});
