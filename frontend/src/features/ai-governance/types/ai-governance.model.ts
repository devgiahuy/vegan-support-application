/** Chỉ số AI theo ngày/tính năng. */
export interface AiMetric {
  date: string;
  feature: string;
  requests: number;
  errorCount: number;
  errorRate: number;
  fallbackCount: number;
  fallbackRate: number;
  avgLatencyMs: number | null;
}

/** Log che mờ — KHÔNG có field nội dung thô. */
export interface AiRequestLog {
  id: string;
  promptHash: string;
  topicCodes: string[];
  provider: string;
  modelId: string;
  latencyMs: number | null;
  tokens: number | null;
  status: string;
  statusLabel: string;
  createdAt: Date | null;
}

/** Cờ cần xem xét. */
export interface AiFlag {
  id: string;
  kind: string;
  target: string;
  status: string;
  statusLabel: string;
  createdAt: Date | null;
}

/** Công tắc tính năng AI. */
export interface AiFeatureToggle {
  feature: string;
  featureLabel: string;
  enabled: boolean;
  provider: string;
  modelId: string;
  updatedBy: string | null;
  updatedAt: Date | null;
  updateReason: string | null;
}

/** Tham số query trang tổng quan. */
export interface AiGovernanceQueryParams {
  from?: string;
  to?: string;
  feature?: string;
  status?: string;
  page?: number;
  limit?: number;
}
