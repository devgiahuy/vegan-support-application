import * as React from 'react';
import { Alert } from 'react-native';
import { Flag } from 'lucide-react-native';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useIconColors } from '@/lib/theme-colors';
import { getApiErrorMessage } from '@/lib/api-error';
import { useSubmitReportMutation } from '../queries/safety.queries';
import type { ReportReasonCode, ReportTargetType } from '../types/safety.model';

const REASONS: { code: ReportReasonCode; label: string }[] = [
  { code: 'SPAM', label: 'Spam' },
  { code: 'HARMFUL_HEALTH', label: 'Thông tin sức khỏe gây hại' },
  { code: 'MISINFORMATION', label: 'Thông tin sai lệch' },
  { code: 'COPYRIGHT', label: 'Bản quyền' },
  { code: 'OTHER', label: 'Khác' },
];

export function ReportButton({ targetType, targetId }: { targetType: ReportTargetType; targetId: string }) {
  const colors = useIconColors();
  const mutation = useSubmitReportMutation();

  const submit = async (reasonCode: ReportReasonCode) => {
    try {
      await mutation.mutateAsync({ targetType, targetId, reasonCode });
      Alert.alert('Đã gửi báo cáo', 'Cảm ơn bạn đã giúp cộng đồng an toàn hơn.');
    } catch (error) {
      Alert.alert('Không gửi được báo cáo', getApiErrorMessage(error, 'Vui lòng thử lại sau.'));
    }
  };

  const openReasonPicker = () => {
    Alert.alert(
      'Báo cáo vi phạm',
      'Chọn lý do phù hợp nhất. Báo cáo là tín hiệu cho quản trị viên, không tự động xóa nội dung.',
      [
        { text: 'Hủy', style: 'cancel' },
        ...REASONS.map((reason) => ({
          text: reason.label,
          onPress: () => void submit(reason.code),
        })),
      ]
    );
  };

  return (
    <PrimaryButton
      label={mutation.isPending ? 'Đang gửi báo cáo...' : 'Báo cáo vi phạm'}
      variant="outline"
      loading={mutation.isPending}
      icon={<Flag size={16} color={colors.foreground} />}
      onPress={openReasonPicker}
    />
  );
}
