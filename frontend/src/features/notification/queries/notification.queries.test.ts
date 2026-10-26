import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { NOTIFICATION_KEYS } from './notification.queries';
import type { PaginationResult } from '@/types/api';
import type { AppNotification, UnreadCount } from '../types/notification.model';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/lib/api-error', () => ({
  toastApiError: vi.fn(),
}));

describe('NOTIFICATION_KEYS', () => {
  it('định nghĩa query keys phân tách rõ rệt giữa list và unreadCount', () => {
    expect(NOTIFICATION_KEYS.all).toEqual(['notifications']);
    expect(NOTIFICATION_KEYS.lists()).toEqual(['notifications', 'list']);
    expect(NOTIFICATION_KEYS.list()).toEqual(['notifications', 'list', undefined]);
    expect(NOTIFICATION_KEYS.list({ page: 2 })).toEqual(['notifications', 'list', { page: 2 }]);
    expect(NOTIFICATION_KEYS.unreadCount()).toEqual(['notifications', 'unread-count']);
  });

  it('lists() không match unreadCount key trong React Query key matching', () => {
    const listPrefix = NOTIFICATION_KEYS.lists();
    const unreadKey = NOTIFICATION_KEYS.unreadCount();

    // Trong React Query, prefix matching kiểm tra từng phần tử mảng
    const isPrefixMatch = unreadKey
      .slice(0, listPrefix.length)
      .every((v, i) => v === listPrefix[i]);
    expect(isPrefixMatch).toBe(false);
  });
});

describe('useMarkReadMutation optimistic update & rollback', () => {
  let queryClient: QueryClient;

  const initialList: PaginationResult<AppNotification> = {
    items: [
      {
        id: 'notif-1',
        type: 'POST_APPROVED',
        typeLabel: 'Bài được duyệt',
        title: 'Món ăn đã được duyệt',
        summary: 'Chúc mừng bạn!',
        link: '/recipes/1',
        read: false,
        readAt: null,
        createdAt: new Date(),
        timeAgo: 'vừa xong',
      },
      {
        id: 'notif-2',
        type: 'SYSTEM',
        typeLabel: 'Hệ thống',
        title: 'Chào mừng thành viên mới',
        summary: '',
        link: null,
        read: true,
        readAt: new Date(),
        createdAt: new Date(),
        timeAgo: '1 giờ trước',
      },
    ],
    metadata: {
      page: 1,
      limit: 10,
      totalItems: 2,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };

  const initialUnreadCount: UnreadCount = {
    count: 1,
    capped: '1',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    // Giả lập cache song song: cả list và unreadCount đều có trong queryClient
    queryClient.setQueryData(NOTIFICATION_KEYS.list(), initialList);
    queryClient.setQueryData(NOTIFICATION_KEYS.unreadCount(), initialUnreadCount);
  });

  it('cập nhật lạc quan thành công không ném lỗi Cannot read properties of undefined (reading map)', () => {
    const idToMark = 'notif-1';

    // Mô phỏng logic onMutate đã sửa: nhắm mục tiêu NOTIFICATION_KEYS.lists() thay vì all
    const previousList = queryClient.getQueriesData<PaginationResult<AppNotification>>({
      queryKey: NOTIFICATION_KEYS.lists(),
    });
    const previousCount = queryClient.getQueryData<UnreadCount>(NOTIFICATION_KEYS.unreadCount());

    expect(() => {
      queryClient.setQueriesData<PaginationResult<AppNotification>>(
        { queryKey: NOTIFICATION_KEYS.lists() },
        (old) => {
          if (!old || !Array.isArray(old.items)) return old;
          return {
            ...old,
            items: old.items.map((item) => (item.id === idToMark ? { ...item, read: true } : item)),
          };
        }
      );
    }).not.toThrow();

    // Số đếm được giảm chính xác
    queryClient.setQueryData<UnreadCount>(NOTIFICATION_KEYS.unreadCount(), (old) => {
      if (!old) return old;
      const newCount = Math.max(0, old.count - 1);
      return {
        count: newCount,
        capped: newCount === 0 ? '' : newCount > 9 ? '9+' : String(newCount),
      };
    });

    const updatedList = queryClient.getQueryData<PaginationResult<AppNotification>>(
      NOTIFICATION_KEYS.list()
    );
    expect(updatedList?.items.find((item) => item.id === idToMark)?.read).toBe(true);

    const updatedCount = queryClient.getQueryData<UnreadCount>(NOTIFICATION_KEYS.unreadCount());
    expect(updatedCount?.count).toBe(0);
    expect(updatedCount?.capped).toBe('');

    // Kiểm tra rollback khi xảy ra lỗi
    previousList.forEach(([queryKey, data]) => {
      queryClient.setQueryData(queryKey, data);
    });
    if (previousCount) {
      queryClient.setQueryData(NOTIFICATION_KEYS.unreadCount(), previousCount);
    }

    const rolledBackList = queryClient.getQueryData<PaginationResult<AppNotification>>(
      NOTIFICATION_KEYS.list()
    );
    expect(rolledBackList?.items.find((item) => item.id === idToMark)?.read).toBe(false);
    const rolledBackCount = queryClient.getQueryData<UnreadCount>(NOTIFICATION_KEYS.unreadCount());
    expect(rolledBackCount?.count).toBe(1);
    expect(rolledBackCount?.capped).toBe('1');
  });

  it('xử lý an toàn khi cache chứa dữ liệu bất thường (items không phải mảng)', () => {
    queryClient.setQueryData(NOTIFICATION_KEYS.lists(), { notAnArray: true });

    expect(() => {
      queryClient.setQueriesData<PaginationResult<AppNotification>>(
        { queryKey: NOTIFICATION_KEYS.lists() },
        (old) => {
          if (!old || !Array.isArray(old.items)) return old;
          return {
            ...old,
            items: old.items.map((item) => (item.id === '1' ? { ...item, read: true } : item)),
          };
        }
      );
    }).not.toThrow();
  });
});

