import type { ReviewNutritionMetric, ReviewNutritionMetricKey, ReviewNutritionOverrideValues } from '../types/review-nutrition.model';

export type NutritionDrafts = Partial<Record<ReviewNutritionMetricKey, string>>;

const MAX_METRIC_VALUE = 100_000;

/** Ô trống = bỏ giá trị sửa tay; số không âm và nhỏ hơn 100.000 = hợp lệ; còn lại = 'invalid'. */
export function parseNutritionDraft(raw: string | undefined): number | null | 'invalid' {
  if (raw === undefined) return 'invalid';
  const trimmed = raw.trim().replace(',', '.');
  if (trimmed === '') return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 && value < MAX_METRIC_VALUE ? value : 'invalid';
}

export function initialNutritionDrafts(metrics: ReviewNutritionMetric[]): NutritionDrafts {
  return Object.fromEntries(metrics.map((metric) => [metric.key, metric.finalValue === null ? '' : String(metric.finalValue)]));
}

/** So form với panel hiện tại: chỉ trả về các chỉ số thật sự đổi (số = sửa tay, null = bỏ sửa tay). */
export function diffNutritionDrafts(
  metrics: ReviewNutritionMetric[],
  drafts: NutritionDrafts
): { changes: ReviewNutritionOverrideValues; hasInvalid: boolean } {
  const changes: ReviewNutritionOverrideValues = {};
  let hasInvalid = false;
  for (const metric of metrics) {
    const parsed = parseNutritionDraft(drafts[metric.key]);
    if (parsed === 'invalid') {
      hasInvalid = true;
      continue;
    }
    // Ô để trống: chỉ bỏ sửa tay nếu đang có, không tạo giá trị rỗng mới.
    if (parsed === null) {
      if (metric.override) changes[metric.key] = null;
      continue;
    }
    if (parsed !== metric.finalValue) changes[metric.key] = parsed;
  }
  return { changes, hasInvalid };
}

export function formatNutritionNumber(value: number | null, maximumFractionDigits = 2): string {
  if (value === null) return '—';
  const factor = 10 ** maximumFractionDigits;
  return String(Math.round(value * factor) / factor).replace('.', ',');
}

export function formatNutritionValue(value: number | null, unit: string): string {
  return value === null ? '—' : `${formatNutritionNumber(value, unit === 'kcal' ? 0 : 2)} ${unit}`;
}
