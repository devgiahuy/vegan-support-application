import { useQuery } from '@tanstack/react-query';
import { ingredientApi, type IngredientSearchParams } from '../api/ingredient.api';

export const INGREDIENT_QUERY_KEYS = {
  all: ['ingredients'] as const,
  resolve: (query: string) => [...INGREDIENT_QUERY_KEYS.all, 'resolve', query] as const,
  list: (params?: IngredientSearchParams) => [...INGREDIENT_QUERY_KEYS.all, 'list', params] as const,
};

export const useIngredientsQuery = (params?: IngredientSearchParams, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: INGREDIENT_QUERY_KEYS.list(params),
    queryFn: () => ingredientApi.searchIngredients(params),
    staleTime: 60 * 1000,
    enabled: options?.enabled ?? true,
  });
};

/** Phân giải tên nguyên liệu; chỉ gọi khi từ khóa đủ dài. */
export const useIngredientResolveQuery = (query: string) => {
  return useQuery({
    queryKey: INGREDIENT_QUERY_KEYS.resolve(query),
    queryFn: () => ingredientApi.resolveIngredient(query),
    staleTime: 60 * 1000,
    enabled: query.length >= 2,
  });
};
