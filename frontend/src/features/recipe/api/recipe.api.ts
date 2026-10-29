import api from '@/lib/axios';
import { POSTS_ENDPOINTS } from '@/common/constants/endpoints/posts.endpoints';
import { PostType } from '@/common/enums';
import { recipeMapper } from '../mappers/recipe.mapper';
import type {
  RecipeListResponseDto,
  RecipeDetailResponseDto,
  CreateRecipeRequestDto,
  UpdateRecipeRequestDto,
} from '../types/recipe.dto';
import type {
  Recipe,
  RecipeEligibilityFilter,
  RecipePaginationResult,
} from '../types/recipe.model';

export interface RecipeQueryParams {
  page?: number;
  limit?: number;
  /** UUID hoặc slug danh mục (backend `category`, strict — không gửi `categoryId`). */
  category?: string;
  difficulty?: string;
  q?: string;
  /** `INELIGIBLE` trả các món bị hồ sơ loại kèm lý do; mặc định backend là `ELIGIBLE`. */
  eligibility?: RecipeEligibilityFilter;
}

export const recipeApi = {
  /**
   * Lấy danh sách công thức nấu ăn (hỗ trợ phân trang, lọc danh mục, độ khó, từ khóa)
   */
  getRecipes: async (params?: RecipeQueryParams): Promise<RecipePaginationResult> => {
    const res = await api.get<RecipeListResponseDto>(POSTS_ENDPOINTS.LIST, {
      params: {
        ...params,
        type: PostType.RECIPE,
      },
      silent: true,
    });

    if (res.data?.success && Array.isArray(res.data.data)) {
      return recipeMapper.toPaginationFromEnvelope(res.data.data, res.data.meta);
    }
    throw new Error('Phản hồi danh sách công thức không đúng định dạng.');
  },

  /**
   * Lấy chi tiết công thức nấu ăn theo id hoặc slug
   */
  getRecipeDetail: async (idOrSlug: string): Promise<Recipe> => {
    const res = await api.get<RecipeDetailResponseDto>(POSTS_ENDPOINTS.DETAIL(idOrSlug), {
      silent: true,
    });
    if (res.data?.success && res.data.data) return recipeMapper.toModel(res.data.data);
    throw new Error('Phản hồi chi tiết công thức không đúng định dạng.');
  },

  /**
   * Tạo công thức mới
   */
  createRecipe: async (recipe: Partial<Recipe>): Promise<Recipe> => {
    const payload: CreateRecipeRequestDto = recipeMapper.toCreateDto(recipe);
    const res = await api.post<RecipeDetailResponseDto>(POSTS_ENDPOINTS.CREATE, payload);
    if (res.data?.success && res.data.data) return recipeMapper.toModel(res.data.data);
    throw new Error('Phản hồi tạo công thức không đúng định dạng.');
  },

  /**
   * Gửi revision DRAFT. Phản hồi cho biết trạng thái thật: `PUBLISHED` khi Contributor/Admin
   * tự xuất bản (đủ 6 chỉ số), ngược lại `PENDING_REVIEW`.
   * POST /api/v1/posts/:id/submit
   */
  submitRecipe: async (
    id: string,
    input: { revisionId: string; expectedVersion: number }
  ): Promise<Recipe> => {
    const res = await api.post<RecipeDetailResponseDto>(API_ENDPOINTS.CONTENT_REVIEW.SUBMIT(id), {
      revisionId: input.revisionId,
      expectedVersion: input.expectedVersion,
    });
    if (res.data?.success && res.data.data) {
      return recipeMapper.toModel(res.data.data);
    }
    throw new Error('Phản hồi gửi công thức không đúng định dạng.');
  },

  /**
   * Cập nhật công thức (backend yêu cầu `expectedVersion`)
   */
  updateRecipe: async (id: string, recipe: Partial<Recipe>): Promise<Recipe> => {
    const payload: UpdateRecipeRequestDto = recipeMapper.toUpdateDto(recipe);
    const res = await api.patch<RecipeDetailResponseDto>(POSTS_ENDPOINTS.UPDATE(id), payload);
    if (res.data?.success && res.data.data) return recipeMapper.toModel(res.data.data);
    throw new Error('Phản hồi cập nhật công thức không đúng định dạng.');
  },

  /**
   * Xóa mềm công thức (backend yêu cầu `?expectedVersion`)
   */
  deleteRecipe: async (id: string, expectedVersion?: number): Promise<void> => {
    await api.delete(POSTS_ENDPOINTS.DELETE(id), {
      params: expectedVersion !== undefined ? { expectedVersion } : undefined,
    });
  },
};
