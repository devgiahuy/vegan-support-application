import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Check, Eye, Flag, ShieldAlert, TriangleAlert, X } from 'lucide-react-native';

import { PostType } from '@/common/enums';
import { DropdownField, type DropdownOption } from '@/components/ui/dropdown-field';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/state-views';
import { getApiErrorCode } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useContentReviewQueueQuery } from '../queries/content-review.queries';
import type {
  ContentReviewDecision,
  ContentReviewPriority,
  ContentReviewQueueItem,
  ContentReviewQueueStatus,
} from '../types/content-review.model';
import { ContentReviewDecisionDialog } from './content-review-decision-dialog';
import { ContentReviewDetailSheet } from './content-review-detail-sheet';

const PAGE_SIZE = 10;

const STATUS_OPTIONS: DropdownOption<ContentReviewQueueStatus | null>[] = [
  { value: null, label: 'Tất cả trạng thái', shortLabel: 'Tất cả' },
  { value: 'PENDING_REVIEW', label: 'Chờ duyệt' },
  { value: 'FLAGGED', label: 'Cờ cảnh báo' },
  { value: 'QUARANTINED', label: 'Tạm giữ' },
];
const TYPE_OPTIONS: DropdownOption<PostType | null>[] = [
  { value: null, label: 'Tất cả loại', shortLabel: 'Tất cả' },
  { value: PostType.RECIPE, label: 'Công thức' },
  { value: PostType.BLOG, label: 'Bài viết (Cẩm nang)', shortLabel: 'Bài viết' },
  { value: PostType.VIDEO, label: 'Video nấu ăn', shortLabel: 'Video' },
];
const PRIORITY_OPTIONS: DropdownOption<ContentReviewPriority | null>[] = [
  { value: null, label: 'Tất cả mức ưu tiên', shortLabel: 'Tất cả' },
  { value: 'HIGH', label: 'Ưu tiên cao', shortLabel: 'Cao' },
  { value: 'NORMAL', label: 'Bình thường' },
];

function QueueCard({
  item,
  isOwn,
  onView,
  onDecide,
}: {
  item: ContentReviewQueueItem;
  isOwn: boolean;
  onView: () => void;
  onDecide: (decision: ContentReviewDecision) => void;
}) {
  const colors = useIconColors();
  const decidable = item.canDecide && !isOwn;
  return (
    <View className="gap-2.5 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row flex-wrap items-center gap-1.5">
        <View className="rounded-full border border-border px-2 py-0.5"><Text className="text-[10px] font-semibold text-foreground">{item.typeLabel}</Text></View>
        <View className="rounded-full border border-border px-2 py-0.5"><Text className="text-[10px] text-muted-foreground">v{item.revisionVersion}</Text></View>
        <View className={cn('flex-row items-center gap-1 rounded-full px-2 py-0.5', item.isHighPriority ? 'bg-destructive/10' : 'bg-muted')}>
          {item.isHighPriority ? <ShieldAlert size={11} color={colors.destructive} /> : null}
          <Text className={cn('text-[10px] font-semibold', item.isHighPriority ? 'text-destructive' : 'text-muted-foreground')}>{item.priorityLabel}</Text>
        </View>
        <View className="rounded-full bg-secondary px-2 py-0.5"><Text className="text-[10px] text-secondary-foreground">{item.postStatusLabel}</Text></View>
      </View>

      <View className="gap-0.5">
        <Text numberOfLines={2} className="text-base font-semibold leading-snug text-foreground">{item.title}</Text>
        {item.excerpt ? <Text numberOfLines={2} className="text-xs text-muted-foreground">{item.excerpt}</Text> : null}
        <Text className="text-[11px] text-muted-foreground">
          {item.authorName}
          {item.authorRoleLabel ? ` (${item.authorRoleLabel})` : ''} · {item.formattedSubmittedAt || item.formattedCreatedAt}
        </Text>
      </View>

      {item.aiFlagCount > 0 || item.reportCount > 0 ? (
        <View className="flex-row flex-wrap items-center gap-3">
          {item.aiFlagCount > 0 ? (
            <View className="flex-row items-center gap-1"><Flag size={13} color={colors.cta} /><Text className="text-xs text-amber-600 dark:text-amber-400">{item.aiFlagCount} cờ AI</Text></View>
          ) : null}
          {item.reportCount > 0 ? (
            <View className="flex-row items-center gap-1"><ShieldAlert size={13} color={colors.destructive} /><Text className="text-xs font-medium text-destructive">{item.reportCount} báo cáo</Text></View>
          ) : null}
        </View>
      ) : null}

      <View className="flex-row gap-2">
        <Pressable accessibilityRole="button" onPress={onView} className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-input active:bg-muted">
          <Eye size={14} color={colors.foreground} />
          <Text className="text-xs font-semibold text-foreground">Xem xét</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Duyệt bài viết" disabled={!decidable} onPress={() => (item.type === PostType.RECIPE ? onView() : onDecide('APPROVE'))} className={cn('h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-emerald-600', !decidable && 'opacity-40')}>
          <Check size={14} color="#ffffff" />
          <Text className="text-xs font-semibold text-white">Duyệt</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Từ chối bài viết" disabled={!decidable} onPress={() => onDecide('REJECT')} className={cn('h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-destructive/40', !decidable && 'opacity-40')}>
          <X size={14} color={colors.destructive} />
          <Text className="text-xs font-semibold text-destructive">Từ chối</Text>
        </Pressable>
      </View>
      {isOwn ? (
        <View className="flex-row items-center gap-1"><TriangleAlert size={12} color={colors.mutedForeground} /><Text className="text-[11px] text-muted-foreground">Bài của bạn — không thể tự duyệt</Text></View>
      ) : null}
    </View>
  );
}

