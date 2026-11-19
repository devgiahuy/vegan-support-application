import * as React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Link, type Href, useLocalSearchParams } from 'expo-router';
import { Plus, Search, ShieldCheck, SlidersHorizontal, Sparkles, X } from 'lucide-react-native';

import { ExploreContentTabs } from '@/components/layout/explore-content-tabs';
import { SiteScreen } from '@/components/layout/site-screen';
import { FormSheet } from '@/components/shared/form-sheet';
import { EmptyState, ErrorState } from '@/components/shared/state-views';
import { LoadMoreButton } from '@/components/shared/load-more-button';
import { DropdownField } from '@/components/ui/dropdown-field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { RecipeCard } from '@/features/recipe/components/recipe-card';
import {
  IngredientFilterEditor,
  type IngredientFilterItem,
} from '@/features/recipe/components/recipe-ingredient-filter';
import { useInfiniteRecipesQuery } from '@/features/recipe/queries/recipe.queries';
import { CategoryType } from '@/common/enums';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { buildCategoryOptions } from '@/features/category/utils/category-options';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const DIFFICULTIES = [
  { label: 'Tất cả', value: '' },
  { label: 'Dễ', value: 'EASY' },
  { label: 'Trung bình', value: 'MEDIUM' },
  { label: 'Nâng cao', value: 'HARD' },
];

/** Backend chỉ hỗ trợ cận trên `maxCookTimeMinutes`. */
const COOK_TIMES: { label: string; value: number | null }[] = [
  { label: 'Tất cả', value: null },
  { label: 'Dưới 15 phút', value: 15 },
  { label: 'Dưới 30 phút', value: 30 },
  { label: 'Dưới 60 phút', value: 60 },
];

function getDifficultyLabel(value: string): string {
  return DIFFICULTIES.find((item) => item.value === value)?.label ?? value;
}

function getCookTimeLabel(value: number): string {
  return COOK_TIMES.find((item) => item.value === value)?.label ?? `Dưới ${value} phút`;
}

/**
 * Màn "Khám phá" (Công thức): ưu tiên tìm kiếm tức thì ở đầu trang, thanh chuyển loại nội dung,
 * bộ lọc nhanh theo danh mục, bảng trượt dưới cho bộ lọc nâng cao và lưới 2 cột dễ đọc.
 */
