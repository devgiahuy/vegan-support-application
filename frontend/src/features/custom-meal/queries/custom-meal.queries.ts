import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customMealApi, type CustomMealQueryParams } from '../api/custom-meal.api';
import type {
  CreateCustomMealRequestDto,
  UpdateCustomMealRequestDto,
} from '../types/custom-meal.dto';
import type { CustomMeal, CustomMealListResult, CustomMealPhoto } from '../types/custom-meal.model';
import { STORAGE_KEYS } from '@/features/storage/queries/storage.queries';

export const CUSTOM_MEAL_KEYS = {
  all: ['custom-meals'] as const,
  lists: () => [...CUSTOM_MEAL_KEYS.all, 'list'] as const,
  list: (params?: CustomMealQueryParams) => [...CUSTOM_MEAL_KEYS.lists(), params] as const,
  details: () => [...CUSTOM_MEAL_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CUSTOM_MEAL_KEYS.details(), id] as const,
};

/**
 * Hook truy vấn danh sách món ăn cá nhân (Owner-scoped)
 */
export const useCustomMealsQuery = (params?: CustomMealQueryParams, enabled = true) => {
  return useQuery<CustomMealListResult>({
    queryKey: CUSTOM_MEAL_KEYS.list(params),
    queryFn: () => customMealApi.getCustomMeals(params),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 phút
  });
};

/**
 * Hook truy vấn chi tiết món ăn cá nhân
 */
export const useCustomMealDetailQuery = (id: string, enabled = true) => {
  return useQuery<CustomMeal>({
    queryKey: CUSTOM_MEAL_KEYS.detail(id),
    queryFn: () => customMealApi.getCustomMealDetail(id),
    enabled: Boolean(id) && enabled,
    staleTime: 2 * 60 * 1000,
  });
};

/**
 * Mutation tạo mới món ăn cá nhân
 */
export const useCreateCustomMealMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<CustomMeal, Error, CreateCustomMealRequestDto>({
    mutationFn: (data) => customMealApi.createCustomMeal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_MEAL_KEYS.lists() });
    },
  });
};

/**
 * Mutation cập nhật món ăn cá nhân
 */
export const useUpdateCustomMealMutation = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation<CustomMeal, Error, UpdateCustomMealRequestDto>({
    mutationFn: (data) => customMealApi.updateCustomMeal(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(CUSTOM_MEAL_KEYS.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: CUSTOM_MEAL_KEYS.lists() });
    },
  });
};

/**
 * Mutation xóa món ăn cá nhân
 */
export const useDeleteCustomMealMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => customMealApi.deleteCustomMeal(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: CUSTOM_MEAL_KEYS.detail(deletedId) });
      queryClient.invalidateQueries({ queryKey: CUSTOM_MEAL_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: STORAGE_KEYS.me() });
    },
  });
};

/**
 * Mutation đính kèm hình ảnh cho món ăn cá nhân
 */
export const useAttachCustomMealMediaMutation = (mealId: string) => {
  const queryClient = useQueryClient();

  return useMutation<CustomMealPhoto, Error, { file: File; isCover?: boolean }>({
    mutationFn: ({ file, isCover }) => customMealApi.attachCustomMealMedia(mealId, file, isCover),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_MEAL_KEYS.detail(mealId) });
      queryClient.invalidateQueries({ queryKey: CUSTOM_MEAL_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: STORAGE_KEYS.me() });
    },
  });
};

/**
 * Mutation xóa ảnh khỏi món ăn cá nhân
 */
export const useDeleteCustomMealMediaMutation = (mealId: string) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (photoId) => customMealApi.deleteCustomMealMedia(mealId, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CUSTOM_MEAL_KEYS.detail(mealId) });
      queryClient.invalidateQueries({ queryKey: CUSTOM_MEAL_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: STORAGE_KEYS.me() });
    },
  });
};
