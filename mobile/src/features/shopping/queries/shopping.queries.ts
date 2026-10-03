import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { shoppingApi } from '../api/shopping.api';
import type { SelectedShoppingMeal } from '../types/shopping.model';
export const SHOPPING_QUERY_KEYS = {
  all: ['shopping-preview'] as const,
  preview: (meals: SelectedShoppingMeal[] | null) => ['shopping-preview', meals] as const,
};
export function useShoppingPreviewQuery(meals: SelectedShoppingMeal[] | null) {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: SHOPPING_QUERY_KEYS.preview(meals),
    queryFn: () => shoppingApi.preview(meals ?? []),
    enabled: authenticated && Boolean(meals?.length),
    staleTime: 0,
  });
}
