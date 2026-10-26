import * as React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { UseQueryResult } from '@tanstack/react-query';
import { CircleCheck, Info, RefreshCw, ShoppingCart, TriangleAlert } from 'lucide-react-native';

import { ShowMoreButton, useShowMore } from '@/components/shared/show-more';
import { ErrorState, LoadingState } from '@/components/shared/state-views';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import type { ShoppingItem, ShoppingPreview, ShoppingUnresolvedItem } from '../types/shopping.model';

type FilterTab = 'missing' | 'ready' | 'all';

const UNRESOLVED_LIMIT = 3;
const ITEM_LIMIT = 6;

function StatTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'neutral' | 'rose' | 'emerald' | 'amber';
}) {
  const styles = {
    neutral: { box: 'border-border bg-muted/40', label: 'text-muted-foreground', value: 'text-foreground' },
    rose: {
      box: 'border-rose-200/60 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20',
      label: 'text-rose-700 dark:text-rose-400',
      value: 'text-rose-600 dark:text-rose-400',
    },
    emerald: {
      box: 'border-emerald-200/60 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20',
      label: 'text-emerald-700 dark:text-emerald-400',
      value: 'text-emerald-600 dark:text-emerald-400',
    },
    amber: {
      box: 'border-amber-200/60 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20',
      label: 'text-amber-700 dark:text-amber-400',
      value: 'text-amber-600 dark:text-amber-400',
    },
  }[tone];

  return (
    <View className={cn('w-[48.5%] gap-1 rounded-2xl border p-3.5', styles.box)}>
      <Text className={cn('text-xs font-medium', styles.label)}>{label}</Text>
      <Text className={cn('text-lg font-bold', styles.value)}>{value}</Text>
    </View>
  );
}

