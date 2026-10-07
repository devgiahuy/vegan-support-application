import { searchMongoPublished } from './content-search.mongo.js';
import { lockDocument } from '../../database/locking.js';
import type { Prisma } from '@prisma/client';
import {
  CatalogStatus,
  FoodDataReviewStatus,
  MediaAssetStatus,
  MediaKind,
  MediaProvider,
  ModerationDecision,
  ModerationTargetType,
  PostRevisionStatus,
  PostStatus,
  type DietPattern,
  type IngredientResolutionStatus,
  type Post,
  type PostType,
  type PrismaClient,
  type RecipeDifficulty,
  type Tradition,
  UserStatus,
  StorageReservationStatus,
} from '@prisma/client';
import type { PostListQuery } from './content.schemas.js';
import type { ResolvedMediaInput } from './media.service.js';
import type { SubmissionDecision } from './content-publication.policy.js';
import { normalizeVietnameseText } from '../catalog/catalog.normalization.js';
import { MODERATION_RULE_VERSION } from '../moderation/rule-moderation.service.js';
import { aiCorrelationId } from '../ai-governance/ai-governance.context.js';

const revisionInclude = {
  recipeDetail: true,
  ingredients: { include: { ingredient: true }, orderBy: { position: 'asc' } },
  recipeSteps: { include: { cookingMethod: true }, orderBy: { position: 'asc' } },
  dietCompatibility: { orderBy: { dietPattern: 'asc' } },
  categories: { include: { category: true }, orderBy: { category: { name: 'asc' } } },
  tags: { orderBy: { normalizedTag: 'asc' } },
  media: { orderBy: { position: 'asc' } },
  aiFlags: { orderBy: { createdAt: 'asc' } },
  reviewedBy: { select: { id: true, displayName: true, avatarUrl: true } },
} satisfies Prisma.PostRevisionInclude;

const postIdentityInclude = {
  author: true,
  publishedRevision: { select: { version: true } },
} satisfies Prisma.PostInclude;
const publishedPostInclude = {
  author: true,
  publishedRevision: { include: revisionInclude },
} satisfies Prisma.PostInclude;

const searchProfileSelect = {
  dietPreference: true,
  dietScheduleDates: {
    where: { enabled: true },
    select: { date: true },
  },
  dietPreferenceRules: {
    where: { enabled: true },
    select: {
      ruleDefinition: {
        select: { active: true, hardConstraint: true, tradition: true },
      },
    },
  },
  allergies: {
    where: { active: true },
    select: { allergenCode: true },
  },
  ingredientExclusions: {
    where: { active: true },
    select: { ingredientId: true, normalizedName: true },
  },
} satisfies Prisma.UserSelect;

const ingredientMetadataInclude = {
  aliases: { where: { reviewStatus: FoodDataReviewStatus.APPROVED } },
  allergens: true,
  dietCompatibilities: true,
  traditionWarnings: true,
} satisfies Prisma.IngredientInclude;

export type RevisionRecord = Prisma.PostRevisionGetPayload<{ include: typeof revisionInclude }>;
export type PostIdentityRecord = Prisma.PostGetPayload<{ include: typeof postIdentityInclude }>;
export type PublishedPostRecord = Prisma.PostGetPayload<{ include: typeof publishedPostInclude }>;
export type SearchProfileRecord = Prisma.UserGetPayload<{ select: typeof searchProfileSelect }>;
export type IngredientMetadataRecord = Prisma.IngredientGetPayload<{
  include: typeof ingredientMetadataInclude;
}>;

export interface ResolvedRecipeIngredient {
  ingredientId?: string;
  displayName: string;
  normalizedName: string;
  amount: number;
  unit: string;
  optional: boolean;
  resolutionStatus: IngredientResolutionStatus;
}

export interface RecipeSnapshot {
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: RecipeDifficulty;
  calories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  fiberGrams?: number;
  vitaminB12Mcg?: number;
  mealPlannerEligible: boolean;
  allergenCodes: string[];
  traditionWarnings: Array<{ tradition: string; warningCode: string; label: string }>;
  ingredients: ResolvedRecipeIngredient[];
  steps: Array<{
    instruction: string;
    cookingMethodId?: string;
    durationMinutes?: number;
    temperatureCelsius?: number;
    affectedIngredientPositions: number[];
  }>;
  dietCompatibilities: Array<{
    dietPattern: 'VEGAN' | 'LACTO_OVO';
    compatible: boolean;
    reasonCodes: string[];
  }>;
}

