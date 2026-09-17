import { PostStatus as CommonPostStatus } from '@/common/enums';

export type PostStatus =
  | CommonPostStatus
  | 'DRAFT'
  | 'PENDING'
  | 'PENDING_REVIEW'
  | 'PUBLISHED'
  | 'FLAGGED'
  | 'ARCHIVED'
  | 'REJECTED';

export interface PostAuthorModel {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface PostCategoryModel {
  id: string;
  name: string;
}

export interface RelatedItem {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string;
  type: string;
  difficulty?: string;
  excerpt?: string;
  videoUrl?: string;
  durationSeconds?: number;
}

/** Nhóm nội dung liên quan theo contract `GET /posts/:id/related`. */
export interface RelatedGroup {
  recipes: RelatedItem[];
  blogs: RelatedItem[];
  videos: RelatedItem[];
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  status: PostStatus;
  statusLabel: string;
  /** Version optimistic-concurrency của backend (dùng cho update/delete). */
  version: number;
  author: PostAuthorModel;
  category: PostCategoryModel;
  coverImageUrl: string;
  /** Metadata ảnh bìa để ráp `media[]` khi tạo/sửa (backend yêu cầu publicId/bytes/mime). */
  coverMedia?: {
    publicId?: string;
    mimeType?: string;
    bytes?: number;
  } | null;
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

// -----------------------------------------------------------------------------
// Legacy Compatibility Types (giữ để PostCard/PostDetailView tương thích dần
// sang Article chuẩn; không còn store mock nào dùng các type này)
// -----------------------------------------------------------------------------
export type AuthorRole = 'NUTRITION_EXPERT' | 'EXPERIENCED_COOK' | 'AUTHORIZED_USER' | 'ADMIN';
export type DietSchool = 'PHAT_GIAO' | 'DAO_GIAO' | 'THUAN_CHAY' | 'ALL';

export interface PostAuthor {
  id: string;
  name: string;
  avatar: string;
  role: AuthorRole;
  roleTitle: string;
  verified?: boolean;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  summary: string;
  contentMarkdown: string;
  coverImage: string;
  category: string;
  dietSchool?: DietSchool;
  tags: string[];
  status: PostStatus | 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'FLAGGED';
  statusLabel?: string;
  moderationReason?: string;
  author: PostAuthor;
  readingMinutes: number;
  publishedAt: string;
  updatedAt?: string;
  views: number;
  score: number;
  commentCount: number;
  saved?: boolean;
}
