import { Pressable, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';

/** Các số trang hiển thị: tối đa `size` số quanh trang hiện tại, luôn nằm trong [1, totalPages]. */
function pageWindow(page: number, totalPages: number, size = 5): number[] {
  const count = Math.min(size, totalPages);
  let start = Math.max(1, page - Math.floor(count / 2));
  start = Math.min(start, totalPages - count + 1);
  return Array.from({ length: count }, (_, index) => start + index);
}

/** Thanh phân trang kiểu số trang (‹ 1 2 3 4 5 ›) như web; ẩn khi chỉ có một trang. */
export function PaginationBar({
  page,
  totalPages,
  onChange,
  disabled = false,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}) {
  const colors = useIconColors();
  if (totalPages <= 1) return null;

  return (
    <View className="flex-row items-center justify-center gap-1.5">
      <Pressable
        accessibilityLabel="Trang trước"
        disabled={disabled || page <= 1}
        onPress={() => onChange(page - 1)}
        className="h-10 w-10 items-center justify-center rounded-full border border-border">
        <ChevronLeft size={16} color={page <= 1 ? colors.mutedForeground : colors.foreground} />
      </Pressable>
      {pageWindow(page, totalPages).map((value) => {
        const current = value === page;
        return (
          <Pressable
            key={value}
            accessibilityLabel={`Trang ${value}`}
            accessibilityState={{ selected: current }}
            disabled={disabled}
            onPress={() => onChange(value)}
            className={cn('h-10 w-10 items-center justify-center rounded-xl', current ? 'bg-primary' : '')}>
            <Text className={cn('text-sm font-semibold', current ? 'text-primary-foreground' : 'text-foreground')}>
              {value}
            </Text>
          </Pressable>
        );
      })}
      <Pressable
        accessibilityLabel="Trang sau"
        disabled={disabled || page >= totalPages}
        onPress={() => onChange(page + 1)}
        className="h-10 w-10 items-center justify-center rounded-full border border-border">
        <ChevronRight size={16} color={page >= totalPages ? colors.mutedForeground : colors.foreground} />
      </Pressable>
    </View>
  );
}
