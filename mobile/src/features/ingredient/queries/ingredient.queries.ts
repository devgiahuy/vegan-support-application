import { useQuery } from '@tanstack/react-query';
import { ingredientApi, type IngredientSearchParams } from '../api/ingredient.api';

export const INGREDIENT_QUERY_KEYS = {
  all: ['ingredients'] as const,
  list: (params?: IngredientSearchParams) => [...INGREDIENT_QUERY_KEYS.all, 'list', params] as const,
};

export const useIngredientsQuery = (params?: IngredientSearchParams) => {
  return useQuery({
    queryKey: INGREDIENT_QUERY_KEYS.list(params),
    queryFn: () => ingredientApi.searchIngredients(params),
    staleTime: 60 * 1000,
  });
};
