import { useMutation, useQueryClient } from '@tanstack/react-query';
import { healthApi } from '../api/health.api';
import type { HealthProfileRequestDto } from '../types/health.dto';
import { PROFILE_QUERY_KEYS } from './profile.queries';
import { toast } from 'sonner';

export const HEALTH_QUERY_KEYS = {
  all: ['health-profile'] as const,
  detail: () => [...HEALTH_QUERY_KEYS.all, 'detail'] as const,
};

export const useSaveHealthProfileMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: HealthProfileRequestDto) => healthApi.saveHealthProfile(payload),
    onSuccess: (health) => {
      queryClient.setQueryData(HEALTH_QUERY_KEYS.detail(), health);
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEYS.detail() });
      toast.success('Đã lưu chỉ số sức khỏe.');
    },
  });
};
