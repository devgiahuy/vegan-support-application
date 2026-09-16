import { ContributorApplicationStatus, Prisma, Role, type PrismaClient } from '@prisma/client';
import type {
  ContributorApplicationStateMachine,
  ContributorReviewInput,
} from './contributor-application.state-machine.js';
import type {
  AdminContributorApplicationsQuery,
  OwnContributorApplicationsQuery,
} from './contributor.schemas.js';

const applicationInclude = {
  user: {
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      contributorProfile: { select: { contributorType: true } },
    },
  },
  reviewedBy: { select: { id: true, displayName: true } },
} satisfies Prisma.ContributorApplicationInclude;

export type ContributorApplicationRecord = Prisma.ContributorApplicationGetPayload<{
  include: typeof applicationInclude;
}>;

export class ContributorRepositoryConflictError extends Error {
  constructor(readonly kind: 'PENDING_EXISTS' | 'ALREADY_REVIEWED' | 'NOT_REVIEWABLE') {
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
          contributorProfile: { select: { contributorType: true } },
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

  async createApplication(
    data: ReturnType<ContributorApplicationStateMachine['pendingApplicationData']>,
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
      ...(query.requestedType ? { requestedType: query.requestedType } : {}),
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
    application: ContributorApplicationRecord,
    reviewerId: string,
    input: ContributorReviewInput,
    reviewData: Prisma.ContributorApplicationUpdateManyMutationInput,
    now: Date,
  ): Promise<ContributorApplicationRecord> {
    return this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.contributorApplication.updateMany({
        where: { id: application.id, status: ContributorApplicationStatus.PENDING },
        data: reviewData,
      });
      if (claimed.count !== 1) {
        throw new ContributorRepositoryConflictError('ALREADY_REVIEWED');
      }

      if (input.decision === 'APPROVE') {
        const promoted = await transaction.user.updateMany({
          where: { id: application.userId, role: { not: Role.ADMIN } },
          data: { role: Role.CONTRIBUTOR },
        });
        if (promoted.count !== 1) {
          throw new ContributorRepositoryConflictError('NOT_REVIEWABLE');
        }
        await transaction.contributorProfile.upsert({
          where: { userId: application.userId },
          update: {
            contributorType: input.contributorType,
            approvalBasis: input.approvalBasis,
            approvedAt: now,
            approvedById: reviewerId,
            sourceApplicationId: application.id,
          },
          create: {
            userId: application.userId,
            contributorType: input.contributorType,
            approvalBasis: input.approvalBasis,
            approvedAt: now,
            approvedById: reviewerId,
            sourceApplicationId: application.id,
          },
        });
        await transaction.refreshSession.updateMany({
          where: { userId: application.userId, revokedAt: null },
          data: { revokedAt: now, revokeReason: 'ROLE_CHANGED' },
        });
      }

      return transaction.contributorApplication.findUniqueOrThrow({
        where: { id: application.id },
        include: applicationInclude,
      });
    });
  }
}
