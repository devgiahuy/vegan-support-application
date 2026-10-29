import * as React from 'react';
import { Text, TextInput, View } from 'react-native';
import { CircleAlert, CircleCheck, CircleX, TriangleAlert } from 'lucide-react-native';

import { FormSheet } from '@/components/shared/form-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useIconColors } from '@/lib/theme-colors';
import { useContentReviewDecisionMutation } from '../queries/content-review.queries';
import {
  MAX_REVIEW_REASON_LENGTH,
  MIN_REVIEW_REASON_LENGTH,
  type ContentReviewDecision,
  type ContentReviewQueueItem,
} from '../types/content-review.model';
import { getContentReviewErrorMessage, isReviewStaleError } from '../utils/content-review-errors';

/**
 * Xác nhận duyệt/từ chối kèm lý do — đồng bộ `review-decision-dialog.tsx` của web.
 * Backend bắt buộc lý do 10–2000 ký tự cho cả hai quyết định (khác placeholder "để trống" của web), nên ở đây bắt buộc luôn.
 */
export function ContentReviewDecisionDialog({
  item,
  decision,
  onClose,
  onDone,
}: {
  item: ContentReviewQueueItem;
  decision: ContentReviewDecision;
  onClose: () => void;
  /** Gọi sau khi quyết định thành công, hoặc khi bản nộp đã được xử lý (stale) để màn hình tải lại hàng chờ. */
  onDone: (outcome: 'decided' | 'stale') => void;
}) {
  const colors = useIconColors();
  const mutation = useContentReviewDecisionMutation();
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState('');
  const [stale, setStale] = React.useState(false);
  const approve = decision === 'APPROVE';
  const length = reason.trim().length;
  const tooShort = length < MIN_REVIEW_REASON_LENGTH;

  const submit = async () => {
    setError('');
    if (tooShort) return setError(`Lý do ${approve ? 'duyệt' : 'từ chối'} phải có ít nhất ${MIN_REVIEW_REASON_LENGTH} ký tự.`);
    try {
      await mutation.mutateAsync({ revisionId: item.revisionId, decision, reason });
      onDone('decided');
    } catch (value) {
      setError(getContentReviewErrorMessage(value, decision));
      // Bản nộp đã được xử lý/đổi trạng thái: giữ lời giải thích và chỉ cho tải lại hàng chờ.
      if (isReviewStaleError(value)) setStale(true);
    }
  };

  return (
    <FormSheet title={approve ? 'Duyệt bài viết?' : 'Từ chối bài viết?'} variant="popup" busy={mutation.isPending} onClose={onClose}>
      <View className="items-center gap-2">
        <View className={approve ? 'size-12 items-center justify-center rounded-full bg-emerald-500/10' : 'size-12 items-center justify-center rounded-full bg-destructive/10'}>
          {approve ? <CircleCheck size={24} color="#059669" /> : <CircleX size={24} color={colors.destructive} />}
        </View>
        <Text className="text-center text-sm leading-5 text-muted-foreground">
          Bài viết <Text className="font-semibold text-foreground">&quot;{item.title}&quot;</Text>
          {approve ? ' sẽ được xuất bản công khai ngay sau khi duyệt.' : ' sẽ chuyển về trạng thái từ chối kèm lý do để tác giả chỉnh sửa.'}
        </Text>
      </View>

      {stale ? (
        <>
          <View className="flex-row items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
            <CircleAlert size={16} color={colors.destructive} />
            <Text accessibilityRole="alert" className="flex-1 text-xs leading-5 text-destructive">{error}</Text>
          </View>
          <PrimaryButton label="Tải lại hàng chờ" onPress={() => onDone('stale')} />
        </>
      ) : !item.canDecide ? (
        <View className="flex-row items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
          <TriangleAlert size={16} color={colors.cta} />
          <Text className="flex-1 text-xs leading-5 text-amber-800 dark:text-amber-300">
            Bạn không thể quyết định bài này (bài do chính bạn tạo hoặc bạn không có quyền duyệt). Hãy để người kiểm duyệt khác xử lý.
          </Text>
        </View>
      ) : (
        <>
          {error ? (
            <View className="flex-row items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
              <CircleAlert size={16} color={colors.destructive} />
              <Text accessibilityRole="alert" className="flex-1 text-xs leading-5 text-destructive">{error}</Text>
            </View>
          ) : null}
          <View className="gap-1.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-foreground">{approve ? 'Lý do duyệt *' : 'Lý do từ chối *'}</Text>
              <Text className="text-xs text-muted-foreground">{length}/{MAX_REVIEW_REASON_LENGTH} (tối thiểu {MIN_REVIEW_REASON_LENGTH})</Text>
            </View>
            <TextInput
              value={reason}
              onChangeText={(text) => {
                setReason(text.slice(0, MAX_REVIEW_REASON_LENGTH));
                if (error) setError('');
              }}
              editable={!mutation.isPending}
              multiline
              textAlignVertical="top"
              placeholder={approve ? 'Ví dụ: Nguyên liệu thuần chay rõ ràng, định lượng đầy đủ.' : 'Ví dụ: Thiếu định lượng nguyên liệu ở bước 2, ảnh bìa chưa rõ.'}
              placeholderTextColor={colors.mutedForeground}
              className="min-h-28 rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-5 text-foreground"
            />
          </View>
          <PrimaryButton
            label={mutation.isPending ? 'Đang gửi…' : approve ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
            loading={mutation.isPending}
            disabled={mutation.isPending || tooShort}
            onPress={() => void submit()}
            className={approve ? '' : 'bg-destructive'}
          />
        </>
      )}
      {stale ? null : <PrimaryButton label="Huỷ bỏ" variant="outline" disabled={mutation.isPending} onPress={onClose} />}
    </FormSheet>
  );
}
