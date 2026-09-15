import {
  DietPattern,
  IngredientResolutionStatus,
  PostStatus,
  PostType,
  Prisma,
  Role,
} from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import { catalogSlug, normalizeVietnameseText } from '../catalog/catalog.normalization.js';
import {
  ContentVersionConflictError,
  type ContentRepository,
  type IngredientMetadataRecord,
  type PostIdentityRecord,
  type PublishedPostRecord,
  type RecipeSnapshot,
  type RevisionRecord,
  type RevisionSnapshot,
} from './content.repository.js';
import type {
  CreatePostInput,
  DeletePostQuery,
  PostListQuery,
  PostOutput,
  UpdatePostInput,
} from './content.schemas.js';
import type { MediaService } from './media.service.js';
import type { ContentPublicationPolicy } from './content-publication.policy.js';

export interface ContentActor {
  userId: string;
  role: Role;
}

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) };
}

function stringList(value: Prisma.JsonValue): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function traditionWarningList(value: Prisma.JsonValue) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (
      item &&
      typeof item === 'object' &&
      !Array.isArray(item) &&
      typeof item.tradition === 'string' &&
      ['BUDDHIST', 'CHRISTIAN'].includes(item.tradition) &&
      typeof item.warningCode === 'string' &&
      typeof item.label === 'string'
    ) {
      return [
        {
          tradition: item.tradition as 'BUDDHIST' | 'CHRISTIAN',
          warningCode: item.warningCode,
          label: item.label,
        },
      ];
    }
    return [];
  });
}

export class ContentService {
  constructor(
    private readonly repository: ContentRepository,
    private readonly mediaService: MediaService,
    private readonly publicationPolicy: ContentPublicationPolicy,
  ) {}

  async listPublished(query: PostListQuery) {
    const result = await this.repository.listPublished(query);
    return {
      data: result.records.flatMap((post) =>
        post.publishedRevision ? [this.postOutput(post, post.publishedRevision)] : [],
      ),
      meta: pagination(query.page, query.limit, result.total),
    };
  }

  async getPost(identifier: string, actor?: ContentActor): Promise<PostOutput> {
    const post = await this.repository.findPostByIdentifier(identifier);
    if (!post) throw this.notFoundError();
    const privileged = actor?.userId === post.authorId || actor?.role === Role.ADMIN;
    if (post.status === PostStatus.DELETED) {
      if (privileged) {
        throw new AppError({
          statusCode: 410,
          code: 'CONTENT_DELETED',
          message: 'Nội dung đã bị xóa',
        });
      }
      throw this.notFoundError();
    }

    let revision: RevisionRecord | null = null;
    if (privileged) revision = await this.repository.findLatestRevision(post.id);
    if (!revision && post.status === PostStatus.PUBLISHED && post.publishedRevisionId) {
      revision = await this.repository.findRevision(post.publishedRevisionId);
    }
    if (!revision) throw this.notFoundError();
    return this.postOutput(post, revision);
  }

