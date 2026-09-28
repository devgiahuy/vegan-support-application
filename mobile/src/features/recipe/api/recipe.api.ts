import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { PostType, RecipeDifficulty } from '@/common/enums';
import { recipeMapper } from '../mappers/recipe.mapper';
import type { RecipeDetailResponseDto, RecipeListResponseDto } from '../types/recipe.dto';
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
  displayName: string;
  amount: number;
  unit: string;
  optional?: boolean;
}

export interface CreateRecipeInput {
  title: string;
  excerpt?: string;
  body: string;
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
}

export interface UpdateRecipeInput extends CreateRecipeInput {
  expectedVersion: number;
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
    const payload = {
      type: PostType.RECIPE,
      title: input.title,
      ...(input.excerpt ? { excerpt: input.excerpt } : {}),
      ...(input.categoryIds?.length ? { categoryIds: input.categoryIds } : {}),
      ...(input.tags?.length ? { tags: input.tags } : {}),
      media: [],
      body: input.body,
      recipe: {
        servings: input.servings,
        prepTimeMinutes: input.prepTimeMinutes,
        cookTimeMinutes: input.cookTimeMinutes,
        difficulty: input.difficulty,
        nutrition: input.nutrition ?? {},
        ingredients: input.ingredients.map((ing) => ({
          displayName: ing.displayName,
          amount: ing.amount,
          unit: ing.unit,
          optional: ing.optional ?? false,
        })),
        steps: [],
      },
    };

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
    const payload = {
      type: PostType.RECIPE,
      title: input.title,
      ...(input.excerpt ? { excerpt: input.excerpt } : {}),
      ...(input.categoryIds?.length ? { categoryIds: input.categoryIds } : {}),
      ...(input.tags?.length ? { tags: input.tags } : {}),
      media: [],
      body: input.body,
      recipe: {
        servings: input.servings,
        prepTimeMinutes: input.prepTimeMinutes,
        cookTimeMinutes: input.cookTimeMinutes,
        difficulty: input.difficulty,
        nutrition: input.nutrition ?? {},
        ingredients: input.ingredients.map((ing) => ({
          displayName: ing.displayName,
          amount: ing.amount,
          unit: ing.unit,
          optional: ing.optional ?? false,
        })),
        steps: [],
      },
      expectedVersion: input.expectedVersion,
    };

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
