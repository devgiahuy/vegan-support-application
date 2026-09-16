import {
  ContributorApplicationSource,
  ContributorApplicationStatus,
  ContributorType,
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

export const ownContributorApplicationsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export const adminContributorApplicationsQuerySchema = ownContributorApplicationsQuerySchema
  .extend({
    status: z.enum(ContributorApplicationStatus).optional(),
    requestedType: z.enum(ContributorType).optional(),
    source: z.enum(ContributorApplicationSource).optional(),
    q: optionalTrimmedQuery,
  })
  .strict();

const approveApplicationSchema = z
  .object({
    decision: z.literal('APPROVE'),
    contributorType: z.enum(ContributorType),
    approvalBasis: z.string().trim().min(20).max(2_000),
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

const contributorApplicationUserSchema = z
  .object({
    id: z.string().uuid(),
    email: z.string().email(),
    displayName: z.string(),
    role: z.enum(Role),
    currentContributorType: z.enum(ContributorType).nullable(),
  })
  .strict();

const contributorReviewerSchema = z
  .object({ id: z.string().uuid(), displayName: z.string() })
  .strict();

export const contributorApplicationSchema = z
  .object({
    id: z.string().uuid(),
    user: contributorApplicationUserSchema,
    requestedType: z.enum(ContributorType),
    requestedTypeLabel: z.string(),
    experience: z.string(),
    referenceLinks: z.array(z.string().url()),
    source: z.enum(ContributorApplicationSource),
    status: z.enum(ContributorApplicationStatus),
    approvedType: z.enum(ContributorType).nullable(),
    approvedTypeLabel: z.string().nullable(),
    approvalBasis: z.string().nullable(),
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

export type SubmitContributorApplicationInput = z.infer<
  typeof submitContributorApplicationRequestSchema
>;
export type ContributorApplicationParams = z.infer<typeof contributorApplicationParamsSchema>;
export type OwnContributorApplicationsQuery = z.infer<typeof ownContributorApplicationsQuerySchema>;
export type AdminContributorApplicationsQuery = z.infer<
  typeof adminContributorApplicationsQuerySchema
>;
export type ReviewContributorApplicationInput = z.infer<
  typeof reviewContributorApplicationRequestSchema
>;
export type ContributorApplicationOutput = z.infer<typeof contributorApplicationSchema>;
