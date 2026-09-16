import { useQuery } from '@tanstack/react-query';
import { ingredientApi, type IngredientSearchParams } from '../api/ingredient.api';

export const INGREDIENT_QUERY_KEYS = {
  all: ['ingredients'] as const,
  list: (params?: IngredientSearchParams) =>
    [...INGREDIENT_QUERY_KEYS.all, 'list', params] as const,
  resolve: (query: string) => [...INGREDIENT_QUERY_KEYS.all, 'resolve', query] as const,
};

export const useIngredientsQuery = (params?: IngredientSearchParams) => {
  return useQuery({
    queryKey: INGREDIENT_QUERY_KEYS.list(params),
    queryFn: () => ingredientApi.searchIngredients(params),
  });
};

export const useIngredientResolveQuery = (query: string, enabled = true) => {
  const trimmed = query.trim();
  return useQuery({
    queryKey: INGREDIENT_QUERY_KEYS.resolve(trimmed),
    queryFn: () => ingredientApi.resolveIngredient(trimmed),
    enabled: enabled && trimmed.length >= 2,
  });
};
