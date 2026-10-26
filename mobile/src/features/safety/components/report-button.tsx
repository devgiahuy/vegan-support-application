import * as React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Flag } from 'lucide-react-native';
import { FormSheet } from '@/components/shared/form-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useIconColors } from '@/lib/theme-colors';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useSubmitReportMutation } from '../queries/safety.queries';
import type { ReportReasonCode, ReportTargetType } from '../types/safety.model';

const REASONS: { code: ReportReasonCode; label: string }[] = [
  { code: 'SPAM', label: 'Spam' },
  { code: 'HARMFUL_HEALTH', label: 'Gây hại sức khỏe' },
  { code: 'HARASSMENT', label: 'Quấy rối' },
  { code: 'MISINFORMATION', label: 'Thông tin sai lệch' },
  { code: 'COPYRIGHT', label: 'Vi phạm bản quyền' },
  { code: 'OTHER', label: 'Lý do khác' },
];

/** Backend yêu cầu mô tả (nếu có) dài 10–2000 ký tự. */
const DETAILS_MIN = 10;
const DETAILS_MAX = 2000;

function ReportSheet({
  targetType,
  targetId,
  onClose,
  onReported,
}: {
  targetType: ReportTargetType;
  targetId: string;
  onClose: () => void;
  onReported: () => void;
}) {
  const colors = useIconColors();
  const mutation = useSubmitReportMutation();
  const [reasonCode, setReasonCode] = React.useState<ReportReasonCode>('SPAM');
  const [details, setDetails] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const submit = async () => {
    const trimmed = details.trim();
    if (trimmed.length > 0 && trimmed.length < DETAILS_MIN) {
      setError(`Mô tả cần tối thiểu ${DETAILS_MIN} ký tự, hoặc để trống.`);
      return;
    }
    setError(null);
    try {
      await mutation.mutateAsync({
        targetType,
        targetId,
        reasonCode,
        details: trimmed.length > 0 ? trimmed : undefined,
      });
      onReported();
      onClose();
      Alert.alert('Đã gửi báo cáo', 'Cảm ơn bạn đã giúp cộng đồng an toàn hơn.');
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'Không gửi được báo cáo. Vui lòng thử lại sau.'));
    }
  };

  return (
    <FormSheet title="Báo cáo vi phạm" onClose={onClose} busy={mutation.isPending} variant="popup">
      <Text className="text-xs leading-relaxed text-muted-foreground">
        Chọn lý do phù hợp nhất. Báo cáo là tín hiệu cho quản trị viên xem xét, không tự động xóa nội dung.
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {REASONS.map((reason) => {
          const selected = reason.code === reasonCode;
          return (
            <Pressable
              key={reason.code}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setReasonCode(reason.code)}
              className={cn(
                'min-h-10 justify-center rounded-full border px-3.5',
                selected ? 'border-primary bg-primary' : 'border-border bg-card'
              )}>
              <Text className={cn('text-sm font-medium', selected ? 'text-primary-foreground' : 'text-foreground')}>
                {reason.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        value={details}
        onChangeText={setDetails}
        multiline
        maxLength={DETAILS_MAX}
        placeholder="Mô tả thêm (không bắt buộc)"
        placeholderTextColor={colors.mutedForeground}
        className="min-h-24 rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground"
        textAlignVertical="top"
      />
      {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
      <PrimaryButton
        label={mutation.isPending ? 'Đang gửi...' : 'Gửi báo cáo'}
        loading={mutation.isPending}
        onPress={() => void submit()}
      />
    </FormSheet>
  );
}

/**
 * Nút báo cáo bài (POST) hoặc bình luận (COMMENT). `compact` là dạng liên kết nhỏ đặt cạnh bình luận.
 * Ẩn khi chưa đăng nhập hoặc khi `authorId` là chính người dùng.
 */
export function ReportButton({
  targetType,
  targetId,
  authorId,
  compact = false,
  layout = 'full',
}: {
  targetType: ReportTargetType;
  targetId: string;
  authorId?: string;
  compact?: boolean;
  /** `inline`: nút ngắn "Báo cáo" chia đều chiều ngang để đặt cạnh các nút khác trong một hàng. */
  layout?: 'full' | 'inline';
}) {
  const colors = useIconColors();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [open, setOpen] = React.useState(false);
  const [reported, setReported] = React.useState(false);

  if (!isAuthenticated || (authorId && authorId === currentUserId)) return null;

  if (compact) {
    return (
      <>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={reported ? 'Đã báo cáo bình luận' : 'Báo cáo bình luận'}
          disabled={reported}
          onPress={() => setOpen(true)}
          hitSlop={6}
          className="flex-row items-center gap-1 self-start">
          <Flag size={12} color={colors.mutedForeground} />
          <Text className="text-xs font-semibold text-muted-foreground">{reported ? 'Đã báo cáo' : 'Báo cáo'}</Text>
        </Pressable>
        {open ? (
          <ReportSheet
            targetType={targetType}
            targetId={targetId}
            onClose={() => setOpen(false)}
            onReported={() => setReported(true)}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <PrimaryButton
        label={reported ? 'Đã báo cáo' : layout === 'inline' ? 'Báo cáo' : 'Báo cáo vi phạm'}
        variant="outline"
        className={layout === 'inline' ? 'flex-1' : undefined}
        disabled={reported}
        icon={<Flag size={16} color={colors.foreground} />}
        onPress={() => setOpen(true)}
      />
      {open ? (
        <ReportSheet
          targetType={targetType}
          targetId={targetId}
          onClose={() => setOpen(false)}
          onReported={() => setReported(true)}
        />
      ) : null}
    </>
  );
}
