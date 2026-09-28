'use client';

import * as React from 'react';
import { History } from 'lucide-react';
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
import { useAiFeatureAuditQuery } from '../queries/ai-governance.queries';

/**
 * FeaturesAuditTable: Bảng lịch sử kiểm toán các thao tác bật/tắt tính năng AI
 * của người quản trị, ghi nhận rõ thời gian, phiên bản và lý do bắt buộc.
 */
export function FeaturesAuditTable() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useAiFeatureAuditQuery({ page, limit: 10 });
  const audits = data?.items ?? [];
  const meta = data?.metadata;

  if (isLoading) return <LoadingState message="Đang tải lịch sử kiểm toán cấu hình..." />;
  if (isError) {
    return <ErrorState title="Không tải được lịch sử kiểm toán." onRetry={() => void refetch()} />;
  }
  if (audits.length === 0) {
    return (
      <EmptyState
        title="Chưa có lịch sử thay đổi cấu hình"
        description="Chưa có quản trị viên nào thực hiện thay đổi cấu hình tính năng AI."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <History className="size-4 text-primary" />
            Lịch sử Kiểm toán Cấu hình AI (Audit Trail)
          </h3>
          <p className="text-xs text-muted-foreground">
            Truy vết ai đã thay đổi tính năng gì, lúc nào và với lý do cụ thể nào.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời gian</TableHead>
              <TableHead>Người thực hiện (Actor ID)</TableHead>
              <TableHead>Tính năng</TableHead>
              <TableHead>Nhà cung cấp</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Phiên bản</TableHead>
              <TableHead className="text-right">Lý do kiểm toán</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {audits.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {item.createdAt
                    ? item.createdAt.toLocaleTimeString('vi-VN') +
                      ' ' +
                      item.createdAt.toLocaleDateString('vi-VN')
                    : '—'}
                </TableCell>
                <TableCell className="font-mono text-xs font-medium">
                  {item.actorId.slice(0, 12)}…
                </TableCell>
                <TableCell>
                  <span className="text-xs font-semibold">{item.capabilityLabel}</span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{item.provider}</TableCell>
                <TableCell>
                  <Badge variant={item.enabled ? 'default' : 'secondary'} className="text-[11px]">
                    {item.enabled ? 'Bật' : 'Tắt'}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  v{item.version}
                </TableCell>
                <TableCell className="text-right text-xs font-medium">{item.reasonLabel}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Trang {meta.page} / {meta.totalPages} (Tổng {meta.totalItems} lần thay đổi)
          </span>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={!meta.hasPrevPage}
            >
              Trang trước
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
              disabled={!meta.hasNextPage}
            >
              Trang sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
