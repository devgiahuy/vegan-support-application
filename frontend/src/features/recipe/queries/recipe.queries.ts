import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { recipeApi, RecipeQueryParams } from '../api/recipe.api';
import type { Recipe } from '../types/recipe.model';

export const RECIPE_QUERY_KEYS = {
  all: ['recipes'] as const,
  lists: () => [...RECIPE_QUERY_KEYS.all, 'list'] as const,
  list: (params?: RecipeQueryParams) => [...RECIPE_QUERY_KEYS.lists(), params] as const,
  details: () => [...RECIPE_QUERY_KEYS.all, 'detail'] as const,
  detail: (idOrSlug: string) => [...RECIPE_QUERY_KEYS.details(), idOrSlug] as const,
};

/**
 * Hook truy vấn danh sách công thức nấu ăn
 */
export function useRecipesQuery(params?: RecipeQueryParams) {
  return useQuery({
    queryKey: RECIPE_QUERY_KEYS.list(params),
    queryFn: () => recipeApi.getRecipes(params),
    staleTime: 60 * 1000, // 1 phút
  });
}

/**
 * Hook truy vấn chi tiết một công thức nấu ăn
 */
export function useRecipeDetailQuery(idOrSlug: string) {
  return useQuery({
    queryKey: RECIPE_QUERY_KEYS.detail(idOrSlug),
    queryFn: () => recipeApi.getRecipeDetail(idOrSlug),
    enabled: Boolean(idOrSlug),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook tạo mới công thức
 */
export function useCreateRecipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipe: Partial<Recipe>) => recipeApi.createRecipe(recipe),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.lists() });
      toast.success('Đã gửi công thức thành công!', {
        description:
          data.status === 'PUBLISHED'
            ? 'Công thức của bạn đã được xuất bản công khai.'
            : 'Công thức đã vào hàng đợi chờ duyệt từ chuyên gia.',
      });
    },
    onError: (err: Error) => {
      toast.error('Không thể tạo công thức', {
        description: err.message || 'Vui lòng kiểm tra lại thông tin đã nhập.',
      });
    },
  });
}

/**
 * Hook cập nhật công thức
 */
export function useUpdateRecipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, recipe }: { id: string; recipe: Partial<Recipe> }) =>
      recipeApi.updateRecipe(id, recipe),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.lists() });
      toast.success('Đã cập nhật công thức!');
    },
    onError: (err: Error) => {
      toast.error('Lỗi cập nhật công thức', {
        description: err.message,
      });
    },
  });
}

/**
 * Hook xóa mềm công thức (backend yêu cầu `expectedVersion`)
 */
export function useDeleteRecipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, expectedVersion }: { id: string; expectedVersion?: number }) =>
      recipeApi.deleteRecipe(id, expectedVersion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.lists() });
      toast.success('Đã xóa công thức thành công.');
    },
    onError: (err: Error) => {
      toast.error('Không thể xóa công thức', {
        description: err.message,
      });
    },
  });
}
