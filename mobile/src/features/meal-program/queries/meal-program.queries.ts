import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mealProgramApi, type MealProgramQueryParams } from '../api/meal-program.api';
import type { CreateMealProgramInput } from '../types/meal-program.model';
import { useAuthStore } from '@/store/useAuthStore';

export const MEAL_PROGRAM_QUERY_KEYS = {
  all: ['meal-programs'] as const,
  list: (params?: MealProgramQueryParams) => [...MEAL_PROGRAM_QUERY_KEYS.all, 'list', params ?? {}] as const,
  detail: (id: string) => [...MEAL_PROGRAM_QUERY_KEYS.all, 'detail', id] as const,
};

export function useMealProgramsQuery(params?: MealProgramQueryParams) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: MEAL_PROGRAM_QUERY_KEYS.list(params),
    queryFn: () => mealProgramApi.list(params),
    enabled: isAuthenticated,
  });
}

export function useMealProgramDetailQuery(id: string) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: MEAL_PROGRAM_QUERY_KEYS.detail(id),
    queryFn: () => mealProgramApi.detail(id),
    enabled: isAuthenticated && id.length > 0,
  });
}

export function useCreateMealProgramMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMealProgramInput) => mealProgramApi.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MEAL_PROGRAM_QUERY_KEYS.all });
    },
  });
}

export function useConfirmMealProgramMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expectedVersion: number) => mealProgramApi.confirm(id, expectedVersion),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MEAL_PROGRAM_QUERY_KEYS.all });
    },
  });
}

