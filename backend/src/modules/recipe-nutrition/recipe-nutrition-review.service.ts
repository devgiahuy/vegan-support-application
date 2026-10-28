import {
  AiRequestStatus,
  NutritionValueOrigin,
  PostRevisionStatus,
  PostStatus,
  PostType,
  RecipeNutritionJobState,
  RecipeNutritionJobTrigger,
  Role,
  type Prisma,
} from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import {
  AiProviderInvalidOutputError,
  type AiProvider,
  type RecipeNutritionReviewEstimateSuggestion,
  type RecipeReviewNutritionMetric,
} from '../chat/ai-provider.js';
import {
  missingMetricsByLine,
  missingMetricsByStoredLine,
  REVIEW_NUTRITION_METRICS,
} from './recipe-nutrition-review.metrics.js';
import {
  REVIEWABLE_REVISION_STATUSES,
  type NutritionReviewContext,
  type NutritionReviewJobRecord,
  type RecipeNutritionReviewRepository,
} from './recipe-nutrition-review.repository.js';
import type {
  ReviewNutritionOverrideInput,
  ReviewNutritionPanel,
} from './recipe-nutrition-review.schemas.js';
import type {
  NutritionRevisionRecord,
  RecipeNutritionRepository,
} from './recipe-nutrition.repository.js';
import type { BuiltEstimate, RecipeNutritionService } from './recipe-nutrition.service.js';

export interface NutritionReviewActor {
  userId: string;
  role: Role;
}

/** One initial attempt plus three automatic retries after 1, 5 and 15 minutes (user decision 2026-10-28). */
export const REVIEW_JOB_RETRY_DELAYS_MS = [60_000, 5 * 60_000, 15 * 60_000] as const;
export const REVIEW_JOB_MAX_ATTEMPTS = REVIEW_JOB_RETRY_DELAYS_MS.length + 1;
const AUDIT_LIMIT = 50;

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

/** Steps that change ingredients but have no reviewed cooking method leave the estimate on a raw baseline. */
function stepsWithoutMethod(revision: NutritionRevisionRecord): number[] {
  return revision.recipeSteps
    .filter(
      (step) =>
        !step.cookingMethodId &&
        Array.isArray(step.affectedIngredientPositions) &&
        step.affectedIngredientPositions.length > 0,
    )
    .map((step) => step.position);
}

