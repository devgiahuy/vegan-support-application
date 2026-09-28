import {
  FoodDataReviewStatus,
  PostRevisionStatus,
  PostStatus,
  PostType,
  RecipeNutritionEstimateStatus,
  type AiRequestStatus,
  type Prisma,
  type PrismaClient,
  type Role,
} from '@prisma/client';

const effectiveApproved = (now: Date) => ({
  reviewStatus: FoodDataReviewStatus.APPROVED,
  effectiveFrom: { lte: now },
  AND: [{ OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }] }],
});

const revisionInclude = {
  post: { include: { author: true } },
  recipeDetail: true,
  ingredients: { include: { ingredient: true }, orderBy: { position: 'asc' } },
  recipeSteps: { include: { cookingMethod: true }, orderBy: { position: 'asc' } },
} satisfies Prisma.PostRevisionInclude;

const estimateInclude = {
  revision: { include: { post: true } },
  lines: { orderBy: { position: 'asc' } },
  aiJobs: { orderBy: { createdAt: 'desc' }, take: 1 },
} satisfies Prisma.RecipeNutritionEstimateInclude;

export type NutritionRevisionRecord = Prisma.PostRevisionGetPayload<{
  include: typeof revisionInclude;
}>;
export type NutritionEstimateRecord = Prisma.RecipeNutritionEstimateGetPayload<{
  include: typeof estimateInclude;
}>;
export type NutritionAiJobRecord = Prisma.RecipeNutritionAiJobGetPayload<object>;

export interface NutritionActor {
  userId: string;
  role: Role;
}

export class RecipeNutritionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAccessibleRecipeRevision(
    postId: string,
    actor: NutritionActor | undefined,
  ): Promise<NutritionRevisionRecord | null> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        publishedRevision: { include: revisionInclude },
      },
    });
    if (!post || post.type !== PostType.RECIPE || post.status === PostStatus.DELETED) return null;
    const privileged = actor && (actor.userId === post.authorId || actor.role === 'ADMIN');
    if (privileged) {
      return this.prisma.postRevision.findFirst({
        where: { postId },
        include: revisionInclude,
        orderBy: { version: 'desc' },
      });
    }
    if (
      post.status === PostStatus.PUBLISHED &&
      post.publishedRevision?.status === PostRevisionStatus.PUBLISHED
    ) {
      return post.publishedRevision;
    }
    return null;
  }

  async findOwnedRecipeRevision(postId: string, actor: NutritionActor) {
    const revision = await this.findAccessibleRecipeRevision(postId, actor);
    if (!revision) return null;
    if (revision.post.authorId !== actor.userId && actor.role !== 'ADMIN') return null;
    return revision;
  }

  async findNutritionInputs(ingredientIds: string[], cookingMethodIds: string[]) {
    const now = new Date();
    const [profiles, methods] = await Promise.all([
      this.prisma.ingredientFoodProfile.findMany({
        where: {
          ingredientId: { in: ingredientIds },
          preparation: 'raw',
          ...effectiveApproved(now),
        },
        include: {
          ingredient: true,
          source: true,
          householdConversions: {
            where: { reviewStatus: FoodDataReviewStatus.APPROVED },
          },
          nutrientValues: {
            where: effectiveApproved(now),
            include: { nutrient: true },
          },
        },
        orderBy: [{ effectiveFrom: 'desc' }, { sourceVersion: 'desc' }],
      }),
      this.prisma.cookingMethod.findMany({
        where: { OR: [{ id: { in: cookingMethodIds } }, { active: true }] },
        include: {
          retentions: {
            where: effectiveApproved(now),
            include: { nutrient: true, source: true },
            orderBy: { effectiveFrom: 'desc' },
          },
          yields: {
            where: effectiveApproved(now),
            include: { source: true },
            orderBy: { effectiveFrom: 'desc' },
          },
        },
      }),
    ]);
    return { profiles, methods };
  }

  findCurrentEstimate(revisionId: string) {
    return this.prisma.recipeNutritionEstimate.findFirst({
      where: { revisionId, status: RecipeNutritionEstimateStatus.CURRENT },
      include: estimateInclude,
      orderBy: { version: 'desc' },
    });
  }

  async listEstimates(revisionId: string, page: number, limit: number) {
    const where = { revisionId };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.recipeNutritionEstimate.findMany({
        where,
        include: estimateInclude,
        orderBy: { version: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.recipeNutritionEstimate.count({ where }),
    ]);
    return { records, total };
  }

  findLatestAiJob(revisionId: string) {
    return this.prisma.recipeNutritionAiJob.findFirst({
      where: { revisionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  createAiJob(input: {
    revisionId: string;
    provider: string;
    modelId: string;
    status: AiRequestStatus;
    requestPayloadHash: string;
    resultPayload?: Prisma.InputJsonObject;
    errorCode?: string;
    startedAt: Date;
    completedAt?: Date;
  }) {
    return this.prisma.recipeNutritionAiJob.create({
      data: {
        revisionId: input.revisionId,
        provider: input.provider,
        modelId: input.modelId,
        status: input.status,
        requestPayloadHash: input.requestPayloadHash,
        ...(input.resultPayload ? { resultPayload: input.resultPayload } : {}),
        ...(input.errorCode ? { errorCode: input.errorCode } : {}),
        startedAt: input.startedAt,
        ...(input.completedAt ? { completedAt: input.completedAt } : {}),
      },
    });
  }

  async saveEstimate(input: {
    revisionId: string;
    currentFingerprint: string;
    estimate: Prisma.RecipeNutritionEstimateUncheckedCreateInput;
    lines: Prisma.RecipeNutritionEstimateLineUncheckedCreateWithoutEstimateInput[];
    aiJobId?: string;
  }): Promise<NutritionEstimateRecord> {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.recipeNutritionEstimate.updateMany({
        where: { revisionId: input.revisionId, status: RecipeNutritionEstimateStatus.CURRENT },
        data: { status: RecipeNutritionEstimateStatus.HISTORICAL },
      });
      const previous = await transaction.recipeNutritionEstimate.findFirst({
        where: { revisionId: input.revisionId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      const estimate = await transaction.recipeNutritionEstimate.create({
        data: {
          ...input.estimate,
          version: (previous?.version ?? 0) + 1,
          status: RecipeNutritionEstimateStatus.CURRENT,
          lines: { create: input.lines },
        },
        include: estimateInclude,
      });
      if (input.aiJobId) {
        await transaction.recipeNutritionAiJob.update({
          where: { id: input.aiJobId },
          data: { estimateId: estimate.id },
        });
      }
      await transaction.recipeNutritionEstimate.updateMany({
        where: {
          revisionId: input.revisionId,
          id: { not: estimate.id },
          recipeFingerprint: { not: input.currentFingerprint },
          status: RecipeNutritionEstimateStatus.HISTORICAL,
        },
        data: { status: RecipeNutritionEstimateStatus.STALE },
      });
      return estimate;
    });
  }

  markCurrentStale(revisionId: string) {
    return this.prisma.recipeNutritionEstimate.updateMany({
      where: { revisionId, status: RecipeNutritionEstimateStatus.CURRENT },
      data: { status: RecipeNutritionEstimateStatus.STALE },
    });
  }
}
