'use client';

import * as React from 'react';
import { Activity, AlertOctagon, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { useAiHealthQuery } from '../queries/ai-governance.queries';

/**
 * HealthSummary: Hiển thị tình trạng vận hành AI trong 24 giờ qua
 * và chính sách lưu trữ dữ liệu an toàn (retention policy).
 */
export function HealthSummary() {
  const { data, isLoading, isError, refetch } = useAiHealthQuery();

  if (isLoading) {
    return (
      <Card className="border-muted/80">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <ErrorState title="Không thể tải tổng quan sức khỏe AI" onRetry={() => void refetch()} />
    );
  }

  const isHealthy = data.failures24h === 0 && data.providerUnavailable24h === 0;

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Activity className="size-4 text-primary" />
            Tình trạng Vận hành AI (24 giờ qua)
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Đánh giá lúc:{' '}
            {data.evaluatedAt
              ? data.evaluatedAt.toLocaleTimeString('vi-VN') +
                ' ' +
                data.evaluatedAt.toLocaleDateString('vi-VN')
              : 'Mới cập nhật'}
          </p>
        </div>
        <Badge variant={isHealthy ? 'default' : 'destructive'} className="flex items-center gap-1">
          {isHealthy ? (
            <>
              <CheckCircle2 className="size-3" /> Bình thường
            </>
          ) : (
            <>
              <AlertOctagon className="size-3" /> Cần chú ý ({data.failures24h} lỗi)
            </>
          )}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-muted bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground">Tổng yêu cầu 24h</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {data.total24h.toLocaleString('vi-VN')}
            </p>
          </div>
          <div className="rounded-xl border border-muted bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground">Lỗi / Sự cố</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-destructive">
              {data.failures24h.toLocaleString('vi-VN')}
            </p>
          </div>
          <div className="rounded-xl border border-muted bg-muted/20 p-3">
            <p className="text-xs font-medium text-muted-foreground">Lượt chuyển Dự phòng</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-amber-600">
              {data.fallback24h.toLocaleString('vi-VN')}
            </p>
          </div>
          <div className="rounded-xl border border-muted bg-muted/20 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Chính sách Lưu trữ</p>
              <ShieldCheck className="size-3.5 text-muted-foreground" />
            </div>
            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {data.retentionDays} ngày
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Tự động dọn dẹp</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
