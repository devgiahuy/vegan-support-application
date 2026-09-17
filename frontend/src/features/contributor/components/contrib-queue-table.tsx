'use client';

import * as React from 'react';
import { Inbox } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import type { ContributorApplication } from '../types/contributor.model';
import { useContributorQueueQuery } from '../queries/contributor.queries';
import { ReviewApplicationDialog } from './review-application-dialog';

/** Hàng chờ duyệt đơn (fixture ở phase scaffold): lọc + phân trang đơn giản. */
export function ContribQueueTable() {
  const [status, setStatus] = React.useState('PENDING');
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState<ContributorApplication | null>(null);
  const queryStatus = status === 'ALL' ? undefined : status;
  const { data, isLoading, isError, refetch } = useContributorQueueQuery({
    status: queryStatus,
    limit: 20,
  });
  const apps = (data?.items ?? []).filter((app) =>
    query.trim().length === 0
      ? true
      : `${app.applicantName} ${app.applicantEmail}`
          .toLowerCase()
          .includes(query.trim().toLowerCase())
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Inbox className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, email..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-45" aria-label="Lọc trạng thái">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="PENDING">Chờ duyệt</SelectItem>
              <SelectItem value="APPROVED">Đã duyệt</SelectItem>
              <SelectItem value="REJECTED">Bị từ chối</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {isLoading && <LoadingState message="Đang tải hàng chờ..." />}
      {isError && <ErrorState title="Không tải được hàng chờ." onRetry={() => void refetch()} />}
      {!isLoading && !isError && apps.length === 0 && (
        <EmptyState title="Không có đơn nào" description="Thử đổi từ khóa hoặc bộ lọc." />
      )}
      {!isLoading && !isError && apps.length > 0 && (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người nộp</TableHead>
                <TableHead>Nhóm mong muốn</TableHead>
                <TableHead>Kinh nghiệm</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apps.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <p className="font-medium">{app.applicantName || '—'}</p>
                    <p className="text-xs text-muted-foreground">{app.applicantEmail}</p>
                  </TableCell>
                  <TableCell>{app.requestedTypeLabel}</TableCell>
                  <TableCell className="max-w-60">
                    <p className="truncate text-sm">{app.experienceShort || app.experience}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        app.status === 'PENDING'
                          ? 'secondary'
                          : app.status === 'APPROVED'
                            ? 'default'
                            : 'destructive'
                      }
                    >
                      {app.statusLabel}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={app.status !== 'PENDING'}
                      onClick={() => setSelected(app)}
                    >
                      Duyệt
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ReviewApplicationDialog
        application={selected}
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      />
    </div>
  );
}
