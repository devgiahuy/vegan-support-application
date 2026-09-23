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

export interface CommunitySummary {
  postId: string;
  voteCount: number;
  viewerVoted: boolean;
  viewerBookmarked: boolean;
}

export interface CommunityQueryParams {
  page?: number;
  limit?: number;
  order?: 'newest' | 'oldest';
}
