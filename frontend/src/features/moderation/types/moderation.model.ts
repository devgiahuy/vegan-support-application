import type {
  MemberStatus,
  ModerationDecision,
  ReportStatus,
  ReportTargetType,
} from '@/common/enums';

/** Báo cáo gộp theo mục tiêu dùng cho UI. */
export interface ModerationReport {
  id: string;
  targetId: string;
  targetType: ReportTargetType;
  targetTypeLabel: string;
  targetTitle: string;
  targetExcerpt: string;
  openCount: number;
  reasons: string[];
  status: ReportStatus;
  statusLabel: string;
  priority: string;
  reporterCount: number;
  createdAt: Date | null;
  resolvedAt: Date | null;
  resolution: AuditEntry | null;
}

/** Tài khoản dưới góc admin. */
export interface ModeratedUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: MemberStatus;
  statusLabel: string;
  /** true → disable mọi nút đổi trạng thái (kể cả chính admin). */
  isProtectedAdmin: boolean;
  reportCount: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** Bình luận kiểm duyệt. */
export interface ModeratedComment {
  id: string;
  postId: string;
  postTitle: string;
  parentId: string | null;
  content: string | null;
  status: string;
  statusLabel: string;
  authorName: string;
  hiddenReason: string | null;
  hiddenById: string | null;
  /** non-null → tác giả đã xóa, không thao tác được. */
  deletedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/** Ghi kiểm toán quyết định. */
export interface AuditEntry {
  targetId: string;
  decision: ModerationDecision;
  decisionLabel: string;
  reason: string;
  resolvedBy: string;
  resolvedAt: Date | null;
}

/** Tham số query các bảng kiểm duyệt. */
export interface ModerationQueryParams {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  targetType?: string;
  role?: string;
  q?: string;
  postId?: string;
  authorId?: string;
}
