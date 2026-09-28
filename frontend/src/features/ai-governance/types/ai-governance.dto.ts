/**
 * DTO AI Governance Admin — Phase 26 (READY)
 * Schema đồng bộ trực tiếp từ OpenAPI (`docs/api/ai-governance-admin.md`).
 */

/** 24h Operational Health DTO */
export interface AiHealthSummaryDto {
  evaluatedAt?: string;
  last24Hours?: {
    total?: number;
    failures?: number;
    fallback?: number;
    providerUnavailable?: number;
  };
  controls?: (AiGovernanceControlItemDto | null)[] | null;
  retentionDays?: number;
}

export interface AiGovernanceHealthResponseDto {
  success?: boolean;
  data?: AiHealthSummaryDto | null;
}

/** Aggregated Metrics DTO */
export interface AiMetricsDataDto {
  window?: {
    from?: string;
    to?: string;
  };
  requests?:
    | {
        capability?: string;
        provider?: string;
        total?: number;
        failures?: number;
        fallback?: number;
        avgLatencyMs?: number | null;
      }[]
    | null;
  feedback?: {
    positive?: number;
    negative?: number;
  };
  moderation?: {
    open?: number;
    dismissed?: number;
    actioned?: number;
    falsePositiveSignals?: number;
  };
  recognition?: {
    total?: number;
    corrected?: number;
    correctionRate?: number | null;
  };
  receipts?: {
    total?: number;
    corrected?: number;
    correctionRate?: number | null;
  };
  nutrition?: {
    coverage?: number | null;
    confidence?: number | null;
  };
  verification?: {
    total?: number;
    approved?: number;
    rejected?: number;
    revoked?: number;
  };
  providerUnavailable?: number;
}

export interface AiGovernanceMetricsResponseDto {
  success?: boolean;
  data?: AiMetricsDataDto | null;
}

/** Paginated Redacted Request Log Item DTO — Tuyệt đối KHÔNG chứa nội dung thô / PII */
export interface AiGovernanceRequestItemDto {
  id?: string;
  capability?: string;
  provider?: string;
  modelId?: string | null;
  templateVersion?: string | null;
  correlationId?: string;
  status?: string;
  errorClass?: string | null;
  safetyOutcome?: string;
  latencyMs?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  costMicros?: string | null;
  confidence?: number | null;
  coverage?: number | null;
  startedAt?: string;
  completedAt?: string;
  redacted?: boolean;
}

export interface AiGovernanceRequestsResponseDto {
  success?: boolean;
  data?: (AiGovernanceRequestItemDto | null)[] | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    total_pages?: number;
  } | null;
}

/** Moderation Safety Flag DTO */
export interface AiGovernanceFlagItemDto {
  id?: string;
  provider?: string;
  model?: string;
  riskLevel?: string;
  riskScore?: number;
  status?: string;
  createdAt?: string;
  reviewedAt?: string | null;
}

export interface AiGovernanceFlagsResponseDto {
  success?: boolean;
  data?: (AiGovernanceFlagItemDto | null)[] | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    total_pages?: number;
  } | null;
}

/** Capability Control Item DTO */
export interface AiGovernanceControlItemDto {
  capability?: string;
  provider?: string;
  modelId?: string | null;
  enabled?: boolean;
  version?: number;
  fallback?: string;
  updatedAt?: string | null;
}

export interface AiGovernanceControlsResponseDto {
  success?: boolean;
  data?: (AiGovernanceControlItemDto | null)[] | null;
}

/** Cập nhật toggle / provider cấu hình AI */
export interface SetAiGovernanceFeatureRequestDto {
  provider: string;
  enabled: boolean;
  expectedVersion: number;
  reason:
    | 'PROVIDER_INCIDENT'
    | 'QUALITY_INVESTIGATION'
    | 'SAFETY_HOLD'
    | 'PLANNED_MAINTENANCE'
    | 'RESTORE_SERVICE';
}

export interface AiGovernanceControlResponseDto {
  success?: boolean;
  data?: AiGovernanceControlItemDto | null;
}

/** Audit Log Item DTO cho thao tác bật/tắt tính năng */
export interface AiGovernanceControlAuditItemDto {
  id?: string;
  capability?: string;
  provider?: string;
  enabled?: boolean;
  version?: number;
  actorId?: string;
  reason?: string;
  createdAt?: string;
}

export interface AiGovernanceControlAuditResponseDto {
  success?: boolean;
  data?: (AiGovernanceControlAuditItemDto | null)[] | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    total_pages?: number;
  } | null;
}
