/**
 * DTO hàng chờ kiểm duyệt nội dung cho Admin/Contributor (đồng bộ backend `ReviewQueueListResponse`,
 * `AdminContentReviewDetailResponse`, `AdminContentReviewDecisionRequest`). Mọi field optional để mapper null-safe.
 */
export interface ContentReviewAuthorDto {
  id?: string;
  displayName?: string;
  role?: string;
  contributorApprovalBasis?: string | null;
}

export interface ContentReviewAiFlagDto {
  id?: string;
  provider?: string;
  model?: string;
  reasonCodes?: (string | null)[] | null;
  riskScore?: number;
  riskLevel?: string;
  status?: string;
  createdAt?: string;
}

export interface ContentReviewQueueItemDto {
  postId?: string;
  type?: string;
  slug?: string;
  postStatus?: string;
  revisionId?: string;
  revisionVersion?: number;
  revisionStatus?: string;
  title?: string;
  excerpt?: string | null;
  author?: ContentReviewAuthorDto | null;
  aiFlags?: (ContentReviewAiFlagDto | null)[] | null;
  priority?: string;
  activeReporterCount?: number;
  canDecide?: boolean;
  submittedAt?: string | null;
  createdAt?: string;
}

export interface ContentReviewQueueResponseDto {
  success?: boolean;
  data?: (ContentReviewQueueItemDto | null)[] | null;
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number } | null;
}

export interface ContentReviewMediaDto {
  id?: string;
  kind?: string;
  provider?: string;
  secureUrl?: string;
  mimeType?: string | null;
  durationSeconds?: number | null;
}

export interface ContentReviewDetailDto extends ContentReviewQueueItemDto {
  body?: string;
  tags?: (string | null)[] | null;
  categories?: ({ id?: string; name?: string; slug?: string } | null)[] | null;
  media?: (ContentReviewMediaDto | null)[] | null;
  reviewNote?: string | null;
  reviewedBy?: ContentReviewAuthorDto | null;
  reviewedAt?: string | null;
  isPublishedRevision?: boolean;
}

export interface ContentReviewDetailResponseDto {
  success?: boolean;
  data?: ContentReviewDetailDto | null;
}

/** `PATCH /admin/content-review/:id` — lý do bắt buộc 10–2000 ký tự cho cả duyệt lẫn từ chối. */
export interface ContentReviewDecisionRequestDto {
  decision: 'APPROVE' | 'REJECT';
  reason: string;
}
