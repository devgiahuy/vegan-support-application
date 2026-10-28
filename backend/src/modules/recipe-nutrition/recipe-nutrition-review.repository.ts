import type { RecipeNutritionJobTrigger } from '@prisma/client';
import {
  AiRequestStatus,
  IngredientResolutionStatus,
  NutritionValueOrigin,
  PostRevisionStatus,
  PostType,
  RecipeNutritionEstimateStatus,
  RecipeNutritionJobState,
  ReportStatus,
  ReportTargetType,
  type Prisma,
  type PrismaClient,
  type Role,
} from '@prisma/client';
import { lockDocument } from '../../database/locking.js';
import type { RecipeReviewNutritionMetric } from '../chat/ai-provider.js';
import {
  REVIEW_NUTRITION_METRICS,
  reviewMetricsFromLines,
  reviewMetricsFromPerServing,
  type ReviewMetricEstimate,
} from './recipe-nutrition-review.metrics.js';

export const ACTIVE_JOB_STATES: RecipeNutritionJobState[] = [
  RecipeNutritionJobState.QUEUED,
  RecipeNutritionJobState.RUNNING,
  RecipeNutritionJobState.RETRY_SCHEDULED,
];

export const REVIEWABLE_REVISION_STATUSES: PostRevisionStatus[] = [
  PostRevisionStatus.PENDING_REVIEW,
  PostRevisionStatus.FLAGGED,
  PostRevisionStatus.QUARANTINED,
];

const reviewContextInclude = {
  post: {
    include: {
      author: { select: { id: true, role: true, status: true } },
    },
  },
  aiFlags: { select: { id: true, status: true } },
  recipeDetail: { select: { servings: true } },
} satisfies Prisma.PostRevisionInclude;

export type NutritionReviewContext = Prisma.PostRevisionGetPayload<{
  include: typeof reviewContextInclude;
}>;
export type NutritionReviewJobRecord = Prisma.RecipeNutritionAiJobGetPayload<object>;

const overrideInclude = {
  updatedBy: { select: { id: true, displayName: true, role: true } },
} satisfies Prisma.RecipeNutritionOverrideInclude;
const auditInclude = {
  actor: { select: { id: true, displayName: true, role: true } },
} satisfies Prisma.RecipeNutritionAuditInclude;

export type NutritionOverrideRecord = Prisma.RecipeNutritionOverrideGetPayload<{
  include: typeof overrideInclude;
}>;
export type NutritionAuditRecord = Prisma.RecipeNutritionAuditGetPayload<{
  include: typeof auditInclude;
}>;

export interface ResolvedReviewMetric {
  metric: RecipeReviewNutritionMetric;
  unit: string;
  estimate: ReviewMetricEstimate;
  override: NutritionOverrideRecord | null;
  finalValue: number | null;
  finalOrigin: NutritionValueOrigin | null;
}

export interface ResolvedReviewNutrition {
  estimateId: string | null;
  servings: number;
  metrics: ResolvedReviewMetric[];
  missingMetrics: RecipeReviewNutritionMetric[];
}

type Client = PrismaClient | Prisma.TransactionClient;

/** Current estimate + reviewer overrides for one revision. Overrides take precedence per metric. */
export async function resolveReviewNutrition(
  client: Client,
  revisionId: string,
): Promise<ResolvedReviewNutrition> {
  const [estimate, overrides, detail] = await Promise.all([
    client.recipeNutritionEstimate.findFirst({
      where: { revisionId, status: RecipeNutritionEstimateStatus.CURRENT },
      include: { lines: { orderBy: { position: 'asc' } } },
      orderBy: { version: 'desc' },
    }),
    client.recipeNutritionOverride.findMany({ where: { revisionId }, include: overrideInclude }),
    client.recipeDetail.findUnique({ where: { revisionId }, select: { servings: true } }),
  ]);
  const servings = estimate?.servings ?? detail?.servings ?? 1;
  const estimates = estimate
    ? estimate.lines.length
      ? reviewMetricsFromLines(estimate.lines, estimate.servings)
      : reviewMetricsFromPerServing(estimate.perServingNutrients)
    : REVIEW_NUTRITION_METRICS.map((definition): ReviewMetricEstimate => ({
        metric: definition.metric,
        unit: definition.unit,
        value: null,
        partialValue: null,
        origin: null,
        confidence: null,
      }));
  const metrics = estimates.map((item): ResolvedReviewMetric => {
    const override = overrides.find((row) => row.metric === item.metric) ?? null;
    return {
      metric: item.metric,
      unit: item.unit,
      estimate: item,
      override,
      finalValue: override ? override.value : item.value,
      finalOrigin: override
        ? NutritionValueOrigin.VERIFIED_OVERRIDE
        : item.value === null
          ? null
          : item.origin,
    };
  });
  return {
    estimateId: estimate?.id ?? null,
    servings,
    metrics,
    missingMetrics: metrics.filter((item) => item.finalValue === null).map((item) => item.metric),
  };
}

