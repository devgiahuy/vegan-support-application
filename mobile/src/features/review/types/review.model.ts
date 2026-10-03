import type { PostStatus } from '@/common/enums';

/** Tín hiệu kiểm duyệt tự động — chỉ để tham khảo, không phải kết luận vi phạm. */
export interface ModerationSignal {
  id: string;
  riskLevelLabel: string;
  reasonCodes: string[];
  isOpen: boolean;
}

export interface ReviewRevision {
  id: string;
  version: number;
  status: PostStatus;
  statusLabel: string;
  title: string;
  /** Lý do/ghi chú của người duyệt (bắt buộc khi từ chối). */
  reviewNote: string | null;
  reviewerName: string | null;
  formattedSubmittedAt: string | null;
  formattedReviewedAt: string | null;
  formattedCreatedAt: string;
  isPublishedRevision: boolean;
  signals: ModerationSignal[];
}

export interface ReviewHistory {
  postId: string;
  postStatusLabel: string;
  revisions: ReviewRevision[];
  total: number;
}
