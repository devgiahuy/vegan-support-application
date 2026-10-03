import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { CheckCircle2, ShieldAlert, X } from 'lucide-react-native';

import { PostStatus } from '@/common/enums';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/state-views';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useReviewHistoryQuery } from '../queries/review.queries';
import type { ReviewRevision } from '../types/review.model';

function statusStyle(status: PostStatus): { badge: string; text: string } {
  if (status === PostStatus.PUBLISHED) return { badge: 'bg-emerald-500/10', text: 'text-emerald-600' };
  if (status === PostStatus.PENDING_REVIEW) return { badge: 'bg-amber-500/10', text: 'text-amber-600' };
  if (status === PostStatus.REJECTED || status === PostStatus.FLAGGED || status === PostStatus.QUARANTINED) {
    return { badge: 'bg-destructive/10', text: 'text-destructive' };
  }
  return { badge: 'bg-muted', text: 'text-muted-foreground' };
}

function RevisionCard({ revision }: { revision: ReviewRevision }) {
  const colors = useIconColors();
  const style = statusStyle(revision.status);
  return (
    <View className="gap-1.5 rounded-xl border border-border bg-card p-3">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground">
            Bản {revision.version}
            {revision.isPublishedRevision ? ' · đang hiển thị công khai' : ''}
          </Text>
          <Text numberOfLines={2} className="text-xs text-muted-foreground">
            {revision.title}
          </Text>
        </View>
        <View className={cn('rounded-full px-2 py-0.5', style.badge)}>
          <Text className={cn('text-[11px] font-semibold', style.text)}>{revision.statusLabel}</Text>
        </View>
      </View>

      <Text className="text-[11px] text-muted-foreground">
        Tạo {revision.formattedCreatedAt}
        {revision.formattedSubmittedAt ? ` · gửi duyệt ${revision.formattedSubmittedAt}` : ''}
      </Text>

      {revision.formattedReviewedAt ? (
        <View className="flex-row items-center gap-1.5">
          <CheckCircle2 size={12} color={colors.primary} />
          <Text className="flex-1 text-[11px] text-muted-foreground">
            Duyệt {revision.formattedReviewedAt}
            {revision.reviewerName ? ` bởi ${revision.reviewerName}` : ''}
          </Text>
        </View>
      ) : null}

      {revision.reviewNote ? (
        <View className="rounded-lg bg-muted/60 p-2.5">
          <Text className="text-xs font-semibold text-foreground">Ghi chú của người duyệt</Text>
          <Text className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{revision.reviewNote}</Text>
        </View>
      ) : null}

      {revision.signals.length > 0 ? (
        <View className="gap-1">
          {revision.signals.map((signal) => (
            <View key={signal.id} className="flex-row items-start gap-1.5">
              <ShieldAlert size={12} color={colors.mutedForeground} />
              <Text className="flex-1 text-[11px] text-muted-foreground">
                Tín hiệu tự động: {signal.riskLevelLabel}
                {signal.reasonCodes.length > 0 ? ` (${signal.reasonCodes.join(', ')})` : ''}
                {signal.isOpen ? ' · chờ người xem xét' : ''}
              </Text>
            </View>
          ))}
          <Text className="text-[10px] italic text-muted-foreground">
            Tín hiệu tự động chỉ để tham khảo, quyết định cuối cùng do người duyệt.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Hộp "Lịch sử duyệt" của tác giả — đồng bộ `review-history-dialog` của web: mỗi bản chỉnh sửa kèm trạng thái,
 * thời điểm gửi/duyệt, người duyệt, lý do và tín hiệu kiểm duyệt tự động.
 */
export function ReviewHistorySheet({
  postId,
  title,
  onClose,
}: {
  postId: string | null;
  title?: string;
  onClose: () => void;
}) {
  const colors = useIconColors();
  const { data, isLoading, isError, refetch } = useReviewHistoryQuery(postId ?? '', postId !== null);
  if (postId === null) return null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Đóng" />
        <View className="max-h-[85%] rounded-t-3xl bg-background px-5 pb-6 pt-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">Lịch sử duyệt</Text>
              {title ? (
                <Text numberOfLines={1} className="text-xs text-muted-foreground">
                  {title}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={onClose} accessibilityLabel="Đóng" className="h-9 w-9 items-center justify-center rounded-full bg-muted">
              <X size={16} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView className="mt-3" contentContainerClassName="gap-2.5 pb-2">
            {isLoading ? (
              <LoadingState message="Đang tải lịch sử duyệt..." />
            ) : isError ? (
              <ErrorState title="Không tải được lịch sử duyệt." onRetry={() => void refetch()} />
            ) : (data?.revisions.length ?? 0) === 0 ? (
              <EmptyState title="Chưa có lịch sử duyệt" description="Bài chưa được gửi duyệt lần nào." />
            ) : (
              data?.revisions.map((revision) => <RevisionCard key={revision.id} revision={revision} />)
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
