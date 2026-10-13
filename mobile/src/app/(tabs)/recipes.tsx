import * as React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Link, type Href, useLocalSearchParams } from 'expo-router';
import { PlusCircle, Search, ShieldCheck, Sparkles } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { RecipeCard } from '@/features/recipe/components/recipe-card';
import { LoadMoreButton } from '@/components/shared/load-more-button';
import { useInfiniteRecipesQuery } from '@/features/recipe/queries/recipe.queries';
import { CategoryType } from '@/common/enums';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { DropdownField } from '@/components/ui/dropdown-field';
import { buildCategoryOptions } from '@/features/category/utils/category-options';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useIconColors } from '@/lib/theme-colors';

const DIFFICULTIES = [
  { label: 'Tất cả độ khó', value: '' },
  { label: 'Dễ', value: 'EASY' },
  { label: 'Trung bình', value: 'MEDIUM' },
  { label: 'Nâng cao', value: 'HARD' },
];

/** Backend chỉ có cận trên `maxCookTimeMinutes`, nên không có mức "Trên 1 giờ" như web. */
const COOK_TIMES: { label: string; value: number | null }[] = [
  { label: 'Tất cả thời gian', value: null },
  { label: 'Dưới 15 phút', value: 15 },
  { label: 'Dưới 30 phút', value: 30 },
  { label: 'Dưới 60 phút', value: 60 },
];

function getDietPatternLabel(pattern: string | null | undefined): string {
  switch (pattern) {
    case 'VEGAN':
      return 'Thuần chay';
    case 'LACTO_OVO':
      return 'Chay có trứng & sữa';
    case 'LACTO':
      return 'Chay có sữa';
    case 'OVO':
      return 'Chay có trứng';
    case 'PESCATARIAN':
      return 'Ăn chay kèm cá';
    case 'FLEXITARIAN':
      return 'Bán chay (linh hoạt)';
    default:
      return pattern ?? '';
  }
}

/**
 * "Khám phá món" — đồng bộ bố cục/nội dung `frontend/src/app/(site)/recipes/page.tsx`.
 * Sidebar bộ lọc của web (danh mục checkbox 2 tầng + độ khó + thời gian) được chuyển
 * thành pill ngang xếp theo chiều dọc cho phù hợp màn hình hẹp; danh mục dùng chọn đơn
 * vì trên web chỉ `checkedIds[0]` thực sự được gửi lên API dù UI cho chọn nhiều.
 */
