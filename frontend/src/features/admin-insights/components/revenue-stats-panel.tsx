'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useAdminRevenueQuery } from '@/features/admin-insights/queries/admin-insights.queries';
import type {
  AdminRevenueStats,
  RevenueGranularity,
  RevenueRangePreset,
} from '@/features/admin-insights/types/admin-insights.model';

const presets: { value: RevenueRangePreset; label: string; granularity: RevenueGranularity }[] = [
  { value: '7d', label: '7 ngày', granularity: 'day' },
  { value: '30d', label: '30 ngày', granularity: 'day' },
  { value: '12m', label: '12 tháng', granularity: 'month' },
];
const granularities: { value: RevenueGranularity; label: string }[] = [
  { value: 'day', label: 'Ngày' },
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
];

function RevenueChart({ stats }: { stats: AdminRevenueStats }) {
  if (stats.maxBucketRevenue === 0) {
    return (
      <EmptyState
        title="Chưa có doanh thu trong khoảng này"
        description="Chưa có đơn mua gói nào được thanh toán trong khoảng thời gian đã chọn."
      />
    );
  }
  const first = stats.series[0];
  const last = stats.series[stats.series.length - 1];
  return (
    <figure className="flex flex-col gap-2">
      <TooltipProvider>
        <div className="flex h-48 items-end gap-0.5 border-b" aria-hidden="true">
          {stats.series.map((bucket) => (
            <Tooltip key={bucket.key}>
              <TooltipTrigger asChild>
                <div className="flex h-full min-w-0 flex-1 items-end hover:bg-muted/60">
                  <div
                    className="w-full rounded-t bg-primary"
                    style={{ height: (bucket.revenueVnd / stats.maxBucketRevenue) * 100 + '%' }}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{bucket.label}</p>
                <p className="tabular-nums">
                  {bucket.revenueLabel} · {bucket.paidOrders} đơn
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>{first?.label}</span>
        <span>{last?.label}</span>
      </div>
      <figcaption className="sr-only">Doanh thu theo thời gian</figcaption>
      <table className="sr-only">
        <thead>
          <tr>
            <th>Mốc thời gian</th>
            <th>Doanh thu</th>
            <th>Số đơn</th>
          </tr>
        </thead>
        <tbody>
          {stats.series.map((bucket) => (
            <tr key={bucket.key}>
              <td>{bucket.label}</td>
              <td>{bucket.revenueLabel}</td>
              <td>{bucket.paidOrders}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Thống kê doanh thu mua gói/quota AI: tổng quan, theo thời gian và trạng thái đơn. */
export function RevenueStatsPanel() {
  const [preset, setPreset] = React.useState<RevenueRangePreset>('30d');
  const [granularity, setGranularity] = React.useState<RevenueGranularity>('day');
  const { data, isLoading, isError, refetch } = useAdminRevenueQuery({ preset, granularity });

  return (
    <section className="flex flex-col gap-4" aria-labelledby="revenue-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="revenue-title" className="text-balance text-lg font-semibold">
            Doanh thu mua quota AI
          </h2>
          <p className="text-pretty text-sm text-muted-foreground">
            Tính theo thời điểm thanh toán, giờ Việt Nam. Không gồm đơn mô phỏng cũ.
            {data ? ' Khoảng: ' + data.windowLabel + '.' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={preset}
            aria-label="Khoảng thời gian"
            onValueChange={(value) => {
              const next = presets.find((item) => item.value === value);
              if (!next) return;
              setPreset(next.value);
              setGranularity(next.granularity);
            }}
          >
            {presets.map((item) => (
              <ToggleGroupItem key={item.value} value={item.value}>
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={granularity}
            aria-label="Nhóm theo"
            onValueChange={(value) => {
              const next = granularities.find((item) => item.value === value);
              if (next) setGranularity(next.value);
            }}
          >
            {granularities.map((item) => (
              <ToggleGroupItem key={item.value} value={item.value}>
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((id) => (
            <Skeleton key={id} className="h-24 rounded-xl" />
          ))}
          <Skeleton className="h-56 rounded-xl sm:col-span-2 lg:col-span-4" />
        </div>
      ) : isError || !data ? (
        <ErrorState title="Không tải được thống kê doanh thu." onRetry={() => void refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Tổng doanh thu', value: data.revenueLabel },
              { label: 'Đơn đã thanh toán', value: String(data.paidOrders) },
              { label: 'Người mua', value: String(data.buyers) },
              { label: 'Giá trị đơn trung bình', value: data.averageOrderLabel },
            ].map((tile) => (
              <Card key={tile.label}>
                <CardHeader>
                  <CardDescription>{tile.label}</CardDescription>
                  <CardTitle className="tabular-nums text-xl">{tile.value}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Doanh thu theo thời gian</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart stats={data} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trạng thái đơn</CardTitle>
                <CardDescription className="tabular-nums">
                  {data.totalOrders} đơn tạo trong khoảng · Tỉ lệ thanh toán {data.successRateLabel}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="flex flex-col divide-y text-sm">
                  {data.statuses.map((row) => (
                    <div key={row.status} className="flex items-center justify-between py-2">
                      <dt>{row.label}</dt>
                      <dd className="tabular-nums text-muted-foreground">
                        <span className="font-medium text-foreground">{row.count}</span> ·{' '}
                        {row.shareLabel}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </section>
  );
}
