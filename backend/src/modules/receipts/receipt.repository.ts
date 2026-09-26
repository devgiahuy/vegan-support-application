import {
  FoodDataReviewStatus,
  MediaAssetStatus,
  MediaKind,
  PantryAdjustmentType,
  PantryConfirmationStatus,
  PantryItemSource,
  Prisma,
  ReceiptCandidateStatus,
  ReceiptInputStatus,
  ReceiptJobStatus,
  type PantryConversionStatus,
  type PrismaClient,
} from '@prisma/client';

const jobInclude = {
  inputs: {
    include: { asset: { select: { id: true, secureUrl: true } } },
    orderBy: { position: 'asc' as const },
  },
  candidates: {
    include: {
      input: { select: { id: true, position: true } },
      ingredient: { select: { id: true, canonicalName: true } },
      pantryItem: { include: { ingredient: { select: { id: true, canonicalName: true } } } },
    },
    orderBy: [{ createdAt: 'asc' as const }, { id: 'asc' as const }],
  },
} satisfies Prisma.ReceiptJobInclude;

export type ReceiptJobRecord = Prisma.ReceiptJobGetPayload<{ include: typeof jobInclude }>;
export class ReceiptConflictError extends Error {}
export class ReceiptVersionConflictError extends Error {}

export interface ReceiptCandidateData {
  inputId: string;
  ingredientId: string | null;
  lineText: string;
  detectedName: string;
  normalizedName: string;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  lineTotal: number | null;
  currency: string | null;
  confidence: number;
  matchConfidence: number | null;
  uncertaintyNote: string | null;
}

export interface ConversionSnapshot {
  normalizedGrams: number | null;
  status: PantryConversionStatus;
  source: string | null;
  version: string | null;
  confidence: number | null;
}

