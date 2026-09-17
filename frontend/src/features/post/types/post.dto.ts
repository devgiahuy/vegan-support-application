/**
 * DTO cho Content & Media bám sát backend `content.schemas.ts`
 * (`postSchema`, `postListResponseSchema`, `relatedPostsResponseSchema`,
 * `uploadSignatureResponseSchema`). Mọi field optional để mapper null-safe.
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

export interface BlogDetailDto extends BasePostDto {
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

export interface PostDetailResponseDto {
  success: boolean;
  data: BasePostDto;
  meta?: null;
}

export interface RelatedPostsResponseDto {
  success: boolean;
  data: {
    recipes?: BasePostDto[];
    blogs?: BasePostDto[];
    videos?: BasePostDto[];
  };
  meta?: {
    rankingVersion?: string;
    limitPerType?: number;
  } | null;
}

export interface UploadSignatureResponseDto {
  cloudName: string;
  apiKey: string;
  resourceType: 'image' | 'video';
  uploadUrl: string;
  timestamp: number;
  signature: string;
  folder: string;
  maxBytes: number;
  allowedMimeTypes: string[];
  expiresAt: string;
}

/** Media input khi tạo/sửa post (`mediaInputSchema` backend). */
export interface MediaInputDto {
  provider: string;
  kind: string;
  publicId?: string;
  secureUrl: string;
  mimeType?: string;
  bytes?: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
}

export interface CreatePostRequestDto {
  type: string;
  title: string;
  slug?: string;
  excerpt?: string;
  categoryIds: string[];
  tags?: string[];
  media: MediaInputDto[];
  body: string;
}

export interface UpdatePostRequestDto extends Partial<CreatePostRequestDto> {
  expectedVersion: number;
}
