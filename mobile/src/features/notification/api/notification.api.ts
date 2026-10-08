import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { PaginationResult } from '@/types/api';
import type {
  NotificationListResponseDto,
  NotificationReadAllResponseDto,
  NotificationReadResponseDto,
  NotificationUnreadCountResponseDto,
} from '../types/notification.dto';
import type { AppNotification, UnreadCount } from '../types/notification.model';
import { notificationMapper } from '../mappers/notification.mapper';

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export const notificationApi = {
  /** `GET /notifications` — thông báo cá nhân, mới nhất trước. */
  getNotifications: async (params?: GetNotificationsParams): Promise<PaginationResult<AppNotification>> => {
    const res = await api.get<NotificationListResponseDto>(API_ENDPOINTS.NOTIFICATIONS.LIST, {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        ...(params?.unreadOnly ? { unreadOnly: 'true' } : {}),
      },
      silent: true,
    });
    return notificationMapper.toListModel(res.data);
  },

  /** `GET /notifications/unread-count` */
  getUnreadCount: async (): Promise<UnreadCount> => {
    const res = await api.get<NotificationUnreadCountResponseDto>(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT, {
      silent: true,
    });
    return notificationMapper.toUnreadCountFromDto(res.data);
  },

  /** `PATCH /notifications/:id/read` — idempotent. */
  markRead: async (id: string): Promise<{ id: string; read: boolean }> => {
    const res = await api.patch<NotificationReadResponseDto>(API_ENDPOINTS.NOTIFICATIONS.READ(id), undefined, {
      silent: true,
    });
    return notificationMapper.toReadModel(res.data);
  },

  /** `PATCH /notifications/read-all` */
  markAllRead: async (): Promise<{ updatedCount: number }> => {
    const res = await api.patch<NotificationReadAllResponseDto>(API_ENDPOINTS.NOTIFICATIONS.READ_ALL, undefined, {
      silent: true,
    });
    return notificationMapper.toReadAllModel(res.data);
  },
};
