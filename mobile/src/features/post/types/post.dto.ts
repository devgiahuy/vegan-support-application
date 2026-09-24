/**
 * DTO nền tảng cho Content & Media, bám sát backend `content.schemas.ts`
 * (đồng bộ `frontend/src/features/post/types/post.dto.ts`). Dùng chung cho
 * `features/recipe` và `features/post` (Cẩm nang). Mọi field optional để mapper null-safe.
 */

export interface PostAuthorDto {
  id?: string;
  displayName?: string;
  avatarUrl?: string | null;
}

export interface PostCategorySummaryDto {
  id?: string;
  name?: string;
  slug?: string;
  type?: string;
}

export interface PostMediaDto {
  id?: string;
  kind?: string;
  provider?: string;
  publicId?: string | null;
  secureUrl?: string;
  mimeType?: string | null;
  bytes?: number | null;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
}

export interface PostRevisionDto {
  id?: string;
  version?: number;
  status?: string;
  title?: string;
  excerpt?: string | null;
  body?: string;
  tags?: string[];
  createdAt?: string;
}

export interface BasePostDto {
  id?: string;
  author?: PostAuthorDto | null;
  slug?: string;
  status?: string;
  version?: number;
  publishedRevisionVersion?: number | null;
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  revision?: PostRevisionDto | null;
  categories?: PostCategorySummaryDto[] | null;
  media?: PostMediaDto[] | null;
  type?: string;
}

export interface PostListResponseDto {
  success: boolean;
  data: BasePostDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** `GET /posts/:idOrSlug` → 1 bài viết. */
export interface PostDetailResponseDto {
  success?: boolean;
  data?: BasePostDto | null;
  meta?: null;
}

/** `GET /posts/:id/related` → gộp theo loại; Cẩm nang chỉ dùng `blogs`. */
export interface RelatedPostsResponseDto {
  success?: boolean;
  data?: { recipes?: BasePostDto[]; blogs?: BasePostDto[]; videos?: BasePostDto[] } | null;
  meta?: { rankingVersion?: string; limitPerType?: number } | null;
}
