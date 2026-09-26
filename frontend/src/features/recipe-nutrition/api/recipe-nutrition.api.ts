import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { recipeNutritionMapper } from '../mappers/recipe-nutrition.mapper';
import type {
  RecipeNutritionEstimateResponseDto,
  RecipeNutritionStatusResponseDto,
  RecipeNutritionHistoryResponseDto,
  RecipeNutritionPreviewRequestDto,
  RecipeNutritionRecalculateRequestDto,
} from '../types/recipe-nutrition.dto';
import type {
  RecipeNutritionEstimateModel,
  RecipeNutritionStatusModel,
  RecipeNutritionHistoryItemModel,
} from '../types/recipe-nutrition.model';

export const recipeNutritionApi = {
  /**
   * Lấy dữ liệu dinh dưỡng hiện hành đã lưu của công thức
   */
  getCurrentNutrition: async (postId: string): Promise<RecipeNutritionEstimateModel> => {
    const res = await api.get<RecipeNutritionEstimateResponseDto>(
      API_ENDPOINTS.RECIPE_NUTRITION.CURRENT(postId),
      { silent: true }
    );
    if (res.data?.success && res.data.data) {
      return recipeNutritionMapper.toModel(res.data.data);
    }
    throw new Error('Dữ liệu dinh dưỡng hiện hành không đúng định dạng.');
  },

  /**
   * Kiểm tra trạng thái hiệu lực (tươi mới / stale) và tác vụ AI gần nhất
   */
  getNutritionStatus: async (postId: string): Promise<RecipeNutritionStatusModel> => {
    const res = await api.get<RecipeNutritionStatusResponseDto>(
      API_ENDPOINTS.RECIPE_NUTRITION.STATUS(postId),
      { silent: true }
    );
    if (res.data?.success && res.data.data) {
      return recipeNutritionMapper.toStatusModel(res.data.data);
    }
    throw new Error('Dữ liệu trạng thái dinh dưỡng không đúng định dạng.');
  },

  /**
   * Lấy lịch sử các lần tính toán dinh dưỡng của công thức
   */
  getNutritionHistory: async (
    postId: string,
    page = 1,
    limit = 10
  ): Promise<{
    items: RecipeNutritionHistoryItemModel[];
    total: number;
    totalPages: number;
  }> => {
    const res = await api.get<RecipeNutritionHistoryResponseDto>(
      API_ENDPOINTS.RECIPE_NUTRITION.HISTORY(postId),
      {
        params: { page, limit },
        silent: true,
      }
    );
    if (res.data?.success && Array.isArray(res.data.data)) {
      return {
        items: recipeNutritionMapper.toHistoryList(res.data.data),
        total: res.data.meta?.total ?? res.data.data.length,
        totalPages: res.data.meta?.totalPages ?? 1,
      };
    }
    throw new Error('Dữ liệu lịch sử dinh dưỡng không đúng định dạng.');
  },

  /**
   * Xem trước kết quả tính toán dinh dưỡng mà không lưu vào DB
   */
  previewNutrition: async (
    postId: string,
    payload: RecipeNutritionPreviewRequestDto = { useAiFallback: false }
  ): Promise<RecipeNutritionEstimateModel> => {
    const res = await api.post<RecipeNutritionEstimateResponseDto>(
      API_ENDPOINTS.RECIPE_NUTRITION.PREVIEW(postId),
      payload
    );
    if (res.data?.success && res.data.data) {
      return recipeNutritionMapper.toModel(res.data.data);
    }
    throw new Error('Kết quả xem trước dinh dưỡng không đúng định dạng.');
  },

  /**
   * Tính toán lại và lưu bản ghi dinh dưỡng chính thức
   */
  recalculateNutrition: async (
    postId: string,
    payload: RecipeNutritionRecalculateRequestDto = { useAiFallback: true }
  ): Promise<RecipeNutritionEstimateModel> => {
    const res = await api.post<RecipeNutritionEstimateResponseDto>(
      API_ENDPOINTS.RECIPE_NUTRITION.RECALCULATE(postId),
      payload
    );
    if (res.data?.success && res.data.data) {
      return recipeNutritionMapper.toModel(res.data.data);
    }
    throw new Error('Kết quả tính toán lại dinh dưỡng không đúng định dạng.');
  },
};
