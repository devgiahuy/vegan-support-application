import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { getApiErrorStatus } from '@/lib/api-error';
import { recipeNutritionMapper } from '../mappers/recipe-nutrition.mapper';
import type {
  RecipeNutritionEstimateResponseDto,
  RecipeNutritionHistoryResponseDto,
  RecipeNutritionStatusResponseDto,
} from '../types/recipe-nutrition.dto';
import type {
  RecipeNutritionEstimate,
  RecipeNutritionHistoryResult,
  RecipeNutritionStatus,
} from '../types/recipe-nutrition.model';

/** Backend phục vụ ước tính qua nhà cung cấp AI nên cho phép chờ lâu hơn mặc định. */
const NUTRITION_TIMEOUT_MS = 45000;

export const recipeNutritionApi = {
  /** `GET /posts/:id/nutrition/current` — bản tính chính thức đã lưu gần nhất. */
  getCurrent: async (postId: string): Promise<RecipeNutritionEstimate> => {
    const res = await api.get<RecipeNutritionEstimateResponseDto>(API_ENDPOINTS.RECIPE_NUTRITION.CURRENT(postId), {
      silent: true,
    });
    return recipeNutritionMapper.toEstimateResponse(res.data);
  },

  /** `POST /posts/:id/nutrition/preview` — ước tính xác định, không lưu (công khai với công thức đã đăng). */
  preview: async (postId: string, useAiFallback = false): Promise<RecipeNutritionEstimate> => {
    const res = await api.post<RecipeNutritionEstimateResponseDto>(
      API_ENDPOINTS.RECIPE_NUTRITION.PREVIEW(postId),
      recipeNutritionMapper.toPreviewDto(useAiFallback),
      { silent: true, timeout: NUTRITION_TIMEOUT_MS }
    );
    return { ...recipeNutritionMapper.toEstimateResponse(res.data), isPreview: true };
  },

  /**
   * Lấy ước tính để hiển thị: ưu tiên bản đã lưu; nếu công thức chưa có (404/409) thì dùng `preview`
   * và đánh dấu `isPreview` để UI nói rõ đây là ước tính chưa lưu.
   */
  getForDisplay: async (postId: string): Promise<RecipeNutritionEstimate> => {
    try {
      return await recipeNutritionApi.getCurrent(postId);
    } catch (error) {
      const status = getApiErrorStatus(error);
      if (status === 404 || status === 409) return recipeNutritionApi.preview(postId, false);
      throw error;
    }
  },

  /** `GET /posts/:id/nutrition/status` — độ mới và trạng thái tác vụ AI (tác giả/Admin). */
  getStatus: async (postId: string): Promise<RecipeNutritionStatus> => {
    const res = await api.get<RecipeNutritionStatusResponseDto>(API_ENDPOINTS.RECIPE_NUTRITION.STATUS(postId), {
      silent: true,
    });
    return recipeNutritionMapper.toStatusResponse(res.data);
  },

  /** `GET /posts/:id/nutrition/history` — các phiên bản đã tính. */
  getHistory: async (postId: string, page = 1, limit = 10): Promise<RecipeNutritionHistoryResult> => {
    const res = await api.get<RecipeNutritionHistoryResponseDto>(API_ENDPOINTS.RECIPE_NUTRITION.HISTORY(postId), {
      params: { page, limit },
      silent: true,
    });
    return recipeNutritionMapper.toHistoryResponse(res.data);
  },

  /** `POST /posts/:id/nutrition/recalculate` — tính lại và lưu bản mới (tác giả/Admin). */
  recalculate: async (postId: string, useAiFallback: boolean, expectedPostVersion?: number): Promise<RecipeNutritionEstimate> => {
    const res = await api.post<RecipeNutritionEstimateResponseDto>(
      API_ENDPOINTS.RECIPE_NUTRITION.RECALCULATE(postId),
      recipeNutritionMapper.toRecalculateDto(useAiFallback, expectedPostVersion),
      { timeout: NUTRITION_TIMEOUT_MS }
    );
    return recipeNutritionMapper.toEstimateResponse(res.data);
  },
};