  async createPost(actor: ContentActor, input: CreatePostInput): Promise<PostOutput> {
    const slug = input.slug ?? catalogSlug(input.title);
    if (!slug) throw this.invalidContentError('Tiêu đề không tạo được slug hợp lệ');
    const snapshot = await this.buildSnapshot(input);
    try {
      const decision = this.publicationPolicy.decideInitialSubmission(actor);
      const created = await this.repository.createPost(
        actor.userId,
        input.type,
        slug,
        snapshot,
        decision,
      );
      return this.postOutput(created.post, created.revision);
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  async updatePost(actor: ContentActor, id: string, input: UpdatePostInput): Promise<PostOutput> {
    const post = await this.requireOwnedPost(actor, id);
    if (post.status === PostStatus.DELETED) throw this.deletedError();
    if (post.status === PostStatus.HIDDEN || post.status === PostStatus.FLAGGED) {
      throw new AppError({
        statusCode: 409,
        code: 'CONTENT_STATE_CONFLICT',
        message: 'Nội dung đang bị giữ để review và chưa thể chỉnh sửa',
      });
    }
    if (post.type !== input.type) {
      throw this.invalidContentError('Không thể thay đổi post type sau khi tạo');
    }
    if (post.version !== input.expectedVersion) throw this.versionConflictError(post.version);
    const slug = input.slug ?? catalogSlug(input.title);
    if (!slug) throw this.invalidContentError('Tiêu đề không tạo được slug hợp lệ');
    const snapshot = await this.buildSnapshot(input);
    try {
      const updated = await this.repository.createUpdatedRevision(
        post,
        actor.userId,
        input.expectedVersion,
        slug,
        snapshot,
      );
      return this.postOutput(updated.post, updated.revision);
    } catch (error) {
      throw this.mapPersistenceError(error);
    }
  }

  async deletePost(actor: ContentActor, id: string, query: DeletePostQuery) {
    const post = await this.requireOwnedPost(actor, id);
    if (post.status === PostStatus.DELETED) return { id: post.id, status: PostStatus.DELETED };
    if (post.version !== query.expectedVersion) throw this.versionConflictError(post.version);
    if (!(await this.repository.softDelete(post.id, actor.userId, query.expectedVersion))) {
      const current = await this.repository.findPost(post.id);
      throw this.versionConflictError(current?.version ?? post.version);
    }
    return { id: post.id, status: PostStatus.DELETED };
  }

  private async buildSnapshot(input: CreatePostInput | UpdatePostInput): Promise<RevisionSnapshot> {
    const activeCategoryIds = await this.repository.findActiveCategoryIds(input.categoryIds);
    if (activeCategoryIds.length !== input.categoryIds.length) {
      throw this.invalidContentError('Có category không tồn tại hoặc đã archive');
    }
    const media = this.mediaService.validateAndNormalize(input.media);
    const common = {
      title: input.title,
      ...(input.excerpt ? { excerpt: input.excerpt } : {}),
      body: input.body,
      categoryIds: input.categoryIds,
      media,
    };
    if (input.type !== PostType.RECIPE) return common;
    return { ...common, recipe: await this.buildRecipeSnapshot(input.recipe) };
  }

  private async buildRecipeSnapshot(
    recipe: Extract<CreatePostInput, { type: 'RECIPE' }>['recipe'],
  ): Promise<RecipeSnapshot> {
    const normalizedNames = recipe.ingredients.map((item) =>
      normalizeVietnameseText(item.displayName),
    );
    if (normalizedNames.some((name) => !name)) {
      throw this.invalidContentError('Ingredient name không tạo được giá trị chuẩn hóa');
    }
    const explicitIds = recipe.ingredients.flatMap((item) =>
      item.ingredientId ? [item.ingredientId] : [],
    );
    const metadata = await this.repository.findIngredientMetadata(explicitIds, normalizedNames);
    const byId = new Map(metadata.map((ingredient) => [ingredient.id, ingredient]));
    if (
      new Set(explicitIds).size !== explicitIds.length ||
      explicitIds.some((id) => !byId.has(id))
    ) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_INGREDIENT_REFERENCE',
        message: 'Canonical ingredient được chọn không tồn tại, bị trùng hoặc đã archive',
      });
    }

    const resolved = recipe.ingredients.map((item, index) => {
      const normalizedName = normalizedNames[index] ?? '';
      const candidates = item.ingredientId
        ? [byId.get(item.ingredientId)].filter(
            (candidate): candidate is IngredientMetadataRecord => candidate !== undefined,
          )
        : metadata.filter(
            (ingredient) =>
              ingredient.normalizedName === normalizedName ||
              ingredient.aliases.some((alias) => alias.normalizedAlias === normalizedName),
          );
      const canonical = candidates.length === 1 ? candidates[0] : undefined;
      return {
        ...(canonical ? { ingredientId: canonical.id } : {}),
        displayName: item.displayName,
        normalizedName,
        amount: item.amount,
        unit: item.unit,
        optional: item.optional,
        resolutionStatus: canonical
          ? IngredientResolutionStatus.EXACT
          : candidates.length > 1
            ? IngredientResolutionStatus.AMBIGUOUS
            : IngredientResolutionStatus.UNKNOWN,
      };
    });

