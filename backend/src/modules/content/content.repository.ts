import {
  CatalogStatus,
  ModerationDecision,
  ModerationTargetType,
  Prisma,
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
} from '@prisma/client';
import type { MediaInput, PostListQuery } from './content.schemas.js';
import type { SubmissionDecision } from './content-publication.policy.js';
import { normalizeVietnameseText } from '../catalog/catalog.normalization.js';
import { MODERATION_RULE_VERSION } from '../moderation/rule-moderation.service.js';

const revisionInclude = {
  recipeDetail: true,
  ingredients: { include: { ingredient: true }, orderBy: { position: 'asc' } },
  dietCompatibility: { orderBy: { dietPattern: 'asc' } },
  categories: { include: { category: true }, orderBy: { category: { name: 'asc' } } },
  tags: { orderBy: { normalizedTag: 'asc' } },
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
  aliases: true,
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
  media: MediaInput[];
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

interface CountRow {
  total: bigint;
}

interface SearchIdRow {
  id: string;
  score: number;
}

interface RelatedIdRow extends SearchIdRow {
  type: PostType;
}

interface RelatedSourceSignals {
  categoryIds: string[];
  ingredientIds: string[];
  normalizedTags: string[];
}

const publishedBase = Prisma.sql`
  FROM "posts" p
  INNER JOIN "post_revisions" pr ON pr."id" = p."published_revision_id"
  LEFT JOIN "recipe_details" rd ON rd."revision_id" = pr."id"
`;

function uuidValues(values: string[]): Prisma.Sql {
  return Prisma.join(values.map((value) => Prisma.sql`${value}::uuid`));
}

function textValues(values: string[]): Prisma.Sql {
  return Prisma.join(values.map((value) => Prisma.sql`${value}`));
}

function publishedWhere(
  filters: Partial<ContentSearchCriteria>,
  constraints: SearchConstraints,
  excludePostId?: string,
): Prisma.Sql {
  const clauses: Prisma.Sql[] = [
    Prisma.sql`p."status" = 'PUBLISHED'::"post_status"`,
    Prisma.sql`p."deleted_at" IS NULL`,
    Prisma.sql`p."published_revision_id" IS NOT NULL`,
    Prisma.sql`pr."status" = 'PUBLISHED'::"post_revision_status"`,
    Prisma.sql`(p."type" <> 'RECIPE'::"post_type" OR rd."revision_id" IS NOT NULL)`,
  ];

  if (excludePostId) clauses.push(Prisma.sql`p."id" <> ${excludePostId}::uuid`);
  if (filters.type) clauses.push(Prisma.sql`p."type" = ${filters.type}::"post_type"`);
  if (filters.category) {
    const categoryMatch =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        filters.category,
      )
        ? Prisma.sql`c."id" = ${filters.category}::uuid`
        : Prisma.sql`c."slug" = ${filters.category}`;
    clauses.push(Prisma.sql`
      EXISTS (
        SELECT 1
        FROM "post_categories" pc
        INNER JOIN "categories" c ON c."id" = pc."category_id"
        WHERE pc."revision_id" = pr."id"
          AND c."status" = 'ACTIVE'::"catalog_status"
          AND ${categoryMatch}
      )
    `);
  }
  if (filters.maxCookTimeMinutes !== undefined) {
    clauses.push(
      Prisma.sql`p."type" = 'RECIPE'::"post_type" AND rd."cook_time_minutes" <= ${filters.maxCookTimeMinutes}`,
    );
  }
  if (filters.difficulty) {
    clauses.push(
      Prisma.sql`p."type" = 'RECIPE'::"post_type" AND rd."difficulty" = ${filters.difficulty}::"recipe_difficulty"`,
    );
  }
  if (filters.ingredientIds?.length) {
    clauses.push(Prisma.sql`
      p."type" = 'RECIPE'::"post_type"
      AND (
        SELECT COUNT(DISTINCT ri."ingredient_id")::integer
        FROM "recipe_ingredients" ri
        WHERE ri."revision_id" = pr."id"
          AND ri."ingredient_id" IN (${uuidValues(filters.ingredientIds)})
      ) = ${filters.ingredientIds.length}
    `);
  }
  if (filters.normalizedQuery) {
    const contains = `%${filters.normalizedQuery}%`;
    const categoryContains = `%${filters.normalizedQuery.replace(/\s+/g, '-')}%`;
    clauses.push(Prisma.sql`
      (
        pr."normalized_title" ILIKE ${contains}
        OR COALESCE(pr."normalized_excerpt", '') ILIKE ${contains}
        OR pr."normalized_body" ILIKE ${contains}
        OR EXISTS (
          SELECT 1
          FROM "recipe_ingredients" ri
          LEFT JOIN "ingredients" i ON i."id" = ri."ingredient_id"
          WHERE ri."revision_id" = pr."id"
            AND (ri."normalized_name" ILIKE ${contains} OR i."normalized_name" ILIKE ${contains})
        )
        OR EXISTS (
          SELECT 1
          FROM "post_categories" pc
          INNER JOIN "categories" c ON c."id" = pc."category_id"
          WHERE pc."revision_id" = pr."id" AND c."slug" ILIKE ${categoryContains}
        )
        OR EXISTS (
          SELECT 1
          FROM "post_tags" pt
          WHERE pt."revision_id" = pr."id" AND pt."normalized_tag" ILIKE ${contains}
        )
      )
    `);
  }

  if (constraints.dietPattern) {
    clauses.push(Prisma.sql`
      (
        p."type" <> 'RECIPE'::"post_type"
        OR EXISTS (
          SELECT 1
          FROM "recipe_diet_compatibilities" rdc
          WHERE rdc."revision_id" = pr."id"
            AND rdc."diet_pattern" = ${constraints.dietPattern}::"diet_pattern"
            AND rdc."compatible" = TRUE
        )
      )
    `);
  }
  if (constraints.allergenCodes.length) {
    clauses.push(Prisma.sql`
      (
        p."type" <> 'RECIPE'::"post_type"
        OR NOT EXISTS (
          SELECT 1
          FROM JSONB_ARRAY_ELEMENTS_TEXT(rd."allergen_codes") allergen("code")
          WHERE allergen."code" IN (${textValues(constraints.allergenCodes)})
        )
      )
    `);
  }
  if (constraints.excludedIngredientIds.length || constraints.excludedNormalizedNames.length) {
    const exclusionChecks: Prisma.Sql[] = [];
    if (constraints.excludedIngredientIds.length) {
      exclusionChecks.push(
        Prisma.sql`ri."ingredient_id" IN (${uuidValues(constraints.excludedIngredientIds)})`,
      );
    }
    if (constraints.excludedNormalizedNames.length) {
      exclusionChecks.push(Prisma.sql`
        (
          ri."normalized_name" IN (${textValues(constraints.excludedNormalizedNames)})
          OR EXISTS (
            SELECT 1
            FROM "ingredients" i
            WHERE i."id" = ri."ingredient_id"
              AND i."normalized_name" IN (${textValues(constraints.excludedNormalizedNames)})
          )
          OR EXISTS (
            SELECT 1
            FROM "ingredient_aliases" ia
            WHERE ia."ingredient_id" = ri."ingredient_id"
              AND ia."normalized_alias" IN (${textValues(constraints.excludedNormalizedNames)})
          )
        )
      `);
    }
    clauses.push(Prisma.sql`
      (
        p."type" <> 'RECIPE'::"post_type"
        OR NOT EXISTS (
          SELECT 1
          FROM "recipe_ingredients" ri
          WHERE ri."revision_id" = pr."id"
            AND (${Prisma.join(exclusionChecks, ' OR ')})
        )
      )
    `);
  }
  if (constraints.traditions.length) {
    clauses.push(Prisma.sql`
      (
        p."type" <> 'RECIPE'::"post_type"
        OR NOT EXISTS (
          SELECT 1
          FROM JSONB_ARRAY_ELEMENTS(rd."tradition_warnings") warning
          WHERE warning->>'tradition' IN (${textValues(constraints.traditions)})
        )
      )
    `);
  }
  if (constraints.requireResolvedIngredients) {
    clauses.push(Prisma.sql`
      (
        p."type" <> 'RECIPE'::"post_type"
        OR NOT EXISTS (
          SELECT 1
          FROM "recipe_ingredients" ri
          WHERE ri."revision_id" = pr."id"
            AND ri."resolution_status" <> 'EXACT'::"ingredient_resolution_status"
        )
      )
    `);
  }

  return Prisma.sql`WHERE ${Prisma.join(clauses, ' AND ')}`;
}

