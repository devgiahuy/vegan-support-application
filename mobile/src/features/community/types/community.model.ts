import type { CommentStatus } from '@/common/enums';

export interface CommentAuthor {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface CommunityComment {
  id: string;
  postId: string;
  parentId: string | null;
  content: string | null;
  status: CommentStatus;
  isPlaceholder: boolean;
  author: CommentAuthor | null;
  editedAt: Date | null;
  createdAt: Date | null;
  replies: CommunityComment[];
}

/** Điểm đánh giá khẩu vị/độ khó — chỉ áp dụng cho công thức (Recipe), backend từ chối loại khác. */
export interface RatingAggregate {
  count: number;
  tasteAverage: number | null;
  difficultyAverage: number | null;
}

export interface CurrentRating {
  taste: number;
  difficulty: number;
}

export interface CommunitySummary {
  postId: string;
  voteCount: number;
  viewerVoted: boolean;
  viewerBookmarked: boolean;
  /** `null` khi bài không phải Recipe hoặc chưa có lượt đánh giá nào. */
  rating: RatingAggregate | null;
  viewerRating: CurrentRating | null;
}

export interface CommunityQueryParams {
  page?: number;
  limit?: number;
  order?: 'newest' | 'oldest';
}

/** 1 mục trong danh sách "Đã lưu" (`GET /users/me/bookmarks`) — chỉ Recipe/Video. */
export interface BookmarkedItem {
  postId: string;
  type: 'RECIPE' | 'VIDEO';
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  publishedAt: Date | null;
  bookmarkedAt: Date | null;
}
