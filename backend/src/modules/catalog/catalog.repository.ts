import { CatalogStatus, type Category, type Prisma, type PrismaClient } from '@prisma/client';
import type {
  AdminCategoryQuery,
  AdminIngredientQuery,
  CreateCategoryInput,
  CreateIngredientInput,
  PublicCategoryQuery,
  PublicIngredientQuery,
  UpdateCategoryInput,
  UpdateIngredientInput,
} from './catalog.schemas.js';

const ingredientInclude = {
  aliases: { orderBy: { alias: 'asc' } },
  allergens: { orderBy: { allergenCode: 'asc' } },
  dietCompatibilities: { orderBy: { dietPattern: 'asc' } },
  traditionWarnings: { orderBy: [{ tradition: 'asc' }, { warningCode: 'asc' }] },
} satisfies Prisma.IngredientInclude;

export type IngredientRecord = Prisma.IngredientGetPayload<{ include: typeof ingredientInclude }>;

export class CatalogRepositoryConstraintError extends Error {
  constructor(
    readonly kind:
      'CATEGORY_NOT_FOUND' | 'CATEGORY_REPLACEMENT_REQUIRED' | 'INVALID_CATEGORY_REPLACEMENT',
  ) {
    super(kind);
    this.name = 'CatalogRepositoryConstraintError';
  }
}

