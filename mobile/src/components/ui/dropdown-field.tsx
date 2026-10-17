import * as React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Check, ChevronDown, X } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';

export interface DropdownOption<T> {
  value: T;
  label: string;
  /** Nhãn ngắn hiển thị trong ô đóng (mặc định dùng `label`); danh sách trong popup vẫn dùng `label` đầy đủ. */
  shortLabel?: string;
  /** Thụt lề cho mục con (0 = mục gốc). */
  depth?: number;
}

/**
 * Ô chọn gọn: nhãn nhỏ + giá trị đang chọn + mũi tên. Bấm mở popup giữa màn hình liệt kê đủ các mục (cuộn khi dài).
 * Đặt nhiều ô cạnh nhau bằng `className="flex-1"` trong một hàng `flex-row`.
 */
export function DropdownField<T extends string | number | null>({
  label,
  value,
  options,
  onChange,
  className,
  status,
  onRetry,
  variant = 'compact',
}: {
  /** `compact`: nhãn nhỏ nằm trong ô (bộ lọc); `field`: nhãn phía trên, ô cao như ô nhập liệu (form). */
  variant?: 'compact' | 'field';
  label: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  className?: string;
  /** `loading`: đang tải danh sách; `error`: tải lỗi, bấm để thử lại. */
  status?: 'loading' | 'error';
  onRetry?: () => void;
}) {
  const colors = useIconColors();
  const { height: windowHeight } = useWindowDimensions();
  const [open, setOpen] = React.useState(false);
  const selected = options.find((option) => option.value === value);
  const display =
    status === 'loading' ? 'Đang tải...' : status === 'error' ? 'Lỗi · Thử lại' : (selected?.shortLabel ?? selected?.label ?? 'Chọn');

  const onPressTrigger = () => (status === 'error' ? onRetry?.() : setOpen(true));

  return (
    <View className={className}>
      {variant === 'field' ? (
        <View className="gap-1.5">
          <Text className="text-sm font-medium text-foreground">{label}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${label}: ${display}`}
            disabled={status === 'loading'}
            onPress={onPressTrigger}
            className={cn(
              'h-12 flex-row items-center gap-2 rounded-xl border bg-background px-4',
              status === 'error' ? 'border-destructive/50' : 'border-input',
              status === 'loading' ? 'opacity-60' : ''
            )}>
            <Text numberOfLines={1} className="flex-1 text-sm text-foreground">
              {selected?.label ?? display}
            </Text>
            <ChevronDown size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${display}`}
          disabled={status === 'loading'}
          onPress={onPressTrigger}
          className={cn(
            'rounded-xl border bg-card px-3 py-2',
            status === 'error' ? 'border-destructive/50' : 'border-input',
            status === 'loading' ? 'opacity-60' : ''
          )}>
          <Text numberOfLines={1} className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </Text>
          <View className="mt-0.5 flex-row items-center gap-1">
            <Text
              numberOfLines={1}
              className={cn('flex-1 text-xs font-semibold', status === 'error' ? 'text-destructive' : 'text-foreground')}>
              {display}
            </Text>
            <ChevronDown size={14} color={colors.mutedForeground} />
          </View>
        </Pressable>
      )}

      <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <View className="flex-1 items-center justify-center bg-black/60 px-5">
          <Pressable
            accessibilityLabel="Đóng"
            onPress={() => setOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={{ maxHeight: Math.round(windowHeight * 0.75) }}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-background">
            <View className="flex-row items-center justify-between border-b border-border px-5 py-3">
              <Text className="text-base font-bold text-foreground">{label}</Text>
              <Pressable
                accessibilityLabel="Đóng"
                onPress={() => setOpen(false)}
                hitSlop={8}
                className="h-9 w-9 items-center justify-center">
                <X size={18} color={colors.foreground} />
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator
              contentContainerClassName="p-3"
              style={{ flexGrow: 0 }}>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={String(option.value)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={{ paddingLeft: 12 + (option.depth ?? 0) * 16 }}
                    className={cn(
                      'min-h-12 flex-row items-center gap-2 rounded-xl py-2.5 pr-3',
                      isSelected ? 'bg-primary/10' : ''
                    )}>
                    <Text
                      className={cn(
                        'flex-1 text-sm',
                        isSelected ? 'font-semibold text-primary' : 'text-foreground',
                        (option.depth ?? 0) > 0 ? 'text-[13px]' : ''
                      )}>
                      {option.label}
                    </Text>
                    {isSelected ? <Check size={16} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
