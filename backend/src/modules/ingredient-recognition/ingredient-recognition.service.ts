import { createHash } from 'node:crypto';
import { RecognitionCandidateStatus, type Prisma } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import type { AppConfig } from '../../config/env.js';
import { normalizeVietnameseText } from '../catalog/catalog.normalization.js';
import type { IngredientVisionProvider, VisionImageResult } from './ingredient-vision.provider.js';
import {
  RecognitionConflictError,
  RecognitionVersionConflictError,
  type DeduplicatedCandidateData,
  type IngredientRecognitionRepository,
  type RecognitionJobRecord,
} from './ingredient-recognition.repository.js';
import type {
  ConfirmRecognitionJobInput,
  CreateRecognitionJobInput,
  RetryRecognitionJobInput,
  UpdateRecognitionCandidateInput,
} from './ingredient-recognition.schemas.js';

const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const FRESHNESS_DISCLAIMER =
  'Freshness observations are visual estimates only. Check the ingredient yourself before use; this is not a food-safety decision.';

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function decimal(value: { toNumber(): number } | number | null): number | null {
  if (value === null) return null;
  return typeof value === 'number' ? value : value.toNumber();
}

export class IngredientRecognitionService {
  constructor(
    private readonly repository: IngredientRecognitionRepository,
    private readonly provider: IngredientVisionProvider,
    private readonly config: AppConfig,
  ) {}

  async create(ownerId: string, input: CreateRecognitionJobInput) {
    this.ensureEnabled();
    if (input.imageAssetIds.length > this.config.vision.maxImages) {
      throw new AppError({
        statusCode: 422,
        code: 'RECOGNITION_IMAGE_LIMIT_EXCEEDED',
        message: `A recognition job accepts at most ${String(this.config.vision.maxImages)} images.`,
      });
    }
    const assets = await this.repository.findOwnedAssets(ownerId, input.imageAssetIds);
    const byId = new Map(assets.map((asset) => [asset.id, asset]));
    if (assets.length !== input.imageAssetIds.length) throw this.invalidImage();
    for (const assetId of input.imageAssetIds) {
      const asset = byId.get(assetId);
      if (
        !asset ||
        !asset.mimeType ||
        !ALLOWED_IMAGE_MIME_TYPES.has(asset.mimeType) ||
        asset.bytes > BigInt(this.config.vision.maxImageBytes)
      ) {
        throw this.invalidImage();
      }
    }
    const requestHash = hash({ imageAssetIds: input.imageAssetIds });
    const result = await this.repository.createJob({
      ownerId,
      assetIds: input.imageAssetIds,
      provider: this.provider.name,
      modelId: this.provider.model,
      templateVersion: this.provider.templateVersion,
      idempotencyKey: input.idempotencyKey,
      requestHash,
    });
    if (!result.created && result.job.requestHash !== requestHash) {
      throw new AppError({
        statusCode: 409,
        code: 'RECOGNITION_IDEMPOTENCY_CONFLICT',
        message: 'The idempotency key was already used with different images.',
      });
    }
    if (result.created) this.schedule(ownerId, result.job.id);
    return this.serializeJob(result.job);
  }

  async get(ownerId: string, id: string) {
    const job = await this.repository.findOwnedJob(ownerId, id);
    if (!job) throw this.notFound();
    if (job.status === 'QUEUED') this.schedule(ownerId, id);
    return this.serializeJob(job);
  }

  async updateCandidate(
    ownerId: string,
    jobId: string,
    candidateId: string,
    input: UpdateRecognitionCandidateInput,
  ) {
    const currentJob = await this.repository.findOwnedJob(ownerId, jobId);
    if (!currentJob) throw this.notFound();
    const current = currentJob.candidates.find((candidate) => candidate.id === candidateId);
    if (!current) throw this.notFound();
    let ingredientId = current.ingredientId;
    let detectedName = input.detectedName ?? current.detectedName;
    let normalizedName = normalizeVietnameseText(detectedName);
    let matchConfidence: number | null = decimal(current.matchConfidence);
    if (input.ingredientId !== undefined) {
      ingredientId = input.ingredientId;
      if (ingredientId) {
        const ingredient = await this.repository.resolveIngredientById(ingredientId);
        if (!ingredient) {
          throw new AppError({
            statusCode: 422,
            code: 'RECOGNITION_INGREDIENT_INVALID',
            message: 'The selected ingredient is not active.',
          });
        }
        detectedName = ingredient.canonicalName;
        normalizedName = normalizeVietnameseText(ingredient.canonicalName);
        matchConfidence = 1;
      } else {
        matchConfidence = null;
      }
    }
    if (!normalizedName) {
      throw new AppError({
        statusCode: 422,
        code: 'RECOGNITION_CANDIDATE_INVALID',
        message: 'Candidate name must contain letters or numbers.',
      });
    }
    const quantity = input.quantity === undefined ? decimal(current.quantity) : input.quantity;
    const unit = input.unit === undefined ? current.unit : input.unit;
    if ((quantity === null) !== (unit === null)) {
      throw new AppError({
        statusCode: 422,
        code: 'RECOGNITION_QUANTITY_INCOMPLETE',
        message: 'Quantity and unit must either both be provided or both be empty.',
      });
    }
    const data: Prisma.RecognitionCandidateUncheckedUpdateManyInput = {
      ingredientId,
      detectedName,
      normalizedName,
      matchConfidence,
      quantity,
      unit,
      status:
        input.decision === 'REJECT'
          ? RecognitionCandidateStatus.REJECTED
          : RecognitionCandidateStatus.EDITED,
      ...(input.freshnessObservation !== undefined
        ? { freshnessObservation: input.freshnessObservation }
        : {}),
      ...(input.confidence !== undefined ? { confidence: input.confidence } : {}),
    };
    try {
      const job = await this.repository.updateCandidate(
        ownerId,
        jobId,
        candidateId,
        input.expectedVersion,
        data,
      );
      if (!job) throw this.notFound();
      return this.serializeJob(job);
    } catch (error) {
      throw this.mapConflict(error);
    }
  }

