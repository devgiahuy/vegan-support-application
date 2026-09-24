import {
  AiArtifactStatus,
  AiArtifactVisibility,
  AiVerificationAdminActionType,
  AiVerificationStatus,
  ChatMessageRole,
  ChatMessageStatus,
  Prisma,
  PostType,
  RecognitionCandidateStatus,
  RecognitionJobStatus,
  ReceiptCandidateStatus,
  ReceiptJobStatus,
  Role,
  UserStatus,
  type AiArtifactType,
  type AiVerificationConclusion,
  type PrismaClient,
} from '@prisma/client';
import type { PublicAiArtifactsQuery } from './ai-review.schemas.js';

const artifactInclude = {
  owner: { select: { displayName: true } },
  verifications: {
    include: { reviewer: { select: { displayName: true, role: true } } },
    orderBy: [{ createdAt: 'desc' as const }, { id: 'desc' as const }],
  },
} satisfies Prisma.AiArtifactInclude;

export type AiArtifactRecord = Prisma.AiArtifactGetPayload<{ include: typeof artifactInclude }>;
export type AiVerificationRecord = AiArtifactRecord['verifications'][number];

export class AiReviewConflictError extends Error {
  constructor(
    readonly kind:
      | 'SOURCE_ALREADY_SAVED'
      | 'ARTIFACT_VERSION'
      | 'ARTIFACT_STATE'
      | 'VERIFICATION_EXISTS'
      | 'VERIFICATION_VERSION'
      | 'VERIFICATION_STATE',
  ) {
    super(kind);
  }
}