export default function RecipesScreen() {
  const colors = useIconColors();
  const params = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = React.useState('');
  const debouncedQuery = useDebouncedValue(query, 400);
  const [difficulty, setDifficulty] = React.useState('');
  const [maxCookTime, setMaxCookTime] = React.useState<number | null>(null);
  const [categoryId, setCategoryId] = React.useState<string | null>(params.category ?? null);

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
  });

  const recipesPagination = recipePages?.pages[0];
  const recipes = recipePages?.pages.flatMap((page) => page.items) ?? [];
  const totalItems = recipesPagination?.metadata?.totalItems ?? recipes.length;
  const categoryOptions = React.useMemo(() => buildCategoryOptions(categoryTree), [categoryTree]);
  const hasFilters = Boolean(categoryId || difficulty || maxCookTime !== null || query);
  const constraints = recipesPagination?.metadata?.appliedConstraints;

  const resetFilters = () => {
    setCategoryId(null);
    setDifficulty('');
    setMaxCookTime(null);
    setQuery('');
  };

  return (
    <SiteScreen>
      <View className="px-5 pt-4">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="flex-1 text-xl font-bold text-foreground">
            Khám phá công thức <Text className="text-sm font-normal text-muted-foreground">({totalItems})</Text>
          </Text>
          <Link href={'/recipes/new' as Href} asChild>
            <Pressable
              accessibilityRole="button"
              className="h-9 flex-row items-center gap-1.5 rounded-xl bg-primary px-3">
              <PlusCircle size={15} color={colors.primaryForeground} />
              <Text numberOfLines={1} style={{ flexShrink: 0 }} className="text-xs font-semibold text-primary-foreground">
                Đăng công thức mới
              </Text>
            </Pressable>
          </Link>
        </View>

        {/* Search */}
        <View className="mt-4 flex-row items-center gap-2 rounded-2xl border border-input bg-background px-3.5">
          <Search size={16} color={colors.primary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm theo món ăn, nguyên liệu..."
            placeholderTextColor={colors.mutedForeground}
            className="h-12 flex-1 text-sm text-foreground"
          />
        </View>

        {/* Ba bộ lọc dạng dropdown đặt kề nhau: danh mục · độ khó · thời gian chế biến */}
        <View className="mt-3 flex-row gap-2">
          <DropdownField
            className="flex-[1.3]"
            label="Danh mục món"
            value={categoryId}
            options={categoryOptions}
            onChange={setCategoryId}
            status={isCategoryLoading ? 'loading' : isCategoryError ? 'error' : undefined}
            onRetry={() => void refetchCategories()}
          />
          <DropdownField
            className="flex-1"
            label="Độ khó"
            value={difficulty}
            options={DIFFICULTIES.map((item) => ({
              value: item.value,
              label: item.label,
              shortLabel: item.value === '' ? 'Tất cả' : item.label,
            }))}
            onChange={setDifficulty}
          />
          <DropdownField
            className="flex-1"
            label="Thời gian"
            value={maxCookTime}
            options={COOK_TIMES.map((item) => ({
              value: item.value,
              label: item.label,
              shortLabel: item.value === null ? 'Tất cả' : item.label.replace('Dưới ', '< '),
            }))}
            onChange={setMaxCookTime}
          />
        </View>
        {hasFilters ? (
          <Pressable onPress={resetFilters} className="mt-2 self-start">
            <Text className="text-xs text-muted-foreground underline">Xoá tất cả bộ lọc</Text>
          </Pressable>
        ) : null}

        {/* Bộ lọc an toàn cá nhân hoá theo hồ sơ (backend áp dụng, mobile chỉ hiển thị) */}
        {constraints?.authenticated ? (
          <View className="mt-5 rounded-2xl border border-primary/25 bg-primary/5 p-4">
            <View className="flex-row items-center gap-2">
              <ShieldCheck size={16} color={colors.primary} />
              <Text className="flex-1 text-sm font-semibold text-foreground">Bộ lọc an toàn theo hồ sơ của bạn</Text>
              <Link href={'/profile' as Href} asChild>
                <Pressable hitSlop={8}>
                  <Text className="text-xs font-semibold text-primary underline">Quản lý hồ sơ</Text>
                </Pressable>
              </Link>
            </View>
            <View className="mt-2 flex-row flex-wrap gap-1.5">
              {constraints.dietPattern ? (
                <View className="rounded-full bg-primary/10 px-2.5 py-1">
                  <Text className="text-xs font-medium text-primary">
                    {getDietPatternLabel(constraints.dietPattern)}
                  </Text>
                </View>
              ) : null}
              {constraints.allergyCount > 0 ? (
                <View className="rounded-full bg-muted px-2.5 py-1">
                  <Text className="text-xs text-foreground">Tránh {constraints.allergyCount} chất dị ứng</Text>
                </View>
              ) : null}
              {constraints.ingredientExclusionCount > 0 ? (
                <View className="rounded-full bg-muted px-2.5 py-1">
                  <Text className="text-xs text-foreground">Kiêng {constraints.ingredientExclusionCount} nguyên liệu</Text>
                </View>
              ) : null}
            </View>
            <Text className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Hệ thống chỉ hiển thị món có nguyên liệu chuẩn hóa và phù hợp với hồ sơ ăn kiêng của bạn.
            </Text>
          </View>
        ) : null}

        {/* Danh sách công thức — 4 trạng thái */}
        <View className="mt-6">
          {isRecipesLoading ? (
            <View className="flex-row flex-wrap gap-3">
              {[1, 2, 3, 4].map((i) => (
                <View key={i} className="h-52 w-[47%] rounded-2xl border border-border bg-muted" />
              ))}
            </View>
          ) : isRecipesError ? (
            <View className="items-center rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
              <Text className="font-semibold text-destructive">Không thể tải danh sách công thức.</Text>
              <Text className="mt-1 text-center text-sm text-muted-foreground">
                Đã có lỗi xảy ra khi kết nối tới máy chủ. Vui lòng thử lại.
              </Text>
              <View className="mt-4">
                <PrimaryButton label="Thử lại" variant="outline" onPress={() => void refetchRecipes()} />
              </View>
            </View>
          ) : recipes.length === 0 ? (
            <View className="items-center rounded-2xl border border-dashed border-border p-8">
              <Text className="text-center font-semibold text-foreground">Chưa có công thức nào</Text>
              <Text className="mt-1 text-center text-sm text-muted-foreground">
                {query.trim()
                  ? `Không tìm thấy công thức phù hợp với từ khóa "${query.trim()}".`
                  : 'Kho công thức hiện chưa có bài viết phù hợp với bộ lọc hiện tại.'}
              </Text>
              {hasFilters ? (
                <View className="mt-4">
                  <PrimaryButton label="Xoá tất cả bộ lọc" variant="outline" onPress={resetFilters} />
                </View>
              ) : null}
            </View>
          ) : (
            <>
              <View className="flex-row flex-wrap gap-3">
                {recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} className="w-[47%]" />
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

        {/* AI card */}
        <View className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <View className="flex-row items-center gap-1.5 self-start rounded-full bg-cta/15 px-2.5 py-1">
            <Sparkles size={13} color={colors.cta} />
            <Text className="text-xs font-semibold text-cta">Trợ lý AI Dinh dưỡng</Text>
          </View>
          <Text className="mt-3 text-lg font-bold text-foreground">
            Không tìm thấy công thức với nguyên liệu bạn đang có?
          </Text>
          <Text className="mt-2 text-sm text-muted-foreground">
            Hỏi AI ChayXanh để nhận công thức nấu theo nguyên liệu tủ lạnh của riêng bạn!
          </Text>
          <View className="mt-4">
            <Link href={'/assistant' as Href} asChild>
              <PrimaryButton
                label="Hỏi AI thay thế nguyên liệu"
                icon={<Sparkles size={16} color={colors.primaryForeground} />}
              />
            </Link>
          </View>
        </View>

      </View>
    </SiteScreen>
  );
}
