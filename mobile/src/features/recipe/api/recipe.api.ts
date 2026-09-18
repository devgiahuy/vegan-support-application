import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { PostType } from '@/common/enums';
import { recipeMapper } from '../mappers/recipe.mapper';
import type { RecipeListResponseDto } from '../types/recipe.dto';
import type { RecipePaginationResult } from '../types/recipe.model';

export interface RecipeQueryParams {
  page?: number;
  limit?: number;
  /** UUID hoặc slug danh mục (backend `category`, strict — không gửi `categoryId`). */
  category?: string;
  difficulty?: string;
  q?: string;
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
};
