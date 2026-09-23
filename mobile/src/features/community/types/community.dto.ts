export interface CommentAuthorDto {
  id?: string;
  displayName?: string;
  avatarUrl?: string | null;
}

export interface CommunityCommentDto {
  id?: string;
  postId?: string;
  parentId?: string | null;
  content?: string | null;
  status?: string;
  isPlaceholder?: boolean;
  author?: CommentAuthorDto | null;
  editedAt?: string | null;
  createdAt?: string;
  replies?: (CommunityCommentDto | null)[] | null;
}

export interface CommunityCommentListResponseDto {
  success?: boolean;
  data?: (CommunityCommentDto | null)[] | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  } | null;
}

export interface CommunityCommentResponseDto {
  success?: boolean;
  data?: CommunityCommentDto | null;
  meta?: null;
}

export interface CommunitySummaryResponseDto {
  success?: boolean;
  data?: {
    postId?: string;
    voteCount?: number | string;
    rating?: null;
    viewer?: {
      voted?: boolean;
      bookmarked?: boolean;
      rating?: null;
    } | null;
  } | null;
  meta?: null;
}

export interface CommunityVoteResponseDto {
  success?: boolean;
  data?: { postId?: string; voted?: boolean; voteCount?: number | string } | null;
  meta?: null;
}

export interface CommunityBookmarkResponseDto {
  success?: boolean;
  data?: { postId?: string; bookmarked?: boolean } | null;
  meta?: null;
}
