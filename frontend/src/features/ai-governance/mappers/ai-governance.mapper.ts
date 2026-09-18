import { BaseMapper, pickField, safeArray, safeDate, safeNumber, safeString } from '@/lib/mapper';
import type { PaginationResult } from '@/types/api';
import type {
  AiFeatureDto,
  AiFeatureListResponseDto,
  AiFlagDto,
  AiFlagListResponseDto,
  AiMetricDto,
  AiMetricsResponseDto,
  AiRequestListResponseDto,
  AiRequestLogDto,
  ToggleFeatureRequestDto,
  ToggleFeatureResponseDto,
} from '../types/ai-governance.dto';
import type { AiFeatureToggle, AiFlag, AiMetric, AiRequestLog } from '../types/ai-governance.model';

const LOG_STATUS_LABELS: Record<string, string> = {
  OK: 'Thành công',
  FALLBACK: 'Dự phòng',
  ERROR: 'Lỗi',
};

const FLAG_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Đang mở',
  REVIEWED: 'Đã xem',
  DISMISSED: 'Đã bỏ qua',
};

function emptyPageMeta() {
  return { page: 1, limit: 10, totalItems: 0, totalPages: 0 };
}

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
 * AiGovernanceMapper: metrics, logs che mờ, flags, toggles.
 * REDACTION: chỉ pick field cho phép — mọi field tên gợi nội dung thô
 * (`prompt`, `content`, `rawInput`, `profile`, `messages`) KHÔNG BAO GIỜ
 * được đọc, kể cả khi BE lỡ trả. Envelope đọc trực tiếp.
 */
export class AiGovernanceMapper extends BaseMapper<AiMetricDto, AiMetric> {
  toModel(dto: AiMetricDto | null | undefined): AiMetric {
    return {
      date: safeString(pickField(dto, ['date'], '')),
      feature: safeString(pickField(dto, ['feature'], '')),
      requests: safeNumber(pickField(dto, ['requests'], 0)),
      errorCount: safeNumber(pickField(dto, ['errorCount'], 0)),
      errorRate: safeNumber(pickField(dto, ['errorRate'], 0)),
      fallbackCount: safeNumber(pickField(dto, ['fallbackCount'], 0)),
      fallbackRate: safeNumber(pickField(dto, ['fallbackRate'], 0)),
      avgLatencyMs: (() => {
        const raw = pickField(dto, ['avgLatencyMs'], null) as unknown;
        if (raw === null || raw === undefined) return null;
        const parsed = safeNumber(raw, NaN);
        return Number.isNaN(parsed) ? null : parsed;
      })(),
    };
  }

  /** `GET /admin/ai/metrics` — mảng chỉ số. */
  toMetricsList(dto: AiMetricsResponseDto | null | undefined): AiMetric[] {
    const rawItems = pickField(dto, ['data'], null) as (AiMetricDto | null)[] | null;
    return this.toModelList(
      safeArray<AiMetricDto | null, AiMetricDto | null>(rawItems, (item) => item)
    );
  }

  toRequestLog(dto: AiRequestLogDto | null | undefined): AiRequestLog {
    const status = safeString(pickField(dto, ['status'], 'OK')).toUpperCase();
    const hash = safeString(pickField(dto, ['promptHash', 'prompt_hash'], ''));
    return {
      id: safeString(pickField(dto, ['id'], '')),
      promptHash: hash.length > 12 ? `${hash.slice(0, 12)}…` : hash,
      topicCodes: safeArray<string | null, string>(pickField(dto, ['topicCodes'], null), (code) =>
        safeString(code)
      ).filter((code) => code.length > 0),
      provider: safeString(pickField(dto, ['provider'], '')),
      modelId: safeString(pickField(dto, ['modelId', 'model_id'], '')),
      latencyMs: (() => {
        const raw = pickField(dto, ['latencyMs'], null) as unknown;
        if (raw === null || raw === undefined) return null;
        const parsed = safeNumber(raw, NaN);
        return Number.isNaN(parsed) ? null : parsed;
      })(),
      tokens: (() => {
        const raw = pickField(dto, ['tokens'], null) as unknown;
        if (raw === null || raw === undefined) return null;
        const parsed = safeNumber(raw, NaN);
        return Number.isNaN(parsed) ? null : parsed;
      })(),
      status,
      statusLabel: LOG_STATUS_LABELS[status] ?? status,
      createdAt: safeDate(pickField(dto, ['createdAt', 'created_at'], null)),
    };
  }

