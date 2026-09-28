import { BaseMapper, pickField, safeArray, safeDate, safeNumber, safeString } from '@/lib/mapper';
import type { PaginationResult } from '@/types/api';
import type {
  AiGovernanceControlAuditItemDto,
  AiGovernanceControlAuditResponseDto,
  AiGovernanceControlItemDto,
  AiGovernanceControlResponseDto,
  AiGovernanceControlsResponseDto,
  AiGovernanceFlagItemDto,
  AiGovernanceFlagsResponseDto,
  AiGovernanceHealthResponseDto,
  AiGovernanceMetricsResponseDto,
  AiGovernanceRequestItemDto,
  AiGovernanceRequestsResponseDto,
  AiHealthSummaryDto,
  AiMetricsDataDto,
  SetAiGovernanceFeatureRequestDto,
} from '../types/ai-governance.dto';
import type {
  AiCapabilityMetricItem,
  AiFeatureAuditLog,
  AiFeatureToggle,
  AiFlag,
  AiGovernanceMetrics,
  AiOperationalHealth,
  AiRequestLog,
  AiToggleReason,
} from '../types/ai-governance.model';

export const CAPABILITY_LABELS: Record<string, string> = {
  CHAT: 'Trợ lý Dinh dưỡng (Chat)',
  MODERATION: 'Kiểm duyệt An toàn',
  NUTRITION: 'Ước tính Dinh dưỡng',
  VISION: 'Nhận diện Tủ lạnh (Vision)',
  RECEIPT: 'Bóc tách Hóa đơn',
  VERIFICATION: 'Kiểm chứng Tri thức AI',
};

export const REASON_LABELS: Record<string, string> = {
  PROVIDER_INCIDENT: 'Sự cố nhà cung cấp',
  QUALITY_INVESTIGATION: 'Điều tra chất lượng',
  SAFETY_HOLD: 'Tạm dừng vì an toàn',
  PLANNED_MAINTENANCE: 'Bảo trì theo kế hoạch',
  RESTORE_SERVICE: 'Khôi phục dịch vụ',
};

export const LOG_STATUS_LABELS: Record<string, string> = {
  OK: 'Thành công',
  FALLBACK: 'Dự phòng',
  ERROR: 'Lỗi',
};

export const FLAG_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Đang mở',
  REVIEWED: 'Đã xem xét',
  DISMISSED: 'Đã bỏ qua',
};

export const RISK_LEVEL_LABELS: Record<string, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
};

export const FALLBACK_LABELS: Record<string, string> = {
  HEURISTIC_RULESET: 'Quy tắc Heuristic',
  PRECOMPUTED_USDA: 'Dữ liệu USDA chuẩn',
  CANONICAL_TABLE: 'Bảng dinh dưỡng chuẩn',
  DISABLED: 'Tắt tính năng',
};

