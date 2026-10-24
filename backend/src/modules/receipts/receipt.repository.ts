import { AppError } from '../../common/errors/app-error.js';
import type { EntitlementService } from '../entitlements/entitlement.service.js';
import { lockDocument } from '../../database/locking.js';
import {
  compareReceiptImages,
  mergeReceiptLines,
  receiptLineKeys,
  type ReceiptImageIdentity,
  type ReceiptLineIdentity,
} from './receipt.dedup.js';
import type { Prisma } from '@prisma/client';
import {
  FoodDataReviewStatus,
  MediaAssetStatus,
  MediaKind,
  PantryAdjustmentType,
  PantryConfirmationStatus,
  PantryItemSource,
  ReceiptCandidateStatus,
  ReceiptInputStatus,
  ReceiptJobStatus,
  type PantryConversionStatus,
  type PrismaClient,
} from '@prisma/client';

const jobInclude = {
  inputs: {
    include: { asset: { select: { id: true, secureUrl: true, providerEtag: true } } },
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

function imageIdentity(input: ReceiptJobRecord['inputs'][number]): ReceiptImageIdentity {
  return {
    inputId: input.id,
    receiptNumber: input.receiptNumber,
    merchantName: input.merchantName,
    purchasedAt: input.purchasedAt?.toISOString().slice(0, 10) ?? null,
    currency: input.currency,
    totalAmount: input.totalAmount,
  };
}

function linesForInput(job: ReceiptJobRecord, inputId: string): ReceiptLineIdentity[] {
  return job.candidates.filter((candidate) => candidate.inputId === inputId);
}

function comparisonLines(job: ReceiptJobRecord, inputId: string): ReceiptLineIdentity[] {
  const input = job.inputs.find((item) => item.id === inputId);
  if (!input || job.receiptReviewDecision !== 'SAME_RECEIPT')
    return linesForInput(job, inputId);
  const relatedInputIds = new Set(
    job.inputs
      .filter(
        (source) =>
          compareReceiptImages(
            imageIdentity(input),
            linesForInput(job, input.id),
            imageIdentity(source),
            linesForInput(job, source.id),
          ) !== 'DISTINCT',
      )
      .map((source) => source.id),
  );
  return job.candidates.filter((candidate) => {
    if (candidate.status !== ReceiptCandidateStatus.CONFIRMED || candidate.duplicateOfJobId)
      return false;
    return relatedInputIds.has(candidate.inputId);
  });
}

function matchingLine(left: ReceiptLineIdentity, right: ReceiptLineIdentity): boolean {
  const keys = new Set(receiptLineKeys(right));
  return receiptLineKeys(left).some((key) => keys.has(key));
}

export class ReceiptRepository {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly entitlements?: EntitlementService,
  ) {}

  private async confirmedJobsOnDates(
    transaction: Prisma.TransactionClient,
    ownerId: string,
    currentJobId: string,
    inputs: Array<{ purchasedAt: Date | null }>,
  ): Promise<ReceiptJobRecord[]> {
    const dates = [
      ...new Set(
        inputs.flatMap((input) => (input.purchasedAt ? [input.purchasedAt.toISOString()] : [])),
      ),
    ].map((value) => new Date(value));
    if (!dates.length) return [];
    const matchedInputs = await transaction.receiptInput.findMany({
      where: {
        purchasedAt: { in: dates },
        job: { ownerId, status: ReceiptJobStatus.CONFIRMED, id: { not: currentJobId } },
      },
      select: { jobId: true },
    });
    const ids = [...new Set(matchedInputs.map((input) => input.jobId))];
    if (!ids.length) return [];
    return transaction.receiptJob.findMany({ where: { id: { in: ids } }, include: jobInclude });
  }

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
      await lockDocument(transaction, 'user', { id: data.ownerId });
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
      await this.entitlements?.reserve(transaction, data.ownerId, 'RECEIPT', 'RECEIPT:' + job.id);
      return { job, created: true };
    });
  }

  async findOwnedJob(ownerId: string, id: string) {
    await this.entitlements?.recover(new Date(), ownerId);
    return this.prisma.receiptJob.findFirst({ where: { id, ownerId }, include: jobInclude });
  }

  async startProcessing(ownerId: string, id: string): Promise<ReceiptJobRecord | null> {
    return this.prisma.$transaction(async (transaction) => {
      await lockDocument(transaction, 'user', { id: ownerId });
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
      const pending = await transaction.receiptInput.count({
        where: { jobId: id, status: ReceiptInputStatus.PENDING },
      });
      // Stored candidates (and the user's edits to them) are never discarded. A job with images
      // waiting for analysis (newly added, or interrupted) only analyses those. Otherwise this is
      // a retry, which re-runs just the images that failed.
      if (!pending)
        await transaction.receiptInput.updateMany({
          where: { jobId: id, status: ReceiptInputStatus.FAILED },
          data: { status: ReceiptInputStatus.PENDING, errorCode: null, errorMessage: null },
        });
      return transaction.receiptJob.findUniqueOrThrow({ where: { id }, include: jobInclude });
    });
  }

  /**
   * Attaches additional images to a reviewable job and queues them for analysis. Existing
   * candidates are kept; the new lines are merged in when processing completes. The usage
   * reservation is keyed by job, so an already-spent job does not consume another credit.
   */
  async appendInputs(
    ownerId: string,
    id: string,
    assetIds: string[],
  ): Promise<{ job: ReceiptJobRecord; queued: boolean } | null> {
    return this.prisma.$transaction(async (transaction) => {
      await lockDocument(transaction, 'user', { id: ownerId });
      const job = await transaction.receiptJob.findFirst({
        where: { id, ownerId },
        include: jobInclude,
      });
      if (!job) return null;
      if (
        job.status !== ReceiptJobStatus.READY &&
        job.status !== ReceiptJobStatus.PARTIAL_FAILED &&
        job.status !== ReceiptJobStatus.FAILED
      )
        throw new ReceiptConflictError();
      const attached = new Set(job.inputs.map((input) => input.assetId));
      const fresh = assetIds.filter((assetId) => !attached.has(assetId));
      if (!fresh.length) return { job, queued: false };
      const firstPosition = Math.max(-1, ...job.inputs.map((input) => input.position)) + 1;
      await this.entitlements?.reserve(transaction, ownerId, 'RECEIPT', 'RECEIPT:' + id);
      for (const [offset, assetId] of fresh.entries())
        await transaction.receiptInput.create({
          data: { jobId: id, assetId, position: firstPosition + offset },
        });
      await transaction.receiptJob.update({
        where: { id },
        data: {
          status: ReceiptJobStatus.QUEUED,
          queuedAt: new Date(),
          errorCode: null,
          errorMessage: null,
        },
      });
      return {
        job: await transaction.receiptJob.findUniqueOrThrow({ where: { id }, include: jobInclude }),
        queued: true,
      };
    });
  }

  async saveResults(data: {
    jobId: string;
    expectedAttempt?: number;
    inputs: Array<{
      inputId: string;
      error: { code: string; message: string } | null;
      receiptNumber: string | null;
      merchantName: string | null;
      purchasedAt: Date | null;
      currency: string | null;
      totalAmount: number | null;
    }>;
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
      if (
        current.status !== ReceiptJobStatus.PROCESSING ||
        (data.expectedAttempt !== undefined && current.attemptCount !== data.expectedAttempt)
      ) {
        return transaction.receiptJob.findUniqueOrThrow({
          where: { id: data.jobId },
          include: jobInclude,
        });
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
            : {
                status: ReceiptInputStatus.PROCESSED,
                errorCode: null,
                errorMessage: null,
                receiptNumber: input.receiptNumber,
                merchantName: input.merchantName,
                purchasedAt: input.purchasedAt,
                currency: input.currency,
                totalAmount: input.totalAmount,
              },
        });
      }
      const allImageRows = await transaction.receiptInput.findMany({
        where: { jobId: data.jobId },
      });
      const images = new Map<string, ReceiptImageIdentity>(
        allImageRows.map((input) => [
          input.id,
          {
            inputId: input.id,
            receiptNumber: input.receiptNumber,
            merchantName: input.merchantName,
            purchasedAt: input.purchasedAt?.toISOString().slice(0, 10) ?? null,
            currency: input.currency,
            totalAmount: input.totalAmount,
          },
        ]),
      );
      const stored = await transaction.receiptCandidate.findMany({
        where: { jobId: data.jobId },
        select: {
          inputId: true,
          ingredientId: true,
          lineText: true,
          normalizedName: true,
          quantity: true,
          unit: true,
          lineTotal: true,
        },
      });
      const { kept, reviewRequired, identityDecisionRequired } = mergeReceiptLines(
        stored,
        data.candidates,
        images,
      );
      if (kept.length)
        await transaction.receiptCandidate.createMany({
          data: kept.map((candidate) => ({ jobId: data.jobId, ...candidate })),
        });
      const assembled = await transaction.receiptJob.findUniqueOrThrow({
        where: { id: data.jobId },
        include: jobInclude,
      });
      const priorJobs = await this.confirmedJobsOnDates(
        transaction,
        current.ownerId,
        current.id,
        assembled.inputs,
      );
      const crossJobReview = assembled.inputs.some((input) =>
        priorJobs.some((priorJob) =>
          priorJob.inputs.some(
            (priorInput) =>
              compareReceiptImages(
                imageIdentity(input),
                linesForInput(assembled, input.id),
                imageIdentity(priorInput),
                comparisonLines(priorJob, priorInput.id),
              ) === 'SAME_RECEIPT_REVIEW',
          ),
        ),
      );
      const crossJobDecision = assembled.inputs.some(
        (input) =>
          priorJobs.some((priorJob) =>
            priorJob.inputs.some(
              (priorInput) =>
                (!input.receiptNumber || !priorInput.receiptNumber) &&
                compareReceiptImages(
                  imageIdentity(input),
                  linesForInput(assembled, input.id),
                  imageIdentity(priorInput),
                  comparisonLines(priorJob, priorInput.id),
                ) === 'SAME_RECEIPT_REVIEW',
            ),
          ),
      );
      // Status reflects every image on the job, not only the ones analysed in this pass.
      const allInputs = await transaction.receiptInput.findMany({
        where: { jobId: data.jobId },
        select: { status: true },
      });
      const failedCount = allInputs.filter(
        (input) => input.status === ReceiptInputStatus.FAILED,
      ).length;
      await this.entitlements?.settle(
        transaction,
        'RECEIPT:' + data.jobId,
        data.inputs.some((input) => !input.error),
      );
      const adoptNewMetadata =
        current.metadataConfidence === null ||
        (data.metadata.confidence ?? -1) > current.metadataConfidence;
      await transaction.receiptJob.update({
        where: { id: data.jobId },
        data: {
          status:
            failedCount === allInputs.length
              ? ReceiptJobStatus.FAILED
              : failedCount > 0
                ? ReceiptJobStatus.PARTIAL_FAILED
                : ReceiptJobStatus.READY,
          ...(adoptNewMetadata
            ? {
                merchantName: data.metadata.merchantName,
                purchasedAt: data.metadata.purchasedAt,
                currency: data.metadata.currency,
                totalAmount: data.metadata.totalAmount,
                metadataConfidence: data.metadata.confidence,
              }
            : {}),
          reviewRequired: current.reviewRequired || reviewRequired || crossJobReview,
          identityDecisionRequired:
            current.identityDecisionRequired || identityDecisionRequired || crossJobDecision,
          processingCompletedAt: new Date(),
          errorCode: failedCount ? 'PARTIAL_RECEIPT_EXTRACTION' : null,
          errorMessage: failedCount
            ? `${String(failedCount)} receipt image(s) could not be extracted; available lines are retained.`
            : null,
        },
      });
      return transaction.receiptJob.findUniqueOrThrow({
        where: { id: data.jobId },
        include: jobInclude,
      });
    });
  }

  async markFailed(id: string, expectedAttempt?: number): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const job = await transaction.receiptJob.findUnique({ where: { id } });
      if (
        !job ||
        job.status !== ReceiptJobStatus.PROCESSING ||
        (expectedAttempt !== undefined && job.attemptCount !== expectedAttempt)
      )
        return;
      await lockDocument(transaction, 'user', { id: job.ownerId });
      await transaction.receiptJob.update({
        where: { id },
        data: {
          status: ReceiptJobStatus.FAILED,
          errorCode: 'RECEIPT_PROVIDER_UNAVAILABLE',
          errorMessage: 'Phân tích tạm thời không khả dụng. Lần thử này không trừ thêm lượt.',
          processingCompletedAt: new Date(),
        },
      });
      await this.entitlements?.settle(transaction, 'RECEIPT:' + id, false);
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
      return transaction.receiptJob.findUniqueOrThrow({
        where: { id: jobId },
        include: jobInclude,
      });
    });
  }

  async cancel(ownerId: string, id: string): Promise<ReceiptJobRecord | null> {
    return this.prisma.$transaction(async (transaction) => {
      await lockDocument(transaction, 'user', { id: ownerId });
      const job = await transaction.receiptJob.findFirst({ where: { id, ownerId } });
      if (!job) return null;
      if (job.status === ReceiptJobStatus.CANCELLED)
        return transaction.receiptJob.findUniqueOrThrow({ where: { id }, include: jobInclude });
      if (job.status === ReceiptJobStatus.CONFIRMED) throw new ReceiptConflictError();
      await this.entitlements?.settle(transaction, 'RECEIPT:' + id, false);
      await transaction.receiptJob.update({
        where: { id },
        data: { status: ReceiptJobStatus.CANCELLED, cancelledAt: new Date() },
      });
      return transaction.receiptJob.findUniqueOrThrow({ where: { id }, include: jobInclude });
    });
  }

  async queueRetry(ownerId: string, id: string, key: string, requestHash: string) {
    return this.prisma.$transaction(async (transaction) => {
      await lockDocument(transaction, 'user', { id: ownerId });
      const job = await transaction.receiptJob.findFirst({ where: { id, ownerId } });
      if (!job) return null;
      if (job.lastRetryKey === key) {
        if (job.lastRetryHash !== requestHash) throw new ReceiptConflictError();
        return {
          job: await transaction.receiptJob.findUniqueOrThrow({
            where: { id },
            include: jobInclude,
          }),
          replay: true,
        };
      }
      if (job.status !== ReceiptJobStatus.FAILED && job.status !== ReceiptJobStatus.PARTIAL_FAILED)
        throw new ReceiptConflictError();
      if (
        this.entitlements?.config.billing.enabled &&
        job.attemptCount >= this.entitlements.config.billing.scanMaxAttempts
      )
        throw new AppError({
          statusCode: 409,
          code: 'SCAN_RETRY_LIMIT_EXCEEDED',
          message: 'Đã hết số lần thử lại cho tác vụ này. Tạo tác vụ mới để tiếp tục.',
        });
      await this.entitlements?.reserve(transaction, ownerId, 'RECEIPT', 'RECEIPT:' + id);
      await transaction.receiptJob.update({
        where: { id },
        data: {
          status: ReceiptJobStatus.QUEUED,
          queuedAt: new Date(),
          lastRetryKey: key,
          lastRetryHash: requestHash,
        },
      });
      return {
        job: await transaction.receiptJob.findUniqueOrThrow({ where: { id }, include: jobInclude }),
        replay: false,
      };
    });
  }

  async confirm(data: {
    ownerId: string;
    jobId: string;
    candidates: Array<{ id: string; expectedVersion: number; conversion: ConversionSnapshot }>;
    idempotencyKey: string;
    requestHash: string;
    receiptReviewDecision?: 'SAME_RECEIPT' | 'SEPARATE_RECEIPTS' | null;
  }): Promise<{
    job: ReceiptJobRecord;
    changes: Array<{ candidateId: string; action: 'CREATED' | 'UPDATED' }>;
    duplicates: Array<{ candidateId: string; sourceJobId: string }>;
  }> {
    return this.prisma.$transaction(async (transaction) => {
      await lockDocument(transaction, 'user', { id: data.ownerId });
      const job = await transaction.receiptJob.findFirst({
        where: { id: data.jobId, ownerId: data.ownerId },
        include: jobInclude,
      });
      if (!job) throw new ReceiptConflictError();
      if (job.status === ReceiptJobStatus.CONFIRMED) {
        if (
          job.confirmationKey !== data.idempotencyKey ||
          job.confirmationHash !== data.requestHash
        )
          throw new ReceiptConflictError();
        return {
          job,
          changes: job.candidates
            .filter((candidate) => candidate.status === ReceiptCandidateStatus.CONFIRMED)
            .map((candidate) => ({
              candidateId: candidate.id,
              action:
                candidate.pantryAction === 'UPDATED' ? ('UPDATED' as const) : ('CREATED' as const),
            })),
          duplicates: job.candidates
            .filter(
              (candidate) =>
                candidate.status === ReceiptCandidateStatus.REJECTED && candidate.duplicateOfJobId,
            )
            .map((candidate) => ({
              candidateId: candidate.id,
              sourceJobId: candidate.duplicateOfJobId!,
            })),
        };
      }
      if (job.status !== ReceiptJobStatus.READY && job.status !== ReceiptJobStatus.PARTIAL_FAILED)
        throw new ReceiptConflictError();
      if (job.identityDecisionRequired && !data.receiptReviewDecision)
        throw new AppError({
          statusCode: 409,
          code: 'RECEIPT_REVIEW_DECISION_REQUIRED',
          message: 'Vui lòng xác nhận các ảnh này thuộc cùng hóa đơn hay các hóa đơn khác nhau.',
        });
      const requested = new Map(data.candidates.map((item) => [item.id, item]));
      const selected = job.candidates.filter((candidate) => requested.has(candidate.id));
      if (selected.length !== requested.size) throw new ReceiptConflictError();
      const changes: Array<{ candidateId: string; action: 'CREATED' | 'UPDATED' }> = [];
      const duplicates: Array<{ candidateId: string; sourceJobId: string }> = [];
      const priorJobs = await this.confirmedJobsOnDates(
        transaction,
        data.ownerId,
        job.id,
        job.inputs,
      );
      const lateAmbiguous = job.inputs.some(
        (input) =>
          priorJobs.some((priorJob) =>
            priorJob.inputs.some(
              (priorInput) =>
                (!input.receiptNumber || !priorInput.receiptNumber) &&
                compareReceiptImages(
                  imageIdentity(input),
                  linesForInput(job, input.id),
                  imageIdentity(priorInput),
                  comparisonLines(priorJob, priorInput.id),
                ) === 'SAME_RECEIPT_REVIEW',
            ),
          ),
      );
      if (lateAmbiguous && !data.receiptReviewDecision)
        throw new AppError({
          statusCode: 409,
          code: 'RECEIPT_REVIEW_DECISION_REQUIRED',
          message: 'Vui lòng xác nhận các ảnh này thuộc cùng hóa đơn hay các hóa đơn khác nhau.',
        });
      const usedPriorCandidates = new Set<string>();
      const countedWithinJob: typeof selected = [];
      let reviewRequired = job.reviewRequired;
      for (const candidate of selected) {
        const request = requested.get(candidate.id)!;
        if (
          candidate.version !== request.expectedVersion ||
          candidate.status === ReceiptCandidateStatus.REJECTED ||
          candidate.quantity === null ||
          !candidate.unit
        )
          throw new ReceiptVersionConflictError();
        const currentInput = job.inputs.find((input) => input.id === candidate.inputId)!;
        let duplicateSource: { jobId: string; candidateId: string } | null = null;
        if (data.receiptReviewDecision === 'SAME_RECEIPT') {
          const withinJob = countedWithinJob.find((item) => {
            if (item.inputId === currentInput.id || !matchingLine(candidate, item)) return false;
            const priorInput = job.inputs.find((input) => input.id === item.inputId)!;
            return (
              (!currentInput.receiptNumber || !priorInput.receiptNumber) &&
              compareReceiptImages(
                imageIdentity(currentInput),
                linesForInput(job, currentInput.id),
                imageIdentity(priorInput),
                linesForInput(job, priorInput.id),
              ) === 'SAME_RECEIPT_REVIEW'
            );
          });
          if (withinJob) duplicateSource = { jobId: job.id, candidateId: withinJob.id };
        }
        if (!duplicateSource) {
          for (const priorJob of priorJobs) {
            for (const priorInput of priorJob.inputs) {
              const priorLines = comparisonLines(priorJob, priorInput.id);
              const relation = compareReceiptImages(
                imageIdentity(currentInput),
                linesForInput(job, currentInput.id),
                imageIdentity(priorInput),
                priorLines,
              );
              if (relation === 'DISTINCT') continue;
              if (
                relation === 'SAME_RECEIPT_REVIEW' &&
                (!currentInput.receiptNumber || !priorInput.receiptNumber) &&
                data.receiptReviewDecision === 'SEPARATE_RECEIPTS'
              )
                continue;
              if (relation === 'SAME_RECEIPT_REVIEW') reviewRequired = true;
              const priorCandidate = priorJob.candidates.find(
                (item) =>
                  priorLines.includes(item) &&
                  item.status === ReceiptCandidateStatus.CONFIRMED &&
                  !usedPriorCandidates.has(item.id) &&
                  matchingLine(candidate, item),
              );
              if (priorCandidate) {
                duplicateSource = { jobId: priorJob.id, candidateId: priorCandidate.id };
                break;
              }
            }
            if (duplicateSource) break;
          }
        }
        if (duplicateSource) {
          usedPriorCandidates.add(duplicateSource.candidateId);
          duplicates.push({ candidateId: candidate.id, sourceJobId: duplicateSource.jobId });
          await transaction.receiptCandidate.update({
            where: { id: candidate.id },
            data: {
              status: ReceiptCandidateStatus.REJECTED,
              duplicateOfJobId: duplicateSource.jobId,
              version: { increment: 1 },
            },
          });
          continue;
        }
        const quantity = candidate.quantity;
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
          const beforeQuantity = existing.quantity;
          const beforeGrams = existing.normalizedGrams ?? null;
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
              confidence: Math.min(existing.confidence, candidate.confidence),
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
          await this.entitlements?.assertPantryCapacity(transaction, data.ownerId);
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
        countedWithinJob.push(candidate);
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
          reviewRequired: reviewRequired || lateAmbiguous,
          identityDecisionRequired: job.identityDecisionRequired || lateAmbiguous,
          receiptReviewDecision: data.receiptReviewDecision ?? null,
        },
      });
      return {
        job: await transaction.receiptJob.findUniqueOrThrow({
          where: { id: job.id },
          include: jobInclude,
        }),
        changes,
        duplicates,
      };
    });
  }

  findPublishedRecipes(ids: string[]) {
    return this.prisma.post.findMany({
      where: {
        id: { in: ids },
        type: 'RECIPE',
        status: 'PUBLISHED',
        publishedRevisionId: { not: null },
      },
      include: {
        publishedRevision: {
          include: {
            recipeDetail: true,
            ingredients: {
              include: { ingredient: { select: { id: true, canonicalName: true } } },
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });
  }

  findOwnedCustomMeals(ownerId: string, ids: string[]) {
    return this.prisma.customMeal.findMany({
      where: { id: { in: ids }, ownerId, deletedAt: null },
      include: {
        ingredients: {
          include: { ingredient: { select: { id: true, canonicalName: true } } },
          orderBy: { position: 'asc' },
        },
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
