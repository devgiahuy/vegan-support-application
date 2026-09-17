import type { NotificationDto } from '../types/notification.dto';
import type { AppNotification } from '../types/notification.model';
import { notificationMapper } from '../mappers/notification.mapper';
import { notificationListFixture } from '../__fixtures__/notification-fixtures';

/**
 * API thông báo — PHASE SCAFFOLD: đọc fixture, 0 request mạng.
 * Backend còn `PLANNED` (không có schema swagger) nên 3 hàm dưới MÔ PHỎNG
 * đúng signature dự kiến live.
 *
 * Ngày nối live (TODO(BE-READY)): reconfirm shape 3 endpoint với swagger thật,
 * sửa mapper nếu lệch, thay thân hàm bằng axios qua `API_ENDPOINTS.NOTIFICATIONS`,
 * giữ nguyên chữ ký + kiểu trả về — queries/components KHÔNG đổi.
 * Đồng thời chuyển `__fixtures__` sang test-only hoặc xóa khỏi bundle.
 */
export const USE_FIXTURES = true;

const SIMULATED_DELAY_MS = 300;

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

let store: (NotificationDto | null)[] = clone(notificationListFixture.data ?? []);

export function __resetNotificationFixtures(): void {
  store = clone(notificationListFixture.data ?? []);
}

export const notificationApi = {
  /** `GET /notifications` (fixture). */
  getNotifications: async (): Promise<{ items: AppNotification[] }> => {
    await delay();
    const result = notificationMapper.toListModel({
      success: true,
      data: clone(store),
      meta: null,
    });
    return { items: result.items };
  },

  /** `PATCH /notifications/:id/read` (fixture, idempotent). */
  markRead: async (id: string): Promise<{ id: string; read: boolean }> => {
    await delay();
    store = store.map((item) =>
      item && item.id === id ? { ...item, read: true, readAt: new Date().toISOString() } : item
    );
    return notificationMapper.toReadModel({ success: true, data: { id, read: true }, meta: null });
  },

  /** `PATCH /notifications/read-all` (fixture, idempotent). */
  markAllRead: async (): Promise<{ updatedCount: number }> => {
    await delay();
    const now = new Date().toISOString();
    let updatedCount = 0;
    store = store.map((item) => {
      if (item && !item.read) {
        updatedCount += 1;
        return { ...item, read: true, readAt: now };
      }
      return item;
    });
    return notificationMapper.toReadAllModel({ success: true, data: { updatedCount }, meta: null });
  },
};
