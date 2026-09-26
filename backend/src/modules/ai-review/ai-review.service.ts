import { createHash } from 'node:crypto';
import {
  AiArtifactType,
  AiVerificationStatus,
  type Prisma,
  type Role,
} from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import {
  AiReviewConflictError,
  type AiArtifactRecord,
  type AiReviewRepository,
  type AiVerificationRecord,
} from './ai-review.repository.js';
import {
  artifactContentSchema,
  type AdminAiVerificationActionInput,
  type CreateAiArtifactInput,
  type CreateAiVerificationInput,
  type PublicAiArtifactsQuery,
  type SubmitAiArtifactInput,
  type UpdateAiArtifactVisibilityInput,
} from './ai-review.schemas.js';

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function decimal(value: { toNumber(): number } | null): number | null {
  return value?.toNumber() ?? null;
}

function nutrientSnapshot(value: Prisma.JsonValue) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const row = item as Record<string, unknown>;
    if (
      typeof row.nutrientCode !== 'string' ||
      typeof row.nutrientName !== 'string' ||
      typeof row.amount !== 'number' ||
      typeof row.unit !== 'string' ||
      typeof row.origin !== 'string' ||
      typeof row.confidence !== 'number'
    ) return [];
    return [{
      code: row.nutrientCode,
      name: row.nutrientName,
      amount: row.amount,
      unit: row.unit,
      origin: row.origin,
      confidence: row.confidence,
      range: {
        min: typeof row.min === 'number' ? row.min : null,
        max: typeof row.max === 'number' ? row.max : null,
      },
    }];
  });
}

export interface AiReviewActor {
  userId: string;
  role: Role;
}

export class AiReviewService {
  constructor(private readonly repository: AiReviewRepository) {}

  async create(ownerId: string, input: CreateAiArtifactInput) {
    const source = await this.snapshot(ownerId, input.type, input.sourceId);
    if (!source) {
      throw new AppError({
        statusCode: 422,
        code: 'AI_ARTIFACT_SOURCE_NOT_ELIGIBLE',
        message: 'The selected AI output is unavailable, private to another user, incomplete, or not eligible.',
      });
    }
    const content = artifactContentSchema.parse(source.snapshot);
    try {
      return this.serialize(await this.repository.createArtifact({
        ownerId,
        type: input.type,
        sourceId: input.sourceId,
        sourceVersion: source.version,
        snapshot: content,
        snapshotHash: hash(content),
        title: input.title,
        summary: input.summary,
        authorAnonymous: input.authorAnonymous,
      }));
    } catch (error) {
      throw this.mapConflict(error);
    }
  }

  async updateVisibility(ownerId: string, id: string, input: UpdateAiArtifactVisibilityInput) {
    try {
      const artifact = await this.repository.updateVisibility(
        ownerId,
        id,
        input.visibility,
        input.expectedLifecycleVersion,
      );
      if (!artifact) throw this.notFound();
      return this.serialize(artifact);
    } catch (error) {
      throw this.mapConflict(error);
    }
  }

  async submit(ownerId: string, id: string, input: SubmitAiArtifactInput) {
    try {
      const artifact = await this.repository.submit(ownerId, id, input.expectedLifecycleVersion);
      if (!artifact) throw this.notFound();
      return this.serialize(artifact);
    } catch (error) {
      throw this.mapConflict(error);
    }
  }

