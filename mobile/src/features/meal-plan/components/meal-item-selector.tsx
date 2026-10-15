import * as React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { BookOpen, Check, Flame, Minus, Plus, Search, Users, Utensils, X } from 'lucide-react-native';

import { LoadMoreButton } from '@/components/shared/load-more-button';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/state-views';
import { useInfiniteCustomMealsQuery } from '@/features/custom-meal/queries/custom-meal.queries';
import { useInfiniteRecipesQuery } from '@/features/recipe/queries/recipe.queries';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import type { MealSourceType } from '../types/meal-plan.model';

export interface SelectedMealItem {
  sourceType: MealSourceType;
  id: string;
  title: string;
  servings: number;
}

type SelectorTab = 'custom' | 'recipes';

const MAX_SERVINGS = 20;

function Thumb({ uri, fallback }: { uri: string | null; fallback: React.ReactNode }) {
  return (
    <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
      {uri ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : fallback}
    </View>
  );
}

function SelectorBody({
  slotLabel,
  onSelect,
  onClose,
}: {
  slotLabel: string;
  onSelect: (item: SelectedMealItem) => void;
  onClose: () => void;
}) {
  const colors = useIconColors();
  const { height: windowHeight } = useWindowDimensions();
  const [tab, setTab] = React.useState<SelectorTab>('custom');
  const [search, setSearch] = React.useState('');
  const [servings, setServings] = React.useState(1);
  const debouncedSearch = useDebouncedValue(search, 400);
  const keyword = debouncedSearch.trim();

  const customMeals = useInfiniteCustomMealsQuery({ limit: 50 });
  const recipes = useInfiniteRecipesQuery({ q: keyword || undefined, limit: 20 });

  // API món riêng không có tham số tìm theo tên nên tìm trên danh sách đã tải; khi đang tìm thì nạp nốt các trang còn lại
  // để không bỏ sót món nằm ở trang sau.
  const { hasNextPage: hasMoreCustomMeals, isFetchingNextPage: isFetchingMoreCustomMeals } = customMeals;
  const fetchMoreCustomMeals = customMeals.fetchNextPage;
  const customMealsFailedNextPage = customMeals.isFetchNextPageError;
  React.useEffect(() => {
    if (keyword && hasMoreCustomMeals && !isFetchingMoreCustomMeals && !customMealsFailedNextPage) {
      void fetchMoreCustomMeals();
    }
  }, [keyword, hasMoreCustomMeals, isFetchingMoreCustomMeals, customMealsFailedNextPage, fetchMoreCustomMeals]);

  const customMealPages = customMeals.data?.pages;
  const customMealTotal = customMealPages?.[0]?.pagination.totalItems ?? 0;
  const filteredCustomMeals = React.useMemo(() => {
    const items = customMealPages?.flatMap((page) => page.items) ?? [];
    if (!keyword) return items;
    const lowered = keyword.toLowerCase();
    return items.filter((meal) => meal.name.toLowerCase().includes(lowered));
  }, [customMealPages, keyword]);

  const recipeItems = recipes.data?.pages.flatMap((page) => page.items) ?? [];

  const choose = (item: Omit<SelectedMealItem, 'servings'>) => {
    onSelect({ ...item, servings: Math.max(1, servings) });
  };

  return (
    <View
      style={{ maxHeight: Math.round(windowHeight * 0.85) }}
      className="w-full max-w-md rounded-3xl border border-border bg-background px-5 pb-5 pt-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground">Chọn món cho {slotLabel}</Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            Chọn từ món ăn cá nhân của bạn hoặc công thức từ cộng đồng. Hệ thống sẽ kiểm tra chế độ ăn và dị ứng.
          </Text>
        </View>
        <Pressable onPress={onClose} accessibilityLabel="Đóng" className="h-9 w-9 items-center justify-center rounded-full bg-muted">
          <X size={16} color={colors.foreground} />
        </Pressable>
      </View>

      <View className="mt-3 flex-row items-center justify-between rounded-xl border border-border bg-muted/30 p-2.5">
        <Text className="text-xs font-medium text-foreground">Số khẩu phần cho bữa này</Text>
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={() => setServings((value) => Math.max(1, value - 1))}
            disabled={servings <= 1}
            className="h-8 w-8 items-center justify-center rounded-lg border border-input bg-background">
            <Minus size={14} color={colors.foreground} />
          </Pressable>
          <Text className="w-7 text-center text-sm font-bold text-foreground">{servings}</Text>
          <Pressable
            onPress={() => setServings((value) => Math.min(MAX_SERVINGS, value + 1))}
            disabled={servings >= MAX_SERVINGS}
            className="h-8 w-8 items-center justify-center rounded-lg border border-input bg-background">
            <Plus size={14} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      <View className="mt-3 flex-row gap-2">
        {(
          [
            { value: 'custom', label: `Món ăn cá nhân (${customMealTotal})`, Icon: Users },
            { value: 'recipes', label: 'Công thức cộng đồng', Icon: BookOpen },
          ] as const
        ).map(({ value, label, Icon }) => {
          const selected = tab === value;
          return (
            <Pressable
              key={value}
              onPress={() => setTab(value)}
              className={cn(
                'flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2.5',
                selected ? 'bg-primary' : 'bg-muted'
              )}>
              <Icon size={14} color={selected ? colors.primaryForeground : colors.mutedForeground} />
              <Text
                className={cn(
                  'text-xs font-semibold',
                  selected ? 'text-primary-foreground' : 'text-muted-foreground'
                )}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-3 flex-row items-center gap-2 rounded-xl border border-input bg-background px-3">
        <Search size={15} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm theo tên món hoặc nguyên liệu..."
          placeholderTextColor={colors.mutedForeground}
          className="h-10 flex-1 text-sm text-foreground"
        />
      </View>

      <ScrollView
        className="mt-3 shrink"
        style={{ flexGrow: 0 }}
        contentContainerClassName="gap-2 pb-2"
        keyboardShouldPersistTaps="handled">
        {tab === 'custom' ? (
          customMeals.isLoading ? (
            <LoadingState message="Đang tải món ăn cá nhân..." />
          ) : customMeals.isError ? (
            <ErrorState title="Không tải được món ăn cá nhân." onRetry={() => void customMeals.refetch()} />
          ) : filteredCustomMeals.length === 0 ? (
            <EmptyState
              title="Chưa có món ăn cá nhân phù hợp"
              description="Bạn có thể tạo món mới trong mục Món ăn của tôi ở Hồ sơ."
            />
          ) : (
            filteredCustomMeals.map((meal) => (
              <Pressable
                key={meal.id}
                onPress={() => choose({ sourceType: 'CUSTOM_MEAL', id: meal.id, title: meal.name })}
                className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3 active:bg-muted">
                <Thumb uri={meal.coverPhotoUrl} fallback={<Utensils size={18} color={colors.mutedForeground} />} />
                <View className="flex-1 gap-0.5">
                  <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
                    {meal.name}
                  </Text>
                  <View className="flex-row flex-wrap items-center gap-x-3 gap-y-0.5">
                    <Text className="text-[11px] text-muted-foreground">{meal.servings} khẩu phần gốc</Text>
                    {meal.calories !== null ? (
                      <View className="flex-row items-center gap-0.5">
                        <Flame size={11} color={colors.cta} />
                        <Text className="text-[11px] font-medium text-cta">{Math.round(meal.calories)} kcal</Text>
                      </View>
                    ) : null}
                    <Text className="text-[11px] text-muted-foreground">{meal.ingredientCount} nguyên liệu</Text>
                  </View>
                </View>
                <Check size={16} color={colors.primary} />
              </Pressable>
            ))
          )
        ) : recipes.isLoading ? (
          <LoadingState message="Đang tìm công thức..." />
        ) : recipes.isError ? (
          <ErrorState title="Không tải được công thức." onRetry={() => void recipes.refetch()} />
        ) : recipeItems.length === 0 ? (
          <EmptyState title="Không tìm thấy công thức phù hợp" description="Thử từ khóa khác." />
        ) : (
          recipeItems.map((recipe) => (
            <Pressable
              key={recipe.id}
              onPress={() => choose({ sourceType: 'RECIPE', id: recipe.id, title: recipe.title })}
              className="flex-row items-center gap-3 rounded-xl border border-border bg-card p-3 active:bg-muted">
              <Thumb uri={recipe.coverImageUrl || null} fallback={<BookOpen size={18} color={colors.mutedForeground} />} />
              <View className="flex-1 gap-0.5">
                <Text numberOfLines={1} className="text-sm font-semibold text-foreground">
                  {recipe.title}
                </Text>
                <View className="flex-row flex-wrap items-center gap-x-3 gap-y-0.5">
                  {recipe.nutrition.calories !== null && recipe.nutrition.calories > 0 ? (
                    <View className="flex-row items-center gap-0.5">
                      <Flame size={11} color={colors.cta} />
                      <Text className="text-[11px] font-medium text-cta">
                        {Math.round(recipe.nutrition.calories)} kcal
                      </Text>
                    </View>
                  ) : null}
                  <Text className="text-[11px] text-muted-foreground">{recipe.servings || 1} khẩu phần</Text>
                </View>
              </View>
              <Check size={16} color={colors.primary} />
            </Pressable>
          ))
        )}
        {tab === 'custom' && !keyword ? (
          <LoadMoreButton
            hasNextPage={customMeals.hasNextPage}
            isFetchingNextPage={customMeals.isFetchingNextPage}
            onPress={() => void customMeals.fetchNextPage()}
          />
        ) : null}
        {tab === 'recipes' ? (
          <LoadMoreButton
            hasNextPage={recipes.hasNextPage}
            isFetchingNextPage={recipes.isFetchingNextPage}
            onPress={() => void recipes.fetchNextPage()}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

/**
 * Hộp chọn món cho một ô thực đơn (popup giữa màn hình) — đồng bộ `meal-plan-item-selector.tsx` của web:
 * hai tab (bữa ăn tự tạo / công thức cộng đồng), tìm kiếm, chọn số khẩu phần. Chỉ mount khi mở nên các
 * truy vấn danh sách chỉ chạy lúc cần.
 */
export function MealItemSelector({
  visible,
  slotLabel,
  onSelect,
  onClose,
}: {
  visible: boolean;
  slotLabel: string;
  onSelect: (item: SelectedMealItem) => void;
  onClose: () => void;
}) {
  if (!visible) return null;
  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 items-center justify-center bg-black/60 px-5">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Đóng" />
        <SelectorBody slotLabel={slotLabel} onSelect={onSelect} onClose={onClose} />
      </KeyboardAvoidingView>
    </Modal>
  );
}
