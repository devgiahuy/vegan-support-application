import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastApiError } from '@/lib/api-error';
import { aiGovernanceApi } from '../api/ai-governance.api';
import type { AiGovernanceQueryParams } from '../types/ai-governance.model';

export const AI_GOVERNANCE_KEYS = {
  all: ['ai-governance'] as const,
  metrics: (params?: AiGovernanceQueryParams) =>
    [...AI_GOVERNANCE_KEYS.all, 'metrics', params ?? {}] as const,
  requests: (params?: AiGovernanceQueryParams) =>
    [...AI_GOVERNANCE_KEYS.all, 'requests', params ?? {}] as const,
  flags: (params?: AiGovernanceQueryParams) =>
    [...AI_GOVERNANCE_KEYS.all, 'flags', params ?? {}] as const,
  features: () => [...AI_GOVERNANCE_KEYS.all, 'features'] as const,
};

/** Chỉ số AI theo khoảng ngày + tính năng (fixture ở phase scaffold). */
export function useAiMetricsQuery(params?: AiGovernanceQueryParams) {
  return useQuery({
    queryKey: AI_GOVERNANCE_KEYS.metrics(params),
    queryFn: () => aiGovernanceApi.getMetrics(params),
    staleTime: 60 * 1000,
  });
}

/** Log che mờ (fixture — không bao giờ có nội dung thô). */
export function useAiRequestsQuery(params?: AiGovernanceQueryParams) {
  return useQuery({
    queryKey: AI_GOVERNANCE_KEYS.requests(params),
    queryFn: () => aiGovernanceApi.getRequests(params),
    staleTime: 60 * 1000,
  });
}

/** Cờ kiểm tra (fixture). */
export function useAiFlagsQuery(params?: AiGovernanceQueryParams) {
  return useQuery({
    queryKey: AI_GOVERNANCE_KEYS.flags(params),
    queryFn: () => aiGovernanceApi.getFlags(params),
    staleTime: 60 * 1000,
  });
}

/** Công tắc tính năng (fixture). */
export function useAiFeaturesQuery() {
  return useQuery({
    queryKey: AI_GOVERNANCE_KEYS.features(),
    queryFn: () => aiGovernanceApi.getFeatures(),
    staleTime: 60 * 1000,
  });
}

/** Bật/tắt tính năng (lý do bắt buộc). */
export function useToggleAiFeatureMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { feature: string; enabled: boolean; reason: string }) =>
      aiGovernanceApi.toggleFeature(vars.feature, vars.enabled, vars.reason),
    onSuccess: (toggled) => {
      queryClient.invalidateQueries({ queryKey: AI_GOVERNANCE_KEYS.features() });
      toast.success(toggled.enabled ? 'Đã bật tính năng.' : 'Đã tắt tính năng.');
    },
    onError: (err: unknown) => toastApiError(err, 'Không thể đổi trạng thái'),
  });
}
