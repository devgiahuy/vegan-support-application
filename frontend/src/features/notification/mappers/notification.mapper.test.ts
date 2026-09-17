import { describe, expect, it } from 'vitest';
import { notificationMapper, toTimeAgo } from './notification.mapper';
import type { NotificationListResponseDto } from '../types/notification.dto';

const listEnvelope: NotificationListResponseDto = {
  success: true,
  data: [
    {
      id: 'n1',
      type: 'POST_APPROVED',
      title: 'Bài viết được duyệt',
      summary: 'Món đậu hũ của bạn đã xuất bản.',
      link: '/recipes/dau-hu-sot-nam',
      read: false,
      createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
      id: 'n2',
      type: 'MYSTERY',
      title: '',
      link: 'https://evil.example.com/x',
      read: true,
      read_at: '2026-09-17T10:00:00.000Z',
      created_at: '2026-09-16T10:00:00.000Z',
    },
    null,
  ],
  meta: { page: 1, limit: 10, total: 2, total_pages: 1 },
};

describe('NotificationMapper list', () => {
  it('map đủ field + label Việt + link nội bộ', () => {
    const result = notificationMapper.toListModel(listEnvelope);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].typeLabel).toBe('Bài được duyệt');
    expect(result.items[0].link).toBe('/recipes/dau-hu-sot-nam');
    expect(result.items[0].timeAgo).toBe('5 phút trước');
    expect(result.metadata.totalItems).toBe(2);
  });

  it('loại lạ giữ nguyên, link ngoài → null, title rỗng → fallback', () => {
    const result = notificationMapper.toListModel(listEnvelope);
    expect(result.items[1].typeLabel).toBe('MYSTERY');
    expect(result.items[1].link).toBeNull();
    expect(result.items[1].title).toBe('Thông báo mới');
  });

  it('envelope null → list rỗng', () => {
    const result = notificationMapper.toListModel(null);
    expect(result.items).toEqual([]);
    expect(result.metadata.totalItems).toBe(0);
  });
});

describe('NotificationMapper unread', () => {
  it('đếm chưa đọc + capped 9+', () => {
    const result = notificationMapper.toListModel(listEnvelope);
    expect(notificationMapper.toUnreadCount(result.items)).toEqual({ count: 1, capped: '1' });
    expect(notificationMapper.toUnreadCount([])).toEqual({ count: 0, capped: '' });
    const many = Array.from({ length: 12 }, (_, i) => ({
      ...result.items[0],
      id: `x${i}`,
      read: false,
    }));
    expect(notificationMapper.toUnreadCount(many).capped).toBe('9+');
  });
});

describe('toTimeAgo', () => {
  it('toReadModel mặc định read=true', () => {
    expect(
      notificationMapper.toReadModel({ success: true, data: { id: 'n1' }, meta: null })
    ).toEqual({
      id: 'n1',
      read: true,
    });
    expect(notificationMapper.toReadModel(null)).toEqual({ id: '', read: true });
  });

  it('toReadAllModel đọc updatedCount, thiếu → 0', () => {
    expect(
      notificationMapper.toReadAllModel({ success: true, data: { updatedCount: 5 }, meta: null })
    ).toEqual({
      updatedCount: 5,
    });
    expect(notificationMapper.toReadAllModel(null)).toEqual({ updatedCount: 0 });
  });
});

describe('toTimeAgo', () => {
  it('vừa xong / giờ / hôm qua / ngày đầy đủ / tương lai', () => {
    const now = Date.now();
    expect(toTimeAgo(new Date(now - 10 * 1000))).toBe('vừa xong');
    expect(toTimeAgo(new Date(now - 3 * 3600 * 1000))).toBe('3 giờ trước');
    expect(toTimeAgo(new Date(now - 30 * 3600 * 1000))).toBe('Hôm qua');
    expect(toTimeAgo(new Date('2026-01-05T10:00:00.000Z'))).toBe('05/01/2026');
    expect(toTimeAgo(new Date(now + 60000))).toBe('');
    expect(toTimeAgo(null)).toBe('');
  });

  it('type rỗng → SYSTEM, link //evil → null, summary thiếu → rỗng', () => {
    const result = notificationMapper.toListModel({
      success: true,
      data: [{ id: 'n', type: '', link: '//evil.example.com/x' }],
      meta: null,
    });
    expect(result.items[0].type).toBe('SYSTEM');
    expect(result.items[0].typeLabel).toBe('Hệ thống');
    expect(result.items[0].link).toBeNull();
    expect(result.items[0].summary).toBe('');
  });

  it('readAt parse đúng, thiếu → null', () => {
    const result = notificationMapper.toListModel({
      success: true,
      data: [{ id: 'n', read: true, readAt: '2026-09-17T10:00:00.000Z' }],
      meta: null,
    });
    expect(result.items[0].read).toBe(true);
    expect(result.items[0].readAt).not.toBeNull();
  });

  it('createdAt sai định dạng → timeAgo rỗng', () => {
    const result = notificationMapper.toListModel({
      success: true,
      data: [{ id: 'n', createdAt: 'not-a-date' }],
      meta: null,
    });
    expect(result.items[0].timeAgo).toBe('');
  });

  it('meta thiếu → fallback theo số item, item rỗng id bị lọc', () => {
    const result = notificationMapper.toListModel({
      success: true,
      data: [{ id: 'a' }, { id: '' }],
      meta: null,
    });
    expect(result.items.map((i) => i.id)).toEqual(['a']);
    expect(result.metadata).toMatchObject({ page: 1, totalItems: 1 });
  });

  it('tất cả đã đọc → đếm 0, capped rỗng', () => {
    const result = notificationMapper.toListModel({
      success: true,
      data: [
        { id: 'a', read: true },
        { id: 'b', read: true },
      ],
      meta: null,
    });
    expect(notificationMapper.toUnreadCount(result.items)).toEqual({ count: 0, capped: '' });
  });
});
