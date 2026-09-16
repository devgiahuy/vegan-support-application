export type PostStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'FLAGGED';
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
  status: PostStatus;
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
