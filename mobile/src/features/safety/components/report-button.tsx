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
  { code: 'HARMFUL_HEALTH', label: 'Thong tin suc khoe gay hai' },
  { code: 'MISINFORMATION', label: 'Thong tin sai lech' },
  { code: 'COPYRIGHT', label: 'Ban quyen' },
  { code: 'OTHER', label: 'Khac' },
];

export function ReportButton({ targetType, targetId }: { targetType: ReportTargetType; targetId: string }) {
  const colors = useIconColors();
  const mutation = useSubmitReportMutation();

  const submit = async (reasonCode: ReportReasonCode) => {
    try {
      await mutation.mutateAsync({ targetType, targetId, reasonCode });
      Alert.alert('Da gui bao cao', 'Cam on ban da giup cong dong an toan hon.');
    } catch (error) {
      Alert.alert('Khong gui duoc bao cao', getApiErrorMessage(error, 'Vui long thu lai sau.'));
    }
  };

  const openReasonPicker = () => {
    Alert.alert(
      'Bao cao vi pham',
      'Chon ly do phu hop nhat. Bao cao la tin hieu cho quan tri vien, khong tu dong xoa noi dung.',
      [
        { text: 'Huy', style: 'cancel' },
        ...REASONS.map((reason) => ({
          text: reason.label,
          onPress: () => void submit(reason.code),
        })),
      ]
    );
  };

  return (
    <PrimaryButton
      label={mutation.isPending ? 'Dang gui bao cao...' : 'Bao cao vi pham'}
      variant="outline"
      loading={mutation.isPending}
      icon={<Flag size={16} color={colors.foreground} />}
      onPress={openReasonPicker}
    />
  );
}
