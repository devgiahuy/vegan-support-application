import { BaseMapper, pickField, safeArray, safeBoolean, safeNumber, safeString } from '@/lib/mapper';
import type { CustomMealDto, CustomMealListResponseDto, CreateCustomMealRequestDto } from '../types/custom-meal.dto';
import type { CustomMeal, CustomMealFormValues, CustomMealIngredient, CustomMealPhoto, CustomMealListResult } from '../types/custom-meal.model';

export class CustomMealMapper extends BaseMapper<CustomMealDto, CustomMeal> {
  toModel(dto: CustomMealDto | null | undefined): CustomMeal {
    const photos = safeArray<unknown, CustomMealPhoto>(pickField(dto, ['photos'], []), (item) => {
      const photo = item as Record<string, unknown>;
      return {
        id: safeString(pickField(photo, ['id', 'assetId'], '')),
        url: safeString(pickField(photo, ['url', 'secureUrl', 'secure_url'], '')),
        sortOrder: safeNumber(pickField(photo, ['sortOrder', 'position'], 0)),
        isCover: safeBoolean(pickField(photo, ['isCover'], false)),
        mimeType: safeString(pickField(photo, ['mimeType'], 'image/jpeg')),
      };
    }).filter((photo) => photo.id || photo.url);

    const coverPhoto = photos.find((photo) => photo.isCover) ?? photos[0] ?? null;
    const ingredients = safeArray<unknown, CustomMealIngredient>(pickField(dto, ['ingredients'], []), (item, index) => {
      const ingredient = item as Record<string, unknown>;
      return {
        id: safeString(pickField(ingredient, ['id'], `ingredient-${index}`)),
        ingredientId: safeString(pickField(ingredient, ['ingredientId'], '')) || null,
        displayName: safeString(pickField(ingredient, ['displayName', 'name'], 'Nguyen lieu')),
        amount: safeNumber(pickField(ingredient, ['amount', 'quantity'], 0)),
        unit: safeString(pickField(ingredient, ['unit'], 'g')),
      };
    });

    const calories = pickField<unknown>(dto, ['userCalories', 'calories', 'calculatedCalories'], null);
    return {
      id: safeString(pickField(dto, ['id'], '')),
      name: safeString(pickField(dto, ['name'], 'Bua an tuy chinh')),
      notes: safeString(pickField(dto, ['notes'], '')) || null,
      servings: Math.max(1, safeNumber(pickField(dto, ['servings'], 1), 1)),
      sourceNote: safeString(pickField(dto, ['sourceNote'], '')) || null,
      calories: calories === null ? null : safeNumber(calories, 0),
      proteinGrams: safeNumber(pickField(dto, ['userProteinGrams', 'userProtein'], 0), 0) || null,
      carbsGrams: safeNumber(pickField(dto, ['userCarbsGrams', 'userCarbs'], 0), 0) || null,
      fatGrams: safeNumber(pickField(dto, ['userFatGrams', 'userFat'], 0), 0) || null,
      coverageRatio: safeNumber(pickField(dto, ['coverageRatio'], 0), 0),
      isFullyCovered: safeBoolean(pickField(dto, ['isFullyCovered'], false)),
      unmatchedIngredientCount: safeNumber(pickField(dto, ['unmatchedIngredientCount'], 0), 0),
      tags: safeArray<string, string>(pickField(dto, ['tags'], []), (tag) => safeString(tag)).filter(Boolean),
      photos,
      coverPhotoUrl: safeString(pickField(dto, ['coverPhotoUrl'], coverPhoto?.url ?? '')) || null,
      photoCount: safeNumber(pickField(dto, ['photoCount'], photos.length), photos.length),
      ingredientCount: safeNumber(pickField(dto, ['ingredientCount'], ingredients.length), ingredients.length),
      ingredients,
      createdAt: safeString(pickField(dto, ['createdAt'], '')),
      updatedAt: safeString(pickField(dto, ['updatedAt'], '')),
    };
  }

  toListModel(dto: CustomMealListResponseDto | null | undefined): CustomMealListResult {
    const data = dto?.data;
    const itemsRaw = data?.records ?? data?.items ?? [];
    const meta = data?.pagination ?? dto?.meta ?? {};
    const items = this.toModelList(itemsRaw);
    return {
      items,
      pagination: {
        page: safeNumber(meta?.page, 1),
        limit: safeNumber(meta?.limit, 20),
        totalItems: safeNumber(meta?.totalItems ?? meta?.total, items.length),
        totalPages: safeNumber(meta?.totalPages, 1),
      },
      availableTags: safeArray<unknown, { name: string; count: number }>(data?.availableTags, (tag) => {
        const item = tag as Record<string, unknown>;
        return { name: safeString(item.name), count: safeNumber(item.count, 0) };
      }).filter((tag) => tag.name.length > 0),
    };
  }

  toCreateDto(values: CustomMealFormValues): CreateCustomMealRequestDto {
    return {
      name: values.name.trim(),
      notes: values.notes.trim() || null,
      servings: values.servings,
      sourceNote: values.sourceNote.trim() || null,
      userCalories: values.userCalories,
      userProteinGrams: values.userProteinGrams,
      userCarbsGrams: values.userCarbsGrams,
      userFatGrams: values.userFatGrams,
      deletePolicy: 'BLOCK',
      tags: values.tags,
      ingredients: values.ingredients.map((ingredient, index) => ({
        position: index + 1,
        displayName: ingredient.displayName.trim(),
        amount: ingredient.amount,
        unit: ingredient.unit.trim(),
        ingredientId: ingredient.ingredientId,
      })),
    };
  }
}

export const customMealMapper = new CustomMealMapper();