  async listPublic(query: PublicAiArtifactsQuery) {
    const result = await this.repository.listPublic(query);
    return {
      data: result.records.map((record) => this.serialize(record)),
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit),
      },
    };
  }

  async verify(actor: AiReviewActor, artifactId: string, input: CreateAiVerificationInput) {
    const artifact = await this.repository.findArtifact(artifactId);
    if (!artifact) throw this.notFound();
    if (artifact.ownerId === actor.userId) {
      throw new AppError({
        statusCode: 403,
        code: 'SELF_VERIFICATION_FORBIDDEN',
        message: 'Artifact owners cannot verify their own submitted output.',
      });
    }
    try {
      const result = await this.repository.createVerification({
        artifactId,
        reviewerId: actor.userId,
        expectedArtifactVersion: input.expectedArtifactVersion,
        conclusion: input.conclusion,
        scope: input.scope,
        evidenceNote: input.evidenceNote,
        correction: input.correction ?? null,
      });
      return { artifact: this.serialize(result.artifact), verification: this.serializeVerification(result.verification) };
    } catch (error) {
      throw this.mapConflict(error);
    }
  }

  async adminAction(actorId: string, verificationId: string, input: AdminAiVerificationActionInput) {
    try {
      const result = await this.repository.adminAction({
        verificationId,
        actorId,
        expectedVersion: input.expectedVersion,
        action: input.action,
        reason: input.reason,
        ...(input.action === 'OVERRIDE'
          ? {
              replacement: {
                conclusion: input.conclusion,
                scope: input.scope,
                evidenceNote: input.evidenceNote,
                correction: input.correction ?? null,
              },
            }
          : {}),
      });
      if (!result) {
        throw new AppError({ statusCode: 404, code: 'AI_VERIFICATION_NOT_FOUND', message: 'AI verification was not found.' });
      }
      return { artifact: this.serialize(result.artifact), verification: this.serializeVerification(result.verification) };
    } catch (error) {
      throw this.mapConflict(error);
    }
  }

  private async snapshot(ownerId: string, type: AiArtifactType, sourceId: string): Promise<{
    version: number;
    snapshot: Prisma.InputJsonObject;
  } | null> {
    if (type === AiArtifactType.CHAT_ANSWER) {
      const source = await this.repository.findOwnedChatAnswer(ownerId, sourceId);
      return source ? { version: 1, snapshot: { type, answer: source.content } } : null;
    }
    if (type === AiArtifactType.RECIPE_NUTRITION) {
      const source = await this.repository.findOwnedNutritionEstimate(ownerId, sourceId);
      return source
        ? {
            version: source.version,
            snapshot: {
              type,
              recipe: { title: source.revision.title, servings: source.servings },
              totals: { rawGrams: source.totalRawGrams.toNumber(), cookedGrams: source.totalCookedGrams.toNumber() },
              perServingNutrients: nutrientSnapshot(source.perServingNutrients),
              confidence: source.confidence.toNumber(),
              disclaimer: source.disclaimer,
            },
          }
        : null;
    }
    if (type === AiArtifactType.FRIDGE_RECOGNITION) {
      const source = await this.repository.findOwnedRecognition(ownerId, sourceId);
      return source
        ? {
            version: source.attemptCount * 100_000 + source.candidates.reduce((sum, candidate) => sum + candidate.version, 0),
            snapshot: {
              type,
              items: source.candidates.map((candidate) => ({
                name: candidate.detectedName,
                quantity: { value: decimal(candidate.quantity), unit: candidate.unit },
                confidence: candidate.confidence.toNumber(),
                status: candidate.status,
              })),
            },
          }
        : null;
    }
    const source = await this.repository.findOwnedReceipt(ownerId, sourceId);
    return source
      ? {
          version: source.attemptCount * 100_000 + source.candidates.reduce((sum, candidate) => sum + candidate.version, 0),
          snapshot: {
            type,
            items: source.candidates.map((candidate) => ({
              name: candidate.detectedName,
              quantity: { value: decimal(candidate.quantity), unit: candidate.unit },
              confidence: candidate.confidence.toNumber(),
              status: candidate.status,
            })),
          },
        }
      : null;
  }

  private serialize(record: AiArtifactRecord) {
    const history = record.verifications.map((verification) => this.serializeVerification(verification));
    return {
      id: record.id,
      type: record.type,
      version: record.version,
      title: record.title,
      summary: record.summary,
      content: artifactContentSchema.parse(record.snapshot),
      author: {
        name: record.authorAnonymous ? 'Anonymous member' : record.owner.displayName,
        anonymous: record.authorAnonymous,
      },
      lifecycle: {
        status: record.status,
        visibility: record.visibility,
        version: record.lifecycleVersion,
        submittedAt: record.submittedAt?.toISOString() ?? null,
        sharedAt: record.sharedAt?.toISOString() ?? null,
      },
      activeVerification: history.find((verification) => verification.status === AiVerificationStatus.ACTIVE) ?? null,
      verificationHistory: history,
      createdAt: record.createdAt.toISOString(),
    };
  }

  private serializeVerification(record: AiVerificationRecord) {
    return {
      id: record.id,
      artifactVersion: record.artifactVersion,
      conclusion: record.conclusion,
      scope: record.scope,
      evidenceNote: record.evidenceNote,
      correction: record.correction ?? null,
      status: record.status,
      reviewer: { name: record.reviewer.displayName, role: record.reviewerRole },
      version: record.version,
      supersedes: record.supersedesId ? { verificationId: record.supersedesId } : null,
      createdAt: record.createdAt.toISOString(),
    };
  }

  private notFound(): AppError {
    return new AppError({ statusCode: 404, code: 'AI_ARTIFACT_NOT_FOUND', message: 'AI artifact was not found.' });
  }

  private mapConflict(error: unknown): Error {
    if (error instanceof AppError) return error;
    if (!(error instanceof AiReviewConflictError)) return error instanceof Error ? error : new Error('Unknown AI review error');
    if (error.kind === 'SOURCE_ALREADY_SAVED') {
      return new AppError({ statusCode: 409, code: 'AI_ARTIFACT_ALREADY_SAVED', message: 'This version of the AI output has already been saved.' });
    }
    if (error.kind === 'ARTIFACT_VERSION') {
      return new AppError({ statusCode: 409, code: 'AI_ARTIFACT_VERSION_CONFLICT', message: 'The artifact version is stale; refresh before continuing.' });
    }
    if (error.kind === 'VERIFICATION_EXISTS') {
      return new AppError({ statusCode: 409, code: 'AI_VERIFICATION_ALREADY_EXISTS', message: 'This artifact already has an active verification.' });
    }
    if (error.kind === 'VERIFICATION_VERSION') {
      return new AppError({ statusCode: 409, code: 'AI_VERIFICATION_VERSION_CONFLICT', message: 'The verification changed; refresh before continuing.' });
    }
    if (error.kind === 'VERIFICATION_STATE') {
      return new AppError({ statusCode: 409, code: 'AI_VERIFICATION_STATE_CONFLICT', message: 'The verification is no longer active.' });
    }
    return new AppError({ statusCode: 409, code: 'AI_ARTIFACT_STATE_CONFLICT', message: 'The artifact is not in a state that permits this action.' });
  }
}
