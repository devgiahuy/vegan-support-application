import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { toastApiError } from '@/lib/api-error';
import { notificationApi } from '../api/notification.api';
import { notificationMapper } from '../mappers/notification.mapper';

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  list: () => [...NOTIFICATION_KEYS.all, 'list'] as const,
};

/**
 * Danh sách thông báo — chỉ member (guest không bắn request).
 * Polling 60s, dừng khi tab ẩn (`refetchIntervalInBackground: false`).
 */
export function useNotificationsQuery() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(),
    queryFn: () => notificationApi.getNotifications(),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
    enabled: isAuthenticated,
  });
}

/** Đếm chưa đọc từ cache list (không endpoint riêng). */
export function useUnreadCount() {
  const { data } = useNotificationsQuery();
  return notificationMapper.toUnreadCount(data?.items ?? []);
}

/** Đánh dấu 1 mục (lạc quan + rollback khi lỗi). */
export function useMarkReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.list() });
      const previous = queryClient.getQueryData<{ items: { id: string; read: boolean }[] }>(
        NOTIFICATION_KEYS.list()
      );
      queryClient.setQueryData<{ items: { id: string; read: boolean }[] }>(
        NOTIFICATION_KEYS.list(),
        (old) =>
          old
            ? {
                ...old,
                items: old.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
              }
            : old
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(NOTIFICATION_KEYS.list(), context.previous);
      toastApiError(_err, 'Không thể đánh dấu đã đọc');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.list() });
    },
  });
}

/** Đánh dấu tất cả (lạc quan + rollback khi lỗi). */
export function useMarkAllReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.list() });
      const previous = queryClient.getQueryData<{ items: { id: string; read: boolean }[] }>(
        NOTIFICATION_KEYS.list()
      );
      queryClient.setQueryData<{ items: { id: string; read: boolean }[] }>(
        NOTIFICATION_KEYS.list(),
        (old) => (old ? { ...old, items: old.items.map((item) => ({ ...item, read: true })) } : old)
      );
      return { previous };
    },
    onSuccess: (result) => {
      toast.success(
        result.updatedCount > 0
          ? `Đã đánh dấu ${result.updatedCount} thông báo.`
          : 'Không còn thông báo chưa đọc.'
      );
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(NOTIFICATION_KEYS.list(), context.previous);
      toastApiError(_err, 'Không thể đánh dấu tất cả');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.list() });
    },
  });
}