function searchScore(normalizedQuery?: string): Prisma.Sql {
  if (!normalizedQuery) return Prisma.sql`0::double precision`;
  const contains = `%${normalizedQuery}%`;
  const categoryContains = `%${normalizedQuery.replace(/\s+/g, '-')}%`;
  return Prisma.sql`
    (
      CASE
        WHEN pr."normalized_title" = ${normalizedQuery} THEN 400
        WHEN pr."normalized_title" ILIKE ${contains} THEN 300
        ELSE 0
      END
      + CASE WHEN EXISTS (
          SELECT 1
          FROM "recipe_ingredients" ri
          LEFT JOIN "ingredients" i ON i."id" = ri."ingredient_id"
          WHERE ri."revision_id" = pr."id"
            AND (ri."normalized_name" ILIKE ${contains} OR i."normalized_name" ILIKE ${contains})
        ) THEN 200 ELSE 0 END
      + CASE WHEN EXISTS (
          SELECT 1
          FROM "post_categories" pc
          INNER JOIN "categories" c ON c."id" = pc."category_id"
          WHERE pc."revision_id" = pr."id" AND c."slug" ILIKE ${categoryContains}
        ) THEN 100 ELSE 0 END
      + CASE WHEN EXISTS (
          SELECT 1
          FROM "post_tags" pt
          WHERE pt."revision_id" = pr."id" AND pt."normalized_tag" ILIKE ${contains}
        ) THEN 80 ELSE 0 END
      + CASE
          WHEN COALESCE(pr."normalized_excerpt", '') ILIKE ${contains} THEN 60
          WHEN pr."normalized_body" ILIKE ${contains} THEN 40
          ELSE 0
        END
      + SIMILARITY(pr."normalized_title", ${normalizedQuery}) * 10
    )::double precision
  `;
}

