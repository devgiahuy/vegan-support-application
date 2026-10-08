import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customMealApi, type CustomMealQueryParams } from '../api/custom-meal.api';
import type { CreateCustomMealRequestDto, UpdateCustomMealRequestDto } from '../types/custom-meal.dto';
import type { CustomMeal } from '../types/custom-meal.model';
import { useAuthStore } from '@/store/useAuthStore';

export const CUSTOM_MEAL_QUERY_KEYS = {
  all: ['custom-meals'] as const,
  list: (params?: CustomMealQueryParams) => [...CUSTOM_MEAL_QUERY_KEYS.all, 'list', params ?? {}] as const,
  detail: (id: string) => [...CUSTOM_MEAL_QUERY_KEYS.all, 'detail', id] as const,
};

export function useCustomMealsQuery(params?: CustomMealQueryParams) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: CUSTOM_MEAL_QUERY_KEYS.list(params),
    queryFn: () => customMealApi.list(params),
    enabled: isAuthenticated,
  });
}

/** Danh sách món riêng phân trang kiểu "Tải thêm". `params` không chứa `page`. */
export function useInfiniteCustomMealsQuery(params?: Omit<CustomMealQueryParams, 'page'>) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useInfiniteQuery({
    queryKey: [...CUSTOM_MEAL_QUERY_KEYS.all, 'infinite', params ?? {}] as const,
    queryFn: ({ pageParam }) => customMealApi.list({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages ? lastPage.pagination.page + 1 : undefined,
    enabled: isAuthenticated,
  });
}

export function useCustomMealDetailQuery(id: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: CUSTOM_MEAL_QUERY_KEYS.detail(id),
    queryFn: () => customMealApi.detail(id),
    enabled: isAuthenticated && id.length > 0,
  });
}

/** Ba thao tác ảnh đều trả về món đã cập nhật nên ghi thẳng vào cache chi tiết và làm mới danh sách (ảnh bìa). */
function usePhotoMutation<TVariables>(id: string, run: (variables: TVariables) => Promise<CustomMeal>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: (meal) => {
      queryClient.setQueryData(CUSTOM_MEAL_QUERY_KEYS.detail(id), meal);
      void queryClient.invalidateQueries({ queryKey: [...CUSTOM_MEAL_QUERY_KEYS.all, 'list'] });
      void queryClient.invalidateQueries({ queryKey: [...CUSTOM_MEAL_QUERY_KEYS.all, 'infinite'] });
    },
  });
}

export function useAttachCustomMealPhotoMutation(id: string) {
  return usePhotoMutation(id, (vars: { assetId: string; position: number }) =>
    customMealApi.attachPhoto(id, vars.assetId, vars.position)
  );
}

export function useRemoveCustomMealPhotoMutation(id: string) {
  return usePhotoMutation(id, (assetId: string) => customMealApi.removePhoto(id, assetId));
}

export function useReorderCustomMealPhotosMutation(id: string) {
  return usePhotoMutation(id, (orderedAssetIds: string[]) => customMealApi.reorderPhotos(id, orderedAssetIds));
}

export function useCreateCustomMealMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCustomMealRequestDto) => customMealApi.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CUSTOM_MEAL_QUERY_KEYS.all });
    },
  });
}

export function useUpdateCustomMealMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCustomMealRequestDto) => customMealApi.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CUSTOM_MEAL_QUERY_KEYS.all });
    },
  });
}

export function useDeleteCustomMealMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customMealApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CUSTOM_MEAL_QUERY_KEYS.all });
    },
  });
}

