import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customMealApi, type CustomMealQueryParams } from '../api/custom-meal.api';
import type { CreateCustomMealRequestDto, UpdateCustomMealRequestDto } from '../types/custom-meal.dto';
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

export function useCustomMealDetailQuery(id: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: CUSTOM_MEAL_QUERY_KEYS.detail(id),
    queryFn: () => customMealApi.detail(id),
    enabled: isAuthenticated && id.length > 0,
  });
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