/** Hàng chờ kiểm duyệt: bộ lọc trạng thái/loại/ưu tiên, danh sách phân trang, xem chi tiết và duyệt/từ chối kèm lý do. */
export function ContentReviewQueue() {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState<ContentReviewQueueStatus | null>(null);
  const [type, setType] = React.useState<PostType | null>(null);
  const [priority, setPriority] = React.useState<ContentReviewPriority | null>(null);
  const [detailItem, setDetailItem] = React.useState<ContentReviewQueueItem | null>(null);
  const [decision, setDecision] = React.useState<{ item: ContentReviewQueueItem; decision: ContentReviewDecision } | null>(null);

  const query = useContentReviewQueueQuery({
    page,
    limit: PAGE_SIZE,
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
    ...(priority ? { priority } : {}),
  });
  const items = query.data?.items ?? [];
  const forbidden = getApiErrorCode(query.error) === 'FORBIDDEN';

  const filter = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  return (
    <View className="gap-4">
      <View className="flex-row gap-2">
        <DropdownField className="flex-1" label="Trạng thái" value={status} options={STATUS_OPTIONS} onChange={filter(setStatus)} />
        <DropdownField className="flex-1" label="Loại" value={type} options={TYPE_OPTIONS} onChange={filter(setType)} />
        <DropdownField className="flex-1" label="Ưu tiên" value={priority} options={PRIORITY_OPTIONS} onChange={filter(setPriority)} />
      </View>
      {query.data && query.data.totalItems > 0 ? <Text className="text-xs text-muted-foreground">{query.data.totalItems} bài trong hàng chờ</Text> : null}

      {query.isLoading ? (
        <LoadingState message="Đang tải hàng chờ kiểm duyệt…" />
      ) : query.isError ? (
        forbidden ? (
          <ErrorState title="Tài khoản của bạn không có quyền duyệt nội dung." description="Nội dung chờ duyệt được bảo vệ và không hiển thị ở đây." />
        ) : (
          <ErrorState title="Không thể tải hàng chờ kiểm duyệt." description="Đã có lỗi khi kết nối tới máy chủ. Vui lòng thử lại." onRetry={() => void query.refetch()} />
        )
      ) : items.length === 0 ? (
        <EmptyState title="Hàng chờ đang trống" description="Không có nội dung nào khớp với bộ lọc hiện tại. Mọi bản nộp đã được xử lý xong." />
      ) : (
        <View className="gap-3">
          {items.map((item) => (
            <QueueCard
              key={item.revisionId}
              item={item}
              isOwn={Boolean(currentUserId) && item.authorId === currentUserId}
              onView={() => setDetailItem(item)}
              onDecide={(value) => setDecision({ item, decision: value })}
            />
          ))}
          <PaginationBar page={query.data?.page ?? page} totalPages={query.data?.totalPages ?? 1} onChange={setPage} disabled={query.isFetching} />
        </View>
      )}

      {detailItem ? (
        <ContentReviewDetailSheet
          revisionId={detailItem.revisionId}
          isOwn={Boolean(currentUserId) && detailItem.authorId === currentUserId}
          onClose={() => setDetailItem(null)}
          onDecide={(value) => {
            setDecision({ item: detailItem, decision: value });
            setDetailItem(null);
          }}
        />
      ) : null}
      {decision ? (
        <ContentReviewDecisionDialog
          item={decision.item}
          decision={decision.decision}
          onClose={() => setDecision(null)}
          onDone={(outcome) => {
            setDecision(null);
            if (outcome === 'stale') void query.refetch();
          }}
        />
      ) : null}
    </View>
  );
}