/** Cancels queued/running review jobs; a running worker discards its result on its next conditional write. */
export function cancelActiveReviewJobs(client: Client, revisionId: string, errorCode: string) {
  const now = new Date();
  return client.recipeNutritionAiJob.updateMany({
    where: { revisionId, state: { in: ACTIVE_JOB_STATES } },
    data: {
      state: RecipeNutritionJobState.CANCELLED,
      status: AiRequestStatus.ABORTED,
      errorCode,
      nextAttemptAt: null,
      leaseExpiresAt: null,
      completedAt: now,
    },
  });
}

/** Writes approved values into RecipeDetail. Returns the resolved nutrition for the audit snapshot. */
export async function applyApprovedReviewNutrition(
  transaction: Prisma.TransactionClient,
  revisionId: string,
  resolved: ResolvedReviewNutrition,
) {
  const value = (metric: RecipeReviewNutritionMetric) =>
    resolved.metrics.find((item) => item.metric === metric)?.finalValue ?? null;
  const calories = value('calories');
  const unresolvedIngredients = await transaction.recipeIngredient.count({
    where: { revisionId, resolutionStatus: { not: IngredientResolutionStatus.EXACT } },
  });
  await transaction.recipeDetail.update({
    where: { revisionId },
    data: {
      calories: calories === null ? null : Math.round(calories),
      proteinGrams: value('proteinGrams'),
      carbsGrams: value('carbsGrams'),
      fatGrams: value('fatGrams'),
      fiberGrams: value('fiberGrams'),
      mealPlannerEligible: unresolvedIngredients === 0 && resolved.missingMetrics.length === 0,
    },
  });
  await cancelActiveReviewJobs(transaction, revisionId, 'REVISION_DECIDED');
}

