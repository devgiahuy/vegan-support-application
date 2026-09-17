import { BaseMapper, pickField, safeArray, safeDate, safeNumber, safeString } from '@/lib/mapper';
import type { PaginationResult } from '@/types/api';
import type {
  NotificationDto,
  NotificationListResponseDto,
  NotificationReadAllResponseDto,
  NotificationReadResponseDto,
} from '../types/notification.dto';
import type { AppNotification, UnreadCount } from '../types/notification.model';

const TYPE_LABELS: Record<string, string> = {
  POST_APPROVED: 'Bài được duyệt',
  COMMENT_REPLY: 'Trả lời bình luận',
  APPLICATION_DECIDED: 'Đơn cộng tác',
  SYSTEM: 'Hệ thống',
};

/** ISO → `vừa xong` / `N phút trước` / `N giờ trước` / `Hôm qua` / `dd/mm/yyyy`. */
export function toTimeAgo(date: Date | null): string {
  if (!date) return '';
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return '';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  if (hours < 48) return 'Hôm qua';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isInternalLink(link: string): boolean {
  return link.startsWith('/') && !link.startsWith('//');
}

/**
 * NotificationMapper: list + read + unread count.
 * DTO SUY LUẬN (không schema swagger) — mọi field optional + fallback.
 * Envelope `{success, data, meta}` đọc trực tiếp.
 */
export class NotificationMapper extends BaseMapper<NotificationDto, AppNotification> {
  toModel(dto: NotificationDto | null | undefined): AppNotification {
    const type = safeString(pickField(dto, ['type'], '')) || 'SYSTEM';
    const link = safeString(pickField(dto, ['link'], '')) || null;
    const createdAt = safeDate(pickField(dto, ['createdAt', 'created_at'], null));
    return {
      id: safeString(pickField(dto, ['id'], '')),
      type,
      typeLabel: TYPE_LABELS[type] ?? type,
      title: safeString(pickField(dto, ['title'], '')) || 'Thông báo mới',
      summary: safeString(pickField(dto, ['summary'], '')),
      link: link && isInternalLink(link) ? link : null,
      read: pickField<boolean>(dto, ['read'], false),
      readAt: safeDate(pickField(dto, ['readAt', 'read_at'], null)),
      createdAt,
      timeAgo: toTimeAgo(createdAt),
    };
  }

  /** `GET /notifications` — mảng + meta. */
  toListModel(
    dto: NotificationListResponseDto | null | undefined
  ): PaginationResult<AppNotification> {
    const rawItems = pickField(dto, ['data'], null) as (NotificationDto | null)[] | null;
    const items = this.toModelList(
      safeArray<NotificationDto | null, NotificationDto | null>(rawItems, (item) => item)
    ).filter((item) => item.id.length > 0);
    const meta = pickField(dto, ['meta'], null) as NotificationListResponseDto['meta'];
    const page = safeNumber(pickField(meta, ['page'], 1));
    const limit = safeNumber(pickField(meta, ['limit'], 10));
    const totalItems = safeNumber(pickField(meta, ['total'], items.length));
    const totalPages = safeNumber(pickField(meta, ['totalPages', 'total_pages'], 1));
    return {
      items,
      metadata: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /** Đếm chưa đọc từ list (không endpoint riêng). */
  toUnreadCount(items: AppNotification[]): UnreadCount {
    const count = items.filter((item) => !item.read).length;
    return { count, capped: count === 0 ? '' : count > 9 ? '9+' : String(count) };
  }

  /** `PATCH /notifications/:id/read` → id đã đọc. */
  toReadModel(dto: NotificationReadResponseDto | null | undefined): { id: string; read: boolean } {
    const data = pickField(dto, ['data'], null) as NotificationReadResponseDto['data'];
    return {
      id: safeString(pickField(data, ['id'], '')),
      read: pickField<boolean>(data, ['read'], true),
    };
  }

  /** `PATCH /notifications/read-all` → số lượng đã cập nhật. */
  toReadAllModel(dto: NotificationReadAllResponseDto | null | undefined): { updatedCount: number } {
    const data = pickField(dto, ['data'], null) as NotificationReadAllResponseDto['data'];
    return { updatedCount: safeNumber(pickField(data, ['updatedCount'], 0)) };
  }
}

export const notificationMapper = new NotificationMapper();
