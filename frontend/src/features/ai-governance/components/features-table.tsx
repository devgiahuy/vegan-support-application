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
import * as React from 'react';
import type { AiFeatureToggle } from '../types/ai-governance.model';
import { useAiFeaturesQuery } from '../queries/ai-governance.queries';
import { FeatureToggleDialog } from './feature-toggle-dialog';

/** Bảng cấu hình tính năng AI hiện tại (nút đổi mở dialog lý do bắt buộc). */
export function FeaturesTable() {
  const { data, isLoading, isError, refetch } = useAiFeaturesQuery();
  const [selected, setSelected] = React.useState<AiFeatureToggle | null>(null);
  const features = data ?? [];

  if (isLoading) return <LoadingState message="Đang tải cấu hình..." />;
  if (isError) {
    return <ErrorState title="Không tải được cấu hình." onRetry={() => void refetch()} />;
  }
  if (features.length === 0) {
    return <EmptyState title="Chưa có tính năng nào" description="Danh sách tính năng AI trống." />;
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tính năng</TableHead>
              <TableHead>Provider / Mẫu</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {features.map((feature) => (
              <TableRow key={feature.feature}>
                <TableCell className="font-medium">{feature.feature}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {feature.provider || '—'} / {feature.modelId || '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={feature.enabled ? 'default' : 'secondary'}>
                    {feature.enabled ? 'Đang bật' : 'Đang tắt'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => setSelected(feature)}>
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
