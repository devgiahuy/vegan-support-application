import { MediaKind } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
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

function mapIngredient(ing: {
  position: number;
  displayName: string;
  amount: number;
  unit: string;
  ingredientId?: string | undefined;
}): CreateCustomMealData['ingredients'][number] {
  const base = {
    position: ing.position,
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
    return formatCustomMeal(meal);
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
}