  /** `GET /admin/ai/requests` — log che mờ + meta. */
  toRequestsList(dto: AiRequestListResponseDto | null | undefined): PaginationResult<AiRequestLog> {
    const rawItems = pickField(dto, ['data'], null) as (AiRequestLogDto | null)[] | null;
    const items = safeArray<AiRequestLogDto | null, AiRequestLog>(rawItems, (item) =>
      this.toRequestLog(item)
    ).filter((item) => item.id.length > 0);
    const meta = pickField(dto, ['meta'], null) as AiRequestListResponseDto['meta'];
    return {
      items,
      metadata: meta
        ? toPageMeta(meta, items.length)
        : { ...emptyPageMeta(), totalItems: items.length },
    };
  }

  toFlag(dto: AiFlagDto | null | undefined): AiFlag {
    const status = safeString(pickField(dto, ['status'], 'OPEN')).toUpperCase();
    return {
      id: safeString(pickField(dto, ['id'], '')),
      kind: safeString(pickField(dto, ['kind'], '')),
      target: safeString(pickField(dto, ['target'], '')),
      status,
      statusLabel: FLAG_STATUS_LABELS[status] ?? status,
      createdAt: safeDate(pickField(dto, ['createdAt', 'created_at'], null)),
    };
  }

  /** `GET /admin/ai/flags` — mảng cờ. */
  toFlagsList(dto: AiFlagListResponseDto | null | undefined): AiFlag[] {
    const rawItems = pickField(dto, ['data'], null) as (AiFlagDto | null)[] | null;
    return safeArray<AiFlagDto | null, AiFlag>(rawItems, (item) => this.toFlag(item)).filter(
      (item) => item.id.length > 0
    );
  }

  toFeature(dto: AiFeatureDto | null | undefined): AiFeatureToggle {
    return {
      feature: safeString(pickField(dto, ['feature'], '')),
      featureLabel: safeString(pickField(dto, ['feature'], '')),
      enabled: pickField<boolean>(dto, ['enabled'], false),
      provider: safeString(pickField(dto, ['provider'], '')),
      modelId: safeString(pickField(dto, ['modelId', 'model_id'], '')),
      updatedBy: safeString(pickField(dto, ['updatedBy', 'updated_by'], '')) || null,
      updatedAt: safeDate(pickField(dto, ['updatedAt', 'updated_at'], null)),
      updateReason: safeString(pickField(dto, ['updateReason'], '')) || null,
    };
  }

  /** `GET /admin/ai/features` — mảng công tắc. */
  toFeaturesList(dto: AiFeatureListResponseDto | null | undefined): AiFeatureToggle[] {
    const rawItems = pickField(dto, ['data'], null) as (AiFeatureDto | null)[] | null;
    return safeArray<AiFeatureDto | null, AiFeatureToggle>(rawItems, (item) =>
      this.toFeature(item)
    ).filter((item) => item.feature.length > 0);
  }

  /** `PATCH /admin/ai/features/:feature` → item sau đổi. */
  toToggledFeature(dto: ToggleFeatureResponseDto | null | undefined): AiFeatureToggle {
    const data = pickField(dto, ['data'], null) as AiFeatureDto | null;
    return this.toFeature(data);
  }

  toToggleDto(enabled: boolean, reason: string): ToggleFeatureRequestDto {
    return { enabled, reason };
  }
}

export const aiGovernanceMapper = new AiGovernanceMapper();
