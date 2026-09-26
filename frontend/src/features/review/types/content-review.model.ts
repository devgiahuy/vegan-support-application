import { PostType, ModerationPriority, ReviewItemStatus } from '@/common/enums';

export enum ReviewDecisionEnum {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export enum PostReviewStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',
  QUARANTINED = 'QUARANTINED',
  HIDDEN = 'HIDDEN',
  DELETED = 'DELETED',
}

export interface ReviewAuthorModel {
  id: string;
  displayName: string;
  name?: string; // alias thuận tiện
  role: string;
  contributorApprovalBasis: string | null;
}

export interface AiFlagModel {
  id: string;
  provider: string;
  model: string;
  reasonCodes: string[];
  riskScore: number;
  riskLevel: string;
  status: string;
  createdAt: Date | null;
}

export interface ReviewCategoryModel {
  id: string;
  name: string;
  slug: string;
}

export interface ReviewMediaModel {
  id: string;
  url: string;
  type: string;
  width?: number;
  height?: number;
  bytes?: number;
}

export interface ReviewRecipeIngredientModel {
  name: string;
  amount: number;
  unit: string;
  notes?: string;
}

export interface ReviewRecipeInstructionModel {
  stepNumber: number;
  description: string;
  image?: string;
}

export interface ReviewRecipeModel {
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: string;
  ingredients: ReviewRecipeIngredientModel[];
  instructions: ReviewRecipeInstructionModel[];
}

export interface ReviewVideoModel {
  source: 'UPLOAD' | 'YOUTUBE';
  externalUrl: string | null;
  durationSeconds: number | null;
  mediaAssetId: string | null;
  videoPlayerUrl: string;
  durationFormatted: string;
}

// ==========================================
// 1. Admin Review Queue Item Model
// ==========================================

export interface ContentReviewQueueItem {
  postId: string;
  type: PostType;
  typeLabel: string;
  slug: string;
  title: string;
  excerpt: string;
  postStatus: PostReviewStatus;
  postStatusLabel: string;
  status: PostReviewStatus; // alias
  statusLabel: string; // alias
  revisionId: string;
  revisionVersion: number;
  revisionStatus: PostReviewStatus;
  author: ReviewAuthorModel;
  aiFlags: AiFlagModel[];
  aiFlagsCount: number;
  hasAiFlags: boolean;
  priority: ModerationPriority;
  priorityLabel: string;
  isHighPriority: boolean;
  activeReporterCount: number;
  hasReports: boolean;
  canDecide: boolean;
  submittedAt: Date | null;
  formattedSubmittedAt: string;
  createdAt: Date | null;
  formattedCreatedAt: string;
}

export interface ReviewQueueQueryParams {
  page?: number;
  limit?: number;
  status?: PostReviewStatus | ReviewItemStatus;
  type?: PostType;
  priority?: ModerationPriority;
}

// ==========================================
// 2. Admin Content Review Detail Model
// ==========================================

export interface AdminContentReviewDetailModel {
  postId: string;
  type: PostType;
  typeLabel: string;
  slug: string;
  title: string;
  excerpt: string;
  postStatus: PostReviewStatus;
  postStatusLabel: string;
  revisionId: string;
  revisionVersion: number;
  revisionStatus: PostReviewStatus;
  author: ReviewAuthorModel;
  aiFlags: AiFlagModel[];
  hasAiFlags: boolean;
  priority: ModerationPriority;
  isHighPriority: boolean;
  activeReporterCount: number;
  canDecide: boolean;
  submittedAt: Date | null;
  formattedSubmittedAt: string;
  createdAt: Date | null;
  formattedCreatedAt: string;
  body: string;
  tags: string[];
  categories: ReviewCategoryModel[];
  media: ReviewMediaModel[];
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  formattedReviewedAt: string;
  isPublishedRevision: boolean;
  recipe?: ReviewRecipeModel;
  video?: ReviewVideoModel;
}

// ==========================================
// 3. Author Submit Input Model
// ==========================================

export interface SubmitPostInput {
  revisionId: string;
  expectedVersion: number;
  note?: string;
}

// ==========================================
// 4. Author Review History Timeline Models
// ==========================================

export interface ContentReviewHistoryTimelineItem {
  revisionId: string;
  revisionVersion: number;
  status: PostReviewStatus;
  statusLabel: string;
  submittedAt: Date | null;
  formattedSubmittedAt: string;
  reviewedAt: Date | null;
  formattedReviewedAt: string;
  reviewedBy: string | null;
  reviewNote: string | null;
  isCurrentPublished: boolean;
}

export interface ContentReviewHistoryModel {
  postId: string;
  type: PostType;
  postStatus: PostReviewStatus;
  postStatusLabel: string;
  version: number;
  publishedRevisionId: string | null;
  revisions: ContentReviewHistoryTimelineItem[];
  hasPendingRevision: boolean;
  pendingRevisionVersion: number | null;
}