export class RecipeNutritionReviewService {
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly repository: RecipeNutritionReviewRepository,
    private readonly nutritionRepository: RecipeNutritionRepository,
    private readonly nutrition: RecipeNutritionService,
    private readonly provider: AiProvider,
    private readonly aiTimeoutMs: number,
  ) {}

  /** Submit hook: canonical estimate now, AI gap-filling job only when reviewed data is insufficient.
   * Never throws: nutrition must not block submission; the reviewer can recalculate later.
   */
  async onRevisionSubmitted(revisionId: string): Promise<void> {
    try {
      await this.calculate(revisionId, RecipeNutritionJobTrigger.SUBMIT, null);
    } catch (error) {
      console.error('[RecipeNutritionReview] Submit calculation failed:', error);
    }
  }

  async panel(revisionId: string, actor: NutritionReviewActor): Promise<ReviewNutritionPanel> {
    const context = await this.requireRecipeContext(revisionId);
    const editDenial = await this.editDenial(context, actor);
    const [resolved, estimate, job, audits, previous] = await Promise.all([
      this.repository.resolve(revisionId),
      this.repository.findCurrentEstimateMeta(revisionId),
      this.repository.findLatestReviewJob(revisionId),
      this.repository.listAudits(revisionId, AUDIT_LIMIT),
      this.repository.findPreviousApproved(context.postId, context.version),
    ]);
    const uncovered = estimate ? uncoveredList(estimate.uncoveredIngredients, estimate.lines) : [];
    return {
      revisionId: context.id,
      postId: context.postId,
      revisionVersion: context.version,
      revisionStatus: context.status,
      servings: resolved.servings,
      canEdit: editDenial === null,
      canApprove: resolved.missingMetrics.length === 0,
      missingMetrics: resolved.missingMetrics,
      metrics: resolved.metrics.map((item) => ({
        metric: item.metric,
        unit: item.unit,
        estimate: {
          value: item.estimate.value,
          partialValue: item.estimate.partialValue,
          origin: item.estimate.origin,
          confidence: item.estimate.confidence,
        },
        override: item.override
          ? {
              value: item.override.value,
              updatedBy: item.override.updatedBy,
              updatedAt: item.override.updatedAt.toISOString(),
            }
          : null,
        finalValue: item.finalValue,
        finalOrigin: item.finalOrigin,
      })),
      estimate: estimate
        ? {
            id: estimate.id,
            version: estimate.version,
            confidence: estimate.confidence,
            aiUsed: estimate.aiUsed,
            calculationVersion: estimate.calculationVersion,
            disclaimer: estimate.disclaimer,
            createdAt: estimate.createdAt.toISOString(),
          }
        : null,
      uncoveredIngredients: uncovered,
      aiJob: job && job.state ? jobOutput(job, job.state) : null,
      previousApproved: previous
        ? {
            revisionId: previous.id,
            revisionVersion: previous.version,
            reviewedAt: iso(previous.reviewedAt),
            values: {
              calories: previous.recipeDetail.calories,
              proteinGrams: previous.recipeDetail.proteinGrams,
              carbsGrams: previous.recipeDetail.carbsGrams,
              fatGrams: previous.recipeDetail.fatGrams,
              fiberGrams: previous.recipeDetail.fiberGrams,
            },
            overriddenMetrics: previous.nutritionOverrides
              .map((item) => item.metric)
              .filter((metric): metric is RecipeReviewNutritionMetric =>
                REVIEW_NUTRITION_METRICS.some((definition) => definition.metric === metric),
              ),
          }
        : null,
      audit: audits.map((audit) => ({
        id: audit.id,
        metric: audit.metric as RecipeReviewNutritionMetric,
        action: audit.action === 'CLEAR_OVERRIDE' ? 'CLEAR_OVERRIDE' : 'SET_OVERRIDE',
        previousValue: audit.previousValue,
        previousOrigin: originOrNull(audit.previousOrigin),
        newValue: audit.newValue,
        newOrigin: originOrNull(audit.newOrigin),
        reason: audit.reason,
        actor: audit.actor,
        createdAt: audit.createdAt.toISOString(),
      })),
    };
  }

  async setOverrides(
    revisionId: string,
    actor: NutritionReviewActor,
    input: ReviewNutritionOverrideInput,
  ): Promise<ReviewNutritionPanel> {
    const context = await this.requireRecipeContext(revisionId);
    const denial = await this.editDenial(context, actor);
    if (denial) throw denial;
    const changes = REVIEW_NUTRITION_METRICS.flatMap((definition) => {
      const value = input.values[definition.metric];
      if (value === undefined) return [];
      return [
        {
          metric: definition.metric,
          value:
            value === null
              ? null
              : definition.metric === 'calories'
                ? Math.round(value)
                : Math.round(value * 100) / 100,
        },
      ];
    });
    await this.repository.applyOverrides({
      revisionId,
      postId: context.postId,
      actorId: actor.userId,
      actorRole: actor.role,
      reason: input.reason ?? null,
      changes,
    });
    return this.panel(revisionId, actor);
  }

  /** Reviewer "AI tính lại": full recompute from current data; overrides are kept. System-paid, no quota. */
  async recalculate(
    revisionId: string,
    actor: NutritionReviewActor,
  ): Promise<ReviewNutritionPanel> {
    const context = await this.requireRecipeContext(revisionId);
    const denial = await this.editDenial(context, actor);
    if (denial) throw denial;
    await this.calculate(revisionId, RecipeNutritionJobTrigger.REVIEWER_RETRY, actor.userId);
    return this.panel(revisionId, actor);
  }

  /** Startup sweep: requeue jobs interrupted mid-attempt and re-arm timers for queued/scheduled ones. */
  async recoverJobs(): Promise<void> {
    try {
      const jobs = await this.repository.findRecoverableJobs();
      for (const job of jobs) {
        if (job.state === RecipeNutritionJobState.RUNNING) {
          if (await this.repository.recoverStuckRunning(job)) this.schedule(job.id, 0);
          continue;
        }
        const due = job.nextAttemptAt ? job.nextAttemptAt.getTime() - Date.now() : 0;
        this.schedule(job.id, Math.max(0, due));
      }
    } catch (error) {
      console.error('[RecipeNutritionReview] Job recovery failed:', error);
    }
  }

  private async calculate(
    revisionId: string,
    trigger: RecipeNutritionJobTrigger,
    requestedById: string | null,
  ): Promise<void> {
    const revision = await this.nutritionRepository.findRevisionById(revisionId);
    if (!revision?.recipeDetail) return;
    const built = await this.nutrition.buildForReview(revision, null);
    await this.nutrition.persistBuilt(revision, built);
    if (!this.needsAi(revision, built)) {
      await this.repository.cancelActiveJobs(revisionId, 'CANONICAL_DATA_COMPLETE');
      return;
    }
    const job = await this.repository.replaceActiveJob({
      revisionId,
      provider: this.provider.name,
      modelId: this.provider.chatModel,
      requestPayloadHash: built.recipeFingerprint,
      trigger,
      requestedById,
      maxAttempts: REVIEW_JOB_MAX_ATTEMPTS,
    });
    this.schedule(job.id, 0);
  }

  private needsAi(revision: NutritionRevisionRecord, built: BuiltEstimate): boolean {
    return missingMetricsByLine(built.lines).size > 0 || stepsWithoutMethod(revision).length > 0;
  }

  private schedule(jobId: string, delayMs: number): void {
    const existing = this.timers.get(jobId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      this.timers.delete(jobId);
      void this.runJob(jobId).catch((error: unknown) => {
        console.error('[RecipeNutritionReview] Job run failed:', error);
      });
    }, delayMs);
    timer.unref();
    this.timers.set(jobId, timer);
  }

  private async runJob(jobId: string): Promise<void> {
    const job = await this.repository.claim(jobId, this.aiTimeoutMs + 60_000);
    if (!job) return;
    const revision = await this.nutritionRepository.findRevisionById(job.revisionId);
    if (!revision?.recipeDetail || !REVIEWABLE_REVISION_STATUSES.includes(revision.status)) {
      await this.repository.finishRunning(job.id, {
        state: RecipeNutritionJobState.CANCELLED,
        status: AiRequestStatus.ABORTED,
        errorCode: 'REVISION_NOT_PENDING',
        completedAt: new Date(),
      });
      return;
    }
    let suggestion: RecipeNutritionReviewEstimateSuggestion;
    try {
      const canonical = await this.nutrition.buildForReview(revision, null);
      const missing = missingMetricsByLine(canonical.lines);
      const inputs = await this.nutritionRepository.findNutritionInputs([], []);
      suggestion = await this.provider.estimateRecipeNutritionForReview({
        recipeTitle: revision.title,
        servings: revision.recipeDetail.servings,
        ingredients: revision.ingredients.map((ingredient) => ({
          position: ingredient.position,
          displayName: ingredient.displayName,
          canonicalName: ingredient.ingredient?.canonicalName ?? null,
          amount: ingredient.amount,
          unit: ingredient.unit,
          optional: ingredient.optional,
          missingMetrics: missing.get(ingredient.position) ?? [],
        })),
        steps: revision.recipeSteps.map((step) => ({
          position: step.position,
          instruction: step.instruction,
          cookingMethodCode: step.cookingMethod?.code ?? null,
          durationMinutes: step.durationMinutes,
          temperatureCelsius: step.temperatureCelsius,
          affectedIngredientPositions: Array.isArray(step.affectedIngredientPositions)
            ? step.affectedIngredientPositions.filter(
                (item): item is number => typeof item === 'number',
              )
            : [],
        })),
        availableCookingMethodCodes: inputs.methods
          .filter((method) => method.active)
          .map((method) => method.code),
        signal: AbortSignal.timeout(this.aiTimeoutMs),
      });
    } catch (error) {
      await this.failAttempt(job, error);
      return;
    }
    let hinted: BuiltEstimate;
    try {
      hinted = await this.nutrition.buildForReview(revision, suggestion);
    } catch (error) {
      await this.repository.finishRunning(job.id, {
        state: RecipeNutritionJobState.FAILED,
        status: AiRequestStatus.FAILED,
        errorCode: 'ESTIMATE_BUILD_FAILED',
        completedAt: new Date(),
      });
      throw error;
    }
    await this.repository.completeWithEstimate(
      job.id,
      revision.id,
      () => this.nutrition.persistBuilt(revision, hinted, job.id),
      suggestion as unknown as Prisma.InputJsonObject,
    );
  }

  private async failAttempt(job: NutritionReviewJobRecord, error: unknown): Promise<void> {
    const errorCode =
      error instanceof Error && error.name === 'AiProviderUnavailableError'
        ? 'AI_PROVIDER_UNAVAILABLE'
        : error instanceof AiProviderInvalidOutputError
          ? 'AI_INVALID_OUTPUT'
          : error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
            ? 'AI_TIMEOUT'
            : 'AI_PROVIDER_ERROR';
    // Never log prompt or model content; schema issue paths are enough to diagnose.
    console.warn('[RecipeNutritionReview] AI attempt failed', {
      jobId: job.id,
      attempt: job.attemptCount,
      errorCode,
      error: error instanceof Error ? `${error.name}: ${error.message}` : 'unknown',
      ...(error instanceof AiProviderInvalidOutputError
        ? { issues: error.issues.slice(0, 10) }
        : {}),
    });
    const delay = REVIEW_JOB_RETRY_DELAYS_MS[job.attemptCount - 1];
    if (job.attemptCount < job.maxAttempts && delay !== undefined) {
      const nextAttemptAt = new Date(Date.now() + delay);
      if (
        await this.repository.finishRunning(job.id, {
          state: RecipeNutritionJobState.RETRY_SCHEDULED,
          errorCode,
          nextAttemptAt,
        })
      ) {
        this.schedule(job.id, delay);
      }
      return;
    }
    await this.repository.finishRunning(job.id, {
      state: RecipeNutritionJobState.FAILED,
      status: AiRequestStatus.FAILED,
      errorCode,
      completedAt: new Date(),
    });
  }

  private async requireRecipeContext(revisionId: string): Promise<NutritionReviewContext> {
    const context = await this.repository.findReviewContext(revisionId);
    if (!context) {
      throw new AppError({
        statusCode: 404,
        code: 'NOT_FOUND',
        message: 'Không tìm thấy revision review target',
      });
    }
    if (context.post.type !== PostType.RECIPE || !context.recipeDetail) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_CONTENT',
        message: 'Revision không phải công thức có dữ liệu cấu trúc',
      });
    }
    return context;
  }

  /** Same eligibility as the publication decision: whoever may decide may edit/recalculate nutrition. */
  private async editDenial(
    context: NutritionReviewContext,
    actor: NutritionReviewActor,
  ): Promise<AppError | null> {
    if (
      context.version !== context.post.version ||
      !REVIEWABLE_REVISION_STATUSES.includes(context.status)
    ) {
      return new AppError({
        statusCode: 409,
        code: 'REVIEW_ALREADY_DECIDED',
        message: 'Revision không còn ở trạng thái chờ review',
      });
    }
    if (context.createdById === actor.userId || context.post.authorId === actor.userId) {
      return new AppError({
        statusCode: 403,
        code: 'SELF_APPROVAL_FORBIDDEN',
        message: 'Không được review nội dung do chính mình tạo',
      });
    }
    const unavailable: PostStatus[] = [PostStatus.HIDDEN, PostStatus.DELETED];
    if (unavailable.includes(context.post.status)) {
      return new AppError({
        statusCode: 409,
        code: 'CONTENT_STATE_CONFLICT',
        message: 'Nội dung đang bị ẩn hoặc đã xóa',
      });
    }
    if (actor.role === Role.ADMIN) return null;
    const openReports = await this.repository.countOpenPostReports(context.postId);
    if (
      context.post.author.role === Role.ADMIN ||
      context.status !== PostRevisionStatus.PENDING_REVIEW ||
      context.aiFlags.some((flag) => flag.status === 'OPEN') ||
      openReports >= 5
    ) {
      return new AppError({
        statusCode: 403,
        code: 'ADMIN_REVIEW_REQUIRED',
        message: 'Flagged/quarantined/high-priority hoặc Admin content bắt buộc Admin review',
      });
    }
    return null;
  }
}

