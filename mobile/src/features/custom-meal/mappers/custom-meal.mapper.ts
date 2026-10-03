import { BaseMapper, pickField, safeArray, safeNumber, safeString } from '@/lib/mapper';
import type {
  CreateCustomMealRequestDto,
  CustomMealDto,
  CustomMealIngredientDto,
  CustomMealListResponseDto,
  CustomMealPhotoDto,
  CustomMealTagDto,
} from '../types/custom-meal.dto';
import type {
  CustomMeal,
  CustomMealFormValues,
  CustomMealIngredient,
  CustomMealListResult,
  CustomMealPhoto,
  IngredientResolutionStatus,
} from '../types/custom-meal.model';

const COVERAGE_LABELS: Record<string, string> = {
  COMPLETE: 'Dinh dưỡng đầy đủ',
  PARTIAL: 'Dinh dưỡng một phần',
  NONE: 'Chưa có dữ liệu dinh dưỡng',
};

/** Giá trị thiếu -> `null` (không đổi thành 0 để không bịa số dinh dưỡng). */
function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = safeNumber(value, Number.NaN);
  return Number.isNaN(parsed) ? null : parsed;
}

function toResolutionStatus(value: unknown): IngredientResolutionStatus {
  const raw = safeString(value).toUpperCase();
  return raw === 'EXACT' || raw === 'AMBIGUOUS' ? raw : 'UNKNOWN';
}

export class CustomMealMapper extends BaseMapper<CustomMealDto, CustomMeal> {
  toModel(dto: CustomMealDto | null | undefined): CustomMeal {
    const photos = safeArray<CustomMealPhotoDto | null, CustomMealPhoto>(pickField(dto, ['photos'], []), (photo, index) => ({
      id: safeString(pickField(photo, ['assetId', 'id'], '')),
      url: safeString(pickField(photo, ['secureUrl'], '')),
      sortOrder: safeNumber(pickField(photo, ['position'], index), index),
      isCover: index === 0,
      mimeType: safeString(pickField(photo, ['mimeType'], 'image/jpeg')) || 'image/jpeg',
    }))
      .filter((photo) => photo.url.length > 0)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((photo, index) => ({ ...photo, isCover: index === 0 }));

    const ingredients = safeArray<CustomMealIngredientDto | null, CustomMealIngredient>(
      pickField(dto, ['ingredients'], []),
      (ingredient, index) => {
        const ingredientId = safeString(pickField(ingredient, ['ingredientId'], '')) || null;
        const canonical = pickField(ingredient, ['ingredient'], null);
        return {
          id: safeString(pickField(ingredient, ['id'], `ingredient-${index}`)),
          ingredientId,
          displayName: safeString(pickField(ingredient, ['displayName'], '')) || 'Nguyên liệu',
          canonicalName: ingredientId ? safeString(pickField(canonical, ['canonicalName'], '')) || null : null,
          resolutionStatus: toResolutionStatus(pickField(ingredient, ['resolutionStatus'], 'UNKNOWN')),
          amount: safeNumber(pickField(ingredient, ['amount'], 0)),
          unit: safeString(pickField(ingredient, ['unit'], 'g')) || 'g',
        };
      }
    );

    const tags = safeArray<CustomMealTagDto | string | null, string>(pickField(dto, ['tags'], []), (tag) =>
      typeof tag === 'string' ? tag : safeString(pickField(tag, ['tag'], ''))
    ).filter((tag) => tag.length > 0);

    const coverage = safeString(pickField(dto, ['nutritionCoverage'], '')).toUpperCase();

    return {
      id: safeString(pickField(dto, ['id'], '')),
      name: safeString(pickField(dto, ['name'], 'Bữa ăn tùy chỉnh')),
      notes: safeString(pickField(dto, ['notes'], '')) || null,
      servings: Math.max(1, safeNumber(pickField(dto, ['servings'], 1), 1)),
      sourceNote: safeString(pickField(dto, ['sourceNote'], '')) || null,
      calories: nullableNumber(pickField(dto, ['userCalories'], null)),
      proteinGrams: nullableNumber(pickField(dto, ['userProteinGrams'], null)),
      carbsGrams: nullableNumber(pickField(dto, ['userCarbsGrams'], null)),
      fatGrams: nullableNumber(pickField(dto, ['userFatGrams'], null)),
      fiberGrams: nullableNumber(pickField(dto, ['userFiberGrams'], null)),
      nutritionCoverage: coverage,
      nutritionCoverageLabel: COVERAGE_LABELS[coverage] ?? 'Chưa rõ mức dữ liệu dinh dưỡng',
      tags,
      photos,
      coverPhotoUrl: photos[0]?.url ?? null,
      photoCount: photos.length,
      ingredientCount: ingredients.length,
      unlinkedIngredientCount: ingredients.filter((ingredient) => ingredient.ingredientId === null).length,
      ingredients,
      createdAt: safeString(pickField(dto, ['createdAt'], '')),
      updatedAt: safeString(pickField(dto, ['updatedAt'], '')),
    };
  }

  toListModel(dto: CustomMealListResponseDto | null | undefined): CustomMealListResult {
    const data = dto?.data;
    const items = this.toModelList(data?.records ?? []);
    const meta = data?.pagination ?? {};
    return {
      items,
      pagination: {
        page: safeNumber(meta.page, 1),
        limit: safeNumber(meta.limit, 20),
        totalItems: safeNumber(meta.total, items.length),
        totalPages: safeNumber(meta.totalPages, 1),
      },
    };
  }

  toCreateDto(values: CustomMealFormValues): CreateCustomMealRequestDto {
    const optional = <K extends string>(key: K, value: number | null): { [P in K]?: number } =>
      value === null ? {} : ({ [key]: value } as { [P in K]?: number });

    return {
      name: values.name.trim(),
      notes: values.notes.trim() || null,
      servings: values.servings,
      sourceNote: values.sourceNote.trim() || null,
      ...optional('userCalories', values.userCalories),
      ...optional('userProteinGrams', values.userProteinGrams),
      ...optional('userCarbsGrams', values.userCarbsGrams),
      ...optional('userFatGrams', values.userFatGrams),
      ...optional('userFiberGrams', values.userFiberGrams),
      deletePolicy: 'BLOCK',
      tags: values.tags,
      ingredients: values.ingredients.map((ingredient, index) => ({
        position: index,
        displayName: ingredient.displayName.trim(),
        amount: ingredient.amount,
        unit: ingredient.unit.trim(),
        ...(ingredient.ingredientId ? { ingredientId: ingredient.ingredientId } : {}),
      })),
    };
  }
}

export const customMealMapper = new CustomMealMapper();