export default function RecipesScreen() {
  const colors = useIconColors();
  const params = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebouncedValue(query, 400);
  const [difficulty, setDifficulty] = React.useState('');
  const [maxCookTime, setMaxCookTime] = React.useState<number | null>(null);
  const [ingredients, setIngredients] = React.useState<IngredientFilterItem[]>([]);
  const [categoryId, setCategoryId] = React.useState<string | null>(params.category ?? null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [eligibilityView, setEligibilityView] = React.useState<'ELIGIBLE' | 'INELIGIBLE'>('ELIGIBLE');
  const viewIneligible = isAuthenticated && eligibilityView === 'INELIGIBLE';

  const {
    data: categoryTree = [],
    isLoading: isCategoryLoading,
    isError: isCategoryError,
    refetch: refetchCategories,
  } = useCategoryTreeQuery(CategoryType.RECIPE_GROUP);

  const {
    data: recipePages,
    isLoading: isRecipesLoading,
    isError: isRecipesError,
    refetch: refetchRecipes,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteRecipesQuery({
    q: debouncedQuery.trim() || undefined,
    category: categoryId || undefined,
    difficulty: difficulty || undefined,
    maxCookTimeMinutes: maxCookTime ?? undefined,
    ingredientIds: ingredients.length > 0 ? ingredients.map((item) => item.id) : undefined,
    eligibility: viewIneligible ? 'INELIGIBLE' : undefined,
  });

  const recipesPagination = recipePages?.pages[0];
  const recipes = recipePages?.pages.flatMap((page) => page.items) ?? [];
  const totalItems = recipesPagination?.metadata?.totalItems ?? recipes.length;
  const categoryOptions = React.useMemo(() => buildCategoryOptions(categoryTree), [categoryTree]);
  const selectedCategoryLabel = React.useMemo(
    () => categoryOptions.find((item) => item.value === categoryId)?.label ?? null,
    [categoryId, categoryOptions]
  );

  const advancedFilterCount =
    (difficulty ? 1 : 0) +
    (maxCookTime !== null ? 1 : 0) +
    (ingredients.length > 0 ? 1 : 0) +
    (viewIneligible ? 1 : 0);
  const hasFilters = Boolean(categoryId || advancedFilterCount > 0 || query.trim());
  const constraints = recipesPagination?.metadata?.appliedConstraints;

  const resetAllFilters = () => {
    setCategoryId(null);
    setDifficulty('');
    setMaxCookTime(null);
    setIngredients([]);
    setEligibilityView('ELIGIBLE');
    setQuery('');
  };

  const resetSheetFilters = () => {
    setDifficulty('');
    setMaxCookTime(null);
    setIngredients([]);
    setEligibilityView('ELIGIBLE');
  };

  const headerAction = (
    <Link href={'/recipes/new' as Href} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Đăng công thức mới"
        className="h-10 flex-row items-center gap-1 rounded-full bg-primary px-3.5 active:opacity-90">
        <Plus size={15} color={colors.primaryForeground} />
        <Text numberOfLines={1} style={{ flexShrink: 0 }} className="text-xs font-semibold text-primary-foreground">
          Đăng món
        </Text>
      </Pressable>
    </Link>
  );

  return (
    <SiteScreen onRefresh={() => refetchRecipes()} headerRight={headerAction}>
      <View className="gap-3 px-5 pt-3.5">
        {/* 1. Ô tìm kiếm ở vị trí đầu tiên để tìm món ngay */}
        <View className="h-12 flex-row items-center gap-2 rounded-2xl border border-input bg-card pl-3.5 pr-1.5">
          <Search size={18} color={colors.primary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm tên món chay, nguyên liệu..."
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="search"
            className="h-full flex-1 text-sm text-foreground"
          />
          {query.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xóa từ khóa"
              onPress={() => setQuery('')}
              className="h-11 w-11 items-center justify-center rounded-full active:bg-muted">
              <X size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>

        {/* 2. Chuyển chuyên mục Khám phá */}
        <ExploreContentTabs />

        {/* 3. Bộ lọc nhanh + Nút mở bảng trượt Bộ lọc nâng cao */}
        <View className="flex-row items-stretch gap-2">
          <DropdownField
            className="flex-1"
            label="Danh mục"
            value={categoryId}
            options={categoryOptions}
            onChange={setCategoryId}
            status={isCategoryLoading ? 'loading' : isCategoryError ? 'error' : undefined}
            onRetry={() => void refetchCategories()}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mở bộ lọc nâng cao"
            onPress={() => setFiltersOpen(true)}
            className={cn(
              'min-h-11 flex-row items-center justify-center gap-1.5 rounded-xl border px-3.5 active:bg-muted/50',
              advancedFilterCount > 0 ? 'border-primary bg-primary/10' : 'border-input bg-card'
            )}>
            <SlidersHorizontal
              size={16}
              color={advancedFilterCount > 0 ? colors.primary : colors.foreground}
            />
            <Text
              className={cn(
                'text-xs font-semibold',
                advancedFilterCount > 0 ? 'text-primary' : 'text-foreground'
              )}>
              Bộ lọc
            </Text>
            {advancedFilterCount > 0 ? (
              <View className="h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1">
                <Text className="text-xs font-bold text-primary-foreground">{advancedFilterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* 4. Trạng thái an toàn ăn uống (1 dòng gọn) */}
        {viewIneligible ? (
          <View className="flex-row items-center justify-between gap-2 rounded-2xl border border-border bg-muted/40 px-3.5 py-2.5">
            <Text className="flex-1 text-xs font-medium text-foreground">
              Đang xem các món không phù hợp hồ sơ của bạn
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setEligibilityView('ELIGIBLE')}
              hitSlop={6}
              className="min-h-9 justify-center px-1.5">
              <Text className="text-xs font-semibold text-primary underline">Xem món phù hợp</Text>
            </Pressable>
          </View>
        ) : constraints?.authenticated ? (
          <View className="flex-row items-center gap-2 rounded-2xl border border-primary/25 bg-primary/5 px-3.5 py-2.5">
            <ShieldCheck size={16} color={colors.primary} />
            <Text numberOfLines={1} className="flex-1 text-xs font-semibold text-foreground">
              Đã lọc theo chế độ ăn của bạn
            </Text>
            <Link href={'/diet-preferences' as Href} asChild>
              <Pressable hitSlop={6} className="min-h-9 justify-center px-1.5">
                <Text className="text-xs font-semibold text-primary underline">Tùy chỉnh</Text>
              </Pressable>
            </Link>
          </View>
        ) : null}

        {/* 5. Số lượng kết quả & các bộ lọc đang áp dụng */}
        <View className="flex-row items-center justify-between gap-2 pt-0.5">
          <Text className="text-xs font-semibold text-muted-foreground">
            {totalItems} công thức
          </Text>
          {hasFilters ? (
            <Pressable
              accessibilityRole="button"
              onPress={resetAllFilters}
              hitSlop={6}
              className="min-h-8 flex-row items-center gap-1 px-1">
              <X size={13} color={colors.primary} />
              <Text className="text-xs font-semibold text-primary">Xóa tất cả bộ lọc</Text>
            </Pressable>
          ) : null}
        </View>

        {hasFilters ? (
          <View className="flex-row flex-wrap gap-2">
            {query.trim() ? (
              <ActiveChip label={`Từ khóa: "${query.trim()}"`} onRemove={() => setQuery('')} />
            ) : null}
            {categoryId && selectedCategoryLabel ? (
              <ActiveChip label={selectedCategoryLabel} onRemove={() => setCategoryId(null)} />
            ) : null}
            {difficulty ? (
              <ActiveChip label={`Độ khó: ${getDifficultyLabel(difficulty)}`} onRemove={() => setDifficulty('')} />
            ) : null}
            {maxCookTime !== null ? (
              <ActiveChip label={getCookTimeLabel(maxCookTime)} onRemove={() => setMaxCookTime(null)} />
            ) : null}
            {ingredients.map((item) => (
              <ActiveChip
                key={item.id}
                label={item.name}
                onRemove={() => setIngredients((prev) => prev.filter((entry) => entry.id !== item.id))}
              />
            ))}
            {viewIneligible ? (
              <ActiveChip label="Món không phù hợp" onRemove={() => setEligibilityView('ELIGIBLE')} />
            ) : null}
          </View>
        ) : null}

        {/* 6. Lưới 2 cột công thức */}
        <View className="mt-1">
          {isRecipesLoading ? (
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {[1, 2, 3, 4].map((i) => (
                <View key={i} className="h-52 w-[48.5%] rounded-2xl border border-border bg-muted" />
              ))}
            </View>
          ) : isRecipesError ? (
            <ErrorState
              title="Không thể tải danh sách công thức."
              description="Đã có lỗi xảy ra khi kết nối tới máy chủ. Vui lòng thử lại."
              onRetry={() => void refetchRecipes()}
            />
          ) : recipes.length === 0 ? (
            <EmptyState
              title="Chưa có công thức phù hợp"
              description={
                query.trim()
                  ? `Không tìm thấy công thức cho từ khóa "${query.trim()}".`
                  : viewIneligible
                    ? 'Không có món nào bị loại theo hồ sơ với bộ lọc hiện tại.'
                    : 'Chưa có công thức nào khớp với bộ lọc hiện tại.'
              }
              action={
                hasFilters ? (
                  <PrimaryButton label="Xóa tất cả bộ lọc" variant="outline" onPress={resetAllFilters} />
                ) : undefined
              }
            />
          ) : (
            <>
              <View className="flex-row flex-wrap justify-between gap-y-3">
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} className="w-[48.5%]" />
                ))}
              </View>
              <View className="mt-4">
                <LoadMoreButton
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  onPress={() => void fetchNextPage()}
                />
              </View>
            </>
          )}
        </View>

        {/* Gợi ý trợ lý AI */}
        <View className="mt-2 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <View className="flex-row items-center gap-1.5">
            <Sparkles size={15} color={colors.cta} />
            <Text className="text-xs font-semibold text-cta">Không tìm thấy món phù hợp?</Text>
          </View>
          <Text className="mt-1.5 text-sm font-bold text-foreground">
            Hỏi AI gợi ý theo nguyên liệu bạn đang có trong tủ lạnh
          </Text>
          <View className="mt-3">
            <Link href={'/assistant' as Href} asChild>
              <PrimaryButton
                label="Hỏi AI thay thế nguyên liệu"
                icon={<Sparkles size={16} color={colors.primaryForeground} />}
              />
            </Link>
          </View>
        </View>
      </View>

      {/* Bảng trượt dưới cho bộ lọc nâng cao (chỉ dùng các tiêu chí backend hỗ trợ) */}
      {filtersOpen ? (
        <FormSheet title="Bộ lọc món chay" onClose={() => setFiltersOpen(false)}>
          {isAuthenticated ? (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Lọc theo hồ sơ ăn uống</Text>
              <View className="flex-row gap-2">
                {(
                  [
                    { value: 'ELIGIBLE', label: 'Phù hợp với bạn' },
                    { value: 'INELIGIBLE', label: 'Món không phù hợp' },
                  ] as const
                ).map((option) => {
                  const selected = eligibilityView === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setEligibilityView(option.value)}
                      className={cn(
                        'min-h-11 flex-1 items-center justify-center rounded-xl border px-3',
                        selected ? 'border-primary bg-primary/10' : 'border-input bg-card'
                      )}>
                      <Text className={cn('text-sm font-semibold', selected ? 'text-primary' : 'text-foreground')}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Độ khó</Text>
            <View className="flex-row flex-wrap gap-2">
              {DIFFICULTIES.map((item) => {
                const selected = difficulty === item.value;
                return (
                  <Pressable
                    key={item.value || 'ALL'}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setDifficulty(item.value)}
                    className={cn(
                      'min-h-11 items-center justify-center rounded-xl border px-3.5',
                      selected ? 'border-primary bg-primary/10' : 'border-input bg-card'
                    )}>
                    <Text className={cn('text-sm font-medium', selected ? 'font-semibold text-primary' : 'text-foreground')}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Thời gian nấu</Text>
            <View className="flex-row flex-wrap gap-2">
              {COOK_TIMES.map((item) => {
                const selected = maxCookTime === item.value;
                return (
                  <Pressable
                    key={item.label}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setMaxCookTime(item.value)}
                    className={cn(
                      'min-h-11 items-center justify-center rounded-xl border px-3.5',
                      selected ? 'border-primary bg-primary/10' : 'border-input bg-card'
                    )}>
                    <Text className={cn('text-sm font-medium', selected ? 'font-semibold text-primary' : 'text-foreground')}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Nguyên liệu có sẵn</Text>
            <IngredientFilterEditor items={ingredients} onChange={setIngredients} />
          </View>

          <View className="mt-2 flex-row gap-2">
            <PrimaryButton
              label="Đặt lại"
              variant="outline"
              disabled={advancedFilterCount === 0}
              onPress={resetSheetFilters}
              className="flex-1"
            />
            <PrimaryButton
              label={`Xem kết quả (${totalItems})`}
              onPress={() => setFiltersOpen(false)}
              className="flex-[1.5]"
            />
          </View>
        </FormSheet>
      ) : null}
    </SiteScreen>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  const colors = useIconColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Bỏ lọc ${label}`}
      onPress={onRemove}
      className="min-h-9 flex-row items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 pl-3 pr-2 active:opacity-80">
      <Text numberOfLines={1} className="max-w-[200px] text-xs font-medium text-primary">
        {label}
      </Text>
      <X size={13} color={colors.primary} />
    </Pressable>
  );
}
