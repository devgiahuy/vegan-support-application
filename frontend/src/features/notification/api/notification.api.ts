import apiClient from '@/lib/axios';
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
  /** `GET /notifications` — lấy danh sách thông báo cá nhân (live API). */
  getNotifications: async (
    params?: GetNotificationsParams
  ): Promise<PaginationResult<AppNotification>> => {
    const response = await apiClient.get<NotificationListResponseDto>(
      API_ENDPOINTS.NOTIFICATIONS.LIST,
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          ...(params?.unreadOnly ? { unreadOnly: 'true' } : {}),
        },
      }
    );
    return notificationMapper.toListModel(response.data);
  },

  /** `GET /notifications/unread-count` — lấy số đếm chưa đọc (live API). */
  getUnreadCount: async (): Promise<UnreadCount> => {
    const response = await apiClient.get<NotificationUnreadCountResponseDto>(
      API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT
    );
    return notificationMapper.toUnreadCountFromDto(response.data);
  },

  /** `PATCH /notifications/:id/read` — đánh dấu 1 thông báo đã đọc (idempotent, live API). */
  markRead: async (id: string): Promise<{ id: string; read: boolean }> => {
    const response = await apiClient.patch<NotificationReadResponseDto>(
      API_ENDPOINTS.NOTIFICATIONS.READ(id)
    );
    return notificationMapper.toReadModel(response.data);
  },

  /** `PATCH /notifications/read-all` — đánh dấu tất cả thông báo đã đọc (live API). */
  markAllRead: async (): Promise<{ updatedCount: number }> => {
    const response = await apiClient.patch<NotificationReadAllResponseDto>(
      API_ENDPOINTS.NOTIFICATIONS.READ_ALL
    );
    return notificationMapper.toReadAllModel(response.data);
  },
};
