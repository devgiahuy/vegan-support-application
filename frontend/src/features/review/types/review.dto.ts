/**
 * DTO cho Review Queue bám sát backend `moderation.schemas.ts`
 * (`reviewQueueItemSchema`, `reviewDecisionRequestSchema`,
 * `reviewQueueQuerySchema`). Mọi field optional để mapper null-safe.
 */

export interface ReviewAuthorDto {
  id?: string;
  displayName?: string;
  role?: string;
  contributorType?: string | null;
}

export interface AiFlagDto {
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

export interface ReviewQueueItemDto {
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
  aiFlags?: AiFlagDto[];
  priority?: string;
  activeReporterCount?: number;
  canDecide?: boolean;
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

export interface ReviewDecisionRequestDto {
  reason: string;
}
