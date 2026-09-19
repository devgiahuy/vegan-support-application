import {
  ContributorApplicationSource,
  ContributorApplicationStatus,
  ContributorApprovalBasis,
  Role,
} from '@prisma/client';
import { z } from '../../common/validation/zod.js';
import { contributorRequestSchema } from '../auth/auth.schemas.js';

const optionalTrimmedQuery = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().min(1).max(120).optional(),
);

export const submitContributorApplicationRequestSchema = contributorRequestSchema;
export const contributorApplicationParamsSchema = z.object({ id: z.string().uuid() }).strict();
export const contributorUserParamsSchema = z.object({ userId: z.string().uuid() }).strict();

export const ownContributorApplicationsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const adminContributorApplicationsQuerySchema = ownContributorApplicationsQuerySchema
  .extend({
    status: z.enum(ContributorApplicationStatus).optional(),
    claimedApprovalBasis: z.enum(ContributorApprovalBasis).optional(),
    source: z.enum(ContributorApplicationSource).optional(),
    q: optionalTrimmedQuery,
  })
  .strict();

const approveApplicationSchema = z
  .object({
    decision: z.literal('APPROVE'),
    approvalBasis: z.enum(ContributorApprovalBasis),
    reviewNote: z.string().trim().min(10).max(2_000),
  })
  .strict();

const rejectApplicationSchema = z
  .object({
    decision: z.literal('REJECT'),
    reviewNote: z.string().trim().min(10).max(2_000),
  })
  .strict();

export const reviewContributorApplicationRequestSchema = z.discriminatedUnion('decision', [
  approveApplicationSchema,
  rejectApplicationSchema,
]);

export const inviteContributorRequestSchema = z
  .object({
    userId: z.string().uuid(),
    reason: z.string().trim().min(10).max(2_000),
  })
  .strict();

export const revokeContributorRequestSchema = z
  .object({ reason: z.string().trim().min(10).max(2_000) })
  .strict();

const contributorApplicationUserSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    displayName: z.string(),
    role: z.enum(Role),
    currentApprovalBasis: z.enum(ContributorApprovalBasis).nullable(),
  })
  .strict();

const contributorReviewerSchema = z
  .object({ id: z.string().uuid(), displayName: z.string() })
  .strict();

const platformTrackEvidenceSchema = z
  .object({
    kind: z.literal(ContributorApprovalBasis.PLATFORM_TRACK_RECORD),
    capturedAt: z.string().datetime(),
    snapshotVersion: z.string(),
    posts: z
      .object({
        total: z.number().int().nonnegative(),
        published: z.number().int().nonnegative(),
        pendingReview: z.number().int().nonnegative(),
        rejected: z.number().int().nonnegative(),
      })
      .strict()
      .optional(),
    interactions: z
      .object({
        commentsReceived: z.number().int().nonnegative(),
        votesReceived: z.number().int().nonnegative(),
        ratingsReceived: z.number().int().nonnegative(),
        bookmarksReceived: z.number().int().nonnegative(),
        averageTasteRating: z.number().min(1).max(5).nullable().optional(),
      })
      .strict()
      .optional(),
  })
  .strip();

const organizationEvidenceSchema = z
  .object({
    kind: z.literal(ContributorApprovalBasis.ORGANIZATION_AFFILIATION),
    capturedAt: z.string().datetime(),
    snapshotVersion: z.string(),
    organizationClaim: z.string(),
    referenceLinks: z.array(z.string().url()),
    verificationStatus: z.literal('CLAIM_RETAINED_NOT_VERIFIED'),
  })
  .strict();

const adminInvitedEvidenceSchema = z
  .object({
    kind: z.literal(ContributorApprovalBasis.ADMIN_INVITED),
    capturedAt: z.string().datetime(),
    snapshotVersion: z.string(),
    inviter: contributorReviewerSchema,
    invitationReason: z.string(),
    verificationStatus: z.literal('ADMIN_INVITATION_RECORDED'),
  })
  .strict();

export const contributorApprovalEvidenceSchema = z.discriminatedUnion('kind', [
  organizationEvidenceSchema,
  platformTrackEvidenceSchema,
  adminInvitedEvidenceSchema,
]);

export const contributorApplicationSchema = z
  .object({
    id: z.string().uuid(),
    user: contributorApplicationUserSchema,
    claimedApprovalBasis: z.enum(ContributorApprovalBasis),
    claimedApprovalBasisLabel: z.string(),
    organizationClaim: z.string().nullable(),
    experience: z.string(),
    referenceLinks: z.array(z.string().url()),
    source: z.enum(ContributorApplicationSource),
    invitedBy: contributorReviewerSchema.nullable(),
    invitationReason: z.string().nullable(),
    status: z.enum(ContributorApplicationStatus),
    approvalBasis: z.enum(ContributorApprovalBasis).nullable(),
    approvalBasisLabel: z.string().nullable(),
    reviewEvidence: contributorApprovalEvidenceSchema.nullable(),
    reviewNote: z.string().nullable(),
    reviewedBy: contributorReviewerSchema.nullable(),
    reviewedAt: z.string().datetime().nullable(),
    reapplyEligibleAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

const paginationMetaSchema = z
  .object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
  .strict();

export const contributorApplicationResponseSchema = z
  .object({ success: z.literal(true), data: contributorApplicationSchema, meta: z.null() })
  .strict();

export const contributorApplicationListResponseSchema = z
  .object({
    success: z.literal(true),
    data: z.array(contributorApplicationSchema),
    meta: paginationMetaSchema,
  })
  .strict();

export const contributorRevocationResponseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({
        userId: z.string().uuid(),
        role: z.literal(Role.MEMBER),
        revokedAt: z.string().datetime(),
        revokedBy: contributorReviewerSchema,
        reason: z.string(),
      })
      .strict(),
    meta: z.null(),
  })
  .strict();

export type SubmitContributorApplicationInput = z.infer<
  typeof submitContributorApplicationRequestSchema
>;
export type ContributorApplicationParams = z.infer<typeof contributorApplicationParamsSchema>;
export type ContributorUserParams = z.infer<typeof contributorUserParamsSchema>;
export type OwnContributorApplicationsQuery = z.infer<typeof ownContributorApplicationsQuerySchema>;
export type AdminContributorApplicationsQuery = z.infer<
  typeof adminContributorApplicationsQuerySchema
>;
export type ReviewContributorApplicationInput = z.infer<
  typeof reviewContributorApplicationRequestSchema
>;
export type InviteContributorInput = z.infer<typeof inviteContributorRequestSchema>;
export type RevokeContributorInput = z.infer<typeof revokeContributorRequestSchema>;
export type ContributorApplicationOutput = z.infer<typeof contributorApplicationSchema>;
export type ContributorApprovalEvidence = z.infer<typeof contributorApprovalEvidenceSchema>;
