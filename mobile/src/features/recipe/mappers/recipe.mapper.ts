import { FALLBACK_RECIPE_COVER_URL } from '@/lib/env';
import { BaseMapper, pickField, safeString, safeDate, safeNumber, safeBoolean, safeArray } from '@/lib/mapper';
import { formatDate } from '@/lib/utils';
import { RecipeDifficulty } from '@/common/enums';
import {
  authorFromDto,
  coverUrlFromMedia,
  firstCategory,
  getPostStatusLabel,
  parsePostStatus,
} from '@/features/post/mappers/post-shared';
import type {
  RecipeDetailDto,
  RecipeIngredientDto,
  RecipeStepDto,
  NutritionFactDto,
  TraditionWarningDto,
  DietCompatibilityDto,
  AppliedConstraintsDto,
} from '../types/recipe.dto';
import type { PostMediaDto, PostRevisionDto } from '@/features/post/types/post.dto';
import type {
  Recipe,
  RecipeIngredient,
  RecipeInstructionStep,
  NutritionFact,
  TraditionWarning,
  DietCompatibility,
  RecipePaginationResult,
} from '../types/recipe.model';

/** Giá trị thiếu/không hợp lệ -> `null` (không đổi thành 0 để không bịa số dinh dưỡng). */
function nullableNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const parsed = safeNumber(val, Number.NaN);
  return Number.isNaN(parsed) ? null : parsed;
}

function getDifficultyLabel(diff: string): string {
  switch (diff) {
    case RecipeDifficulty.HARD:
      return 'Nâng cao';
    case RecipeDifficulty.MEDIUM:
      return 'Trung bình';
    default:
      return 'Dễ làm';
  }
}


/**
 * Mapper cho danh sách/hiển thị công thức, đồng bộ
 * `frontend/src/features/recipe/mappers/recipe.mapper.ts` (bản đọc — chưa gồm create/update).
 */
