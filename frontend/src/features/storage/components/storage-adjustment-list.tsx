'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { useAdminStorageAdjustmentsQuery } from '../queries/storage.queries';
import { formatDeltaBytes } from '../utils/format-bytes';

export function StorageAdjustmentList() {
  const [page, setPage] = React.useState(1);
  const [userIdFilter, setUserIdFilter] = React.useState('');
  const [debouncedUserId, setDebouncedUserId] = React.useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserId(userIdFilter);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [userIdFilter]);

  const queryParams = React.useMemo(() => {
    const params: { page: number; limit: number; userId?: string } = {
      page,
      limit: 10,
    };
    if (debouncedUserId.trim()) {
      params.userId = debouncedUserId.trim();
    }
    return params;
  }, [page, debouncedUserId]);

  const { data, isLoading, isError, error, refetch } = useAdminStorageAdjustmentsQuery(queryParams);

  const adjustments = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;

  return (
    <div className="space-y-4">
      {/* Search by User ID */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Lọc theo User ID..."
            className="pl-9 h-9 text-xs"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
          />
        </div>

        {totalItems > 0 && (
          <span className="text-xs text-muted-foreground">{totalItems} lượt điều chỉnh</span>
        )}
      </div>

      {isLoading && <LoadingState message="Đang tải lịch sử điều chỉnh hạn mức..." />}
      {isError && (
        <ErrorState
          error={error}
          title="Không thể tải lịch sử điều chỉnh"
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && adjustments.length === 0 && (
        <EmptyState
          title="Chưa có lượt điều chỉnh nào"
          description={
            debouncedUserId
              ? 'Không tìm thấy lịch sử cho User ID này.'
              : 'Hệ thống chưa ghi nhận lần điều chỉnh hạn mức lưu trữ thủ công nào.'
          }
        />
      )}

      {!isLoading && !isError && adjustments.length > 0 && (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[170px]">Thời gian</TableHead>
                <TableHead className="w-[200px]">Người dùng ID</TableHead>
                <TableHead className="w-[160px]">Admin thực hiện</TableHead>
                <TableHead className="w-[140px]">Thay đổi</TableHead>
                <TableHead>Lý do giải trình</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adjustments.map((adj) => {
                const formattedDate = adj.createdAt
                  ? new Date(adj.createdAt).toLocaleString('vi-VN', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—';

                const isPositive = adj.deltaBytes > 0;

                return (
                  <TableRow key={adj.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formattedDate}
                    </TableCell>

                    <TableCell>
                      <div className="font-mono text-xs text-foreground truncate max-w-[180px]">
                        {adj.userId}
                      </div>
                    </TableCell>

                    <TableCell className="text-xs font-mono text-muted-foreground truncate max-w-[150px]">
                      {adj.adminUserId}
                    </TableCell>

                    <TableCell>
                      <span
                        className={`font-semibold text-xs ${
                          isPositive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {adj.deltaFormatted || formatDeltaBytes(adj.deltaBytes)}
                      </span>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground max-w-xs break-words">
                      {adj.reason}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !isError && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Hiển thị trang {page} trên {totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 text-xs gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 text-xs gap-1"
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