  async confirm(ownerId: string, jobId: string, input: ConfirmRecognitionJobInput) {
    const requestHash = hash({ jobId, candidates: input.candidates });
    try {
      const result = await this.repository.confirm({
        ownerId,
        jobId,
        candidates: input.candidates,
        idempotencyKey: input.idempotencyKey,
        requestHash,
      });
      const pantryByCandidate = new Map(
        result.job.candidates.map((candidate) => [candidate.id, candidate.pantryItem]),
      );
      return {
        job: this.serializeJob(result.job),
        pantryChanges: result.changes.map((change) => {
          const item = pantryByCandidate.get(change.candidateId);
          if (!item) throw new Error('Confirmed recognition candidate is missing its pantry item');
          return {
            candidateId: change.candidateId,
            action: change.action,
            pantryItem: {
              id: item.id,
              ingredient: item.ingredient
                ? { id: item.ingredient.id, name: item.ingredient.canonicalName }
                : null,
              unmatchedText: item.unmatchedText ?? null,
              quantity: item.quantity.toNumber(),
              unit: item.unit,
              source: item.source,
              confidence: item.confidence.toNumber(),
              confirmationStatus: item.confirmationStatus,
              version: item.version,
            },
          };
        }),
      };
    } catch (error) {
      throw this.mapConflict(error);
    }
  }

  async cancel(ownerId: string, id: string) {
    try {
      const job = await this.repository.cancel(ownerId, id);
      if (!job) throw this.notFound();
      return this.serializeJob(job);
    } catch (error) {
      throw this.mapConflict(error);
    }
  }

  async retry(ownerId: string, id: string, input: RetryRecognitionJobInput) {
    this.ensureEnabled();
    try {
      const result = await this.repository.queueRetry(ownerId, id, input.idempotencyKey, hash({ id }));
      if (!result) throw this.notFound();
      if (!result.replay) this.schedule(ownerId, id);
      return this.serializeJob(result.job);
    } catch (error) {
      throw this.mapConflict(error);
    }
  }

  async process(ownerId: string, id: string): Promise<void> {
    const job = await this.repository.startProcessing(ownerId, id);
    if (!job) return;
    try {
      const results = await this.provider.recognize(
        job.inputs.map((input) => ({
          id: input.id,
          position: input.position,
          url: input.asset.secureUrl,
        })),
      );
      const candidates = await this.deduplicate(results);
      await this.repository.saveResults(
        job.id,
        results.map((result) => ({ inputId: result.inputId, error: result.error })),
        candidates,
      );
    } catch {
      await this.repository.markFailed(
        job.id,
        'RECOGNITION_PROVIDER_UNAVAILABLE',
        'Image recognition is temporarily unavailable. Retry later or add pantry items manually.',
      );
    }
  }

  private schedule(ownerId: string, id: string): void {
    setImmediate(() => {
      void this.process(ownerId, id).catch(() => undefined);
    });
  }

