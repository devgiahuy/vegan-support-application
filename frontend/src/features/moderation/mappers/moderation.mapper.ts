import {
  BaseMapper,
  pickField,
  safeArray,
  safeDate,
  safeEnum,
  safeNumber,
  safeString,
} from '@/lib/mapper';
import type { PaginationResult } from '@/types/api';
import type {
  AdminModerationCommentListResponseDto,
  AdminModerationCommentResponseDto,
  AdminModerationUserListResponseDto,
  AdminModerationUserResponseDto,
  ModeratedCommentDto,
  ModeratedUserDto,
  ModerationReportDto,
  ModerationReportListResponseDto,
  ModerationReportResponseDto,
  ResolveReportRequestDto,
  UpdateCommentStatusRequestDto,
  UpdateUserStatusRequestDto,
} from '../types/moderation.dto';
import type {
  AuditEntry,
  ModeratedComment,
  ModeratedUser,
  ModerationReport,
} from '../types/moderation.model';
import { MemberStatus, ModerationDecision, ReportStatus, ReportTargetType } from '@/common/enums';

const DECISION_LABELS: Record<ModerationDecision, string> = {
  [ModerationDecision.NO_VIOLATION]: 'Không vi phạm',
  [ModerationDecision.WARN]: 'Cảnh cáo',
  [ModerationDecision.HIDE]: 'Ẩn nội dung',
  [ModerationDecision.RESTORE]: 'Khôi phục',
  [ModerationDecision.DEMOTE]: 'Hạ quyền tác giả',
  [ModerationDecision.BAN]: 'Cấm tài khoản',
};

const TARGET_TYPE_LABELS: Record<ReportTargetType, string> = {
  [ReportTargetType.POST]: 'Bài viết',
  [ReportTargetType.COMMENT]: 'Bình luận',
};

const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  [ReportStatus.OPEN]: 'Đang mở',
  [ReportStatus.RESOLVED]: 'Đã xử lý',
};

const USER_STATUS_LABELS: Record<MemberStatus, string> = {
  [MemberStatus.ACTIVE]: 'Hoạt động',
  [MemberStatus.LOCKED]: 'Đã khóa',
  [MemberStatus.BANNED]: 'Đã cấm',
  [MemberStatus.DELETED]: 'Đã xóa',
};

function emptyPageMeta() {
  return { page: 1, limit: 10, totalItems: 0, totalPages: 0 };
}

