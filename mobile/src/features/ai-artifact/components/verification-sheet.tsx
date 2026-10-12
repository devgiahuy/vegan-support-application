import * as React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { BadgeCheck, BadgeX, FileCheck2 } from 'lucide-react-native';

import { AiVerificationConclusion } from '@/common/enums';
import { FormSheet } from '@/components/shared/form-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useCreateAiVerificationMutation } from '../queries/ai-artifact.queries';
import type { AiArtifact } from '../types/ai-artifact.model';
import { getAiArtifactErrorMessage } from '../utils/ai-artifact-errors';

const CONCLUSION_OPTIONS: {
  value: AiVerificationConclusion;
  label: string;
  description: string;
}[] = [
  {
    value: AiVerificationConclusion.VERIFIED,
    label: 'Chính xác',
    description: 'Nội dung phù hợp trong phạm vi đã kiểm tra.',
  },
  {
    value: AiVerificationConclusion.CORRECTION_NEEDED,
    label: 'Cần chỉnh lý',
    description: 'Có điểm đúng nhưng cần bổ sung hoặc sửa rõ.',
  },
  {
    value: AiVerificationConclusion.REJECTED,
    label: 'Không chuẩn xác',
    description: 'Không nên dùng làm thông tin tham khảo.',
  },
];

function validateText(value: string, min: number, max: number, label: string): string | null {
  const length = value.trim().length;
  if (length < min) return `${label} cần ít nhất ${min} ký tự.`;
  if (length > max) return `${label} tối đa ${max} ký tự.`;
  return null;
}

export function VerificationSheet({
  artifact,
  onClose,
}: {
  artifact: AiArtifact;
  onClose: () => void;
}) {
  const colors = useIconColors();
  const mutation = useCreateAiVerificationMutation();
  const [conclusion, setConclusion] = React.useState<AiVerificationConclusion>(AiVerificationConclusion.VERIFIED);
  const [scope, setScope] = React.useState('Nội dung hiển thị trong bản ghi công khai.');
  const [evidenceNote, setEvidenceNote] = React.useState('');
  const [correction, setCorrection] = React.useState('');
  const [error, setError] = React.useState('');

  const needsCorrection = conclusion === AiVerificationConclusion.CORRECTION_NEEDED;

  const submit = async () => {
    const scopeError = validateText(scope, 3, 2000, 'Phạm vi');
    const noteError = validateText(evidenceNote, 3, 10000, 'Ghi chú bằng chứng');
    const correctionError = needsCorrection && correction.trim().length > 0
      ? validateText(correction, 3, 10000, 'Chỉnh lý đề xuất')
      : null;
    const nextError = scopeError ?? noteError ?? correctionError;
    if (nextError) {
      setError(nextError);
      return;
    }

    setError('');
    try {
      await mutation.mutateAsync({
        artifactId: artifact.id,
        expectedArtifactVersion: artifact.version,
        conclusion,
        scope,
        evidenceNote,
        correction,
      });
      Alert.alert('Đã ghi thẩm định', 'Ý kiến của bạn đã được lưu vào bản ghi tri thức AI.');
      onClose();
    } catch (verificationError) {
      setError(getAiArtifactErrorMessage(verificationError));
    }
  };

  return (
    <FormSheet title="Thẩm định tri thức AI" onClose={onClose} busy={mutation.isPending}>
      <View className="gap-1.5 rounded-2xl border border-border bg-card p-3.5">
        <Text className="text-xs font-semibold text-muted-foreground">Bản ghi</Text>
        <Text className="text-base font-bold text-foreground">{artifact.title}</Text>
        <Text className="text-xs leading-relaxed text-muted-foreground">
          Việc thẩm định là ý kiến kiểm tra của Contributor/Admin, không phải chứng nhận khoa học hoặc tư vấn y khoa.
        </Text>
      </View>

      <View className="gap-2">
        <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kết luận</Text>
        {CONCLUSION_OPTIONS.map((option) => {
          const selected = conclusion === option.value;
          const Icon = option.value === AiVerificationConclusion.VERIFIED ? BadgeCheck : option.value === AiVerificationConclusion.REJECTED ? BadgeX : FileCheck2;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => {
                setConclusion(option.value);
                setError('');
              }}
              className={cn(
                'flex-row items-start gap-3 rounded-2xl border p-3',
                selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
              )}>
              <Icon size={18} color={selected ? colors.primary : colors.mutedForeground} />
              <View className="flex-1 gap-0.5">
                <Text className={cn('text-sm font-bold', selected ? 'text-primary' : 'text-foreground')}>{option.label}</Text>
                <Text className="text-xs leading-relaxed text-muted-foreground">{option.description}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <TextField
        label="Phạm vi kiểm tra"
        value={scope}
        onChangeText={setScope}
        multiline
        maxLength={2000}
        className="min-h-24 pt-3"
        editable={!mutation.isPending}
      />
      <TextField
        label="Ghi chú bằng chứng"
        value={evidenceNote}
        onChangeText={setEvidenceNote}
        multiline
        maxLength={10000}
        placeholder="VD: Đối chiếu với tài liệu dinh dưỡng, kinh nghiệm thực hành, hoặc nguồn tham khảo phù hợp..."
        className="min-h-28 pt-3"
        editable={!mutation.isPending}
      />
      {needsCorrection ? (
        <TextField
          label="Chỉnh lý đề xuất"
          value={correction}
          onChangeText={setCorrection}
          multiline
          maxLength={10000}
          placeholder="Nêu phần cần sửa hoặc bổ sung để người đọc hiểu đúng phạm vi."
          className="min-h-24 pt-3"
          editable={!mutation.isPending}
        />
      ) : null}

      {error ? <Text className="text-sm text-destructive">{error}</Text> : null}

      <PrimaryButton
        label="Ghi thẩm định"
        loading={mutation.isPending}
        icon={<FileCheck2 size={16} color={colors.primaryForeground} />}
        onPress={() => void submit()}
      />
    </FormSheet>
  );
}