export class AiReviewRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findOwnedChatAnswer(ownerId: string, id: string) {
    return this.prisma.chatMessage.findFirst({
      where: {
        id,
        role: ChatMessageRole.ASSISTANT,
        status: ChatMessageStatus.COMPLETED,
        session: { is: { userId: ownerId, deletedAt: null } },
      },
      select: { id: true, content: true },
    });
  }

  findOwnedNutritionEstimate(ownerId: string, id: string) {
    return this.prisma.recipeNutritionEstimate.findFirst({
      where: { id, revision: { is: { post: { is: { authorId: ownerId, type: PostType.RECIPE } } } } },
      select: {
        id: true,
        version: true,
        servings: true,
        totalRawGrams: true,
        totalCookedGrams: true,
        perServingNutrients: true,
        confidence: true,
        disclaimer: true,
        revision: { select: { title: true } },
      },
    });
  }

  findOwnedRecognition(ownerId: string, id: string) {
    return this.prisma.recognitionJob.findFirst({
      where: {
        id,
        ownerId,
        status: { in: [RecognitionJobStatus.READY, RecognitionJobStatus.PARTIAL_FAILED, RecognitionJobStatus.CONFIRMED] },
      },
      select: {
        id: true,
        attemptCount: true,
        candidates: {
          where: { status: { not: RecognitionCandidateStatus.REJECTED } },
          select: { detectedName: true, quantity: true, unit: true, confidence: true, status: true, version: true },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    });
  }

  findOwnedReceipt(ownerId: string, id: string) {
    return this.prisma.receiptJob.findFirst({
      where: {
        id,
        ownerId,
        status: { in: [ReceiptJobStatus.READY, ReceiptJobStatus.PARTIAL_FAILED, ReceiptJobStatus.CONFIRMED] },
      },
      select: {
        id: true,
        attemptCount: true,
        candidates: {
          where: { status: { not: ReceiptCandidateStatus.REJECTED } },
          select: { detectedName: true, quantity: true, unit: true, confidence: true, status: true, version: true },
          orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    });
  }

  async createArtifact(data: {
    ownerId: string;
    type: AiArtifactType;
    sourceId: string;
    sourceVersion: number;
    snapshot: Prisma.InputJsonObject;
    snapshotHash: string;
    title: string;
    summary: string;
    authorAnonymous: boolean;
  }): Promise<AiArtifactRecord> {
    try {
      return await this.prisma.aiArtifact.create({
        data: { ...data, version: data.sourceVersion },
        include: artifactInclude,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AiReviewConflictError('SOURCE_ALREADY_SAVED');
      }
      throw error;
    }
  }

  findOwnedArtifact(ownerId: string, id: string) {
    return this.prisma.aiArtifact.findFirst({ where: { id, ownerId }, include: artifactInclude });
  }

  findArtifact(id: string) {
    return this.prisma.aiArtifact.findUnique({ where: { id }, include: artifactInclude });
  }

  async updateVisibility(
    ownerId: string,
    id: string,
    visibility: AiArtifactVisibility,
    expectedLifecycleVersion: number,
  ): Promise<AiArtifactRecord | null> {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw(Prisma.sql`SELECT id FROM ai_artifacts WHERE id = ${id}::uuid FOR UPDATE`);
      const artifact = await transaction.aiArtifact.findFirst({ where: { id, ownerId } });
      if (!artifact) return null;
      if (artifact.lifecycleVersion !== expectedLifecycleVersion) throw new AiReviewConflictError('ARTIFACT_VERSION');
      if (artifact.visibility !== visibility) {
        await transaction.aiArtifact.update({
          where: { id },
          data: {
            visibility,
            lifecycleVersion: { increment: 1 },
            sharedAt: visibility === AiArtifactVisibility.PUBLIC ? new Date() : null,
          },
        });
      }
      return transaction.aiArtifact.findUniqueOrThrow({ where: { id }, include: artifactInclude });
    });
  }

  async submit(ownerId: string, id: string, expectedLifecycleVersion: number) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw(Prisma.sql`SELECT id FROM ai_artifacts WHERE id = ${id}::uuid FOR UPDATE`);
      const artifact = await transaction.aiArtifact.findFirst({ where: { id, ownerId } });
      if (!artifact) return null;
      if (artifact.lifecycleVersion !== expectedLifecycleVersion) throw new AiReviewConflictError('ARTIFACT_VERSION');
      if (artifact.status !== AiArtifactStatus.SUBMITTED) {
        await transaction.aiArtifact.update({
          where: { id },
          data: { status: AiArtifactStatus.SUBMITTED, submittedAt: new Date(), lifecycleVersion: { increment: 1 } },
        });
      }
      return transaction.aiArtifact.findUniqueOrThrow({ where: { id }, include: artifactInclude });
    });
  }

  async listPublic(query: PublicAiArtifactsQuery) {
    const where: Prisma.AiArtifactWhereInput = {
      visibility: AiArtifactVisibility.PUBLIC,
      status: AiArtifactStatus.SUBMITTED,
      ...(query.type ? { type: query.type } : {}),
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.aiArtifact.findMany({
        where,
        include: artifactInclude,
        orderBy: [{ sharedAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.aiArtifact.count({ where }),
    ]);
    return { records, total };
  }

  async createVerification(data: {
    artifactId: string;
    reviewerId: string;
    expectedArtifactVersion: number;
    conclusion: AiVerificationConclusion;
    scope: string;
    evidenceNote: string;
    correction: string | null;
  }): Promise<{ artifact: AiArtifactRecord; verification: AiVerificationRecord }> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        await transaction.$queryRaw(Prisma.sql`SELECT id FROM ai_artifacts WHERE id = ${data.artifactId}::uuid FOR UPDATE`);
        const artifact = await transaction.aiArtifact.findUnique({ where: { id: data.artifactId } });
        if (!artifact) throw new AiReviewConflictError('ARTIFACT_STATE');
        if (artifact.version !== data.expectedArtifactVersion) throw new AiReviewConflictError('ARTIFACT_VERSION');
        if (artifact.ownerId === data.reviewerId) throw new AiReviewConflictError('ARTIFACT_STATE');
        if (artifact.status !== AiArtifactStatus.SUBMITTED || artifact.visibility !== AiArtifactVisibility.PUBLIC) {
          throw new AiReviewConflictError('ARTIFACT_STATE');
        }
        const reviewer = await transaction.user.findFirst({
          where: {
            id: data.reviewerId,
            status: UserStatus.ACTIVE,
            OR: [
              { role: Role.ADMIN },
              { role: Role.CONTRIBUTOR, contributorProfile: { is: { revokedAt: null } } },
            ],
          },
          select: { id: true, role: true },
        });
        if (!reviewer) throw new AiReviewConflictError('ARTIFACT_STATE');
        const active = await transaction.aiVerification.findFirst({
          where: { artifactId: artifact.id, status: AiVerificationStatus.ACTIVE },
          select: { id: true },
        });
        if (active) throw new AiReviewConflictError('VERIFICATION_EXISTS');
        const verification = await transaction.aiVerification.create({
          data: {
            artifactId: artifact.id,
            artifactVersion: artifact.version,
            reviewerId: data.reviewerId,
            reviewerRole: reviewer.role,
            conclusion: data.conclusion,
            scope: data.scope,
            evidenceNote: data.evidenceNote,
            correction: data.correction,
          },
          include: { reviewer: { select: { displayName: true, role: true } } },
        });
        return {
          artifact: await transaction.aiArtifact.findUniqueOrThrow({ where: { id: artifact.id }, include: artifactInclude }),
          verification,
        };
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AiReviewConflictError('VERIFICATION_EXISTS');
      }
      throw error;
    }
  }

  async adminAction(data: {
    verificationId: string;
    actorId: string;
    expectedVersion: number;
    action: 'OVERRIDE' | 'REVOKE';
    reason: string;
    replacement?: {
      conclusion: AiVerificationConclusion;
      scope: string;
      evidenceNote: string;
      correction: string | null;
    };
  }): Promise<{ artifact: AiArtifactRecord; verification: AiVerificationRecord } | null> {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw(Prisma.sql`SELECT id FROM ai_verifications WHERE id = ${data.verificationId}::uuid FOR UPDATE`);
      const current = await transaction.aiVerification.findUnique({ where: { id: data.verificationId } });
      if (!current) return null;
      if (current.version !== data.expectedVersion) throw new AiReviewConflictError('VERIFICATION_VERSION');
      if (current.status !== AiVerificationStatus.ACTIVE) throw new AiReviewConflictError('VERIFICATION_STATE');
      const nextStatus = data.action === 'OVERRIDE' ? AiVerificationStatus.SUPERSEDED : AiVerificationStatus.REVOKED;
      const updated = await transaction.aiVerification.update({
        where: { id: current.id },
        data: { status: nextStatus, version: { increment: 1 } },
      });
      let resultId = current.id;
      let replacementId: string | null = null;
      if (data.action === 'OVERRIDE' && data.replacement) {
        const replacement = await transaction.aiVerification.create({
          data: {
            artifactId: current.artifactId,
            artifactVersion: current.artifactVersion,
            reviewerId: data.actorId,
            reviewerRole: Role.ADMIN,
            conclusion: data.replacement.conclusion,
            scope: data.replacement.scope,
            evidenceNote: data.replacement.evidenceNote,
            correction: data.replacement.correction,
            supersedesId: current.id,
          },
        });
        replacementId = replacement.id;
        resultId = replacement.id;
      }
      await transaction.aiVerificationAdminAction.create({
        data: {
          verificationId: current.id,
          actorId: data.actorId,
          action: data.action === 'OVERRIDE' ? AiVerificationAdminActionType.OVERRIDE : AiVerificationAdminActionType.REVOKE,
          reason: data.reason,
          expectedVersion: data.expectedVersion,
          resultingVersion: updated.version,
          replacementVerificationId: replacementId,
        },
      });
      const artifact = await transaction.aiArtifact.findUniqueOrThrow({ where: { id: current.artifactId }, include: artifactInclude });
      const verification = artifact.verifications.find((item) => item.id === resultId);
      if (!verification) throw new Error('AI verification action result missing');
      return { artifact, verification };
    });
  }
}
