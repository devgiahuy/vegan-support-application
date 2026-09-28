import {
  MediaAssetStatus,
  MediaKind,
  PantryAdjustmentType,
  PantryConfirmationStatus,
  PantryConversionStatus,
  PantryItemSource,
  RecognitionCandidateStatus,
  RecognitionInputStatus,
  RecognitionJobStatus,
  Prisma,
  type PrismaClient,
} from '@prisma/client';

const jobInclude = {
  inputs: {
    include: { asset: { select: { id: true, secureUrl: true } } },
    orderBy: { position: 'asc' as const },
  },
  candidates: {
    include: {
      ingredient: { select: { id: true, canonicalName: true } },
      evidence: { include: { input: { select: { id: true, position: true } } } },
      pantryItem: { include: { ingredient: { select: { id: true, canonicalName: true } } } },
    },
    orderBy: [{ createdAt: 'asc' as const }, { id: 'asc' as const }],
  },
} satisfies Prisma.RecognitionJobInclude;

export type RecognitionJobRecord = Prisma.RecognitionJobGetPayload<{ include: typeof jobInclude }>;

export interface DeduplicatedCandidateData {
  ingredientId: string | null;
  detectedName: string;
  normalizedName: string;
  quantity: number | null;
  unit: string | null;
  freshnessObservation: string | null;
  confidence: number;
  matchConfidence: number | null;
  uncertaintyNote: string | null;
  evidence: Array<{ inputId: string; confidence: number; observation: string | null }>;
}

export class RecognitionConflictError extends Error {}
export class RecognitionVersionConflictError extends Error {}

