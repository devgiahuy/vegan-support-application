import { PostStatus } from '@/common/enums';
import type { PostAuthorModel, PostCategoryModel } from '@/features/post/types/post.model';

export interface CookingVideo {
  id: string;
  title: string;
  slug: string;
  status: PostStatus;
  statusLabel: string;
  version: number;
  author: PostAuthorModel;
  category: PostCategoryModel;
  thumbnailUrl: string;
  coverMedia: {
    publicId: string;
    secureUrl: string;
    mimeType: string;
    bytes: number;
    width?: number;
    height?: number;
  } | null;
  videoUrl: string;
  provider: string;
  durationSeconds: number | null;
  excerpt: string;
  summary: string;
  tags: string[];
  publishedAt: Date | null;
  formattedPublishedAt: string;
}

export interface VideoPaginationResult {
  items: CookingVideo[];
  metadata: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
