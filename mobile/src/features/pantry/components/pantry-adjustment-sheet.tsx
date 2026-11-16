import * as React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { FormSheet } from '@/components/shared/form-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { createOperationKey } from '@/lib/operation-key';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { pantryErrorMessage } from '../lib/pantry-errors';
import { useAdjustPantryItemMutation, usePantryItemQuery } from '../queries/pantry.queries';
import type { PantryItem } from '../types/pantry.model';

type AdjustType = 'CONSUME' | 'RESTORE' | 'ADJUST';

const TYPE_OPTIONS: { value: AdjustType; label: string }[] = [
  { value: 'CONSUME', label: 'Tiêu hao' },
  { value: 'RESTORE', label: 'Hoàn trả' },
  { value: 'ADJUST', label: 'Bù sai lệch' },
];

const REASON_PLACEHOLDERS: Record<AdjustType, string> = {
  CONSUME: 'Ví dụ: Nấu canh chua tối nay...',
  RESTORE: 'Ví dụ: Thừa sau khi chế biến...',
  ADJUST: 'Lý do bắt buộc: Cân lại thực tế, hao hụt tự nhiên...',
};

/**
 * Hộp "Điều chỉnh số lượng" — đồng bộ `PantryAdjustmentDialog` của web: tiêu đề kèm tồn kho hiện tại, chọn hình thức
 * (Tiêu hao / Hoàn trả / Bù sai lệch), nhập số lượng, lý do ghi nhận và nút Hủy / Xác nhận. Tiêu hao không được vượt tồn kho;
 * bù sai lệch bắt buộc có lý do. Mọi điều chỉnh được backend ghi vào sổ cái để đối soát.
 */
export function PantryAdjustmentSheet({
  item: listItem,
  initialType = 'CONSUME',
  onClose,
}: {
  item: PantryItem;
  initialType?: AdjustType;
  onClose: () => void;
}) {
  const colors = useIconColors();
  // Danh sách có thể đã cũ; chi tiết mới nhất cung cấp `version` đúng cho khóa lạc quan.
  const detail = usePantryItemQuery(listItem.id);
  const item = detail.data ?? listItem;
  const adjust = useAdjustPantryItemMutation();
  const [type, setType] = React.useState<AdjustType>(initialType);
  const [amount, setAmount] = React.useState(initialType === 'ADJUST' ? '' : '1');
  const [reason, setReason] = React.useState('');
  const [error, setError] = React.useState('');
  const operation = React.useRef<{ fingerprint: string; key: string } | null>(null);

  const selectType = (value: AdjustType) => {
    if (value === type || adjust.isPending) return;
    setType(value);
    setAmount(value === 'ADJUST' ? '' : '1');
    setReason('');
    setError('');
  };

  const submit = () => {
    setError('');
    const parsed = Number(amount.trim().replace(',', '.'));
    if (!Number.isFinite(parsed) || amount.trim() === '') return setError('Vui lòng nhập số lượng hợp lệ.');
    if (type === 'ADJUST') {
      if (parsed === 0) return setError('Số lượng điều chỉnh không được bằng 0.');
      if (!reason.trim()) return setError('Vui lòng nhập lý do điều chỉnh sai lệch.');
    } else {
      if (parsed <= 0) return setError(`Số lượng ${type === 'CONSUME' ? 'tiêu hao' : 'hoàn trả'} phải lớn hơn 0.`);
      if (type === 'CONSUME' && parsed > item.quantity)
        return setError(`Không thể tiêu hao quá tồn kho hiện có (${item.formattedQuantity}).`);
    }
    if (Math.abs(parsed) > 999999999) return setError('Số lượng quá lớn.');

    const fingerprint = JSON.stringify([item.version, type, parsed, reason.trim()]);
    if (operation.current?.fingerprint !== fingerprint) {
      operation.current = { fingerprint, key: createOperationKey('pantry-adjust') };
    }
    adjust.mutate(
      {
        id: item.id,
        values: {
          type,
          amount: parsed,
          unit: item.unit,
          reason,
          expectedVersion: item.version,
          idempotencyKey: operation.current.key,
        },
      },
      {
        onSuccess: onClose,
        onError: (value) => setError(pantryErrorMessage(value)),
      }
    );
  };

  const quantityLabel =
    type === 'ADJUST' ? 'Số lượng sai lệch (+ tăng / - giảm)' : `Số lượng ${type === 'CONSUME' ? 'tiêu hao' : 'hoàn trả'}`;

  return (
    <FormSheet title={`Điều chỉnh số lượng: ${item.displayName}`} onClose={onClose} busy={adjust.isPending} variant="popup">
      <View className="gap-4 pb-2">
        <Text className="text-sm leading-5 text-muted-foreground">
          Tồn kho hiện tại: <Text className="font-bold text-foreground">{item.formattedQuantity}</Text>. Mọi điều chỉnh đều được ghi vào sổ cái
          bất biến để đối soát.
        </Text>

        <View className="gap-2">
          <Text className="text-xs font-semibold text-foreground">Hình thức điều chỉnh</Text>
          <View className="flex-row gap-2">
            {TYPE_OPTIONS.map((option) => {
              const selected = type === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  disabled={adjust.isPending}
                  onPress={() => selectType(option.value)}
                  className={cn(
                    'min-h-12 flex-1 items-center justify-center rounded-lg border-2 px-1.5 py-2',
                    selected ? 'border-primary bg-primary/10' : 'border-border bg-card'
                  )}>
                  <Text className={cn('text-center text-xs font-semibold', selected ? 'text-primary' : 'text-muted-foreground')}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-1.5">
          <Text className="text-xs font-medium text-foreground">
            {quantityLabel} <Text className="text-destructive">*</Text>
          </Text>
          <TextInput
            accessibilityLabel={quantityLabel}
            value={amount}
            onChangeText={setAmount}
            editable={!adjust.isPending}
            keyboardType={type === 'ADJUST' ? 'numbers-and-punctuation' : 'decimal-pad'}
            placeholder={type === 'ADJUST' ? 'Ví dụ: -50 hoặc 100' : undefined}
            placeholderTextColor={colors.mutedForeground}
            className="h-12 rounded-xl border border-input bg-background px-4 text-sm text-foreground"
          />
        </View>

        <View className="gap-1.5">
          <Text className="text-xs font-medium text-foreground">
            Lý do ghi nhận {type === 'ADJUST' ? <Text className="text-destructive">*</Text> : null}
          </Text>
          <TextInput
            accessibilityLabel="Lý do ghi nhận"
            value={reason}
            onChangeText={setReason}
            editable={!adjust.isPending}
            multiline
            numberOfLines={3}
            maxLength={1000}
            textAlignVertical="top"
            placeholder={REASON_PLACEHOLDERS[type]}
            placeholderTextColor={colors.mutedForeground}
            className="min-h-20 rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground"
          />
        </View>

        {error ? (
          <Text accessibilityRole="alert" className="text-sm text-destructive">
            {error}
          </Text>
        ) : null}

        <View className="flex-row justify-end gap-2 pt-1">
          <PrimaryButton label="Hủy" variant="outline" disabled={adjust.isPending} onPress={onClose} />
          <PrimaryButton
            label={adjust.isPending ? 'Đang ghi nhận...' : 'Xác nhận điều chỉnh'}
            loading={adjust.isPending}
            disabled={adjust.isPending}
            onPress={submit}
          />
        </View>
      </View>
    </FormSheet>
  );
}