export class RecipeMapper extends BaseMapper<RecipeDetailDto, Recipe> {
  toModel(dto: RecipeDetailDto | null | undefined): Recipe {
    const status = parsePostStatus(safeString(pickField(dto, ['status'], 'DRAFT')));
    const revision = pickField<PostRevisionDto | null>(dto, ['revision'], null);
    const body = safeString(revision?.body);
    const detail = pickField<RecipeDetailDto['recipe']>(dto, ['recipe'], null);

    const rawDiff = safeString(detail?.difficulty, 'EASY');
    const difficulty = (
      Object.values(RecipeDifficulty).includes(rawDiff as RecipeDifficulty)
        ? rawDiff
        : RecipeDifficulty.EASY
    ) as RecipeDifficulty;

    const publishedAt = safeDate(pickField(dto, ['publishedAt', 'published_at'], null));
    const prepTime = safeNumber(detail?.prepTimeMinutes, 15);
    const cookTime = safeNumber(detail?.cookTimeMinutes, 20);

    const nutritionDto =
      pickField<NutritionFactDto | null>(dto, ['nutrition'], null) ?? detail?.nutrition ?? null;
    const nutrition: NutritionFact = {
      calories: nullableNumber(nutritionDto?.calories),
      protein: nullableNumber(nutritionDto?.proteinGrams),
      carbs: nullableNumber(nutritionDto?.carbsGrams),
      fat: nullableNumber(nutritionDto?.fatGrams),
      fiber: nullableNumber(nutritionDto?.fiberGrams),
      vitaminB12: nullableNumber(nutritionDto?.vitaminB12Mcg),
    };

    const ingredients: RecipeIngredient[] = safeArray<RecipeIngredientDto>(
      detail?.ingredients
    ).map((item) => ({
      ingredientId: item?.ingredientId ?? null,
      name: safeString(item?.displayName, 'Nguyên liệu'),
      amount: safeNumber(item?.amount, 1),
      unit: safeString(item?.unit, 'phần'),
      notes: '',
    }));

    const steps: RecipeInstructionStep[] = safeArray<RecipeStepDto | null>(detail?.steps)
      .map((step, index) => ({
        position: safeNumber(step?.position, index),
        instruction: safeString(step?.instruction, ''),
        durationMinutes: nullableNumber(step?.durationMinutes),
        temperatureCelsius: nullableNumber(step?.temperatureCelsius),
        cookingMethodName: safeString(step?.cookingMethod?.name, '') || null,
      }))
      .filter((step) => step.instruction.length > 0)
      .sort((a, b) => a.position - b.position);

    const coverImageUrl = coverUrlFromMedia(
      pickField<PostMediaDto[]>(dto, ['media'], []),
      FALLBACK_RECIPE_COVER_URL
    );
    const author = authorFromDto(dto, 'Bếp Chay An Nhiên');

    const traditionWarnings: TraditionWarning[] = safeArray<TraditionWarningDto>(
      detail?.traditionWarnings
    ).map((w) => ({
      tradition: safeString(w?.tradition),
      warningCode: safeString(w?.warningCode),
      label: safeString(w?.label),
    }));
    const dietCompatibilities: DietCompatibility[] = safeArray<DietCompatibilityDto>(
      detail?.dietCompatibilities
    ).map((c) => ({
      dietPattern: safeString(c?.dietPattern),
      compatible: safeBoolean(c?.compatible, false),
      reasonCodes: safeArray<string>(c?.reasonCodes),
    }));

    return {
      id: safeString(pickField(dto, ['id'], '')),
      title: safeString(revision?.title, 'Công thức chưa có tên'),
      slug: safeString(pickField(dto, ['slug'], '')),
      status,
      statusLabel: getPostStatusLabel(status),
      version: safeNumber(pickField(dto, ['version'], 1)),
      author: {
        id: author.id,
        name: author.name,
        avatarUrl: author.avatarUrl,
        verified: false,
      },
      category: firstCategory(dto),
      coverImageUrl,
      servings: safeNumber(detail?.servings, 2),
      prepTimeMinutes: prepTime,
      cookTimeMinutes: cookTime,
      totalTimeMinutes: prepTime + cookTime,
      difficulty,
      difficultyLabel: getDifficultyLabel(difficulty),
      mealPlannerEligible: safeBoolean(detail?.mealPlannerEligible, false),
      nutrition,
      ingredients,
      steps,
      body,
      tags: safeArray<string>(revision?.tags),
      publishedAt,
      formattedPublishedAt: formatDate(publishedAt),
      description: safeString(revision?.excerpt, ''),
      allergenCodes: safeArray<string>(detail?.allergenCodes),
      traditionWarnings,
      dietCompatibilities,
      rating: undefined,
      ratingCount: undefined,
    };
  }

  toPaginationFromEnvelope(
    data: (RecipeDetailDto | null | undefined)[] | null | undefined,
    meta?: {
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
      appliedConstraints?: AppliedConstraintsDto;
    } | null
  ): RecipePaginationResult {
    const items = this.toModelList(data);
    return {
      items,
      metadata: {
        page: safeNumber(meta?.page, 1),
        limit: safeNumber(meta?.limit, 20),
        totalItems: safeNumber(meta?.total, items.length),
        totalPages: safeNumber(meta?.totalPages, 1),
        appliedConstraints: meta?.appliedConstraints
          ? {
              authenticated: safeBoolean(meta.appliedConstraints.authenticated, false),
              dietPattern: meta.appliedConstraints.dietPattern ?? null,
              allergyCount: safeNumber(meta.appliedConstraints.allergyCount, 0),
              ingredientExclusionCount: safeNumber(
                meta.appliedConstraints.ingredientExclusionCount,
                0
              ),
              traditions: safeArray<string>(meta.appliedConstraints.traditions),
              forDate: safeString(meta.appliedConstraints.forDate, ''),
            }
          : undefined,
      },
    };
  }
}

export const recipeMapper = new RecipeMapper();
