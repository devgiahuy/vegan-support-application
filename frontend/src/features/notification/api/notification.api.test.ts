import { afterEach, describe, expect, it, vi } from 'vitest';
import api from '@/lib/axios';
import { notificationApi } from './notification.api';

describe('notificationApi response mapping', () => {
  afterEach(() => vi.restoreAllMocks());

  it('maps notification data and pagination metadata', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({
      data: {
        data: [{ id: 'n1', title: 'Thông báo' }],
        meta: { page: 2, total: 21, totalPages: 3 },
      },
    });
    const result = await notificationApi.getNotifications({ page: 2 });
    expect(result.items[0].id).toBe('n1');
    expect(result.metadata).toMatchObject({ page: 2, totalItems: 21, totalPages: 3 });
  });

  it('maps count and read responses', async () => {
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { data: { count: 12 } } });
    vi.spyOn(api, 'patch')
      .mockResolvedValueOnce({ data: { data: { id: 'n1', read: true } } })
      .mockResolvedValueOnce({ data: { data: { updatedCount: 3 } } });
    await expect(notificationApi.getUnreadCount()).resolves.toEqual({ count: 12, capped: '9+' });
    await expect(notificationApi.markRead('n1')).resolves.toEqual({ id: 'n1', read: true });
    await expect(notificationApi.markAllRead()).resolves.toEqual({ updatedCount: 3 });
  });
});
