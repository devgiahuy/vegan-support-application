import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { storageApi } from './storage.api';

describe('storage response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps the admin account array and keeps server pagination', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: {
        success: true,
        data: [{ user: { id: 'user-1', email: 'a@example.com', displayName: 'A' } }],
        meta: { page: 2, limit: 10, total: 11, totalPages: 2 },
      },
    });
    const result = await storageApi.getAdminAccounts({ page: 2 });
    expect(result.items[0]).toMatchObject({ userId: 'user-1', userEmail: 'a@example.com' });
    expect(result).toMatchObject({ page: 2, limit: 10, total: 11, totalPages: 2 });
  });

  it('rejects a malformed admin list instead of silently showing empty state', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: { success: true, data: { items: [] }, meta: { page: 1 } },
    });
    await expect(storageApi.getAdminPolicies()).rejects.toThrow('không đúng định dạng');
  });

  it('maps the upload parameters into an internal model', async () => {
    vi.spyOn(api, 'post').mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          reservation: { id: 'reservation-1' },
          usage: { usedBytes: 0, limitBytes: 1024 },
          upload: { uploadUrl: 'https://upload.example', fields: { token: 'abc' } },
        },
      },
    });
    const result = await storageApi.createReservation({
      kind: 'COVER_IMAGE',
      mimeType: 'image/jpeg',
      extension: '.jpg',
      bytes: 100,
      idempotencyKey: 'test-key',
    });
    expect(result.upload).toEqual({
      uploadUrl: 'https://upload.example',
      fields: { token: 'abc' },
    });
  });
});
