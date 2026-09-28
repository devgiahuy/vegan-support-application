import { MediaKind, NutritionCoverage, NutritionValueOrigin, type Prisma } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import type { AiProvider } from '../chat/ai-provider.js';
import type { StorageRepository } from '../storage/storage.repository.js';
import type {
  AttachPhotoInput,
  CreateCustomMealInput,
  CustomMealListQuery,
  ReorderPhotosInput,
  UpdateCustomMealInput,
} from './custom-meal.schemas.js';
import type {
  CreateCustomMealData,
  CustomMealRecord,
  CustomMealRepository,
  UpdateCustomMealData,
} from './custom-meal.repository.js';

const MAX_PHOTOS = 10;
const MASS_FACTORS = new Map([
  ['g', 1],
  ['gram', 1],
  ['grams', 1],
  ['kg', 1_000],
  ['mg', 0.001],
]);
const METRIC_BY_NUTRIENT = {
  ENERGY_KCAL: 'calories',
  PROTEIN: 'proteinGrams',
  CARBS: 'carbsGrams',
  FAT: 'fatGrams',
  FIBER: 'fiberGrams',
} as const;
type NutritionMetric = (typeof METRIC_BY_NUTRIENT)[keyof typeof METRIC_BY_NUTRIENT];

function rounded(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function formatDecimal(value: { toNumber(): number } | null | undefined): number | null {
  if (value == null) return null;
  return value.toNumber();
}

export function formatCustomMeal(meal: CustomMealRecord) {
  return {
    id: meal.id,
    ownerId: meal.ownerId,
    name: meal.name,
    notes: meal.notes ?? null,
    servings: meal.servings,
    sourceNote: meal.sourceNote ?? null,
    userCalories: meal.userCalories ?? null,
    userProteinGrams: formatDecimal(meal.userProteinGrams),
    userCarbsGrams: formatDecimal(meal.userCarbsGrams),
    userFatGrams: formatDecimal(meal.userFatGrams),
    nutritionCoverage: meal.nutritionCoverage,
    deletePolicy: meal.deletePolicy,
    ingredients: meal.ingredients.map((ing) => ({
      id: ing.id,
      position: ing.position,
      displayName: ing.displayName,
      amount: formatDecimal(ing.amount) ?? 0,
      unit: ing.unit,
      resolutionStatus: ing.resolutionStatus,
      ingredientId: ing.ingredientId ?? null,
      ingredient: ing.ingredient ?? null,
    })),
    photos: meal.photos.map((photo) => ({
      id: photo.id,
      assetId: photo.assetId,
      position: photo.position,
      secureUrl: photo.asset.secureUrl,
      mimeType: photo.asset.mimeType ?? null,
      width: photo.asset.width ?? null,
      height: photo.asset.height ?? null,
    })),
    tags: meal.tags.map((t) => ({ tag: t.tag, normalizedTag: t.normalizedTag })),
    createdAt: meal.createdAt.toISOString(),
    updatedAt: meal.updatedAt.toISOString(),
  };
}

function mapIngredient(
  ing: {
    position?: number | undefined;
    displayName: string;
    amount: number;
    unit: string;
    ingredientId?: string | undefined;
  },
  index: number,
): CreateCustomMealData['ingredients'][number] {
  const base = {
    position: ing.position ?? index,
    displayName: ing.displayName,
    amount: ing.amount,
    unit: ing.unit,
  };
  if (ing.ingredientId !== undefined) {
    return { ...base, ingredientId: ing.ingredientId };
  }
  return base;
}

function buildCreateData(ownerId: string, input: CreateCustomMealInput): CreateCustomMealData {
  const data: CreateCustomMealData = {
    ownerId,
    name: input.name,
    servings: input.servings,
    ingredients: input.ingredients.map(mapIngredient),
    tags: input.tags,
  };
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.sourceNote !== undefined) data.sourceNote = input.sourceNote;
  if (input.userCalories !== undefined) data.userCalories = input.userCalories;
  if (input.userProteinGrams !== undefined) data.userProteinGrams = input.userProteinGrams;
  if (input.userCarbsGrams !== undefined) data.userCarbsGrams = input.userCarbsGrams;
  if (input.userFatGrams !== undefined) data.userFatGrams = input.userFatGrams;
  if (input.deletePolicy !== undefined) data.deletePolicy = input.deletePolicy;
  return data;
}

