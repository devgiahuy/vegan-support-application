import type { CommentStatus } from '@/common/enums';

/** Tác giả bình luận (null = ẩn danh). */
export interface CommentAuthor {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

/** Bình luận dùng cho UI. `replies` chỉ populate ở tầng gốc. */
export interface CommunityComment {
  id: string;
  postId: string;
  /** null = bình luận gốc. */
  parentId: string | null;
  /** null khi `isPlaceholder` (bị mod xử lý). */
  content: string | null;
  status: CommentStatus;
  isPlaceholder: boolean;
  author: CommentAuthor | null;
  editedAt: Date | null;
  createdAt: Date | null;
  replies: CommunityComment[];
}

/** Tóm tắt cộng đồng 1 nguồn duy nhất. */
export interface CommunitySummary {
  postId: string;
  voteCount: number;
  ratingCount: number;
  tasteAverage: number | null;
  difficultyAverage: number | null;
  viewerVoted: boolean;
  viewerBookmarked: boolean;
  viewerTaste: number | null;
  viewerDifficulty: number | null;
}

/** Điểm của user + aggregate cộng đồng. */
export interface CommunityRating {
  postId: string;
  taste: number;
  difficulty: number;
  aggregateCount: number;
  aggregateTasteAverage: number | null;
  aggregateDifficultyAverage: number | null;
}

/** Item đã lưu dùng cho UI. */
export interface BookmarkedItem {
  postId: string;
  type: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  publishedAt: Date | null;
  bookmarkedAt: Date | null;
}

/** Tham số query thread/list. */
export interface CommunityQueryParams {
  page?: number;
  limit?: number;
  order?: 'newest' | 'oldest';
  type?: string;
}