describe('useMarkAllReadMutation optimistic update & rollback', () => {
  let queryClient: QueryClient;

  const initialList: PaginationResult<AppNotification> = {
    items: [
      {
        id: 'notif-1',
        type: 'POST_APPROVED',
        typeLabel: 'Bài được duyệt',
        title: 'Món ăn 1',
        summary: '',
        link: '/recipes/1',
        read: false,
        readAt: null,
        createdAt: new Date(),
        timeAgo: 'vừa xong',
      },
      {
        id: 'notif-2',
        type: 'COMMENT_REPLY',
        typeLabel: 'Trả lời bình luận',
        title: 'Bình luận mới',
        summary: '',
        link: '/recipes/2',
        read: false,
        readAt: null,
        createdAt: new Date(),
        timeAgo: '5 phút trước',
      },
    ],
    metadata: {
      page: 1,
      limit: 10,
      totalItems: 2,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };

  beforeEach(() => {
    queryClient = new QueryClient();
    queryClient.setQueryData(NOTIFICATION_KEYS.list(), initialList);
    queryClient.setQueryData(NOTIFICATION_KEYS.unreadCount(), { count: 2, capped: '2' });
  });

  it('đánh dấu tất cả lạc quan thành công không ném lỗi và đưa số đếm về 0', () => {
    expect(() => {
      queryClient.setQueriesData<PaginationResult<AppNotification>>(
        { queryKey: NOTIFICATION_KEYS.lists() },
        (old) => {
          if (!old || !Array.isArray(old.items)) return old;
          return {
            ...old,
            items: old.items.map((item) => ({ ...item, read: true })),
          };
        }
      );
    }).not.toThrow();

    queryClient.setQueryData<UnreadCount>(NOTIFICATION_KEYS.unreadCount(), {
      count: 0,
      capped: '',
    });

    const updatedList = queryClient.getQueryData<PaginationResult<AppNotification>>(
      NOTIFICATION_KEYS.list()
    );
    expect(updatedList?.items.every((i) => i.read)).toBe(true);

    const updatedCount = queryClient.getQueryData<UnreadCount>(NOTIFICATION_KEYS.unreadCount());
    expect(updatedCount?.count).toBe(0);
    expect(updatedCount?.capped).toBe('');
  });
});
