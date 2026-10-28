import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { AUTH_QUERY_KEYS } from '@/features/auth/queries/auth.queries';
import { MEAL_PLAN_QUERY_KEYS } from '@/features/meal-plan/queries/meal-plan.queries';
import { MEAL_PROGRAM_QUERY_KEYS } from '@/features/meal-program/queries/meal-program.queries';
import { POST_QUERY_KEYS } from '@/features/post/queries/post.queries';
import { PROFILE_QUERY_KEYS } from '@/features/profile/queries/profile.queries';
import { RECIPE_QUERY_KEYS } from '@/features/recipe/queries/recipe.queries';
import { RECOMMENDATION_QUERY_KEYS } from '@/features/recommendation/queries/recommendation.queries';
import { dietPreferencesApi, type DietSelection, type SaveDietPreferencesInput } from '../api/diet-preferences.api';

/**
 * Hồ sơ ăn uống/lịch chay là ràng buộc cứng do backend áp dụng cho công thức, gợi ý và thực đơn,
 * nên mọi cache phụ thuộc người dùng phải bỏ sau khi lưu. Không bao gồm nhà hàng: discovery
 * không áp hồ sơ cá nhân (quyết định 2026-10-25).
 */
function invalidateProfileDependentQueries(queryClient: QueryClient) {
  for (const queryKey of [
    PROFILE_QUERY_KEYS.all,
    AUTH_QUERY_KEYS.all,
    RECIPE_QUERY_KEYS.all,
    POST_QUERY_KEYS.all,
    RECOMMENDATION_QUERY_KEYS.all,
    MEAL_PLAN_QUERY_KEYS.all,
    MEAL_PROGRAM_QUERY_KEYS.all,
  ]) {
    void queryClient.invalidateQueries({ queryKey });
  }
}

/** Xem trước rule set cho 1 lựa chọn chế độ ăn — không lưu, không có state để cache lại. */
export function usePreviewDietRulesMutation() {
  return useMutation({
    mutationFn: (selection: DietSelection) => dietPreferencesApi.previewRules(selection),
  });
}

export function useSaveDietPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveDietPreferencesInput) => dietPreferencesApi.saveDietPreferences(input),
    onSuccess: () => invalidateProfileDependentQueries(queryClient),
  });
}

/** Sửa riêng ngày chay kỳ — không chạy lại wizard chọn quy tắc. */
export function useSaveDietScheduleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dates: string[]) => dietPreferencesApi.saveDietSchedule(dates),
    onSuccess: () => invalidateProfileDependentQueries(queryClient),
  });
}
