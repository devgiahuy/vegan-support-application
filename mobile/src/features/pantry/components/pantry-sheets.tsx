import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { FormSheet } from '@/components/shared/form-sheet';
import { ErrorState, LoadingState } from '@/components/shared/state-views';
import { DateField } from '@/components/ui/date-field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { IngredientPicker } from '@/features/ingredient/components/ingredient-picker';
import { createOperationKey } from '@/lib/operation-key';
import { isValidDateInput } from '../lib/date-input';
import { pantryErrorMessage } from '../lib/pantry-errors';
import {
  useAdjustPantryItemMutation,
  useCreatePantryItemMutation,
  useMergePantryItemsMutation,
  usePantryAdjustmentsQuery,
  usePantryItemQuery,
  usePantryMergePreviewMutation,
  useUpdatePantryItemMutation,
} from '../queries/pantry.queries';
import type { PantryItem } from '../types/pantry.model';

function InlineError({ message }: { message: string }) {
  return message ? (
    <Text accessibilityRole="alert" className="text-sm text-destructive">
      {message}
    </Text>
  ) : null;
}

export function PantryCreateSheet({ onClose }: { onClose: () => void }) {
  const mutation = useCreatePantryItemMutation();
  const [identity, setIdentity] = React.useState<{
    displayName: string;
    ingredientId: string | null;
  }>({ displayName: '', ingredientId: null });
  const [quantity, setQuantity] = React.useState('');
  const [unit, setUnit] = React.useState('g');
  const [purchasedAt, setPurchasedAt] = React.useState('');
  const [date, setDate] = React.useState('');
  const [note, setNote] = React.useState('');
  const [error, setError] = React.useState('');
  const operation = React.useRef<{ fingerprint: string; key: string } | null>(null);
  const submit = () => {
    const amount = Number(quantity.replace(',', '.'));
    if (!identity.displayName.trim() || identity.displayName.length > 160)
      return setError('Tên nguyên liệu cần có 1-160 ký tự.');
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 999999999 ||
      !unit.trim() ||
      unit.length > 40
    )
      return setError('Nhập số lượng dương và đơn vị hợp lệ.');
    if (!isValidDateInput(purchasedAt.trim()))
      return setError('Ngày mua phải là ngày hợp lệ dạng YYYY-MM-DD.');
    if (!isValidDateInput(date.trim()))
      return setError('Hạn dùng phải là ngày hợp lệ dạng YYYY-MM-DD.');
    const fingerprint = JSON.stringify([
      identity,
      amount,
      unit.trim(),
      purchasedAt.trim(),
      date.trim(),
      note.trim(),
    ]);
    if (operation.current?.fingerprint !== fingerprint)
      operation.current = {
        fingerprint,
        key: createOperationKey('pantry-create'),
      };
    setError('');
    mutation.mutate(
      {
        ingredientId: identity.ingredientId ?? undefined,
        unmatchedText: identity.displayName,
        quantity: amount,
        unit: unit.trim(),
        purchasedAt: purchasedAt.trim(),
        expiresAt: date.trim(),
        freshnessNote: note,
        idempotencyKey: operation.current.key,
      },
      {
        onSuccess: onClose,
        onError: (value) => setError(pantryErrorMessage(value)),
      }
    );
  };
  return (
    <FormSheet title="Thêm nguyên liệu" onClose={onClose} busy={mutation.isPending} variant="popup">
      <IngredientPicker label="Nguyên liệu" value={identity} onChange={setIdentity} />
      <TextField
        label="Số lượng"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="decimal-pad"
      />
      <TextField label="Đơn vị" value={unit} onChangeText={setUnit} maxLength={40} />
      <DateField label="Ngày mua" value={purchasedAt} onChange={setPurchasedAt} clearable />
      <DateField label="Hạn dùng" value={date} onChange={setDate} clearable />
      <TextField label="Ghi chú độ tươi" value={note} onChangeText={setNote} maxLength={5000} />
      <InlineError message={error} />
      <PrimaryButton label="Thêm vào tủ bếp" loading={mutation.isPending} onPress={submit} />
    </FormSheet>
  );
}

