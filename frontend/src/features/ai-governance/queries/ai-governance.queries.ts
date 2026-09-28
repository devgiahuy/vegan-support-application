import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastApiError } from '@/lib/api-error';
import { isAxiosError } from 'axios';
import { aiGovernanceApi } from '../api/ai-governance.api';
import type { AiGovernanceQueryParams, AiToggleReason } from '../types/ai-governance.model';

export const AI_GOVERNANCE_KEYS = {
  all: ['ai-governance'] as const,
  health: () => [...AI_GOVERNANCE_KEYS.all, 'health'] as const,
  metrics: (params?: AiGovernanceQueryParams) =>
    [...AI_GOVERNANCE_KEYS.all, 'metrics', params ?? {}] as const,
  requests: (params?: AiGovernanceQueryParams) =>
    [...AI_GOVERNANCE_KEYS.all, 'requests', params ?? {}] as const,
  flags: (params?: AiGovernanceQueryParams) =>
    [...AI_GOVERNANCE_KEYS.all, 'flags', params ?? {}] as const,
  features: () => [...AI_GOVERNANCE_KEYS.all, 'features'] as const,
  audit: (params?: AiGovernanceQueryParams) =>
    [...AI_GOVERNANCE_KEYS.all, 'audit', params ?? {}] as const,
};

/** Tổng quan sức khỏe vận hành 24 giờ */
export function useAiHealthQuery() {
  return useQuery({
    queryKey: AI_GOVERNANCE_KEYS.health(),
    queryFn: () => aiGovernanceApi.getHealth(),
    staleTime: 60 * 1000,
  });
}

/** Chỉ số tổng hợp AI theo khoảng ngày + tính năng */
export function useAiMetricsQuery(params?: AiGovernanceQueryParams) {
  return useQuery({
    queryKey: AI_GOVERNANCE_KEYS.metrics(params),
    queryFn: () => aiGovernanceApi.getMetrics(params),
    staleTime: 60 * 1000,
  });
}

/** Nhật ký yêu cầu đã che mờ (redacted) */
export function useAiRequestsQuery(params?: AiGovernanceQueryParams) {
  return useQuery({
    queryKey: AI_GOVERNANCE_KEYS.requests(params),
    queryFn: () => aiGovernanceApi.getRequests(params),
    staleTime: 60 * 1000,
  });
}

/** Cờ kiểm duyệt an toàn AI */
export function useAiFlagsQuery(params?: AiGovernanceQueryParams) {
  return useQuery({
    queryKey: AI_GOVERNANCE_KEYS.flags(params),
    queryFn: () => aiGovernanceApi.getFlags(params),
    staleTime: 60 * 1000,
  });
}

/** Danh sách cấu hình tính năng */
export function useAiFeaturesQuery() {
  return useQuery({
    queryKey: AI_GOVERNANCE_KEYS.features(),
    queryFn: () => aiGovernanceApi.getFeatures(),
    staleTime: 60 * 1000,
  });
}

/** Lịch sử kiểm toán cấu hình tính năng */
export function useAiFeatureAuditQuery(params?: AiGovernanceQueryParams) {
  return useQuery({
    queryKey: AI_GOVERNANCE_KEYS.audit(params),
    queryFn: () => aiGovernanceApi.getFeatureAudit(params),
    staleTime: 60 * 1000,
  });
}

export interface ToggleAiFeatureVariables {
  feature: string;
  enabled: boolean;
  provider: string;
  expectedVersion: number;
  reason: AiToggleReason;
}

/** Bật/tắt hoặc đổi cấu hình tính năng (lý do bắt buộc + chống xung đột phiên bản 409) */
export function useToggleAiFeatureMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: ToggleAiFeatureVariables) =>
      aiGovernanceApi.toggleFeature(
        vars.feature,
        vars.enabled,
        vars.provider,
        vars.expectedVersion,
        vars.reason
      ),
    onSuccess: (toggled) => {
      queryClient.invalidateQueries({ queryKey: AI_GOVERNANCE_KEYS.features() });
      queryClient.invalidateQueries({ queryKey: AI_GOVERNANCE_KEYS.health() });
      queryClient.invalidateQueries({ queryKey: AI_GOVERNANCE_KEYS.audit() });
      toast.success(
        toggled.enabled
          ? `Đã bật tính năng ${toggled.capabilityLabel}.`
          : `Đã tắt tính năng ${toggled.capabilityLabel}.`
      );
    },
    onError: (err: unknown) => {
      if (isAxiosError(err) && err.response?.status === 409) {
        queryClient.invalidateQueries({ queryKey: AI_GOVERNANCE_KEYS.features() });
        toast.error(
          'Cấu hình đã thay đổi bởi người quản trị khác. Đã tự động cập nhật phiên bản mới nhất, vui lòng thử lại.'
        );
        return;
      }
      toastApiError(err, 'Không thể đổi trạng thái tính năng');
    },
  });
}
