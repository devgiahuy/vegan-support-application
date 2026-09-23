import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { getApiErrorCode, toastApiError } from '@/lib/api-error';
import { mealPlanApi } from '../api/meal-plan.api';
import type { GenerateMealPlanInput, MealPlanListQueryParams } from '../types/meal-plan.model';
import { MEAL_ANALYSIS_KEYS } from '@/features/meal-analysis/queries/meal-analysis.queries';

export const MEAL_PLAN_QUERY_KEYS = {
  all: ['meal-plans'] as const,
  list: (params?: MealPlanListQueryParams) =>
    [...MEAL_PLAN_QUERY_KEYS.all, 'list', params ?? {}] as const,
  detail: (id: string) => [...MEAL_PLAN_QUERY_KEYS.all, 'detail', id] as const,
};

/** Lịch sử phiên bản của current user (có filter `weekStart`). */
export function useMealPlansQuery(params?: MealPlanListQueryParams) {
  return useQuery({
    queryKey: MEAL_PLAN_QUERY_KEYS.list(params),
    queryFn: () => mealPlanApi.getPlans(params),
    staleTime: 60 * 1000,
  });
}

/** Chi tiết 1 phiên bản (21 slots + shopping list). */
export function useMealPlanDetailQuery(id: string) {
  return useQuery({
    queryKey: MEAL_PLAN_QUERY_KEYS.detail(id),
    queryFn: () => mealPlanApi.getPlanDetail(id),
    staleTime: 60 * 1000,
    enabled: id.length > 0,
  });
}

/** Tạo / tạo lại thực đơn tuần (mỗi lần gọi là 1 version mới). */
export function useGenerateMealPlanMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: GenerateMealPlanInput) => mealPlanApi.generate(input),
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_QUERY_KEYS.all });
      toast.success('Đã tạo thực đơn tuần!', {
        description: `Tuần ${plan.formattedWeekRange} — ${plan.filledSlots}/${plan.totalSlots} bữa đã lấp.`,
      });
      router.push(`/meal-plans/${plan.id}`);
    },
    onError: (err: unknown) => {
      const code = getApiErrorCode(err);
      if (code === 'DIET_SCHEDULE_REQUIRED') {
        toast.error('Cần chọn ngày chay trong tuần', {
          description: 'Bạn đang theo chế độ chay kỳ. Hãy bổ sung ngày chay ở hồ sơ rồi tạo lại.',
        });
        return;
      }
      if (code === 'HEALTH_PROFILE_INCOMPLETE') {
        toast.error('Chưa đủ dữ liệu sức khỏe', {
          description: 'Hãy cập nhật hồ sơ sức khỏe ở trang cá nhân trước khi tạo thực đơn.',
        });
        return;
      }
      toastApiError(err, 'Không thể tạo thực đơn');
    },
  });
}

/** Đổi 1 ô món (giữ nguyên `idempotencyKey` khi retry cùng thao tác). */
export function useSwapMealItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: {
      planId: string;
      itemId: string;
      expectedVersion: number;
      idempotencyKey: string;
    }) => mealPlanApi.swapItem(vars.planId, vars.itemId, vars.expectedVersion, vars.idempotencyKey),
    onSuccess: (plan, vars) => {
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MEAL_ANALYSIS_KEYS.detail(vars.planId) });
      toast.success('Đã đổi món!', {
        description: `Thực đơn đã lên phiên bản ${plan.version}.`,
      });
    },
    onError: (err: unknown) => {
      if (getApiErrorCode(err) === 'MEAL_PLAN_VERSION_CONFLICT') {
        queryClient.invalidateQueries({ queryKey: MEAL_PLAN_QUERY_KEYS.all });
        toast.error('Thực đơn đã thay đổi', {
          description: 'Vui lòng tải lại chi tiết mới nhất rồi thử đổi món lại.',
        });
        return;
      }
      toastApiError(err, 'Không thể đổi món');
    },
  });
}

/** Xóa 1 phiên bản (có xác nhận ở UI, idempotent). */
export function useDeleteMealPlanMutation() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (vars: { id: string; expectedVersion: number }) =>
      mealPlanApi.deletePlan(vars.id, vars.expectedVersion),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: MEAL_PLAN_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: MEAL_ANALYSIS_KEYS.detail(vars.id) });
      toast.success('Đã xóa thực đơn.');
      router.push('/meal-plans/saved');
    },
    onError: (err: unknown) => {
      if (getApiErrorCode(err) === 'MEAL_PLAN_VERSION_CONFLICT') {
        queryClient.invalidateQueries({ queryKey: MEAL_PLAN_QUERY_KEYS.all });
        toast.error('Thực đơn đã thay đổi', {
          description: 'Vui lòng tải lại chi tiết mới nhất rồi thử xóa lại.',
        });
        return;
      }
      toastApiError(err, 'Không thể xóa thực đơn');
    },
  });
}
