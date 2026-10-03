import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { PostType, RecipeDifficulty } from '@/common/enums';
import { recipeMapper } from '../mappers/recipe.mapper';
import type { RecipeDetailResponseDto, RecipeListResponseDto } from '../types/recipe.dto';
import type { RelatedPostsResponseDto } from '@/features/post/types/post.dto';
import type { Recipe, RecipePaginationResult } from '../types/recipe.model';

export interface RecipeQueryParams {
  page?: number;
  limit?: number;
  /** UUID hoặc slug danh mục (backend `category`, strict — không gửi `categoryId`). */
  category?: string;
  difficulty?: string;
  q?: string;
}

export interface CreateRecipeIngredientInput {
  /** Id nguyên liệu chuẩn khi người dùng chọn từ gợi ý; bỏ trống nếu là tên tự nhập. */
  ingredientId?: string | null;
  displayName: string;
  amount: number;
  unit: string;
  optional?: boolean;
}

/** Một bước nấu có cấu trúc gửi lên backend. */
export interface CreateRecipeStepInput {
  instruction: string;
  durationMinutes?: number;
}

export interface CreateRecipeInput {
  title: string;
  excerpt?: string;
  categoryIds?: string[];
  tags?: string[];
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: RecipeDifficulty;
  nutrition?: {
    calories?: number;
    proteinGrams?: number;
    carbsGrams?: number;
    fatGrams?: number;
    fiberGrams?: number;
  };
  ingredients: CreateRecipeIngredientInput[];
  steps: CreateRecipeStepInput[];
}

export interface UpdateRecipeInput extends CreateRecipeInput {
  expectedVersion: number;
}

/** Gộp các bước thành văn bản `revision.body` (backend yêu cầu có nội dung hướng dẫn). */
function stepsToBody(steps: CreateRecipeStepInput[]): string {
  return steps.map((step, index) => `Bước ${index + 1}: ${step.instruction.trim()}`).join('\n');
}

function buildRecipePayload(input: CreateRecipeInput) {
  return {
    type: PostType.RECIPE,
    title: input.title,
    ...(input.excerpt ? { excerpt: input.excerpt } : {}),
    ...(input.categoryIds?.length ? { categoryIds: input.categoryIds } : {}),
    ...(input.tags?.length ? { tags: input.tags } : {}),
    media: [],
    body: stepsToBody(input.steps),
    recipe: {
      servings: input.servings,
      prepTimeMinutes: input.prepTimeMinutes,
      cookTimeMinutes: input.cookTimeMinutes,
      difficulty: input.difficulty,
      nutrition: input.nutrition ?? {},
      ingredients: input.ingredients.map((ing) => ({
        ...(ing.ingredientId ? { ingredientId: ing.ingredientId } : {}),
        displayName: ing.displayName,
        amount: ing.amount,
        unit: ing.unit,
        optional: ing.optional ?? false,
      })),
      steps: input.steps.map((step) => ({
        instruction: step.instruction.trim(),
        ...(step.durationMinutes ? { durationMinutes: step.durationMinutes } : {}),
      })),
    },
  };
}

export const recipeApi = {
  /** Danh sách công thức nấu ăn (phân trang, lọc danh mục/độ khó/từ khóa). `GET /posts?type=RECIPE`. */
  getRecipes: async (params?: RecipeQueryParams): Promise<RecipePaginationResult> => {
    const res = await api.get<RecipeListResponseDto>(API_ENDPOINTS.POSTS.LIST, {
      params: { ...params, type: PostType.RECIPE },
      silent: true,
    });
    return recipeMapper.toPaginationFromEnvelope(res.data.data, res.data.meta);
  },

  /** Công thức liên quan theo cùng danh mục/nguyên liệu. `GET /posts/:id/related` (nhóm `recipes`). */
  getRelatedRecipes: async (id: string, limitPerType = 4): Promise<Recipe[]> => {
    const res = await api.get<RelatedPostsResponseDto>(API_ENDPOINTS.POSTS.RELATED(id), {
      params: { limitPerType },
      silent: true,
    });
    return recipeMapper.toModelList(res.data?.data?.recipes ?? []);
  },

  /** Chi tiết 1 công thức theo id hoặc slug. `GET /posts/:idOrSlug`. */
  getRecipeDetail: async (idOrSlug: string): Promise<Recipe> => {
    const res = await api.get<RecipeDetailResponseDto>(API_ENDPOINTS.POSTS.DETAIL(idOrSlug), {
      silent: true,
    });
    return recipeMapper.toModel(res.data.data);
  },

  /**
   * Tạo công thức mới rồi gửi ngay để duyệt: `POST /posts` (type=RECIPE, luôn tạo
   * draft revision) → `POST /posts/:id/submit` (chuyển PENDING_REVIEW). Không có
   * media/ảnh bìa vì mobile chưa dựng luồng upload Cloudinary (chỉ chấp nhận
   * `assetId` đã reserve/commit qua storage — ngoài phạm vi task này).
   */
  createRecipe: async (input: CreateRecipeInput): Promise<Recipe> => {
    const payload = buildRecipePayload(input);

    const createRes = await api.post<RecipeDetailResponseDto>(API_ENDPOINTS.POSTS.LIST, payload);
    const created = createRes.data.data;
    const revisionId = created.revision?.id;
    const expectedVersion = created.version;

    if (revisionId && expectedVersion) {
      try {
        const submitRes = await api.post<RecipeDetailResponseDto>(
          API_ENDPOINTS.POSTS.SUBMIT(created.id ?? ''),
          { revisionId, expectedVersion }
        );
        return recipeMapper.toModel(submitRes.data.data);
      } catch {
        // Tạo thành công nhưng gửi duyệt thất bại — vẫn trả về bản draft vừa tạo,
        // người dùng có thể thử gửi duyệt lại sau (chưa có màn quản lý draft riêng).
        return recipeMapper.toModel(created);
      }
    }
    return recipeMapper.toModel(created);
  },

  /**
   * Sửa công thức của chính mình rồi gửi lại để duyệt: `PATCH /posts/:id` (tạo draft
   * revision mới) → `POST /posts/:id/submit`. `expectedVersion` là `version` hiện tại.
   */
  updateRecipe: async (id: string, input: UpdateRecipeInput): Promise<Recipe> => {
    const payload = { ...buildRecipePayload(input), expectedVersion: input.expectedVersion };

    const updateRes = await api.patch<RecipeDetailResponseDto>(API_ENDPOINTS.POSTS.DETAIL(id), payload);
    const updated = updateRes.data.data;
    const revisionId = updated.revision?.id;
    const newExpectedVersion = updated.version;

    if (revisionId && newExpectedVersion) {
      try {
        const submitRes = await api.post<RecipeDetailResponseDto>(
          API_ENDPOINTS.POSTS.SUBMIT(updated.id ?? ''),
          { revisionId, expectedVersion: newExpectedVersion }
        );
        return recipeMapper.toModel(submitRes.data.data);
      } catch {
        return recipeMapper.toModel(updated);
      }
    }
    return recipeMapper.toModel(updated);
  },
};
