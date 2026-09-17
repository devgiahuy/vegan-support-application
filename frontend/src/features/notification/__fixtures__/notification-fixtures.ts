import type { NotificationListResponseDto } from '../types/notification.dto';

/** Fixture thông báo (phase scaffold — BE còn `PLANNED`, DTO suy luận). */
export const notificationListFixture: NotificationListResponseDto = {
  success: true,
  data: [
    {
      id: 'notif-1',
      type: 'POST_APPROVED',
      title: 'Bài viết được duyệt',
      summary: 'Món đậu hũ sốt nấm của bạn đã xuất bản.',
      link: '/recipes/dau-hu-sot-nam',
      read: false,
      createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
      id: 'notif-2',
      type: 'COMMENT_REPLY',
      title: 'Có trả lời mới',
      summary: 'Bếp Xanh đã trả lời bình luận của bạn.',
      link: '/recipes/dau-hu-sot-nam',
      read: false,
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'notif-3',
      type: 'APPLICATION_DECIDED',
      title: 'Đơn cộng tác có kết quả',
      summary: 'Đơn của bạn đã được duyệt.',
      link: '/profile?tab=contributor',
      read: true,
      readAt: '2026-09-17T09:00:00.000Z',
      createdAt: '2026-09-16T10:00:00.000Z',
    },
    {
      id: 'notif-4',
      type: 'SYSTEM',
      title: 'Chào mừng đến VeggieConnect',
      summary: null,
      link: null,
      read: true,
      createdAt: '2026-09-15T10:00:00.000Z',
    },
  ],
  meta: { page: 1, limit: 10, total: 4, totalPages: 1 },
};
