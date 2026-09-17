/**
 * DTO cộng đồng: comments, vote/summary, rating, bookmark.
 * Theo `docs/api/community.md` (backend PLANNED — DTO viết đủ để nối live sau).
 * Envelope `{success, data, meta}` dùng trực tiếp khi nối live.
 */

/** Tác giả bình luận (null = ẩn danh). */
export interface CommentAuthorDto {
  id?: string;
  displayName?: string;
  display_name?: string;
  avatarUrl?: string | null;
  avatar_url?: string | null;
}

/** Bình luận thô (reply cùng shape, tối đa 1 tầng). */
export interface CommunityCommentDto {
  id?: string;
  postId?: string;
  post_id?: string;
  parentId?: string | null;
  parent_id?: string | null;
  content?: string | null;
  status?: string;
  isPlaceholder?: boolean;
  is_placeholder?: boolean;
  author?: CommentAuthorDto | null;
  editedAt?: string | null;
  edited_at?: string | null;
  createdAt?: string;
  created_at?: string;
  replies?: (CommunityCommentDto | null)[] | null;
}

/** `GET /posts/:id/comments` → thread + meta. */
export interface CommunityCommentListResponseDto {
  success?: boolean;
  data?: (CommunityCommentDto | null)[] | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    total_pages?: number;
  } | null;
}

/** `POST /posts/:id/comments` — reply một tầng qua `parentId` (UUID root). */
export interface CreateCommentRequestDto {
  content: string;
  parentId?: string;
}

/** `PATCH /comments/:id` — chủ sở hữu sửa. */
export interface UpdateCommentRequestDto {
  content: string;
}

/** `POST/PATCH/DELETE /comments/*` → 1 bình luận. */
export interface CommunityCommentResponseDto {
  success?: boolean;
  data?: CommunityCommentDto | null;
  meta?: null;
}

/** `GET /posts/:id/community-summary` → aggregate + viewer (null cho guest). */
export interface CommunitySummaryResponseDto {
  success?: boolean;
  data?: {
    postId?: string;
    voteCount?: number | string;
    vote_count?: number | string;
    rating?: {
      count?: number | string;
      tasteAverage?: number | string | null;
      difficultyAverage?: number | string | null;
    } | null;
    viewer?: {
      voted?: boolean;
      bookmarked?: boolean;
      rating?: { taste?: number | string; difficulty?: number | string } | null;
    } | null;
  } | null;
  meta?: null;
}

/** `PUT/DELETE /posts/:id/vote` → idempotent cả 2 chiều. */
export interface CommunityVoteResponseDto {
  success?: boolean;
  data?: { postId?: string; voted?: boolean; voteCount?: number | string } | null;
  meta?: null;
}

/** `PUT /posts/:id/rating` — recipe only, `taste` + `difficulty` bắt buộc. */
export interface CommunityRatingRequestDto {
  taste: number;
  difficulty: number;
}

/** `PUT /posts/:id/rating` → điểm user + aggregate. */
export interface CommunityRatingResponseDto {
  success?: boolean;
  data?: {
    postId?: string;
    rating?: { taste?: number | string; difficulty?: number | string } | null;
    aggregate?: {
      count?: number | string;
      tasteAverage?: number | string | null;
      difficultyAverage?: number | string | null;
    } | null;
  } | null;
  meta?: null;
}

/** `PUT/DELETE /posts/:id/bookmark` — recipe/video only. */
export interface CommunityBookmarkResponseDto {
  success?: boolean;
  data?: { postId?: string; bookmarked?: boolean } | null;
  meta?: null;
}

/** Item danh sách đã lưu (thô). */
export interface BookmarkedItemDto {
  postId?: string;
  type?: string;
  slug?: string;
  title?: string;
  excerpt?: string | null;
  coverImageUrl?: string | null;
  publishedAt?: string;
  published_at?: string;
  bookmarkedAt?: string;
  bookmarked_at?: string;
}

/** `GET /users/me/bookmarks` → list + meta. */
export interface CommunityBookmarkListResponseDto {
  success?: boolean;
  data?: (BookmarkedItemDto | null)[] | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    total_pages?: number;
  } | null;
}