function toPageMeta(
  meta:
    | { page?: number; limit?: number; total?: number; totalPages?: number; total_pages?: number }
    | null
    | undefined,
  fallbackTotal: number
) {
  const page = safeNumber(pickField(meta, ['page'], 1));
  const limit = safeNumber(pickField(meta, ['limit'], 10));
  const totalItems = safeNumber(pickField(meta, ['total'], fallbackTotal));
  const totalPages = safeNumber(pickField(meta, ['totalPages', 'total_pages'], 1));
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * AiGovernanceMapper — mapper an toàn tuân thủ kiến trúc 7 tầng và quy tắc bảo mật.
 * REDACTION DEFENSE-IN-DEPTH:
 * Chỉ đọc danh sách các trường kỹ thuật cho phép.
 * Tuyệt đối không đọc hoặc ánh xạ bất kỳ trường nào có tên gợi nội dung thô:
 * prompt, rawInput, messages, profile, health, receipt, image.
 */
export class AiGovernanceMapper extends BaseMapper<AiGovernanceRequestItemDto, AiRequestLog> {
  toModel(dto: AiGovernanceRequestItemDto | null | undefined): AiRequestLog {
    return this.toRequestLog(dto);
  }

  /** `GET /admin/ai/health` — Tổng quan 24 giờ */
  toHealthSummary(dto: AiGovernanceHealthResponseDto | null | undefined): AiOperationalHealth {
    const data = (pickField(dto, ['data'], null) as AiHealthSummaryDto | null) ?? {};
    const last24h = data.last24Hours ?? {};
    const controls = safeArray(data.controls, (c) => c).filter(Boolean);

    return {
      evaluatedAt: safeDate(pickField(data, ['evaluatedAt'], null)),
      total24h: safeNumber(pickField(last24h, ['total'], 0)),
      failures24h: safeNumber(pickField(last24h, ['failures'], 0)),
      fallback24h: safeNumber(pickField(last24h, ['fallback'], 0)),
      providerUnavailable24h: safeNumber(pickField(last24h, ['providerUnavailable'], 0)),
      retentionDays: safeNumber(pickField(data, ['retentionDays'], 90)),
      activeControlsCount: controls.length,
    };
  }

  /** `GET /admin/ai/metrics` — Chỉ số tổng hợp */
  toMetricsSummary(dto: AiGovernanceMetricsResponseDto | null | undefined): AiGovernanceMetrics {
    const data = (pickField(dto, ['data'], null) as AiMetricsDataDto | null) ?? {};
    const windowRaw = data.window ?? {};
    const requestsRaw = safeArray(data.requests, (r) => r);

    const requestsBreakdown: AiCapabilityMetricItem[] = requestsRaw.map((item) => {
      const cap = safeString(pickField(item, ['capability'], ''));
      return {
        capability: cap,
        capabilityLabel: CAPABILITY_LABELS[cap] ?? (cap || 'Khác'),
        provider: safeString(pickField(item, ['provider'], '—')),
        total: safeNumber(pickField(item, ['total'], 0)),
        failures: safeNumber(pickField(item, ['failures'], 0)),
        fallback: safeNumber(pickField(item, ['fallback'], 0)),
        avgLatencyMs: (() => {
          const raw = pickField(item, ['avgLatencyMs'], null) as unknown;
          if (raw === null || raw === undefined) return null;
          const parsed = safeNumber(raw, NaN);
          return Number.isNaN(parsed) ? null : parsed;
        })(),
      };
    });

    const totalRequests = requestsBreakdown.reduce((sum, r) => sum + r.total, 0);
    const totalFailures = requestsBreakdown.reduce((sum, r) => sum + r.failures, 0);
    const totalFallbacks = requestsBreakdown.reduce((sum, r) => sum + r.fallback, 0);

    const latencies = requestsBreakdown
      .map((r) => r.avgLatencyMs)
      .filter((l): l is number => l !== null);
    const avgLatencyMs =
      latencies.length > 0
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : null;

    const feedback = data.feedback ?? {};
    const posFeedback = safeNumber(pickField(feedback, ['positive'], 0));
    const negFeedback = safeNumber(pickField(feedback, ['negative'], 0));
    const totalFeedback = posFeedback + negFeedback;
    const feedbackSatisfactionRate =
      totalFeedback > 0 ? Math.round((posFeedback / totalFeedback) * 100) : null;

    const moderation = data.moderation ?? {};
    const recognition = data.recognition ?? {};
    const receipts = data.receipts ?? {};
    const nutrition = data.nutrition ?? {};

    const recRateRaw = pickField(recognition, ['correctionRate'], null) as unknown;
    const recRate =
      recRateRaw !== null && recRateRaw !== undefined
        ? Math.round(safeNumber(recRateRaw, 0) * 100)
        : null;

    const rcptRateRaw = pickField(receipts, ['correctionRate'], null) as unknown;
    const rcptRate =
      rcptRateRaw !== null && rcptRateRaw !== undefined
        ? Math.round(safeNumber(rcptRateRaw, 0) * 100)
        : null;

    const nutConfRaw = pickField(nutrition, ['confidence'], null) as unknown;
    const nutConf =
      nutConfRaw !== null && nutConfRaw !== undefined
        ? Math.round(safeNumber(nutConfRaw, 0) * 100)
        : null;

    return {
      window: {
        from: safeString(pickField(windowRaw, ['from'], '')),
        to: safeString(pickField(windowRaw, ['to'], '')),
      },
      totalRequests,
      totalFailures,
      totalFallbacks,
      avgLatencyMs,
      requestsBreakdown,
      feedbackPositive: posFeedback,
      feedbackNegative: negFeedback,
      feedbackSatisfactionRate,
      moderationOpen: safeNumber(pickField(moderation, ['open'], 0)),
      moderationDismissed: safeNumber(pickField(moderation, ['dismissed'], 0)),
      moderationActioned: safeNumber(pickField(moderation, ['actioned'], 0)),
      moderationFalsePositives: safeNumber(pickField(moderation, ['falsePositiveSignals'], 0)),
      recognitionTotal: safeNumber(pickField(recognition, ['total'], 0)),
      recognitionCorrectionRate: recRate,
      receiptsTotal: safeNumber(pickField(receipts, ['total'], 0)),
      receiptsCorrectionRate: rcptRate,
      nutritionConfidence: nutConf,
      providerUnavailable: safeNumber(pickField(data, ['providerUnavailable'], 0)),
    };
  }

  /** `GET /admin/ai/requests` — Log che mờ metadata */
  toRequestLog(dto: AiGovernanceRequestItemDto | null | undefined): AiRequestLog {
    const status = safeString(pickField(dto, ['status'], 'OK')).toUpperCase();
    const capability = safeString(pickField(dto, ['capability'], 'CHAT')).toUpperCase();

    const confRaw = pickField(dto, ['confidence'], null) as unknown;
    const confidencePercent =
      confRaw !== null && confRaw !== undefined ? Math.round(safeNumber(confRaw, 0) * 100) : null;

    const covRaw = pickField(dto, ['coverage'], null) as unknown;
    const coveragePercent =
      covRaw !== null && covRaw !== undefined ? Math.round(safeNumber(covRaw, 0) * 100) : null;

    return {
      id: safeString(pickField(dto, ['id'], '')),
      capability,
      capabilityLabel: CAPABILITY_LABELS[capability] ?? capability,
      provider: safeString(pickField(dto, ['provider'], '—')),
      modelId: safeString(pickField(dto, ['modelId'], '—')),
      templateVersion: safeString(pickField(dto, ['templateVersion'], '')) || null,
      correlationId: safeString(pickField(dto, ['correlationId'], '—')),
      status,
      statusLabel: LOG_STATUS_LABELS[status] ?? status,
      errorClass: safeString(pickField(dto, ['errorClass'], '')) || null,
      safetyOutcome: safeString(pickField(dto, ['safetyOutcome'], 'SAFE')),
      latencyMs: (() => {
        const raw = pickField(dto, ['latencyMs'], null) as unknown;
        if (raw === null || raw === undefined) return null;
        const parsed = safeNumber(raw, NaN);
        return Number.isNaN(parsed) ? null : parsed;
      })(),
      inputTokens: (() => {
        const raw = pickField(dto, ['inputTokens'], null) as unknown;
        if (raw === null || raw === undefined) return null;
        const parsed = safeNumber(raw, NaN);
        return Number.isNaN(parsed) ? null : parsed;
      })(),
      outputTokens: (() => {
        const raw = pickField(dto, ['outputTokens'], null) as unknown;
        if (raw === null || raw === undefined) return null;
        const parsed = safeNumber(raw, NaN);
        return Number.isNaN(parsed) ? null : parsed;
      })(),
      costMicros: safeString(pickField(dto, ['costMicros'], '')) || null,
      confidencePercent,
      coveragePercent,
      startedAt: safeDate(pickField(dto, ['startedAt'], null)),
      completedAt: safeDate(pickField(dto, ['completedAt'], null)),
      redacted: pickField<boolean>(dto, ['redacted'], true),
    };
  }

  /** `GET /admin/ai/requests` — Danh sách phân trang */
  toRequestsList(
    dto: AiGovernanceRequestsResponseDto | null | undefined
  ): PaginationResult<AiRequestLog> {
    const rawItems =
      (pickField(dto, ['data'], null) as (AiGovernanceRequestItemDto | null)[] | null) ?? [];
    const items = safeArray<AiGovernanceRequestItemDto | null, AiRequestLog>(
      rawItems,
      (item: AiGovernanceRequestItemDto | null | undefined) => this.toRequestLog(item)
    ).filter((item) => item.id.length > 0);
    const meta = pickField(dto, ['meta'], null) as AiGovernanceRequestsResponseDto['meta'];
    return {
      items,
      metadata: meta
        ? toPageMeta(meta, items.length)
        : {
            page: 1,
            limit: 10,
            totalItems: items.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
    };
  }

  /** `GET /admin/ai/flags` — Cờ an toàn */
  toFlag(dto: AiGovernanceFlagItemDto | null | undefined): AiFlag {
    const status = safeString(pickField(dto, ['status'], 'OPEN')).toUpperCase();
    const riskLevel = safeString(pickField(dto, ['riskLevel'], 'LOW')).toUpperCase();
    const riskScore = safeNumber(pickField(dto, ['riskScore'], 0));

    return {
      id: safeString(pickField(dto, ['id'], '')),
      provider: safeString(pickField(dto, ['provider'], '—')),
      model: safeString(pickField(dto, ['model'], '—')),
      riskLevel,
      riskLevelLabel: RISK_LEVEL_LABELS[riskLevel] ?? riskLevel,
      riskScorePercent: Math.round(riskScore * 100),
      status,
      statusLabel: FLAG_STATUS_LABELS[status] ?? status,
      createdAt: safeDate(pickField(dto, ['createdAt'], null)),
      reviewedAt: safeDate(pickField(dto, ['reviewedAt'], null)),
    };
  }

  toFlagsList(dto: AiGovernanceFlagsResponseDto | null | undefined): AiFlag[] {
    const rawItems =
      (pickField(dto, ['data'], null) as (AiGovernanceFlagItemDto | null)[] | null) ?? [];
    return safeArray<AiGovernanceFlagItemDto | null, AiFlag>(
      rawItems,
      (item: AiGovernanceFlagItemDto | null | undefined) => this.toFlag(item)
    ).filter((item) => item.id.length > 0);
  }

  /** `GET /admin/ai/features` — Cấu hình tính năng */
  toFeature(dto: AiGovernanceControlItemDto | null | undefined): AiFeatureToggle {
    const capability = safeString(pickField(dto, ['capability'], '')).toUpperCase();
    const fallback = safeString(pickField(dto, ['fallback'], 'DISABLED'));

    return {
      capability,
      capabilityLabel: CAPABILITY_LABELS[capability] ?? capability,
      provider: safeString(pickField(dto, ['provider'], '—')),
      modelId: safeString(pickField(dto, ['modelId'], '—')),
      enabled: pickField<boolean>(dto, ['enabled'], false),
      version: safeNumber(pickField(dto, ['version'], 1)),
      fallback,
      fallbackLabel: FALLBACK_LABELS[fallback] ?? fallback,
      updatedAt: safeDate(pickField(dto, ['updatedAt'], null)),
    };
  }

  toFeaturesList(dto: AiGovernanceControlsResponseDto | null | undefined): AiFeatureToggle[] {
    const rawItems =
      (pickField(dto, ['data'], null) as (AiGovernanceControlItemDto | null)[] | null) ?? [];
    return safeArray<AiGovernanceControlItemDto | null, AiFeatureToggle>(
      rawItems,
      (item: AiGovernanceControlItemDto | null | undefined) => this.toFeature(item)
    ).filter((item) => item.capability.length > 0);
  }

  /** `PATCH /admin/ai/features/:feature` → item sau cập nhật */
  toToggledFeature(dto: AiGovernanceControlResponseDto | null | undefined): AiFeatureToggle {
    const data = pickField(dto, ['data'], null) as AiGovernanceControlItemDto | null;
    return this.toFeature(data);
  }

  /** `GET /admin/ai/features/audit` — Lịch sử kiểm toán */
  toAuditItem(dto: AiGovernanceControlAuditItemDto | null | undefined): AiFeatureAuditLog {
    const capability = safeString(pickField(dto, ['capability'], '')).toUpperCase();
    const reason = safeString(pickField(dto, ['reason'], ''));

    return {
      id: safeString(pickField(dto, ['id'], '')),
      capability,
      capabilityLabel: CAPABILITY_LABELS[capability] ?? capability,
      provider: safeString(pickField(dto, ['provider'], '—')),
      enabled: pickField<boolean>(dto, ['enabled'], false),
      version: safeNumber(pickField(dto, ['version'], 1)),
      actorId: safeString(pickField(dto, ['actorId'], '—')),
      reason,
      reasonLabel: REASON_LABELS[reason] ?? reason,
      createdAt: safeDate(pickField(dto, ['createdAt'], null)),
    };
  }

  toAuditList(
    dto: AiGovernanceControlAuditResponseDto | null | undefined
  ): PaginationResult<AiFeatureAuditLog> {
    const rawItems =
      (pickField(dto, ['data'], null) as (AiGovernanceControlAuditItemDto | null)[] | null) ?? [];
    const items = safeArray<AiGovernanceControlAuditItemDto | null, AiFeatureAuditLog>(
      rawItems,
      (item: AiGovernanceControlAuditItemDto | null | undefined) => this.toAuditItem(item)
    ).filter((item) => item.id.length > 0);
    const meta = pickField(dto, ['meta'], null) as AiGovernanceControlAuditResponseDto['meta'];
    return {
      items,
      metadata: meta
        ? toPageMeta(meta, items.length)
        : {
            page: 1,
            limit: 10,
            totalItems: items.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
    };
  }

  /** Chuẩn bị payload request cho `PATCH /admin/ai/features/:feature` */
  toTogglePayload(
    provider: string,
    enabled: boolean,
    expectedVersion: number,
    reason: AiToggleReason
  ): SetAiGovernanceFeatureRequestDto {
    return {
      provider,
      enabled,
      expectedVersion,
      reason,
    };
  }
}

export const aiGovernanceMapper = new AiGovernanceMapper();
