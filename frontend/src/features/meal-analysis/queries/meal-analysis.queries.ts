import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mealAnalysisApi } from '../api/meal-analysis.api';
import type { MealPlanAnalysis } from '../types/meal-analysis.model';

export const MEAL_ANALYSIS_KEYS = {
  all: ['meal-analysis'] as const,
  detail: (planId: string) => [...MEAL_ANALYSIS_KEYS.all, planId] as const,
};

/**
 * Hook truy xuất kết quả phân tích thực đơn tuần từ API backend hoặc cache.
 */
export function useMealAnalysisQuery(
  planId: string | null | undefined,
  currentPlanLockVersion?: number,
  options?: { enabled?: boolean }
) {
  return useQuery<MealPlanAnalysis | null>({
    queryKey: MEAL_ANALYSIS_KEYS.detail(planId ?? ''),
    queryFn: () =>
      planId ? mealAnalysisApi.getCurrentAnalysis(planId, currentPlanLockVersion) : null,
    enabled: Boolean(planId) && (options?.enabled ?? true),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook kích hoạt phân tích thực đơn tuần: POST /meal-plans/:id/analyze
 */
export function useAnalyzeMealPlanMutation(planId: string, currentPlanLockVersion?: number) {
  const queryClient = useQueryClient();

  return useMutation<
    MealPlanAnalysis,
    Error,
    { expectedPlanVersion?: number; items?: Array<{ itemId: string; servings?: number }> } | void
  >({
    mutationFn: (vars) => {
      const expectedPlanVersion = vars?.expectedPlanVersion ?? currentPlanLockVersion ?? 1;
      return mealAnalysisApi.analyzeMealPlan(planId, {
        expectedPlanVersion,
        items: vars?.items,
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(MEAL_ANALYSIS_KEYS.detail(planId), data);
      if (data.summary.dangerCount > 0) {
        toast.warning('Đã phân tích thực đơn', {
          description: `Phát hiện ${data.summary.dangerCount} cảnh báo nguy cơ cao cần điều chỉnh.`,
        });
      } else if (data.summary.warningCount > 0) {
        toast.info('Đã phân tích thực đơn', {
          description: `Phát hiện ${data.summary.warningCount} điểm cần lưu ý để tối ưu hóa hấp thu dinh dưỡng.`,
        });
      } else {
        toast.success('Thực đơn hoàn hảo!', {
          description: 'Không phát hiện xung đột tương thích hay vượt ngưỡng an toàn vi chất.',
        });
      }
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Không thể phân tích thực đơn lúc này.';
      toast.error('Phân tích thất bại', {
        description: msg,
      });
    },
  });
}
