import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recipeNutritionApi } from '../api/recipe-nutrition.api';

export const RECIPE_NUTRITION_KEYS = {
  all: ['recipe-nutrition'] as const,
  detail: (postId: string) => [...RECIPE_NUTRITION_KEYS.all, 'detail', postId] as const,
  status: (postId: string) => [...RECIPE_NUTRITION_KEYS.all, 'status', postId] as const,
  history: (postId: string, page: number, limit: number) =>
    [...RECIPE_NUTRITION_KEYS.all, 'history', postId, { page, limit }] as const,
};

/** Ước tính dinh dưỡng để hiển thị (bản đã lưu, hoặc `preview` khi chưa có bản lưu). */
export function useRecipeNutritionQuery(postId: string) {
  return useQuery({
    queryKey: RECIPE_NUTRITION_KEYS.detail(postId),
    queryFn: () => recipeNutritionApi.getForDisplay(postId),
    enabled: postId.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

/** Độ mới của ước tính và tác vụ AI gần nhất — chỉ tác giả/Admin được gọi. */
export function useRecipeNutritionStatusQuery(postId: string, enabled: boolean) {
  return useQuery({
    queryKey: RECIPE_NUTRITION_KEYS.status(postId),
    queryFn: () => recipeNutritionApi.getStatus(postId),
    enabled: enabled && postId.length > 0,
    staleTime: 30 * 1000,
    retry: false,
  });
}

/** Lịch sử các lần tính; chỉ gọi khi người dùng mở hộp lịch sử. */
export function useRecipeNutritionHistoryQuery(postId: string, enabled: boolean, page = 1, limit = 10) {
  return useQuery({
    queryKey: RECIPE_NUTRITION_KEYS.history(postId, page, limit),
    queryFn: () => recipeNutritionApi.getHistory(postId, page, limit),
    enabled: enabled && postId.length > 0,
    staleTime: 2 * 60 * 1000,
  });
}

/** Tính lại và lưu bản chính thức mới. */
export function useRecalculateNutritionMutation(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { useAiFallback: boolean; expectedPostVersion?: number }) =>
      recipeNutritionApi.recalculate(postId, vars.useAiFallback, vars.expectedPostVersion),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RECIPE_NUTRITION_KEYS.all });
    },
  });
}
