'use client';

import * as React from 'react';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { useAdminStorageAccountsQuery } from '../queries/storage.queries';
import type { StorageAccount } from '../types/storage.model';
import { formatBytes } from '../utils/format-bytes';
import { StorageAdjustmentDialog } from './storage-adjustment-dialog';

export function StorageAccountList() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [overQuotaFilter, setOverQuotaFilter] = React.useState<'ALL' | 'OVER' | 'NORMAL'>('ALL');
  const [selectedAccount, setSelectedAccount] = React.useState<StorageAccount | null>(null);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = React.useMemo(() => {
    const params: { page: number; limit: number; q?: string; overQuota?: boolean } = {
      page,
      limit: 10,
    };
    if (debouncedSearch.trim()) {
      params.q = debouncedSearch.trim();
    }
    if (overQuotaFilter === 'OVER') {
      params.overQuota = true;
    } else if (overQuotaFilter === 'NORMAL') {
      params.overQuota = false;
    }
    return params;
  }, [page, debouncedSearch, overQuotaFilter]);

  const { data, isLoading, isError, error, refetch } = useAdminStorageAccountsQuery(queryParams);

  const accounts = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo email, tên, ID..."
            className="pl-9 h-9 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Lọc trạng thái hạn mức"
        >
          <Button
            size="sm"
            variant={overQuotaFilter === 'ALL' ? 'default' : 'outline'}
            className="h-8 text-xs rounded-lg"
            onClick={() => {
              setOverQuotaFilter('ALL');
              setPage(1);
            }}
          >
            Tất cả
          </Button>
          <Button
            size="sm"
            variant={overQuotaFilter === 'OVER' ? 'destructive' : 'outline'}
            className="h-8 text-xs rounded-lg"
            onClick={() => {
              setOverQuotaFilter('OVER');
              setPage(1);
            }}
          >
            Vượt hạn ngạch
          </Button>
          <Button
            size="sm"
            variant={overQuotaFilter === 'NORMAL' ? 'default' : 'outline'}
            className="h-8 text-xs rounded-lg"
            onClick={() => {
              setOverQuotaFilter('NORMAL');
              setPage(1);
            }}
          >
            Trong hạn mức
          </Button>

          {totalItems > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">{totalItems} tài khoản</span>
          )}
        </div>
      </div>

      {/* Content states */}
      {isLoading && <LoadingState message="Đang tải danh sách tài khoản lưu trữ..." />}
      {isError && (
        <ErrorState
          error={error}
          title="Không thể tải danh sách tài khoản lưu trữ"
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && accounts.length === 0 && (
        <EmptyState
          title="Không tìm thấy tài khoản nào"
          description="Thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt bộ lọc."
        />
      )}

      {!isLoading && !isError && accounts.length > 0 && (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[280px]">Người dùng</TableHead>
                <TableHead>Dung lượng sử dụng</TableHead>
                <TableHead className="w-[180px]">Tỷ lệ sử dụng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => {
                const percent = Math.min(100, account.percentUsed);
                const isOver = account.overQuota;
                const isNearLimit = !isOver && percent >= (account.warningPercent || 80);

                return (
                  <TableRow key={account.userId}>
                    <TableCell>
                      <div className="font-medium text-sm text-foreground">
                        {account.userDisplayName || account.userEmail || 'Chưa đặt tên'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {account.userEmail || account.userId}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-medium text-xs">
                        {account.usedFormatted || formatBytes(account.usedBytes)}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {' '}
                        / {account.limitFormatted || formatBytes(account.limitBytes)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-muted-foreground">
                          <span>{percent}%</span>
                        </div>
                        <Progress
                          value={percent}
                          className={`h-1.5 ${
                            isOver
                              ? '[&>div]:bg-rose-500'
                              : isNearLimit
                                ? '[&>div]:bg-amber-500'
                                : '[&>div]:bg-emerald-500'
                          }`}
                        />
                      </div>
                    </TableCell>

                    <TableCell>
                      {isOver ? (
                        <Badge variant="destructive" className="gap-1 text-[11px]">
                          <AlertTriangle className="h-3 w-3" />
                          Vượt hạn ngạch
                        </Badge>
                      ) : isNearLimit ? (
                        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[11px]">
                          Sắp đầy (≥{account.warningPercent || 80}%)
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px]"
                        >
                          Bình thường
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => setSelectedAccount(account)}
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
                        Điều chỉnh
                      </Button>
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

      {/* Dialog điều chỉnh */}
      <StorageAdjustmentDialog
        account={selectedAccount}
        open={selectedAccount !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedAccount(null);
        }}
      />
    </div>
  );
}
