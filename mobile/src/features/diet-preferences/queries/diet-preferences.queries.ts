import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AUTH_QUERY_KEYS } from '@/features/auth/queries/auth.queries';
import { PROFILE_QUERY_KEYS } from '@/features/profile/queries/profile.queries';
import { dietPreferencesApi, type DietSelection, type SaveDietPreferencesInput } from '../api/diet-preferences.api';

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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.all });
    },
  });
}
