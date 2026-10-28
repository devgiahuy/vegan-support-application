import { pickField, safeArray, safeDate, safeNumber, safeString } from '@/lib/mapper/field-helpers';
import { formatCurrency } from '@/lib/utils';
import type {
  AdminAiUsageItemDto,
  AdminAiUsageRequestDto,
  AdminAiUsageResponseDto,
  AdminRevenueDto,
  AdminRevenueRequestDto,
} from '@/features/admin-insights/types/admin-insights.dto';
import type {
  AdminRevenueStats,
  AiUsageFeature,
  AiUsageFilters,
  AiUsageOutcome,
  AiUsagePage,
  AiUsageQuotaSource,
  AiUsageRow,
  RevenueBucket,
  RevenueGranularity,
  RevenueQuery,
} from '@/features/admin-insights/types/admin-insights.model';

const timeZone = 'Asia/Ho_Chi_Minh';
const count = (value: unknown) => Math.max(0, Math.floor(safeNumber(value)));
const nullableCount = (value: unknown) =>
  value === null || value === undefined || value === '' ? null : count(value);
const format = (value: unknown, options: Intl.DateTimeFormatOptions) => {
  const date = safeDate(value);
  return date ? new Intl.DateTimeFormat('vi-VN', { timeZone, ...options }).format(date) : '—';
};
const percent = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 1 }).format(value);

const orderStatusLabels: Record<string, string> = {
  PAID: 'Đã thanh toán',
  PENDING: 'Chờ thanh toán',
  CANCELLED: 'Đã hủy',
  FAILED: 'Thất bại',
  EXPIRED: 'Hết hạn',
};
const featureLabels: Record<AiUsageFeature, string> = {
  CHAT: 'Chat AI',
  FRIDGE: 'Quét tủ lạnh',
  RECEIPT: 'Phân tích hóa đơn',
};
const outcomeLabels: Record<AiUsageOutcome, string> = {
  SPENT: 'Đã dùng',
  RELEASED: 'Đã hoàn lượt',
  HELD: 'Đang giữ',
};
const sourceLabels: Record<AiUsageQuotaSource, string> = {
  FREE_DAILY: 'Miễn phí hằng ngày',
  SUBSCRIPTION: 'Gói tiện ích (chu kỳ)',
  CREDITS: 'Lượt cộng dồn',
  NONE: 'Không tính lượt',
  UNKNOWN: 'Không rõ (dữ liệu cũ)',
};
const aiStatusLabels: Record<string, string> = {
  SUCCESS: 'Thành công',
  FALLBACK: 'Phản hồi dự phòng',
  BLOCKED: 'Bị chặn',
  FAILED: 'Lỗi',
  ABORTED: 'Đã hủy',
  IN_PROGRESS: 'Đang xử lý',
  QUEUED: 'Chờ xử lý',
  PROCESSING: 'Đang xử lý',
  READY: 'Chờ người dùng xác nhận',
  PARTIAL_FAILED: 'Lỗi một phần',
  CANCELLED: 'Đã hủy',
  CONFIRMED: 'Đã xác nhận',
};
const oneOf = <T extends string>(value: string, labels: Record<T, string>): T | 'UNKNOWN' =>
  Object.hasOwn(labels, value) ? (value as T) : 'UNKNOWN';

/** Chuyển preset UI thành khoảng thời gian gửi backend (luôn tính tới thời điểm hiện tại). */
export function toRevenueRequest(query: RevenueQuery, now = new Date()): AdminRevenueRequestDto {
  const from = new Date(now);
  if (query.preset === '7d') from.setTime(now.getTime() - 7 * 86_400_000);
  else if (query.preset === '30d') from.setTime(now.getTime() - 30 * 86_400_000);
  else from.setMonth(from.getMonth() - 12);
  return { from: from.toISOString(), to: now.toISOString(), granularity: query.granularity };
}

function bucketLabel(value: unknown, granularity: RevenueGranularity) {
  const date = safeDate(value);
  if (!date) return '—';
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  );
  if (granularity === 'month') return parts.month + '/' + parts.year;
  const label = parts.day + '/' + parts.month;
  return granularity === 'week' ? 'Tuần ' + label : label;
}