function buildUpdateData(input: UpdateCustomMealInput): UpdateCustomMealData {
  const data: UpdateCustomMealData = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.servings !== undefined) data.servings = input.servings;
  if (input.sourceNote !== undefined) data.sourceNote = input.sourceNote;
  if (input.userCalories !== undefined) data.userCalories = input.userCalories;
  if (input.userProteinGrams !== undefined) data.userProteinGrams = input.userProteinGrams;
  if (input.userCarbsGrams !== undefined) data.userCarbsGrams = input.userCarbsGrams;
  if (input.userFatGrams !== undefined) data.userFatGrams = input.userFatGrams;
  if (input.deletePolicy !== undefined) data.deletePolicy = input.deletePolicy;
  if (input.ingredients !== undefined) data.ingredients = input.ingredients.map(mapIngredient);
  if (input.tags !== undefined) data.tags = input.tags;
  return data;
}

function buildListQuery(input: CustomMealListQuery): { page: number; limit: number; tag?: string } {
  const q: { page: number; limit: number; tag?: string } = { page: input.page, limit: input.limit };
  if (input.tag !== undefined) q.tag = input.tag;
  return q;
}

export class CustomMealService {
  constructor(
    private readonly repository: CustomMealRepository,
    private readonly storageRepository: StorageRepository,
    private readonly aiProvider: AiProvider,
  ) {}

