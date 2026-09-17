'use client';

import * as React from 'react';
import { Activity, AlertTriangle, Clock3, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useAiMetricsQuery } from '../queries/ai-governance.queries';

/** Tổng quan chỉ số AI: khoảng ngày + lọc tính năng, 4 cards tổng hợp. */
export function MetricsOverview() {
  // Chụp mốc ngày 1 lần lúc mount (tránh Date.now() trong render).
  const [today] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [weekAgo] = React.useState(() =>
    new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [from, setFrom] = React.useState(weekAgo);
  const [to, setTo] = React.useState(today);
  const [feature, setFeature] = React.useState('');
  const [applied, setApplied] = React.useState({ from: weekAgo, to: today, feature: '' });
  const [dateError, setDateError] = React.useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useAiMetricsQuery({
    from: applied.from,
    to: applied.to,
    ...(applied.feature ? { feature: applied.feature } : {}),
  });
  const metrics = data ?? [];
  const totals = metrics.reduce(
    (acc, metric) => ({
      requests: acc.requests + metric.requests,
      errors: acc.errors + metric.errorCount,
      fallbacks: acc.fallbacks + metric.fallbackCount,
    }),
    { requests: 0, errors: 0, fallbacks: 0 }
  );

  const apply = () => {
    if (from > to) {
      setDateError('Từ ngày phải trước hoặc bằng đến ngày.');
      return;
    }
    setDateError(null);
    setApplied({ from, to, feature: feature.trim() });
  };

  const cards = [
    { label: 'Lượt dùng', value: totals.requests.toLocaleString('vi-VN'), icon: Zap },
    { label: 'Lỗi', value: totals.errors.toLocaleString('vi-VN'), icon: AlertTriangle },
    { label: 'Dự phòng', value: totals.fallbacks.toLocaleString('vi-VN'), icon: Activity },
    {
      label: 'Độ trễ TB',
      value:
        metrics.length > 0
          ? `${Math.round(metrics.reduce((sum, m) => sum + (m.avgLatencyMs ?? 0), 0) / metrics.length)} ms`
          : '—',
      icon: Clock3,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ai-from">Từ ngày</Label>
          <Input id="ai-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ai-to">Đến ngày</Label>
          <Input id="ai-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ai-feature">Tính năng</Label>
          <Input
            id="ai-feature"
            placeholder="VD: chat (trống = tất cả)"
            value={feature}
            onChange={(e) => setFeature(e.target.value)}
          />
        </div>
        <Button onClick={apply}>Áp dụng</Button>
      </div>
      {dateError && <p className="text-xs text-destructive">{dateError}</p>}

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}
      {isError && <ErrorState title="Không tải được chỉ số." onRetry={() => void refetch()} />}
      {!isLoading && !isError && metrics.length === 0 && (
        <EmptyState
          title="Không có dữ liệu"
          description="Thử đổi khoảng ngày hoặc tính năng khác."
        />
      )}
      {!isLoading && !isError && metrics.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Card key={card.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <card.icon className="size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-xl font-bold">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
