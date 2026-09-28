/**
 * UI Models cho Quản trị AI (Admin AI Governance) — Phase 26
 */

/** Tổng quan sức khỏe vận hành 24 giờ */
export interface AiOperationalHealth {
  evaluatedAt: Date | null;
  total24h: number;
  failures24h: number;
  fallback24h: number;
  providerUnavailable24h: number;
  retentionDays: number;
  activeControlsCount: number;
}

/** Chi tiết yêu cầu theo nhóm tính năng/provider trong chỉ số */
export interface AiCapabilityMetricItem {
  capability: string;
  capabilityLabel: string;
  provider: string;
  total: number;
  failures: number;
  fallback: number;
  avgLatencyMs: number | null;
}

/** Chỉ số tổng hợp toàn bộ AI trong khoảng thời gian */
export interface AiGovernanceMetrics {
  window: { from: string; to: string };
  totalRequests: number;
  totalFailures: number;
  totalFallbacks: number;
  avgLatencyMs: number | null;
  requestsBreakdown: AiCapabilityMetricItem[];
  feedbackPositive: number;
  feedbackNegative: number;
  feedbackSatisfactionRate: number | null; // % (từ 0-100)
  moderationOpen: number;
  moderationDismissed: number;
  moderationActioned: number;
  moderationFalsePositives: number;
  recognitionTotal: number;
  recognitionCorrectionRate: number | null; // % (từ 0-100)
  receiptsTotal: number;
  receiptsCorrectionRate: number | null; // % (từ 0-100)
  nutritionConfidence: number | null; // % (từ 0-100)
  providerUnavailable: number;
}

/** Backward compatibility model cho bảng/card cũ nếu cần */
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

/** Nhật ký yêu cầu che mờ — Tuyệt đối KHÔNG có field nội dung thô / PII */
export interface AiRequestLog {
  id: string;
  capability: string;
  capabilityLabel: string;
  provider: string;
  modelId: string;
  templateVersion: string | null;
  correlationId: string;
  status: string;
  statusLabel: string;
  errorClass: string | null;
  safetyOutcome: string;
  latencyMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  costMicros: string | null;
  confidencePercent: number | null;
  coveragePercent: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  redacted: boolean;
}

/** Cờ kiểm duyệt an toàn AI */
export interface AiFlag {
  id: string;
  provider: string;
  model: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  riskLevelLabel: string;
  riskScorePercent: number;
  status: 'OPEN' | 'REVIEWED' | 'DISMISSED' | string;
  statusLabel: string;
  createdAt: Date | null;
  reviewedAt: Date | null;
}

/** Công tắc cấu hình tính năng AI */
export interface AiFeatureToggle {
  capability: string;
  capabilityLabel: string;
  provider: string;
  modelId: string;
  enabled: boolean;
  version: number;
  fallback: string;
  fallbackLabel: string;
  updatedAt: Date | null;
}

/** Lịch sử kiểm toán bật/tắt tính năng */
export interface AiFeatureAuditLog {
  id: string;
  capability: string;
  capabilityLabel: string;
  provider: string;
  enabled: boolean;
  version: number;
  actorId: string;
  reason: string;
  reasonLabel: string;
  createdAt: Date | null;
}

/** Lý do bắt buộc được phép khi bật/tắt tính năng */
export type AiToggleReason =
  | 'PROVIDER_INCIDENT'
  | 'QUALITY_INVESTIGATION'
  | 'SAFETY_HOLD'
  | 'PLANNED_MAINTENANCE'
  | 'RESTORE_SERVICE';

/** Tham số query cho AI Governance */
export interface AiGovernanceQueryParams {
  page?: number;
  limit?: number;
  capability?: string;
  provider?: string;
  status?: string;
  from?: string;
  to?: string;
}
