import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { AUTH_QUERY_KEYS } from '@/features/auth/queries/auth.queries';
import { MEAL_PLAN_QUERY_KEYS } from '@/features/meal-plan/queries/meal-plan.queries';
import { MEAL_PROGRAM_QUERY_KEYS } from '@/features/meal-program/queries/meal-program.queries';
import { MEAL_ANALYSIS_QUERY_KEYS } from '@/features/meal-analysis/queries/meal-analysis.queries';
import { SHOPPING_QUERY_KEYS } from '@/features/shopping/queries/shopping.queries';
import { POST_QUERY_KEYS } from '@/features/post/queries/post.queries';
import { PROFILE_QUERY_KEYS } from '@/features/profile/queries/profile.queries';
import { RECIPE_QUERY_KEYS } from '@/features/recipe/queries/recipe.queries';
import { RECOMMENDATION_QUERY_KEYS } from '@/features/recommendation/queries/recommendation.queries';
import { dietPreferencesApi, type DietSelection, type SaveDietPreferencesInput } from '../api/diet-preferences.api';
import type { DietaryRepairPreviewRequestDto, DietaryRepairApplyRequestDto, DietaryProgramRevisionRequestDto } from '../types/diet-impact.dto';

export const DIETARY_QUERY_KEYS = {
  all: ['dietary-preferences'] as const,
  impact: () => ['dietary-preferences', 'impact'] as const,
  repair: () => ['dietary-preferences', 'repair'] as const,
};
export const DIETARY_DEPENDENT_QUERY_KEYS = [
  PROFILE_QUERY_KEYS.all, AUTH_QUERY_KEYS.all, RECIPE_QUERY_KEYS.all, POST_QUERY_KEYS.all,
  RECOMMENDATION_QUERY_KEYS.all, MEAL_PLAN_QUERY_KEYS.all, MEAL_PROGRAM_QUERY_KEYS.all,
  MEAL_ANALYSIS_QUERY_KEYS.all, SHOPPING_QUERY_KEYS.all, DIETARY_QUERY_KEYS.all,
] as const;

/** Nhà hàng không tự áp hồ sơ ăn uống nên không đưa vào danh sách cache phụ thuộc. */
export function invalidateProfileDependentQueries(queryClient: QueryClient) {
  for (const queryKey of DIETARY_DEPENDENT_QUERY_KEYS) void queryClient.invalidateQueries({ queryKey });
}
export function usePreviewDietRulesMutation() {
  return useMutation({ mutationFn: (selection: DietSelection) => dietPreferencesApi.previewRules(selection) });
}
export function useDietaryImpactMutation() {
  return useMutation({ mutationKey: DIETARY_QUERY_KEYS.impact(), mutationFn: (input: SaveDietPreferencesInput) => dietPreferencesApi.previewImpact(input) });
}
export function useSaveDietPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveDietPreferencesInput) => dietPreferencesApi.saveDietPreferences(input),
    onSettled: () => invalidateProfileDependentQueries(queryClient),
  });
}
export function useDietaryRepairPreviewMutation() {
  return useMutation({ mutationKey: DIETARY_QUERY_KEYS.repair(), mutationFn: (input: DietaryRepairPreviewRequestDto) => dietPreferencesApi.previewRepair(input) });
}
export function useDietaryRepairApplyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DietaryRepairApplyRequestDto) => dietPreferencesApi.applyRepair(input),
    onSettled: () => invalidateProfileDependentQueries(queryClient),
  });
}
export function useDietaryProgramRevisionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { programId: string } & DietaryProgramRevisionRequestDto) => {
      const { programId, ...payload } = input;
      return dietPreferencesApi.createProgramRevision(programId, payload);
    },
    onSettled: () => invalidateProfileDependentQueries(queryClient),
  });
}
