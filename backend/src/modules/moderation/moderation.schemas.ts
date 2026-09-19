import {
  AiFlagRiskLevel,
  AiFlagStatus,
  CommentStatus,
  ContributorApprovalBasis,
  ModerationDecision,
  ModerationPriority,
  PostRevisionStatus,
  PostStatus,
  PostType,
  ReportStatus,
  ReportTargetType,
  Role,
  UserStatus,
} from '@prisma/client';
import { z } from '../../common/validation/zod.js';

const optionalQuery = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().min(1).max(120).optional(),
);
const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
const paginationMetaSchema = z
  .object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();

export const moderationIdParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const reviewQueueQuerySchema = paginationQuery
  .extend({
    status: z
      .enum([
        PostRevisionStatus.PENDING_REVIEW,
        PostRevisionStatus.FLAGGED,
        PostRevisionStatus.QUARANTINED,
      ])
      .optional(),
    type: z.enum(PostType).optional(),
    priority: z.enum(ModerationPriority).optional(),
  })
  .strict();

export const reviewDecisionRequestSchema = z
  .object({ reason: z.string().trim().min(10).max(2_000) })
  .strict();

export const createReportRequestSchema = z
  .object({
    targetType: z.enum(ReportTargetType),
    targetId: z.string().uuid(),
    reasonCode: z
      .enum(['SPAM', 'HARMFUL_HEALTH', 'HARASSMENT', 'MISINFORMATION', 'COPYRIGHT', 'OTHER'])
      .openapi({ description: 'Stable reporter-selected reason code' }),
    details: z.string().trim().min(10).max(2_000).optional(),
  })
  .strict();

export const adminReportsQuerySchema = paginationQuery
  .extend({
    status: z.enum(ReportStatus).optional(),
    priority: z.enum(ModerationPriority).optional(),
    targetType: z.enum(ReportTargetType).optional(),
  })
  .strict();

export const resolveReportRequestSchema = z
  .object({
    decision: z.enum([
      ModerationDecision.NO_VIOLATION,
      ModerationDecision.WARN,
      ModerationDecision.HIDE,
      ModerationDecision.RESTORE,
      ModerationDecision.DEMOTE,
      ModerationDecision.BAN,
    ]),
    reason: z.string().trim().min(10).max(2_000),
  })
  .strict();

export const adminUsersQuerySchema = paginationQuery
  .extend({
    status: z.enum(UserStatus).optional(),
    role: z.enum(Role).optional(),
    q: optionalQuery,
  })
  .strict();

export const updateUserStatusRequestSchema = z
  .object({
    status: z.enum([UserStatus.ACTIVE, UserStatus.LOCKED, UserStatus.BANNED, UserStatus.DELETED]),
    reason: z.string().trim().min(10).max(2_000),
  })
  .strict();

export const adminCommentsQuerySchema = paginationQuery
  .extend({
    status: z.enum(CommentStatus).optional(),
    postId: z.string().uuid().optional(),
    authorId: z.string().uuid().optional(),
    q: optionalQuery,
  })
  .strict();

export const updateCommentStatusRequestSchema = z
  .object({
    status: z.enum([CommentStatus.VISIBLE, CommentStatus.HIDDEN]),
    reason: z.string().trim().min(10).max(2_000),
  })
  .strict();

const userSummarySchema = z
  .object({
    id: z.string().uuid(),
    displayName: z.string(),
    role: z.enum(Role),
    contributorApprovalBasis: z.enum(ContributorApprovalBasis).nullable(),
  })
  .strict();
const aiFlagSchema = z
  .object({
    id: z.string().uuid(),
    provider: z.string(),
    model: z.string(),
    ruleVersion: z.string(),
    reasonCodes: z.array(z.string()),
    riskScore: z.number().min(0).max(1),
    riskLevel: z.enum(AiFlagRiskLevel),
    status: z.enum(AiFlagStatus),
    createdAt: z.string().datetime(),
  })
  .strict();
const reviewQueueItemSchema = z
  .object({
    postId: z.string().uuid(),
    type: z.enum(PostType),
    slug: z.string(),
    postStatus: z.enum(PostStatus),
    revisionId: z.string().uuid(),
    revisionVersion: z.number().int().positive(),
    revisionStatus: z.enum(PostRevisionStatus),
    title: z.string(),
    excerpt: z.string().nullable(),
    author: userSummarySchema,
    aiFlags: z.array(aiFlagSchema),
    priority: z.enum(ModerationPriority),
    activeReporterCount: z.number().int().nonnegative(),
    canDecide: z.boolean(),
    createdAt: z.string().datetime(),
  })
  .strict();
const reportSchema = z
  .object({
    id: z.string().uuid(),
    reporterId: z.string().uuid(),
    targetType: z.enum(ReportTargetType),
    targetId: z.string().uuid(),
    reasonCode: z.string(),
    details: z.string().nullable(),
    status: z.enum(ReportStatus),
    priority: z.enum(ModerationPriority),
    activeReporterCount: z.number().int().nonnegative(),
    resolvedDecision: z.enum(ModerationDecision).nullable(),
    resolvedReason: z.string().nullable(),
    resolvedById: z.string().uuid().nullable(),
    resolvedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();
const adminUserSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    displayName: z.string(),
    role: z.enum(Role),
    status: z.enum(UserStatus),
    contributorApprovalBasis: z.enum(ContributorApprovalBasis).nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    deletedAt: z.string().datetime().nullable(),
    privateDataPurgeAt: z.string().datetime().nullable(),
  })
  .strict();
const adminCommentSchema = z
  .object({
    id: z.string().uuid(),
    postId: z.string().uuid(),
    parentId: z.string().uuid().nullable(),
    content: z.string(),
    status: z.enum(CommentStatus),
    author: userSummarySchema,
    hiddenReason: z.string().nullable(),
    hiddenById: z.string().uuid().nullable(),
    hiddenAt: z.string().datetime().nullable(),
    deletedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

function itemResponse<T extends z.ZodType>(itemSchema: T) {
  return z.object({ success: z.literal(true), data: itemSchema, meta: z.null() }).strict();
}
function listResponse<T extends z.ZodType>(itemSchema: T) {
  return z
    .object({ success: z.literal(true), data: z.array(itemSchema), meta: paginationMetaSchema })
    .strict();
}

export const reviewQueueItemResponseSchema = itemResponse(reviewQueueItemSchema);
export const reviewQueueListResponseSchema = listResponse(reviewQueueItemSchema);
export const reportResponseSchema = itemResponse(reportSchema);
export const reportListResponseSchema = listResponse(reportSchema);
export const adminUserResponseSchema = itemResponse(adminUserSchema);
export const adminUserListResponseSchema = listResponse(adminUserSchema);
export const adminCommentResponseSchema = itemResponse(adminCommentSchema);
export const adminCommentListResponseSchema = listResponse(adminCommentSchema);

export type ModerationIdParams = z.infer<typeof moderationIdParamsSchema>;
export type ReviewQueueQuery = z.infer<typeof reviewQueueQuerySchema>;
export type ReviewDecisionInput = z.infer<typeof reviewDecisionRequestSchema>;
export type CreateReportInput = z.infer<typeof createReportRequestSchema>;
export type AdminReportsQuery = z.infer<typeof adminReportsQuerySchema>;
export type ResolveReportInput = z.infer<typeof resolveReportRequestSchema>;
export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusRequestSchema>;
export type AdminCommentsQuery = z.infer<typeof adminCommentsQuerySchema>;
export type UpdateCommentStatusInput = z.infer<typeof updateCommentStatusRequestSchema>;