/** Nguyên liệu chưa thể tự tính khoảng thiếu — rút gọn còn vài mục, mở rộng bằng "Xem thêm". */
function UnresolvedCard({ items }: { items: ShoppingUnresolvedItem[] }) {
  const colors = useIconColors();
  const list = useShowMore(items, UNRESOLVED_LIMIT);
  if (items.length === 0) return null;

  return (
    <View className="gap-3 rounded-2xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
      <View className="flex-row items-start gap-3">
        <View className="h-8 w-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
          <TriangleAlert size={16} color={colors.warning} />
        </View>
        <View className="flex-1 gap-1">
          <Text className="text-sm font-semibold text-foreground">Nguyên liệu cần kiểm tra thủ công ({items.length})</Text>
          <Text className="text-xs leading-4 text-muted-foreground">
            Chưa thể tự tính khoảng thiếu do chưa có tỷ lệ quy đổi đơn vị chuẩn. Vui lòng tự kiểm tra trước khi đi mua.
          </Text>
        </View>
      </View>

      <View className="overflow-hidden rounded-xl border border-amber-200/60 bg-card dark:border-amber-900/40">
        {list.visible.map((item, index) => (
          <View
            key={`${item.name}-${index}`}
            className={cn('gap-1 p-3', index > 0 ? 'border-t border-amber-200/50 dark:border-amber-900/40' : '')}>
            <View className="flex-row items-start justify-between gap-2">
              <Text className="flex-1 text-xs font-semibold text-foreground">{item.name}</Text>
              <View className="rounded-full border border-amber-300 bg-amber-50/60 px-2 py-0.5 dark:border-amber-800 dark:bg-amber-950/40">
                <Text className="text-[10px] text-amber-700 dark:text-amber-400">{item.reason}</Text>
              </View>
            </View>
            <Text className="text-xs text-muted-foreground">
              Cần dùng: <Text className="font-medium text-foreground">{item.required}</Text>
            </Text>
            {item.mealNames.length > 0 ? (
              <Text numberOfLines={1} className="text-[11px] text-muted-foreground">
                Dùng trong: {item.mealNames.join(', ')}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
      <ShowMoreButton
        collapsible={list.collapsible}
        expanded={list.expanded}
        hiddenCount={list.hiddenCount}
        onPress={list.toggle}
      />
    </View>
  );
}

function ItemRow({ item }: { item: ShoppingItem }) {
  const colors = useIconColors();
  const frame =
    item.status === 'READY'
      ? 'border-emerald-200/70 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/10'
      : item.status === 'PARTIAL'
        ? 'border-amber-200/70 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/10'
        : 'border-border bg-card';

  return (
    <View className={cn('gap-2.5 rounded-2xl border p-4', frame)}>
      <View className="flex-row flex-wrap items-center gap-2">
        <Text className="text-sm font-semibold text-foreground">{item.name}</Text>
        {item.status === 'READY' ? (
          <View className="flex-row items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 dark:bg-emerald-950/60">
            <CircleCheck size={11} color={colors.primary} />
            <Text className="text-[11px] text-emerald-700 dark:text-emerald-300">Đã có đủ</Text>
          </View>
        ) : null}
        {item.status === 'PARTIAL' ? (
          <View className="rounded-full border border-amber-300 bg-amber-50/50 px-2 py-0.5 dark:border-amber-800 dark:bg-amber-950/30">
            <Text className="text-[11px] text-amber-700 dark:text-amber-400">Thiếu một phần</Text>
          </View>
        ) : null}
        {item.status === 'MISSING' ? (
          <View className="rounded-full border border-rose-300 bg-rose-50/50 px-2 py-0.5 dark:border-rose-800 dark:bg-rose-950/30">
            <Text className="text-[11px] text-rose-700 dark:text-rose-400">Cần mua mới</Text>
          </View>
        ) : null}
      </View>

      {item.mealNames.length > 0 ? (
        <Text className="text-xs leading-4 text-muted-foreground">
          <Text className="font-medium">Món dùng: </Text>
          {item.mealNames.join(' • ')}
        </Text>
      ) : null}

      {item.assumptions.length > 0 ? (
        <View className="flex-row items-start gap-1.5">
          <Info size={13} color={colors.info} />
          <Text className="flex-1 text-xs leading-4 text-blue-600 dark:text-blue-400">
            Quy đổi: {item.assumptions.join('; ')}
          </Text>
        </View>
      ) : null}

      <View className="flex-row rounded-xl border border-border bg-card p-2.5">
        <View className="flex-1 gap-0.5">
          <Text className="text-[10px] font-medium uppercase text-muted-foreground">Cần dùng</Text>
          <Text className="text-xs font-medium text-foreground">{item.required}</Text>
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-[10px] font-medium uppercase text-muted-foreground">Có sẵn</Text>
          <Text
            className={cn(
              'text-xs font-medium',
              item.hasAvailable ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
            )}>
            {item.available}
          </Text>
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-[10px] font-medium uppercase text-muted-foreground">Cần mua</Text>
          <Text
            className={cn(
              'text-xs font-bold',
              item.needsPurchase ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
            )}>
            {item.needsPurchase ? item.missing : '0'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function ItemList({ items, emptyMessage, emptyIcon }: { items: ShoppingItem[]; emptyMessage: string; emptyIcon?: boolean }) {
  const colors = useIconColors();
  const list = useShowMore(items, ITEM_LIMIT);

  if (items.length === 0) {
    return (
      <View className="items-center gap-2 rounded-2xl border border-dashed border-border p-6">
        {emptyIcon ? <CircleCheck size={28} color={colors.primary} /> : null}
        <Text className="text-center text-sm text-muted-foreground">{emptyMessage}</Text>
      </View>
    );
  }
  return (
    <View className="gap-3">
      {list.visible.map((item) => (
        <ItemRow key={item.id || item.name} item={item} />
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

/**
 * Kết quả đối chiếu nguyên liệu với Tủ bếp (`POST /shopping-lists/preview`) — đồng bộ `ShoppingGapView` của web:
 * thời điểm đối chiếu, 4 thẻ thống kê, nguyên liệu cần kiểm tra thủ công, rồi các tab Cần mua / Đã có đủ / Tất cả.
 */
export function ShoppingPreviewView({ preview }: { preview: UseQueryResult<ShoppingPreview> }) {
  const colors = useIconColors();
  const [filter, setFilter] = React.useState<FilterTab>('missing');

  const data = preview.data;
  const groups = React.useMemo(
    () => ({
      missing: data?.items.filter((item) => item.needsPurchase) ?? [],
      ready: data?.items.filter((item) => !item.needsPurchase) ?? [],
      all: data?.items ?? [],
    }),
    [data]
  );

  if (preview.isLoading) return <LoadingState message="Đang so sánh nguyên liệu với tồn kho Tủ bếp..." />;
  if (preview.isError) {
    return (
      <ErrorState
        title="Không thể tính danh sách đi chợ thông minh"
        description={
          getApiErrorCode(preview.error) === 'SHOPPING_MEAL_NOT_FOUND'
            ? 'Có món đã bị xóa hoặc không còn truy cập được. Bỏ món đó rồi tính lại.'
            : getApiErrorMessage(preview.error)
        }
        onRetry={() => void preview.refetch()}
      />
    );
  }
  if (!data) return null;

  const tabs: { value: FilterTab; label: string }[] = [
    { value: 'missing', label: `Cần mua thêm (${groups.missing.length})` },
    { value: 'ready', label: `Đã có đủ (${groups.ready.length})` },
    { value: 'all', label: `Tất cả (${groups.all.length})` },
  ];

  return (
    <View className="gap-4">
      <View className="flex-row items-start justify-between gap-3 border-b border-border pb-3">
        <View className="flex-1 gap-0.5">
          <View className="flex-row items-center gap-2">
            <ShoppingCart size={16} color={colors.primary} />
            <Text className="flex-1 text-base font-bold text-foreground">Đi chợ thông minh theo Tủ bếp</Text>
          </View>
          <Text className="text-xs leading-4 text-muted-foreground">
            Dữ liệu đối chiếu tồn kho tính đến: <Text className="font-medium text-foreground">{data.formattedPantryAsOf}</Text>
          </Text>
        </View>
        <Pressable
          disabled={preview.isFetching}
          onPress={() => void preview.refetch()}
          accessibilityLabel="Cập nhật lại"
          className="flex-row items-center gap-1.5 rounded-xl px-2 py-1.5 active:bg-muted">
          {preview.isFetching ? (
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          ) : (
            <RefreshCw size={14} color={colors.mutedForeground} />
          )}
          <Text className="text-xs text-muted-foreground">Cập nhật</Text>
        </Pressable>
      </View>

      <View className="flex-row flex-wrap justify-between gap-y-2.5">
        <StatTile label="Món đã chọn" value={String(data.selectedMealCount)} tone="neutral" />
        <StatTile label="Cần mua thêm" value={`${data.missingItemCount} món`} tone="rose" />
        <StatTile label="Đã có đủ trong tủ" value={`${data.readyItemCount} món`} tone="emerald" />
        <StatTile label="Cần tự kiểm tra" value={`${data.unresolvedItemCount} món`} tone="amber" />
      </View>

      <UnresolvedCard items={data.unresolvedItems} />

      <View className="self-start flex-row gap-1 rounded-xl bg-muted p-1">
        {tabs.map((tab) => (
          <Pressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: filter === tab.value }}
            onPress={() => setFilter(tab.value)}
            className={cn('rounded-lg px-2.5 py-1.5', filter === tab.value ? 'bg-background' : '')}>
            <Text
              className={cn('text-[11px]', filter === tab.value ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {filter === 'missing' ? (
        <ItemList
          items={groups.missing}
          emptyIcon
          emptyMessage="Tủ bếp của bạn đã có đủ toàn bộ nguyên liệu cho các bữa đã chọn!"
        />
      ) : null}
      {filter === 'ready' ? (
        <ItemList items={groups.ready} emptyMessage="Chưa có nguyên liệu nào có sẵn đủ số lượng trong tủ bếp." />
      ) : null}
      {filter === 'all' ? <ItemList items={groups.all} emptyMessage="Chưa có nguyên liệu nào để đối chiếu." /> : null}
    </View>
  );
}
