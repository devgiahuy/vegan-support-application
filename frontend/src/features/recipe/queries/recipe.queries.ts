import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage, toastApiError } from '@/lib/api-error';
import { PostStatus } from '@/common/enums';
import { reviewApi } from '@/features/review/api/review.api';
import { CONTENT_REVIEW_KEYS } from '@/features/review/queries/review.queries';
import { recipeApi, RecipeQueryParams } from '../api/recipe.api';
import type { Recipe } from '../types/recipe.model';
import { useAuthStore } from '@/store/useAuthStore';

export const RECIPE_QUERY_KEYS = {
  all: ['recipes'] as const,
  lists: () => [...RECIPE_QUERY_KEYS.all, 'list'] as const,
  list: (params?: RecipeQueryParams, userId?: string) =>
    [...RECIPE_QUERY_KEYS.lists(), userId ?? 'guest', params] as const,
  details: () => [...RECIPE_QUERY_KEYS.all, 'detail'] as const,
  detail: (idOrSlug: string) => [...RECIPE_QUERY_KEYS.details(), idOrSlug] as const,
};

/**
 * Hook truy vấn danh sách công thức nấu ăn
 */
export function useRecipesQuery(params?: RecipeQueryParams, options?: { enabled?: boolean }) {
  const userId = useAuthStore((state) => state.user?.id);
  return useQuery({
    queryKey: RECIPE_QUERY_KEYS.list(params, userId),
    queryFn: () => recipeApi.getRecipes(params),
    staleTime: 60 * 1000, // 1 phút
    enabled: options?.enabled ?? true,
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
 * Lưu xong nhưng gửi duyệt thất bại: công thức vẫn còn ở dạng bản nháp.
 * Mang theo bản đã lưu để trang điều hướng tới nơi có nút "Gửi kiểm duyệt".
 */
export class RecipeSubmitForReviewError extends Error {
  constructor(
    readonly recipe: Recipe,
    readonly reason: unknown
  ) {
    super(
      `Đã lưu bản nháp nhưng chưa gửi duyệt được: ${getApiErrorMessage(reason, 'vui lòng thử gửi lại.')}`
    );
    this.name = 'RecipeSubmitForReviewError';
  }
}

/** Backend luôn lưu revision mới ở dạng DRAFT; gửi duyệt ngay bằng `POST /posts/:id/submit`. */
async function submitSavedRecipe(saved: Recipe): Promise<Recipe> {
  const expectedVersion = saved.revisionVersion ?? saved.version;
  try {
    if (!saved.id || !saved.revisionId || expectedVersion === undefined) {
      throw new Error('Phản hồi lưu công thức thiếu thông tin phiên bản.');
    }
    await reviewApi.submitPost(saved.id, { revisionId: saved.revisionId, expectedVersion });
  } catch (err) {
    throw new RecipeSubmitForReviewError(saved, err);
  }
  return { ...saved, status: PostStatus.PENDING_REVIEW };
}

function useSaveAndSubmitCallbacks() {
  const queryClient = useQueryClient();
  return {
    onSuccess: (data: Recipe) => {
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: CONTENT_REVIEW_KEYS.all });
      toast.success('Đã gửi công thức để kiểm duyệt', {
        description: 'Ban biên tập sẽ duyệt trước khi công thức được xuất bản.',
      });
    },
    onError: (err: unknown, fallbackTitle: string) => {
      if (err instanceof RecipeSubmitForReviewError) {
        queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.detail(err.recipe.id) });
        toast.warning('Đã lưu bản nháp nhưng chưa gửi duyệt được', {
          description: getApiErrorMessage(err.reason, 'Vui lòng thử gửi lại.'),
        });
        return;
      }
      toastApiError(err, fallbackTitle, 'Vui lòng kiểm tra lại thông tin đã nhập.');
    },
  };
}

/**
 * Hook tạo công thức rồi gửi kiểm duyệt ngay (một thao tác với người dùng).
 */
export function useCreateAndSubmitRecipeMutation() {
  const callbacks = useSaveAndSubmitCallbacks();
  return useMutation({
    mutationFn: async (recipe: Partial<Recipe>) =>
      submitSavedRecipe(await recipeApi.createRecipe(recipe)),
    onSuccess: callbacks.onSuccess,
    onError: (err: unknown) => callbacks.onError(err, 'Không thể tạo công thức'),
  });
}

/**
 * Hook lưu bản sửa (tạo revision DRAFT mới) rồi gửi kiểm duyệt ngay.
 */
export function useUpdateAndSubmitRecipeMutation() {
  const callbacks = useSaveAndSubmitCallbacks();
  return useMutation({
    mutationFn: async ({ id, recipe }: { id: string; recipe: Partial<Recipe> }) =>
      submitSavedRecipe(await recipeApi.updateRecipe(id, recipe)),
    onSuccess: callbacks.onSuccess,
    onError: (err: unknown) => callbacks.onError(err, 'Lỗi cập nhật công thức'),
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
    onError: (err: unknown) => {
      toastApiError(err, 'Không thể xóa công thức');
    },
  });
}
