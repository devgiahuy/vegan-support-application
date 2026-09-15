import {
  CatalogStatus,
  PostRevisionStatus,
  PostStatus,
  type IngredientResolutionStatus,
  type Post,
  type PostType,
  type Prisma,
  type PrismaClient,
  type RecipeDifficulty,
} from '@prisma/client';
import type { MediaInput, PostListQuery } from './content.schemas.js';
import type { SubmissionDecision } from './content-publication.policy.js';

const revisionInclude = {
  recipeDetail: true,
  ingredients: { include: { ingredient: true }, orderBy: { position: 'asc' } },
  dietCompatibility: { orderBy: { dietPattern: 'asc' } },
  categories: { include: { category: true }, orderBy: { category: { name: 'asc' } } },
  media: { orderBy: { position: 'asc' } },
} satisfies Prisma.PostRevisionInclude;

const postIdentityInclude = {
  author: true,
  publishedRevision: { select: { version: true } },
} satisfies Prisma.PostInclude;
const publishedPostInclude = {
  author: true,
  publishedRevision: { include: revisionInclude },
} satisfies Prisma.PostInclude;

const ingredientMetadataInclude = {
  aliases: true,
  allergens: true,
  dietCompatibilities: true,
  traditionWarnings: true,
} satisfies Prisma.IngredientInclude;

export type RevisionRecord = Prisma.PostRevisionGetPayload<{ include: typeof revisionInclude }>;
export type PostIdentityRecord = Prisma.PostGetPayload<{ include: typeof postIdentityInclude }>;
export type PublishedPostRecord = Prisma.PostGetPayload<{ include: typeof publishedPostInclude }>;
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
  media: MediaInput[];
  recipe?: RecipeSnapshot;
}

export class ContentVersionConflictError extends Error {
  constructor() {
    super('CONTENT_VERSION_CONFLICT');
    this.name = 'ContentVersionConflictError';
  }
}

export class ContentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listPublished(
    query: PostListQuery,
  ): Promise<{ records: PublishedPostRecord[]; total: number }> {
    const where: Prisma.PostWhereInput = {
      status: PostStatus.PUBLISHED,
      deletedAt: null,
      publishedRevisionId: { not: null },
      ...(query.type ? { type: query.type } : {}),
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where,
        include: publishedPostInclude,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.post.count({ where }),
    ]);
    return { records, total };
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
                { aliases: { some: { normalizedAlias: { in: normalizedNames } } } },
              ]
            : []),
        ],
      },
      include: ingredientMetadataInclude,
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
      return { post, revision };
    });
  }

  async createUpdatedRevision(
    post: Post,
    actorId: string,
    expectedVersion: number,
    slug: string,
    snapshot: RevisionSnapshot,
  ): Promise<{ post: PostIdentityRecord; revision: RevisionRecord }> {
    return this.prisma.$transaction(async (transaction) => {
      const nextVersion = expectedVersion + 1;
      const updated = await transaction.post.updateMany({
        where: { id: post.id, version: expectedVersion, status: { not: PostStatus.DELETED } },
        data: {
          slug,
          version: { increment: 1 },
          ...(post.status === PostStatus.PUBLISHED ? {} : { status: PostStatus.PENDING_REVIEW }),
        },
      });
      if (updated.count !== 1) throw new ContentVersionConflictError();
      const revision = await this.createRevision(
        transaction,
        post.id,
        actorId,
        nextVersion,
        snapshot,
      );
      const updatedPost = await transaction.post.findUniqueOrThrow({
        where: { id: post.id },
        include: postIdentityInclude,
      });
      return { post: updatedPost, revision };
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
        ...(snapshot.excerpt ? { excerpt: snapshot.excerpt } : {}),
        body: snapshot.body,
        categories: {
          create: snapshot.categoryIds.map((categoryId) => ({
            category: { connect: { id: categoryId } },
          })),
        },
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
            }
          : {}),
      },
      include: revisionInclude,
    });
  }

  private mediaData(item: MediaInput, position: number) {
    return {
      kind: item.kind,
      provider: item.provider,
      secureUrl: item.secureUrl,
      position,
      ...(item.provider === 'CLOUDINARY'
        ? {
            publicId: item.publicId,
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
