import * as React from 'react';
import { Alert, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Info,
  Merge,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react-native';
import { SiteScreen } from '@/components/layout/site-screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/state-views';
import { DropdownField, type DropdownOption } from '@/components/ui/dropdown-field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { PantryItemCard } from '@/features/pantry/components/pantry-item-card';
import {
  PantryCreateSheet,
  PantryItemSheet,
  PantryMergeSheet,
} from '@/features/pantry/components/pantry-sheets';
import {
  useDeletePantryItemMutation,
  usePantryItemsQuery,
} from '@/features/pantry/queries/pantry.queries';
import { pantryErrorMessage } from '@/features/pantry/lib/pantry-errors';
import type { PantryItem, PantryItemSource, PantryListFilters } from '@/features/pantry/types/pantry.model';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { DEV_SCANS_ENABLED } from '@/features/scanning/lib/scan-access';

type Tab = 'all' | 'expiring' | 'expired';
type SourceFilter = 'ALL' | PantryItemSource;

/** Số ngày tới được coi là "sắp hết hạn" (khớp `GET /pantry/items/expiring-soon`, mặc định 7 ngày). */
const EXPIRING_DAYS = 7;
const PAGE_SIZE = 20;

const SOURCE_OPTIONS: DropdownOption<SourceFilter>[] = [
  { value: 'ALL', label: 'Tất cả nguồn', shortLabel: 'Tất cả' },
  { value: 'MANUAL', label: 'Nhập thủ công', shortLabel: 'Thủ công' },
  { value: 'FRIDGE_RECOGNITION', label: 'Nhận diện tủ lạnh', shortLabel: 'Tủ lạnh' },
  { value: 'RECEIPT', label: 'Quét hóa đơn', shortLabel: 'Hóa đơn' },
];

/** Ngày `YYYY-MM-DD` theo UTC cách hôm nay `offsetDays` ngày — cùng mốc "hôm nay" mà backend dùng để tính hạn. */
function utcDay(offsetDays: number): string {
  const now = new Date();
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(base + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

/** Điều kiện lọc theo hạn dùng của từng tab (chỉ tính mục đã xác nhận ở hai tab theo hạn). */
function tabFilters(tab: Tab): PantryListFilters {
  if (tab === 'expiring') {
    return { expiresFrom: utcDay(0), expiresTo: utcDay(EXPIRING_DAYS), confirmedOnly: true };
  }
  if (tab === 'expired') return { expiresTo: utcDay(-1), confirmedOnly: true };
  return {};
}

/** Nút thao tác nhanh dạng ô dọc (icon trên, nhãn dưới); `flex-1` để các nút chia đều một hàng. */
function HeaderAction({
  label,
  icon: Icon,
  onPress,
  active = false,
}: {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  active?: boolean;
}) {
  const colors = useIconColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={cn(
        'min-h-[60px] flex-1 items-center justify-center gap-1 rounded-2xl border px-1 py-2',
        active ? 'border-primary bg-primary/10' : 'border-input bg-card'
      )}>
      <Icon size={18} color={active ? colors.primary : colors.foreground} />
      <Text numberOfLines={1} className="text-[11px] font-semibold text-foreground">
        {label}
      </Text>
    </Pressable>
  );
}

function CountBadge({ count, urgent }: { count: number | undefined; urgent: boolean }) {
  const hot = urgent && (count ?? 0) > 0;
  return (
    <View className={cn('min-w-5 items-center rounded-full px-1.5 py-0.5', hot ? 'bg-red-600' : 'bg-background')}>
      <Text className={cn('text-[11px] font-semibold', hot ? 'text-white' : 'text-muted-foreground')}>
        {count ?? '–'}
      </Text>
    </View>
  );
}

export default function PantryScreen() {
  const colors = useIconColors();
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const [tab, setTab] = React.useState<Tab>('all');
  const [search, setSearch] = React.useState('');
  const keyword = useDebouncedValue(search.trim(), 350);
  const [source, setSource] = React.useState<SourceFilter>('ALL');
  const [page, setPage] = React.useState(1);
  const [includeZero, setIncludeZero] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [active, setActive] = React.useState<{
    item: PantryItem;
    mode: 'OBSERVATION' | 'QUANTITY';
    type: 'CONSUME' | 'RESTORE';
  } | null>(null);
  const [selectMode, setSelectMode] = React.useState(false);
  const [selected, setSelected] = React.useState<PantryItem[]>([]);
  const [merging, setMerging] = React.useState(false);

  const query = usePantryItemsQuery(
    {
      page,
      limit: PAGE_SIZE,
      includeZero,
      ...(keyword ? { search: keyword } : {}),
      ...(source !== 'ALL' ? { source } : {}),
      ...tabFilters(tab),
    },
    authenticated
  );
  // Số lượng hiển thị trên 3 tab: lấy `metadata.totalItems` của truy vấn 1 mục, không phụ thuộc ô tìm kiếm/bộ lọc nguồn.
  const allCount = usePantryItemsQuery({ page: 1, limit: 1, ...tabFilters('all') }, authenticated);
  const expiringCount = usePantryItemsQuery({ page: 1, limit: 1, ...tabFilters('expiring') }, authenticated);
  const expiredCount = usePantryItemsQuery({ page: 1, limit: 1, ...tabFilters('expired') }, authenticated);
  const counts: Record<Tab, number | undefined> = {
    all: allCount.data?.metadata.totalItems,
    expiring: expiringCount.data?.metadata.totalItems,
    expired: expiredCount.data?.metadata.totalItems,
  };

  const deletion = useDeletePantryItemMutation();
  const items = query.data?.items ?? [];

  const resetView = () => {
    setPage(1);
    setSelected([]);
  };

  const confirmDelete = (item: PantryItem) => {
    Alert.alert('Xóa nguyên liệu?', `Xóa "${item.displayName}" khỏi tủ bếp?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () =>
          deletion.mutate(
            { id: item.id, expectedVersion: item.version },
            {
              onSuccess: () => {
                setSelected((current) => current.filter((value) => value.id !== item.id));
                setPage(1);
              },
              onError: (error) => {
                Alert.alert('Không xóa được', pantryErrorMessage(error));
                void query.refetch();
              },
            }
          ),
      },
    ]);
  };

  const toggleSelect = (item: PantryItem) =>
    setSelected((current) =>
      current.some((value) => value.id === item.id)
        ? current.filter((value) => value.id !== item.id)
        : current.length < 50
          ? [...current, item]
          : current
    );

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected([]);
  };

  if (!authenticated)
    return (
      <SiteScreen>
        <View className="gap-4 p-5">
          <Text className="text-xl font-bold text-foreground">Tủ bếp gia đình</Text>
          <Text className="text-muted-foreground">Đăng nhập để quản lý nguyên liệu cá nhân.</Text>
          <Link href="/(auth)/login" asChild>
            <PrimaryButton label="Đăng nhập" />
          </Link>
        </View>
      </SiteScreen>
    );

  const emptyText: Record<Tab, { title: string; description: string }> = {
    all: { title: 'Chưa có nguyên liệu phù hợp', description: 'Thêm nguyên liệu hoặc đổi bộ lọc.' },
    expiring: {
      title: 'Không có nguyên liệu sắp hết hạn',
      description: `Không có mục nào hết hạn trong ${EXPIRING_DAYS} ngày tới.`,
    },
    expired: { title: 'Không có nguyên liệu đã hết hạn', description: 'Tủ bếp của bạn đang không có mục quá hạn.' },
  };

  return (
    <SiteScreen>
      <View className="gap-4 px-5 pt-4">
        <View className="flex-row items-start gap-2.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5">
          <Info size={16} color="#d97706" />
          <View className="flex-1">
            <Text className="text-sm font-bold text-amber-700">Khuyến cáo quản lý an toàn thực phẩm</Text>
            <Text className="mt-1 text-xs leading-relaxed text-foreground">
              Hạn sử dụng và ghi chú độ tươi là các quan sát do bạn ghi nhận hoặc thu thập từ bao bì. Hệ thống không thay thế
              việc kiểm tra màu sắc, mùi vị và cảm quan thực tế của thực phẩm trước khi chế biến nhằm đảm bảo an toàn vệ sinh tối đa.
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-3xl font-bold tracking-tight text-foreground">Tủ bếp gia đình</Text>
          <Text className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Quản lý nguyên liệu hiện có, theo dõi hạn sử dụng và kiểm soát tồn kho.
          </Text>
        </View>

        <PrimaryButton
          label="Thêm nguyên liệu"
          icon={<Plus size={18} color={colors.primaryForeground} />}
          onPress={() => setCreating(true)}
        />
        <View className="flex-row gap-2">
          {DEV_SCANS_ENABLED ? (
            <>
              <Link href={'/receipt-scan' as Href} asChild>
                <HeaderAction label="Quét hóa đơn" icon={Receipt} onPress={() => undefined} />
              </Link>
              <Link href={'/fridge-scan' as Href} asChild>
                <HeaderAction label="Quét tủ lạnh" icon={Camera} onPress={() => undefined} />
              </Link>
            </>
          ) : null}
          <Link href={'/shopping-preview' as Href} asChild>
            <HeaderAction label="Cần mua" icon={ShoppingCart} onPress={() => undefined} />
          </Link>
          <HeaderAction
            label="Gộp trùng lặp"
            icon={Merge}
            active={selectMode}
            onPress={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
          />
        </View>

        {selectMode ? (
          <View className="gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-3.5">
            <Text className="text-sm font-semibold text-foreground">
              {selected.length === 0 ? 'Chọn từ 2 nguyên liệu trở lên để gộp' : `Đã chọn ${selected.length} nguyên liệu`}
            </Text>
            <View className="flex-row gap-2">
              <PrimaryButton
                label="Xem trước gộp"
                disabled={selected.length < 2}
                onPress={() => setMerging(true)}
                className="flex-1"
              />
              <PrimaryButton label="Hủy" variant="outline" onPress={exitSelectMode} className="flex-1" />
            </View>
          </View>
        ) : null}

        <View className="flex-row items-stretch gap-2">
          <View className="h-[52px] flex-1 flex-row items-center gap-2 rounded-xl border border-input bg-card px-3.5">
            <Search size={16} color={colors.mutedForeground} />
            <TextInput
              value={search}
              onChangeText={(value) => {
                setSearch(value);
                resetView();
              }}
              placeholder="Tìm theo tên nguyên liệu..."
              placeholderTextColor={colors.mutedForeground}
              className="flex-1 text-sm text-foreground"
            />
          </View>
          <DropdownField
            className="w-[116px]"
            label="Nguồn"
            value={source}
            options={SOURCE_OPTIONS}
            onChange={(value) => {
              setSource(value);
              resetView();
            }}
          />
        </View>

        <View className="flex-row gap-1 rounded-full border border-border bg-muted p-1">
          {(
            [
              { value: 'all', label: 'Tất cả', urgent: false },
              { value: 'expiring', label: 'Sắp hết hạn', urgent: true },
              { value: 'expired', label: 'Đã hết hạn', urgent: true },
            ] as const
          ).map((item) => {
            const selectedTab = tab === item.value;
            return (
              <Pressable
                key={item.value}
                accessibilityRole="tab"
                accessibilityState={{ selected: selectedTab }}
                onPress={() => {
                  setTab(item.value);
                  resetView();
                }}
                className={cn(
                  'h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-full',
                  selectedTab ? 'bg-background' : ''
                )}>
                <Text
                  numberOfLines={1}
                  style={{ flexShrink: 0 }}
                  className={cn('text-xs font-semibold', selectedTab ? 'text-foreground' : 'text-muted-foreground')}>
                  {item.label}
                </Text>
                <CountBadge count={counts[item.value]} urgent={item.urgent} />
              </Pressable>
            );
          })}
        </View>

        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 text-sm text-foreground">Hiện cả nguyên liệu đã dùng hết</Text>
          <Switch
            accessibilityLabel="Hiện nguyên liệu đã hết"
            value={includeZero}
            onValueChange={(value) => {
              setIncludeZero(value);
              resetView();
            }}
          />
        </View>

        {query.isLoading ? (
          <LoadingState message="Đang tải tủ bếp..." />
        ) : query.isError ? (
          <ErrorState
            title="Không tải được tủ bếp"
            description={pantryErrorMessage(query.error)}
            onRetry={() => void query.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState title={emptyText[tab].title} description={emptyText[tab].description} />
        ) : (
          <View className="gap-3">
            {items.map((item) => (
              <PantryItemCard
                key={item.id}
                item={item}
                busy={deletion.isPending}
                onDelete={confirmDelete}
                onEdit={(value) => setActive({ item: value, mode: 'OBSERVATION', type: 'CONSUME' })}
                onAdjust={(value, type) => setActive({ item: value, mode: 'QUANTITY', type })}
                selectable={selectMode}
                selected={selected.some((value) => value.id === item.id)}
                onToggleSelect={toggleSelect}
              />
            ))}
          </View>
        )}

        {query.data && query.data.metadata.totalPages > 1 ? (
          <View className="flex-row items-center justify-between">
            <Pressable
              accessibilityLabel="Trang trước"
              disabled={page <= 1 || query.isFetching}
              onPress={() => setPage(page - 1)}
              className="h-12 w-12 items-center justify-center"
            >
              <ChevronLeft color={page <= 1 ? colors.mutedForeground : colors.primary} />
            </Pressable>
            <Text className="text-sm text-foreground">
              Trang {page}/{query.data.metadata.totalPages}
            </Text>
            <Pressable
              accessibilityLabel="Trang sau"
              disabled={!query.data.metadata.hasNextPage || query.isFetching}
              onPress={() => setPage(page + 1)}
              className="h-12 w-12 items-center justify-center"
            >
              <ChevronRight color={colors.primary} />
            </Pressable>
          </View>
        ) : null}
      </View>
      {creating ? <PantryCreateSheet onClose={() => setCreating(false)} /> : null}
      {active ? (
        <PantryItemSheet
          key={`${active.item.id}:${active.mode}:${active.type}`}
          item={active.item}
          initialMode={active.mode}
          initialType={active.type}
          onClose={() => {
            setActive(null);
            setSelected([]);
          }}
        />
      ) : null}
      {merging ? (
        <PantryMergeSheet
          items={selected}
          onClose={() => {
            setMerging(false);
            exitSelectMode();
          }}
        />
      ) : null}
    </SiteScreen>
  );
}
