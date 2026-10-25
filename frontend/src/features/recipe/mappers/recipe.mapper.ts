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
import { RecipeDifficulty } from '@/common/enums';
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
  RecipeUsageStatisticsDto,
  TraditionWarningDto,
  DietCompatibilityDto,
  CreateRecipeRequestDto,
  UpdateRecipeRequestDto,
  AppliedConstraintsDto,
} from '../types/recipe.dto';
import type { PostMediaDto, PostRevisionDto } from '@/features/post/types/post.dto';
import {
  getAllergenName,
  getDietPatternName,
  getDietReasonLabel,
  getTraditionName,
} from '@/common/constants/diet-labels';
import type {
  AuthorRole,
  Recipe,
  RecipeAllergen,
  RecipeIngredient,
  RecipeStep,
  NutritionFact,
  TraditionWarning,
  DietCompatibility,
  RecipePaginationResult,
} from '../types/recipe.model';

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

/**
 * Tách ngược `body` markdown thành danh sách bước (ngược với `stepsToBody`).
 * Backend không trả steps structured nên form sửa phải dựng lại từ `## Bước N`.
 * Body không có heading được coi là một bước duy nhất.
 */
export function bodyToSteps(
  body: string | undefined
): { stepNumber: number; instruction: string }[] {
  const text = (body || '').trim();
  if (!text) return [];
  const parts = text.split(/^##\s*Bước\s*\d+\s*$/m);
  if (parts.length === 1) return [{ stepNumber: 1, instruction: text }];
  return parts
    .slice(1)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((instruction, idx) => ({ stepNumber: idx + 1, instruction }));
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
    const rawAuthor = pickField<Record<string, unknown> | null>(dto, ['author'], null);
    const authorRole = pickField<string | undefined>(rawAuthor, ['role'], undefined) as
      AuthorRole | undefined;
    const authorVerified = safeBoolean(pickField(rawAuthor, ['verified'], false), false);
    const expertVerified = safeBoolean(pickField(dto, ['expertVerified'], false), false);
    const isExpertAuthor =
      authorRole === 'NUTRITION_EXPERT' ||
      authorRole === 'EXPERIENCED_COOK' ||
      authorVerified ||
      expertVerified;

    const statistics = pickField<RecipeUsageStatisticsDto | null>(detail, ['statistics'], null);
    const rawUsageCount =
      pickField<number | string | null>(statistics, ['usageUserCount'], null) ??
      pickField<number | string | null>(detail, ['usageCount'], null) ??
      pickField<number | string | null>(dto, ['usageCount'], null);
    const usageCount = safeNumber(rawUsageCount, 0);

    const traditionWarnings: TraditionWarning[] = safeArray<TraditionWarningDto>(
      detail?.traditionWarnings
    ).map((w) => {
      const tradition = safeString(w?.tradition);
      const tradName = getTraditionName(tradition);
      return {
        tradition,
        traditionName: tradName,
        traditionLabel: tradName,
        warningCode: safeString(w?.warningCode),
        label: safeString(w?.label),
      };
    });
    const dietCompatibilities: DietCompatibility[] = safeArray<DietCompatibilityDto>(
      detail?.dietCompatibilities
    ).map((c) => {
      const dietPattern = safeString(c?.dietPattern);
      const patternName = getDietPatternName(dietPattern);
      const reasonCodes = safeArray<string>(c?.reasonCodes);
      return {
        dietPattern,
        dietPatternName: patternName,
        dietPatternLabel: patternName,
        compatible: safeBoolean(c?.compatible, false),
        reasonCodes,
        reasonLabels: reasonCodes.map(getDietReasonLabel),
      };
    });

    const allergenCodes = safeArray<string>(detail?.allergenCodes);
    const allergens: RecipeAllergen[] = allergenCodes.map((code) => ({
      code,
      name: getAllergenName(code),
    }));

    const revisionId = safeString(revision?.id);
    const version = safeNumber(pickField(dto, ['version'], 1));
    const revisionVersion = safeNumber(revision?.version, version);
    const publishedRevisionVersion = pickField<number | null>(
      dto,
      ['publishedRevisionVersion'],
      null
    );

    return {
      id: safeString(pickField(dto, ['id'], '')),
      title: safeString(revision?.title, 'Công thức chưa có tên'),
      slug: safeString(pickField(dto, ['slug'], '')),
      status,
      statusLabel: getPostStatusLabel(status),
      version,
      revisionId: revisionId || undefined,
      revisionVersion,
      publishedRevisionVersion,
      author: {
        id: author.id,
        name: author.name,
        avatarUrl: author.avatarUrl,
        avatar: author.avatarUrl || 'https://i.pravatar.cc/80?img=32',
        verified: authorVerified,
        role: authorRole,
        roleTitle:
          authorRole === 'NUTRITION_EXPERT'
            ? 'Chuyên gia dinh dưỡng'
            : authorRole === 'EXPERIENCED_COOK'
              ? 'Đầu bếp chay'
              : undefined,
        isExpert: isExpertAuthor,
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

      // --- Legacy compatibility properties (chỉ giữ số liệu thật từ backend) ---
      image: coverImageUrl,
      minutes: totalTime,
      kcal: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      fiber: nutrition.fiber,
      // Backend chưa có rating/reviews/dietTag: để undefined, UI tự ẩn thay vì số giả.
      rating: undefined,
      ratingCount: undefined,
      saved: false,
      expertVerified: false,
      description: safeString(revision?.excerpt, ''),
      dietTag: undefined,
      allergenCodes,
      allergens,
      traditionWarnings,
      dietCompatibilities,
      usageCount,
      isExpertAuthor,
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
        totalPages: safeNumber(meta?.totalPages, items.length === 0 ? 0 : 1),
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
        ingredients: (domain.ingredients || []).map((item) => {
          // Backend `ingredientId` là optional UUID: vắng mặt thì thôi,
          // gửi explicit `null` sẽ 400 strict. Chỉ kèm key khi có UUID thật.
          const ingredientId =
            'ingredientId' in item && item.ingredientId ? item.ingredientId : undefined;
          return {
            ...(ingredientId ? { ingredientId } : {}),
            displayName: item.name,
            amount:
              typeof item.amount === 'number' ? item.amount : parseFloat(String(item.amount)) || 1,
            unit: item.unit || 'phần',
          };
        }),
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