function relatedScore(signals: RelatedSourceSignals): Prisma.Sql {
  const categoryScore = signals.categoryIds.length
    ? Prisma.sql`(
        SELECT COUNT(*)::double precision * 5
        FROM "post_categories" pc
        WHERE pc."revision_id" = pr."id"
          AND pc."category_id" IN (${uuidValues(signals.categoryIds)})
      )`
    : Prisma.sql`0::double precision`;
  const ingredientScore = signals.ingredientIds.length
    ? Prisma.sql`(
        SELECT COUNT(DISTINCT ri."ingredient_id")::double precision * 4
        FROM "recipe_ingredients" ri
        WHERE ri."revision_id" = pr."id"
          AND ri."ingredient_id" IN (${uuidValues(signals.ingredientIds)})
      )`
    : Prisma.sql`0::double precision`;
  const tagScore = signals.normalizedTags.length
    ? Prisma.sql`(
        SELECT COUNT(*)::double precision * 3
        FROM "post_tags" pt
        WHERE pt."revision_id" = pr."id"
          AND pt."normalized_tag" IN (${textValues(signals.normalizedTags)})
      )`
    : Prisma.sql`0::double precision`;
  return Prisma.sql`(${categoryScore} + ${ingredientScore} + ${tagScore})::double precision`;
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
    const where = publishedWhere(criteria, constraints);
    const score = searchScore(criteria.normalizedQuery);
    const offset = (criteria.page - 1) * criteria.limit;
    const [countRows, idRows] = await this.prisma.$transaction([
      this.prisma.$queryRaw<CountRow[]>(Prisma.sql`
        SELECT COUNT(*)::bigint AS "total"
        ${publishedBase}
        ${where}
      `),
      this.prisma.$queryRaw<SearchIdRow[]>(Prisma.sql`
        SELECT p."id", ${score} AS "score"
        ${publishedBase}
        ${where}
        ORDER BY "score" DESC, p."published_at" DESC NULLS LAST, p."id" ASC
        LIMIT ${criteria.limit}
        OFFSET ${offset}
      `),
    ]);
    return {
      records: await this.hydratePublished(idRows.map((row) => row.id)),
      total: Number(countRows[0]?.total ?? 0n),
    };
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
    const where = publishedWhere({ type: 'RECIPE' }, constraints);
    const rows = await this.prisma.$queryRaw<SearchIdRow[]>(Prisma.sql`
      SELECT p."id", 0::double precision AS "score"
      ${publishedBase}
      ${where}
      ORDER BY p."published_at" DESC NULLS LAST, p."id" ASC
      LIMIT ${limit}
    `);
    return this.hydratePublished(rows.map((row) => row.id));
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
    const signals: RelatedSourceSignals = {
      categoryIds: revision.categories.map((item) => item.categoryId),
      ingredientIds: revision.ingredients.flatMap((item) =>
        item.ingredientId ? [item.ingredientId] : [],
      ),
      normalizedTags: revision.tags.map((item) => item.normalizedTag),
    };
    const where = publishedWhere({}, constraints, source.id);
    const score = relatedScore(signals);
    const rows = await this.prisma.$queryRaw<RelatedIdRow[]>(Prisma.sql`
      WITH candidates AS (
        SELECT
          p."id",
          p."type",
          p."published_at",
          ${score} AS "score"
        ${publishedBase}
        ${where}
      ), ranked AS (
        SELECT
          "id",
          "type",
          "score",
          ROW_NUMBER() OVER (
            PARTITION BY "type"
            ORDER BY "score" DESC, "published_at" DESC NULLS LAST, "id" ASC
          ) AS "position"
        FROM candidates
      )
      SELECT "id", "type", "score"
      FROM ranked
      WHERE "position" <= ${limitPerType}
      ORDER BY "type" ASC, "position" ASC
    `);
    const hydrated = await this.hydratePublished(rows.map((row) => row.id));
    const byId = new Map(hydrated.map((post) => [post.id, post]));
    return {
      RECIPE: rows.flatMap((row) => {
        const post = byId.get(row.id);
        return row.type === 'RECIPE' && post ? [post] : [];
      }),
      BLOG: rows.flatMap((row) => {
        const post = byId.get(row.id);
        return row.type === 'BLOG' && post ? [post] : [];
      }),
      VIDEO: rows.flatMap((row) => {
        const post = byId.get(row.id);
        return row.type === 'VIDEO' && post ? [post] : [];
      }),
    };
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
    const rows = await transaction.$queryRaw<Array<{ status: UserStatus }>>(Prisma.sql`
      SELECT "status" FROM "users" WHERE "id" = ${actorId}::uuid FOR UPDATE
    `);
    const status = rows[0]?.status;
    if (status !== UserStatus.ACTIVE)
      throw new ContentActorInactiveError(status ?? UserStatus.DELETED);
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
