import type { PaginationResult } from '@/types/api';
import type { AiFeatureDto } from '../types/ai-governance.dto';
import type {
  AiFeatureToggle,
  AiFlag,
  AiGovernanceQueryParams,
  AiMetric,
  AiRequestLog,
} from '../types/ai-governance.model';
import { aiGovernanceMapper } from '../mappers/ai-governance.mapper';
import {
  aiFeaturesFixture,
  aiFlagsFixture,
  aiMetricsFixture,
  aiRequestsFixture,
  toggledFeatureFixture,
} from '../__fixtures__/ai-governance-fixtures';

/**
 * API AI governance — PHASE SCAFFOLD: đọc fixture, 0 request mạng.
 * Backend còn `PLANNED` (không có schema swagger) nên 5 hàm dưới MÔ PHỎNG
 * đúng signature dự kiến live.
 *
 * Ngày nối live (TODO(BE-READY)): reconfirm shape 5 endpoint với swagger thật,
 * sửa mapper nếu lệch, thay thân hàm bằng axios qua `API_ENDPOINTS.AI_GOVERNANCE`,
 * giữ nguyên chữ ký + kiểu trả về — queries/components KHÔNG đổi.
 * Đồng thời chuyển `__fixtures__` sang test-only hoặc xóa khỏi bundle.
 */
export const USE_FIXTURES = true;

const SIMULATED_DELAY_MS = 300;

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_DELAY_MS));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

let featuresStore: (AiFeatureDto | null)[] = clone(aiFeaturesFixture.data ?? []);

export function __resetAiGovernanceFixtures(): void {
  featuresStore = clone(aiFeaturesFixture.data ?? []);
}

function inRange(date: string | undefined, from?: string, to?: string): boolean {
  if (!date) return true;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

export const aiGovernanceApi = {
  /** `GET /admin/ai/metrics` (fixture, lọc khoảng + tính năng). */
  getMetrics: async (params?: AiGovernanceQueryParams): Promise<AiMetric[]> => {
    await delay();
    const source = clone(aiMetricsFixture.data ?? []).filter(
      (item) =>
        inRange(item?.date, params?.from, params?.to) &&
        (!params?.feature || item?.feature === params.feature)
    );
    return aiGovernanceMapper.toMetricsList({ success: true, data: source, meta: null });
  },

  /** `GET /admin/ai/requests` (fixture, lọc khoảng + tính năng). */
  getRequests: async (
    params?: AiGovernanceQueryParams
  ): Promise<PaginationResult<AiRequestLog>> => {
    await delay();
    void params;
    const source = clone(aiRequestsFixture.data ?? []);
    return aiGovernanceMapper.toRequestsList({
      success: true,
      data: source,
      meta: { page: 1, limit: 10, total: source.length, totalPages: 1 },
    });
  },

  /** `GET /admin/ai/flags` (fixture, lọc trạng thái). */
  getFlags: async (params?: AiGovernanceQueryParams): Promise<AiFlag[]> => {
    await delay();
    const source = clone(aiFlagsFixture.data ?? []).filter(
      (item) => !params?.status || item?.status === params.status
    );
    return aiGovernanceMapper.toFlagsList({ success: true, data: source, meta: null });
  },

  /** `GET /admin/ai/features` (fixture). */
  getFeatures: async (): Promise<AiFeatureToggle[]> => {
    await delay();
    return aiGovernanceMapper.toFeaturesList({
      success: true,
      data: clone(featuresStore),
      meta: null,
    });
  },

  /** `PATCH /admin/ai/features/:feature` (fixture, đổi trạng thái). */
  toggleFeature: async (
    feature: string,
    enabled: boolean,
    reason: string
  ): Promise<AiFeatureToggle> => {
    await delay();
    featuresStore = featuresStore.map((item) =>
      item && item.feature === feature ? { ...item, enabled, updateReason: reason } : item
    );
    return aiGovernanceMapper.toToggledFeature(toggledFeatureFixture(feature, enabled, reason));
  },
};
