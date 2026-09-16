'use client';

import * as React from 'react';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Flag,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ReviewDecision, ReviewItemStatus, PostType, ModerationPriority } from '@/common/enums';
import { getApiErrorCode } from '@/lib/api-error';
import { useAuthStore } from '@/store/useAuthStore';
import { useReviewQueueQuery } from '../queries/review.queries';
import { ReviewDecisionDialog } from './review-decision-dialog';
import type { ReviewQueueItem } from '../types/review.model';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: ReviewItemStatus.PENDING_REVIEW, label: 'Chờ duyệt' },
  { value: ReviewItemStatus.FLAGGED, label: 'Cờ cảnh báo' },
  { value: ReviewItemStatus.QUARANTINED, label: 'Tạm giữ' },
];

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Mọi loại' },
  { value: PostType.RECIPE, label: 'Công thức' },
  { value: PostType.BLOG, label: 'Bài viết' },
  { value: PostType.VIDEO, label: 'Video' },
];

const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Mọi độ ưu tiên' },
  { value: ModerationPriority.URGENT, label: 'Khẩn cấp' },
  { value: ModerationPriority.HIGH, label: 'Cao' },
  { value: ModerationPriority.MEDIUM, label: 'Trung bình' },
  { value: ModerationPriority.LOW, label: 'Thấp' },
];

function priorityBadgeClass(priority: ModerationPriority): string {
  switch (priority) {
    case ModerationPriority.URGENT:
      return 'bg-destructive/10 text-destructive border-destructive/30';
    case ModerationPriority.HIGH:
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    default:
      return '';
  }
}

interface DecisionTarget {
  item: ReviewQueueItem;
  decision: ReviewDecision;
}

export function ReviewQueueTable() {
  const sessionUserId = useAuthStore((s) => s.user?.id);
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState('ALL');
  const [type, setType] = React.useState('ALL');
  const [priority, setPriority] = React.useState('ALL');
  const [decisionTarget, setDecisionTarget] = React.useState<DecisionTarget | null>(null);

  const query = useReviewQueueQuery({
    page,
    limit: 12,
    status: status === 'ALL' ? undefined : (status as ReviewItemStatus),
    type: type === 'ALL' ? undefined : (type as PostType),
    priority: priority === 'ALL' ? undefined : (priority as ModerationPriority),
  });

  const resetPage = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  const items = query.data?.items || [];
  const totalPages = query.data?.metadata.totalPages || 1;
  const totalItems = query.data?.metadata.totalItems || 0;
  const isForbidden = getApiErrorCode(query.error) === 'FORBIDDEN';

  return (
    <div className="space-y-4">
      {/* Bộ lọc */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onValueChange={resetPage(setStatus)}>
          <SelectTrigger className="h-9 text-xs rounded-xl w-[150px] bg-card">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={resetPage(setType)}>
          <SelectTrigger className="h-9 text-xs rounded-xl w-[130px] bg-card">
            <SelectValue placeholder="Loại" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={resetPage(setPriority)}>
          <SelectTrigger className="h-9 text-xs rounded-xl w-[150px] bg-card">
            <SelectValue placeholder="Ưu tiên" />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {totalItems > 0 ? `${totalItems} bài đang chờ` : ''}
        </span>
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl border border-border/60 bg-muted/40"
            />
          ))}
        </div>
      ) : query.isError || isForbidden ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 text-center">
            <p className="font-semibold text-destructive">
              {isForbidden
                ? 'Tài khoản của bạn không có quyền duyệt nội dung.'
                : 'Không thể tải hàng chờ kiểm duyệt.'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isForbidden
                ? 'Nội dung chờ duyệt được bảo vệ và không hiển thị ở đây.'
                : 'Đã có lỗi xảy ra khi kết nối tới máy chủ. Vui lòng thử lại.'}
            </p>
            {!isForbidden && (
              <Button
                variant="outline"
                className="mt-4 rounded-xl"
                onClick={() => void query.refetch()}
              >
                Thử lại
              </Button>
            )}
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          title="Hàng chờ đang trống"
          description="Không có bài viết nào khớp với bộ lọc hiện tại. Mọi nội dung đã được xử lý xong."
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bài viết</TableHead>
                  <TableHead>Tác giả</TableHead>
                  <TableHead>Ưu tiên</TableHead>
                  <TableHead>Cảnh báo</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const isOwn = !!sessionUserId && item.author.id === sessionUserId;
                  const decidable = item.canDecide && !isOwn;
                  return (
                    <TableRow key={item.postId}>
                      <TableCell>
                        <p className="font-medium">{item.title}</p>
                        {item.excerpt && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {item.excerpt}
                          </p>
                        )}
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {item.type} • {item.formattedCreatedAt}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">{item.author.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`rounded-full ${priorityBadgeClass(item.priority)}`}
                        >
                          {item.priorityLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.aiFlags.length > 0 || item.activeReporterCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                            {item.aiFlags.length > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <Flag className="h-3.5 w-3.5" />
                                {item.aiFlags
                                  .flatMap((f) => f.reasonCodes)
                                  .slice(0, 2)
                                  .join(', ')}
                              </span>
                            )}
                            {item.activeReporterCount > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <ShieldAlert className="h-3.5 w-3.5" />
                                {item.activeReporterCount} báo cáo
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="rounded-full">
                          {item.statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            className="gap-1 rounded-full"
                            disabled={!decidable}
                            title={
                              decidable
                                ? 'Duyệt bài viết'
                                : 'Bạn không thể tự duyệt bài của chính mình'
                            }
                            onClick={() =>
                              setDecisionTarget({ item, decision: ReviewDecision.APPROVE })
                            }
                          >
                            <Check className="h-3.5 w-3.5" /> Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 rounded-full text-destructive"
                            disabled={!decidable}
                            title={
                              decidable
                                ? 'Từ chối bài viết'
                                : 'Bạn không thể tự duyệt bài của chính mình'
                            }
                            onClick={() =>
                              setDecisionTarget({ item, decision: ReviewDecision.REJECT })
                            }
                          >
                            <X className="h-3.5 w-3.5" /> Từ chối
                          </Button>
                        </div>
                        {isOwn && (
                          <p className="mt-1 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                            <AlertTriangle className="h-3 w-3" /> Bài của bạn
                          </p>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Trang trước"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Trang sau"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <ReviewDecisionDialog
        open={decisionTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDecisionTarget(null);
        }}
        decision={decisionTarget?.decision ?? ReviewDecision.APPROVE}
        postId={decisionTarget?.item.postId || ''}
        postTitle={decisionTarget?.item.title || ''}
        canDecide={!!decisionTarget && decisionTarget.item.canDecide}
      />
    </div>
  );
}
