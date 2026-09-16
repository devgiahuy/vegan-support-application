import {
  BaseMapper,
  pickField,
  safeString,
  safeDate,
  safeNumber,
  safeBoolean,
  safeArray,
} from '@/lib/mapper';
import { formatDate } from '@/lib/utils';
import { PostStatus, RecipeDifficulty } from '@/common/enums';
import { PaginationResult } from '@/types/api';
import {
  authorFromDto,
  coverMediaInput,
  coverUrlFromMedia,
  firstCategory,
  getPostStatusLabel,
  parsePostStatus,
} from '@/features/post/mappers/post.mapper';
import type {
  RecipeDetailDto,
  RecipeIngredientDto,
  NutritionFactDto,
  CreateRecipeRequestDto,
  UpdateRecipeRequestDto,
} from '../types/recipe.dto';
import type { PostMediaDto, PostRevisionDto } from '@/features/post/types/post.dto';
import type { Recipe, RecipeIngredient, RecipeStep, NutritionFact } from '../types/recipe.model';

function getDifficultyLabel(diff: RecipeDifficulty | string): string {
  switch (diff) {
    case RecipeDifficulty.HARD:
    case 'Nâng cao':
      return 'Nâng cao';
    case RecipeDifficulty.MEDIUM:
    case 'Trung bình':
      return 'Trung bình';
    default:
      return 'Dễ làm';
  }
}

const RECIPE_FALLBACK_COVER =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80';

/** Dựng `body` markdown gửi backend từ danh sách bước của form. */
export function stepsToBody(
  steps: { stepNumber: number; instruction: string }[] | undefined,
  fallback: string
): string {
  const lines = (steps || [])
    .map((s) => `## Bước ${s.stepNumber}\n${s.instruction}`.trim())
    .filter(Boolean);
  const body = lines.join('\n\n');
  return body || fallback;
}

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
    const totalTime = prepTime + cookTime;

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

    const rawIngredients = safeArray<RecipeIngredientDto>(detail?.ingredients);
    const ingredients: RecipeIngredient[] = rawIngredients.map((item) => ({
      ingredientId: item?.ingredientId ?? null,
      name: safeString(item?.displayName, 'Nguyên liệu'),
      amount: safeNumber(item?.amount, 1),
      unit: safeString(item?.unit, 'phần'),
      notes: '',
    }));

    // Backend không trả steps structured — bước nấu nằm trong `revision.body`.
    const steps: RecipeStep[] = [];

    const coverImageUrl = coverUrlFromMedia(
      pickField<PostMediaDto[]>(dto, ['media'], []),
      RECIPE_FALLBACK_COVER
    );
    const author = authorFromDto(dto, 'Bếp Chay An Nhiên');

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
        avatar: author.avatarUrl || 'https://i.pravatar.cc/80?img=32',
        verified: true,
        roleTitle: 'Đầu bếp chay',
      },
      category: firstCategory(dto),
      coverImageUrl,
      coverMedia: null,
      servings: safeNumber(detail?.servings, 2),
      prepTimeMinutes: prepTime,
      cookTimeMinutes: cookTime,
      totalTimeMinutes: totalTime,
      difficulty,
      difficultyLabel: getDifficultyLabel(difficulty),
      mealPlannerEligible: safeBoolean(detail?.mealPlannerEligible, false),
      nutrition,
      ingredients,
      steps,
      instructions: [],
      body,
      publishedAt,
      formattedPublishedAt: formatDate(publishedAt),
      stats: { views: 0, likes: 0, comments: 0 },

      // --- Legacy compatibility properties ---
      image: coverImageUrl,
      minutes: totalTime,
      kcal: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      fiber: nutrition.fiber,
      rating: 5.0,
      ratingCount: 0,
      saved: false,
      expertVerified: true,
      description: safeString(revision?.excerpt, ''),
      dietTag: 'Thuần chay',
    };
  }

  toPaginationFromEnvelope(
    data: (RecipeDetailDto | null | undefined)[] | null | undefined,
    meta?: { page?: number; limit?: number; total?: number; totalPages?: number } | null
  ): PaginationResult<Recipe> {
    const items = this.toModelList(data);
    return {
      items,
      metadata: {
        page: safeNumber(meta?.page, 1),
        limit: safeNumber(meta?.limit, 20),
        totalItems: safeNumber(meta?.total, items.length),
        totalPages: safeNumber(meta?.totalPages, 1),
      },
    };
  }

  toCreateDto(domain: Partial<Recipe>): CreateRecipeRequestDto {
    const categoryId =
      typeof domain.category === 'object' && domain.category !== null
        ? domain.category.id
        : typeof domain.category === 'string'
          ? domain.category
          : '';

    const steps = (domain.steps || domain.instructions || []).map((step, idx) => ({
      stepNumber: step.stepNumber || idx + 1,
      instruction: step.instruction || (step as { desc?: string }).desc || '',
    }));

    return {
      type: 'RECIPE',
      title: domain.title || '',
      excerpt: domain.description || undefined,
      categoryIds: categoryId ? [categoryId] : [],
      tags: [],
      media: coverMediaInput(domain.coverImageUrl, domain.coverMedia),
      body: stepsToBody(steps, domain.body || domain.description || ''),
      recipe: {
        servings: domain.servings || 2,
        prepTimeMinutes: domain.prepTimeMinutes ?? 15,
        cookTimeMinutes: domain.cookTimeMinutes ?? 20,
        difficulty:
          typeof domain.difficulty === 'string' &&
          Object.values(RecipeDifficulty).includes(domain.difficulty as RecipeDifficulty)
            ? domain.difficulty
            : RecipeDifficulty.EASY,
        nutrition: domain.nutrition
          ? {
              calories: Math.round(domain.nutrition.calories),
              proteinGrams: domain.nutrition.protein,
              carbsGrams: domain.nutrition.carbs,
              fatGrams: domain.nutrition.fat,
              fiberGrams: domain.nutrition.fiber,
              vitaminB12Mcg: domain.nutrition.vitaminB12,
            }
          : undefined,
        ingredients: (domain.ingredients || []).map((item) => ({
          ingredientId: 'ingredientId' in item && item.ingredientId ? item.ingredientId : null,
          displayName: item.name,
          amount:
            typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount)) || 1,
          unit: item.unit || 'phần',
        })),
      },
    };
  }

  toUpdateDto(domain: Partial<Recipe>): UpdateRecipeRequestDto {
    return {
      ...this.toCreateDto(domain),
      expectedVersion: typeof domain.version === 'number' ? domain.version : 1,
    };
  }
}

export const recipeMapper = new RecipeMapper();
