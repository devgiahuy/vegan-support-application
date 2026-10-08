import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { FormSheet } from '@/components/shared/form-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { cn } from '@/lib/utils';
import {
  HOUR_OPTIONS,
  MIN_RATING_OPTIONS,
  OPEN_STATE_OPTIONS,
  PRICE_LEVEL_OPTIONS,
  WEEKDAY_OPTIONS,
} from '../schemas/restaurant.schema';
import type { RestaurantAdvancedFilters } from '../types/restaurant.model';
import { countActiveAdvancedFilters, validateAdvancedFilters } from '../utils/restaurant-filters';

function Pill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      className={cn('rounded-full px-3 py-2', selected ? 'bg-primary' : 'bg-muted')}>
      <Text className={cn('text-xs font-medium', selected ? 'text-primary-foreground' : 'text-muted-foreground')}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Một nhóm lựa chọn đơn kèm mục "Bất kỳ" (giá trị `undefined`). */
function Choice<T extends string | number>({
  label,
  value,
  options,
  onChange,
  scroll = false,
}: {
  label: string;
  value: T | undefined;
  options: readonly { value: T; label: string }[];
  onChange: (next: T | undefined) => void;
  scroll?: boolean;
}) {
  const pills = (
    <>
      <Pill label="Bất kỳ" selected={value === undefined} onPress={() => onChange(undefined)} />
      {options.map((option) => (
        <Pill
          key={String(option.value)}
          label={option.label}
          selected={value === option.value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </>
  );
  return (
    <View className="gap-2">
      <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</Text>
      {scroll ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {pills}
        </ScrollView>
      ) : (
        <View className="flex-row flex-wrap gap-2">{pills}</View>
      )}
    </View>
  );
}

/**
 * Bộ lọc nâng cao của nhà hàng (giá, đánh giá, giờ mở cửa) — tương ứng `advanced-filters.tsx` của web.
 * Mọi điều khiển là lựa chọn cố định đúng ràng buộc backend, không cho nhập tự do. Backend chỉ áp dụng các lọc này
 * ở chế độ tìm theo từ khóa nên sheet nhắc người dùng nhập từ khóa khi chưa có.
 */
export function AdvancedFiltersSheet({
  filters,
  hasKeyword,
  onApply,
  onClose,
}: {
  filters: RestaurantAdvancedFilters;
  hasKeyword: boolean;
  onApply: (filters: RestaurantAdvancedFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = React.useState<RestaurantAdvancedFilters>(filters);
  const [error, setError] = React.useState<string | null>(null);
  const activeCount = countActiveAdvancedFilters(draft);

  const patch = (next: Partial<RestaurantAdvancedFilters>) => {
    setError(null);
    setDraft((current) => ({ ...current, ...next }));
  };

  const apply = () => {
    const message = validateAdvancedFilters(draft);
    if (message) {
      setError(message);
      return;
    }
    onApply(draft);
  };

  return (
    <FormSheet title="Bộ lọc nâng cao" onClose={onClose}>
      <Text className="text-sm text-muted-foreground">
        Lọc theo giá, đánh giá và giờ mở cửa của quán. Các bộ lọc này chỉ áp dụng khi tìm theo từ khóa.
      </Text>
      {!hasKeyword ? (
        <Text className="rounded-xl border border-border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          Bạn đang ở chế độ tìm lân cận. Hãy nhập từ khóa tìm kiếm để các bộ lọc này có hiệu lực.
        </Text>
      ) : null}

      <Choice
        label="Giá tối thiểu"
        value={draft.minPrice}
        options={PRICE_LEVEL_OPTIONS}
        onChange={(minPrice) => patch({ minPrice })}
      />
      <Choice
        label="Giá tối đa"
        value={draft.maxPrice}
        options={PRICE_LEVEL_OPTIONS}
        onChange={(maxPrice) => patch({ maxPrice })}
      />
      <Choice
        label="Đánh giá tối thiểu"
        value={draft.minRating}
        options={MIN_RATING_OPTIONS.map((rating) => ({
          value: rating,
          label: `${rating.toFixed(1).replace('.', ',')} ★ trở lên`,
        }))}
        onChange={(minRating) => patch({ minRating })}
      />
      <Choice
        label="Trạng thái mở cửa"
        value={draft.openState}
        options={OPEN_STATE_OPTIONS}
        onChange={(openState) => patch({ openState })}
      />
      <Choice
        label="Mở cửa vào ngày"
        value={draft.openOnDay}
        options={WEEKDAY_OPTIONS}
        onChange={(openOnDay) => patch({ openOnDay })}
      />
      <Choice
        label="Mở cửa lúc giờ"
        value={draft.openAtHour}
        options={HOUR_OPTIONS}
        onChange={(openAtHour) => patch({ openAtHour })}
        scroll
      />

      {error ? (
        <Text accessibilityRole="alert" className="text-sm text-destructive">
          {error}
        </Text>
      ) : null}
      <View className="flex-row gap-3">
        <PrimaryButton
          label="Xóa lọc"
          variant="outline"
          disabled={activeCount === 0}
          onPress={() => {
            setError(null);
            setDraft({});
          }}
          className="flex-1"
        />
        <PrimaryButton
          label={activeCount > 0 ? `Áp dụng (${activeCount})` : 'Áp dụng'}
          onPress={apply}
          className="flex-1"
        />
      </View>
    </FormSheet>
  );
}