function toPageMeta(
  meta:
    | { page?: number; limit?: number; total?: number; totalPages?: number; total_pages?: number }
    | null
    | undefined,
  fallbackTotal: number
) {
  const page = safeNumber(pickField(meta, ['page'], 1));
  const limit = safeNumber(pickField(meta, ['limit'], 10));
  const totalItems = safeNumber(pickField(meta, ['total'], fallbackTotal));
  const totalPages = safeNumber(pickField(meta, ['totalPages', 'total_pages'], 1));
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * ModerationMapper: reports, users, comments kiểm duyệt.
 * Envelope `{success, data, meta}` đọc trực tiếp — cấm bọc `APIResponse<>` 2 tầng.
 */
export class ModerationMapper extends BaseMapper<ModerationReportDto, ModerationReport> {
  toModel(dto: ModerationReportDto | null | undefined): ModerationReport {
    const targetType = safeEnum(
      pickField(dto, ['targetType', 'target_type'], 'POST'),
      ReportTargetType,
      ReportTargetType.POST
    );
    const status = safeEnum(pickField(dto, ['status'], 'OPEN'), ReportStatus, ReportStatus.OPEN);
    const resolution = pickField(dto, ['resolution'], null) as
      ModerationReportDto['resolution'] | null;
    const resolvedDecision = pickField<string | null>(
      dto,
      ['resolvedDecision', 'resolved_decision'],
      null
    );
    const decision = resolution?.decision
      ? safeEnum(resolution.decision, ModerationDecision, ModerationDecision.NO_VIOLATION)
      : resolvedDecision
        ? safeEnum(resolvedDecision, ModerationDecision, ModerationDecision.NO_VIOLATION)
        : ModerationDecision.NO_VIOLATION;

    const reasonCode = safeString(pickField(dto, ['reasonCode', 'reason_code'], ''));
    const rawReasons = pickField(dto, ['reasons'], null);
    const reasons = safeArray<string | null, string>(
      rawReasons ?? (reasonCode ? [reasonCode] : null),
      (reason) => safeString(reason)
    ).filter((reason) => reason.length > 0);

    const targetId = safeString(pickField(dto, ['targetId', 'target_id'], ''));
    const targetTitle =
      safeString(pickField(dto, ['targetTitle', 'target_title'], '')) ||
      (targetId ? `Mục tiêu #${targetId.slice(0, 8)}` : 'Nội dung bị báo cáo');
    const targetExcerpt = safeString(pickField(dto, ['targetExcerpt', 'details'], ''));
    const openCount = safeNumber(
      pickField(dto, ['openCount', 'open_count', 'activeReporterCount', 'active_reporter_count'], 0)
    );
    const reporterCount = safeNumber(
      pickField(
        dto,
        ['reporterCount', 'reporter_count', 'activeReporterCount', 'active_reporter_count'],
        0
      )
    );
    const hasResolution = Boolean(resolution || resolvedDecision);

    return {
      id: safeString(pickField(dto, ['id'], '')),
      targetId,
      targetType,
      targetTypeLabel: TARGET_TYPE_LABELS[targetType],
      targetTitle,
      targetExcerpt,
      openCount,
      reasons,
      status,
      statusLabel: REPORT_STATUS_LABELS[status],
      priority: safeString(pickField(dto, ['priority'], '')) || 'MEDIUM',
      reporterCount,
      createdAt: safeDate(pickField(dto, ['createdAt', 'created_at'], null)),
      resolvedAt: safeDate(pickField(dto, ['resolvedAt', 'resolved_at'], null)),
      resolution: hasResolution
        ? {
            targetId,
            decision,
            decisionLabel: DECISION_LABELS[decision],
            reason: safeString(
              resolution?.reason ?? pickField(dto, ['resolvedReason', 'resolved_reason'], '')
            ),
            resolvedBy: safeString(
              resolution?.resolvedBy ??
                resolution?.resolved_by ??
                pickField(dto, ['resolvedById', 'resolved_by_id'], '')
            ),
            resolvedAt: safeDate(
              resolution?.resolvedAt ?? pickField(dto, ['resolvedAt', 'resolved_at'], null)
            ),
          }
        : null,
    };
  }

  /** `GET /admin/reports` — mục tiêu gộp + meta. */
  toReportsList(
    dto: ModerationReportListResponseDto | null | undefined
  ): PaginationResult<ModerationReport> {
    const rawItems = pickField(dto, ['data'], null) as (ModerationReportDto | null)[] | null;
    const items = this.toModelList(
      safeArray<ModerationReportDto | null, ModerationReportDto | null>(rawItems, (item) => item)
    ).filter((item) => item.id.length > 0);
    const meta = pickField(dto, ['meta'], null) as ModerationReportListResponseDto['meta'];
    return {
      items,
      metadata: meta
        ? toPageMeta(meta, items.length)
        : { ...emptyPageMeta(), totalItems: items.length },
    };
  }

  /** `PATCH /admin/reports/:id/resolve` → báo cáo đã resolve. */
  toResolvedReport(dto: ModerationReportResponseDto | null | undefined): ModerationReport {
    const data = pickField(dto, ['data'], null) as ModerationReportDto | null;
    return this.toModel(data);
  }

  toResolveDto(decision: ModerationDecision, reason: string): ResolveReportRequestDto {
    return { decision, reason };
  }

  /** `GET /admin/users` — mảng user + meta. */
  toUsersList(
    dto: AdminModerationUserListResponseDto | null | undefined
  ): PaginationResult<ModeratedUser> {
    const rawItems = pickField(dto, ['data'], null) as (ModeratedUserDto | null)[] | null;
    const items = safeArray<ModeratedUserDto | null, ModeratedUser>(rawItems, (item) => {
      const status = safeEnum(
        pickField(item, ['status'], 'ACTIVE'),
        MemberStatus,
        MemberStatus.ACTIVE
      );
      const role = safeString(pickField(item, ['role'], 'MEMBER'));
      return {
        id: safeString(pickField(item, ['id'], '')),
        email: safeString(pickField(item, ['email'], '')),
        displayName:
          safeString(pickField(item, ['displayName', 'display_name'], '')) || 'Người dùng',
        role,
        status,
        statusLabel: USER_STATUS_LABELS[status],
        isProtectedAdmin: pickField<boolean>(
          item,
          ['isProtectedAdmin', 'is_protected_admin'],
          role === 'ADMIN'
        ),
        reportCount: safeNumber(pickField(item, ['reportCount', 'report_count'], 0)),
        createdAt: safeDate(pickField(item, ['createdAt', 'created_at'], null)),
        updatedAt: safeDate(pickField(item, ['updatedAt', 'updated_at'], null)),
      };
    }).filter((user) => user.id.length > 0);
    const meta = pickField(dto, ['meta'], null) as AdminModerationUserListResponseDto['meta'];
    return {
      items,
      metadata: meta
        ? toPageMeta(meta, items.length)
        : { ...emptyPageMeta(), totalItems: items.length },
    };
  }

  /** `PATCH /admin/users/:id/status` → user sau đổi. */
  toSingleUser(dto: AdminModerationUserResponseDto | null | undefined): ModeratedUser {
    const data = pickField(dto, ['data'], null) as ModeratedUserDto | null;
    const status = safeEnum(
      pickField(data, ['status'], 'ACTIVE'),
      MemberStatus,
      MemberStatus.ACTIVE
    );
    const role = safeString(pickField(data, ['role'], 'MEMBER'));
    return {
      id: safeString(pickField(data, ['id'], '')),
      email: safeString(pickField(data, ['email'], '')),
      displayName: safeString(pickField(data, ['displayName', 'display_name'], '')) || 'Người dùng',
      role,
      status,
      statusLabel: USER_STATUS_LABELS[status],
      isProtectedAdmin: pickField<boolean>(
        data,
        ['isProtectedAdmin', 'is_protected_admin'],
        role === 'ADMIN'
      ),
      reportCount: safeNumber(pickField(data, ['reportCount', 'report_count'], 0)),
      createdAt: safeDate(pickField(data, ['createdAt', 'created_at'], null)),
      updatedAt: safeDate(pickField(data, ['updatedAt', 'updated_at'], null)),
    };
  }

  toUserStatusDto(status: MemberStatus, reason: string): UpdateUserStatusRequestDto {
    return { status, reason };
  }

  /** `GET /admin/comments` — mảng + meta. */
  toModCommentsList(
    dto: AdminModerationCommentListResponseDto | null | undefined
  ): PaginationResult<ModeratedComment> {
    const rawItems = pickField(dto, ['data'], null) as (ModeratedCommentDto | null)[] | null;
    const items = safeArray<ModeratedCommentDto | null, ModeratedComment>(rawItems, (item) =>
      this.toModComment(item)
    ).filter((comment) => comment.id.length > 0);
    const meta = pickField(dto, ['meta'], null) as AdminModerationCommentListResponseDto['meta'];
    return {
      items,
      metadata: meta
        ? toPageMeta(meta, items.length)
        : { ...emptyPageMeta(), totalItems: items.length },
    };
  }

  toModComment(dto: ModeratedCommentDto | null | undefined): ModeratedComment {
    const author = pickField(dto, ['author'], null) as ModeratedCommentDto['author'];
    const deletedAt = safeDate(pickField(dto, ['deletedAt', 'deleted_at'], null));
    return {
      id: safeString(pickField(dto, ['id'], '')),
      postId: safeString(pickField(dto, ['postId', 'post_id'], '')),
      postTitle: safeString(pickField(dto, ['postTitle'], '')),
      parentId: safeString(pickField(dto, ['parentId'], '')) || null,
      content: safeString(pickField(dto, ['content'], ''), '') || null,
      status: safeString(pickField(dto, ['status'], 'VISIBLE')),
      statusLabel:
        safeString(pickField(dto, ['status'], 'VISIBLE')) === 'HIDDEN' ? 'Đã ẩn' : 'Hiển thị',
      authorName:
        (author && typeof author === 'object'
          ? safeString((author as { displayName?: string }).displayName)
          : '') || 'Người dùng ẩn danh',
      hiddenReason: safeString(pickField(dto, ['hiddenReason', 'hidden_reason'], '')) || null,
      hiddenById: safeString(pickField(dto, ['hiddenById', 'hidden_by_id'], '')) || null,
      deletedAt,
      createdAt: safeDate(pickField(dto, ['createdAt', 'created_at'], null)),
      updatedAt: safeDate(pickField(dto, ['updatedAt', 'updated_at'], null)),
    };
  }

  /** `PATCH /admin/comments/:id/status` → comment sau đổi. */
  toSingleModComment(dto: AdminModerationCommentResponseDto | null | undefined): ModeratedComment {
    const data = pickField(dto, ['data'], null) as ModeratedCommentDto | null;
    return this.toModComment(data);
  }

  toCommentStatusDto(status: 'VISIBLE' | 'HIDDEN', reason: string): UpdateCommentStatusRequestDto {
    return { status, reason };
  }

  toAuditEntry(report: ModerationReport): AuditEntry | null {
    return report.resolution;
  }
}

export const moderationMapper = new ModerationMapper();