export function PantryItemSheet({
  item: listItem,
  onClose,
  initialMode = 'OBSERVATION',
  initialType = 'CONSUME',
}: {
  item: PantryItem;
  onClose: () => void;
  /** Tab mở đầu tiên: bấm "Tiêu hao"/"Bổ sung" ngoài danh sách mở thẳng tab Số lượng. */
  initialMode?: 'OBSERVATION' | 'QUANTITY' | 'HISTORY';
  initialType?: 'CONSUME' | 'RESTORE' | 'ADJUST';
}) {
  // Danh sách có thể đã cũ; chi tiết mới nhất cung cấp `version` đúng cho khóa lạc quan khi lưu.
  const detail = usePantryItemQuery(listItem.id);
  const item = detail.data ?? listItem;
  const syncedVersion = React.useRef(item.version);
  const [refreshed, setRefreshed] = React.useState(false);
  const [mode, setMode] = React.useState<'OBSERVATION' | 'QUANTITY' | 'HISTORY'>(initialMode);
  const [purchasedAt, setPurchasedAt] = React.useState(item.purchasedAt ?? '');
  const [openedAt, setOpenedAt] = React.useState(item.openedAt ?? '');
  const [expiresAt, setExpiresAt] = React.useState(item.expiresAt ?? '');
  const [note, setNote] = React.useState(item.freshnessNote ?? '');
  const [type, setType] = React.useState<'CONSUME' | 'RESTORE' | 'ADJUST'>(initialType);
  const [amount, setAmount] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [error, setError] = React.useState('');
  const update = useUpdatePantryItemMutation();
  const adjust = useAdjustPantryItemMutation();
  const history = usePantryAdjustmentsQuery(mode === 'HISTORY' ? item.id : '', page);
  const operation = React.useRef<{ fingerprint: string; key: string } | null>(null);
  const busy = update.isPending || adjust.isPending;
  React.useEffect(() => {
    const fresh = detail.data;
    if (!fresh || fresh.version === syncedVersion.current) return;
    syncedVersion.current = fresh.version;
    setPurchasedAt(fresh.purchasedAt ?? '');
    setOpenedAt(fresh.openedAt ?? '');
    setExpiresAt(fresh.expiresAt ?? '');
    setNote(fresh.freshnessNote ?? '');
    setRefreshed(true);
  }, [detail.data]);
  const save = () => {
    setError('');
    if (mode === 'OBSERVATION') {
      if (![purchasedAt, openedAt, expiresAt].every((value) => isValidDateInput(value.trim())))
        return setError('Ngày phải hợp lệ và có dạng YYYY-MM-DD.');
      update.mutate(
        {
          id: item.id,
          values: {
            expectedVersion: item.version,
            purchasedAt: purchasedAt.trim(),
            openedAt: openedAt.trim(),
            expiresAt: expiresAt.trim(),
            freshnessNote: note,
          },
        },
        {
          onSuccess: onClose,
          onError: (value) => setError(pantryErrorMessage(value)),
        }
      );
    } else {
      const parsed = Number(amount.replace(',', '.'));
      if (
        !Number.isFinite(parsed) ||
        parsed === 0 ||
        Math.abs(parsed) > 999999999 ||
        (type !== 'ADJUST' && parsed < 0)
      )
        return setError('Nhập số lượng hợp lệ khác 0; dùng/hoàn trả cần số dương.');
      if (type === 'ADJUST' && !reason.trim()) return setError('Điều chỉnh cần ghi lý do.');
      const fingerprint = JSON.stringify([type, parsed, reason.trim()]);
      if (operation.current?.fingerprint !== fingerprint)
        operation.current = {
          fingerprint,
          key: createOperationKey('pantry-adjust'),
        };
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
    }
  };
  return (
    <FormSheet title={item.displayName} onClose={onClose} busy={busy} variant="popup">
      <Text className="text-sm text-muted-foreground">Hiện có: {item.formattedQuantity}</Text>
      {refreshed ? (
        <Text className="text-xs text-primary">Mục này đã thay đổi, thông tin đã được tải lại theo bản mới nhất.</Text>
      ) : null}
      <View className="flex-row gap-2">
        {(['OBSERVATION', 'QUANTITY', 'HISTORY'] as const).map((value) => (
          <Pressable
            key={value}
            disabled={busy}
            accessibilityRole="tab"
            accessibilityState={{ selected: mode === value }}
            onPress={() => {
              setMode(value);
              setError('');
            }}
            className={`min-h-12 flex-1 items-center justify-center rounded-lg border px-2 ${mode === value ? 'border-primary bg-primary/10' : 'border-border'}`}
          >
            <Text className="text-center text-sm text-foreground">
              {value === 'OBSERVATION'
                ? 'Thông tin'
                : value === 'QUANTITY'
                  ? 'Số lượng'
                  : 'Lịch sử'}
            </Text>
          </Pressable>
        ))}
      </View>
      {mode === 'OBSERVATION' ? (
        <>
          <DateField label="Ngày mua" value={purchasedAt} onChange={setPurchasedAt} clearable />
          <DateField label="Ngày mở" value={openedAt} onChange={setOpenedAt} clearable />
          <DateField label="Hạn dùng" value={expiresAt} onChange={setExpiresAt} clearable />
          <TextField label="Ghi chú độ tươi" value={note} onChangeText={setNote} maxLength={5000} />
        </>
      ) : mode === 'QUANTITY' ? (
        <>
          <View className="flex-row gap-2">
            {(['CONSUME', 'RESTORE', 'ADJUST'] as const).map((value) => (
              <Pressable
                key={value}
                disabled={busy}
                onPress={() => setType(value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: type === value }}
                className={`min-h-12 flex-1 items-center justify-center rounded-lg border px-2 ${type === value ? 'border-primary bg-primary/10' : 'border-border'}`}
              >
                <Text className="text-center text-sm text-foreground">
                  {value === 'CONSUME'
                    ? 'Đã dùng'
                    : value === 'RESTORE'
                      ? 'Hoàn trả'
                      : 'Điều chỉnh'}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextField
            label={`Số lượng (${item.unit})${type === 'ADJUST' ? ' tăng/giảm' : ''}`}
            value={amount}
            onChangeText={setAmount}
            keyboardType={type === 'ADJUST' ? 'numbers-and-punctuation' : 'decimal-pad'}
          />
          <Text className="text-xs leading-5 text-muted-foreground">
            Hoàn trả chỉ dùng khi bạn cần trả lại phần đã ghi nhận là đã dùng. Nếu vừa mua thêm, hãy dùng
            &quot;Thêm nguyên liệu&quot; hoặc quét hóa đơn để giữ đúng nguồn dữ liệu.
          </Text>
          <TextField label="Lý do" value={reason} onChangeText={setReason} maxLength={5000} />
        </>
      ) : (
        <>
          {history.isLoading ? (
            <LoadingState message="Đang tải lịch sử..." />
          ) : history.isError ? (
            <ErrorState
              description={pantryErrorMessage(history.error)}
              onRetry={() => void history.refetch()}
            />
          ) : history.data?.items.length === 0 ? (
            <Text className="text-muted-foreground">Chưa có điều chỉnh.</Text>
          ) : (
            history.data?.items.map((entry) => (
              <View key={entry.id} className="gap-1 border-b border-border py-3">
                <Text className="font-semibold text-foreground">
                  {entry.typeLabel}: {entry.delta > 0 ? '+' : ''}
                  {entry.delta} {entry.unit}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {entry.before} → {entry.after} {entry.unit}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleString('vi-VN')}
                </Text>
                {entry.reason ? (
                  <Text className="text-sm text-foreground">{entry.reason}</Text>
                ) : null}
              </View>
            ))
          )}
          <View className="flex-row gap-2">
            <PrimaryButton
              label="Trang trước"
              variant="outline"
              disabled={page <= 1 || history.isFetching}
              onPress={() => setPage(page - 1)}
              className="flex-1"
            />
            <PrimaryButton
              label="Trang sau"
              variant="outline"
              disabled={page >= (history.data?.totalPages ?? 1) || history.isFetching}
              onPress={() => setPage(page + 1)}
              className="flex-1"
            />
          </View>
        </>
      )}
      <InlineError message={error} />
      {mode !== 'HISTORY' ? (
        <PrimaryButton label="Lưu thay đổi" loading={busy} onPress={save} />
      ) : null}
    </FormSheet>
  );
}

export function PantryMergeSheet({ items, onClose }: { items: PantryItem[]; onClose: () => void }) {
  const preview = usePantryMergePreviewMutation();
  const merge = useMergePantryItemsMutation();
  const [error, setError] = React.useState('');
  const [key] = React.useState(() => createOperationKey('pantry-merge'));
  const runPreview = () => {
    setError('');
    preview.mutate(
      items.map((item) => item.id),
      { onError: (value) => setError(pantryErrorMessage(value)) }
    );
  };
  return (
    <FormSheet
      title="Gộp nguyên liệu"
      onClose={onClose}
      busy={merge.isPending || preview.isPending}
      variant="popup"
    >
      {items.map((item) => (
        <Text key={item.id} className="text-foreground">
          {item.displayName}: {item.formattedQuantity}
        </Text>
      ))}
      <PrimaryButton
        label="Kiểm tra kết quả gộp"
        variant="outline"
        loading={preview.isPending}
        disabled={merge.isPending}
        onPress={runPreview}
      />
      {preview.data ? (
        <>
          <Text className="text-base font-semibold text-foreground">
            {preview.data.label}: {preview.data.quantity} {preview.data.unit}
          </Text>
          {preview.data.warnings.map((warning, index) => (
            <Text key={index} className="text-sm text-muted-foreground">
              {warning}
            </Text>
          ))}
          <PrimaryButton
            label="Xác nhận gộp"
            disabled={!preview.data.canMerge || preview.isPending}
            loading={merge.isPending}
            onPress={() => {
              if (!preview.data) return;
              setError('');
              merge.mutate(
                {
                  targetItemId: preview.data.targetItemId,
                  items: items.map((item) => ({
                    id: item.id,
                    expectedVersion: item.version,
                  })),
                  idempotencyKey: key,
                },
                {
                  onSuccess: onClose,
                  onError: (value) => {
                    setError(pantryErrorMessage(value));
                    preview.reset();
                  },
                }
              );
            }}
          />
        </>
      ) : null}
      <InlineError message={error} />
    </FormSheet>
  );
}