  private async deduplicate(results: VisionImageResult[]): Promise<DeduplicatedCandidateData[]> {
    const groups = new Map<string, DeduplicatedCandidateData>();
    for (const result of results) {
      if (result.error) continue;
      for (const candidate of result.candidates) {
        const normalizedName = normalizeVietnameseText(candidate.name);
        if (!normalizedName) continue;
        const ingredient = await this.repository.resolveIngredient(normalizedName);
        const key = ingredient ? `ingredient:${ingredient.id}` : `unknown:${normalizedName}`;
        const existing = groups.get(key);
        const evidence = {
          inputId: result.inputId,
          confidence: candidate.confidence,
          observation: candidate.uncertaintyNote,
        };
        if (!existing) {
          groups.set(key, {
            ingredientId: ingredient?.id ?? null,
            detectedName: ingredient?.canonicalName ?? candidate.name,
            normalizedName: ingredient
              ? normalizeVietnameseText(ingredient.canonicalName)
              : normalizedName,
            quantity: candidate.quantity,
            unit: candidate.unit,
            freshnessObservation: candidate.freshnessObservation,
            confidence: candidate.confidence,
            matchConfidence: ingredient ? 0.9 : null,
            uncertaintyNote: candidate.uncertaintyNote,
            evidence: [evidence],
          });
          continue;
        }
        const sameUnit = existing.unit !== null && existing.unit === candidate.unit;
        if (sameUnit && existing.quantity !== null && candidate.quantity !== null) {
          existing.quantity = Number((existing.quantity + candidate.quantity).toFixed(4));
        } else if (candidate.confidence > existing.confidence) {
          existing.quantity = candidate.quantity;
          existing.unit = candidate.unit;
        }
        if (candidate.confidence > existing.confidence) {
          existing.confidence = candidate.confidence;
          existing.freshnessObservation = candidate.freshnessObservation;
        }
        existing.uncertaintyNote = `Combined from ${String(existing.evidence.length + 1)} images; review quantity and observations before confirming.`;
        existing.evidence.push(evidence);
      }
    }
    return [...groups.values()];
  }

  private serializeJob(job: RecognitionJobRecord) {
    return {
      id: job.id,
      status: job.status,
      progress: {
        completedImages: job.inputs.filter((input) => input.status !== 'PENDING').length,
        totalImages: job.inputs.length,
      },
      images: job.inputs.map((input) => ({
        id: input.id,
        position: input.position,
        url: input.asset.secureUrl,
        status: input.status,
        issue: input.errorMessage ?? null,
      })),
      candidates: job.candidates.map((candidate) => ({
        id: candidate.id,
        name: candidate.detectedName,
        ingredientSuggestion: candidate.ingredient
          ? {
              id: candidate.ingredient.id,
              name: candidate.ingredient.canonicalName,
              confidence: decimal(candidate.matchConfidence) ?? 0,
            }
          : null,
        quantity: { value: decimal(candidate.quantity), unit: candidate.unit ?? null },
        freshnessObservation: candidate.freshnessObservation ?? null,
        confidence: decimal(candidate.confidence) ?? 0,
        uncertaintyNote: candidate.uncertaintyNote ?? null,
        status: candidate.status,
        version: candidate.version,
        evidence: candidate.evidence
          .map((item) => ({
            imageId: item.input.id,
            imagePosition: item.input.position,
            confidence: decimal(item.confidence) ?? 0,
          }))
          .sort((left, right) => left.imagePosition - right.imagePosition),
      })),
      attempt: job.attemptCount,
      issue: job.errorCode
        ? { code: job.errorCode, message: job.errorMessage ?? 'Recognition could not be completed.' }
        : null,
      freshnessDisclaimer: FRESHNESS_DISCLAIMER,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
      completedAt: job.processingCompletedAt?.toISOString() ?? null,
      confirmedAt: job.confirmedAt?.toISOString() ?? null,
    };
  }

  private ensureEnabled(): void {
    if (!this.config.vision.enabled) {
      throw new AppError({
        statusCode: 503,
        code: 'RECOGNITION_PROVIDER_UNAVAILABLE',
        message: 'Image recognition is currently disabled. Add pantry items manually.',
      });
    }
  }

  private invalidImage(): AppError {
    return new AppError({
      statusCode: 422,
      code: 'RECOGNITION_IMAGE_INVALID',
      message: 'Every image must be an owned, committed fridge image with a supported type and size.',
    });
  }

  private notFound(): AppError {
    return new AppError({
      statusCode: 404,
      code: 'RECOGNITION_JOB_NOT_FOUND',
      message: 'Recognition job was not found.',
    });
  }

  private mapConflict(error: unknown): Error {
    if (error instanceof AppError) return error;
    if (error instanceof RecognitionVersionConflictError) {
      return new AppError({
        statusCode: 409,
        code: 'RECOGNITION_VERSION_CONFLICT',
        message: 'Recognition candidate changed; refresh before continuing.',
      });
    }
    if (error instanceof RecognitionConflictError) {
      return new AppError({
        statusCode: 409,
        code: 'RECOGNITION_STATE_CONFLICT',
        message: 'Recognition job is not in a state that permits this action.',
      });
    }
    return error instanceof Error ? error : new Error('Unknown recognition error');
  }
}
