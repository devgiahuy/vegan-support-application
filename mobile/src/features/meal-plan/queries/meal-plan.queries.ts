import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mealPlanApi } from '../api/meal-plan.api';
import type { GenerateMealPlanInput, ManualAddMealInput, MealPlanListQueryParams } from '../types/meal-plan.model';

export const MEAL_PLAN_QUERY_KEYS = {
  all: ['meal-plans'] as const,
  list: (params?: MealPlanListQueryParams) => [...MEAL_PLAN_QUERY_KEYS.all, 'list', params ?? {}] as const,
  detail: (id: string) => [...MEAL_PLAN_QUERY_KEYS.all, 'detail', id] as const,
};

export function useMealPlansQuery(params?: MealPlanListQueryParams, enabled = true) {
  return useQuery({
    queryKey: MEAL_PLAN_QUERY_KEYS.list(params),
    queryFn: () => mealPlanApi.getPlans(params),
    staleTime: 60 * 1000,
    enabled,
  });
}

/** Lịch sử thực đơn phân trang kiểu "Tải thêm" (màn Thực đơn đã lưu). */
export function useInfiniteMealPlansQuery(limit = 10, enabled = true) {
  return useInfiniteQuery({
    queryKey: [...MEAL_PLAN_QUERY_KEYS.all, 'infinite', limit] as const,
    queryFn: ({ pageParam }) => mealPlanApi.getPlans({ page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.metadata.hasNextPage ? lastPage.metadata.page + 1 : undefined),
    staleTime: 60 * 1000,
    enabled,
  });
}

export function useMealPlanDetailQuery(id: string, enabled = true) {
  return useQuery({
    queryKey: MEAL_PLAN_QUERY_KEYS.detail(id),
    queryFn: () => mealPlanApi.getPlanDetail(id),
    staleTime: 60 * 1000,
    enabled: enabled && id.length > 0,
  });
}

export function useGenerateMealPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GenerateMealPlanInput) => mealPlanApi.generate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_QUERY_KEYS.all });
    },
  });
}

export function useSwapMealItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: {
      planId: string;
      itemId: string;
      expectedVersion: number;
      idempotencyKey: string;
    }) => mealPlanApi.swapItem(vars.planId, vars.itemId, vars.expectedVersion, vars.idempotencyKey),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_QUERY_KEYS.all });
      queryClient.setQueryData(MEAL_PLAN_QUERY_KEYS.detail(plan.id), plan);
      queryClient.invalidateQueries({ queryKey: ['meal-analysis'] });
    },
  });
}

/** Chọn tay món cho một ô; thành công thì cập nhật chi tiết thực đơn và làm mới các danh sách. */
export function useManualAddMealMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ManualAddMealInput) => mealPlanApi.manualAdd(input),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_QUERY_KEYS.all });
      queryClient.setQueryData(MEAL_PLAN_QUERY_KEYS.detail(plan.id), plan);
      // Phân tích cũ không còn khớp thực đơn mới.
      queryClient.invalidateQueries({ queryKey: ['meal-analysis'] });
    },
  });
}

export function useDeleteMealPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { id: string; expectedVersion: number }) => mealPlanApi.deletePlan(vars.id, vars.expectedVersion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_QUERY_KEYS.all });
    },
  });
}
