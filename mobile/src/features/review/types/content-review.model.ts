import type { PostStatus, PostType } from '@/common/enums';

export type ContentReviewDecision = 'APPROVE' | 'REJECT';
export type ContentReviewPriority = 'NORMAL' | 'HIGH';
export type ContentReviewQueueStatus = 'PENDING_REVIEW' | 'FLAGGED' | 'QUARANTINED';

export const MIN_REVIEW_REASON_LENGTH = 10;
export const MAX_REVIEW_REASON_LENGTH = 1000;

/** Tín hiệu AI — chỉ hỗ trợ đánh giá, không phải kết luận vi phạm. */
export interface ContentReviewAiFlag {
  id: string;
  provider: string;
  model: string;
  reasonCodes: string[];
  riskLevelLabel: string;
  isOpen: boolean;
}

export interface ContentReviewQueueItem {
  postId: string;
  revisionId: string;
  revisionVersion: number;
  type: PostType;
  typeLabel: string;
  title: string;
  excerpt: string;
  authorId: string;
  authorName: string;
  /** Chỉ có khi tác giả không phải Member (CONTRIBUTOR/ADMIN). */
  authorRoleLabel: string | null;
  postStatus: PostStatus;
  postStatusLabel: string;
  priority: ContentReviewPriority;
  priorityLabel: string;
  isHighPriority: boolean;
  aiFlagCount: number;
  reportCount: number;
  canDecide: boolean;
  formattedSubmittedAt: string;
  formattedCreatedAt: string;
}

export interface ContentReviewMedia {
  id: string;
  kind: 'COVER_IMAGE' | 'VIDEO';
  url: string;
}

export interface ContentReviewDetail extends ContentReviewQueueItem {
  body: string;
  tags: string[];
  categories: string[];
  coverUrl: string | null;
  /** Liên kết video (YouTube/Cloudinary) khi bài là Video. */
  videoUrl: string | null;
  aiFlags: ContentReviewAiFlag[];
  reviewNote: string | null;
  reviewerName: string | null;
  formattedReviewedAt: string | null;
  isPublishedRevision: boolean;
}

export interface ContentReviewQueueQuery {
  page?: number;
  limit?: number;
  status?: ContentReviewQueueStatus;
  type?: PostType;
  priority?: ContentReviewPriority;
}

export interface ContentReviewQueuePage {
  items: ContentReviewQueueItem[];
  page: number;
  totalPages: number;
  totalItems: number;
}