export function toRevenueStats(dto: AdminRevenueDto | null | undefined): AdminRevenueStats {
  const rawGranularity = safeString(pickField(dto?.window, ['granularity'], 'day'));
  const granularity: RevenueGranularity =
    rawGranularity === 'week' || rawGranularity === 'month' ? rawGranularity : 'day';
  const series = safeArray<NonNullable<AdminRevenueDto['series']>[number], RevenueBucket>(
    pickField(dto, ['series'], []),
    (bucket) => {
      const revenueVnd = count(pickField(bucket, ['revenueVnd'], 0));
      const start = pickField(bucket, ['bucketStart'], '');
      return {
        key: safeString(start),
        label: bucketLabel(start, granularity),
        revenueVnd,
        revenueLabel: formatCurrency(revenueVnd),
        paidOrders: count(pickField(bucket, ['paidOrders'], 0)),
      };
    }
  );
  const totalOrders = count(pickField(dto?.statuses, ['total'], 0));
  const rate: unknown = pickField(dto?.statuses, ['successRate'], null);
  const average = nullableCount(pickField(dto?.overview, ['averageOrderVnd'], null));
  const dateOnly: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };
  return {
    windowLabel:
      format(pickField(dto?.window, ['from'], null), dateOnly) +
      ' – ' +
      format(pickField(dto?.window, ['to'], null), dateOnly),
    revenueLabel: formatCurrency(count(pickField(dto?.overview, ['revenueVnd'], 0))),
    paidOrders: count(pickField(dto?.overview, ['paidOrders'], 0)),
    buyers: count(pickField(dto?.overview, ['buyers'], 0)),
    averageOrderLabel: average === null ? '—' : formatCurrency(average),
    series,
    maxBucketRevenue: series.reduce((max, bucket) => Math.max(max, bucket.revenueVnd), 0),
    totalOrders,
    successRateLabel:
      rate === null || rate === undefined ? '—' : percent(Math.min(1, safeNumber(rate))),
    statuses: safeArray<
      NonNullable<NonNullable<AdminRevenueDto['statuses']>['counts']>[number],
      AdminRevenueStats['statuses'][number]
    >(pickField(dto?.statuses, ['counts'], []), (row) => {
      const status = safeString(pickField(row, ['status'], ''));
      const rowCount = count(pickField(row, ['count'], 0));
      return {
        status,
        label: orderStatusLabels[status] ?? 'Khác',
        count: rowCount,
        shareLabel: totalOrders ? percent(rowCount / totalOrders) : '—',
      };
    }),
  };
}

/** Bộ lọc UI → query backend; ngày `yyyy-mm-dd` hiểu theo giờ Việt Nam, `to` gồm cả ngày đó. */
export function toAiUsageRequest(
  filters: AiUsageFilters,
  page: number,
  limit = 20
): AdminAiUsageRequestDto {
  const user = filters.user.trim();
  return {
    page,
    limit,
    ...(filters.feature !== 'ALL' ? { feature: filters.feature } : {}),
    ...(filters.outcome !== 'ALL' ? { outcome: filters.outcome } : {}),
    ...(user ? { user: user.slice(0, 120) } : {}),
    ...(filters.from ? { from: new Date(filters.from + 'T00:00:00+07:00').toISOString() } : {}),
    ...(filters.to ? { to: new Date(filters.to + 'T23:59:59.999+07:00').toISOString() } : {}),
  };
}

function toAiUsageRow(dto: AdminAiUsageItemDto): AiUsageRow {
  const feature = oneOf(safeString(pickField(dto, ['feature'], '')), featureLabels);
  const outcome = oneOf(safeString(pickField(dto, ['outcome'], '')), outcomeLabels);
  const quotaSource: AiUsageQuotaSource = oneOf(
    safeString(pickField(dto, ['quotaSource'], '')),
    sourceLabels
  );
  const aiStatus = safeString(pickField(dto, ['aiStatus'], ''));
  const provider = safeString(pickField(dto, ['provider'], ''));
  const modelId = safeString(pickField(dto, ['modelId'], ''));
  const input = nullableCount(pickField(dto, ['inputTokens'], null));
  const output = nullableCount(pickField(dto, ['outputTokens'], null));
  const latency = nullableCount(pickField(dto, ['latencyMs'], null));
  const errorCode = safeString(pickField(dto, ['errorCode'], ''));
  return {
    id: safeString(pickField(dto, ['id'], '')),
    feature,
    featureLabel: feature === 'UNKNOWN' ? 'Khác' : featureLabels[feature],
    occurredAtLabel: format(pickField(dto, ['occurredAt'], null), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    userName: safeString(pickField(dto?.user, ['displayName'], '')) || 'Tài khoản đã xóa',
    userEmail: safeString(pickField(dto?.user, ['email'], '')),
    quotaSource,
    quotaSourceLabel: sourceLabels[quotaSource],
    quotaCharged: count(pickField(dto, ['quotaCharged'], 0)),
    outcome,
    outcomeLabel: outcome === 'UNKNOWN' ? 'Không rõ' : outcomeLabels[outcome],
    aiStatusLabel: aiStatus ? (aiStatusLabels[aiStatus] ?? aiStatus) : '—',
    providerLabel: provider ? provider + (modelId ? ' / ' + modelId : '') : '—',
    tokensLabel: input === null && output === null ? '—' : (input ?? 0) + ' / ' + (output ?? 0),
    latencyLabel: latency === null ? '—' : latency + ' ms',
    errorCode: errorCode || null,
  };
}

export function toAiUsagePage(dto: AdminAiUsageResponseDto | null | undefined): AiUsagePage {
  return {
    items: safeArray<AdminAiUsageItemDto, AiUsageRow>(pickField(dto, ['data'], []), toAiUsageRow),
    page: Math.max(1, count(pickField(dto?.meta, ['page'], 1))),
    totalPages: count(pickField(dto?.meta, ['totalPages'], 0)),
    total: count(pickField(dto?.meta, ['total'], 0)),
  };
}
