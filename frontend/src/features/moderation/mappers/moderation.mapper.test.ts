import { describe, expect, it } from 'vitest';
import { moderationMapper } from './moderation.mapper';
import type {
  AdminModerationCommentListResponseDto,
  AdminModerationUserListResponseDto,
  ModerationReportListResponseDto,
} from '../types/moderation.dto';
import { MemberStatus, ModerationDecision, ReportStatus, ReportTargetType } from '@/common/enums';

describe('ModerationMapper reports', () => {
  it('map báo cáo gộp + resolution audit', () => {
    const envelope: ModerationReportListResponseDto = {
      success: true,
      data: [
        {
          id: 'r1',
          targetId: 'p1',
          targetType: 'POST',
          targetTitle: 'Bài vi phạm',
          openCount: '3',
          reasons: ['Spam', null, ''],
          status: 'OPEN',
          priority: 'HIGH',
          reporterCount: 3,
          resolution: {
            decision: 'HIDE',
            reason: 'Spam link',
            resolvedBy: 'Admin',
            resolvedAt: '2026-09-16T10:00:00.000Z',
          },
        },
        null,
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    const result = moderationMapper.toReportsList(envelope);
    expect(result.items).toHaveLength(1);
    const report = result.items[0];
    expect(report.targetType).toBe(ReportTargetType.POST);
    expect(report.targetTypeLabel).toBe('Bài viết');
    expect(report.reasons).toEqual(['Spam']);
    expect(report.resolution?.decision).toBe(ModerationDecision.HIDE);
    expect(report.resolution?.decisionLabel).toBe('Ẩn nội dung');
    expect(result.metadata.totalItems).toBe(1);
  });

  it('decision lạ giữ nguyên qua fallback + envelope null', () => {
    const report = moderationMapper.toResolvedReport({
      success: true,
      data: { id: 'r', status: 'RESOLVED', resolution: { decision: 'MYSTERY' } },
      meta: null,
    });
    expect(report.status).toBe(ReportStatus.RESOLVED);
    // safeEnum fallback NO_VIOLATION khi mã lạ
    expect(report.resolution?.decision).toBe(ModerationDecision.NO_VIOLATION);
    expect(moderationMapper.toResolvedReport(null).id).toBe('');
  });

  it('toResolveDto chỉ gửi decision + reason', () => {
    expect(moderationMapper.toResolveDto(ModerationDecision.WARN, 'Nhắc nhở')).toEqual({
      decision: 'WARN',
      reason: 'Nhắc nhở',
    });
  });
});

describe('ModerationMapper users', () => {
  it('map user + protected + snake_case', () => {
    const envelope: AdminModerationUserListResponseDto = {
      success: true,
      data: [
        {
          id: 'u1',
          email: 'a@x.vn',
          display_name: 'An',
          role: 'MEMBER',
          status: 'BANNED',
          is_protected_admin: false,
          report_count: '2',
        },
        { id: 'u2', email: 'root@x.vn', status: 'ACTIVE', isProtectedAdmin: true },
      ],
      meta: { page: 1, limit: 10, total: 2, total_pages: 1 },
    };
    const result = moderationMapper.toUsersList(envelope);
    expect(result.items[0].status).toBe(MemberStatus.BANNED);
    expect(result.items[0].statusLabel).toBe('Đã cấm');
    expect(result.items[1].isProtectedAdmin).toBe(true);
    expect(result.items[1].displayName).toBe('Người dùng');
  });

  it('status lạ → ACTIVE, envelope null → defaults', () => {
    const user = moderationMapper.toSingleUser({
      success: true,
      data: { id: 'u', status: 'GHOST' },
      meta: null,
    });
    expect(user.status).toBe(MemberStatus.ACTIVE);
    expect(moderationMapper.toSingleUser(null).id).toBe('');
  });

  it('toUserStatusDto', () => {
    expect(moderationMapper.toUserStatusDto(MemberStatus.LOCKED, 'Spam')).toEqual({
      status: 'LOCKED',
      reason: 'Spam',
    });
  });
});

describe('ModerationMapper comments', () => {
  it('map comment + deletedAt non-null', () => {
    const envelope: AdminModerationCommentListResponseDto = {
      success: true,
      data: [
        {
          id: 'c1',
          postId: 'p1',
          postTitle: 'Bài X',
          content: 'Hay quá',
          status: 'HIDDEN',
          author: { id: 'u1', displayName: '' },
          hiddenReason: 'Spam',
          deletedAt: null,
        },
        { id: 'c2', content: null, status: 'DELETED', deleted_at: '2026-09-16T10:00:00.000Z' },
      ],
      meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
    };
    const result = moderationMapper.toModCommentsList(envelope);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].statusLabel).toBe('Đã ẩn');
    expect(result.items[0].authorName).toBe('Người dùng ẩn danh');
    expect(result.items[0].hiddenReason).toBe('Spam');
    expect(result.items[1].deletedAt).not.toBeNull();
    expect(result.items[1].content).toBeNull();
  });

  it('toCommentStatusDto', () => {
    expect(moderationMapper.toCommentStatusDto('HIDDEN', 'Vi phạm')).toEqual({
      status: 'HIDDEN',
      reason: 'Vi phạm',
    });
  });

  it('toAuditEntry trả resolution hoặc null', () => {
    const resolved = moderationMapper.toResolvedReport({
      success: true,
      data: { id: 'r', resolution: { decision: 'WARN', reason: 'Nhắc', resolvedBy: 'A' } },
      meta: null,
    });
    expect(moderationMapper.toAuditEntry(resolved)?.decisionLabel).toBe('Cảnh cáo');
    const open = moderationMapper.toResolvedReport({
      success: true,
      data: { id: 'r2' },
      meta: null,
    });
    expect(moderationMapper.toAuditEntry(open)).toBeNull();
  });

  it('target COMMENT + status lạ + priority mặc định', () => {
    const report = moderationMapper.toResolvedReport({
      success: true,
      data: { id: 'r', targetType: 'COMMENT', status: 'WEIRD', openCount: 0 },
      meta: null,
    });
    expect(report.targetTypeLabel).toBe('Bình luận');
    expect(report.status).toBe(ReportStatus.OPEN);
    expect(report.priority).toBe('MEDIUM');
    expect(report.reasons).toEqual([]);
  });

  it('user list lọc rỗng + meta thiếu', () => {
    const result = moderationMapper.toUsersList({ success: true, data: [{ id: '' }], meta: null });
    expect(result.items).toEqual([]);
    expect(result.metadata.totalItems).toBe(0);
  });

  it('comment VISIBLE label + author có tên', () => {
    const comment = moderationMapper.toSingleModComment({
      success: true,
      data: { id: 'c', status: 'VISIBLE', author: { displayName: 'Bình' } },
      meta: null,
    });
    expect(comment.statusLabel).toBe('Hiển thị');
    expect(comment.authorName).toBe('Bình');
    expect(comment.deletedAt).toBeNull();
  });
});
