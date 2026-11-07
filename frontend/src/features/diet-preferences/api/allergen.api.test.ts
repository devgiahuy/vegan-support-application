import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { allergenApi } from './allergen.api';

describe('allergen API response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps the catalog from a successful response', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: { success: true, data: [{ code: 'PEANUT', label: 'Đậu phộng' }] },
    });
    await expect(allergenApi.list()).resolves.toMatchObject([
      { code: 'PEANUT', label: 'Đậu phộng' },
    ]);
  });

  it('rejects a missing catalog instead of treating it as empty', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { success: true, data: null } });
    await expect(allergenApi.list()).rejects.toThrow('Không đọc được danh mục dị ứng.');
  });
});
