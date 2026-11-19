'use client';

import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminAuditQuery } from '@/features/admin-insights/queries/admin-insights.queries';

export function AdminAuditPanel() {
  const audit = useAdminAuditQuery();
  const rows = audit.data?.pages.flatMap((page) => page.rows) ?? [];

  return (
    <Card className="min-w-0">
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="admin-audit-title" className="text-balance font-semibold">
            Nhật ký thao tác hệ thống
          </h2>
          <p className="text-sm text-pretty text-muted-foreground">
            Các thao tác quản trị và cờ giám sát tự động, mới nhất trước.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={audit.isFetching}
          onClick={() => void audit.refetch()}
        >
          Tải lại
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4" aria-busy={audit.isFetching}>
        {audit.isPending ? (
          <div className="flex flex-col gap-2" role="status">
            <span className="sr-only">Đang tải nhật ký hệ thống</span>
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : audit.isError && rows.length === 0 ? (
          <ErrorState
            title="Không tải được nhật ký hệ thống."
            onRetry={() => void audit.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="Chưa có nhật ký"
            description="Các sự kiện đã ghi nhận sẽ xuất hiện tại đây."
          />
        ) : (
          <>
            <Table aria-labelledby="admin-audit-title">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Thời gian</TableHead>
                  <TableHead scope="col">Người thực hiện</TableHead>
                  <TableHead scope="col">Thao tác</TableHead>
                  <TableHead scope="col">Đối tượng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell className="tabular-nums">
                      <time dateTime={row.occurredAt}>{row.timeLabel}</time>
                    </TableCell>
                    <TableCell className="max-w-56 whitespace-normal wrap-anywhere">
                      {row.actorLabel}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{row.actionLabel}</p>
                      <p className="text-xs text-muted-foreground">{row.sourceLabel}</p>
                    </TableCell>
                    <TableCell>
                      <p>{row.targetLabel}</p>
                      {row.targetId && (
                        <p className="max-w-72 font-mono text-xs break-all whitespace-normal text-muted-foreground">
                          {row.targetId}
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {audit.isRefetchError && !audit.isFetchNextPageError && (
              <ErrorState title="Không làm mới được nhật ký. Đang hiển thị dữ liệu đã tải." />
            )}
            {audit.isFetchNextPageError && <ErrorState title="Không tải được nhật ký cũ hơn." />}
            {audit.hasNextPage && (
              <Button
                className="self-start"
                variant="outline"
                disabled={audit.isFetching}
                onClick={() => void audit.fetchNextPage()}
              >
                {audit.isFetchingNextPage ? 'Đang tải…' : 'Xem nhật ký cũ hơn'}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
