import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mealAnalysisApi } from '../api/meal-analysis.api';

export const MEAL_ANALYSIS_QUERY_KEYS = {
  all: ['meal-analysis'] as const,
  detail: (mealPlanId: string) => [...MEAL_ANALYSIS_QUERY_KEYS.all, 'detail', mealPlanId] as const,
};

export function useMealAnalysisQuery(mealPlanId: string, enabled = true) {
  return useQuery({
    queryKey: MEAL_ANALYSIS_QUERY_KEYS.detail(mealPlanId),
    queryFn: () => mealAnalysisApi.getCurrent(mealPlanId),
    staleTime: 60 * 1000,
    enabled: enabled && mealPlanId.length > 0,
    retry: false,
  });
}

export function useAnalyzeMealPlanMutation(mealPlanId: string, expectedPlanVersion: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => mealAnalysisApi.analyze(mealPlanId, expectedPlanVersion),
    onSuccess: (analysis) => {
      queryClient.setQueryData(MEAL_ANALYSIS_QUERY_KEYS.detail(mealPlanId), analysis);
      queryClient.invalidateQueries({ queryKey: MEAL_ANALYSIS_QUERY_KEYS.detail(mealPlanId) });
    },
  });
}
