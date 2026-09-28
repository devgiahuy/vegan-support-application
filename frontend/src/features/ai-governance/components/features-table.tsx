'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AiFeatureToggle } from '../types/ai-governance.model';
import { useAiFeaturesQuery } from '../queries/ai-governance.queries';
import { FeatureToggleDialog } from './feature-toggle-dialog';

/** Bảng cấu hình tính năng AI hiện tại (nút đổi mở dialog lý do bắt buộc). */
export function FeaturesTable() {
  const { data, isLoading, isError, refetch } = useAiFeaturesQuery();
  const [selected, setSelected] = React.useState<AiFeatureToggle | null>(null);
  const features = data ?? [];

  if (isLoading) return <LoadingState message="Đang tải cấu hình tính năng AI..." />;
  if (isError) {
    return <ErrorState title="Không tải được cấu hình tính năng." onRetry={() => void refetch()} />;
  }
  if (features.length === 0) {
    return (
      <EmptyState
        title="Chưa có tính năng nào"
        description="Danh sách cấu hình tính năng AI hiện tại trống."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">
          Cấu hình Tính năng & Bộ chuyển mạch (Feature Controls)
        </h3>
        <p className="text-xs text-muted-foreground">
          Bật/tắt hoặc điều chuyển nhà cung cấp. Mọi thay đổi bắt buộc phải có lý do kiểm toán.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tính năng AI</TableHead>
              <TableHead>Nhà cung cấp / Mẫu</TableHead>
              <TableHead>Dự phòng khi lỗi</TableHead>
              <TableHead>Phiên bản</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {features.map((feature) => (
              <TableRow key={feature.capability}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold">{feature.capabilityLabel}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {feature.capability}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {feature.provider || '—'} / {feature.modelId || '—'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {feature.fallbackLabel}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  v{feature.version}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={feature.enabled ? 'default' : 'secondary'}
                    className="text-[11px]"
                  >
                    {feature.enabled ? 'Đang bật' : 'Đang tắt'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant={feature.enabled ? 'outline' : 'default'}
                    className="h-7 text-xs"
                    onClick={() => setSelected(feature)}
                  >
                    {feature.enabled ? 'Tắt' : 'Bật'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <FeatureToggleDialog
        feature={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
