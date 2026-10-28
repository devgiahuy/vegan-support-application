import * as React from 'react';
import { Linking, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Calendar, CircleX, Flag, Play, ShieldAlert, TriangleAlert, User } from 'lucide-react-native';

import { FormSheet } from '@/components/shared/form-sheet';
import { ErrorState, LoadingState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useIconColors } from '@/lib/theme-colors';
import { useContentReviewDetailQuery } from '../queries/content-review.queries';
import type { ContentReviewDecision } from '../types/content-review.model';
import { getContentReviewErrorMessage } from '../utils/content-review-errors';

function Pill({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'danger' | 'success' }) {
  const cls = tone === 'danger' ? 'bg-destructive/10' : tone === 'success' ? 'bg-emerald-500/10' : 'bg-primary/10';
  const text = tone === 'danger' ? 'text-destructive' : tone === 'success' ? 'text-emerald-700 dark:text-emerald-300' : 'text-primary';
  return (
    <View className={`rounded-full px-2.5 py-0.5 ${cls}`}>
      <Text className={`text-[11px] font-semibold ${text}`}>{children}</Text>
    </View>
  );
}

/** Chi tiết bản nộp để thẩm định — đồng bộ `review-detail-modal.tsx` của web (BE không trả cấu trúc công thức riêng, chỉ `body`). */
export function ContentReviewDetailSheet({
  revisionId,
  isOwn,
  onClose,
  onDecide,
}: {
  revisionId: string;
  /** Bài do chính người đang đăng nhập tạo: chỉ được xem. */
  isOwn: boolean;
  onClose: () => void;
  onDecide: (decision: ContentReviewDecision) => void;
}) {
  const colors = useIconColors();
  const { data, isLoading, isError, error, refetch } = useContentReviewDetailQuery(revisionId);
  const canDecide = Boolean(data?.canDecide) && !isOwn;

  return (
    <FormSheet title="Chi tiết bản nộp" onClose={onClose}>
      {isLoading ? (
        <LoadingState message="Đang tải toàn bộ dữ liệu bản nộp…" />
      ) : isError || !data ? (
        <ErrorState title="Không tải được chi tiết kiểm duyệt." description={getContentReviewErrorMessage(error)} onRetry={() => void refetch()} />
      ) : (
        <>
          <View className="flex-row flex-wrap items-center gap-2">
            <Pill>{data.typeLabel}</Pill>
            <Pill>v{data.revisionVersion}</Pill>
            {data.isHighPriority ? <Pill tone="danger">Ưu tiên cao</Pill> : null}
            {data.isPublishedRevision ? <Pill tone="success">Bản xuất bản hiện hành</Pill> : null}
          </View>

          <Text className="text-xl font-bold leading-snug text-foreground">{data.title}</Text>

          <View className="gap-1.5">
            <View className="flex-row flex-wrap items-center gap-1.5">
              <User size={14} color={colors.mutedForeground} />
              <Text className="text-xs font-medium text-foreground">{data.authorName}</Text>
              {data.authorRoleLabel ? <Pill>{data.authorRoleLabel}</Pill> : null}
            </View>
            {data.formattedSubmittedAt ? (
              <View className="flex-row items-center gap-1.5">
                <Calendar size={14} color={colors.mutedForeground} />
                <Text className="text-xs text-muted-foreground">Nộp: {data.formattedSubmittedAt}</Text>
              </View>
            ) : null}
            {data.reportCount > 0 ? (
              <View className="flex-row items-center gap-1.5">
                <Flag size={14} color={colors.destructive} />
                <Text className="text-xs font-medium text-destructive">{data.reportCount} báo cáo vi phạm</Text>
              </View>
            ) : null}
          </View>

          {data.aiFlags.length > 0 ? (
            <View className="gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <View className="flex-row items-center gap-1.5">
                <TriangleAlert size={15} color={colors.cta} />
                <Text className="flex-1 text-xs font-semibold text-amber-900 dark:text-amber-200">Cảnh báo từ hệ thống AI Moderation ({data.aiFlags.length} tín hiệu)</Text>
              </View>
              {data.aiFlags.map((flag) => (
                <Text key={flag.id} className="text-xs leading-5 text-amber-800 dark:text-amber-300">
                  • {flag.riskLevelLabel}: {flag.reasonCodes.join(', ') || 'không rõ lý do'}
                  {flag.isOpen ? '' : ' (đã xem xét)'}
                </Text>
              ))}
              <Text className="text-[11px] italic text-muted-foreground">
                Tín hiệu AI chỉ hỗ trợ đánh giá, không phải kết luận vi phạm; quyết định do người kiểm duyệt đưa ra.
              </Text>
            </View>
          ) : null}

          {data.coverUrl ? (
            <View className="aspect-video overflow-hidden rounded-xl border border-border bg-muted">
              <Image source={{ uri: data.coverUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" accessibilityLabel="Ảnh bìa" />
            </View>
          ) : null}

          {data.videoUrl ? (
            <PrimaryButton label="Mở video để xem trước" variant="outline" icon={<Play size={16} color={colors.primary} />} onPress={() => void Linking.openURL(data.videoUrl as string)} />
          ) : null}

          {data.excerpt ? (
            <View className="rounded-xl border border-border bg-muted/40 p-3">
              <Text className="text-xs italic leading-5 text-muted-foreground">&quot;{data.excerpt}&quot;</Text>
            </View>
          ) : null}

          {data.body ? (
            <View className="gap-1.5">
              <Text className="text-xs font-bold uppercase text-muted-foreground">Nội dung toàn văn</Text>
              <View className="rounded-xl border border-border bg-muted/10 p-3">
                <Text selectable className="text-sm leading-6 text-foreground">{data.body}</Text>
              </View>
            </View>
          ) : null}

          {data.categories.length > 0 || data.tags.length > 0 ? (
            <View className="flex-row flex-wrap gap-1.5">
              {data.categories.map((name) => (
                <View key={name} className="rounded-full bg-secondary px-2.5 py-1"><Text className="text-[11px] text-secondary-foreground">📁 {name}</Text></View>
              ))}
              {data.tags.map((tag) => (
                <View key={tag} className="rounded-full border border-border px-2.5 py-1"><Text className="text-[11px] text-muted-foreground">#{tag}</Text></View>
              ))}
            </View>
          ) : null}

          {data.reviewNote ? (
            <View className="gap-0.5 rounded-xl border border-border bg-card p-3">
              <Text className="text-xs font-semibold text-foreground">Ghi chú đã có{data.reviewerName ? ` — ${data.reviewerName}` : ''}{data.formattedReviewedAt ? ` · ${data.formattedReviewedAt}` : ''}</Text>
              <Text className="text-xs leading-5 text-muted-foreground">{data.reviewNote}</Text>
            </View>
          ) : null}

          {!canDecide ? (
            <View className="flex-row items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <ShieldAlert size={16} color={colors.cta} />
              <Text className="flex-1 text-xs leading-5 text-amber-800 dark:text-amber-300">
                {isOwn ? 'Bạn không thể tự duyệt bài viết của chính mình (chỉ xem).' : 'Bạn không có quyền quyết định bản nộp này (chỉ xem).'}
              </Text>
            </View>
          ) : (
            <View className="gap-2">
              <PrimaryButton label="Duyệt" onPress={() => onDecide('APPROVE')} className="bg-emerald-600" />
              <PrimaryButton label="Từ chối" variant="outline" icon={<CircleX size={16} color={colors.destructive} />} onPress={() => onDecide('REJECT')} />
            </View>
          )}
        </>
      )}
      <PrimaryButton label="Đóng" variant="outline" onPress={onClose} />
    </FormSheet>
  );
}
