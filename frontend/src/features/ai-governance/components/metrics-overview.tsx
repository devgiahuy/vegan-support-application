'use client';

import * as React from 'react';
import {
  Activity,
  AlertTriangle,
  Clock3,
  FileSpreadsheet,
  ScanEye,
  Sparkles,
  ThumbsUp,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useAiMetricsQuery } from '../queries/ai-governance.queries';

const CAPABILITY_FILTER_OPTIONS = [
  { value: 'ALL', label: 'Tất cả tính năng' },
  { value: 'CHAT', label: 'Trợ lý Dinh dưỡng (Chat)' },
  { value: 'MODERATION', label: 'Kiểm duyệt An toàn' },
  { value: 'NUTRITION', label: 'Ước tính Dinh dưỡng' },
  { value: 'VISION', label: 'Nhận diện Tủ lạnh (Vision)' },
  { value: 'RECEIPT', label: 'Bóc tách Hóa đơn' },
  { value: 'VERIFICATION', label: 'Kiểm chứng Tri thức AI' },
];

/**
 * Tổng quan chỉ số AI: lọc khoảng ngày (tối đa 90 ngày) + tính năng,
 * hiển thị các thẻ KPI và chi tiết chất lượng.
 */
export function MetricsOverview() {
  const [today] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [weekAgo] = React.useState(() =>
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  const [from, setFrom] = React.useState(weekAgo);
  const [to, setTo] = React.useState(today);
  const [capability, setCapability] = React.useState('ALL');
  const [applied, setApplied] = React.useState({ from: weekAgo, to: today, capability: 'ALL' });
  const [dateError, setDateError] = React.useState<string | null>(null);

  const {
    data: metrics,
    isLoading,
    isError,
    refetch,
  } = useAiMetricsQuery({
    from: applied.from,
    to: applied.to,
    ...(applied.capability !== 'ALL' ? { capability: applied.capability } : {}),
  });

  const apply = () => {
    if (from > to) {
      setDateError('Từ ngày phải trước hoặc bằng đến ngày.');
      return;
    }

    const diffDays = Math.round(
      (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays > 90) {
      setDateError('Khoảng thời gian tra cứu tối đa là 90 ngày (theo chính sách lưu trữ).');
      return;
    }

    setDateError(null);
    setApplied({ from, to, capability });
  };

  const primaryCards = [
    {
      label: 'Lượt dùng',
      value: (metrics?.totalRequests ?? 0).toLocaleString('vi-VN'),
      icon: Zap,
      tone: 'text-primary',
    },
    {
      label: 'Lỗi',
      value: (metrics?.totalFailures ?? 0).toLocaleString('vi-VN'),
      icon: AlertTriangle,
      tone: metrics?.totalFailures ? 'text-destructive' : 'text-muted-foreground',
    },
    {
      label: 'Dự phòng',
      value: (metrics?.totalFallbacks ?? 0).toLocaleString('vi-VN'),
      icon: Activity,
      tone: metrics?.totalFallbacks ? 'text-amber-600' : 'text-muted-foreground',
    },
    {
      label: 'Độ trễ TB',
      value: metrics?.avgLatencyMs ? `${metrics.avgLatencyMs} ms` : '—',
      icon: Clock3,
      tone: 'text-foreground',
    },
  ];

  const qualityCards = [
    {
      label: 'Độ hài lòng Chat',
      value:
        metrics?.feedbackSatisfactionRate !== null &&
        metrics?.feedbackSatisfactionRate !== undefined
          ? `${metrics.feedbackSatisfactionRate}%`
          : '—',
      sub: `${metrics?.feedbackPositive ?? 0} thích / ${metrics?.feedbackNegative ?? 0} không thích`,
      icon: ThumbsUp,
    },
    {
      label: 'Tỷ lệ sửa Vision',
      value:
        metrics?.recognitionCorrectionRate !== null &&
        metrics?.recognitionCorrectionRate !== undefined
          ? `${metrics.recognitionCorrectionRate}%`
          : '—',
      sub: `Tổng ${metrics?.recognitionTotal ?? 0} ảnh`,
      icon: ScanEye,
    },
    {
      label: 'Tỷ lệ sửa Hóa đơn',
      value:
        metrics?.receiptsCorrectionRate !== null && metrics?.receiptsCorrectionRate !== undefined
          ? `${metrics.receiptsCorrectionRate}%`
          : '—',
      sub: `Tổng ${metrics?.receiptsTotal ?? 0} hóa đơn`,
      icon: FileSpreadsheet,
    },
    {
      label: 'Độ tin cậy Dinh dưỡng',
      value:
        metrics?.nutritionConfidence !== null && metrics?.nutritionConfidence !== undefined
          ? `${metrics.nutritionConfidence}%`
          : '—',
      sub: 'Dữ liệu ước tính khẩu phần',
      icon: Sparkles,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Bộ lọc khoảng ngày và tính năng */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-card p-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ai-from" className="text-xs">
            Từ ngày
          </Label>
          <Input
            id="ai-from"
            type="date"
            className="h-9 text-xs"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ai-to" className="text-xs">
            Đến ngày
          </Label>
          <Input
            id="ai-to"
            type="date"
            className="h-9 text-xs"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className="flex min-w-48 flex-col gap-1.5">
          <Label htmlFor="ai-capability" className="text-xs">
            Tính năng AI
          </Label>
          <Select value={capability} onValueChange={setCapability}>
            <SelectTrigger id="ai-capability" className="h-9 text-xs">
              <SelectValue placeholder="Chọn tính năng" />
            </SelectTrigger>
            <SelectContent>
              {CAPABILITY_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="h-9" onClick={apply}>
          Áp dụng
        </Button>
      </div>

      {dateError && <p className="text-xs text-destructive">{dateError}</p>}

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {isError && <ErrorState title="Không tải được chỉ số AI." onRetry={() => void refetch()} />}

      {!isLoading && !isError && (!metrics || metrics.totalRequests === 0) && (
        <EmptyState
          title="Không có dữ liệu trong khoảng thời gian này"
          description="Thử thay đổi mốc ngày hoặc chọn tính năng AI khác."
        />
      )}

      {!isLoading && !isError && metrics && metrics.totalRequests > 0 && (
        <div className="space-y-4">
          {/* Hàng 1: Lưu lượng và độ tin cậy */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {primaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                      <Icon className={`size-4 ${card.tone}`} />
                    </div>
                    <p className={`mt-2 text-2xl font-bold tracking-tight ${card.tone}`}>
                      {card.value}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Hàng 2: Đo lường chất lượng & can thiệp hiệu chỉnh */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {qualityCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.label} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                      <Icon className="size-4 text-primary/80" />
                    </div>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                      {card.value}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{card.sub}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
