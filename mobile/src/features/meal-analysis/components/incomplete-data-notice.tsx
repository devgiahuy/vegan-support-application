import { Text, View } from 'react-native';

import { ShowMoreButton, useShowMore } from '@/components/shared/show-more';

const VISIBLE_NOTES = 2;

/**
 * Khối "Dữ liệu chưa đầy đủ": danh sách ghi chú có thể rất dài nên chỉ hiện vài dòng đầu, phần còn lại mở bằng
 * "Xem thêm". Màu có biến thể tối để chữ không bị chìm trên nền cảnh báo.
 */
export function IncompleteDataNotice({ notes, compact = false }: { notes: string[]; compact?: boolean }) {
  const list = useShowMore(notes, VISIBLE_NOTES);
  if (notes.length === 0) return null;

  return (
    <View className="gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
      <Text className={compact ? 'text-xs font-semibold text-amber-800 dark:text-amber-300' : 'text-sm font-semibold text-amber-800 dark:text-amber-300'}>
        Dữ liệu chưa đầy đủ ({notes.length})
      </Text>
      {list.visible.map((note, index) => (
        <Text key={`${index}-${note.slice(0, 24)}`} className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
          • {note}
        </Text>
      ))}
      <ShowMoreButton
        collapsible={list.collapsible}
        expanded={list.expanded}
        hiddenCount={list.hiddenCount}
        onPress={list.toggle}
      />
    </View>
  );
}
