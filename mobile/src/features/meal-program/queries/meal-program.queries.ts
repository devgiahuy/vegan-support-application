import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mealProgramApi, type MealProgramQueryParams } from '../api/meal-program.api';
import type { CreateMealProgramInput, MealProgramAction } from '../types/meal-program.model';
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

/** Danh sách lộ trình phân trang kiểu "Tải thêm". `params` không chứa `page`. */
export function useInfiniteMealProgramsQuery(params?: Omit<MealProgramQueryParams, 'page'>) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useInfiniteQuery({
    queryKey: [...MEAL_PROGRAM_QUERY_KEYS.all, 'infinite', params ?? {}] as const,
    queryFn: ({ pageParam }) => mealProgramApi.list({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages ? lastPage.pagination.page + 1 : undefined,
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

/** Mọi hành động sửa lộ trình đều đi qua một mutation; thành công thì cập nhật chi tiết tại chỗ. */
export function useUpdateMealProgramMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { action: MealProgramAction; expectedVersion: number }) =>
      mealProgramApi.update(id, vars.action, vars.expectedVersion),
    onSuccess: (program) => {
      queryClient.setQueryData(MEAL_PROGRAM_QUERY_KEYS.detail(id), program);
      void queryClient.invalidateQueries({ queryKey: [...MEAL_PROGRAM_QUERY_KEYS.all, 'list'] });
    },
  });
}
