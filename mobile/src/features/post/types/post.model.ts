import { PostStatus } from '@/common/enums';

export interface PostAuthorModel {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface PostCategoryModel {
  id: string;
  name: string;
}

/** Domain Model cho bài viết Cẩm nang (đọc — chưa gồm create/update/related). */
export interface Article {
  id: string;
  title: string;
  slug: string;
  status: PostStatus;
  statusLabel: string;
  version: number;
  author: PostAuthorModel;
  category: PostCategoryModel;
  coverImageUrl: string;
  excerpt: string;
  content: string;
  tags: string[];
  readingTimeMinutes: number;
  publishedAt: Date | null;
  formattedPublishedAt: string;
  stats: {
    views: number;
    likes: number;
    comments: number;
  };
}
