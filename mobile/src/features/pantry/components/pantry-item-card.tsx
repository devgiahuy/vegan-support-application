import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CalendarClock, PackageCheck, Trash2, Pencil } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import type { PantryItem } from '../types/pantry.model';

function expiryClass(status: PantryItem['expiryStatus']): string {
  if (status === 'EXPIRED') return 'bg-destructive/10 text-destructive';
  if (status === 'WARNING' || status === 'ALERT') return 'bg-amber-100 text-amber-800';
  if (status === 'GOOD') return 'bg-emerald-100 text-emerald-800';
  return 'bg-muted text-muted-foreground';
}

export function PantryItemCard({
  item,
  onDelete,
  onEdit,
  busy,
}: {
  item: PantryItem;
  onDelete: (item: PantryItem) => void;
  onEdit: (item: PantryItem) => void;
  busy: boolean;
}) {
  const colors = useIconColors();

  return (
    <View className="gap-3 rounded-lg border border-border bg-card p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <PackageCheck size={16} color={colors.primary} />
            <Text className="flex-1 text-base font-bold text-foreground">{item.displayName}</Text>
          </View>
          <Text className="mt-1 text-sm text-muted-foreground">{item.sourceLabel}</Text>
        </View>
        <Pressable
          disabled={busy}
          onPress={() => onDelete(item)}
          className="h-12 w-12 items-center justify-center rounded-lg bg-destructive/10"
          accessibilityLabel={`Xóa ${item.displayName}`}
        >
          <Trash2 size={16} color={colors.destructive} />
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Chỉnh sửa và xem lịch sử ${item.displayName}`}
        onPress={() => onEdit(item)}
        className="min-h-12 flex-row items-center justify-center gap-2 rounded-lg border border-border px-2"
      >
        <Pencil size={16} color={colors.primary} />
        <Text className="text-sm font-semibold text-primary">Chỉnh sửa / lịch sử</Text>
      </Pressable>

      <View className="flex-row flex-wrap gap-2">
        <View className="rounded-full bg-primary/10 px-3 py-1.5">
          <Text className="text-xs font-semibold text-primary">{item.formattedQuantity}</Text>
        </View>
        {item.conversion.formattedGrams ? (
          <View className="rounded-full bg-muted px-3 py-1.5">
            <Text className="text-xs font-semibold text-muted-foreground">
              {item.conversion.formattedGrams}
            </Text>
          </View>
        ) : null}
        <View className={cn('rounded-full px-3 py-1.5', expiryClass(item.expiryStatus))}>
          <Text className={cn('text-xs font-semibold', expiryClass(item.expiryStatus))}>
            {item.expiryBadgeLabel}
          </Text>
        </View>
      </View>

      {item.freshnessNote ? (
        <View className="flex-row gap-2 rounded-xl bg-muted/60 p-3">
          <CalendarClock size={14} color={colors.mutedForeground} />
          <Text className="flex-1 text-xs leading-relaxed text-muted-foreground">
            {item.freshnessNote}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
