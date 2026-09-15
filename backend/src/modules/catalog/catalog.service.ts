import { CatalogStatus, Prisma, type Category } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import { catalogSlug, normalizeVietnameseText } from './catalog.normalization.js';
import {
  CatalogRepositoryConstraintError,
  type CatalogRepository,
  type IngredientRecord,
} from './catalog.repository.js';
import type {
  AdminCategoryQuery,
  AdminIngredientQuery,
  ArchiveCategoryQuery,
  CategoryOutput,
  CategoryTreeOutput,
  CreateCategoryInput,
  CreateIngredientAliasInput,
  CreateIngredientInput,
  IngredientOutput,
  PublicCategoryQuery,
  PublicIngredientQuery,
  ResolveIngredientQuery,
  UpdateCategoryInput,
  UpdateIngredientInput,
} from './catalog.schemas.js';

function categoryOutput(category: Category): CategoryOutput {
  return {
    id: category.id,
    parentId: category.parentId,
    name: category.name,
    slug: category.slug,
    type: category.type,
    status: category.status,
    sortOrder: category.sortOrder,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

function ingredientOutput(ingredient: IngredientRecord): IngredientOutput {
  return {
    id: ingredient.id,
    canonicalName: ingredient.canonicalName,
    normalizedName: ingredient.normalizedName,
    foodGroup: ingredient.foodGroup,
    status: ingredient.status,
    aliases: ingredient.aliases.map((alias) => ({
      id: alias.id,
      alias: alias.alias,
      normalizedAlias: alias.normalizedAlias,
    })),
    allergenCodes: ingredient.allergens.map((allergen) => allergen.allergenCode),
    dietCompatibilities: ingredient.dietCompatibilities.map((compatibility) => ({
      dietPattern: compatibility.dietPattern,
      compatible: compatibility.compatible,
    })),
    traditionWarnings: ingredient.traditionWarnings.map((warning) => ({
      tradition: warning.tradition,
      warningCode: warning.warningCode,
      label: warning.label,
    })),
    createdAt: ingredient.createdAt.toISOString(),
    updatedAt: ingredient.updatedAt.toISOString(),
  };
}

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: total === 0 ? 0 : Math.ceil(total / limit) };
}

export class CatalogService {
  constructor(private readonly repository: CatalogRepository) {}

  async listPublicCategories(query: PublicCategoryQuery): Promise<CategoryTreeOutput[]> {
    const categories = await this.repository.listPublicCategories(query);
    const childrenByParent = new Map<string, Category[]>();
    for (const category of categories) {
      if (!category.parentId) continue;
      const children = childrenByParent.get(category.parentId) ?? [];
      children.push(category);
      childrenByParent.set(category.parentId, children);
    }
    return categories
      .filter((category) => category.parentId === null)
      .map((category) => ({
        ...categoryOutput(category),
        children: (childrenByParent.get(category.id) ?? []).map(categoryOutput),
      }));
  }

  async listAdminCategories(query: AdminCategoryQuery) {
    const result = await this.repository.listAdminCategories(query);
    return {
      data: result.records.map(categoryOutput),
      meta: pagination(query.page, query.limit, result.total),
    };
  }

