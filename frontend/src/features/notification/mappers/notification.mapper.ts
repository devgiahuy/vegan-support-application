import { BaseMapper, pickField, safeArray, safeDate, safeNumber, safeString } from '@/lib/mapper';
import type { PaginationResult } from '@/types/api';
import type {
  NotificationDto,
  NotificationListResponseDto,
  NotificationReadAllResponseDto,
  NotificationReadResponseDto,
  NotificationUnreadCountResponseDto,
} from '../types/notification.dto';
import type { AppNotification, UnreadCount } from '../types/notification.model';

const TYPE_LABELS: Record<string, string> = {
  POST_APPROVED: 'Bài được duyệt',
  POST_REJECTED: 'Bài viết bị từ chối',
  COMMENT_REPLY: 'Trả lời bình luận',
  CONTRIBUTOR_APPROVED: 'Đơn cộng tác được duyệt',
  CONTRIBUTOR_REJECTED: 'Đơn cộng tác bị từ chối',
  CONTRIBUTOR_REVOKED: 'Thu hồi quyền cộng tác',
  APPLICATION_DECIDED: 'Đơn cộng tác',
  RESTAURANT_APPROVED: 'Nhà hàng được duyệt',
  RESTAURANT_REJECTED: 'Nhà hàng bị từ chối',
  STORAGE_WARNING: 'Cảnh báo dung lượng',
  QUOTA_WARNING: 'Cảnh báo dung lượng',
  MODERATION_ACTION: 'Quyết định kiểm duyệt',
  REPORT_RESOLVED: 'Báo cáo đã xử lý',
  AI_VERIFICATION_CREATED: 'Yêu cầu thẩm định AI',
  AI_VERIFICATION_STATUS: 'Cập nhật thẩm định AI',
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
 * Đảm bảo allowlist an toàn, không hiển thị private data hay external url.
 */
export class NotificationMapper extends BaseMapper<NotificationDto, AppNotification> {
  toModel(dto: NotificationDto | null | undefined): AppNotification {
    const type = safeString(pickField(dto, ['type'], '')) || 'SYSTEM';
    const rawLink = safeString(pickField(dto, ['link'], '')) || null;
    const createdAt = safeDate(pickField(dto, ['createdAt', 'created_at'], null));
    return {
      id: safeString(pickField(dto, ['id'], '')),
      type,
      typeLabel: TYPE_LABELS[type] ?? (type.length > 0 ? type : 'Hệ thống'),
      title: safeString(pickField(dto, ['title'], '')) || 'Thông báo mới',
      summary: safeString(pickField(dto, ['summary'], '')),
      link: rawLink && isInternalLink(rawLink) ? rawLink : null,
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

  /** `GET /notifications/unread-count` → UnreadCount */
  toUnreadCountFromDto(dto: NotificationUnreadCountResponseDto | null | undefined): UnreadCount {
    const data = pickField(dto, ['data'], null) as NotificationUnreadCountResponseDto['data'];
    const count = safeNumber(pickField(data, ['count'], 0));
    return { count, capped: count === 0 ? '' : count > 9 ? '9+' : String(count) };
  }

  /** Đếm chưa đọc từ danh sách local cache. */
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
