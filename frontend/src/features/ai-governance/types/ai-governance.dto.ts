/**
 * DTO AI governance (SUY LUẬN — không có schema swagger, BE còn `PLANNED`).
 * Mọi field optional + `TODO(BE-READY)` reconfirm shape ở task nối live.
 * Envelope `{success, data, meta}` dùng trực tiếp khi nối live.
 */

/** Chỉ số theo ngày/tính năng (thô, suy luận). */
export interface AiMetricDto {
  date?: string;
  feature?: string;
  requests?: number | string;
  errorCount?: number | string;
  errorRate?: number | string;
  fallbackCount?: number | string;
  fallbackRate?: number | string;
  avgLatencyMs?: number | string | null;
}

/** `GET /admin/ai/metrics` (suy luận). */
export interface AiMetricsResponseDto {
  success?: boolean;
  data?: (AiMetricDto | null)[] | null;
  meta?: null;
}

/** Log che mờ (thô, suy luận) — KHÔNG BAO GIỜ có nội dung thô. */
export interface AiRequestLogDto {
  id?: string;
  promptHash?: string;
  prompt_hash?: string;
  topicCodes?: (string | null)[] | null;
  provider?: string;
  modelId?: string;
  model_id?: string;
  latencyMs?: number | string | null;
  tokens?: number | string | null;
  status?: string;
  createdAt?: string;
  created_at?: string;
}

/** `GET /admin/ai/requests` (suy luận). */
export interface AiRequestListResponseDto {
  success?: boolean;
  data?: (AiRequestLogDto | null)[] | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    total_pages?: number;
  } | null;
}

/** Cờ kiểm tra (thô, suy luận). */
export interface AiFlagDto {
  id?: string;
  kind?: string;
  target?: string;
  status?: string;
  createdAt?: string;
  created_at?: string;
}

/** `GET /admin/ai/flags` (suy luận). */
export interface AiFlagListResponseDto {
  success?: boolean;
  data?: (AiFlagDto | null)[] | null;
  meta?: null;
}

/** Công tắc tính năng (thô, suy luận). */
export interface AiFeatureDto {
  feature?: string;
  enabled?: boolean;
  provider?: string;
  modelId?: string;
  model_id?: string;
  updatedBy?: string | null;
  updated_by?: string | null;
  updatedAt?: string | null;
  updated_at?: string | null;
  updateReason?: string | null;
}

/** `GET /admin/ai/features` (suy luận). */
export interface AiFeatureListResponseDto {
  success?: boolean;
  data?: (AiFeatureDto | null)[] | null;
  meta?: null;
}

/** `PATCH /admin/ai/features/:feature` — `enabled` + `reason` bắt buộc. */
export interface ToggleFeatureRequestDto {
  enabled: boolean;
  reason: string;
}

/** `PATCH /admin/ai/features/:feature` (suy luận). */
export interface ToggleFeatureResponseDto {
  success?: boolean;
  data?: AiFeatureDto | null;
  meta?: null;
}
