import apiClient from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { PaginationResult } from '@/types/api';
import type {
  AiGovernanceControlAuditResponseDto,
  AiGovernanceControlResponseDto,
  AiGovernanceControlsResponseDto,
  AiGovernanceFlagsResponseDto,
  AiGovernanceHealthResponseDto,
  AiGovernanceMetricsResponseDto,
  AiGovernanceRequestsResponseDto,
} from '../types/ai-governance.dto';
import type {
  AiFeatureAuditLog,
  AiFeatureToggle,
  AiFlag,
  AiGovernanceMetrics,
  AiGovernanceQueryParams,
  AiOperationalHealth,
  AiRequestLog,
  AiToggleReason,
} from '../types/ai-governance.model';
import { aiGovernanceMapper } from '../mappers/ai-governance.mapper';

/**
 * AI Governance API Client — Phase 26 (READY)
 * Đã kết nối live backend endpoint thông qua `apiClient` (`src/lib/axios.ts`).
 */
export const USE_FIXTURES = false;

export const aiGovernanceApi = {
  /** `GET /admin/ai/health` — Tổng quan vận hành 24 giờ */
  getHealth: async (): Promise<AiOperationalHealth> => {
    const response = await apiClient.get<AiGovernanceHealthResponseDto>(
      API_ENDPOINTS.AI_GOVERNANCE.HEALTH
    );
    return aiGovernanceMapper.toHealthSummary(response.data);
  },

  /** `GET /admin/ai/metrics` — Thống kê aggregated metrics */
  getMetrics: async (params?: AiGovernanceQueryParams): Promise<AiGovernanceMetrics> => {
    const response = await apiClient.get<AiGovernanceMetricsResponseDto>(
      API_ENDPOINTS.AI_GOVERNANCE.METRICS,
      {
        params: {
          capability: params?.capability || undefined,
          provider: params?.provider || undefined,
          from: params?.from || undefined,
          to: params?.to || undefined,
        },
      }
    );
    return aiGovernanceMapper.toMetricsSummary(response.data);
  },

  /** `GET /admin/ai/requests` — Nhật ký yêu cầu đã che mờ (redacted) */
  getRequests: async (
    params?: AiGovernanceQueryParams
  ): Promise<PaginationResult<AiRequestLog>> => {
    const response = await apiClient.get<AiGovernanceRequestsResponseDto>(
      API_ENDPOINTS.AI_GOVERNANCE.REQUESTS,
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          capability: params?.capability || undefined,
          provider: params?.provider || undefined,
          status: params?.status || undefined,
          from: params?.from || undefined,
          to: params?.to || undefined,
        },
      }
    );
    return aiGovernanceMapper.toRequestsList(response.data);
  },

  /** `GET /admin/ai/flags` — Cờ an toàn kiểm duyệt AI */
  getFlags: async (params?: AiGovernanceQueryParams): Promise<AiFlag[]> => {
    const response = await apiClient.get<AiGovernanceFlagsResponseDto>(
      API_ENDPOINTS.AI_GOVERNANCE.FLAGS,
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          provider: params?.provider || undefined,
          status: params?.status || undefined,
          from: params?.from || undefined,
          to: params?.to || undefined,
        },
      }
    );
    return aiGovernanceMapper.toFlagsList(response.data);
  },

  /** `GET /admin/ai/features` — Danh sách cấu hình tính năng & provider */
  getFeatures: async (): Promise<AiFeatureToggle[]> => {
    const response = await apiClient.get<AiGovernanceControlsResponseDto>(
      API_ENDPOINTS.AI_GOVERNANCE.FEATURES
    );
    return aiGovernanceMapper.toFeaturesList(response.data);
  },

  /** `GET /admin/ai/features/audit` — Lịch sử kiểm toán cấu hình tính năng */
  getFeatureAudit: async (
    params?: AiGovernanceQueryParams
  ): Promise<PaginationResult<AiFeatureAuditLog>> => {
    const response = await apiClient.get<AiGovernanceControlAuditResponseDto>(
      API_ENDPOINTS.AI_GOVERNANCE.FEATURES_AUDIT,
      {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 20,
          capability: params?.capability || undefined,
          provider: params?.provider || undefined,
          from: params?.from || undefined,
          to: params?.to || undefined,
        },
      }
    );
    return aiGovernanceMapper.toAuditList(response.data);
  },

  /** `PATCH /admin/ai/features/:feature` — Đổi trạng thái hoặc provider với lý do kiểm toán bắt buộc */
  toggleFeature: async (
    feature: string,
    enabled: boolean,
    provider: string,
    expectedVersion: number,
    reason: AiToggleReason
  ): Promise<AiFeatureToggle> => {
    const payload = aiGovernanceMapper.toTogglePayload(provider, enabled, expectedVersion, reason);
    const response = await apiClient.patch<AiGovernanceControlResponseDto>(
      API_ENDPOINTS.AI_GOVERNANCE.FEATURE_TOGGLE(feature),
      payload
    );
    return aiGovernanceMapper.toToggledFeature(response.data);
  },
};
