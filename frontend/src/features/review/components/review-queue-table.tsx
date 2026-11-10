'use client';

import * as React from 'react';
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { ReviewDecision, ReviewItemStatus, PostType, ModerationPriority } from '@/common/enums';
import { getApiErrorCode } from '@/lib/api-error';
import { useAuthStore } from '@/store/useAuthStore';
import { useAdminContentReviewQueueQuery } from '../queries/review.queries';
import { ReviewDecisionDialog } from './review-decision-dialog';
import { ReviewDetailModal } from './review-detail-modal';
import type { ContentReviewQueueItem } from '../types/content-review.model';
import { ReviewDecisionEnum } from '../types/content-review.model';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: ReviewItemStatus.PENDING_REVIEW, label: 'Chờ duyệt' },
  { value: ReviewItemStatus.FLAGGED, label: 'Cờ cảnh báo' },
  { value: ReviewItemStatus.QUARANTINED, label: 'Tạm giữ' },
];

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Tất cả loại' },
  { value: PostType.RECIPE, label: 'Công thức' },
  { value: PostType.BLOG, label: 'Bài viết' },
  { value: PostType.VIDEO, label: 'Video nấu ăn' },
];

const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Tất cả mức ưu tiên' },
  { value: ModerationPriority.URGENT, label: 'Khẩn cấp' },
  { value: ModerationPriority.HIGH, label: 'Cao' },
  { value: ModerationPriority.MEDIUM, label: 'Trung bình' },
  { value: ModerationPriority.LOW, label: 'Bình thường' },
];

function priorityBadgeClass(priority: ModerationPriority): string {
  switch (priority) {
    case ModerationPriority.URGENT:
    case ModerationPriority.HIGH:
      return 'bg-destructive/10 text-destructive border-destructive/30 font-semibold';
    case ModerationPriority.MEDIUM:
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
    default:
      return '';
  }
}

interface DecisionTarget {
  item: ContentReviewQueueItem;
  decision: ReviewDecision;
}