  async createCategory(input: CreateCategoryInput): Promise<CategoryOutput> {
    await this.validateCategoryPlacement(input.type, input.parentId ?? null);
    const slug = input.slug ?? catalogSlug(input.name);
    if (!slug) throw this.invalidNameError();
    try {
      return categoryOutput(await this.repository.createCategory(input, slug));
    } catch (error) {
      throw this.mapPersistenceError(error, 'CATEGORY_SLUG_CONFLICT');
    }
  }

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<CategoryOutput> {
    const target = await this.repository.findCategory(id);
    if (!target) throw this.notFoundError('Không tìm thấy category');

    const type = input.type ?? target.type;
    const parentId = input.parentId === undefined ? target.parentId : input.parentId;
    const childCount = await this.repository.countCategoryChildren(id);
    if (childCount > 0 && (parentId !== null || type !== target.type)) {
      throw new AppError({
        statusCode: 409,
        code: 'CATEGORY_DEPTH_EXCEEDED',
        message: 'Category có category con phải giữ ở tầng gốc và không được đổi type',
      });
    }
    if (parentId === id) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_CATEGORY_PARENT',
        message: 'Category không thể là parent của chính nó',
      });
    }
    await this.validateCategoryPlacement(type, parentId);
    const slug = input.slug ?? (input.name ? catalogSlug(input.name) : undefined);
    if (input.name && !slug) throw this.invalidNameError();
    try {
      return categoryOutput(await this.repository.updateCategory(id, input, slug));
    } catch (error) {
      throw this.mapPersistenceError(error, 'CATEGORY_SLUG_CONFLICT');
    }
  }

  async archiveCategory(
    id: string,
    query: ArchiveCategoryQuery,
  ): Promise<{ id: string; status: 'ARCHIVED' }> {
    try {
      const category = await this.repository.archiveCategory(id, query.replacementId);
      return { id: category.id, status: CatalogStatus.ARCHIVED };
    } catch (error) {
      if (error instanceof CatalogRepositoryConstraintError) {
        if (error.kind === 'CATEGORY_NOT_FOUND')
          throw this.notFoundError('Không tìm thấy category');
        if (error.kind === 'CATEGORY_REPLACEMENT_REQUIRED') {
          throw new AppError({
            statusCode: 409,
            code: 'CATEGORY_REPLACEMENT_REQUIRED',
            message:
              'Category đang có child hoặc proposal tham chiếu; cần replacementId cùng type và cùng tầng',
          });
        }
        throw new AppError({
          statusCode: 400,
          code: 'INVALID_CATEGORY_REPLACEMENT',
          message: 'Replacement category phải active, cùng type và cùng tầng với category hiện tại',
        });
      }
      throw this.mapPersistenceError(error, 'CATEGORY_REPLACEMENT_CONFLICT');
    }
  }

  async listPublicIngredients(query: PublicIngredientQuery) {
    const normalized = query.q ? normalizeVietnameseText(query.q) : undefined;
    const result = await this.repository.listIngredients(
      { ...query, ...(normalized ? { q: normalized } : {}) },
      false,
    );
    return {
      data: result.records.map(ingredientOutput),
      meta: pagination(query.page, query.limit, result.total),
    };
  }

  async listAdminIngredients(query: AdminIngredientQuery) {
    const normalized = query.q ? normalizeVietnameseText(query.q) : undefined;
    const result = await this.repository.listIngredients(
      { ...query, ...(normalized ? { q: normalized } : {}) },
      true,
    );
    return {
      data: result.records.map(ingredientOutput),
      meta: pagination(query.page, query.limit, result.total),
    };
  }

  async resolveIngredient(query: ResolveIngredientQuery) {
    const normalizedQuery = normalizeVietnameseText(query.query);
    const candidates = normalizedQuery
      ? await this.repository.resolveIngredients(normalizedQuery)
      : [];
    return {
      query: query.query,
      normalizedQuery,
      match:
        candidates.length === 0
          ? ('NONE' as const)
          : candidates.length === 1
            ? ('EXACT' as const)
            : ('AMBIGUOUS' as const),
      candidates: candidates.map(ingredientOutput),
    };
  }

  async createIngredient(input: CreateIngredientInput): Promise<IngredientOutput> {
    const normalizedName = normalizeVietnameseText(input.canonicalName);
    if (!normalizedName) throw this.invalidNameError();
    const normalizedInput = this.normalizeIngredientMetadata(input);
    await this.validateIngredientMetadata(normalizedInput);
    try {
      return ingredientOutput(
        await this.repository.createIngredient(normalizedInput, normalizedName),
      );
    } catch (error) {
      throw this.mapPersistenceError(error, 'INGREDIENT_NAME_CONFLICT');
    }
  }

  async updateIngredient(id: string, input: UpdateIngredientInput): Promise<IngredientOutput> {
    if (!(await this.repository.findIngredient(id))) {
      throw this.notFoundError('Không tìm thấy ingredient');
    }
    const normalizedName = input.canonicalName
      ? normalizeVietnameseText(input.canonicalName)
      : undefined;
    if (input.canonicalName && !normalizedName) throw this.invalidNameError();
    const normalizedInput = this.normalizeIngredientMetadata(input);
    await this.validateIngredientMetadata(normalizedInput);
    try {
      return ingredientOutput(
        await this.repository.updateIngredient(id, normalizedInput, normalizedName),
      );
    } catch (error) {
      throw this.mapPersistenceError(error, 'INGREDIENT_NAME_CONFLICT');
    }
  }

  async archiveIngredient(id: string): Promise<{ id: string; status: 'ARCHIVED' }> {
    try {
      const ingredient = await this.repository.archiveIngredient(id);
      return { id: ingredient.id, status: CatalogStatus.ARCHIVED };
    } catch (error) {
      throw this.mapPersistenceError(error, 'INGREDIENT_ARCHIVE_CONFLICT');
    }
  }

  async addIngredientAlias(
    id: string,
    input: CreateIngredientAliasInput,
  ): Promise<IngredientOutput> {
    const ingredient = await this.repository.findIngredient(id);
    if (!ingredient) throw this.notFoundError('Không tìm thấy ingredient');
    const normalizedAlias = normalizeVietnameseText(input.alias);
    if (!normalizedAlias) throw this.invalidNameError();
    if (normalizedAlias === ingredient.normalizedName) {
      throw new AppError({
        statusCode: 409,
        code: 'INGREDIENT_ALIAS_CONFLICT',
        message: 'Alias trùng canonical name của ingredient',
      });
    }
    try {
      return ingredientOutput(
        await this.repository.addIngredientAlias(id, input.alias, normalizedAlias),
      );
    } catch (error) {
      throw this.mapPersistenceError(error, 'INGREDIENT_ALIAS_CONFLICT');
    }
  }

  async deleteIngredientAlias(
    id: string,
    aliasId: string,
  ): Promise<{ id: string; status: 'ACTIVE' | 'ARCHIVED' }> {
    if (!(await this.repository.findIngredient(id))) {
      throw this.notFoundError('Không tìm thấy ingredient');
    }
    if (!(await this.repository.deleteIngredientAlias(id, aliasId))) {
      throw this.notFoundError('Không tìm thấy alias của ingredient');
    }
    const ingredient = await this.repository.findIngredient(id);
    if (!ingredient) throw this.notFoundError('Không tìm thấy ingredient');
    return { id: ingredient.id, status: ingredient.status };
  }

  private async validateCategoryPlacement(
    type: Category['type'],
    parentId: string | null,
  ): Promise<void> {
    if (!parentId) return;
    const parent = await this.repository.findCategory(parentId);
    if (!parent || parent.status !== CatalogStatus.ACTIVE) {
      throw new AppError({
        statusCode: 400,
        code: 'INVALID_CATEGORY_PARENT',
        message: 'Parent category không tồn tại hoặc đã archive',
      });
    }
    if (parent.type !== type) {
      throw new AppError({
        statusCode: 400,
        code: 'CATEGORY_TYPE_MISMATCH',
        message: 'Parent và child category phải cùng type',
      });
    }
    if (parent.parentId !== null) {
      throw new AppError({
        statusCode: 400,
        code: 'CATEGORY_DEPTH_EXCEEDED',
        message: 'Category tree chỉ hỗ trợ tối đa hai tầng',
      });
    }
  }

  private normalizeIngredientMetadata<T extends CreateIngredientInput | UpdateIngredientInput>(
    input: T,
  ): T {
    return {
      ...input,
      ...(input.allergenCodes
        ? { allergenCodes: input.allergenCodes.map((code) => code.toUpperCase()) }
        : {}),
    };
  }

  private async validateIngredientMetadata(
    input: CreateIngredientInput | UpdateIngredientInput,
  ): Promise<void> {
    if (input.allergenCodes) {
      if (new Set(input.allergenCodes).size !== input.allergenCodes.length) {
        throw this.invalidMetadataError('Allergen code không được trùng lặp');
      }
      const existing = await this.repository.findAllergenCodes(input.allergenCodes);
      if (existing.length !== input.allergenCodes.length) {
        throw this.invalidMetadataError('Có allergen code không tồn tại hoặc đã bị vô hiệu hóa');
      }
    }
    if (
      input.dietCompatibilities &&
      new Set(input.dietCompatibilities.map((item) => item.dietPattern)).size !==
        input.dietCompatibilities.length
    ) {
      throw this.invalidMetadataError('Diet pattern metadata không được trùng lặp');
    }
    if (input.traditionWarnings) {
      const keys = input.traditionWarnings.map(
        (warning) => `${warning.tradition}:${warning.warningCode}`,
      );
      if (new Set(keys).size !== keys.length) {
        throw this.invalidMetadataError('Tradition warning không được trùng lặp');
      }
    }
  }

  private mapPersistenceError(error: unknown, conflictCode: string): AppError {
    if (error instanceof AppError) return error;
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return new AppError({
          statusCode: 409,
          code: conflictCode,
          message: 'Catalog item đã tồn tại',
        });
      }
      if (error.code === 'P2025') return this.notFoundError('Không tìm thấy catalog item');
      if (error.code === 'P2003') {
        return new AppError({
          statusCode: 409,
          code: 'CATALOG_REFERENCE_CONFLICT',
          message: 'Catalog item đang được tham chiếu hoặc metadata không hợp lệ',
        });
      }
    }
    return new AppError({
      statusCode: 500,
      code: 'CATALOG_PERSISTENCE_ERROR',
      message: 'Không thể lưu catalog',
      expose: false,
    });
  }

  private invalidNameError(): AppError {
    return new AppError({
      statusCode: 400,
      code: 'INVALID_CATALOG_NAME',
      message: 'Tên catalog không tạo được giá trị chuẩn hóa hợp lệ',
    });
  }

  private invalidMetadataError(message: string): AppError {
    return new AppError({ statusCode: 400, code: 'INVALID_INGREDIENT_METADATA', message });
  }

  private notFoundError(message: string): AppError {
    return new AppError({ statusCode: 404, code: 'NOT_FOUND', message });
  }
}
