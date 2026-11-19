import { useMutation, useQuery } from '@tanstack/react-query';
import { dietApi } from '../api/diet.api';
import type { FoodAllowances } from '../types/food-allowances.model';
import type { DietPreferenceDraft } from '../types/diet.model';
import { useInvalidateDietaryState } from './dietary-cache';

export const DIET_QUERY_KEYS = {
  all: ['diet'] as const,
  preview: (selection: FoodAllowances | null) => ['diet', 'preview', selection] as const,
  preference: () => ['diet', 'preference'] as const,
};
export const useDietPreviewQuery = (selection: FoodAllowances | null) =>
  useQuery({
    queryKey: DIET_QUERY_KEYS.preview(selection),
    queryFn: () => {
      if (!selection) throw new Error('Chưa chọn thực phẩm.');
      return dietApi.previewDietRules(selection);
    },
    enabled: !!selection,
  });
export function useSaveDietPreferencesMutation() {
  const invalidate = useInvalidateDietaryState();
  return useMutation({
    mutationFn: (input: DietPreferenceDraft) => dietApi.saveDietPreferences(input),
    onSuccess: invalidate,
  });
}
