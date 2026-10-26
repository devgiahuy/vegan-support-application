import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Calendar, Check, MinusCircle, Pencil, PlusCircle, Trash2 } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import type { PantryItem } from '../types/pantry.model';

/** Màu cố định theo mức hạn dùng (không phụ thuộc biến theme) để chữ luôn rõ trên nền nhãn. */
function expiryTone(status: PantryItem['expiryStatus']): { box: string; text: string } {
  if (status === 'EXPIRED') return { box: 'bg-red-600', text: 'text-white' };
  if (status === 'ALERT') return { box: 'bg-red-100', text: 'text-red-700' };
  if (status === 'WARNING') return { box: 'bg-amber-100', text: 'text-amber-800' };
  if (status === 'GOOD') return { box: 'bg-emerald-100', text: 'text-emerald-800' };
  return { box: 'bg-muted', text: 'text-muted-foreground' };
}

/**
 * Thẻ nguyên liệu trong Tủ bếp (bố cục theo web, gọn cho mobile): tên + nhãn nguồn, số lượng lớn, hạn dùng, ghi chú
 * độ tươi và hai thao tác nhanh Tiêu hao / Bổ sung. Chế độ chọn để gộp hiện ô tick ở đầu thẻ.
 */
export function PantryItemCard({
  item,
  busy,
  onDelete,
  onEdit,
  onAdjust,
  selectable = false,
  selected = false,
  onToggleSelect,
}: {
  item: PantryItem;
  busy: boolean;
  onDelete: (item: PantryItem) => void;
  onEdit: (item: PantryItem) => void;
  onAdjust: (item: PantryItem, type: 'CONSUME' | 'RESTORE') => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (item: PantryItem) => void;
}) {
  const colors = useIconColors();
  const tone = expiryTone(item.expiryStatus);
  const isCanonical = Boolean(item.ingredientId);

  return (
    <View className={cn('gap-3 rounded-2xl border bg-card p-4', selected ? 'border-primary' : 'border-border')}>
      <View className="flex-row items-start gap-3">
        {selectable ? (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityLabel={`Chọn ${item.displayName} để gộp`}
            accessibilityState={{ checked: selected }}
            onPress={() => onToggleSelect?.(item)}
            hitSlop={6}
            className={cn(
              'mt-0.5 h-6 w-6 items-center justify-center rounded-md border',
              selected ? 'border-primary bg-primary' : 'border-input bg-background'
            )}>
            {selected ? <Check size={15} color={colors.primaryForeground} /> : null}
          </Pressable>
        ) : null}

        <View className="min-w-0 flex-1">
          <Text numberOfLines={2} className="text-base font-semibold text-foreground">
            {item.displayName}
          </Text>
          <View className="mt-1 flex-row flex-wrap items-center gap-x-2 gap-y-1">
            <View
              className={cn(
                'rounded-md border px-1.5 py-0.5',
                isCanonical ? 'border-emerald-300 bg-emerald-50' : 'border-border bg-muted'
              )}>
              <Text className={cn('text-[10px] font-semibold', isCanonical ? 'text-emerald-700' : 'text-muted-foreground')}>
                {isCanonical ? 'Chuẩn từ điển' : 'Tự do'}
              </Text>
            </View>
            <Text className="text-xs text-muted-foreground">• {item.sourceLabel}</Text>
          </View>
        </View>

        <View className="flex-row gap-1.5">
          <Pressable
            disabled={busy}
            onPress={() => onEdit(item)}
            accessibilityLabel={`Chỉnh sửa và xem lịch sử ${item.displayName}`}
            className="h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Pencil size={15} color={colors.foreground} />
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={() => onDelete(item)}
            accessibilityLabel={`Xóa ${item.displayName}`}
            className="h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <Trash2 size={15} color={colors.destructive} />
          </Pressable>
        </View>
      </View>

      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="text-2xl font-bold tracking-tight text-foreground">{item.formattedQuantity}</Text>
        {item.conversion.formattedGrams ? (
          <Text className="text-xs font-medium text-muted-foreground">{item.conversion.formattedGrams}</Text>
        ) : null}
      </View>

      <View className="gap-2 border-t border-border pt-3">
        <View className="flex-row items-center justify-between gap-2">
          <View className="flex-row items-center gap-1.5">
            <Calendar size={14} color={colors.mutedForeground} />
            <Text className="text-xs text-muted-foreground">Hạn sử dụng:</Text>
          </View>
          <View className={cn('rounded-full px-2.5 py-1', tone.box)}>
            <Text className={cn('text-[11px] font-semibold', tone.text)}>{item.expiryBadgeLabel}</Text>
          </View>
        </View>
        {item.freshnessNote ? (
          <Text numberOfLines={1} className="text-[11px] italic text-muted-foreground">
            &quot;{item.freshnessNote}&quot;
          </Text>
        ) : null}
      </View>

      <View className="flex-row gap-2">
        <Pressable
          disabled={busy}
          onPress={() => onAdjust(item, 'CONSUME')}
          accessibilityLabel={`Tiêu hao ${item.displayName}`}
          className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-input bg-background">
          <MinusCircle size={16} color={colors.foreground} />
          <Text className="text-sm font-semibold text-foreground">Tiêu hao</Text>
        </Pressable>
        <Pressable
          disabled={busy}
          onPress={() => onAdjust(item, 'RESTORE')}
          accessibilityLabel={`Bổ sung ${item.displayName}`}
          className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-input bg-background">
          <PlusCircle size={16} color={colors.primary} />
          <Text className="text-sm font-semibold text-foreground">Bổ sung</Text>
        </Pressable>
      </View>
    </View>
  );
}
