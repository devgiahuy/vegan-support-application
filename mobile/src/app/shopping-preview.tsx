import * as React from 'react';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Check, Minus, Plus, ShoppingCart, X } from 'lucide-react-native';
import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/state-views';
import { useRecipesQuery } from '@/features/recipe/queries/recipe.queries';
import { useCustomMealsQuery } from '@/features/custom-meal/queries/custom-meal.queries';
import { useShoppingPreviewQuery } from '@/features/shopping/queries/shopping.queries';
import type { SelectedShoppingMeal } from '@/features/shopping/types/shopping.model';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
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

  if (!authenticated)
    return (
      <SiteScreen>
        <View className="gap-4 p-5">
          <Text className="text-xl font-bold text-foreground">Danh sách cần mua</Text>
          <Text className="text-muted-foreground">Đăng nhập để đối chiếu với tủ bếp của bạn.</Text>
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
          <ShoppingCart size={22} color={colors.primary} />
          <Text className="flex-1 text-2xl font-bold text-foreground">Danh sách cần mua</Text>
        </View>
        <Text className="text-sm leading-6 text-muted-foreground">
          Đối chiếu nguyên liệu của món đã chọn với lượng có trong tủ bếp. Xem trước không thay đổi
          số lượng tồn.
        </Text>
        <View className="flex-row gap-2">
          {(['RECIPE', 'CUSTOM_MEAL'] as const).map((value) => (
            <Pressable
              key={value}
              accessibilityRole="tab"
              accessibilityState={{ selected: source === value }}
              onPress={() => {
                setSource(value);
                setPage(1);
              }}
              className={`min-h-12 flex-1 items-center justify-center rounded-lg border ${source === value ? 'border-primary bg-primary/10' : 'border-border'}`}
            >
              <Text className="text-sm text-foreground">
                {value === 'RECIPE' ? 'Công thức' : 'Món riêng'}
              </Text>
            </Pressable>
          ))}
        </View>
        {source === 'RECIPE' ? (
          <TextField
            label="Tìm món"
            value={search}
            onChangeText={(value) => {
              setSearch(value);
              setPage(1);
            }}
          />
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
          options.map((meal) => {
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
                className="min-h-16 flex-row items-center gap-3 border-b border-border py-2"
              >
                {meal.image ? (
                  <Image
                    source={{ uri: meal.image }}
                    style={{ width: 48, height: 48, borderRadius: 8 }}
                    contentFit="cover"
                  />
                ) : (
                  <View className="h-12 w-12 items-center justify-center bg-muted">
                    <ShoppingCart size={20} color={colors.mutedForeground} />
                  </View>
                )}
                <Text className="flex-1 text-sm font-semibold text-foreground">{meal.name}</Text>
                <View className="h-6 w-6 items-center justify-center rounded border border-primary">
                  {checked ? <Check size={18} color={colors.primary} /> : null}
                </View>
              </Pressable>
            );
          })
        )}
        <View className="flex-row gap-2">
          <PrimaryButton
            label="Trang trước"
            variant="outline"
            className="flex-1"
            disabled={page <= 1 || list.isFetching}
            onPress={() => setPage(page - 1)}
          />
          <PrimaryButton
            label="Trang sau"
            variant="outline"
            className="flex-1"
            disabled={page >= (totalPages ?? 1) || list.isFetching}
            onPress={() => setPage(page + 1)}
          />
        </View>
        {selected.length ? (
          <>
            <Text className="text-lg font-bold text-foreground">
              Đã chọn {selected.length}/50 món
            </Text>
            {selected.map((meal, index) => (
              <View
                key={`${meal.sourceType}-${meal.id}`}
                className="gap-2 border-b border-border py-3"
              >
                <View className="flex-row items-center gap-3">
                  <Text className="flex-1 font-semibold text-foreground">{meal.name}</Text>
                  <Pressable
                    accessibilityLabel={`Bỏ ${meal.name}`}
                    onPress={() => {
                      setRequest(null);
                      setSelected((current) => current.filter((_, position) => position !== index));
                    }}
                    className="h-12 w-12 items-center justify-center"
                  >
                    <X size={20} color={colors.destructive} />
                  </Pressable>
                </View>
                <View className="flex-row items-center gap-3">
                  <Pressable
                    accessibilityLabel={`Giảm khẩu phần ${meal.name}`}
                    disabled={meal.servings <= 1}
                    onPress={() => changeServings(index, -1)}
                    className="h-12 w-12 items-center justify-center rounded-lg border border-border"
                  >
                    <Minus size={18} color={colors.primary} />
                  </Pressable>
                  <Text className="min-w-20 text-center text-sm text-foreground">
                    {meal.servings} phần
                  </Text>
                  <Pressable
                    accessibilityLabel={`Tăng khẩu phần ${meal.name}`}
                    disabled={meal.servings >= 100}
                    onPress={() => changeServings(index, 1)}
                    className="h-12 w-12 items-center justify-center rounded-lg border border-border"
                  >
                    <Plus size={18} color={colors.primary} />
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        ) : null}
        <PrimaryButton
          label="Tính nguyên liệu cần mua"
          disabled={!selected.length}
          loading={Boolean(request) && preview.isFetching}
          onPress={() => {
            if (request === selected) void preview.refetch();
            else setRequest(selected);
          }}
        />
        {request ? (
          preview.isLoading ? (
            <LoadingState message="Đang đối chiếu tủ bếp..." />
          ) : preview.isError ? (
            <ErrorState
              title="Không tính được danh sách"
              description={
                getApiErrorCode(preview.error) === 'SHOPPING_MEAL_NOT_FOUND'
                  ? 'Có món đã bị xóa hoặc không còn truy cập được. Bỏ món đó rồi tính lại.'
                  : getApiErrorMessage(preview.error)
              }
              onRetry={() => void preview.refetch()}
            />
          ) : preview.data ? (
            <>
              <Text className="text-lg font-bold text-foreground">
                Cần mua thêm {preview.data.missingItemCount} nguyên liệu
              </Text>
              <Text className="text-xs text-muted-foreground">
                Tủ bếp tại {new Date(preview.data.pantryAsOf).toLocaleString('vi-VN')}
              </Text>
              {preview.data.items.map((item, index) => (
                <View
                  key={`${item.id}-${index}`}
                  className="gap-2 rounded-lg border border-border p-4"
                >
                  <Text className="font-bold text-foreground">{item.name}</Text>
                  <Text className="text-sm text-primary">
                    {item.needsPurchase ? `Cần mua: ${item.missing}` : 'Đã có đủ'}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Cần: {item.required} · Có: {item.available}
                  </Text>
                  <Text className="text-sm text-muted-foreground">Dư: {item.surplus}</Text>
                  <Text className="text-xs text-muted-foreground">
                    Mức tin cậy quy đổi: {item.confidencePercent}%
                  </Text>
                  <Text className="text-xs text-muted-foreground">{item.mealNames.join(', ')}</Text>
                  {item.assumptions.map((assumption, position) => (
                    <Text key={position} className="text-xs text-muted-foreground">
                      {assumption}
                    </Text>
                  ))}
                </View>
              ))}
              {preview.data.unresolvedItems.length ? (
                <Text className="text-lg font-bold text-foreground">Cần kiểm tra thêm</Text>
              ) : null}
              {preview.data.unresolvedItems.map((item, index) => (
                <View key={index} className="gap-2 border-l-4 border-amber-500 px-3 py-2">
                  <Text className="font-semibold text-foreground">
                    {item.name}: {item.required}
                  </Text>
                  <Text className="text-sm text-muted-foreground">{item.reason}</Text>
                  <Text className="text-sm text-muted-foreground">{item.explanation}</Text>
                  <Text className="text-xs text-muted-foreground">{item.mealNames.join(', ')}</Text>
                </View>
              ))}
            </>
          ) : null
        ) : null}
      </View>
    </SiteScreen>
  );
}
