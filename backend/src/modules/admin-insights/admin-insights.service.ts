import type { PrismaClient } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import type {
  RevenueGranularity,
  RevenueQuery,
  UsageQuery,
  UsageTraceItem,
} from './admin-insights.schemas.js';

const day = 86_400_000;
// Asia/Ho_Chi_Minh has no daylight saving time, so buckets use a fixed UTC+7 offset.
const timezone = 'Asia/Ho_Chi_Minh';
const offsetMs = 7 * 3_600_000;
const maxWindowDays = 731;
const orderStatuses = ['PENDING', 'PAID', 'CANCELLED', 'FAILED', 'EXPIRED'] as const;
// Simulated sandbox orders never moved money and are excluded from revenue statistics.
const realProviders = { $ne: 'sandbox' };

type Row = Record<string, unknown>;
type Outcome = 'HELD' | 'SPENT' | 'RELEASED';

function windowError(): AppError {
  return new AppError({
    statusCode: 422,
    code: 'ADMIN_STATS_WINDOW_INVALID',
    message: 'Khoảng thời gian phải theo thứ tự và không quá 731 ngày.',
  });
}

function statsWindow(query: { from?: string | undefined; to?: string | undefined }) {
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from ? new Date(query.from) : new Date(to.getTime() - 30 * day);
  if (from >= to || to.getTime() - from.getTime() > maxWindowDays * day) throw windowError();
  return { from, to };
}

const mongoDate = (date: Date) => ({ $date: date.toISOString() });

function rows(value: unknown): Row[] {
  return Array.isArray(value)
    ? value.filter((item): item is Row => Boolean(item) && typeof item === 'object')
    : [];
}

function num(value: unknown): number {
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object') {
    const wrapped = Object.values(value as Row)[0];
    if (typeof wrapped === 'string' || typeof wrapped === 'number') return Number(wrapped);
  }
  return 0;
}

function text(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && '$oid' in value) return String(value.$oid);
  return '';
}

/** Start of the local (UTC+7) day/week/month bucket that contains `date`, as a UTC instant. */
export function bucketStart(date: Date, granularity: RevenueGranularity): Date {
  const local = new Date(date.getTime() + offsetMs);
  let start = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    granularity === 'month' ? 1 : local.getUTCDate(),
  );
  if (granularity === 'week') start -= ((new Date(start).getUTCDay() + 6) % 7) * day;
  return new Date(start - offsetMs);
}

function nextBucket(start: Date, granularity: RevenueGranularity): Date {
  if (granularity === 'day') return new Date(start.getTime() + day);
  if (granularity === 'week') return new Date(start.getTime() + 7 * day);
  const local = new Date(start.getTime() + offsetMs);
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 1) - offsetMs);
}

function chatOutcome(status: string | null | undefined): Outcome {
  if (status === 'IN_PROGRESS') return 'HELD';
  return status === 'SUCCESS' ? 'SPENT' : 'RELEASED';
}

export class AdminInsightsService {
  constructor(private readonly db: PrismaClient) {}

