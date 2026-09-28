import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { toastApiError } from '@/lib/api-error';
import type { PaginationResult } from '@/types/api';
import { notificationApi, type GetNotificationsParams } from '../api/notification.api';
import type { AppNotification, UnreadCount } from '../types/notification.model';

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  list: (params?: GetNotificationsParams) => [...NOTIFICATION_KEYS.all, 'list', params] as const,
  unreadCount: () => [...NOTIFICATION_KEYS.all, 'unread-count'] as const,
};

/**
 * Số đếm chưa đọc — chỉ member (guest không bắn request).
 * Polling 60s, dừng khi tab ẩn (`refetchIntervalInBackground: false`).
 */
export function useUnreadCountQuery() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: () => notificationApi.getUnreadCount(),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
    enabled: isAuthenticated,
  });
}

/**
 * Danh sách thông báo — chỉ member.
 * Fetch khi panel mở.
 */
export function useNotificationsQuery(params?: GetNotificationsParams) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(params),
    queryFn: () => notificationApi.getNotifications(params),
    staleTime: 30 * 1000,
    enabled: isAuthenticated,
  });
}

/** Hook tiện ích lấy số chưa đọc cho chuông thông báo (đọc từ unreadCount query). */
export function useUnreadCount(): UnreadCount {
  const { data } = useUnreadCountQuery();
  return data ?? { count: 0, capped: '' };
}

/** Đánh dấu 1 mục (lạc quan + rollback khi lỗi). */
export function useMarkReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.all });

      // Lưu trạng thái trước đó
      const previousList = queryClient.getQueriesData<PaginationResult<AppNotification>>({
        queryKey: NOTIFICATION_KEYS.all,
      });
      const previousCount = queryClient.getQueryData<UnreadCount>(NOTIFICATION_KEYS.unreadCount());

      // Cập nhật lạc quan danh sách
      queryClient.setQueriesData<PaginationResult<AppNotification>>(
        { queryKey: NOTIFICATION_KEYS.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
          };
        }
      );

      // Cập nhật lạc quan số đếm
      queryClient.setQueryData<UnreadCount>(NOTIFICATION_KEYS.unreadCount(), (old) => {
        if (!old) return old;
        const newCount = Math.max(0, old.count - 1);
        return {
          count: newCount,
          capped: newCount === 0 ? '' : newCount > 9 ? '9+' : String(newCount),
        };
      });

      return { previousList, previousCount };
    },
    onError: (_err, _id, context) => {
      if (context?.previousList) {
        context.previousList.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousCount) {
        queryClient.setQueryData(NOTIFICATION_KEYS.unreadCount(), context.previousCount);
      }
      toastApiError(_err, 'Không thể đánh dấu đã đọc');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

/** Đánh dấu tất cả (lạc quan + rollback khi lỗi). */
export function useMarkAllReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.all });

      const previousList = queryClient.getQueriesData<PaginationResult<AppNotification>>({
        queryKey: NOTIFICATION_KEYS.all,
      });
      const previousCount = queryClient.getQueryData<UnreadCount>(NOTIFICATION_KEYS.unreadCount());

      // Cập nhật tất cả item sang read: true
      queryClient.setQueriesData<PaginationResult<AppNotification>>(
        { queryKey: NOTIFICATION_KEYS.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) => ({ ...item, read: true })),
          };
        }
      );

      // Đặt số đếm về 0
      queryClient.setQueryData<UnreadCount>(NOTIFICATION_KEYS.unreadCount(), {
        count: 0,
        capped: '',
      });

      return { previousList, previousCount };
    },
    onSuccess: (result) => {
      toast.success(
        result.updatedCount > 0
          ? `Đã đánh dấu ${result.updatedCount} thông báo.`
          : 'Không còn thông báo chưa đọc.'
      );
    },
    onError: (_err, _vars, context) => {
      if (context?.previousList) {
        context.previousList.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousCount) {
        queryClient.setQueryData(NOTIFICATION_KEYS.unreadCount(), context.previousCount);
      }
      toastApiError(_err, 'Không thể đánh dấu tất cả');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}
