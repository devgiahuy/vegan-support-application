import { BaseMapper } from '@/lib/mapper/base-mapper';
import { pickField, safeArray, safeDate, safeString } from '@/lib/mapper/field-helpers';
import type {
  AdminAuditItemDto,
  AdminAuditPageDto,
} from '@/features/admin-insights/types/admin-audit.dto';
import type {
  AdminAuditPage,
  AdminAuditRow,
} from '@/features/admin-insights/types/admin-audit.model';

const sourceLabels: Record<string, string> = {
  AI_CONTROL: 'Cấu hình AI',
  AI_FLAG: 'Giám sát tự động',
  BILLING: 'Gói tiện ích',
  MODERATION: 'Kiểm duyệt',
  RESTAURANT: 'Quán chay',
  STORAGE: 'Lưu trữ',
};
const actionLabels: Record<string, string> = {
  APPROVE: 'Phê duyệt',
  APPROVED: 'Phê duyệt',
  REJECT: 'Từ chối',
  REJECTED: 'Từ chối',
  NO_VIOLATION: 'Kết luận không vi phạm',
  WARN: 'Cảnh cáo',
  HIDE: 'Ẩn',
  RESTORE: 'Khôi phục',
  DEMOTE: 'Hạ vai trò',
  BAN: 'Cấm tài khoản',
  UNBAN: 'Bỏ cấm tài khoản',
  LOCK: 'Khóa tài khoản',
  UNLOCK: 'Mở khóa tài khoản',
  DELETE_ACCOUNT: 'Xóa tài khoản',
  FLAGGED: 'Gắn cờ cần xem xét',
  ENABLE: 'Bật tính năng',
  DISABLE: 'Tắt tính năng',
  EDITED: 'Chỉnh sửa',
  CREATE: 'Tạo gói',
  UPDATE: 'Cập nhật gói',
  ACTIVATE: 'Mở bán',
  WITHDRAW: 'Ngừng bán',
  ADJUST_QUOTA: 'Điều chỉnh dung lượng',
};
const targetLabels: Record<string, string> = {
  AI_CAPABILITY: 'Tính năng AI',
  AI_FLAG: 'Cờ kiểm duyệt',
  BILLING_PRODUCT: 'Gói tiện ích',
  COMMENT: 'Bình luận',
  POST: 'Bài viết',
  POST_REVISION: 'Phiên bản bài viết',
  REPORT: 'Báo cáo',
  RESTAURANT: 'Quán chay',
  USER: 'Tài khoản',
};
const dateFormat = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'medium',
  timeZone: 'Asia/Ho_Chi_Minh',
});

function label(labels: Record<string, string>, value: string, fallback: string) {
  return Object.hasOwn(labels, value) ? labels[value] : fallback;
}

function mapRow(dto: AdminAuditItemDto): AdminAuditRow | null {
  const id = safeString(pickField(dto, ['id'], ''));
  const source = safeString(pickField(dto, ['source'], ''));
  const date = safeDate(pickField(dto, ['occurredAt'], null));
  if (!id || !date) return null;
  const actorName = safeString(pickField(dto, ['actor.displayName'], ''));
  return {
    key: source + ':' + id,
    sourceLabel: label(sourceLabels, source, 'Nguồn khác'),
    actionLabel: label(actionLabels, safeString(pickField(dto, ['action'], '')), 'Thao tác khác'),
    actorLabel: actorName || (source === 'AI_FLAG' ? 'Hệ thống' : 'Tài khoản không rõ'),
    targetLabel: label(targetLabels, safeString(pickField(dto, ['targetType'], '')), 'Đối tượng'),
    targetId: safeString(pickField(dto, ['targetId'], '')),
    occurredAt: date.toISOString(),
    timeLabel: dateFormat.format(date),
  };
}

class AdminAuditMapper extends BaseMapper<AdminAuditPageDto, AdminAuditPage> {
  toModel(dto: AdminAuditPageDto | null | undefined): AdminAuditPage {
    return {
      rows: safeArray(pickField(dto, ['items'], []), mapRow).filter((row) => row !== null),
      nextCursor: safeString(pickField(dto, ['nextCursor'], '')) || null,
    };
  }
}

export const adminAuditMapper = new AdminAuditMapper();
