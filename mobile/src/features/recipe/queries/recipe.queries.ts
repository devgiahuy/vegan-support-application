import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getNextPageNumber } from '@/lib/pagination';
import {
  recipeApi,
  type CreateRecipeInput,
  type RecipeQueryParams,
  type UpdateRecipeInput,
} from '../api/recipe.api';

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

/** Danh sách công thức phân trang kiểu "Tải thêm" (màn Khám phá món). `params` không chứa `page`. */
export const useInfiniteRecipesQuery = (params?: Omit<RecipeQueryParams, 'page'>) => {
  return useInfiniteQuery({
    queryKey: [...RECIPE_QUERY_KEYS.all, 'infinite', params ?? {}] as const,
    queryFn: ({ pageParam }) => recipeApi.getRecipes({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: getNextPageNumber,
  });
};

export const useRecipeDetailQuery = (idOrSlug: string) => {
  return useQuery({
    queryKey: RECIPE_QUERY_KEYS.detail(idOrSlug),
    queryFn: () => recipeApi.getRecipeDetail(idOrSlug),
    enabled: idOrSlug.length > 0,
  });
};

export const useRelatedRecipesQuery = (id: string) => {
  return useQuery({
    queryKey: [...RECIPE_QUERY_KEYS.all, 'related', id] as const,
    queryFn: () => recipeApi.getRelatedRecipes(id),
    enabled: id.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateRecipeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRecipeInput) => recipeApi.createRecipe(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });
    },
  });
};

export const useUpdateRecipeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; input: UpdateRecipeInput }) => recipeApi.updateRecipe(vars.id, vars.input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });
    },
  });
};