export interface RevisionSnapshot {
  title: string;
  excerpt?: string;
  body: string;
  categoryIds: string[];
  tags: Array<{ tag: string; normalizedTag: string }>;
  media: ResolvedMediaInput[];
  recipe?: RecipeSnapshot;
}

export interface ContentSearchCriteria extends Omit<PostListQuery, 'q'> {
  normalizedQuery?: string;
}

export interface SearchConstraints {
  dietPattern?: DietPattern;
  allergenCodes: string[];
  excludedIngredientIds: string[];
  excludedNormalizedNames: string[];
  traditions: Tradition[];
  requireResolvedIngredients: boolean;
}

export class ContentVersionConflictError extends Error {
  constructor() {
    super('CONTENT_VERSION_CONFLICT');
    this.name = 'ContentVersionConflictError';
  }
}

export class ContentActorInactiveError extends Error {
  constructor(readonly status: UserStatus) {
    super('CONTENT_ACTOR_INACTIVE');
    this.name = 'ContentActorInactiveError';
  }
}

export class ContentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async searchPublished(
    criteria: ContentSearchCriteria,
    constraints: SearchConstraints,
  ): Promise<{ records: PublishedPostRecord[]; total: number }> {
    const result = await searchMongoPublished(this.prisma, criteria, constraints, {
      limit: criteria.limit,
      offset: (criteria.page - 1) * criteria.limit,
      count: true,
    });
    return { records: await this.hydratePublished(result.ids), total: result.total };
  }

  findSearchProfile(userId: string): Promise<SearchProfileRecord | null> {
    return this.prisma.user.findUnique({ where: { id: userId }, select: searchProfileSelect });
  }

  findPublishedPost(id: string): Promise<PublishedPostRecord | null> {
    return this.prisma.post.findFirst({
      where: {
        id,
        status: PostStatus.PUBLISHED,
        deletedAt: null,
        publishedRevisionId: { not: null },
        publishedRevision: { is: { status: PostRevisionStatus.PUBLISHED } },
      },
      include: publishedPostInclude,
    });
  }

  async findRecommendationCandidates(
    constraints: SearchConstraints,
    limit: number,
  ): Promise<PublishedPostRecord[]> {
    const result = await searchMongoPublished(this.prisma, { type: 'RECIPE' }, constraints, {
      limit,
    });
    return this.hydratePublished(result.ids);
  }

  async findMealPlannerCandidates(constraints: SearchConstraints): Promise<PublishedPostRecord[]> {
    const result = await searchMongoPublished(this.prisma, { type: 'RECIPE' }, constraints, {
      planner: true,
    });
    return this.hydratePublished(result.ids);
  }

  findBehaviorSourceRecipes(ids: string[]): Promise<PublishedPostRecord[]> {
    if (!ids.length) return Promise.resolve([]);
    return this.prisma.post.findMany({
      where: {
        id: { in: ids },
        type: 'RECIPE',
        publishedRevisionId: { not: null },
      },
      include: publishedPostInclude,
    });
  }

  async findRelatedPublished(
    source: PublishedPostRecord,
    limitPerType: number,
    constraints: SearchConstraints,
  ): Promise<Record<PostType, PublishedPostRecord[]>> {
    const revision = source.publishedRevision;
    if (!revision) return { RECIPE: [], BLOG: [], VIDEO: [] };
    const related = {
      categoryIds: revision.categories.map((item) => item.categoryId),
      ingredientIds: revision.ingredients.flatMap((item) =>
        item.ingredientId ? [item.ingredientId] : [],
      ),
      normalizedTags: revision.tags.map((item) => item.normalizedTag),
    };
    const result = {} as Record<PostType, PublishedPostRecord[]>;
    for (const type of ['RECIPE', 'BLOG', 'VIDEO'] as const) {
      const matches = await searchMongoPublished(this.prisma, { type }, constraints, {
        excludeId: source.id,
        limit: limitPerType,
        related,
      });
      result[type] = await this.hydratePublished(matches.ids);
    }
    return result;
  }

  findPostByIdentifier(identifier: string): Promise<PostIdentityRecord | null> {
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      identifier,
    );
    return this.prisma.post.findFirst({
      where: uuid ? { OR: [{ id: identifier }, { slug: identifier }] } : { slug: identifier },
      include: postIdentityInclude,
    });
  }

  findPost(id: string): Promise<PostIdentityRecord | null> {
    return this.prisma.post.findUnique({ where: { id }, include: postIdentityInclude });
  }

  findRevision(id: string): Promise<RevisionRecord | null> {
    return this.prisma.postRevision.findUnique({ where: { id }, include: revisionInclude });
  }

  findLatestRevision(postId: string): Promise<RevisionRecord | null> {
    return this.prisma.postRevision.findFirst({
      where: { postId },
      include: revisionInclude,
      orderBy: { version: 'desc' },
    });
  }

  async findActiveCategoryIds(ids: string[]): Promise<string[]> {
    const categories = await this.prisma.category.findMany({
      where: { id: { in: ids }, status: CatalogStatus.ACTIVE },
      select: { id: true },
    });
    return categories.map((category) => category.id);
  }

  findIngredientMetadata(
    ids: string[],
    normalizedNames: string[],
  ): Promise<IngredientMetadataRecord[]> {
    return this.prisma.ingredient.findMany({
      where: {
        status: CatalogStatus.ACTIVE,
        OR: [
          ...(ids.length ? [{ id: { in: ids } }] : []),
          ...(normalizedNames.length
            ? [
                { normalizedName: { in: normalizedNames } },
                {
                  aliases: {
                    some: {
                      normalizedAlias: { in: normalizedNames },
                      reviewStatus: FoodDataReviewStatus.APPROVED,
                    },
                  },
                },
              ]
            : []),
        ],
      },
      include: ingredientMetadataInclude,
    });
  }

  async listReviewHistory(postId: string, page: number, limit: number) {
    const where: Prisma.PostRevisionWhereInput = { postId };
    const [records, total] = await this.prisma.$transaction(async (transaction) =>
      Promise.all([
        transaction.postRevision.findMany({
          where,
          include: revisionInclude,
          orderBy: [{ version: 'desc' }, { id: 'desc' }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        transaction.postRevision.count({ where }),
      ]),
    );
    return { records, total };
  }

  async hasValidVideoMediaForSubmission(
    postId: string,
    revisionId: string,
    ownerId: string,
  ): Promise<boolean> {
    const revision = await this.prisma.postRevision.findFirst({
      where: { id: revisionId, postId, post: { authorId: ownerId, type: 'VIDEO' } },
      select: {
        media: {
          where: { kind: MediaKind.VIDEO },
          select: {
            provider: true,
            publicId: true,
            secureUrl: true,
            asset: {
              select: {
                ownerId: true,
                publicId: true,
                kind: true,
                resourceType: true,
                status: true,
                bytes: true,
                backfilled: true,
                reservation: { select: { status: true } },
              },
            },
          },
        },
      },
    });
    if (!revision || revision.media.length !== 1) return false;
    const media = revision.media[0];
    if (!media) return false;
    if (media.provider === MediaProvider.YOUTUBE) {
      return Boolean(
        media.publicId &&
        /^[A-Za-z0-9_-]{11}$/.test(media.publicId) &&
        media.secureUrl === `https://www.youtube.com/watch?v=${media.publicId}`,
      );
    }
    const asset = media.asset;
    return Boolean(
      asset &&
      asset.ownerId === ownerId &&
      asset.publicId === media.publicId &&
      asset.kind === MediaKind.VIDEO &&
      asset.resourceType === 'VIDEO' &&
      asset.status === MediaAssetStatus.ACTIVE &&
      asset.bytes > 0n &&
      (asset.backfilled || asset.reservation?.status === StorageReservationStatus.COMMITTED),
    );
  }

  async findActiveCookingMethodIds(ids: string[]): Promise<string[]> {
    const methods = await this.prisma.cookingMethod.findMany({
      where: { id: { in: ids }, active: true },
      select: { id: true },
    });
    return methods.map((method) => method.id);
  }

  private async hydratePublished(ids: string[]): Promise<PublishedPostRecord[]> {
    if (!ids.length) return [];
    const records = await this.prisma.post.findMany({
      where: {
        id: { in: ids },
        status: PostStatus.PUBLISHED,
        deletedAt: null,
        publishedRevisionId: { not: null },
        publishedRevision: { is: { status: PostRevisionStatus.PUBLISHED } },
      },
      include: publishedPostInclude,
    });
    const byId = new Map(records.map((post) => [post.id, post]));
    return ids.flatMap((id) => {
      const post = byId.get(id);
      return post ? [post] : [];
    });
  }

  async createPost(
    authorId: string,
    type: PostType,
    slug: string,
    snapshot: RevisionSnapshot,
    decision: SubmissionDecision,
  ): Promise<{ post: PostIdentityRecord; revision: RevisionRecord }> {
    return this.prisma.$transaction(async (transaction) => {
      await this.lockActiveActor(transaction, authorId);
      const post = await transaction.post.create({
        data: { authorId, type, slug, status: decision.postStatus, version: 1 },
        include: postIdentityInclude,
      });
      const revision = await this.createRevision(
        transaction,
        post.id,
        authorId,
        1,
        snapshot,
        decision.revisionStatus,
      );
      if (decision.moderationFlag) {
        await transaction.aiFlag.create({
          data: { postRevisionId: revision.id, ...decision.moderationFlag },
        });
      }
      if (decision.revisionStatus === PostRevisionStatus.PENDING_REVIEW)
        await transaction.aiGovernanceEvent.create({
          data: {
            capability: 'MODERATION',
            provider: 'RULE_ENGINE',
            modelId: decision.moderationFlag?.model ?? null,
            templateVersion: MODERATION_RULE_VERSION,
            correlationId: aiCorrelationId(),
            status: decision.moderationFlag ? 'BLOCKED' : 'SUCCESS',
            safetyOutcome: decision.moderationFlag ? 'FLAGGED_FOR_REVIEW' : 'CLEAR',
            confidence: decision.moderationFlag?.riskScore ?? null,
            startedAt: new Date(),
            completedAt: new Date(),
          },
        });
      const createdPost =
        decision.revisionStatus === PostRevisionStatus.PUBLISHED
          ? await transaction.post.update({
              where: { id: post.id },
              data: { publishedRevisionId: revision.id, publishedAt: new Date() },
              include: postIdentityInclude,
            })
          : post;
      if (decision.revisionStatus === PostRevisionStatus.PUBLISHED) {
        await transaction.moderationAction.create({
          data: {
            actorId: authorId,
            decision: ModerationDecision.APPROVE,
            targetType: ModerationTargetType.POST,
            targetId: post.id,
            reason: 'RULE_MODERATION_PASSED',
            metadata: {
              automated: true,
              ruleVersion: MODERATION_RULE_VERSION,
              revisionId: revision.id,
              revisionVersion: revision.version,
            },
          },
        });
      }
      return { post: createdPost, revision };
    });
  }

  async createUpdatedRevision(
    post: Post,
    actorId: string,
    expectedVersion: number,
    slug: string,
    snapshot: RevisionSnapshot,
    decision: SubmissionDecision,
  ): Promise<{ post: PostIdentityRecord; revision: RevisionRecord }> {
    return this.prisma.$transaction(async (transaction) => {
      await this.lockActiveActor(transaction, actorId);
      const nextVersion = expectedVersion + 1;
      const updated = await transaction.post.updateMany({
        where: { id: post.id, version: expectedVersion, status: { not: PostStatus.DELETED } },
        data: {
          slug,
          version: { increment: 1 },
          ...(post.publishedRevisionId ? {} : { status: decision.postStatus }),
        },
      });
      if (updated.count !== 1) throw new ContentVersionConflictError();
      const revision = await this.createRevision(
        transaction,
        post.id,
        actorId,
        nextVersion,
        snapshot,
        decision.revisionStatus,
      );
      if (decision.moderationFlag) {
        await transaction.aiFlag.create({
          data: { postRevisionId: revision.id, ...decision.moderationFlag },
        });
      }
      if (decision.revisionStatus === PostRevisionStatus.PENDING_REVIEW)
        await transaction.aiGovernanceEvent.create({
          data: {
            capability: 'MODERATION',
            provider: 'RULE_ENGINE',
            modelId: decision.moderationFlag?.model ?? null,
            templateVersion: MODERATION_RULE_VERSION,
            correlationId: aiCorrelationId(),
            status: decision.moderationFlag ? 'BLOCKED' : 'SUCCESS',
            safetyOutcome: decision.moderationFlag ? 'FLAGGED_FOR_REVIEW' : 'CLEAR',
            confidence: decision.moderationFlag?.riskScore ?? null,
            startedAt: new Date(),
            completedAt: new Date(),
          },
        });
      if (decision.revisionStatus === PostRevisionStatus.PUBLISHED) {
        await transaction.post.update({
          where: { id: post.id },
          data: {
            status: PostStatus.PUBLISHED,
            publishedRevisionId: revision.id,
            publishedAt: new Date(),
            hiddenAt: null,
            hiddenById: null,
            hiddenReason: null,
          },
        });
        await transaction.moderationAction.create({
          data: {
            actorId,
            decision: ModerationDecision.APPROVE,
            targetType: ModerationTargetType.POST,
            targetId: post.id,
            reason: 'RULE_MODERATION_PASSED',
            metadata: {
              automated: true,
              ruleVersion: MODERATION_RULE_VERSION,
              revisionId: revision.id,
              revisionVersion: revision.version,
            },
          },
        });
      }
      const updatedPost = await transaction.post.findUniqueOrThrow({
        where: { id: post.id },
        include: postIdentityInclude,
      });
      return { post: updatedPost, revision };
    });
  }

  async submitRevision(
    postId: string,
    revisionId: string,
    actorId: string,
    expectedVersion: number,
    decision: SubmissionDecision,
  ): Promise<{ post: PostIdentityRecord; revision: RevisionRecord }> {
    return this.prisma.$transaction(async (transaction) => {
      await this.lockActiveActor(transaction, actorId);
      await lockDocument(transaction, 'post', { id: postId });
      await lockDocument(transaction, 'postRevision', { id: revisionId });
      const locked = await transaction.postRevision.findFirst({
        where: {
          id: revisionId,
          postId,
          version: expectedVersion,
          status: PostRevisionStatus.DRAFT,
          post: {
            authorId: actorId,
            version: expectedVersion,
            status: { notIn: [PostStatus.HIDDEN, PostStatus.DELETED] },
          },
        },
      });
      if (!locked) throw new ContentVersionConflictError();
      const now = new Date();
      await transaction.postRevision.update({
        where: { id: revisionId },
        data: {
          status: decision.revisionStatus,
          submittedAt: now,
          reviewNote: null,
          reviewedById: null,
          reviewedAt: null,
        },
      });
      if (decision.moderationFlag) {
        await transaction.aiFlag.create({
          data: { postRevisionId: revisionId, ...decision.moderationFlag },
        });
      }
      await transaction.aiGovernanceEvent.create({
        data: {
          capability: 'MODERATION',
          provider: 'RULE_ENGINE',
          modelId: decision.moderationFlag?.model ?? null,
          templateVersion: MODERATION_RULE_VERSION,
          correlationId: aiCorrelationId(),
          status: decision.moderationFlag ? 'BLOCKED' : 'SUCCESS',
          safetyOutcome: decision.moderationFlag ? 'FLAGGED_FOR_REVIEW' : 'CLEAR',
          confidence: decision.moderationFlag?.riskScore ?? null,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      });
      const current = await transaction.post.findUniqueOrThrow({ where: { id: postId } });
      await transaction.post.update({
        where: { id: postId },
        data: { status: current.publishedRevisionId ? PostStatus.PUBLISHED : decision.postStatus },
      });
      return {
        post: await transaction.post.findUniqueOrThrow({
          where: { id: postId },
          include: postIdentityInclude,
        }),
        revision: await transaction.postRevision.findUniqueOrThrow({
          where: { id: revisionId },
          include: revisionInclude,
        }),
      };
    });
  }

  async softDelete(postId: string, actorId: string, expectedVersion: number): Promise<boolean> {
    const result = await this.prisma.post.updateMany({
      where: { id: postId, version: expectedVersion, status: { not: PostStatus.DELETED } },
      data: {
        status: PostStatus.DELETED,
        deletedAt: new Date(),
        deletedById: actorId,
        version: { increment: 1 },
      },
    });
    return result.count === 1;
  }

  private createRevision(
    transaction: Prisma.TransactionClient,
    postId: string,
    actorId: string,
    version: number,
    snapshot: RevisionSnapshot,
    status: PostRevisionStatus = PostRevisionStatus.PENDING_REVIEW,
  ): Promise<RevisionRecord> {
    const recipe = snapshot.recipe;
    return transaction.postRevision.create({
      data: {
        post: { connect: { id: postId } },
        createdBy: { connect: { id: actorId } },
        version,
        status,
        title: snapshot.title,
        normalizedTitle: normalizeVietnameseText(snapshot.title),
        ...(snapshot.excerpt ? { excerpt: snapshot.excerpt } : {}),
        ...(snapshot.excerpt
          ? { normalizedExcerpt: normalizeVietnameseText(snapshot.excerpt) }
          : {}),
        body: snapshot.body,
        normalizedBody: normalizeVietnameseText(snapshot.body),
        categories: {
          create: snapshot.categoryIds.map((categoryId) => ({
            category: { connect: { id: categoryId } },
          })),
        },
        tags: { create: snapshot.tags },
        media: { create: snapshot.media.map((item, position) => this.mediaData(item, position)) },
        ...(recipe
          ? {
              recipeDetail: {
                create: {
                  servings: recipe.servings,
                  prepTimeMinutes: recipe.prepTimeMinutes,
                  cookTimeMinutes: recipe.cookTimeMinutes,
                  difficulty: recipe.difficulty,
                  ...(recipe.calories !== undefined ? { calories: recipe.calories } : {}),
                  ...(recipe.proteinGrams !== undefined
                    ? { proteinGrams: recipe.proteinGrams }
                    : {}),
                  ...(recipe.carbsGrams !== undefined ? { carbsGrams: recipe.carbsGrams } : {}),
                  ...(recipe.fatGrams !== undefined ? { fatGrams: recipe.fatGrams } : {}),
                  ...(recipe.fiberGrams !== undefined ? { fiberGrams: recipe.fiberGrams } : {}),
                  ...(recipe.vitaminB12Mcg !== undefined
                    ? { vitaminB12Mcg: recipe.vitaminB12Mcg }
                    : {}),
                  mealPlannerEligible: recipe.mealPlannerEligible,
                  allergenCodes: recipe.allergenCodes,
                  traditionWarnings: recipe.traditionWarnings,
                },
              },
              ingredients: {
                create: recipe.ingredients.map((ingredient, position) => ({
                  position,
                  ...(ingredient.ingredientId
                    ? { ingredient: { connect: { id: ingredient.ingredientId } } }
                    : {}),
                  displayName: ingredient.displayName,
                  normalizedName: ingredient.normalizedName,
                  amount: ingredient.amount,
                  unit: ingredient.unit,
                  optional: ingredient.optional,
                  resolutionStatus: ingredient.resolutionStatus,
                })),
              },
              dietCompatibility: {
                create: recipe.dietCompatibilities.map((compatibility) => ({
                  dietPattern: compatibility.dietPattern,
                  compatible: compatibility.compatible,
                  reasonCodes: compatibility.reasonCodes,
                })),
              },
              recipeSteps: {
                create: recipe.steps.map((step, position) => ({
                  position,
                  instruction: step.instruction,
                  ...(step.cookingMethodId
                    ? { cookingMethod: { connect: { id: step.cookingMethodId } } }
                    : {}),
                  ...(step.durationMinutes !== undefined
                    ? { durationMinutes: step.durationMinutes }
                    : {}),
                  ...(step.temperatureCelsius !== undefined
                    ? { temperatureCelsius: step.temperatureCelsius }
                    : {}),
                  affectedIngredientPositions: step.affectedIngredientPositions,
                })),
              },
            }
          : {}),
      },
      include: revisionInclude,
    });
  }

  private async lockActiveActor(
    transaction: Prisma.TransactionClient,
    actorId: string,
  ): Promise<void> {
    await lockDocument(transaction, 'user', { id: actorId });
    const user = await transaction.user.findUnique({
      where: { id: actorId },
      select: { status: true },
    });
    const status = user?.status;
    if (status !== UserStatus.ACTIVE)
      throw new ContentActorInactiveError(status ?? UserStatus.DELETED);
  }

  private mediaData(item: ResolvedMediaInput, position: number) {
    return {
      kind: item.kind,
      provider: item.provider,
      publicId: item.publicId,
      secureUrl: item.secureUrl,
      position,
      ...(item.provider === 'CLOUDINARY'
        ? {
            assetId: item.assetId,
            mimeType: item.mimeType,
            bytes: item.bytes,
            ...(item.width !== undefined ? { width: item.width } : {}),
            ...(item.height !== undefined ? { height: item.height } : {}),
            ...(item.durationSeconds !== undefined
              ? { durationSeconds: item.durationSeconds }
              : {}),
          }
        : {}),
    };
  }
}
