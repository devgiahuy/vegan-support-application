import * as React from 'react';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Check, ChevronDown, ChevronUp, Minus, Plus, Search, ShoppingCart, X } from 'lucide-react-native';
import { SiteScreen } from '@/components/layout/site-screen';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { PrimaryButton } from '@/components/ui/primary-button';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/state-views';
import { useRecipesQuery } from '@/features/recipe/queries/recipe.queries';
import { useCustomMealsQuery } from '@/features/custom-meal/queries/custom-meal.queries';
import { ShoppingPreviewView } from '@/features/shopping/components/shopping-preview-view';
import { useShoppingPreviewQuery } from '@/features/shopping/queries/shopping.queries';
import type { SelectedShoppingMeal } from '@/features/shopping/types/shopping.model';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

export default function ShoppingPreviewScreen() {
  const colors = useIconColors();
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const [source, setSource] = React.useState<'RECIPE' | 'CUSTOM_MEAL'>('RECIPE');
  const [search, setSearch] = React.useState('');
  const keyword = useDebouncedValue(search.trim(), 350);
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState<SelectedShoppingMeal[]>([]);
  const [request, setRequest] = React.useState<SelectedShoppingMeal[] | null>(null);
  const [pickerExpanded, setPickerExpanded] = React.useState(true);

  const recipes = useRecipesQuery({
    page,
    limit: 15,
    ...(keyword ? { q: keyword } : {}),
  });
  const custom = useCustomMealsQuery({ page, limit: 15 });
  const preview = useShoppingPreviewQuery(request);
  const list = source === 'RECIPE' ? recipes : custom;
  const options =
    source === 'RECIPE'
      ? (recipes.data?.items ?? []).map((meal) => ({
          id: meal.id,
          name: meal.title,
          servings: meal.servings,
          image: meal.coverImageUrl,
        }))
      : (custom.data?.items ?? []).map((meal) => ({
          id: meal.id,
          name: meal.name,
          servings: meal.servings,
          image: meal.coverPhotoUrl,
        }));
  const totalPages =
    source === 'RECIPE' ? recipes.data?.metadata.totalPages : custom.data?.pagination.totalPages;

  const choose = (meal: { id: string; name: string; servings: number }) => {
    setRequest(null);
    setSelected((current) =>
      current.some((value) => value.id === meal.id && value.sourceType === source)
        ? current.filter((value) => value.id !== meal.id || value.sourceType !== source)
        : current.length < 50
          ? [
              ...current,
              {
                id: meal.id,
                name: meal.name,
                sourceType: source,
                servings: Math.max(1, Math.min(100, meal.servings || 1)),
              },
            ]
          : current
    );
  };

  const changeServings = (index: number, delta: number) => {
    setRequest(null);
    setSelected((current) =>
      current.map((meal, position) =>
        position === index
          ? {
              ...meal,
              servings: Math.max(1, Math.min(100, meal.servings + delta)),
            }
          : meal
      )
    );
  };

  const calculateShopping = () => {
    if (!selected.length) return;
    setPickerExpanded(false);
    if (request === selected) void preview.refetch();
    else setRequest(selected);
  };

  if (!authenticated) {
    return (
      <SiteScreen title="Danh sách cần mua">
        <View className="gap-4 p-5">
          <Text className="text-xl font-bold text-foreground">Danh sách cần mua</Text>
          <Text className="text-sm text-muted-foreground">Đăng nhập để đối chiếu với tủ bếp của bạn.</Text>
          <Link href="/(auth)/login" asChild>
            <PrimaryButton label="Đăng nhập" />
          </Link>
        </View>
      </SiteScreen>
    );
  }

  return (
    <SiteScreen title="Danh sách cần mua">
      <View className="gap-4 px-5 pt-4">
        <View className="gap-1">
          <View className="flex-row items-center gap-2">
            <ShoppingCart size={20} color={colors.primary} />
            <Text className="flex-1 text-xl font-bold text-foreground">Đối chiếu nguyên liệu cần mua</Text>
          </View>
          <Text className="text-sm leading-relaxed text-muted-foreground">
            Chọn món muốn nấu và số khẩu phần để đối chiếu với lượng hiện có trong tủ bếp. Không làm thay đổi tồn kho.
          </Text>
        </View>

        {/* Khi đã bấm tính toán: đưa kết quả lên đầu màn hình */}
        {request ? (
          <View className="gap-3">
            <ShoppingPreviewView preview={preview} />
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: pickerExpanded }}
              onPress={() => setPickerExpanded((v) => !v)}
              className="min-h-12 flex-row items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 active:bg-muted/50">
              <Text className="text-sm font-semibold text-foreground">
                Chỉnh sửa món đã chọn ({selected.length})
              </Text>
              {pickerExpanded ? (
                <ChevronUp size={18} color={colors.foreground} />
              ) : (
                <ChevronDown size={18} color={colors.foreground} />
              )}
            </Pressable>
          </View>
        ) : null}

        {pickerExpanded ? (
          <View className="gap-4">
            <View className="flex-row gap-2">
              {(['RECIPE', 'CUSTOM_MEAL'] as const).map((value) => {
                const active = source === value;
                return (
                  <Pressable
                    key={value}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      setSource(value);
                      setPage(1);
                    }}
                    className={cn(
                      'min-h-11 flex-1 items-center justify-center rounded-xl border px-3',
                      active ? 'border-primary bg-primary/10' : 'border-border bg-card'
                    )}
                  >
                    <Text className={cn('text-sm', active ? 'font-semibold text-primary' : 'text-foreground')}>
                      {value === 'RECIPE' ? 'Công thức' : 'Món ăn của tôi'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {source === 'RECIPE' ? (
              <View className="h-12 flex-row items-center gap-2 rounded-2xl border border-input bg-card pl-3.5 pr-1">
                <Search size={16} color={colors.mutedForeground} />
                <TextInput
                  value={search}
                  onChangeText={(value) => {
                    setSearch(value);
                    setPage(1);
                  }}
                  placeholder="Tìm món cần nấu..."
                  placeholderTextColor={colors.mutedForeground}
                  className="flex-1 text-sm text-foreground"
                />
                {search.length > 0 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Xóa tìm kiếm"
                    onPress={() => {
                      setSearch('');
                      setPage(1);
                    }}
                    className="h-10 w-10 items-center justify-center rounded-full">
                    <X size={15} color={colors.mutedForeground} />
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {list.isLoading ? (
              <LoadingState message="Đang tải món..." />
            ) : list.isError ? (
              <ErrorState
                description={getApiErrorMessage(list.error)}
                onRetry={() => void list.refetch()}
              />
            ) : options.length === 0 ? (
              <EmptyState title="Chưa có món phù hợp" />
            ) : (
              <View className="overflow-hidden rounded-2xl border border-border bg-card">
                {options.map((meal, index) => {
                  const checked = selected.some(
                    (value) => value.id === meal.id && value.sourceType === source
                  );
                  return (
                    <Pressable
                      key={meal.id}
                      accessibilityRole="checkbox"
                      accessibilityLabel={meal.name}
                      accessibilityState={{ checked }}
                      disabled={!checked && selected.length >= 50}
                      onPress={() => choose(meal)}
                      className={cn(
                        'min-h-16 flex-row items-center gap-3 px-3.5 py-2.5 active:bg-muted/50',
                        index < options.length - 1 ? 'border-b border-border' : ''
                      )}
                    >
                      {meal.image ? (
                        <Image
                          source={{ uri: meal.image }}
                          style={{ width: 48, height: 48, borderRadius: 10 }}
                          contentFit="cover"
                        />
                      ) : (
                        <View className="h-12 w-12 items-center justify-center rounded-xl bg-muted">
                          <ShoppingCart size={20} color={colors.mutedForeground} />
                        </View>
                      )}
                      <Text numberOfLines={2} className="flex-1 text-sm font-semibold text-foreground">{meal.name}</Text>
                      <View
                        className={cn(
                          'h-6 w-6 items-center justify-center rounded-md border',
                          checked ? 'border-primary bg-primary' : 'border-primary'
                        )}>
                        {checked ? <Check size={16} color={colors.primaryForeground} /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <PaginationBar
              page={page}
              totalPages={totalPages ?? 1}
              onChange={setPage}
              disabled={list.isFetching}
            />
          </View>
        ) : null}

        {selected.length > 0 ? (
          <View className="gap-2 rounded-2xl border border-border bg-card p-4">
            <Text className="text-base font-bold text-foreground">
              Đã chọn {selected.length}/50 món
            </Text>
            {selected.map((meal, index) => (
              <View
                key={`${meal.sourceType}-${meal.id}`}
                className={cn(
                  'gap-2 py-2.5',
                  index < selected.length - 1 ? 'border-b border-border' : ''
                )}
              >
                <View className="flex-row items-center gap-2">
                  <Text className="flex-1 text-sm font-semibold text-foreground">{meal.name}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Bỏ ${meal.name}`}
                    onPress={() => {
                      setRequest(null);
                      setSelected((current) => current.filter((_, position) => position !== index));
                    }}
                    className="h-11 w-11 items-center justify-center rounded-full active:bg-destructive/10"
                  >
                    <X size={18} color={colors.destructive} />
                  </Pressable>
                </View>
                <View className="flex-row items-center gap-2.5">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Giảm khẩu phần ${meal.name}`}
                    disabled={meal.servings <= 1}
                    onPress={() => changeServings(index, -1)}
                    className={cn(
                      'h-11 w-11 items-center justify-center rounded-xl border border-border',
                      meal.servings <= 1 ? 'opacity-40' : 'active:bg-muted'
                    )}
                  >
                    <Minus size={18} color={colors.primary} />
                  </Pressable>
                  <Text className="min-w-20 text-center text-sm font-semibold text-foreground">
                    {meal.servings} phần
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Tăng khẩu phần ${meal.name}`}
                    disabled={meal.servings >= 100}
                    onPress={() => changeServings(index, 1)}
                    className={cn(
                      'h-11 w-11 items-center justify-center rounded-xl border border-border',
                      meal.servings >= 100 ? 'opacity-40' : 'active:bg-muted'
                    )}
                  >
                    <Plus size={18} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <PrimaryButton
          label="Tính nguyên liệu cần mua"
          disabled={!selected.length}
          loading={Boolean(request) && preview.isFetching}
          onPress={calculateShopping}
        />
      </View>
    </SiteScreen>
  );
}
