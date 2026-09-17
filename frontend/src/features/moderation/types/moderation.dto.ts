/**
 * DTO moderation-admin: reports, users, comments.
 * Theo `docs/api/moderation-admin.md` (backend PLANNED — DTO viết đủ để nối live sau).
 * Envelope `{success, data, meta}` dùng trực tiếp khi nối live.
 */

/** Báo cáo gộp theo mục tiêu (thô). */
export interface ModerationReportDto {
  id?: string;
  targetId?: string;
  target_id?: string;
  targetType?: string;
  target_type?: string;
  targetTitle?: string;
  target_title?: string;
  targetExcerpt?: string | null;
  details?: string | null;
  openCount?: number | string;
  open_count?: number | string;
  activeReporterCount?: number | string;
  active_reporter_count?: number | string;
  reasons?: (string | null)[] | null;
  reasonCode?: string | null;
  reason_code?: string | null;
  status?: string;
  priority?: string;
  reporterCount?: number | string;
  reporter_count?: number | string;
  createdAt?: string;
  created_at?: string;
  resolvedAt?: string | null;
  resolved_at?: string | null;
  resolvedDecision?: string | null;
  resolved_decision?: string | null;
  resolvedReason?: string | null;
  resolved_reason?: string | null;
  resolvedById?: string | null;
  resolved_by_id?: string | null;
  resolution?: {
    decision?: string;
    reason?: string | null;
    resolvedBy?: string | null;
    resolved_by?: string | null;
    resolvedAt?: string | null;
  } | null;
}

/** `GET /admin/reports` → mảng gộp + meta. */
export interface ModerationReportListResponseDto {
  success?: boolean;
  data?: (ModerationReportDto | null)[] | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    total_pages?: number;
  } | null;
}

/** `PATCH /admin/reports/:id/resolve` — `decision` + `reason` bắt buộc. */
export interface ResolveReportRequestDto {
  decision: string;
  reason: string;
}

/** `PATCH /admin/reports/:id/resolve` → báo cáo đã resolve + audit. */
export interface ModerationReportResponseDto {
  success?: boolean;
  data?: ModerationReportDto | null;
  meta?: null;
}

/** Tài khoản dưới góc admin (thô). */
export interface ModeratedUserDto {
  id?: string;
  email?: string;
  displayName?: string;
  display_name?: string;
  role?: string;
  status?: string;
  isProtectedAdmin?: boolean;
  is_protected_admin?: boolean;
  reportCount?: number | string;
  report_count?: number | string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

/** `GET /admin/users` → mảng + meta. */
export interface AdminModerationUserListResponseDto {
  success?: boolean;
  data?: (ModeratedUserDto | null)[] | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    total_pages?: number;
  } | null;
}

/** `PATCH /admin/users/:id/status` — `status` + `reason` bắt buộc. */
export interface UpdateUserStatusRequestDto {
  status: string;
  reason: string;
}

/** `PATCH /admin/users/:id/status` → user sau đổi. */
export interface AdminModerationUserResponseDto {
  success?: boolean;
  data?: ModeratedUserDto | null;
  meta?: null;
}

/** Bình luận kiểm duyệt (thô). */
export interface ModeratedCommentDto {
  id?: string;
  postId?: string;
  post_id?: string;
  postTitle?: string;
  parentId?: string | null;
  content?: string | null;
  status?: string;
  author?: { id?: string; displayName?: string; avatarUrl?: string | null } | null;
  hiddenReason?: string | null;
  hidden_reason?: string | null;
  hiddenById?: string | null;
  hidden_by_id?: string | null;
  deletedAt?: string | null;
  deleted_at?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

/** `GET /admin/comments` → mảng + meta. */
export interface AdminModerationCommentListResponseDto {
  success?: boolean;
  data?: (ModeratedCommentDto | null)[] | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    total_pages?: number;
  } | null;
}

/** `PATCH /admin/comments/:id/status` — `status` + `reason` bắt buộc. */
export interface UpdateCommentStatusRequestDto {
  status: string;
  reason: string;
}

/** `PATCH /admin/comments/:id/status` → comment sau đổi. */
export interface AdminModerationCommentResponseDto {
  success?: boolean;
  data?: ModeratedCommentDto | null;
  meta?: null;
}