export class ReceiptRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findOwnedAssets(ownerId: string, assetIds: string[]) {
    return this.prisma.mediaAsset.findMany({
      where: {
        id: { in: assetIds },
        ownerId,
        kind: MediaKind.RECEIPT_IMAGE,
        status: MediaAssetStatus.ACTIVE,
      },
    });
  }

  async createJob(data: {
    ownerId: string;
    assetIds: string[];
    provider: string;
    modelId: string;
    templateVersion: string;
    idempotencyKey: string;
    requestHash: string;
  }): Promise<{ job: ReceiptJobRecord; created: boolean }> {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.receiptJob.findUnique({
        where: {
          ownerId_idempotencyKey: {
            ownerId: data.ownerId,
            idempotencyKey: data.idempotencyKey,
          },
        },
        include: jobInclude,
      });
      if (existing) return { job: existing, created: false };
      const job = await transaction.receiptJob.create({
        data: {
          ownerId: data.ownerId,
          provider: data.provider,
          modelId: data.modelId,
          templateVersion: data.templateVersion,
          idempotencyKey: data.idempotencyKey,
          requestHash: data.requestHash,
          inputs: { create: data.assetIds.map((assetId, position) => ({ assetId, position })) },
        },
        include: jobInclude,
      });
      return { job, created: true };
    });
  }

  findOwnedJob(ownerId: string, id: string) {
    return this.prisma.receiptJob.findFirst({ where: { id, ownerId }, include: jobInclude });
  }

  async startProcessing(ownerId: string, id: string): Promise<ReceiptJobRecord | null> {
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.receiptJob.updateMany({
        where: { id, ownerId, status: ReceiptJobStatus.QUEUED },
        data: {
          status: ReceiptJobStatus.PROCESSING,
          attemptCount: { increment: 1 },
          processingStartedAt: new Date(),
          processingCompletedAt: null,
          errorCode: null,
          errorMessage: null,
        },
      });
      if (!updated.count) return null;
      await transaction.receiptCandidate.deleteMany({ where: { jobId: id } });
      await transaction.receiptInput.updateMany({
        where: { jobId: id },
        data: { status: ReceiptInputStatus.PENDING, errorCode: null, errorMessage: null },
      });
      return transaction.receiptJob.findUniqueOrThrow({ where: { id }, include: jobInclude });
    });
  }

  async saveResults(data: {
    jobId: string;
    inputs: Array<{ inputId: string; error: { code: string; message: string } | null }>;
    candidates: ReceiptCandidateData[];
    metadata: {
      merchantName: string | null;
      purchasedAt: Date | null;
      currency: string | null;
      totalAmount: number | null;
      confidence: number | null;
    };
  }): Promise<ReceiptJobRecord> {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.receiptJob.findUniqueOrThrow({ where: { id: data.jobId } });
      if (current.status !== ReceiptJobStatus.PROCESSING) {
        return transaction.receiptJob.findUniqueOrThrow({ where: { id: data.jobId }, include: jobInclude });
      }
      for (const input of data.inputs) {
        await transaction.receiptInput.update({
          where: { id: input.inputId },
          data: input.error
            ? {
                status: ReceiptInputStatus.FAILED,
                errorCode: input.error.code,
                errorMessage: input.error.message,
              }
            : { status: ReceiptInputStatus.PROCESSED, errorCode: null, errorMessage: null },
        });
      }
      if (data.candidates.length) await transaction.receiptCandidate.createMany({ data: data.candidates.map((candidate) => ({ jobId: data.jobId, ...candidate })) });
      const failedCount = data.inputs.filter((input) => input.error).length;
      await transaction.receiptJob.update({
        where: { id: data.jobId },
        data: {
          status:
            failedCount === data.inputs.length
              ? ReceiptJobStatus.FAILED
              : failedCount > 0
                ? ReceiptJobStatus.PARTIAL_FAILED
                : ReceiptJobStatus.READY,
          merchantName: data.metadata.merchantName,
          purchasedAt: data.metadata.purchasedAt,
          currency: data.metadata.currency,
          totalAmount: data.metadata.totalAmount,
          metadataConfidence: data.metadata.confidence,
          processingCompletedAt: new Date(),
          errorCode: failedCount ? 'PARTIAL_RECEIPT_EXTRACTION' : null,
          errorMessage: failedCount
            ? `${String(failedCount)} receipt image(s) could not be extracted; available lines are retained.`
            : null,
        },
      });
      return transaction.receiptJob.findUniqueOrThrow({ where: { id: data.jobId }, include: jobInclude });
    });
  }

  async markFailed(id: string): Promise<void> {
    await this.prisma.receiptJob.updateMany({
      where: { id, status: ReceiptJobStatus.PROCESSING },
      data: {
        status: ReceiptJobStatus.FAILED,
        errorCode: 'RECEIPT_PROVIDER_UNAVAILABLE',
        errorMessage: 'Receipt extraction is temporarily unavailable. Retry later or update pantry manually.',
        processingCompletedAt: new Date(),
      },
    });
  }

  resolveIngredientById(id: string) {
    return this.prisma.ingredient.findFirst({
      where: { id, status: 'ACTIVE' },
      select: { id: true, canonicalName: true },
    });
  }

  async resolveIngredient(normalizedName: string) {
    const direct = await this.prisma.ingredient.findFirst({
      where: { normalizedName, status: 'ACTIVE' },
      select: { id: true, canonicalName: true },
    });
    if (direct) return direct;
    const alias = await this.prisma.ingredientAlias.findFirst({
      where: {
        normalizedAlias: normalizedName,
        reviewStatus: FoodDataReviewStatus.APPROVED,
        ingredient: { status: 'ACTIVE' },
      },
      select: { ingredient: { select: { id: true, canonicalName: true } } },
    });
    return alias?.ingredient ?? null;
  }

  findReviewedConversions(ingredientId: string) {
    const now = new Date();
    return this.prisma.ingredientFoodProfile.findMany({
      where: {
        ingredientId,
        reviewStatus: FoodDataReviewStatus.APPROVED,
        effectiveFrom: { lte: now },
        AND: [{ OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }] }],
        source: { active: true },
      },
      include: {
        source: { select: { code: true } },
        householdConversions: { where: { reviewStatus: FoodDataReviewStatus.APPROVED } },
      },
      orderBy: [{ effectiveFrom: 'desc' }, { sourceVersion: 'desc' }],
    });
  }

  async updateCandidate(
    ownerId: string,
    jobId: string,
    candidateId: string,
    expectedVersion: number,
    data: Prisma.ReceiptCandidateUncheckedUpdateManyInput,
  ): Promise<ReceiptJobRecord | null> {
    return this.prisma.$transaction(async (transaction) => {
      const job = await transaction.receiptJob.findFirst({ where: { id: jobId, ownerId } });
      if (!job) return null;
      if (job.status !== ReceiptJobStatus.READY && job.status !== ReceiptJobStatus.PARTIAL_FAILED) {
        throw new ReceiptConflictError();
      }
      const updated = await transaction.receiptCandidate.updateMany({
        where: { id: candidateId, jobId, version: expectedVersion },
        data: { ...data, version: { increment: 1 } },
      });
      if (!updated.count) throw new ReceiptVersionConflictError();
      return transaction.receiptJob.findUniqueOrThrow({ where: { id: jobId }, include: jobInclude });
    });
  }

  async cancel(ownerId: string, id: string): Promise<ReceiptJobRecord | null> {
    return this.prisma.$transaction(async (transaction) => {
      const job = await transaction.receiptJob.findFirst({ where: { id, ownerId } });
      if (!job) return null;
      if (job.status === ReceiptJobStatus.CANCELLED) return transaction.receiptJob.findUniqueOrThrow({ where: { id }, include: jobInclude });
      if (job.status === ReceiptJobStatus.CONFIRMED) throw new ReceiptConflictError();
      await transaction.receiptJob.update({
        where: { id },
        data: { status: ReceiptJobStatus.CANCELLED, cancelledAt: new Date() },
      });
      return transaction.receiptJob.findUniqueOrThrow({ where: { id }, include: jobInclude });
    });
  }

  async queueRetry(ownerId: string, id: string, key: string, requestHash: string) {
    return this.prisma.$transaction(async (transaction) => {
      const job = await transaction.receiptJob.findFirst({ where: { id, ownerId } });
      if (!job) return null;
      if (job.lastRetryKey === key) {
        if (job.lastRetryHash !== requestHash) throw new ReceiptConflictError();
        return { job: await transaction.receiptJob.findUniqueOrThrow({ where: { id }, include: jobInclude }), replay: true };
      }
      if (job.status !== ReceiptJobStatus.FAILED && job.status !== ReceiptJobStatus.PARTIAL_FAILED) throw new ReceiptConflictError();
      await transaction.receiptJob.update({
        where: { id },
        data: { status: ReceiptJobStatus.QUEUED, lastRetryKey: key, lastRetryHash: requestHash },
      });
      return { job: await transaction.receiptJob.findUniqueOrThrow({ where: { id }, include: jobInclude }), replay: false };
    });
  }

  async confirm(data: {
    ownerId: string;
    jobId: string;
    candidates: Array<{ id: string; expectedVersion: number; conversion: ConversionSnapshot }>;
    idempotencyKey: string;
    requestHash: string;
  }): Promise<{ job: ReceiptJobRecord; changes: Array<{ candidateId: string; action: 'CREATED' | 'UPDATED' }> }> {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw(Prisma.sql`SELECT id FROM users WHERE id = ${data.ownerId}::uuid FOR UPDATE`);
      const job = await transaction.receiptJob.findFirst({
        where: { id: data.jobId, ownerId: data.ownerId },
        include: jobInclude,
      });
      if (!job) throw new ReceiptConflictError();
      if (job.status === ReceiptJobStatus.CONFIRMED) {
        if (job.confirmationKey !== data.idempotencyKey || job.confirmationHash !== data.requestHash) throw new ReceiptConflictError();
        return {
          job,
          changes: job.candidates
            .filter((candidate) => candidate.status === ReceiptCandidateStatus.CONFIRMED)
            .map((candidate) => ({
              candidateId: candidate.id,
              action: candidate.pantryAction === 'UPDATED' ? ('UPDATED' as const) : ('CREATED' as const),
            })),
        };
      }
      if (job.status !== ReceiptJobStatus.READY && job.status !== ReceiptJobStatus.PARTIAL_FAILED) throw new ReceiptConflictError();
      const requested = new Map(data.candidates.map((item) => [item.id, item]));
      const selected = job.candidates.filter((candidate) => requested.has(candidate.id));
      if (selected.length !== requested.size) throw new ReceiptConflictError();
      const changes: Array<{ candidateId: string; action: 'CREATED' | 'UPDATED' }> = [];
      for (const candidate of selected) {
        const request = requested.get(candidate.id)!;
        if (candidate.version !== request.expectedVersion || candidate.status === ReceiptCandidateStatus.REJECTED || candidate.quantity === null || !candidate.unit) throw new ReceiptVersionConflictError();
        const quantity = candidate.quantity.toNumber();
        const existing = await transaction.pantryItem.findFirst({
          where: {
            ownerId: data.ownerId,
            deletedAt: null,
            confirmationStatus: PantryConfirmationStatus.CONFIRMED,
            unit: candidate.unit,
            ...(candidate.ingredientId
              ? { ingredientId: candidate.ingredientId }
              : { normalizedUnmatchedText: candidate.normalizedName }),
          },
          orderBy: { createdAt: 'asc' },
        });
        let pantryItemId: string;
        let action: 'CREATED' | 'UPDATED';
        if (existing) {
          const beforeQuantity = existing.quantity.toNumber();
          const beforeGrams = existing.normalizedGrams?.toNumber() ?? null;
          const afterQuantity = beforeQuantity + quantity;
          const afterGrams =
            beforeGrams !== null && request.conversion.normalizedGrams !== null
              ? beforeGrams + request.conversion.normalizedGrams
              : null;
          const updated = await transaction.pantryItem.update({
            where: { id: existing.id },
            data: {
              quantity: afterQuantity,
              normalizedGrams: afterGrams,
              confidence: Math.min(existing.confidence.toNumber(), candidate.confidence.toNumber()),
              version: { increment: 1 },
            },
          });
          await transaction.pantryAdjustment.create({
            data: {
              ownerId: data.ownerId,
              pantryItemId: existing.id,
              type: PantryAdjustmentType.ADJUST,
              idempotencyKey: `receipt:${job.id}:${candidate.id}`,
              requestHash: data.requestHash,
              inputQuantity: quantity,
              inputUnit: candidate.unit,
              appliedDeltaQuantity: quantity,
              normalizedDeltaGrams: request.conversion.normalizedGrams,
              beforeQuantity,
              afterQuantity,
              beforeGrams,
              afterGrams,
              versionBefore: existing.version,
              versionAfter: updated.version,
              reason: 'User-confirmed receipt candidate',
            },
          });
          pantryItemId = existing.id;
          action = 'UPDATED';
        } else {
          const created = await transaction.pantryItem.create({
            data: {
              ownerId: data.ownerId,
              ingredientId: candidate.ingredientId,
              unmatchedText: candidate.ingredientId ? null : candidate.detectedName,
              normalizedUnmatchedText: candidate.ingredientId ? null : candidate.normalizedName,
              quantity,
              unit: candidate.unit,
              normalizedGrams: request.conversion.normalizedGrams,
              conversionStatus: request.conversion.status,
              conversionSource: request.conversion.source,
              conversionVersion: request.conversion.version,
              conversionConfidence: request.conversion.confidence,
              source: PantryItemSource.RECEIPT,
              sourceReferenceId: job.id,
              confidence: candidate.confidence,
              confirmationStatus: PantryConfirmationStatus.CONFIRMED,
              purchasedAt: job.purchasedAt,
            },
          });
          await transaction.pantryAdjustment.create({
            data: {
              ownerId: data.ownerId,
              pantryItemId: created.id,
              type: PantryAdjustmentType.CREATE,
              idempotencyKey: `receipt:${job.id}:${candidate.id}`,
              requestHash: data.requestHash,
              inputQuantity: quantity,
              inputUnit: candidate.unit,
              appliedDeltaQuantity: quantity,
              normalizedDeltaGrams: request.conversion.normalizedGrams,
              beforeQuantity: 0,
              afterQuantity: quantity,
              beforeGrams: request.conversion.normalizedGrams === null ? null : 0,
              afterGrams: request.conversion.normalizedGrams,
              versionBefore: 0,
              versionAfter: 1,
              reason: 'User-confirmed receipt candidate',
            },
          });
          pantryItemId = created.id;
          action = 'CREATED';
        }
        changes.push({ candidateId: candidate.id, action });
        await transaction.receiptCandidate.update({
          where: { id: candidate.id },
          data: { status: ReceiptCandidateStatus.CONFIRMED, pantryItemId, pantryAction: action },
        });
      }
      await transaction.receiptCandidate.updateMany({
        where: {
          jobId: job.id,
          id: { notIn: [...requested.keys()] },
          status: { in: [ReceiptCandidateStatus.PROPOSED, ReceiptCandidateStatus.EDITED] },
        },
        data: { status: ReceiptCandidateStatus.REJECTED, version: { increment: 1 } },
      });
      await transaction.receiptJob.update({
        where: { id: job.id },
        data: {
          status: ReceiptJobStatus.CONFIRMED,
          confirmationKey: data.idempotencyKey,
          confirmationHash: data.requestHash,
          confirmedAt: new Date(),
        },
      });
      return {
        job: await transaction.receiptJob.findUniqueOrThrow({ where: { id: job.id }, include: jobInclude }),
        changes,
      };
    });
  }

  findPublishedRecipes(ids: string[]) {
    return this.prisma.post.findMany({
      where: { id: { in: ids }, type: 'RECIPE', status: 'PUBLISHED', publishedRevisionId: { not: null } },
      include: {
        publishedRevision: {
          include: {
            recipeDetail: true,
            ingredients: { include: { ingredient: { select: { id: true, canonicalName: true } } }, orderBy: { position: 'asc' } },
          },
        },
      },
    });
  }

  findOwnedCustomMeals(ownerId: string, ids: string[]) {
    return this.prisma.customMeal.findMany({
      where: { id: { in: ids }, ownerId, deletedAt: null },
      include: {
        ingredients: { include: { ingredient: { select: { id: true, canonicalName: true } } }, orderBy: { position: 'asc' } },
      },
    });
  }

  findConfirmedPantry(ownerId: string, ingredientIds: string[]) {
    return this.prisma.pantryItem.findMany({
      where: {
        ownerId,
        ingredientId: { in: ingredientIds },
        confirmationStatus: PantryConfirmationStatus.CONFIRMED,
        deletedAt: null,
        quantity: { gt: 0 },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }
}