  async revenue(query: RevenueQuery) {
    const { from, to } = statsWindow(query);
    const paidMatch = {
      status: 'PAID',
      provider: realProviders,
      paid_at: { $gte: mongoDate(from), $lte: mongoDate(to) },
    };
    const [summaryRaw, dailyRaw, statusRaw] = await Promise.all([
      this.db.paymentOrder.aggregateRaw({
        pipeline: [
          { $match: paidMatch },
          {
            $group: {
              _id: null,
              revenue: { $sum: '$price_vnd' },
              orders: { $sum: 1 },
              buyers: { $addToSet: '$owner_id' },
            },
          },
          { $project: { revenue: 1, orders: 1, buyers: { $size: '$buyers' } } },
        ],
      }),
      // Daily local buckets are rolled up below so week/month boundaries share one definition.
      this.db.paymentOrder.aggregateRaw({
        pipeline: [
          { $match: paidMatch },
          {
            $group: {
              _id: { $dateToString: { date: '$paid_at', format: '%Y-%m-%d', timezone } },
              revenue: { $sum: '$price_vnd' },
              orders: { $sum: 1 },
            },
          },
        ],
      }),
      this.db.paymentOrder.aggregateRaw({
        pipeline: [
          {
            $match: {
              provider: realProviders,
              created_at: { $gte: mongoDate(from), $lte: mongoDate(to) },
            },
          },
          {
            $group: {
              _id: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', 'PENDING'] },
                      { $lte: ['$expires_at', mongoDate(new Date())] },
                    ],
                  },
                  'EXPIRED',
                  '$status',
                ],
              },
              count: { $sum: 1 },
            },
          },
        ],
      }),
    ]);

    const summary = rows(summaryRaw)[0];
    const revenueVnd = num(summary?.revenue);
    const paidOrders = num(summary?.orders);

    const totals = new Map<number, { revenueVnd: number; paidOrders: number }>();
    for (let start = bucketStart(from, query.granularity); start <= to;) {
      totals.set(start.getTime(), { revenueVnd: 0, paidOrders: 0 });
      start = nextBucket(start, query.granularity);
    }
    for (const row of rows(dailyRaw)) {
      const localDay = new Date(text(row._id) + 'T00:00:00+07:00');
      if (Number.isNaN(localDay.getTime())) continue;
      const bucket = totals.get(bucketStart(localDay, query.granularity).getTime());
      if (!bucket) continue;
      bucket.revenueVnd += num(row.revenue);
      bucket.paidOrders += num(row.orders);
    }

    const counts = new Map<string, number>(
      rows(statusRaw).map((row) => [text(row._id), num(row.count)]),
    );
    const total = [...counts.values()].reduce((sum, count) => sum + count, 0);
    return {
      window: {
        from: from.toISOString(),
        to: to.toISOString(),
        granularity: query.granularity,
        timezone,
      },
      currency: 'VND' as const,
      overview: {
        revenueVnd,
        paidOrders,
        buyers: num(summary?.buyers),
        averageOrderVnd: paidOrders ? Math.round(revenueVnd / paidOrders) : null,
      },
      series: [...totals].map(([start, bucket]) => ({
        bucketStart: new Date(start).toISOString(),
        ...bucket,
      })),
      statuses: {
        total,
        counts: orderStatuses.map((status) => ({ status, count: counts.get(status) ?? 0 })),
        successRate: total ? (counts.get('PAID') ?? 0) / total : null,
      },
    };
  }

  async usage(query: UsageQuery) {
    const { page, limit } = query;
    const empty = { data: [], meta: { page, limit, total: 0, totalPages: 0 } };
    const from = query.from ? new Date(query.from) : null;
    const to = query.to ? new Date(query.to) : null;
    if (from && to && from > to) throw windowError();
    let userIds: string[] | null = null;
    if (query.user) {
      const users = await this.db.user.findMany({
        where: {
          OR: [
            { email: { contains: query.user, mode: 'insensitive' } },
            { displayName: { contains: query.user, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
        take: 500,
      });
      if (!users.length) return empty;
      userIds = users.map((user) => user.id);
    }
    const createdAt =
      from || to
        ? {
            created_at: {
              ...(from ? { $gte: mongoDate(from) } : {}),
              ...(to ? { $lte: mongoDate(to) } : {}),
            },
          }
        : {};
    const owner = (field: string) => (userIds ? { [field]: { $in: userIds } } : {});
    const reservationFeatures = query.feature
      ? query.feature === 'CHAT'
        ? []
        : [query.feature]
      : ['FRIDGE', 'RECEIPT'];
    // Paid chat units are reached through the chat request log, so chat reservations are not
    // listed twice. Prompts and payloads are never selected.
    const chatRows = {
      $unionWith: {
        coll: 'ai_request_logs',
        pipeline: [
          { $match: { user_id: { $type: 'string' }, ...owner('user_id'), ...createdAt } },
          {
            $lookup: {
              from: 'usage_reservations',
              localField: 'usage_resource_key',
              foreignField: 'resource_key',
              as: 'reservation',
            },
          },
          {
            $project: {
              _id: 0,
              kind: { $literal: 'CHAT' },
              ref: '$_id',
              at: '$created_at',
              outcome: {
                $ifNull: [
                  { $first: '$reservation.status' },
                  {
                    $switch: {
                      branches: [
                        { case: { $eq: ['$status', 'IN_PROGRESS'] }, then: 'HELD' },
                        { case: { $eq: ['$status', 'SUCCESS'] }, then: 'SPENT' },
                      ],
                      default: 'RELEASED',
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    };
    const raw = await this.db.usageReservation.aggregateRaw({
      pipeline: [
        { $match: { feature: { $in: reservationFeatures }, ...owner('owner_id'), ...createdAt } },
        {
          $project: {
            _id: 0,
            kind: { $literal: 'RESERVATION' },
            ref: '$_id',
            at: '$created_at',
            outcome: '$status',
          },
        },
        ...(query.feature && query.feature !== 'CHAT' ? [] : [chatRows]),
        ...(query.outcome ? [{ $match: { outcome: query.outcome } }] : []),
        { $sort: { at: -1, ref: -1 } },
        {
          $facet: {
            items: [{ $skip: (page - 1) * limit }, { $limit: limit }],
            total: [{ $count: 'n' }],
          },
        },
      ],
    });
    const facet = rows(raw)[0];
    const total = num(rows(facet?.total)[0]?.n);
    const refs = rows(facet?.items).map((row) => ({ kind: text(row.kind), ref: text(row.ref) }));
    const reservationIds = refs.filter((row) => row.kind === 'RESERVATION').map((row) => row.ref);
    const logIds = refs.filter((row) => row.kind === 'CHAT').map((row) => row.ref);

    const [reservations, logs] = await Promise.all([
      this.db.usageReservation.findMany({ where: { id: { in: reservationIds } } }),
      this.db.aiRequestLog.findMany({
        where: { id: { in: logIds } },
        select: {
          id: true,
          userId: true,
          status: true,
          provider: true,
          modelId: true,
          inputTokens: true,
          outputTokens: true,
          latencyMs: true,
          errorCode: true,
          quotaSource: true,
          usageResourceKey: true,
          createdAt: true,
        },
      }),
    ]);
    const jobId = (resourceKey: string) => resourceKey.split(':')[1] ?? '';
    const chatKeys = logs.flatMap((log) => (log.usageResourceKey ? [log.usageResourceKey] : []));
    const [chatReservations, fridgeJobs, receiptJobs, users] = await Promise.all([
      this.db.usageReservation.findMany({ where: { resourceKey: { in: chatKeys } } }),
      this.db.recognitionJob.findMany({
        where: {
          id: {
            in: reservations.filter((r) => r.feature === 'FRIDGE').map((r) => jobId(r.resourceKey)),
          },
        },
        select: { id: true, status: true, provider: true, modelId: true, errorCode: true },
      }),
      this.db.receiptJob.findMany({
        where: {
          id: {
            in: reservations
              .filter((r) => r.feature === 'RECEIPT')
              .map((r) => jobId(r.resourceKey)),
          },
        },
        select: { id: true, status: true, provider: true, modelId: true, errorCode: true },
      }),
      this.db.user.findMany({
        where: {
          id: {
            in: [
              ...new Set([
                ...reservations.map((r) => r.ownerId),
                ...logs.flatMap((log) => (log.userId ? [log.userId] : [])),
              ]),
            ],
          },
        },
        select: { id: true, displayName: true, email: true },
      }),
    ]);
    const byId = <T extends { id: string }>(items: T[]) => new Map(items.map((i) => [i.id, i]));
    const reservationMap = byId(reservations);
    const logMap = byId(logs);
    const jobs = byId([...fridgeJobs, ...receiptJobs]);
    const userMap = byId(users);
    const chatReservationMap = new Map(chatReservations.map((r) => [r.resourceKey, r]));
    const charged = (status: string) => (status === 'RELEASED' ? 0 : 1);

    const data = refs.flatMap(({ kind, ref }): UsageTraceItem[] => {
      if (kind === 'RESERVATION') {
        const reservation = reservationMap.get(ref);
        if (!reservation) return [];
        const job = jobs.get(jobId(reservation.resourceKey));
        return [
          {
            id: 'usage:' + reservation.id,
            feature: reservation.feature as UsageTraceItem['feature'],
            occurredAt: reservation.createdAt.toISOString(),
            user: userMap.get(reservation.ownerId) ?? null,
            quotaSource: (reservation.source ?? 'CREDITS') as UsageTraceItem['quotaSource'],
            quotaCharged: charged(reservation.status),
            outcome: reservation.status,
            aiStatus: job?.status ?? null,
            provider: job?.provider ?? null,
            modelId: job?.modelId ?? null,
            inputTokens: null,
            outputTokens: null,
            latencyMs: null,
            errorCode: job?.errorCode ?? null,
          },
        ];
      }
      const log = logMap.get(ref);
      if (!log) return [];
      const reservation =
        log.quotaSource === 'ENTITLEMENT' && log.usageResourceKey
          ? chatReservationMap.get(log.usageResourceKey)
          : undefined;
      const quotaSource =
        log.quotaSource === 'FREE'
          ? ('FREE_DAILY' as const)
          : log.quotaSource === 'NONE'
            ? ('NONE' as const)
            : log.quotaSource === 'ENTITLEMENT'
              ? ((reservation?.source ?? 'CREDITS') as UsageTraceItem['quotaSource'])
              : ('UNKNOWN' as const);
      return [
        {
          id: 'chat:' + log.id,
          feature: 'CHAT' as const,
          occurredAt: log.createdAt.toISOString(),
          user: (log.userId && userMap.get(log.userId)) || null,
          quotaSource,
          quotaCharged: reservation ? charged(reservation.status) : 0,
          outcome: reservation?.status ?? chatOutcome(log.status),
          aiStatus: log.status,
          provider: log.provider,
          modelId: log.modelId,
          inputTokens: log.inputTokens,
          outputTokens: log.outputTokens,
          latencyMs: log.latencyMs,
          errorCode: log.errorCode,
        },
      ];
    });
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
