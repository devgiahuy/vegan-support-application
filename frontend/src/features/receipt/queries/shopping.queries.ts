import { useQuery, useMutation, type UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { shoppingApi } from '../api/shopping.api';
import type { SelectedMealInput, ShoppingGapPreview } from '../types/shopping-gap.model';

export const SHOPPING_QUERY_KEYS = {
  all: ['shopping-lists'] as const,
  preview: (meals: SelectedMealInput[]) =>
    [
      ...SHOPPING_QUERY_KEYS.all,
      'preview',
      JSON.stringify(
        meals.map((m) => ({
          type: m.sourceType,
          id: m.recipeId || m.customMealId,
          servings: m.servings,
        }))
      ),
    ] as const,
};

/**
 * Hook truy vấn tính toán danh sách đi chợ thông minh dựa trên tủ bếp
 */
export function useShoppingGapPreviewQuery(
  meals: SelectedMealInput[],
  options?: Omit<
    UseQueryOptions<ShoppingGapPreview, Error, ShoppingGapPreview>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery({
    queryKey: SHOPPING_QUERY_KEYS.preview(meals),
    queryFn: () => shoppingApi.previewShoppingGaps(meals),
    enabled: meals.length > 0 && (options?.enabled ?? true),
    staleTime: 60 * 1000, // 1 phút
    ...options,
  });
}

/**
 * Mutation tính toán preview theo yêu cầu (khi người dùng thay đổi lựa chọn)
 */
export function usePreviewShoppingGapsMutation() {
  return useMutation<ShoppingGapPreview, Error, SelectedMealInput[]>({
    mutationFn: (meals) => shoppingApi.previewShoppingGaps(meals),
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Lỗi khi tính toán danh sách đi chợ thông minh';
      toast.error(message);
    },
  });
}
