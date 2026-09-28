import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { cn } from '@/lib/utils';
import type { Category } from '../types/category.model';
import { flattenCategories } from '../utils/flatten-categories';

interface CategoryFilterPillsProps {
  /** Cây danh mục (Model) — component tự trải phẳng cha + con. */
  items: Category[];
  /** Id đang chọn, `null` = tất cả. */
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  allLabel?: string;
}

/**
 * Filter pills danh mục chọn đơn, đồng bộ
 * `frontend/src/features/category/components/category-filter-pills.tsx`.
 * Dùng cho cả "Khám phá món" và "Cẩm nang" (mobile chọn đơn thay vì checkbox sidebar
 * của web — trên FE dù sidebar cho chọn nhiều, chỉ id đầu tiên thực sự được gửi lên API).
 */
export function CategoryFilterPills({
  items,
  selectedId,
  onSelect,
  allLabel = 'Tất cả',
}: CategoryFilterPillsProps) {
  const flat = flattenCategories(items);

  return (
    <View className="flex-row flex-wrap gap-1.5">
      <Pressable
        onPress={() => onSelect(null)}
        className={cn(
          'rounded-lg px-2.5 py-1.5',
          selectedId === null ? 'bg-primary' : 'bg-muted'
        )}>
        <Text
          className={cn(
            'text-xs font-medium',
            selectedId === null ? 'text-primary-foreground' : 'text-muted-foreground'
          )}>
          {allLabel}
        </Text>
      </Pressable>
      {flat.map((c) => {
        const selected = selectedId === c.id;
        return (
          <Pressable
            key={c.id}
            onPress={() => onSelect(c.id)}
            className={cn('rounded-lg px-2.5 py-1.5', selected ? 'bg-primary' : 'bg-muted')}>
            <Text
              className={cn(
                'text-xs font-medium',
                selected ? 'text-primary-foreground' : 'text-muted-foreground'
              )}>
              {c.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