    const canonicalIngredients = resolved.flatMap((item) =>
      item.ingredientId ? [byId.get(item.ingredientId)].filter(Boolean) : [],
    ) as IngredientMetadataRecord[];
    const allergenCodes = [
      ...new Set(
        canonicalIngredients.flatMap((ingredient) =>
          ingredient.allergens.map((allergen) => allergen.allergenCode),
        ),
      ),
    ].sort();
    const warningMap = new Map<string, { tradition: string; warningCode: string; label: string }>();
    for (const warning of canonicalIngredients.flatMap(
      (ingredient) => ingredient.traditionWarnings,
    )) {
      warningMap.set(`${warning.tradition}:${warning.warningCode}`, {
        tradition: warning.tradition,
        warningCode: warning.warningCode,
        label: warning.label,
      });
    }
    const unresolved = resolved.some(
      (ingredient) => ingredient.resolutionStatus !== IngredientResolutionStatus.EXACT,
    );
    const dietCompatibilities = Object.values(DietPattern).map((dietPattern) => {
      const reasons = new Set<string>();
      if (unresolved) reasons.add('UNRESOLVED_INGREDIENT');
      for (const ingredient of canonicalIngredients) {
        const compatibility = ingredient.dietCompatibilities.find(
          (item) => item.dietPattern === dietPattern,
        );
        if (!compatibility) reasons.add('MISSING_COMPATIBILITY_METADATA');
        else if (!compatibility.compatible) reasons.add(`INCOMPATIBLE_INGREDIENT:${ingredient.id}`);
      }
      return {
        dietPattern,
        compatible: reasons.size === 0,
        reasonCodes: [...reasons],
      };
    });
    const nutrition = recipe.nutrition;
    const nutritionComplete =
      nutrition.calories !== undefined &&
      nutrition.proteinGrams !== undefined &&
      nutrition.carbsGrams !== undefined &&
      nutrition.fatGrams !== undefined;
    return {
      servings: recipe.servings,
      prepTimeMinutes: recipe.prepTimeMinutes,
      cookTimeMinutes: recipe.cookTimeMinutes,
      difficulty: recipe.difficulty,
      ...(nutrition.calories !== undefined ? { calories: nutrition.calories } : {}),
      ...(nutrition.proteinGrams !== undefined ? { proteinGrams: nutrition.proteinGrams } : {}),
      ...(nutrition.carbsGrams !== undefined ? { carbsGrams: nutrition.carbsGrams } : {}),
      ...(nutrition.fatGrams !== undefined ? { fatGrams: nutrition.fatGrams } : {}),
      ...(nutrition.fiberGrams !== undefined ? { fiberGrams: nutrition.fiberGrams } : {}),
      ...(nutrition.vitaminB12Mcg !== undefined ? { vitaminB12Mcg: nutrition.vitaminB12Mcg } : {}),
      mealPlannerEligible: !unresolved && nutritionComplete,
      allergenCodes,
      traditionWarnings: [...warningMap.values()],
      ingredients: resolved,
      dietCompatibilities,
    };
  }

  private postOutput(
    post: PostIdentityRecord | PublishedPostRecord,
    revision: RevisionRecord,
  ): PostOutput {
    const common = {
      id: post.id,
      author: {
        id: post.author.id,
        displayName: post.author.displayName,
        avatarUrl: post.author.avatarUrl,
      },
      slug: post.slug,
      status: post.status,
      version: post.version,
      publishedRevisionVersion: post.publishedRevision?.version ?? null,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      revision: {
        id: revision.id,
        version: revision.version,
        status: revision.status,
        title: revision.title,
        excerpt: revision.excerpt,
        body: revision.body,
        createdAt: revision.createdAt.toISOString(),
      },
      categories: revision.categories.map(({ category }) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        type: category.type,
      })),
      media: revision.media.map((media) => ({
        id: media.id,
        kind: media.kind,
        provider: media.provider,
        publicId: media.publicId,
        secureUrl: media.secureUrl,
        mimeType: media.mimeType,
        bytes: media.bytes,
        width: media.width,
        height: media.height,
        durationSeconds: media.durationSeconds ? Number(media.durationSeconds) : null,
      })),
    };
    if (post.type === PostType.RECIPE) {
      const detail = revision.recipeDetail;
      if (!detail) throw this.corruptRecipeError();
      return {
        ...common,
        type: PostType.RECIPE,
        recipe: {
          servings: detail.servings,
          prepTimeMinutes: detail.prepTimeMinutes,
          cookTimeMinutes: detail.cookTimeMinutes,
          difficulty: detail.difficulty,
          nutrition: {
            calories: detail.calories,
            proteinGrams: detail.proteinGrams ? Number(detail.proteinGrams) : null,
            carbsGrams: detail.carbsGrams ? Number(detail.carbsGrams) : null,
            fatGrams: detail.fatGrams ? Number(detail.fatGrams) : null,
            fiberGrams: detail.fiberGrams ? Number(detail.fiberGrams) : null,
            vitaminB12Mcg: detail.vitaminB12Mcg ? Number(detail.vitaminB12Mcg) : null,
          },
          mealPlannerEligible:
            post.status === PostStatus.PUBLISHED &&
            revision.status === 'PUBLISHED' &&
            detail.mealPlannerEligible,
          allergenCodes: stringList(detail.allergenCodes),
          traditionWarnings: traditionWarningList(detail.traditionWarnings),
          dietCompatibilities: revision.dietCompatibility.map((compatibility) => ({
            dietPattern: compatibility.dietPattern,
            compatible: compatibility.compatible,
            reasonCodes: stringList(compatibility.reasonCodes),
          })),
          ingredients: revision.ingredients.map((ingredient) => ({
            id: ingredient.id,
            ingredientId: ingredient.ingredientId,
            canonicalName: ingredient.ingredient?.canonicalName ?? null,
            position: ingredient.position,
            displayName: ingredient.displayName,
            normalizedName: ingredient.normalizedName,
            amount: Number(ingredient.amount),
            unit: ingredient.unit,
            optional: ingredient.optional,
            resolutionStatus: ingredient.resolutionStatus,
          })),
        },
      };
    }
    if (post.type === PostType.BLOG) return { ...common, type: PostType.BLOG, recipe: null };
    return { ...common, type: PostType.VIDEO, recipe: null };
  }

  private async requireOwnedPost(actor: ContentActor, id: string): Promise<PostIdentityRecord> {
    const post = await this.repository.findPost(id);
    if (!post) throw this.notFoundError();
    if (post.authorId !== actor.userId && actor.role !== Role.ADMIN) {
      throw new AppError({
        statusCode: 403,
        code: 'FORBIDDEN',
        message: 'Bạn không có quyền sửa hoặc xóa nội dung này',
      });
    }
    return post;
  }

  private mapPersistenceError(error: unknown): AppError {
    if (error instanceof AppError) return error;
    if (error instanceof ContentVersionConflictError) return this.versionConflictError();
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return new AppError({
          statusCode: 409,
          code: 'CONTENT_SLUG_CONFLICT',
          message: 'Slug đã được sử dụng',
        });
      }
      if (error.code === 'P2003') {
        return this.invalidContentError('Category, ingredient hoặc media reference không hợp lệ');
      }
    }
    return new AppError({
      statusCode: 500,
      code: 'CONTENT_PERSISTENCE_ERROR',
      message: 'Không thể lưu nội dung',
      expose: false,
    });
  }

  private versionConflictError(currentVersion?: number): AppError {
    return new AppError({
      statusCode: 409,
      code: 'CONTENT_VERSION_CONFLICT',
      message: 'Nội dung đã được cập nhật bởi request khác',
      ...(currentVersion ? { fields: { currentVersion: [String(currentVersion)] } } : {}),
    });
  }

  private invalidContentError(message: string): AppError {
    return new AppError({ statusCode: 400, code: 'INVALID_CONTENT', message });
  }

  private deletedError(): AppError {
    return new AppError({
      statusCode: 410,
      code: 'CONTENT_DELETED',
      message: 'Nội dung đã bị xóa',
    });
  }

  private notFoundError(): AppError {
    return new AppError({ statusCode: 404, code: 'NOT_FOUND', message: 'Không tìm thấy nội dung' });
  }

  private corruptRecipeError(): AppError {
    return new AppError({
      statusCode: 500,
      code: 'CONTENT_DATA_INTEGRITY_ERROR',
      message: 'Recipe revision thiếu structured data',
      expose: false,
    });
  }
}