export class RecipeNutritionReviewRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findReviewContext(revisionId: string): Promise<NutritionReviewContext | null> {
    return this.prisma.postRevision.findUnique({
      where: { id: revisionId },
      include: reviewContextInclude,
    });
  }

  countOpenPostReports(postId: string): Promise<number> {
    return this.prisma.report.count({
      where: { targetType: ReportTargetType.POST, targetId: postId, status: ReportStatus.OPEN },
    });
  }

  resolve(revisionId: string): Promise<ResolvedReviewNutrition> {
    return resolveReviewNutrition(this.prisma, revisionId);
  }

  findCurrentEstimateMeta(revisionId: string) {
    return this.prisma.recipeNutritionEstimate.findFirst({
      where: { revisionId, status: RecipeNutritionEstimateStatus.CURRENT },
      select: {
        id: true,
        version: true,
        confidence: true,
        aiUsed: true,
        calculationVersion: true,
        uncoveredIngredients: true,
        disclaimer: true,
        createdAt: true,
        lines: {
          select: { position: true, displayName: true, origin: true, nutrientCoverage: true },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { version: 'desc' },
    });
  }

  findLatestReviewJob(revisionId: string): Promise<NutritionReviewJobRecord | null> {
    return this.prisma.recipeNutritionAiJob.findFirst({
      where: { revisionId, state: { not: null } },
      orderBy: { createdAt: 'desc' },
    });
  }

  listAudits(revisionId: string, limit: number): Promise<NutritionAuditRecord[]> {
    return this.prisma.recipeNutritionAudit.findMany({
      where: { revisionId },
      include: auditInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /** Last approved recipe revision of the same post (older version), for reference only. */
  async findPreviousApproved(postId: string, beforeVersion: number) {
    const revision = await this.prisma.postRevision.findFirst({
      where: {
        postId,
        version: { lt: beforeVersion },
        reviewedAt: { not: null },
        status: PostRevisionStatus.PUBLISHED,
        post: { type: PostType.RECIPE },
      },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        reviewedAt: true,
        recipeDetail: {
          select: {
            calories: true,
            proteinGrams: true,
            carbsGrams: true,
            fatGrams: true,
            fiberGrams: true,
          },
        },
        nutritionOverrides: { select: { metric: true } },
      },
    });
    return revision?.recipeDetail ? { ...revision, recipeDetail: revision.recipeDetail } : null;
  }

  /** Cancels active jobs and enqueues a new one atomically. */
  replaceActiveJob(input: {
    revisionId: string;
    provider: string;
    modelId: string;
    requestPayloadHash: string;
    trigger: RecipeNutritionJobTrigger;
    requestedById: string | null;
    maxAttempts: number;
  }): Promise<NutritionReviewJobRecord> {
    return this.prisma.$transaction(async (transaction) => {
      await lockDocument(transaction, 'postRevision', { id: input.revisionId });
      await cancelActiveReviewJobs(transaction, input.revisionId, 'SUPERSEDED');
      const now = new Date();
      return transaction.recipeNutritionAiJob.create({
        data: {
          revisionId: input.revisionId,
          provider: input.provider,
          modelId: input.modelId,
          status: AiRequestStatus.IN_PROGRESS,
          requestPayloadHash: input.requestPayloadHash,
          state: RecipeNutritionJobState.QUEUED,
          trigger: input.trigger,
          requestedById: input.requestedById,
          attemptCount: 0,
          maxAttempts: input.maxAttempts,
          nextAttemptAt: now,
          startedAt: now,
        },
      });
    });
  }

  cancelActiveJobs(revisionId: string, errorCode: string) {
    return cancelActiveReviewJobs(this.prisma, revisionId, errorCode);
  }

  /** Claims a due job for one attempt. Returns null if another worker owns it or it is not due. */
  async claim(jobId: string, leaseMs: number): Promise<NutritionReviewJobRecord | null> {
    const now = new Date();
    const claimed = await this.prisma.recipeNutritionAiJob.updateMany({
      where: {
        id: jobId,
        state: { in: [RecipeNutritionJobState.QUEUED, RecipeNutritionJobState.RETRY_SCHEDULED] },
        nextAttemptAt: { lte: now },
      },
      data: {
        state: RecipeNutritionJobState.RUNNING,
        attemptCount: { increment: 1 },
        nextAttemptAt: null,
        leaseExpiresAt: new Date(now.getTime() + leaseMs),
      },
    });
    if (claimed.count !== 1) return null;
    return this.prisma.recipeNutritionAiJob.findUnique({ where: { id: jobId } });
  }

  /** Conditional transition out of RUNNING; false when the job was cancelled meanwhile. */
  async finishRunning(
    jobId: string,
    data: Prisma.RecipeNutritionAiJobUncheckedUpdateManyInput,
  ): Promise<boolean> {
    const result = await this.prisma.recipeNutritionAiJob.updateMany({
      where: { id: jobId, state: RecipeNutritionJobState.RUNNING },
      data: { leaseExpiresAt: null, ...data },
    });
    return result.count === 1;
  }

  /** Saves the AI-hinted estimate only while the job still runs and the revision awaits review. */
  async completeWithEstimate(
    jobId: string,
    revisionId: string,
    save: () => Promise<{ id: string }>,
    resultPayload: Prisma.InputJsonObject,
  ): Promise<boolean> {
    const job = await this.prisma.recipeNutritionAiJob.findUnique({
      where: { id: jobId },
      select: { state: true },
    });
    const revision = await this.prisma.postRevision.findUnique({
      where: { id: revisionId },
      select: { status: true },
    });
    if (
      job?.state !== RecipeNutritionJobState.RUNNING ||
      !revision ||
      !REVIEWABLE_REVISION_STATUSES.includes(revision.status)
    ) {
      return false;
    }
    const finished = await this.finishRunning(jobId, {
      state: RecipeNutritionJobState.SUCCEEDED,
      status: AiRequestStatus.SUCCESS,
      errorCode: null,
      resultPayload,
      completedAt: new Date(),
    });
    if (!finished) return false;
    try {
      const estimate = await save();
      await this.prisma.recipeNutritionAiJob.update({
        where: { id: jobId },
        data: { estimateId: estimate.id },
      });
    } catch (error) {
      await this.prisma.recipeNutritionAiJob.update({
        where: { id: jobId },
        data: {
          state: RecipeNutritionJobState.FAILED,
          status: AiRequestStatus.FAILED,
          errorCode: 'ESTIMATE_SAVE_FAILED',
        },
      });
      throw error;
    }
    return true;
  }

  findJob(jobId: string): Promise<NutritionReviewJobRecord | null> {
    return this.prisma.recipeNutritionAiJob.findUnique({ where: { id: jobId } });
  }

  findRecoverableJobs(): Promise<NutritionReviewJobRecord[]> {
    return this.prisma.recipeNutritionAiJob.findMany({
      where: { state: { in: ACTIVE_JOB_STATES } },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** A RUNNING job found at startup lost its worker: requeue it, or fail it when attempts are exhausted. */
  async recoverStuckRunning(job: NutritionReviewJobRecord): Promise<boolean> {
    const now = new Date();
    const exhausted = job.attemptCount >= job.maxAttempts;
    const result = await this.prisma.recipeNutritionAiJob.updateMany({
      where: { id: job.id, state: RecipeNutritionJobState.RUNNING },
      data: exhausted
        ? {
            state: RecipeNutritionJobState.FAILED,
            status: AiRequestStatus.FAILED,
            errorCode: 'WORKER_INTERRUPTED',
            leaseExpiresAt: null,
            completedAt: now,
          }
        : {
            state: RecipeNutritionJobState.RETRY_SCHEDULED,
            errorCode: 'WORKER_INTERRUPTED',
            leaseExpiresAt: null,
            nextAttemptAt: now,
          },
    });
    return result.count === 1 && !exhausted;
  }

  /** Applies reviewer edits with a before/after audit row per changed metric. */
  async applyOverrides(input: {
    revisionId: string;
    postId: string;
    actorId: string;
    actorRole: Role;
    reason: string | null;
    changes: Array<{ metric: RecipeReviewNutritionMetric; value: number | null }>;
  }): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await lockDocument(transaction, 'postRevision', { id: input.revisionId });
      const before = await resolveReviewNutrition(transaction, input.revisionId);
      for (const change of input.changes) {
        const current = before.metrics.find((item) => item.metric === change.metric);
        if (!current) continue;
        if (change.value === null) {
          if (!current.override) continue;
          await transaction.recipeNutritionOverride.delete({
            where: { id: current.override.id },
          });
          await transaction.recipeNutritionAudit.create({
            data: {
              revisionId: input.revisionId,
              postId: input.postId,
              metric: change.metric,
              action: 'CLEAR_OVERRIDE',
              previousValue: current.finalValue,
              previousOrigin: current.finalOrigin,
              newValue: current.estimate.value,
              newOrigin: current.estimate.value === null ? null : current.estimate.origin,
              reason: input.reason,
              actorId: input.actorId,
              actorRole: input.actorRole,
            },
          });
          continue;
        }
        if (current.override?.value === change.value) continue;
        await transaction.recipeNutritionOverride.upsert({
          where: { revisionId_metric: { revisionId: input.revisionId, metric: change.metric } },
          create: {
            revisionId: input.revisionId,
            metric: change.metric,
            value: change.value,
            updatedById: input.actorId,
          },
          update: { value: change.value, updatedById: input.actorId },
        });
        await transaction.recipeNutritionAudit.create({
          data: {
            revisionId: input.revisionId,
            postId: input.postId,
            metric: change.metric,
            action: 'SET_OVERRIDE',
            previousValue: current.finalValue,
            previousOrigin: current.finalOrigin,
            newValue: change.value,
            newOrigin: NutritionValueOrigin.VERIFIED_OVERRIDE,
            reason: input.reason,
            actorId: input.actorId,
            actorRole: input.actorRole,
          },
        });
      }
    });
  }
}