  async list(ownerId: string, query: CustomMealListQuery) {
    const { records, total } = await this.repository.listOwned(ownerId, buildListQuery(query));
    return {
      records: records.map(formatCustomMeal),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
      },
    };
  }

  async get(ownerId: string, id: string) {
    const meal = await this.repository.findOwned(ownerId, id);
    if (!meal) {
      throw new AppError({
        statusCode: 404,
        code: 'CUSTOM_MEAL_NOT_FOUND',
        message: 'Không tìm thấy bữa ăn tùy chỉnh',
      });
    }
    return formatCustomMeal(meal);
  }

  async create(ownerId: string, input: CreateCustomMealInput) {
    const meal = await this.repository.create(buildCreateData(ownerId, input));
    try {
      const analyzed = await this.analyzeNutrition(ownerId, meal);
      return formatCustomMeal(analyzed ?? meal);
    } catch {
      // Nutrition enrichment is best-effort and must never roll back a valid private meal.
      return formatCustomMeal(meal);
    }
  }

  async update(ownerId: string, id: string, input: UpdateCustomMealInput) {
    const meal = await this.repository.update(id, ownerId, buildUpdateData(input));
    if (!meal) {
      throw new AppError({
        statusCode: 404,
        code: 'CUSTOM_MEAL_NOT_FOUND',
        message: 'Không tìm thấy bữa ăn tùy chỉnh',
      });
    }
    return formatCustomMeal(meal);
  }

  async delete(ownerId: string, id: string) {
    const result = await this.repository.softDelete(ownerId, id);
    if (result === 'not-found') {
      throw new AppError({
        statusCode: 404,
        code: 'CUSTOM_MEAL_NOT_FOUND',
        message: 'Không tìm thấy bữa ăn tùy chỉnh',
      });
    }
    if (result === 'in-use') {
      throw new AppError({
        statusCode: 409,
        code: 'CUSTOM_MEAL_IN_USE',
        message:
          'Bữa ăn đang được sử dụng trong kế hoạch bữa ăn. Cập nhật chính sách xóa thành RETAIN_SNAPSHOT trước khi xóa.',
      });
    }
  }

  async attachPhoto(ownerId: string, id: string, input: AttachPhotoInput) {
    const existingMeal = await this.repository.findOwned(ownerId, id);
    if (!existingMeal) {
      throw new AppError({
        statusCode: 404,
        code: 'CUSTOM_MEAL_NOT_FOUND',
        message: 'Không tìm thấy bữa ăn tùy chỉnh',
      });
    }

    if (existingMeal.photos.length >= MAX_PHOTOS) {
      throw new AppError({
        statusCode: 422,
        code: 'CUSTOM_MEAL_PHOTO_LIMIT',
        message: `Mỗi bữa ăn tối đa ${MAX_PHOTOS} ảnh`,
      });
    }

    const asset = await this.storageRepository.findAttachableAsset(
      ownerId,
      input.assetId,
      MediaKind.COVER_IMAGE,
    );
    if (!asset) {
      throw new AppError({
        statusCode: 422,
        code: 'ASSET_NOT_FOUND_OR_INELIGIBLE',
        message: 'Asset không tồn tại, không phải ảnh, hoặc không thuộc về bạn',
      });
    }

    const meal = await this.repository.attachPhoto(ownerId, id, input.assetId, input.position);
    if (!meal) {
      throw new AppError({
        statusCode: 404,
        code: 'CUSTOM_MEAL_NOT_FOUND',
        message: 'Không tìm thấy bữa ăn tùy chỉnh',
      });
    }
    return formatCustomMeal(meal);
  }

  async removePhoto(ownerId: string, id: string, assetId: string) {
    const meal = await this.repository.removePhoto(ownerId, id, assetId);
    if (!meal) {
      throw new AppError({
        statusCode: 404,
        code: 'CUSTOM_MEAL_NOT_FOUND',
        message: 'Không tìm thấy bữa ăn tùy chỉnh',
      });
    }
    return formatCustomMeal(meal);
  }

  async reorderPhotos(ownerId: string, id: string, input: ReorderPhotosInput) {
    const meal = await this.repository.reorderPhotos(ownerId, id, input.orderedAssetIds);
    if (!meal) {
      throw new AppError({
        statusCode: 404,
        code: 'CUSTOM_MEAL_NOT_FOUND',
        message: 'Không tìm thấy bữa ăn tùy chỉnh',
      });
    }
    return formatCustomMeal(meal);
  }

  private async analyzeNutrition(ownerId: string, meal: CustomMealRecord) {
    const ingredientIds = [
      ...new Set(meal.ingredients.flatMap((ingredient) => ingredient.ingredientId ?? [])),
    ];
    const profiles = await this.repository.findNutritionProfiles(ingredientIds);
    const profileByIngredient = new Map<string, (typeof profiles)[number]>();
    for (const profile of profiles) {
      if (!profileByIngredient.has(profile.ingredientId)) {
        profileByIngredient.set(profile.ingredientId, profile);
      }
    }

    const totals = new Map<NutritionMetric, number>();
    const sources: Array<Record<string, string>> = [];
    const uncovered: Array<{ position: number; displayName: string; reason: string }> = [];
    for (const ingredient of meal.ingredients) {
      const profile = ingredient.ingredientId
        ? profileByIngredient.get(ingredient.ingredientId)
        : undefined;
      if (!profile) {
        uncovered.push({
          position: ingredient.position,
          displayName: ingredient.displayName,
          reason: ingredient.ingredientId ? 'MISSING_CANONICAL_PROFILE' : 'UNRESOLVED_INGREDIENT',
        });
        continue;
      }
      const amount = ingredient.amount.toNumber();
      const normalizedUnit = ingredient.unit.trim().toLocaleLowerCase('vi');
      const massFactor = MASS_FACTORS.get(normalizedUnit);
      const conversion = profile.householdConversions.find(
        (item) =>
          item.unitName.toLocaleLowerCase('vi') === normalizedUnit ||
          item.unitSymbol?.toLocaleLowerCase('vi') === normalizedUnit,
      );
      const rawGrams =
        massFactor !== undefined
          ? amount * massFactor
          : conversion
            ? (amount / conversion.quantity.toNumber()) * conversion.grams.toNumber()
            : null;
      if (rawGrams === null) {
        uncovered.push({
          position: ingredient.position,
          displayName: ingredient.displayName,
          reason: 'UNIT_CONVERSION_UNAVAILABLE',
        });
        continue;
      }
      const edibleGrams = rawGrams * (profile.ediblePortionPercent.toNumber() / 100);
      for (const nutrient of profile.nutrientValues) {
        const metric =
          METRIC_BY_NUTRIENT[nutrient.nutrient.code as keyof typeof METRIC_BY_NUTRIENT];
        if (!metric) continue;
        totals.set(
          metric,
          (totals.get(metric) ?? 0) + (nutrient.valuePer100g.toNumber() * edibleGrams) / 100,
        );
      }
      sources.push({
        ingredientId: profile.ingredientId,
        sourceCode: profile.source.code,
        sourceVersion: profile.sourceVersion,
        sourceRecordId: profile.sourceRecordId,
      });
    }

    const existing: Partial<Record<NutritionMetric, number>> = {
      ...(meal.userCalories !== null ? { calories: meal.userCalories } : {}),
      ...(meal.userProteinGrams !== null ? { proteinGrams: meal.userProteinGrams.toNumber() } : {}),
      ...(meal.userCarbsGrams !== null ? { carbsGrams: meal.userCarbsGrams.toNumber() } : {}),
      ...(meal.userFatGrams !== null ? { fatGrams: meal.userFatGrams.toNumber() } : {}),
    };
    const values: Partial<Record<NutritionMetric, number>> = { ...existing };
    const metricMetadata: Record<string, Prisma.InputJsonValue> = {};
    for (const metric of Object.values(METRIC_BY_NUTRIENT)) {
      if (existing[metric] !== undefined) {
        metricMetadata[metric] = {
          origin: NutritionValueOrigin.USER_PROVIDED,
          confidence: 1,
          uncertainty: null,
        };
      } else if (totals.has(metric)) {
        const amount = rounded(totals.get(metric)!);
        values[metric] = amount;
        metricMetadata[metric] = {
          origin: NutritionValueOrigin.CANONICAL_CALCULATED,
          confidence: uncovered.length === 0 ? 0.95 : 0.75,
          uncertainty: { partialIngredients: uncovered.length > 0 },
        };
      }
    }

    const missingMetrics = Object.values(METRIC_BY_NUTRIENT).filter(
      (metric) => values[metric] === undefined,
    );
    let aiMetadata: Prisma.InputJsonObject = { used: false, providerDown: false };
    if (missingMetrics.length > 0 && meal.ingredients.length > 0) {
      try {
        const suggestion = await this.aiProvider.suggestCustomMealNutritionFallback({
          mealName: meal.name,
          servings: meal.servings,
          ingredients: meal.ingredients.map((ingredient) => ({
            displayName: ingredient.displayName,
            canonicalName: ingredient.ingredient?.canonicalName ?? null,
            amount: ingredient.amount.toNumber(),
            unit: ingredient.unit,
          })),
          missingMetrics,
          signal: AbortSignal.timeout(10_000),
        });
        let aiUsed = false;
        for (const metric of missingMetrics) {
          const amount = suggestion[metric];
          if (amount === null || !Number.isFinite(amount) || amount < 0) continue;
          values[metric] = rounded(amount);
          aiUsed = true;
          metricMetadata[metric] = {
            origin: NutritionValueOrigin.AI_ESTIMATED,
            confidence: suggestion.confidence,
            uncertainty: suggestion.uncertaintyNote,
          };
        }
        aiMetadata = {
          used: aiUsed,
          provider: this.aiProvider.name,
          modelId: this.aiProvider.chatModel,
          providerDown: false,
          uncertaintyNote: suggestion.uncertaintyNote,
        };
      } catch {
        aiMetadata = {
          used: false,
          provider: this.aiProvider.name,
          modelId: this.aiProvider.chatModel,
          providerDown: true,
        };
      }
    }

    const availableCount = Object.values(METRIC_BY_NUTRIENT).filter(
      (metric) => values[metric] !== undefined,
    ).length;
    const coverage =
      availableCount === 0
        ? NutritionCoverage.UNAVAILABLE
        : availableCount === Object.keys(METRIC_BY_NUTRIENT).length && uncovered.length === 0
          ? NutritionCoverage.COMPLETE
          : NutritionCoverage.PARTIAL;
    return this.repository.saveNutritionAnalysis(ownerId, meal.id, {
      ...(values.calories !== undefined ? { calories: values.calories } : {}),
      ...(values.proteinGrams !== undefined ? { proteinGrams: values.proteinGrams } : {}),
      ...(values.carbsGrams !== undefined ? { carbsGrams: values.carbsGrams } : {}),
      ...(values.fatGrams !== undefined ? { fatGrams: values.fatGrams } : {}),
      coverage,
      metadata: {
        calculationVersion: 'custom-meal-nutrition-v1',
        metrics: metricMetadata,
        sources,
        uncoveredIngredients: uncovered,
        ai: aiMetadata,
        disclaimer:
          'Giá trị dinh dưỡng chỉ mang tính tham khảo; dữ liệu thực tế có thể thay đổi theo nguyên liệu và cách chế biến.',
      },
    });
  }
}
