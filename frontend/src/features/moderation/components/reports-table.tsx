'use client';

import * as React from 'react';
import { Flag } from 'lucide-react';
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
import type { ModerationReport } from '../types/moderation.model';
import { useReportsQuery } from '../queries/moderation.queries';
import { ResolveDialog } from './resolve-dialog';

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'OPEN', label: 'Đang mở' },
  { value: 'RESOLVED', label: 'Đã xử lý' },
] as const;

/** Bảng hàng chờ báo cáo gộp theo mục tiêu (fixture ở phase scaffold). */
export function ReportsTable() {
  const [status, setStatus] = React.useState<string>('');
  const [selected, setSelected] = React.useState<ModerationReport | null>(null);
  const { data, isLoading, isError, refetch } = useReportsQuery(
    status ? { status, limit: 20 } : { limit: 20 }
  );
  const reports = data?.items ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc trạng thái">
        <span className="flex items-center gap-1.5 text-sm font-medium">
          <Flag className="size-4" /> Hàng chờ báo cáo
        </span>
        {STATUS_FILTERS.map((option) => (
          <Button
            key={option.value}
            variant={status === option.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatus(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {isLoading && <LoadingState message="Đang tải hàng chờ báo cáo..." />}
      {isError && <ErrorState title="Không tải được hàng chờ." onRetry={() => void refetch()} />}
      {!isLoading && !isError && reports.length === 0 && (
        <EmptyState title="Hết báo cáo" description="Không còn báo cáo nào cần xử lý." />
      )}
      {!isLoading && !isError && reports.length > 0 && (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mục tiêu</TableHead>
                <TableHead>Báo cáo mở</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <p className="font-medium">{report.targetTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {report.targetTypeLabel}
                      {report.targetExcerpt && ` — ${report.targetExcerpt}`}
                    </p>
                  </TableCell>
                  <TableCell>{report.openCount}</TableCell>
                  <TableCell className="max-w-55">
                    <p className="truncate text-sm">
                      {report.reasons.slice(0, 3).join('; ') || '—'}
                      {report.reasons.length > 3 && ` (+${report.reasons.length - 3})`}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={report.status === 'OPEN' ? 'destructive' : 'secondary'}>
                      {report.statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={report.status !== 'OPEN'}
                      onClick={() => setSelected(report)}
                    >
                      Xử lý
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ResolveDialog
        report={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