function originOrNull(value: string | null): NutritionValueOrigin | null {
  return value && (Object.values(NutritionValueOrigin) as string[]).includes(value)
    ? (value as NutritionValueOrigin)
    : null;
}

function jobOutput(job: NutritionReviewJobRecord, state: RecipeNutritionJobState) {
  return {
    id: job.id,
    state,
    trigger: job.trigger,
    attemptCount: job.attemptCount,
    maxAttempts: job.maxAttempts,
    nextAttemptAt: iso(job.nextAttemptAt),
    errorCode: job.errorCode,
    startedAt: job.startedAt.toISOString(),
    completedAt: iso(job.completedAt),
    updatedAt: job.updatedAt.toISOString(),
  };
}

function uncoveredList(
  value: Prisma.JsonValue,
  lines: Array<{
    position: number;
    displayName: string;
    origin: NutritionValueOrigin;
    nutrientCoverage: Prisma.JsonValue;
  }>,
) {
  const reasons = new Map<number, string>();
  if (Array.isArray(value)) {
    for (const item of value) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const record = item as Record<string, unknown>;
      if (typeof record.position === 'number' && typeof record.reason === 'string') {
        reasons.set(record.position, record.reason);
      }
    }
  }
  const missing = missingMetricsByStoredLine(lines);
  return lines.flatMap((line) => {
    const reason =
      reasons.get(line.position) ?? (missing.has(line.position) ? 'MISSING_REVIEW_METRICS' : null);
    if (!reason) return [];
    return [
      {
        position: line.position,
        displayName: line.displayName,
        reason,
        missingMetrics: missing.get(line.position) ?? [],
        aiEstimated: line.origin === NutritionValueOrigin.AI_ESTIMATED,
      },
    ];
  });
}
