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
  NutritionFactDto,
  TraditionWarningDto,
  DietCompatibilityDto,
  AppliedConstraintsDto,
} from '../types/recipe.dto';
import type { PostMediaDto, PostRevisionDto } from '@/features/post/types/post.dto';
import type {
  Recipe,
  RecipeIngredient,
  NutritionFact,
  TraditionWarning,
  DietCompatibility,
  RecipePaginationResult,
} from '../types/recipe.model';

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

const RECIPE_FALLBACK_COVER =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80';

/**
 * Mapper cho danh sách/hiển thị công thức, đồng bộ
 * `frontend/src/features/recipe/mappers/recipe.mapper.ts` (bản đọc — chưa gồm create/update).
 */
export class RecipeMapper extends BaseMapper<RecipeDetailDto, Recipe> {
  toModel(dto: RecipeDetailDto | null | undefined): Recipe {
    const status = parsePostStatus(safeString(pickField(dto, ['status'], 'DRAFT')));
    const revision = pickField<PostRevisionDto | null>(dto, ['revision'], null);
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
      calories: safeNumber(nutritionDto?.calories, 0),
      protein: safeNumber(nutritionDto?.proteinGrams, 0),
      carbs: safeNumber(nutritionDto?.carbsGrams, 0),
      fat: safeNumber(nutritionDto?.fatGrams, 0),
      fiber: safeNumber(nutritionDto?.fiberGrams, 0),
      vitaminB12: safeNumber(nutritionDto?.vitaminB12Mcg, 0),
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

    const coverImageUrl = coverUrlFromMedia(
      pickField<PostMediaDto[]>(dto, ['media'], []),
      RECIPE_FALLBACK_COVER
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
