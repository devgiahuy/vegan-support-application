import * as React from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import {
  Check,
  Camera,
  ChevronLeft,
  ChevronRight,
  Merge,
  Plus,
  RefreshCw,
  Receipt,
  ShoppingCart,
  Warehouse,
} from 'lucide-react-native';
import { SiteScreen } from '@/components/layout/site-screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
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
import type { PantryItem } from '@/features/pantry/types/pantry.model';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';
import { DEV_SCANS_ENABLED } from '@/features/scanning/lib/scan-access';

export default function PantryScreen() {
  const colors = useIconColors();
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const [search, setSearch] = React.useState('');
  const keyword = useDebouncedValue(search.trim(), 350);
  const [page, setPage] = React.useState(1);
  const [expiring, setExpiring] = React.useState(false);
  const [includeZero, setIncludeZero] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [active, setActive] = React.useState<PantryItem | null>(null);
  const [selected, setSelected] = React.useState<PantryItem[]>([]);
  const [merging, setMerging] = React.useState(false);
  const query = usePantryItemsQuery(
    {
      page,
      limit: 20,
      includeZero,
      ...(keyword && !expiring ? { search: keyword } : {}),
    },
    authenticated,
    expiring
  );
  const deletion = useDeletePantryItemMutation();
  const items = query.data?.items ?? [];
  const resetSelection = () => {
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

  if (!authenticated)
    return (
      <SiteScreen>
        <View className="gap-4 p-5">
          <Text className="text-xl font-bold text-foreground">Tủ bếp của tôi</Text>
          <Text className="text-muted-foreground">Đăng nhập để quản lý nguyên liệu cá nhân.</Text>
          <Link href="/(auth)/login" asChild>
            <PrimaryButton label="Đăng nhập" />
          </Link>
        </View>
      </SiteScreen>
    );

  return (
    <SiteScreen>
      <View className="gap-4 px-5 pt-4">
        <View className="flex-row items-center gap-2">
          <Warehouse size={22} color={colors.primary} />
          <Text className="text-2xl font-bold text-foreground">Tủ bếp của tôi</Text>
        </View>
        <Text className="text-sm leading-6 text-muted-foreground">
          Hạn dùng và ghi chú độ tươi là thông tin quan sát, không xác nhận an toàn thực phẩm.
        </Text>
        <View className="flex-row gap-2">
          <PrimaryButton
            label="Thêm nguyên liệu"
            icon={<Plus size={18} color={colors.primaryForeground} />}
            className="flex-1"
            onPress={() => setCreating(true)}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tải lại tủ bếp"
            disabled={query.isFetching}
            onPress={() => {
              setSelected([]);
              void query.refetch();
            }}
            className="h-12 w-12 items-center justify-center rounded-lg border border-border"
          >
            <RefreshCw size={20} color={colors.foreground} />
          </Pressable>
        </View>
        {DEV_SCANS_ENABLED ? (
          <View className="gap-2">
            <Link href={'/fridge-scan' as Href} asChild><PrimaryButton label="Quét tủ lạnh" variant="outline" icon={<Camera size={18} color={colors.primary} />} /></Link>
            <Link href={'/receipt-scan' as Href} asChild><PrimaryButton label="Quét hóa đơn" variant="outline" icon={<Receipt size={18} color={colors.primary} />} /></Link>
          </View>
        ) : null}
        <Link href={'/shopping-preview' as Href} asChild>
          <PrimaryButton
            label="Danh sách cần mua"
            variant="outline"
            icon={<ShoppingCart size={18} color={colors.primary} />}
          />
        </Link>
        <View className="flex-row gap-2">
          {[false, true].map((value) => (
            <Pressable
              key={String(value)}
              accessibilityRole="tab"
              accessibilityState={{ selected: expiring === value }}
              onPress={() => {
                setExpiring(value);
                resetSelection();
              }}
              className={`flex-1 rounded-lg border px-2 py-3 ${expiring === value ? 'border-primary bg-primary/10' : 'border-border'}`}
            >
              <Text className="text-center text-sm font-semibold text-foreground">
                {value ? 'Hạn trong 7 ngày' : 'Tất cả'}
              </Text>
            </Pressable>
          ))}
        </View>
        {!expiring ? (
          <>
            <TextField
              label="Tìm nguyên liệu"
              value={search}
              onChangeText={(value) => {
                setSearch(value);
                resetSelection();
              }}
            />
            <View className="flex-row items-center justify-between">
              <Text className="flex-1 text-sm text-foreground">
                Hiện cả nguyên liệu đã dùng hết
              </Text>
              <Switch
                accessibilityLabel="Hiện nguyên liệu đã hết"
                value={includeZero}
                onValueChange={(value) => {
                  setIncludeZero(value);
                  resetSelection();
                }}
              />
            </View>
          </>
        ) : null}
        {selected.length > 0 ? (
          <View className="gap-2 border-y border-border py-3">
            <Text className="text-sm text-foreground">Đã chọn {selected.length} nguyên liệu</Text>
            <PrimaryButton
              label="Xem trước gộp"
              variant="outline"
              disabled={selected.length < 2}
              icon={<Merge size={18} color={colors.primary} />}
              onPress={() => setMerging(true)}
            />
            <Pressable onPress={() => setSelected([])} className="py-2">
              <Text className="text-center text-primary">Bỏ chọn</Text>
            </Pressable>
          </View>
        ) : null}
        {query.isLoading ? (
          <LoadingState message="Đang tải tủ bếp..." />
        ) : query.isError ? (
          <ErrorState
            title="Không tải được tủ bếp"
            description={pantryErrorMessage(query.error)}
            onRetry={() => void query.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Chưa có nguyên liệu phù hợp"
            description="Thêm nguyên liệu hoặc đổi bộ lọc."
          />
        ) : (
          <View className="gap-3">
            {items.map((item) => (
              <View key={item.id} className="flex-row items-start gap-2">
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityLabel={`Chọn ${item.displayName} để gộp`}
                  accessibilityState={{
                    checked: selected.some((value) => value.id === item.id),
                  }}
                  onPress={() =>
                    setSelected((current) =>
                      current.some((value) => value.id === item.id)
                        ? current.filter((value) => value.id !== item.id)
                        : current.length < 50
                          ? [...current, item]
                          : current
                    )
                  }
                  className="h-12 w-12 items-center justify-center rounded-lg border border-border"
                >
                  {selected.some((value) => value.id === item.id) ? (
                    <Check size={22} color={colors.primary} />
                  ) : null}
                </Pressable>
                <View className="flex-1">
                  <PantryItemCard
                    item={item}
                    onDelete={confirmDelete}
                    onEdit={setActive}
                    busy={deletion.isPending}
                  />
                </View>
              </View>
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
          key={active.id}
          item={active}
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
            setSelected([]);
          }}
        />
      ) : null}
    </SiteScreen>
  );
}
