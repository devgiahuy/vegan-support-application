import { AppError } from '../../common/errors/app-error.js';
import type { EntitlementService } from '../entitlements/entitlement.service.js';
import { lockDocument } from '../../database/locking.js';
import { planAppendedCandidates } from './ingredient-recognition.merge.js';
import type { Prisma } from '@prisma/client';
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
  type PrismaClient,
} from '@prisma/client';

const jobInclude = {
  inputs: {
    include: { asset: { select: { id: true, secureUrl: true, providerEtag: true } } },
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
export class RecognitionIncompleteError extends Error {}

export class IngredientRecognitionRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly entitlements?: EntitlementService,
  ) {}

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
      await lockDocument(transaction, 'user', { id: data.ownerId });
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
      await this.entitlements?.reserve(transaction, data.ownerId, 'FRIDGE', 'FRIDGE:' + job.id);
      return { job, created: true };
    });
  }

  async findOwnedJob(ownerId: string, id: string) {
    await this.entitlements?.recover(new Date(), ownerId);
    return this.prisma.recognitionJob.findFirst({ where: { id, ownerId }, include: jobInclude });
  }

  async startProcessing(ownerId: string, id: string): Promise<RecognitionJobRecord | null> {
    return this.prisma.$transaction(async (transaction) => {
      await lockDocument(transaction, 'user', { id: ownerId });
      const updated = await transaction.recognitionJob.updateMany({
        where: {
          id,
          ownerId,
          status: RecognitionJobStatus.QUEUED,
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
      const pending = await transaction.recognitionInput.count({
        where: { jobId: id, status: RecognitionInputStatus.PENDING },
      });
      // Stored candidates (and the user's edits to them) are never discarded. A job with images
      // waiting for analysis (newly added, or interrupted) only analyses those. Otherwise this is
      // a retry, which re-runs just the images that failed.
      if (!pending)
        await transaction.recognitionInput.updateMany({
          where: { jobId: id, status: RecognitionInputStatus.FAILED },
          data: { status: RecognitionInputStatus.PENDING, errorCode: null, errorMessage: null },
        });
      return transaction.recognitionJob.findUniqueOrThrow({ where: { id }, include: jobInclude });
    });
  }

  /**
   * Attaches additional images to a reviewable job and queues them for analysis. Existing
   * candidates are kept; the new readings are merged in when processing completes. The usage
   * reservation is keyed by job, so an already-spent job does not consume another credit.
   */
  async appendInputs(
    ownerId: string,
    id: string,
    assetIds: string[],
  ): Promise<{ job: RecognitionJobRecord; queued: boolean } | null> {
    return this.prisma.$transaction(async (transaction) => {
      await lockDocument(transaction, 'user', { id: ownerId });
      const job = await transaction.recognitionJob.findFirst({
        where: { id, ownerId },
        include: jobInclude,
      });
      if (!job) return null;
      if (
        job.status !== RecognitionJobStatus.READY &&
        job.status !== RecognitionJobStatus.PARTIAL_FAILED &&
        job.status !== RecognitionJobStatus.FAILED
      )
        throw new RecognitionConflictError();
      const attached = new Set(job.inputs.map((input) => input.assetId));
      const fresh = assetIds.filter((assetId) => !attached.has(assetId));
      if (!fresh.length) return { job, queued: false };
      const firstPosition = Math.max(-1, ...job.inputs.map((input) => input.position)) + 1;
      await this.entitlements?.reserve(transaction, ownerId, 'FRIDGE', 'FRIDGE:' + id);
      for (const [offset, assetId] of fresh.entries())
        await transaction.recognitionInput.create({
          data: { jobId: id, assetId, position: firstPosition + offset },
        });
      await transaction.recognitionJob.update({
        where: { id },
        data: {
          status: RecognitionJobStatus.QUEUED,
          queuedAt: new Date(),
          errorCode: null,
          errorMessage: null,
        },
      });
      return {
        job: await transaction.recognitionJob.findUniqueOrThrow({
          where: { id },
          include: jobInclude,
        }),
        queued: true,
      };
    });
  }

  async saveResults(
    jobId: string,
    inputResults: Array<{ inputId: string; error: { code: string; message: string } | null }>,
    candidates: DeduplicatedCandidateData[],
    expectedAttempt?: number,
  ): Promise<RecognitionJobRecord> {
    return this.prisma.$transaction(async (transaction) => {
      const current = await transaction.recognitionJob.findUniqueOrThrow({ where: { id: jobId } });
      if (
        current.status !== RecognitionJobStatus.PROCESSING ||
        (expectedAttempt !== undefined && current.attemptCount !== expectedAttempt)
      ) {
        return transaction.recognitionJob.findUniqueOrThrow({
          where: { id: jobId },
          include: jobInclude,
        });
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
      const stored = await transaction.recognitionCandidate.findMany({
        where: { jobId },
        include: { evidence: { select: { inputId: true } } },
      });
      const plan = planAppendedCandidates(
        stored.map((candidate) => ({
          id: candidate.id,
          ingredientId: candidate.ingredientId,
          normalizedName: candidate.normalizedName,
          quantity: candidate.quantity,
          unit: candidate.unit,
          confidence: candidate.confidence,
          status: candidate.status,
          editedByUser: candidate.editedByUser,
          evidenceInputIds: candidate.evidence.map((item) => item.inputId),
        })),
        candidates,
      );
      for (const update of plan.updates) {
        if (update.data)
          await transaction.recognitionCandidate.update({
            where: { id: update.id },
            data: { ...update.data, version: { increment: 1 } },
          });
        if (update.evidence.length)
          await transaction.recognitionCandidateEvidence.createMany({
            data: update.evidence.map((item) => ({ candidateId: update.id, ...item })),
          });
      }
      for (const candidate of plan.creates) {
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
      // Status reflects every image on the job, not only the ones analysed in this pass.
      const allInputs = await transaction.recognitionInput.findMany({
        where: { jobId },
        select: { status: true },
      });
      const failedCount = allInputs.filter(
        (input) => input.status === RecognitionInputStatus.FAILED,
      ).length;
      await this.entitlements?.settle(
        transaction,
        'FRIDGE:' + jobId,
        inputResults.some((result) => !result.error),
      );
      const status =
        failedCount === allInputs.length
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
              ? `Không thể phân tích ${String(failedCount)} ảnh; kết quả hợp lệ từ các ảnh khác vẫn được giữ lại.`
              : null,
        },
      });
      return transaction.recognitionJob.findUniqueOrThrow({
        where: { id: jobId },
        include: jobInclude,
      });
    });
  }

  async markFailed(
    jobId: string,
    code: string,
    message: string,
    expectedAttempt?: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const job = await transaction.recognitionJob.findUnique({ where: { id: jobId } });
      if (
        !job ||
        job.status !== RecognitionJobStatus.PROCESSING ||
        (expectedAttempt !== undefined && job.attemptCount !== expectedAttempt)
      )
        return;
      await lockDocument(transaction, 'user', { id: job.ownerId });
      await transaction.recognitionJob.update({
        where: { id: jobId },
        data: {
          status: RecognitionJobStatus.FAILED,
          errorCode: code,
          errorMessage: message,
          processingCompletedAt: new Date(),
        },
      });
      await this.entitlements?.settle(transaction, 'FRIDGE:' + jobId, false);
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
        reviewStatus: 'APPROVED',
        ingredient: { status: 'ACTIVE' },
      },
      select: { ingredient: { select: { id: true, canonicalName: true } } },
    });
    return alias?.ingredient ?? null;
  }

  async resolveIngredients(normalizedNames: string[]) {
    const uniqueNames = [...new Set(normalizedNames)];
    if (uniqueNames.length === 0)
      return new Map<string, { id: string; canonicalName: string }>();
    const [direct, aliases] = await Promise.all([
      this.prisma.ingredient.findMany({
        where: { normalizedName: { in: uniqueNames }, status: 'ACTIVE' },
        select: { id: true, canonicalName: true, normalizedName: true },
      }),
      this.prisma.ingredientAlias.findMany({
        where: {
          normalizedAlias: { in: uniqueNames },
          reviewStatus: 'APPROVED',
          ingredient: { status: 'ACTIVE' },
        },
        select: {
          normalizedAlias: true,
          ingredient: { select: { id: true, canonicalName: true } },
        },
      }),
    ]);
    const resolved = new Map<string, { id: string; canonicalName: string }>();
    for (const ingredient of direct) resolved.set(ingredient.normalizedName, ingredient);
    for (const alias of aliases)
      if (!resolved.has(alias.normalizedAlias)) resolved.set(alias.normalizedAlias, alias.ingredient);
    return resolved;
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
      return transaction.recognitionJob.findUniqueOrThrow({
        where: { id: jobId },
        include: jobInclude,
      });
    });
  }

  async cancel(ownerId: string, id: string): Promise<RecognitionJobRecord | null> {
    return this.prisma.$transaction(async (transaction) => {
      await lockDocument(transaction, 'user', { id: ownerId });
      const job = await transaction.recognitionJob.findFirst({ where: { id, ownerId } });
      if (!job) return null;
      if (job.status === RecognitionJobStatus.CANCELLED) {
        return transaction.recognitionJob.findUniqueOrThrow({ where: { id }, include: jobInclude });
      }
      if (job.status === RecognitionJobStatus.CONFIRMED) throw new RecognitionConflictError();
      await this.entitlements?.settle(transaction, 'FRIDGE:' + id, false);
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
      await lockDocument(transaction, 'user', { id: ownerId });
      const job = await transaction.recognitionJob.findFirst({ where: { id, ownerId } });
      if (!job) return null;
      if (job.lastRetryKey === idempotencyKey) {
        if (job.lastRetryHash !== requestHash) throw new RecognitionConflictError();
        return {
          job: await transaction.recognitionJob.findUniqueOrThrow({
            where: { id },
            include: jobInclude,
          }),
          replay: true,
        };
      }
      if (
        job.status !== RecognitionJobStatus.FAILED &&
        job.status !== RecognitionJobStatus.PARTIAL_FAILED
      ) {
        throw new RecognitionConflictError();
      }
      if (
        this.entitlements?.config.billing.enabled &&
        job.attemptCount >= this.entitlements.config.billing.scanMaxAttempts
      )
        throw new AppError({
          statusCode: 409,
          code: 'SCAN_RETRY_LIMIT_EXCEEDED',
          message: 'Đã hết số lần thử lại cho tác vụ này. Tạo tác vụ mới để tiếp tục.',
        });
      await this.entitlements?.reserve(transaction, ownerId, 'FRIDGE', 'FRIDGE:' + id);
      await transaction.recognitionJob.update({
        where: { id },
        data: {
          status: RecognitionJobStatus.QUEUED,
          lastRetryKey: idempotencyKey,
          queuedAt: new Date(),
          lastRetryHash: requestHash,
        },
      });
      return {
        job: await transaction.recognitionJob.findUniqueOrThrow({
          where: { id },
          include: jobInclude,
        }),
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
  }): Promise<{
    job: RecognitionJobRecord;
    changes: Array<{ candidateId: string; action: 'CREATED' | 'UPDATED' }>;
  }> {
    return this.prisma.$transaction(async (transaction) => {
      await lockDocument(transaction, 'user', { id: data.ownerId });
      const job = await transaction.recognitionJob.findFirst({
        where: { id: data.jobId, ownerId: data.ownerId },
        include: jobInclude,
      });
      if (!job) throw new RecognitionConflictError();
      if (job.status === RecognitionJobStatus.CONFIRMED) {
        if (
          job.confirmationKey !== data.idempotencyKey ||
          job.confirmationHash !== data.requestHash
        ) {
          throw new RecognitionConflictError();
        }
        return {
          job,
          changes: job.candidates
            .filter((candidate) => candidate.status === RecognitionCandidateStatus.CONFIRMED)
            .map((candidate) => ({
              candidateId: candidate.id,
              action:
                candidate.pantryAction === 'UPDATED' ? ('UPDATED' as const) : ('CREATED' as const),
            })),
        };
      }
      if (
        job.status !== RecognitionJobStatus.READY &&
        job.status !== RecognitionJobStatus.PARTIAL_FAILED
      ) {
        throw new RecognitionConflictError();
      }
      const requested = new Map(
        data.candidates.map((candidate) => [candidate.id, candidate.expectedVersion]),
      );
      const selected = job.candidates.filter((candidate) => requested.has(candidate.id));
      if (selected.length !== requested.size) throw new RecognitionConflictError();
      const changes: Array<{ candidateId: string; action: 'CREATED' | 'UPDATED' }> = [];
      for (const candidate of selected) {
        if (
          candidate.version !== requested.get(candidate.id) ||
          candidate.status === RecognitionCandidateStatus.REJECTED
        ) {
          throw new RecognitionVersionConflictError();
        }
        if (candidate.quantity === null || !candidate.unit) {
          throw new RecognitionIncompleteError();
        }
        const quantity = candidate.quantity;
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
          const beforeQuantity = existing.quantity;
          const afterQuantity = beforeQuantity + quantity;
          const beforeGrams = existing.normalizedGrams ?? null;
          const afterGrams =
            beforeGrams !== null && deltaGrams !== null ? beforeGrams + deltaGrams : null;
          const updated = await transaction.pantryItem.update({
            where: { id: existing.id },
            data: {
              quantity: afterQuantity,
              normalizedGrams: afterGrams,
              confidence: Math.min(existing.confidence, candidate.confidence),
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
          await this.entitlements?.assertPantryCapacity(transaction, data.ownerId);
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
                deltaGrams === null
                  ? PantryConversionStatus.UNKNOWN
                  : PantryConversionStatus.CONVERTED,
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
        job: await transaction.recognitionJob.findUniqueOrThrow({
          where: { id: job.id },
          include: jobInclude,
        }),
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
