/**
 * Data Transfer Objects (DTO) cho phân hệ Content Review (Phase 16)
 * Bám sát OpenAPI schema từ:
 * - docs/api/content-review.md
 * - docs/api/content-review-admin.md
 * Mọi trường đều có thể undefined để mapper an toàn (null-safe).
 */

export interface ReviewAuthorDto {
  id?: string;
  displayName?: string;
  role?: string;
  contributorType?: string | null;
  contributorApprovalBasis?: string | null;
}

export interface AdminAiFlagDto {
  id?: string;
  provider?: string;
  model?: string;
  ruleVersion?: string;
  reasonCodes?: string[];
  riskScore?: number;
  riskLevel?: string;
  status?: string;
  createdAt?: string;
}

export interface ReviewCategoryDto {
  id?: string;
  name?: string;
  slug?: string;
}

export interface ReviewMediaDto {
  id?: string;
  url?: string;
  type?: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export interface ReviewRecipeIngredientDto {
  name?: string;
  amount?: number;
  unit?: string;
  notes?: string;
}

export interface ReviewRecipeInstructionDto {
  stepNumber?: number;
  description?: string;
  image?: string;
}

export interface ReviewRecipeDto {
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings?: number;
  difficulty?: string;
  ingredients?: ReviewRecipeIngredientDto[];
  instructions?: ReviewRecipeInstructionDto[];
}

export interface ReviewVideoDto {
  source?: string; // "UPLOAD" | "YOUTUBE"
  externalUrl?: string | null;
  durationSeconds?: number | null;
  mediaAssetId?: string | null;
}

// ==========================================
// 1. Admin Review Queue (GET /admin/content-review)
// ==========================================

export interface ReviewQueueItemDto {
  postId?: string;
  type?: string; // "RECIPE" | "BLOG" | "VIDEO"
  slug?: string;
  postStatus?: string;
  status?: string; // alias
  revisionId?: string;
  revisionVersion?: number;
  revisionStatus?: string;
  title?: string;
  excerpt?: string | null;
  author?: ReviewAuthorDto | null;
  aiFlags?: AdminAiFlagDto[];
  priority?: string; // "NORMAL" | "HIGH"
  activeReporterCount?: number;
  canDecide?: boolean;
  submittedAt?: string | null;
  createdAt?: string;
}

export interface ReviewQueueListResponseDto {
  success: boolean;
  data: ReviewQueueItemDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==========================================
// 2. Admin Review Detail (GET /admin/content-review/:id)
// ==========================================

export interface AdminContentReviewDetailDto {
  postId?: string;
  type?: string;
  slug?: string;
  postStatus?: string;
  revisionId?: string;
  revisionVersion?: number;
  revisionStatus?: string;
  title?: string;
  excerpt?: string | null;
  author?: ReviewAuthorDto | null;
  aiFlags?: AdminAiFlagDto[];
  priority?: string;
  activeReporterCount?: number;
  canDecide?: boolean;
  submittedAt?: string | null;
  createdAt?: string;
  body?: string;
  tags?: string[];
  categories?: ReviewCategoryDto[];
  media?: ReviewMediaDto[];
  reviewNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  isPublishedRevision?: boolean;
  recipe?: ReviewRecipeDto | null;
  video?: ReviewVideoDto | null;
}

export interface AdminContentReviewDetailResponseDto {
  success: boolean;
  data: AdminContentReviewDetailDto;
  meta: Record<string, unknown>;
}

// ==========================================
// 3. Admin Decision (PATCH /admin/content-review/:id)
// ==========================================

export interface AdminContentReviewDecisionRequestDto {
  decision: 'APPROVE' | 'REJECT';
  reason: string;
}

// ==========================================
// 4. Author Submit (POST /posts/:id/submit)
// ==========================================

export interface SubmitPostRequestDto {
  revisionId: string;
  expectedVersion: number;
}

// ==========================================
// 5. Review History (GET /posts/:id/review-history)
// ==========================================

export interface ContentReviewHistoryItemDto {
  revisionId?: string;
  revisionVersion?: number;
  revisionStatus?: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  reviewNote?: string | null;
}

export interface ContentReviewHistoryDataDto {
  postId?: string;
  type?: string;
  postStatus?: string;
  version?: number;
  publishedRevisionId?: string | null;
  revisions?: ContentReviewHistoryItemDto[];
}

export interface ContentReviewHistoryResponseDto {
  success: boolean;
  data: ContentReviewHistoryDataDto;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