export class CatalogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listPublicCategories(query: PublicCategoryQuery): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: {
        status: CatalogStatus.ACTIVE,
        ...(query.type ? { type: query.type } : {}),
      },
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async listAdminCategories(
    query: AdminCategoryQuery,
  ): Promise<{ records: Category[]; total: number }> {
    const where: Prisma.CategoryWhereInput = {
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        orderBy: [{ type: 'asc' }, { parentId: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.category.count({ where }),
    ]);
    return { records, total };
  }

  findCategory(id: string): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { id } });
  }

  countCategoryChildren(id: string): Promise<number> {
    return this.prisma.category.count({ where: { parentId: id } });
  }

  createCategory(input: CreateCategoryInput, slug: string): Promise<Category> {
    return this.prisma.category.create({
      data: {
        name: input.name,
        slug,
        type: input.type,
        sortOrder: input.sortOrder,
        ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
      },
    });
  }

  updateCategory(id: string, input: UpdateCategoryInput, slug?: string): Promise<Category> {
    return this.prisma.category.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(slug !== undefined ? { slug } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
    });
  }

  async archiveCategory(id: string, replacementId?: string): Promise<Category> {
    return this.prisma.$transaction(async (transaction) => {
      const target = await transaction.category.findUnique({ where: { id } });
      if (!target) throw new CatalogRepositoryConstraintError('CATEGORY_NOT_FOUND');
      if (target.status === CatalogStatus.ARCHIVED) return target;

      const [children, pendingProposals, contentReferences] = await Promise.all([
        transaction.category.count({
          where: { parentId: id, status: CatalogStatus.ACTIVE },
        }),
        transaction.categoryProposal.count({ where: { parentId: id, status: 'PENDING' } }),
        transaction.postCategory.count({ where: { categoryId: id } }),
      ]);
      if ((children > 0 || pendingProposals > 0 || contentReferences > 0) && !replacementId) {
        throw new CatalogRepositoryConstraintError('CATEGORY_REPLACEMENT_REQUIRED');
      }

      if (replacementId) {
        const replacement = await transaction.category.findUnique({ where: { id: replacementId } });
        if (
          !replacement ||
          replacement.id === target.id ||
          replacement.status !== CatalogStatus.ACTIVE ||
          replacement.type !== target.type ||
          replacement.parentId !== target.parentId
        ) {
          throw new CatalogRepositoryConstraintError('INVALID_CATEGORY_REPLACEMENT');
        }
        await transaction.category.updateMany({
          where: { parentId: target.id },
          data: { parentId: replacement.id },
        });
        await transaction.categoryProposal.updateMany({
          where: { parentId: target.id, status: 'PENDING' },
          data: { parentId: replacement.id },
        });
        const targetLinks = await transaction.postCategory.findMany({
          where: { categoryId: target.id },
          select: { revisionId: true },
        });
        const linkedRevisionIds = targetLinks.map((link) => link.revisionId);
        if (linkedRevisionIds.length) {
          const duplicateLinks = await transaction.postCategory.findMany({
            where: { categoryId: replacement.id, revisionId: { in: linkedRevisionIds } },
            select: { revisionId: true },
          });
          const duplicateRevisionIds = duplicateLinks.map((link) => link.revisionId);
          if (duplicateRevisionIds.length) {
            await transaction.postCategory.deleteMany({
              where: { categoryId: target.id, revisionId: { in: duplicateRevisionIds } },
            });
          }
          await transaction.postCategory.updateMany({
            where: { categoryId: target.id },
            data: { categoryId: replacement.id },
          });
        }
      }

      return transaction.category.update({
        where: { id: target.id },
        data: { status: CatalogStatus.ARCHIVED },
      });
    });
  }

  findAllergenCodes(codes: string[]): Promise<Array<{ code: string }>> {
    return this.prisma.allergenDefinition.findMany({
      where: { code: { in: codes }, active: true },
      select: { code: true },
    });
  }

  async listIngredients(
    query: PublicIngredientQuery | AdminIngredientQuery,
    admin: boolean,
  ): Promise<{ records: IngredientRecord[]; total: number }> {
    const normalizedQuery = query.q;
    const where: Prisma.IngredientWhereInput = {
      ...(admin && 'status' in query && query.status
        ? { status: query.status }
        : admin
          ? {}
          : { status: CatalogStatus.ACTIVE }),
      ...(query.foodGroup ? { foodGroup: query.foodGroup } : {}),
      ...(normalizedQuery
        ? {
            OR: [
              { normalizedName: { contains: normalizedQuery } },
              { aliases: { some: { normalizedAlias: { contains: normalizedQuery } } } },
            ],
          }
        : {}),
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.ingredient.findMany({
        where,
        include: ingredientInclude,
        orderBy: [{ canonicalName: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.ingredient.count({ where }),
    ]);
    return { records, total };
  }

  findIngredient(id: string): Promise<IngredientRecord | null> {
    return this.prisma.ingredient.findUnique({ where: { id }, include: ingredientInclude });
  }

  resolveIngredients(normalizedQuery: string): Promise<IngredientRecord[]> {
    return this.prisma.ingredient.findMany({
      where: {
        status: CatalogStatus.ACTIVE,
        OR: [
          { normalizedName: normalizedQuery },
          { aliases: { some: { normalizedAlias: normalizedQuery } } },
        ],
      },
      include: ingredientInclude,
      orderBy: { canonicalName: 'asc' },
    });
  }

  async createIngredient(
    input: CreateIngredientInput,
    normalizedName: string,
  ): Promise<IngredientRecord> {
    return this.prisma.ingredient.create({
      data: {
        canonicalName: input.canonicalName,
        normalizedName,
        foodGroup: input.foodGroup,
        allergens: { create: input.allergenCodes.map((allergenCode) => ({ allergenCode })) },
        dietCompatibilities: { create: input.dietCompatibilities },
        traditionWarnings: { create: input.traditionWarnings },
      },
      include: ingredientInclude,
    });
  }

  async updateIngredient(
    id: string,
    input: UpdateIngredientInput,
    normalizedName?: string,
  ): Promise<IngredientRecord> {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.ingredient.update({
        where: { id },
        data: {
          ...(input.canonicalName && normalizedName
            ? { canonicalName: input.canonicalName, normalizedName }
            : {}),
          ...(input.foodGroup ? { foodGroup: input.foodGroup } : {}),
          ...(input.status ? { status: input.status } : {}),
        },
      });

      if (input.allergenCodes) {
        await transaction.ingredientAllergen.deleteMany({ where: { ingredientId: id } });
        await transaction.ingredientAllergen.createMany({
          data: input.allergenCodes.map((allergenCode) => ({ ingredientId: id, allergenCode })),
        });
      }
      if (input.dietCompatibilities) {
        await transaction.ingredientDietCompatibility.deleteMany({ where: { ingredientId: id } });
        await transaction.ingredientDietCompatibility.createMany({
          data: input.dietCompatibilities.map((compatibility) => ({
            ingredientId: id,
            ...compatibility,
          })),
        });
      }
      if (input.traditionWarnings) {
        await transaction.ingredientTraditionWarning.deleteMany({ where: { ingredientId: id } });
        await transaction.ingredientTraditionWarning.createMany({
          data: input.traditionWarnings.map((warning) => ({ ingredientId: id, ...warning })),
        });
      }
      return transaction.ingredient.findUniqueOrThrow({
        where: { id },
        include: ingredientInclude,
      });
    });
  }

  archiveIngredient(id: string): Promise<IngredientRecord> {
    return this.prisma.ingredient.update({
      where: { id },
      data: { status: CatalogStatus.ARCHIVED },
      include: ingredientInclude,
    });
  }

  addIngredientAlias(
    ingredientId: string,
    alias: string,
    normalizedAlias: string,
  ): Promise<IngredientRecord> {
    return this.prisma.ingredient.update({
      where: { id: ingredientId },
      data: { aliases: { create: { alias, normalizedAlias } } },
      include: ingredientInclude,
    });
  }

  async deleteIngredientAlias(ingredientId: string, aliasId: string): Promise<boolean> {
    const result = await this.prisma.ingredientAlias.deleteMany({
      where: { id: aliasId, ingredientId },
    });
    return result.count > 0;
  }
}
