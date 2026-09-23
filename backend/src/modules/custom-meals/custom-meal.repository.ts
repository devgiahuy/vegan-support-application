import {
  CustomMealDeletePolicy,
  IngredientResolutionStatus,
  NutritionCoverage,
  type Prisma,
  type PrismaClient,
} from '@prisma/client';
import { normalizeVietnameseText } from '../catalog/catalog.normalization.js';

const customMealInclude = {
  ingredients: { orderBy: { position: 'asc' as const }, include: { ingredient: { select: { id: true, canonicalName: true } } } },
  photos: { orderBy: { position: 'asc' as const }, include: { asset: { select: { id: true, secureUrl: true, mimeType: true, width: true, height: true } } } },
  tags: { orderBy: { normalizedTag: 'asc' as const } },
} satisfies Prisma.CustomMealInclude;

export type CustomMealRecord = Prisma.CustomMealGetPayload<{ include: typeof customMealInclude }>;

export interface CustomMealIngredientInput {
  position: number;
  displayName: string;
  amount: number;
  unit: string;
  ingredientId?: string;
}

export interface CreateCustomMealData {
  ownerId: string;
  name: string;
  notes?: string;
  servings: number;
  sourceNote?: string;
  userCalories?: number;
  userProteinGrams?: number;
  userCarbsGrams?: number;
  userFatGrams?: number;
  deletePolicy?: CustomMealDeletePolicy;
  ingredients: CustomMealIngredientInput[];
  tags: string[];
}

export interface UpdateCustomMealData {
  name?: string;
  notes?: string | null;
  servings?: number;
  sourceNote?: string | null;
  userCalories?: number | null;
  userProteinGrams?: number | null;
  userCarbsGrams?: number | null;
  userFatGrams?: number | null;
  deletePolicy?: CustomMealDeletePolicy;
  ingredients?: CustomMealIngredientInput[];
  tags?: string[];
}

export interface CustomMealListQuery {
  page: number;
  limit: number;
  tag?: string;
}

export class CustomMealInUseError extends Error {
  constructor(public readonly planCount: number) {
    super('CUSTOM_MEAL_IN_USE');
    this.name = 'CustomMealInUseError';
  }
}

