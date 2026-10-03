import { Pressable, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import type { AppNotification } from '../types/notification.model';

/** 1 mục thông báo: loại + tiêu đề + tóm tắt + thời gian + chấm chưa đọc. */
export function NotificationItem({
  item,
  onOpen,
}: {
  item: AppNotification;
  onOpen: (item: AppNotification) => void;
}) {
  const colors = useIconColors();

  return (
    <Pressable
      onPress={() => onOpen(item)}
      className={cn(
        'gap-1 rounded-2xl border p-3.5 active:bg-muted',
        item.read ? 'border-border bg-card' : 'border-primary/25 bg-primary/5'
      )}>
      <View className="flex-row items-center gap-2">
        <Text className="text-xs font-semibold text-primary">{item.typeLabel}</Text>
        {!item.read ? <View accessibilityLabel="Chưa đọc" className="h-1.5 w-1.5 rounded-full bg-primary" /> : null}
        <Text className="ml-auto text-[11px] text-muted-foreground">{item.timeAgo}</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Text className={cn('flex-1 text-sm text-foreground', item.read ? 'font-medium' : 'font-bold')}>
          {item.title}
        </Text>
        {item.link ? <ChevronRight size={16} color={colors.mutedForeground} /> : null}
      </View>
      {item.summary ? (
        <Text numberOfLines={3} className="text-xs leading-relaxed text-muted-foreground">
          {item.summary}
        </Text>
      ) : null}
    </Pressable>
  );
}
