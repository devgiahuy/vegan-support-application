import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { recipeNutritionApi } from '../api/recipe-nutrition.api';
import type {
  RecipeNutritionPreviewRequestDto,
  RecipeNutritionRecalculateRequestDto,
} from '../types/recipe-nutrition.dto';

export const RECIPE_NUTRITION_KEYS = {
  all: ['recipe-nutrition'] as const,
  detail: (postId: string) => [...RECIPE_NUTRITION_KEYS.all, 'detail', postId] as const,
  status: (postId: string) => [...RECIPE_NUTRITION_KEYS.all, 'status', postId] as const,
  history: (postId: string, page = 1, limit = 10) =>
    [...RECIPE_NUTRITION_KEYS.all, 'history', postId, { page, limit }] as const,
};

/**
 * Query lấy dữ liệu dinh dưỡng hiện hành của bài viết/công thức
 */
export function useRecipeNutritionQuery(postId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: RECIPE_NUTRITION_KEYS.detail(postId),
    queryFn: () => recipeNutritionApi.getCurrentNutrition(postId),
    enabled: Boolean(postId) && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 phút
    retry: 1,
  });
}

/**
 * Query kiểm tra trạng thái hiệu lực (stale) và tác vụ AI gần nhất
 */
export function useRecipeNutritionStatusQuery(postId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: RECIPE_NUTRITION_KEYS.status(postId),
    queryFn: () => recipeNutritionApi.getNutritionStatus(postId),
    enabled: Boolean(postId) && (options?.enabled ?? true),
    staleTime: 30 * 1000, // 30 giây để cập nhật nhanh
    retry: 1,
  });
}

/**
 * Query lấy lịch sử tính toán dinh dưỡng của công thức
 */
export function useRecipeNutritionHistoryQuery(
  postId: string,
  page = 1,
  limit = 10,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: RECIPE_NUTRITION_KEYS.history(postId, page, limit),
    queryFn: () => recipeNutritionApi.getNutritionHistory(postId, page, limit),
    enabled: Boolean(postId) && (options?.enabled ?? true),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Mutation xem trước kết quả tính toán dinh dưỡng (không lưu DB)
 */
export function usePreviewNutritionMutation(postId: string) {
  return useMutation({
    mutationFn: (payload?: RecipeNutritionPreviewRequestDto) =>
      recipeNutritionApi.previewNutrition(postId, payload),
    onError: (error: Error) => {
      toast.error('Không thể xem trước dinh dưỡng', {
        description: error.message || 'Vui lòng kiểm tra lại nguyên liệu và số khẩu phần ăn.',
      });
    },
  });
}

/**
 * Mutation tính toán lại và lưu bản ghi dinh dưỡng chính thức
 */
export function useRecalculateNutritionMutation(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: RecipeNutritionRecalculateRequestDto) =>
      recipeNutritionApi.recalculateNutrition(postId, payload),
    onSuccess: () => {
      toast.success('Tính toán dinh dưỡng thành công!', {
        description: 'Bản ghi dinh dưỡng chính thức của công thức đã được cập nhật mới nhất.',
      });
      // Invalidate các query liên quan để cập nhật giao diện ngay lập tức
      queryClient.invalidateQueries({ queryKey: RECIPE_NUTRITION_KEYS.detail(postId) });
      queryClient.invalidateQueries({ queryKey: RECIPE_NUTRITION_KEYS.status(postId) });
      queryClient.invalidateQueries({ queryKey: RECIPE_NUTRITION_KEYS.history(postId) });
    },
    onError: (error: Error) => {
      toast.error('Tính toán lại dinh dưỡng thất bại', {
        description: error.message || 'Đã có lỗi xảy ra trong quá trình tính toán.',
      });
    },
  });
}
