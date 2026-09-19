import { useQuery } from '@tanstack/react-query';
import { recipeApi, type RecipeQueryParams } from '../api/recipe.api';

export const RECIPE_QUERY_KEYS = {
  all: ['recipes'] as const,
  list: (params?: RecipeQueryParams) => [...RECIPE_QUERY_KEYS.all, 'list', params] as const,
  detail: (idOrSlug: string) => [...RECIPE_QUERY_KEYS.all, 'detail', idOrSlug] as const,
};

export const useRecipesQuery = (params?: RecipeQueryParams) => {
  return useQuery({
    queryKey: RECIPE_QUERY_KEYS.list(params),
    queryFn: () => recipeApi.getRecipes(params),
  });
};

export const useRecipeDetailQuery = (idOrSlug: string) => {
  return useQuery({
    queryKey: RECIPE_QUERY_KEYS.detail(idOrSlug),
    queryFn: () => recipeApi.getRecipeDetail(idOrSlug),
    enabled: idOrSlug.length > 0,
  });
};
