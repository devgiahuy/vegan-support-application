import {
  ContributorApplicationStatus,
  ContributorApprovalBasis,
  ContributorDecisionType,
  PostStatus,
  Prisma,
  Role,
  UserStatus,
  type PrismaClient,
} from '@prisma/client';
import type {
  ContributorApplicationStateMachine,
  ContributorReviewInput,
} from './contributor-application.state-machine.js';
import type {
  AdminContributorApplicationsQuery,
  ContributorApprovalEvidence,
  OwnContributorApplicationsQuery,
} from './contributor.schemas.js';

const applicationInclude = {
  user: {
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      contributorProfile: { select: { approvalBasis: true, revokedAt: true } },
    },
  },
  invitedBy: { select: { id: true, displayName: true } },
  reviewedBy: { select: { id: true, displayName: true } },
} satisfies Prisma.ContributorApplicationInclude;

export type ContributorApplicationRecord = Prisma.ContributorApplicationGetPayload<{
  include: typeof applicationInclude;
}>;

export class ContributorRepositoryConflictError extends Error {
  constructor(
    readonly kind:
      | 'PENDING_EXISTS'
      | 'ALREADY_REVIEWED'
      | 'NOT_REVIEWABLE'
      | 'REVOCATION_NOT_APPLICABLE',
  ) {
    super(kind);
    this.name = 'ContributorRepositoryConflictError';
  }
}

