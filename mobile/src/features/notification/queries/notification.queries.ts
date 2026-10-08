import { type InfiniteData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getNextPageNumber } from '@/lib/pagination';
import { useAuthStore } from '@/store/useAuthStore';
import type { PaginationResult } from '@/types/api';
import { notificationApi, type GetNotificationsParams } from '../api/notification.api';
import { notificationMapper } from '../mappers/notification.mapper';
import type { AppNotification, UnreadCount } from '../types/notification.model';

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  list: (params?: GetNotificationsParams) => [...NOTIFICATION_KEYS.all, 'list', params ?? {}] as const,
  unreadCount: () => [...NOTIFICATION_KEYS.all, 'unread-count'] as const,
};

const LIST_KEY_PREFIX = [...NOTIFICATION_KEYS.all, 'list'] as const;
const INFINITE_KEY_PREFIX = [...NOTIFICATION_KEYS.all, 'list-infinite'] as const;

type InfiniteNotifications = InfiniteData<PaginationResult<AppNotification>>;

/** Áp dụng `transform` lên từng thông báo của danh sách phân trang kiểu "Tải thêm". */
function mapInfinite(
  old: InfiniteNotifications | undefined,
  transform: (item: AppNotification) => AppNotification
): InfiniteNotifications | undefined {
  return old
    ? { ...old, pages: old.pages.map((page) => ({ ...page, items: page.items.map(transform) })) }
    : old;
}

/** Số chưa đọc cho chuông — chỉ khi đã đăng nhập, polling 60 giây khi app đang mở. */
export function useUnreadCountQuery() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: () => notificationApi.getUnreadCount(),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    enabled: isAuthenticated,
  });
}

/** Danh sách thông báo — chỉ khi đã đăng nhập. */
export function useNotificationsQuery(params?: GetNotificationsParams) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(params),
    queryFn: () => notificationApi.getNotifications(params),
    staleTime: 30 * 1000,
    enabled: isAuthenticated,
  });
}

/** Danh sách thông báo phân trang kiểu "Tải thêm" (màn Thông báo). `params` không chứa `page`. */
export function useInfiniteNotificationsQuery(params?: Omit<GetNotificationsParams, 'page'>) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useInfiniteQuery({
    queryKey: [...INFINITE_KEY_PREFIX, params ?? {}] as const,
    queryFn: ({ pageParam }) => notificationApi.getNotifications({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: getNextPageNumber,
    staleTime: 30 * 1000,
    enabled: isAuthenticated,
  });
}

/** Đánh dấu 1 thông báo đã đọc (cập nhật lạc quan + hoàn tác khi lỗi). */
export function useMarkReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.all });
      const previousLists = queryClient.getQueriesData<PaginationResult<AppNotification>>({
        queryKey: LIST_KEY_PREFIX,
      });
      const previousInfinite = queryClient.getQueriesData<InfiniteNotifications>({ queryKey: INFINITE_KEY_PREFIX });
      const previousCount = queryClient.getQueryData<UnreadCount>(NOTIFICATION_KEYS.unreadCount());

      queryClient.setQueriesData<PaginationResult<AppNotification>>({ queryKey: LIST_KEY_PREFIX }, (old) =>
        old ? { ...old, items: old.items.map((item) => (item.id === id ? { ...item, read: true } : item)) } : old
      );
      queryClient.setQueriesData<InfiniteNotifications>({ queryKey: INFINITE_KEY_PREFIX }, (old) =>
        mapInfinite(old, (item) => (item.id === id ? { ...item, read: true } : item))
      );
      queryClient.setQueryData<UnreadCount>(NOTIFICATION_KEYS.unreadCount(), (old) =>
        old ? notificationMapper.toUnreadCount(Math.max(0, old.count - 1)) : old
      );
      return { previousLists, previousInfinite, previousCount };
    },
    onError: (_error, _id, context) => {
      context?.previousLists.forEach(([key, data]) => queryClient.setQueryData(key, data));
      context?.previousInfinite.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (context?.previousCount) queryClient.setQueryData(NOTIFICATION_KEYS.unreadCount(), context.previousCount);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

/** Đánh dấu tất cả đã đọc (cập nhật lạc quan + hoàn tác khi lỗi). */
export function useMarkAllReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.all });
      const previousLists = queryClient.getQueriesData<PaginationResult<AppNotification>>({
        queryKey: LIST_KEY_PREFIX,
      });
      const previousInfinite = queryClient.getQueriesData<InfiniteNotifications>({ queryKey: INFINITE_KEY_PREFIX });
      const previousCount = queryClient.getQueryData<UnreadCount>(NOTIFICATION_KEYS.unreadCount());

      queryClient.setQueriesData<PaginationResult<AppNotification>>({ queryKey: LIST_KEY_PREFIX }, (old) =>
        old ? { ...old, items: old.items.map((item) => ({ ...item, read: true })) } : old
      );
      queryClient.setQueriesData<InfiniteNotifications>({ queryKey: INFINITE_KEY_PREFIX }, (old) =>
        mapInfinite(old, (item) => ({ ...item, read: true }))
      );
      queryClient.setQueryData<UnreadCount>(NOTIFICATION_KEYS.unreadCount(), notificationMapper.toUnreadCount(0));
      return { previousLists, previousInfinite, previousCount };
    },
    onError: (_error, _vars, context) => {
      context?.previousLists.forEach(([key, data]) => queryClient.setQueryData(key, data));
      context?.previousInfinite.forEach(([key, data]) => queryClient.setQueryData(key, data));
      if (context?.previousCount) queryClient.setQueryData(NOTIFICATION_KEYS.unreadCount(), context.previousCount);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}
