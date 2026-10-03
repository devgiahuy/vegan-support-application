/** DTO lịch sử duyệt bài của tác giả — khớp OpenAPI backend (`GET /posts/:id/review-history`). */
export interface ReviewRevisionDto {
  id?: string;
  version?: number | string;
  status?: string;
  title?: string;
  excerpt?: string | null;
  tags?: (string | null)[];
  submittedAt?: string | null;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt?: string;
}

export interface ReviewModerationSignalDto {
  id?: string;
  provider?: string;
  model?: string;
  ruleVersion?: string;
  reasonCodes?: (string | null)[];
  riskScore?: number | string;
  riskLevel?: string;
  status?: string;
  createdAt?: string;
}

export interface ReviewHistoryEntryDto {
  revision?: ReviewRevisionDto | null;
  reviewedBy?: { id?: string; displayName?: string; avatarUrl?: string | null } | null;
  moderationSignals?: (ReviewModerationSignalDto | null)[] | null;
  isPublishedRevision?: boolean;
}

export interface ReviewHistoryResponseDto {
  success?: boolean;
  data?: {
    postId?: string;
    type?: string;
    postStatus?: string;
    version?: number | string;
    publishedRevisionId?: string | null;
    revisions?: (ReviewHistoryEntryDto | null)[] | null;
  } | null;
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number } | null;
}
