import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { PostType } from '@/common/enums';
import { PaginationResult } from '@/types/api';
import { recipeMapper } from '../mappers/recipe.mapper';
import { shouldFallbackToFixtures, createNotFoundError } from '@/features/post/utils/api-fallback';
import { MOCK_RECIPE_DTOS } from '../__fixtures__/recipe-fixtures';
import type {
  RecipeDetailDto,
  RecipeListResponseDto,
  RecipeDetailResponseDto,
  CreateRecipeRequestDto,
  UpdateRecipeRequestDto,
} from '../types/recipe.dto';
import type { Recipe, RecipePaginationResult } from '../types/recipe.model';

export interface RecipeQueryParams {
  page?: number;
  limit?: number;
  /** UUID hoặc slug danh mục (backend `category`, strict — không gửi `categoryId`). */
  category?: string;
  difficulty?: string;
  q?: string;
}

function matchesCategory(dto: RecipeDetailDto, category?: string): boolean {
  if (!category) return true;
  return (dto.categories || []).some((c) => c.id === category || c.slug === category);
}

function matchesQuery(dto: RecipeDetailDto, q?: string): boolean {
  if (!q) return true;
  const query = q.toLowerCase();
  const title = dto.revision?.title?.toLowerCase() || '';
  const slug = dto.slug?.toLowerCase() || '';
  return title.includes(query) || slug.includes(query);
}

export const recipeApi = {
  /**
   * Lấy danh sách công thức nấu ăn (hỗ trợ phân trang, lọc danh mục, độ khó, từ khóa)
   */
  getRecipes: async (params?: RecipeQueryParams): Promise<RecipePaginationResult> => {
    try {
      const res = await api.get<RecipeListResponseDto>(API_ENDPOINTS.POSTS.LIST, {
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
    } catch (err) {
      // Endpoint còn PLANNED (lỗi mạng / route 404 / 5xx) → fixture demo.
      // Lỗi nghiệp vụ 4xx → ném tiếp cho UI xử lý.
      if (!shouldFallbackToFixtures(err, 'list')) throw err;
    }

    // Dữ liệu mẫu cục bộ đạt chuẩn
    let filtered = MOCK_RECIPE_DTOS.filter(
      (r) => matchesCategory(r, params?.category) && matchesQuery(r, params?.q)
    );
    if (params?.difficulty) {
      filtered = filtered.filter((r) => r.recipe?.difficulty === params.difficulty);
    }

    return recipeMapper.toPaginationFromEnvelope(filtered, {
      page: params?.page || 1,
      limit: params?.limit || 20,
      total: filtered.length,
      totalPages: 1,
    });
  },

  /**
   * Lấy chi tiết công thức nấu ăn theo id hoặc slug
   */
  getRecipeDetail: async (idOrSlug: string): Promise<Recipe> => {
    try {
      const res = await api.get<RecipeDetailResponseDto>(API_ENDPOINTS.POSTS.DETAIL(idOrSlug), {
        silent: true,
      });

      if (res.data?.success && res.data.data) {
        return recipeMapper.toModel(res.data.data);
      }
      throw new Error('Phản hồi chi tiết công thức không đúng định dạng.');
    } catch (err) {
      // 404 từ backend hoặc lỗi nghiệp vụ 4xx → ném tiếp để trang [id] hiện 404.
      if (!shouldFallbackToFixtures(err, 'detail')) throw err;
    }

    const found = MOCK_RECIPE_DTOS.find((r) => r.id === idOrSlug || r.slug === idOrSlug);
    if (found) {
      return recipeMapper.toModel(found);
    }

    // Không có trong fixture: báo 404 thật thay vì trả công thức giả.
    throw createNotFoundError({ resourceLabel: 'Công thức' });
  },

  /**
   * Tạo công thức mới
   */
  createRecipe: async (recipe: Partial<Recipe>): Promise<Recipe> => {
    const payload: CreateRecipeRequestDto = recipeMapper.toCreateDto(recipe);
    try {
      const res = await api.post<RecipeDetailResponseDto>(API_ENDPOINTS.POSTS.CREATE, payload);
      if (res.data?.success && res.data.data) {
        return recipeMapper.toModel(res.data.data);
      }
      throw new Error('Phản hồi tạo công thức không đúng định dạng.');
    } catch (err) {
      // Lỗi nghiệp vụ 4xx (validation, quyền...) → ném tiếp để form hiện lỗi thật.
      if (!shouldFallbackToFixtures(err, 'mutation')) throw err;
    }

    return recipeMapper.toModel({
      ...MOCK_RECIPE_DTOS[0],
      revision: {
        ...MOCK_RECIPE_DTOS[0].revision,
        title: recipe.title || 'Công thức mới',
      },
    });
  },

  /**
   * Cập nhật công thức (backend yêu cầu `expectedVersion`)
   */
  updateRecipe: async (id: string, recipe: Partial<Recipe>): Promise<Recipe> => {
    const payload: UpdateRecipeRequestDto = recipeMapper.toUpdateDto(recipe);
    try {
      const res = await api.patch<RecipeDetailResponseDto>(API_ENDPOINTS.POSTS.UPDATE(id), payload);
      if (res.data?.success && res.data.data) {
        return recipeMapper.toModel(res.data.data);
      }
      throw new Error('Phản hồi cập nhật công thức không đúng định dạng.');
    } catch (err) {
      if (!shouldFallbackToFixtures(err, 'mutation')) throw err;
    }

    return recipeMapper.toModel(MOCK_RECIPE_DTOS[0]);
  },

  /**
   * Xóa mềm công thức (backend yêu cầu `?expectedVersion`)
   */
  deleteRecipe: async (id: string, expectedVersion?: number): Promise<void> => {
    try {
      await api.delete(API_ENDPOINTS.POSTS.DELETE(id), {
        params: expectedVersion !== undefined ? { expectedVersion } : undefined,
      });
    } catch (err) {
      // 403/401 khi đã có API thật → ném tiếp để toast báo quyền, không im lặng.
      if (!shouldFallbackToFixtures(err, 'mutation')) throw err;
    }
  },
};