export function ReviewQueueTable() {
  const sessionUserId = useAuthStore((s) => s.user?.id);
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState('ALL');
  const [type, setType] = React.useState('ALL');
  const [priority, setPriority] = React.useState('ALL');
  const [decisionTarget, setDecisionTarget] = React.useState<DecisionTarget | null>(null);
  const [detailRevisionId, setDetailRevisionId] = React.useState<string | null>(null);

  const query = useAdminContentReviewQueueQuery({
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
    <div className="flex flex-col gap-4">
      {/* Bộ lọc */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onValueChange={resetPage(setStatus)}>
          <SelectTrigger className="h-9 w-[150px] rounded-xl bg-card text-xs">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={resetPage(setType)}>
          <SelectTrigger className="h-9 w-[140px] rounded-xl bg-card text-xs">
            <SelectValue placeholder="Loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={resetPage(setPriority)}>
          <SelectTrigger className="h-9 w-[150px] rounded-xl bg-card text-xs">
            <SelectValue placeholder="Ưu tiên" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {PRIORITY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <span className="ml-auto text-xs text-muted-foreground">
          {totalItems > 0 ? `${totalItems} bài trong hàng chờ` : ''}
        </span>
      </div>

      {query.isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl border border-border/60" />
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
          description="Không có nội dung nào khớp với bộ lọc hiện tại. Mọi bản nháp đã được xử lý xong."
        />
      ) : (
        <>
          {/* Mobile Cards (< 768px) */}
          <div className="flex flex-col gap-3 md:hidden">
            {items.map((item) => {
              const isOwn = !!sessionUserId && item.author.id === sessionUserId;
              const decidable = item.canDecide && !isOwn;
              const targetRevisionId = item.revisionId || item.postId;

              return (
                <div
                  key={`mobile-${item.postId}-${item.revisionId || ''}`}
                  className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-2xs"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold break-words text-foreground">
                        {item.title}
                      </p>
                      <Badge
                        variant="outline"
                        className="mt-0.5 shrink-0 px-1.5 py-0 font-mono text-[10px]"
                      >
                        v{item.revisionVersion}
                      </Badge>
                    </div>
                    {item.excerpt && (
                      <p className="line-clamp-2 text-xs break-words text-muted-foreground">
                        {item.excerpt}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      {item.typeLabel || item.type} • {item.formattedCreatedAt}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-medium break-words text-foreground">
                      {item.author.displayName || item.author.name}
                    </span>
                    {item.author.role !== 'MEMBER' && (
                      <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                        {item.author.role}
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={cn('rounded-full', priorityBadgeClass(item.priority))}
                    >
                      {item.isHighPriority && <ShieldAlert className="mr-1 inline size-3" />}
                      {item.priorityLabel}
                    </Badge>
                    <Badge variant="secondary" className="rounded-full text-xs">
                      {item.postStatusLabel || item.statusLabel}
                    </Badge>
                    {item.aiFlags.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                        <Flag className="size-3.5 shrink-0" />
                        {item.aiFlags.length} cờ AI
                      </span>
                    )}
                    {item.activeReporterCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                        <ShieldAlert className="size-3.5 shrink-0" />
                        {item.activeReporterCount} báo cáo
                      </span>
                    )}
                  </div>

                  <Separator className="bg-border/60" />

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {isOwn && (
                      <p className="mr-auto flex items-center gap-1 text-[11px] text-muted-foreground">
                        <AlertTriangle className="size-3" /> Bài của bạn
                      </p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 rounded-xl px-2.5 text-xs"
                      onClick={() => setDetailRevisionId(targetRevisionId)}
                    >
                      <Eye className="size-3.5" /> Xem xét
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 gap-1 rounded-xl bg-emerald-600 px-2.5 text-xs font-medium text-white hover:bg-emerald-700"
                      disabled={!decidable}
                      title={
                        decidable ? 'Duyệt bài viết' : 'Bạn không thể tự duyệt bài của chính mình'
                      }
                      onClick={() => setDecisionTarget({ item, decision: ReviewDecision.APPROVE })}
                    >
                      <Check className="size-3.5" /> Duyệt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 rounded-xl px-2.5 text-xs text-destructive hover:bg-destructive/10"
                      disabled={!decidable}
                      title={
                        decidable ? 'Từ chối bài viết' : 'Bạn không thể tự duyệt bài của chính mình'
                      }
                      onClick={() => setDecisionTarget({ item, decision: ReviewDecision.REJECT })}
                    >
                      <X className="size-3.5" /> Từ chối
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop / Tablet Table (>= 768px) */}
          <div className="hidden overflow-hidden rounded-2xl border border-border/70 bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-2.5">Bài viết</TableHead>
                  <TableHead className="px-2.5">Tác giả</TableHead>
                  <TableHead className="px-2.5">Ưu tiên</TableHead>
                  <TableHead className="px-2.5">Cảnh báo</TableHead>
                  <TableHead className="px-2.5">Trạng thái</TableHead>
                  <TableHead className="px-2.5 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const isOwn = !!sessionUserId && item.author.id === sessionUserId;
                  const decidable = item.canDecide && !isOwn;
                  const targetRevisionId = item.revisionId || item.postId;

                  return (
                    <TableRow key={item.postId + '-' + (item.revisionId || '')}>
                      <TableCell className="min-w-[180px] max-w-[300px] p-2.5 whitespace-normal">
                        <div className="flex items-start gap-1.5">
                          <p
                            className="line-clamp-2 font-medium break-words text-foreground"
                            title={item.title}
                          >
                            {item.title}
                          </p>
                          <Badge
                            variant="outline"
                            className="mt-0.5 shrink-0 px-1.5 py-0 font-mono text-[10px]"
                          >
                            v{item.revisionVersion}
                          </Badge>
                        </div>
                        {item.excerpt && (
                          <p
                            className="mt-0.5 line-clamp-1 text-xs break-words text-muted-foreground"
                            title={item.excerpt}
                          >
                            {item.excerpt}
                          </p>
                        )}
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {item.typeLabel || item.type} • {item.formattedCreatedAt}
                        </p>
                      </TableCell>
                      <TableCell className="min-w-[125px] max-w-[180px] p-2.5 text-sm whitespace-normal">
                        <div className="flex flex-col items-start gap-1">
                          <span className="line-clamp-2 font-medium break-words">
                            {item.author.displayName || item.author.name}
                          </span>
                          {item.author.role !== 'MEMBER' && (
                            <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                              {item.author.role}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-2.5 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={cn('rounded-full', priorityBadgeClass(item.priority))}
                        >
                          {item.isHighPriority && <ShieldAlert className="mr-1 inline size-3" />}
                          {item.priorityLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-2.5 whitespace-normal">
                        {item.aiFlags.length > 0 || item.activeReporterCount > 0 ? (
                          <div className="flex flex-col items-start gap-1 text-xs text-amber-600 dark:text-amber-400">
                            {item.aiFlags.length > 0 && (
                              <span className="inline-flex items-center gap-1 whitespace-nowrap">
                                <Flag className="size-3.5 shrink-0" />
                                {item.aiFlags.length} cờ AI
                              </span>
                            )}
                            {item.activeReporterCount > 0 && (
                              <span className="inline-flex items-center gap-1 font-medium whitespace-nowrap text-destructive">
                                <ShieldAlert className="size-3.5 shrink-0" />
                                {item.activeReporterCount} báo cáo
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="p-2.5 whitespace-nowrap">
                        <Badge variant="secondary" className="rounded-full text-xs">
                          {item.postStatusLabel || item.statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-2.5 text-right whitespace-nowrap">
                        <div className="flex flex-wrap items-center justify-end gap-1.5 lg:flex-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 shrink-0 gap-1 rounded-xl px-2.5 text-xs"
                            onClick={() => setDetailRevisionId(targetRevisionId)}
                          >
                            <Eye className="size-3.5" /> Xem xét
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 shrink-0 gap-1 rounded-xl bg-emerald-600 px-2.5 text-xs font-medium text-white hover:bg-emerald-700"
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
                            <Check className="size-3.5" /> Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 shrink-0 gap-1 rounded-xl px-2.5 text-xs text-destructive hover:bg-destructive/10"
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
                            <X className="size-3.5" /> Từ chối
                          </Button>
                        </div>
                        {isOwn && (
                          <p className="mt-1 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                            <AlertTriangle className="size-3" /> Bài của bạn
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
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="Trang trước"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="size-8 rounded-xl"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Trang sau"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="size-8 rounded-xl"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modal chi tiết thẩm định bản nháp */}
      {detailRevisionId && (
        <ReviewDetailModal
          open={Boolean(detailRevisionId)}
          onOpenChange={(open) => !open && setDetailRevisionId(null)}
          revisionId={detailRevisionId}
          onDecide={(dec) => {
            const item = items.find((i) => (i.revisionId || i.postId) === detailRevisionId);
            if (item) {
              setDecisionTarget({
                item,
                decision:
                  dec === ReviewDecisionEnum.APPROVE
                    ? ReviewDecision.APPROVE
                    : ReviewDecision.REJECT,
              });
              setDetailRevisionId(null);
            }
          }}
        />
      )}

      {/* Dialog xác nhận phê duyệt / từ chối kèm lý do */}
      <ReviewDecisionDialog
        open={decisionTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDecisionTarget(null);
        }}
        decision={decisionTarget?.decision ?? ReviewDecision.APPROVE}
        postId={decisionTarget?.item.postId || ''}
        revisionId={decisionTarget?.item.revisionId}
        postTitle={decisionTarget?.item.title || ''}
        canDecide={!!decisionTarget && decisionTarget.item.canDecide}
      />
    </div>
  );
}
