import { PostStatus, VideoSource } from '@/common/enums';
import { PostAuthorModel, PostCategoryModel } from '@/features/post/types/post.model';
import { RecipeIngredient, RecipeStep } from '@/features/recipe/types/recipe.model';

export interface Video {
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
  /** Metadata ảnh bìa để ráp `media[]` khi tạo/sửa. */
  coverMedia?: {
    publicId?: string;
    mimeType?: string;
    bytes?: number;
  } | null;
  videoUrl: string;
  videoSource: VideoSource;
  /** Metadata video Cloudinary để ráp `media[]` khi tạo/sửa (YouTube không cần). */
  videoMedia?: {
    publicId?: string;
    mimeType?: string;
    bytes?: number;
  } | null;
  durationSeconds: number;
  formattedDuration: string; // '05:30'
  description: string;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  publishedAt: Date | null;
  formattedPublishedAt: string;
  stats: {
    views: number;
    likes: number;
    comments: number;
  };
}

// -----------------------------------------------------------------------------
// Legacy Mock Compatibility Types
// -----------------------------------------------------------------------------
export interface VideoTimestampStep {
  timeSeconds: number;
  timeLabel: string;
  title: string;
  desc: string;
}

export interface VideoAiSummary {
  dishName: string;
  summaryText: string;
  confidenceScore: number;
  detectedIngredients: string[];
  timelineSteps: VideoTimestampStep[];
}

export interface VideoAuthor {
  name: string;
  avatar: string;
  verified?: boolean;
  roleBadge?: string;
}

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  durationLabel: string;
  durationSeconds: number;
  views: number;
  likes: number;
  uploadedAt: string;
  dietSchool?: string;
  category: string;
  author: VideoAuthor;
  aiSummary?: VideoAiSummary;
}
