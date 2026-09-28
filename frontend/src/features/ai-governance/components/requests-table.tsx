'use client';

import * as React from 'react';
import { ShieldCheck } from 'lucide-react';
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
import { useAiRequestsQuery } from '../queries/ai-governance.queries';

/**
 * RequestsTable: Bảng nhật ký gọi AI đã che mờ (redacted).
 * TUYỆT ĐỐI KHÔNG render nội dung thô / PII / ảnh / hóa đơn.
 */
export function RequestsTable() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, refetch } = useAiRequestsQuery({ page, limit: 15 });
  const logs = data?.items ?? [];
  const meta = data?.metadata;

  if (isLoading) return <LoadingState message="Đang tải nhật ký yêu cầu AI..." />;
  if (isError) {
    return <ErrorState title="Không tải được nhật ký yêu cầu." onRetry={() => void refetch()} />;
  }
  if (logs.length === 0) {
    return (
      <EmptyState
        title="Chưa có nhật ký yêu cầu nào"
        description="Không tìm thấy bản ghi gọi AI nào trong phạm vi hiện tại."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Nhật ký Yêu cầu AI (Đã che mờ bảo mật)</h3>
          <p className="text-xs text-muted-foreground">
            Thông số kỹ thuật, độ trễ và lượng token tiêu thụ. Toàn bộ thông tin cá nhân và dữ liệu
            thô đã được lọc.
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1 text-xs text-muted-foreground">
          <ShieldCheck className="size-3 text-emerald-600" /> Đã che mờ 100% PII
        </Badge>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã tương quan (Correlation ID)</TableHead>
              <TableHead>Tính năng</TableHead>
              <TableHead>Nhà cung cấp / Mẫu</TableHead>
              <TableHead>Độ trễ</TableHead>
              <TableHead>Token (Vào / Ra)</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>An toàn</TableHead>
              <TableHead className="text-right">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-mono text-xs font-medium">
                  {log.correlationId ? log.correlationId.slice(0, 14) + '…' : log.id.slice(0, 10)}
                </TableCell>
                <TableCell>
                  <span className="text-xs font-medium">{log.capabilityLabel}</span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {log.provider} / {log.modelId}
                </TableCell>
                <TableCell className="text-xs font-mono">
                  {log.latencyMs !== null ? `${log.latencyMs} ms` : '—'}
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  {log.inputTokens ?? 0} / {log.outputTokens ?? 0}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {log.completedAt
                    ? log.completedAt.toLocaleTimeString('vi-VN') +
                      ' ' +
                      log.completedAt.toLocaleDateString('vi-VN')
                    : '—'}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={log.safetyOutcome === 'SAFE' ? 'secondary' : 'destructive'}
                    className="text-[11px]"
                  >
                    {log.safetyOutcome === 'SAFE' ? 'An toàn' : 'Cảnh báo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={
                      log.status === 'OK'
                        ? 'default'
                        : log.status === 'FALLBACK'
                          ? 'outline'
                          : 'destructive'
                    }
                    className="text-[11px]"
                  >
                    {log.statusLabel}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Phân trang */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Trang {meta.page} / {meta.totalPages} (Tổng {meta.totalItems} bản ghi)
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