export class IngredientRecognitionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findOwnedAssets(ownerId: string, assetIds: string[]) {
    return this.prisma.mediaAsset.findMany({
      where: {
        id: { in: assetIds },
        ownerId,
        kind: MediaKind.FRIDGE_IMAGE,
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
  }): Promise<{ job: RecognitionJobRecord; created: boolean }> {
    return this.prisma.$transaction(async (transaction) => {
      const existing = await transaction.recognitionJob.findUnique({
        where: {
          ownerId_idempotencyKey: {
            ownerId: data.ownerId,
            idempotencyKey: data.idempotencyKey,
          },
        },
        include: jobInclude,
      });
      if (existing) return { job: existing, created: false };
      const job = await transaction.recognitionJob.create({
        data: {
          ownerId: data.ownerId,
          provider: data.provider,
          modelId: data.modelId,
          templateVersion: data.templateVersion,
          idempotencyKey: data.idempotencyKey,
          requestHash: data.requestHash,
          inputs: {
            create: data.assetIds.map((assetId, position) => ({ assetId, position })),
          },
        },
        include: jobInclude,
      });
      return { job, created: true };
    });
  }

  findOwnedJob(ownerId: string, id: string) {
    return this.prisma.recognitionJob.findFirst({ where: { id, ownerId }, include: jobInclude });
  }

  async startProcessing(ownerId: string, id: string): Promise<RecognitionJobRecord | null> {
    return this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.recognitionJob.updateMany({
        where: {
          id,
          ownerId,
          status: { in: [RecognitionJobStatus.QUEUED, RecognitionJobStatus.FAILED, RecognitionJobStatus.PARTIAL_FAILED] },
        },
        data: {
          status: RecognitionJobStatus.PROCESSING,
          attemptCount: { increment: 1 },
          processingStartedAt: new Date(),
          processingCompletedAt: null,
          errorCode: null,
          errorMessage: null,
        },
      });
      if (!updated.count) return null;
      await transaction.recognitionCandidate.deleteMany({ where: { jobId: id } });
      await transaction.recognitionInput.updateMany({
        where: { jobId: id },
        data: { status: RecognitionInputStatus.PENDING, errorCode: null, errorMessage: null },
      });
      return transaction.recognitionJob.findUniqueOrThrow({ where: { id }, include: jobInclude });
    });
  }

  async saveResults(
    jobId: string,
    inputResults: Array<{ inputId: string; error: { code: string; message: string } | null }>,
    candidates: DeduplicatedCandidateData[],
  ): Promise<RecognitionJobRecord> {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.recognitionJob.findUniqueOrThrow({ where: { id: jobId } });
      if (current.status !== RecognitionJobStatus.PROCESSING) {
        return transaction.recognitionJob.findUniqueOrThrow({ where: { id: jobId }, include: jobInclude });
      }
      for (const result of inputResults) {
        await transaction.recognitionInput.update({
          where: { id: result.inputId },
          data: result.error
            ? {
                status: RecognitionInputStatus.FAILED,
                errorCode: result.error.code,
                errorMessage: result.error.message,
              }
            : { status: RecognitionInputStatus.PROCESSED, errorCode: null, errorMessage: null },
        });
      }
      for (const candidate of candidates) {
        await transaction.recognitionCandidate.create({
          data: {
            jobId,
            ingredientId: candidate.ingredientId,
            detectedName: candidate.detectedName,
            normalizedName: candidate.normalizedName,
            quantity: candidate.quantity,
            unit: candidate.unit,
            freshnessObservation: candidate.freshnessObservation,
            confidence: candidate.confidence,
            matchConfidence: candidate.matchConfidence,
            uncertaintyNote: candidate.uncertaintyNote,
            evidence: { create: candidate.evidence },
          },
        });
      }
      const failedCount = inputResults.filter((result) => result.error).length;
      const status =
        failedCount === inputResults.length
          ? RecognitionJobStatus.FAILED
          : failedCount > 0
            ? RecognitionJobStatus.PARTIAL_FAILED
            : RecognitionJobStatus.READY;
      await transaction.recognitionJob.update({
        where: { id: jobId },
        data: {
          status,
          processingCompletedAt: new Date(),
          errorCode: failedCount > 0 ? 'PARTIAL_PROVIDER_FAILURE' : null,
          errorMessage:
            failedCount > 0
              ? `${String(failedCount)} image(s) could not be analyzed; available results are retained.`
              : null,
        },
      });
      return transaction.recognitionJob.findUniqueOrThrow({ where: { id: jobId }, include: jobInclude });
    });
  }

  async markFailed(jobId: string, code: string, message: string): Promise<void> {
    await this.prisma.recognitionJob.updateMany({
      where: { id: jobId, status: RecognitionJobStatus.PROCESSING },
      data: {
        status: RecognitionJobStatus.FAILED,
        errorCode: code,
        errorMessage: message,
        processingCompletedAt: new Date(),
      },
    });
  }

  async resolveIngredient(normalizedName: string) {
    const direct = await this.prisma.ingredient.findFirst({
      where: { normalizedName, status: 'ACTIVE' },
      select: { id: true, canonicalName: true },
    });
    if (direct) return direct;
    const alias = await this.prisma.ingredientAlias.findFirst({
      where: { normalizedAlias: normalizedName, reviewStatus: 'APPROVED', ingredient: { status: 'ACTIVE' } },
      select: { ingredient: { select: { id: true, canonicalName: true } } },
    });
    return alias?.ingredient ?? null;
  }

  resolveIngredientById(id: string) {
    return this.prisma.ingredient.findFirst({
      where: { id, status: 'ACTIVE' },
      select: { id: true, canonicalName: true },
    });
  }

  async updateCandidate(
    ownerId: string,
    jobId: string,
    candidateId: string,
    expectedVersion: number,
    data: Prisma.RecognitionCandidateUncheckedUpdateManyInput,
  ): Promise<RecognitionJobRecord | null> {
    return this.prisma.$transaction(async (transaction) => {
      const job = await transaction.recognitionJob.findFirst({ where: { id: jobId, ownerId } });
      if (!job) return null;
      if (
        job.status !== RecognitionJobStatus.READY &&
        job.status !== RecognitionJobStatus.PARTIAL_FAILED
      ) {
        throw new RecognitionConflictError();
      }
      const updated = await transaction.recognitionCandidate.updateMany({
        where: { id: candidateId, jobId, version: expectedVersion },
        data: { ...data, version: { increment: 1 } },
      });
      if (!updated.count) throw new RecognitionVersionConflictError();
      return transaction.recognitionJob.findUniqueOrThrow({ where: { id: jobId }, include: jobInclude });
    });
  }

  async cancel(ownerId: string, id: string): Promise<RecognitionJobRecord | null> {
    return this.prisma.$transaction(async (transaction) => {
      const job = await transaction.recognitionJob.findFirst({ where: { id, ownerId } });
      if (!job) return null;
      if (job.status === RecognitionJobStatus.CANCELLED) {
        return transaction.recognitionJob.findUniqueOrThrow({ where: { id }, include: jobInclude });
      }
      if (job.status === RecognitionJobStatus.CONFIRMED) throw new RecognitionConflictError();
      await transaction.recognitionJob.update({
        where: { id },
        data: { status: RecognitionJobStatus.CANCELLED, cancelledAt: new Date() },
      });
      return transaction.recognitionJob.findUniqueOrThrow({ where: { id }, include: jobInclude });
    });
  }

  async queueRetry(
    ownerId: string,
    id: string,
    idempotencyKey: string,
    requestHash: string,
  ): Promise<{ job: RecognitionJobRecord; replay: boolean } | null> {
    return this.prisma.$transaction(async (transaction) => {
      const job = await transaction.recognitionJob.findFirst({ where: { id, ownerId } });
      if (!job) return null;
      if (job.lastRetryKey === idempotencyKey) {
        if (job.lastRetryHash !== requestHash) throw new RecognitionConflictError();
        return {
          job: await transaction.recognitionJob.findUniqueOrThrow({ where: { id }, include: jobInclude }),
          replay: true,
        };
      }
      if (
        job.status !== RecognitionJobStatus.FAILED &&
        job.status !== RecognitionJobStatus.PARTIAL_FAILED
      ) {
        throw new RecognitionConflictError();
      }
      await transaction.recognitionJob.update({
        where: { id },
        data: {
          status: RecognitionJobStatus.QUEUED,
          lastRetryKey: idempotencyKey,
          lastRetryHash: requestHash,
        },
      });
      return {
        job: await transaction.recognitionJob.findUniqueOrThrow({ where: { id }, include: jobInclude }),
        replay: false,
      };
    });
  }

  async confirm(data: {
    ownerId: string;
    jobId: string;
    candidates: Array<{ id: string; expectedVersion: number }>;
    idempotencyKey: string;
    requestHash: string;
  }): Promise<{ job: RecognitionJobRecord; changes: Array<{ candidateId: string; action: 'CREATED' | 'UPDATED' }> }> {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw(Prisma.sql`SELECT id FROM users WHERE id = ${data.ownerId}::uuid FOR UPDATE`);
      const job = await transaction.recognitionJob.findFirst({
        where: { id: data.jobId, ownerId: data.ownerId },
        include: jobInclude,
      });
      if (!job) throw new RecognitionConflictError();
      if (job.status === RecognitionJobStatus.CONFIRMED) {
        if (job.confirmationKey !== data.idempotencyKey || job.confirmationHash !== data.requestHash) {
          throw new RecognitionConflictError();
        }
        return {
          job,
          changes: job.candidates
            .filter((candidate) => candidate.status === RecognitionCandidateStatus.CONFIRMED)
            .map((candidate) => ({
              candidateId: candidate.id,
              action: candidate.pantryAction === 'UPDATED' ? ('UPDATED' as const) : ('CREATED' as const),
            })),
        };
      }
      if (
        job.status !== RecognitionJobStatus.READY &&
        job.status !== RecognitionJobStatus.PARTIAL_FAILED
      ) {
        throw new RecognitionConflictError();
      }
      const requested = new Map(data.candidates.map((candidate) => [candidate.id, candidate.expectedVersion]));
      const selected = job.candidates.filter((candidate) => requested.has(candidate.id));
      if (selected.length !== requested.size) throw new RecognitionConflictError();
      const changes: Array<{ candidateId: string; action: 'CREATED' | 'UPDATED' }> = [];
      for (const candidate of selected) {
        if (
          candidate.version !== requested.get(candidate.id) ||
          candidate.status === RecognitionCandidateStatus.REJECTED ||
          candidate.quantity === null ||
          !candidate.unit
        ) {
          throw new RecognitionVersionConflictError();
        }
        const quantity = candidate.quantity.toNumber();
        const unit = candidate.unit;
        const massFactor = this.massFactor(unit);
        const deltaGrams = massFactor === null ? null : quantity * massFactor;
        const existing = await transaction.pantryItem.findFirst({
          where: {
            ownerId: data.ownerId,
            deletedAt: null,
            confirmationStatus: PantryConfirmationStatus.CONFIRMED,
            unit,
            ...(candidate.ingredientId
              ? { ingredientId: candidate.ingredientId }
              : { normalizedUnmatchedText: candidate.normalizedName }),
          },
          orderBy: { createdAt: 'asc' },
        });
        let pantryItemId: string;
        if (existing) {
          const beforeQuantity = existing.quantity.toNumber();
          const afterQuantity = beforeQuantity + quantity;
          const beforeGrams = existing.normalizedGrams?.toNumber() ?? null;
          const afterGrams = beforeGrams !== null && deltaGrams !== null ? beforeGrams + deltaGrams : null;
          const updated = await transaction.pantryItem.update({
            where: { id: existing.id },
            data: {
              quantity: afterQuantity,
              normalizedGrams: afterGrams,
              confidence: Math.min(existing.confidence.toNumber(), candidate.confidence.toNumber()),
              freshnessNote: candidate.freshnessObservation,
              version: { increment: 1 },
            },
          });
          await transaction.pantryAdjustment.create({
            data: {
              ownerId: data.ownerId,
              pantryItemId: existing.id,
              type: PantryAdjustmentType.ADJUST,
              idempotencyKey: `vision:${job.id}:${candidate.id}`,
              requestHash: data.requestHash,
              inputQuantity: quantity,
              inputUnit: unit,
              appliedDeltaQuantity: quantity,
              normalizedDeltaGrams: deltaGrams,
              beforeQuantity,
              afterQuantity,
              beforeGrams,
              afterGrams,
              versionBefore: existing.version,
              versionAfter: updated.version,
              reason: 'User-confirmed fridge recognition candidate',
            },
          });
          pantryItemId = existing.id;
          changes.push({ candidateId: candidate.id, action: 'UPDATED' });
        } else {
          const created = await transaction.pantryItem.create({
            data: {
              ownerId: data.ownerId,
              ingredientId: candidate.ingredientId,
              unmatchedText: candidate.ingredientId ? null : candidate.detectedName,
              normalizedUnmatchedText: candidate.ingredientId ? null : candidate.normalizedName,
              quantity,
              unit,
              normalizedGrams: deltaGrams,
              conversionStatus:
                deltaGrams === null ? PantryConversionStatus.UNKNOWN : PantryConversionStatus.CONVERTED,
              conversionSource: deltaGrams === null ? null : 'SYSTEM_MASS',
              conversionVersion: deltaGrams === null ? null : 'UCUM-MASS-V1',
              conversionConfidence: deltaGrams === null ? null : 1,
              source: PantryItemSource.FRIDGE_RECOGNITION,
              sourceReferenceId: job.id,
              confidence: candidate.confidence,
              confirmationStatus: PantryConfirmationStatus.CONFIRMED,
              freshnessNote: candidate.freshnessObservation,
            },
          });
          await transaction.pantryAdjustment.create({
            data: {
              ownerId: data.ownerId,
              pantryItemId: created.id,
              type: PantryAdjustmentType.CREATE,
              idempotencyKey: `vision:${job.id}:${candidate.id}`,
              requestHash: data.requestHash,
              inputQuantity: quantity,
              inputUnit: unit,
              appliedDeltaQuantity: quantity,
              normalizedDeltaGrams: deltaGrams,
              beforeQuantity: 0,
              afterQuantity: quantity,
              beforeGrams: deltaGrams === null ? null : 0,
              afterGrams: deltaGrams,
              versionBefore: 0,
              versionAfter: 1,
              reason: 'User-confirmed fridge recognition candidate',
            },
          });
          pantryItemId = created.id;
          changes.push({ candidateId: candidate.id, action: 'CREATED' });
        }
        await transaction.recognitionCandidate.update({
          where: { id: candidate.id },
          data: {
            status: RecognitionCandidateStatus.CONFIRMED,
            pantryItemId,
            pantryAction: changes.at(-1)!.action,
          },
        });
      }
      await transaction.recognitionCandidate.updateMany({
        where: {
          jobId: job.id,
          id: { notIn: [...requested.keys()] },
          status: { in: [RecognitionCandidateStatus.PROPOSED, RecognitionCandidateStatus.EDITED] },
        },
        data: { status: RecognitionCandidateStatus.REJECTED, version: { increment: 1 } },
      });
      await transaction.recognitionJob.update({
        where: { id: job.id },
        data: {
          status: RecognitionJobStatus.CONFIRMED,
          confirmationKey: data.idempotencyKey,
          confirmationHash: data.requestHash,
          confirmedAt: new Date(),
        },
      });
      return {
        job: await transaction.recognitionJob.findUniqueOrThrow({ where: { id: job.id }, include: jobInclude }),
        changes,
      };
    });
  }

  private massFactor(unit: string): number | null {
    const normalized = unit.trim().toLowerCase();
    if (['g', 'gram', 'grams'].includes(normalized)) return 1;
    if (['kg', 'kilogram', 'kilograms'].includes(normalized)) return 1000;
    if (['mg', 'milligram', 'milligrams'].includes(normalized)) return 0.001;
    return null;
  }
}