export class CustomMealRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findOwned(ownerId: string, id: string): Promise<CustomMealRecord | null> {
    return this.prisma.customMeal.findFirst({
      where: { id, ownerId, deletedAt: null },
      include: customMealInclude,
    });
  }

  async listOwned(
    ownerId: string,
    query: { page: number; limit: number; tag?: string },
  ): Promise<{ records: CustomMealRecord[]; total: number }> {
    const where: Prisma.CustomMealWhereInput = {
      ownerId,
      deletedAt: null,
      ...(query.tag
        ? { tags: { some: { normalizedTag: normalizeVietnameseText(query.tag) } } }
        : {}),
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.customMeal.findMany({
        where,
        include: customMealInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.customMeal.count({ where }),
    ]);
    return { records, total };
  }

  async create(data: CreateCustomMealData): Promise<CustomMealRecord> {
    const { resolvedIngredients, nutritionCoverage } = await this.resolveIngredients(
      data.ingredients,
    );
    const normalizedTags = this.normalizeTags(data.tags);
    return this.prisma.customMeal.create({
      data: {
        ownerId: data.ownerId,
        name: data.name.trim(),
        notes: data.notes?.trim() ?? null,
        servings: data.servings,
        sourceNote: data.sourceNote?.trim() ?? null,
        userCalories: data.userCalories ?? null,
        userProteinGrams: data.userProteinGrams ?? null,
        userCarbsGrams: data.userCarbsGrams ?? null,
        userFatGrams: data.userFatGrams ?? null,
        nutritionCoverage,
        deletePolicy: data.deletePolicy ?? CustomMealDeletePolicy.BLOCK,
        ingredients: { create: resolvedIngredients },
        tags: { create: normalizedTags },
      },
      include: customMealInclude,
    });
  }

  async update(id: string, ownerId: string, data: UpdateCustomMealData): Promise<CustomMealRecord | null> {
    const existing = await this.findOwned(ownerId, id);
    if (!existing) return null;

    let resolvedIngredients: Awaited<ReturnType<typeof this.resolveIngredients>>['resolvedIngredients'] | undefined;
    let nutritionCoverage: NutritionCoverage | undefined;

    if (data.ingredients !== undefined) {
      const resolved = await this.resolveIngredients(data.ingredients);
      resolvedIngredients = resolved.resolvedIngredients;
      nutritionCoverage = resolved.nutritionCoverage;
    }

    return this.prisma.$transaction(async (tx) => {
      if (resolvedIngredients !== undefined) {
        await tx.customMealIngredient.deleteMany({ where: { customMealId: id } });
      }
      if (data.tags !== undefined) {
        await tx.customMealTag.deleteMany({ where: { customMealId: id } });
      }
      return tx.customMeal.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name.trim() } : {}),
          ...(data.notes !== undefined ? { notes: data.notes?.trim() ?? null } : {}),
          ...(data.servings !== undefined ? { servings: data.servings } : {}),
          ...(data.sourceNote !== undefined ? { sourceNote: data.sourceNote?.trim() ?? null } : {}),
          ...(data.userCalories !== undefined ? { userCalories: data.userCalories } : {}),
          ...(data.userProteinGrams !== undefined ? { userProteinGrams: data.userProteinGrams } : {}),
          ...(data.userCarbsGrams !== undefined ? { userCarbsGrams: data.userCarbsGrams } : {}),
          ...(data.userFatGrams !== undefined ? { userFatGrams: data.userFatGrams } : {}),
          ...(nutritionCoverage !== undefined ? { nutritionCoverage } : {}),
          ...(data.deletePolicy !== undefined ? { deletePolicy: data.deletePolicy } : {}),
          ...(resolvedIngredients !== undefined
            ? { ingredients: { create: resolvedIngredients } }
            : {}),
          ...(data.tags !== undefined
            ? { tags: { create: this.normalizeTags(data.tags) } }
            : {}),
        },
        include: customMealInclude,
      });
    });
  }

  async attachPhoto(
    ownerId: string,
    id: string,
    assetId: string,
    position: number,
  ): Promise<CustomMealRecord | null> {
    const existing = await this.findOwned(ownerId, id);
    if (!existing) return null;
    await this.prisma.customMealPhoto.upsert({
      where: { customMealId_assetId: { customMealId: id, assetId } },
      update: { position },
      create: { customMealId: id, assetId, position },
    });
    return this.findOwned(ownerId, id);
  }

  async removePhoto(
    ownerId: string,
    id: string,
    assetId: string,
  ): Promise<CustomMealRecord | null> {
    const existing = await this.findOwned(ownerId, id);
    if (!existing) return null;
    await this.prisma.customMealPhoto.deleteMany({
      where: { customMealId: id, assetId },
    });
    return this.findOwned(ownerId, id);
  }

  async reorderPhotos(
    ownerId: string,
    id: string,
    orderedAssetIds: string[],
  ): Promise<CustomMealRecord | null> {
    const existing = await this.findOwned(ownerId, id);
    if (!existing) return null;
    await this.prisma.$transaction(
      orderedAssetIds.map((assetId, index) =>
        this.prisma.customMealPhoto.updateMany({
          where: { customMealId: id, assetId },
          data: { position: index },
        }),
      ),
    );
    return this.findOwned(ownerId, id);
  }

  async softDelete(ownerId: string, id: string): Promise<'deleted' | 'not-found' | 'in-use'> {
    const meal = await this.prisma.customMeal.findFirst({
      where: { id, ownerId, deletedAt: null },
      include: { _count: { select: { mealPlanItems: true } } },
    });
    if (!meal) return 'not-found';

    if (meal.deletePolicy === CustomMealDeletePolicy.BLOCK && meal._count.mealPlanItems > 0) {
      return 'in-use';
    }

    // RETAIN_SNAPSHOT: snapshot is already stored on MealPlanItem.customMealSnapshot.
    // Block policy: reject. Retain policy: proceed with soft-delete.
    await this.prisma.customMeal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return 'deleted';
  }

  /** Check if an asset is used as a photo on any active custom meal. */
  async countActivePhotoReferences(assetId: string): Promise<number> {
    return this.prisma.customMealPhoto.count({
      where: { assetId, customMeal: { deletedAt: null } },
    });
  }

  private async resolveIngredients(ingredients: CustomMealIngredientInput[]) {
    const resolvedIngredients = await Promise.all(
      ingredients.map(async (ing) => {
        let ingredientId = ing.ingredientId;
        let resolutionStatus: IngredientResolutionStatus = IngredientResolutionStatus.EXACT;

        if (!ingredientId) {
          // Try fuzzy match
          const normalizedName = normalizeVietnameseText(ing.displayName);
          const found = await this.prisma.ingredient.findUnique({
            where: { normalizedName },
            select: { id: true },
          });
          if (found) {
            ingredientId = found.id;
            resolutionStatus = IngredientResolutionStatus.EXACT;
          } else {
            resolutionStatus = IngredientResolutionStatus.UNKNOWN;
          }
        }

        return {
          position: ing.position,
          displayName: ing.displayName.trim(),
          normalizedName: normalizeVietnameseText(ing.displayName),
          amount: ing.amount,
          unit: ing.unit.trim(),
          resolutionStatus,
          ...(ingredientId ? { ingredientId } : {}),
        };
      }),
    );

    const allResolved = resolvedIngredients.every(
      (ing) => ing.resolutionStatus === IngredientResolutionStatus.EXACT,
    );
    const noneResolved = resolvedIngredients.every(
      (ing) => ing.resolutionStatus === IngredientResolutionStatus.UNKNOWN,
    );
    const nutritionCoverage: NutritionCoverage = ingredients.length === 0
      ? NutritionCoverage.UNAVAILABLE
      : allResolved
        ? NutritionCoverage.COMPLETE
        : noneResolved
          ? NutritionCoverage.UNAVAILABLE
          : NutritionCoverage.PARTIAL;

    return { resolvedIngredients, nutritionCoverage };
  }

  private normalizeTags(tags: string[]): Array<{ tag: string; normalizedTag: string }> {
    const seen = new Set<string>();
    const result: Array<{ tag: string; normalizedTag: string }> = [];
    for (const tag of tags) {
      const trimmed = tag.trim().slice(0, 80);
      if (!trimmed) continue;
      const normalized = normalizeVietnameseText(trimmed).slice(0, 80);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      result.push({ tag: trimmed, normalizedTag: normalized });
    }
    return result;
  }
}