export class ContributorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findSubmissionContext(userId: string) {
    const [user, latestRejected] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          applications: {
            where: { status: ContributorApplicationStatus.PENDING },
            select: { id: true },
            take: 1,
          },
        },
      }),
      this.prisma.contributorApplication.findFirst({
        where: { userId, status: ContributorApplicationStatus.REJECTED },
        orderBy: [{ reviewedAt: 'desc' }, { updatedAt: 'desc' }, { id: 'desc' }],
        select: { reapplyEligibleAt: true, reviewedAt: true, updatedAt: true },
      }),
    ]);
    return { user, latestRejected };
  }

  findInvitationTarget(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
        applications: {
          where: { status: ContributorApplicationStatus.PENDING },
          select: { id: true },
          take: 1,
        },
      },
    });
  }

  async createApplication(
    data:
      | ReturnType<ContributorApplicationStateMachine['pendingApplicationData']>
      | ReturnType<ContributorApplicationStateMachine['invitedApplicationData']>,
  ): Promise<ContributorApplicationRecord> {
    try {
      return await this.prisma.contributorApplication.create({
        data,
        include: applicationInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ContributorRepositoryConflictError('PENDING_EXISTS');
      }
      throw error;
    }
  }

  async listOwn(userId: string, query: OwnContributorApplicationsQuery) {
    const where = { userId } satisfies Prisma.ContributorApplicationWhereInput;
    const [records, total] = await this.prisma.$transaction([
      this.prisma.contributorApplication.findMany({
        where,
        include: applicationInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.contributorApplication.count({ where }),
    ]);
    return { records, total };
  }

  async listAdmin(query: AdminContributorApplicationsQuery) {
    const where: Prisma.ContributorApplicationWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.claimedApprovalBasis
        ? { claimedApprovalBasis: query.claimedApprovalBasis }
        : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(query.q
        ? {
            user: {
              OR: [
                { email: { contains: query.q, mode: 'insensitive' } },
                { displayName: { contains: query.q, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.contributorApplication.findMany({
        where,
        include: applicationInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.contributorApplication.count({ where }),
    ]);
    return { records, total };
  }

  findApplication(id: string): Promise<ContributorApplicationRecord | null> {
    return this.prisma.contributorApplication.findUnique({
      where: { id },
      include: applicationInclude,
    });
  }

  async reviewApplication(
    applicationId: string,
    reviewerId: string,
    input: ContributorReviewInput,
    stateMachine: ContributorApplicationStateMachine,
    now: Date,
  ): Promise<ContributorApplicationRecord> {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`
        SELECT "id" FROM "contributor_applications"
        WHERE "id" = ${applicationId}::uuid
        FOR UPDATE
      `;
      const application = await transaction.contributorApplication.findUnique({
        where: { id: applicationId },
        include: applicationInclude,
      });
      if (!application || application.status !== ContributorApplicationStatus.PENDING) {
        throw new ContributorRepositoryConflictError('ALREADY_REVIEWED');
      }

      const evidence =
        input.decision === 'APPROVE'
          ? await this.captureApprovalEvidence(transaction, application, input.approvalBasis, now)
          : null;
      const reviewData = stateMachine.reviewData(reviewerId, input, evidence, now);
      await transaction.contributorApplication.update({
        where: { id: application.id },
        data: {
          ...reviewData,
          reviewEvidence:
            reviewData.reviewEvidence === null
              ? Prisma.JsonNull
              : (reviewData.reviewEvidence as Prisma.InputJsonValue),
        },
      });

      if (input.decision === 'APPROVE') {
        const promoted = await transaction.user.updateMany({
          where: { id: application.userId, role: Role.MEMBER, status: UserStatus.ACTIVE },
          data: { role: Role.CONTRIBUTOR },
        });
        if (promoted.count !== 1) {
          throw new ContributorRepositoryConflictError('NOT_REVIEWABLE');
        }
        await transaction.contributorProfile.upsert({
          where: { userId: application.userId },
          update: {
            approvalBasis: input.approvalBasis,
            approvalEvidence: evidence as Prisma.InputJsonValue,
            approvedAt: now,
            approvedById: reviewerId,
            sourceApplicationId: application.id,
            revokedAt: null,
            revokedById: null,
            revocationReason: null,
          },
          create: {
            userId: application.userId,
            approvalBasis: input.approvalBasis,
            approvalEvidence: evidence as Prisma.InputJsonValue,
            approvedAt: now,
            approvedById: reviewerId,
            sourceApplicationId: application.id,
          },
        });
        await transaction.contributorDecision.create({
          data: {
            userId: application.userId,
            applicationId: application.id,
            actorId: reviewerId,
            decision: ContributorDecisionType.APPROVED,
            approvalBasis: input.approvalBasis,
            evidence: evidence as Prisma.InputJsonValue,
            reason: input.reviewNote,
            createdAt: now,
          },
        });
        await transaction.refreshSession.updateMany({
          where: { userId: application.userId, revokedAt: null },
          data: { revokedAt: now, revokeReason: 'ROLE_CHANGED' },
        });
      } else {
        await transaction.contributorDecision.create({
          data: {
            userId: application.userId,
            applicationId: application.id,
            actorId: reviewerId,
            decision: ContributorDecisionType.REJECTED,
            reason: input.reviewNote,
            createdAt: now,
          },
        });
      }

      return transaction.contributorApplication.findUniqueOrThrow({
        where: { id: application.id },
        include: applicationInclude,
      });
    });
  }

  async revokeContributor(userId: string, actorId: string, reason: string, now: Date) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`
        SELECT "id" FROM "users" WHERE "id" = ${userId}::uuid FOR UPDATE
      `;
      const user = await transaction.user.findUnique({
        where: { id: userId },
        include: { contributorProfile: true },
      });
      const profile = user?.contributorProfile;
      if (!user || user.role !== Role.CONTRIBUTOR || !profile || profile.revokedAt) {
        throw new ContributorRepositoryConflictError('REVOCATION_NOT_APPLICABLE');
      }

      await transaction.contributorProfile.update({
        where: { userId },
        data: { revokedAt: now, revokedById: actorId, revocationReason: reason },
      });
      await transaction.user.update({ where: { id: userId }, data: { role: Role.MEMBER } });
      await transaction.contributorDecision.create({
        data: {
          userId,
          applicationId: profile.sourceApplicationId,
          actorId,
          decision: ContributorDecisionType.REVOKED,
          approvalBasis: profile.approvalBasis,
          evidence: profile.approvalEvidence as Prisma.InputJsonValue,
          reason,
          createdAt: now,
        },
      });
      await transaction.refreshSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now, revokeReason: 'ROLE_CHANGED' },
      });
      const actor = await transaction.user.findUniqueOrThrow({
        where: { id: actorId },
        select: { id: true, displayName: true },
      });
      return { userId, role: Role.MEMBER, revokedAt: now, revokedBy: actor, reason };
    });
  }

  private async captureApprovalEvidence(
    transaction: Prisma.TransactionClient,
    application: ContributorApplicationRecord,
    basis: ContributorApprovalBasis,
    now: Date,
  ): Promise<ContributorApprovalEvidence> {
    if (basis === ContributorApprovalBasis.ORGANIZATION_AFFILIATION) {
      return {
        kind: basis,
        capturedAt: now.toISOString(),
        snapshotVersion: 'organization-claim-v1',
        organizationClaim: application.organizationClaim ?? '',
        referenceLinks: this.referenceLinks(application.referenceLinks),
        verificationStatus: 'CLAIM_RETAINED_NOT_VERIFIED',
      };
    }
    if (basis === ContributorApprovalBasis.ADMIN_INVITED) {
      if (!application.invitedBy || !application.invitationReason) {
        throw new ContributorRepositoryConflictError('NOT_REVIEWABLE');
      }
      return {
        kind: basis,
        capturedAt: now.toISOString(),
        snapshotVersion: 'admin-invitation-v1',
        inviter: application.invitedBy,
        invitationReason: application.invitationReason,
        verificationStatus: 'ADMIN_INVITATION_RECORDED',
      };
    }

    const [total, published, pendingReview, rejected, comments, votes, ratings, bookmarks, average] =
      await Promise.all([
        transaction.post.count({ where: { authorId: application.userId } }),
        transaction.post.count({
          where: { authorId: application.userId, status: PostStatus.PUBLISHED },
        }),
        transaction.post.count({
          where: { authorId: application.userId, status: PostStatus.PENDING_REVIEW },
        }),
        transaction.post.count({
          where: { authorId: application.userId, status: PostStatus.REJECTED },
        }),
        transaction.comment.count({ where: { post: { authorId: application.userId } } }),
        transaction.postVote.count({ where: { post: { authorId: application.userId } } }),
        transaction.postRating.count({
          where: { active: true, post: { authorId: application.userId } },
        }),
        transaction.postBookmark.count({ where: { post: { authorId: application.userId } } }),
        transaction.postRating.aggregate({
          where: { active: true, post: { authorId: application.userId } },
          _avg: { taste: true },
        }),
      ]);
    return {
      kind: basis,
      capturedAt: now.toISOString(),
      snapshotVersion: 'platform-track-record-v1',
      posts: { total, published, pendingReview, rejected },
      interactions: {
        commentsReceived: comments,
        votesReceived: votes,
        ratingsReceived: ratings,
        bookmarksReceived: bookmarks,
        averageTasteRating: average._avg.taste,
      },
    };
  }

  private referenceLinks(value: Prisma.JsonValue): string[] {
    return Array.isArray(value)
      ? value.filter((link): link is string => typeof link === 'string')
      : [];
  }
}
