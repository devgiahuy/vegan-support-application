import * as React from 'react';
import { Pressable, Text } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';

/** Rút gọn danh sách dài: chỉ hiện `limit` mục đầu, phần còn lại mở bằng nút "Xem thêm". */
export function useShowMore<T>(items: T[], limit: number) {
  const [expanded, setExpanded] = React.useState(false);
  const collapsible = items.length > limit;
  return {
    visible: collapsible && !expanded ? items.slice(0, limit) : items,
    hiddenCount: collapsible && !expanded ? items.length - limit : 0,
    collapsible,
    expanded,
    toggle: () => setExpanded((value) => !value),
  };
}

/** Nút "Xem thêm (N)" / "Thu gọn" đi kèm `useShowMore`; không hiện khi danh sách đủ ngắn. */
export function ShowMoreButton({
  collapsible,
  expanded,
  hiddenCount,
  onPress,
}: {
  collapsible: boolean;
  expanded: boolean;
  hiddenCount: number;
  onPress: () => void;
}) {
  const colors = useIconColors();
  if (!collapsible) return null;
  const Icon = expanded ? ChevronUp : ChevronDown;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-row items-center justify-center gap-1 rounded-lg py-2 active:bg-muted">
      <Text className="text-xs font-semibold text-primary">{expanded ? 'Thu gọn' : `Xem thêm (${hiddenCount})`}</Text>
      <Icon size={14} color={colors.primary} />
    </Pressable>
  );
}
