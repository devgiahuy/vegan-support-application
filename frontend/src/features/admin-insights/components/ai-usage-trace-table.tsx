'use client';

import * as React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useAdminAiUsageQuery } from '@/features/admin-insights/queries/admin-insights.queries';
import type {
  AiUsageFilters,
  AiUsageRow,
} from '@/features/admin-insights/types/admin-insights.model';

const initialFilters: AiUsageFilters = {
  feature: 'ALL',
  outcome: 'ALL',
  user: '',
  from: '',
  to: '',
};
const featureOptions = [
  { value: 'ALL', label: 'Tất cả tính năng' },
  { value: 'CHAT', label: 'Chat AI' },
  { value: 'FRIDGE', label: 'Quét tủ lạnh' },
  { value: 'RECEIPT', label: 'Phân tích hóa đơn' },
] as const;
const outcomeOptions = [
  { value: 'ALL', label: 'Tất cả kết quả' },
  { value: 'SPENT', label: 'Đã dùng' },
  { value: 'RELEASED', label: 'Đã hoàn lượt' },
  { value: 'HELD', label: 'Đang giữ' },
] as const;

function outcomeVariant(row: AiUsageRow) {
  if (row.outcome === 'SPENT') return 'default' as const;
  if (row.outcome === 'HELD') return 'outline' as const;
  return 'secondary' as const;
}

/** Bảng truy vết sử dụng AI theo người dùng. Không hiển thị nội dung prompt hay ảnh. */
export function AiUsageTraceTable() {
  const [draft, setDraft] = React.useState<AiUsageFilters>(initialFilters);
  const [filters, setFilters] = React.useState<AiUsageFilters>(initialFilters);
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError, isFetching, refetch } = useAdminAiUsageQuery(filters, page);
  const invalidRange = Boolean(draft.from && draft.to && draft.from > draft.to);

  function apply(next: AiUsageFilters) {
    setFilters(next);
    setPage(1);
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby="ai-usage-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="ai-usage-title" className="text-balance text-lg font-semibold">
            Truy vết sử dụng AI
          </h2>
          <p className="text-pretty text-sm text-muted-foreground">
            Ai dùng, tính năng nào, lúc nào, trừ lượt từ đâu và kết quả. Chat của khách chưa đăng
            nhập không được liệt kê.
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1 text-xs text-muted-foreground">
          <ShieldCheck className="size-3" /> Không hiển thị nội dung prompt
        </Badge>
      </div>

      <form
        className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (!invalidRange) apply(draft);
        }}
      >
        <div className="flex flex-col gap-1.5 lg:col-span-2">
          <Label htmlFor="ai-usage-user">Người dùng</Label>
          <Input
            id="ai-usage-user"
            placeholder="Email hoặc tên"
            maxLength={120}
            value={draft.user}
            onChange={(event) => setDraft({ ...draft, user: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Tính năng</Label>
          <Select
            value={draft.feature}
            onValueChange={(value) => {
              const option = featureOptions.find((item) => item.value === value);
              if (!option) return;
              const next = { ...draft, feature: option.value };
              setDraft(next);
              apply(next);
            }}
          >
            <SelectTrigger aria-label="Lọc theo tính năng">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {featureOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Kết quả</Label>
          <Select
            value={draft.outcome}
            onValueChange={(value) => {
              const option = outcomeOptions.find((item) => item.value === value);
              if (!option) return;
              const next = { ...draft, outcome: option.value };
              setDraft(next);
              apply(next);
            }}
          >
            <SelectTrigger aria-label="Lọc theo kết quả">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {outcomeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ai-usage-from">Từ ngày</Label>
          <Input
            id="ai-usage-from"
            type="date"
            value={draft.from}
            onChange={(event) => setDraft({ ...draft, from: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ai-usage-to">Đến ngày</Label>
          <Input
            id="ai-usage-to"
            type="date"
            value={draft.to}
            aria-invalid={invalidRange}
            onChange={(event) => setDraft({ ...draft, to: event.target.value })}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-6">
          <Button type="submit" size="sm" disabled={invalidRange}>
            Áp dụng bộ lọc
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setDraft(initialFilters);
              apply(initialFilters);
            }}
          >
            Xóa bộ lọc
          </Button>
          {invalidRange && (
            <p role="alert" className="text-sm text-destructive">
              Ngày bắt đầu phải trước ngày kết thúc.
            </p>
          )}
        </div>
      </form>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((id) => (
            <Skeleton key={id} className="h-10" />
          ))}
        </div>
      ) : isError || !data ? (
        <ErrorState title="Không tải được bảng truy vết AI." onRetry={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <EmptyState
          title="Không có lượt sử dụng phù hợp"
          description="Thử nới khoảng thời gian hoặc bỏ bớt bộ lọc."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card" aria-busy={isFetching}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Tính năng</TableHead>
                  <TableHead>Nguồn lượt</TableHead>
                  <TableHead className="text-right">Lượt trừ</TableHead>
                  <TableHead>Kết quả</TableHead>
                  <TableHead>Trạng thái AI</TableHead>
                  <TableHead>Nhà cung cấp / Model</TableHead>
                  <TableHead className="text-right">Token vào / ra</TableHead>
                  <TableHead className="text-right">Độ trễ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap text-xs tabular-nums">
                      {row.occurredAtLabel}
                    </TableCell>
                    <TableCell className="max-w-56">
                      <p className="truncate text-sm font-medium">{row.userName}</p>
                      <p className="truncate text-xs text-muted-foreground">{row.userEmail}</p>
                    </TableCell>
                    <TableCell className="text-sm">{row.featureLabel}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.quotaSourceLabel}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.quotaCharged}</TableCell>
                    <TableCell>
                      <Badge variant={outcomeVariant(row)} className="text-[11px]">
                        {row.outcomeLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {row.aiStatusLabel}
                      {row.errorCode && (
                        <span className="block font-mono text-muted-foreground">
                          {row.errorCode}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.providerLabel}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {row.tokensLabel}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums">
                      {row.latencyLabel}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span className="tabular-nums">
              Trang {data.page} / {Math.max(1, data.totalPages)} · {data.total} lượt
            </span>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Trang trước
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= data.totalPages || isFetching}
                onClick={() => setPage((value) => value + 1)}
              >
                Trang sau
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
