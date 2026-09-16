import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dietApi } from '../api/diet.api';
import type {
  DietRulePreviewRequestDto,
  SaveDietPreferencesRequestDto,
  UpdateDietScheduleRequestDto,
} from '../types/diet.dto';
import { PROFILE_QUERY_KEYS } from '@/features/profile/queries/profile.queries';
import { toast } from 'sonner';

export const DIET_QUERY_KEYS = {
  all: ['diet'] as const,
  preview: (selection: DietRulePreviewRequestDto | null) =>
    [...DIET_QUERY_KEYS.all, 'preview', selection] as const,
  preference: () => [...DIET_QUERY_KEYS.all, 'preference'] as const,
  schedule: () => [...DIET_QUERY_KEYS.all, 'schedule'] as const,
};

export const useDietPreviewQuery = (selection: DietRulePreviewRequestDto | null) => {
  return useQuery({
    queryKey: DIET_QUERY_KEYS.preview(selection),
    queryFn: () => dietApi.previewDietRules(selection as DietRulePreviewRequestDto),
    enabled:
      !!selection &&
      selection.dietPattern.length > 0 &&
      selection.practiceSchedule.length > 0 &&
      selection.tradition.length > 0,
  });
};

export const useSaveDietPreferencesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveDietPreferencesRequestDto) => dietApi.saveDietPreferences(payload),
    onSuccess: (preference) => {
      queryClient.setQueryData(DIET_QUERY_KEYS.preference(), preference);
      queryClient.invalidateQueries({ queryKey: DIET_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.detail() });
      toast.success('Đã lưu lựa chọn chế độ ăn.');
    },
  });
};

export const useSaveDietScheduleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateDietScheduleRequestDto) => dietApi.saveDietSchedule(payload),
    onSuccess: (schedule) => {
      queryClient.setQueryData(DIET_QUERY_KEYS.schedule(), schedule);
      queryClient.invalidateQueries({ queryKey: DIET_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.detail() });
      toast.success('Đã lưu lịch chay kỳ.');
    },
  });
};
