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

export interface RatingAggregateDto {
  count?: number;
  tasteAverage?: number | null;
  difficultyAverage?: number | null;
}

export interface CurrentRatingDto {
  taste?: number;
  difficulty?: number;
}

export interface CommunitySummaryResponseDto {
  success?: boolean;
  data?: {
    postId?: string;
    voteCount?: number | string;
    rating?: RatingAggregateDto | null;
    viewer?: {
      voted?: boolean;
      bookmarked?: boolean;
      rating?: CurrentRatingDto | null;
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

/** `PUT /posts/:id/rating` → `RatingResponse`. Chỉ Recipe. */
export interface CommunityRatingResponseDto {
  success?: boolean;
  data?: {
    postId?: string;
    rating?: CurrentRatingDto | null;
    aggregate?: RatingAggregateDto | null;
  } | null;
  meta?: null;
}

/** 1 mục thô trong `GET /users/me/bookmarks`. */
export interface BookmarkedItemDto {
  postId?: string;
  type?: string;
  slug?: string;
  title?: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  publishedAt?: string | null;
  bookmarkedAt?: string | null;
}

export interface BookmarkListResponseDto {
  success?: boolean;
  data?: (BookmarkedItemDto | null)[] | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  } | null;
}
