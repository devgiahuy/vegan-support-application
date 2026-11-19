import * as React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Link, type Href, useLocalSearchParams } from 'expo-router';
import { BadgeCheck, FileText, Plus, Search, X } from 'lucide-react-native';

import { ExploreContentTabs } from '@/components/layout/explore-content-tabs';
import { SiteScreen } from '@/components/layout/site-screen';
import { EmptyState, ErrorState } from '@/components/shared/state-views';
import { LoadMoreButton } from '@/components/shared/load-more-button';
import { DropdownField } from '@/components/ui/dropdown-field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { PostCard } from '@/features/post/components/post-card';
import { useInfiniteArticlesQuery } from '@/features/post/queries/post.queries';
import { CategoryType } from '@/common/enums';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { buildCategoryOptions } from '@/features/category/utils/category-options';
import { useIconColors } from '@/lib/theme-colors';

type SortOrder = 'newest' | 'oldest';

const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
];

/**
 * "Cẩm nang thực dưỡng chay" — tối ưu cho điện thoại:
 * Thanh chuyển chuyên mục -> Tiêu đề + Viết bài / Bài của tôi -> Tìm kiếm & lọc -> Danh sách bài.
 */
export default function ArticlesScreen() {
  const colors = useIconColors();
  const params = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = React.useState('');
  const [categoryId, setCategoryId] = React.useState<string | null>(params.category ?? null);
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('newest');

  const {
    data: categoryTree = [],
    isLoading: isCategoryLoading,
    isError: isCategoryError,
    refetch: refetchCategories,
  } = useCategoryTreeQuery(CategoryType.CONTENT_TOPIC);

  const {
    data: articlePages,
    isLoading: isArticlesLoading,
    isError: isArticlesError,
    refetch: refetchArticles,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteArticlesQuery({
    q: query.trim() || undefined,
    category: categoryId || undefined,
  });

  const articles = React.useMemo(() => {
    const list = [...(articlePages?.pages.flatMap((page) => page.items) ?? [])];
    const time = (date: Date | null) => (date ? date.getTime() : 0);
    list.sort((a, b) =>
      sortOrder === 'newest' ? time(b.publishedAt) - time(a.publishedAt) : time(a.publishedAt) - time(b.publishedAt)
    );
    return list;
  }, [articlePages, sortOrder]);
  const totalItems = articlePages?.pages[0]?.metadata?.totalItems ?? articles.length;
  const hasFilters = Boolean(categoryId || query.trim());
  const categoryOptions = React.useMemo(() => buildCategoryOptions(categoryTree, 'Tất cả chủ đề'), [categoryTree]);

  const resetFilters = () => {
    setQuery('');
    setCategoryId(null);
  };

  const headerAction = (
    <Link href={'/articles/new' as Href} asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Viết bài mới"
        className="h-10 flex-row items-center gap-1 rounded-full bg-primary px-3.5 active:opacity-90">
        <Plus size={15} color={colors.primaryForeground} />
        <Text numberOfLines={1} style={{ flexShrink: 0 }} className="text-xs font-semibold text-primary-foreground">
          Viết bài
        </Text>
      </Pressable>
    </Link>
  );

  return (
    <SiteScreen onRefresh={() => refetchArticles()} headerRight={headerAction}>
      <View className="gap-3 px-5 pt-3.5">
        {/* Tìm kiếm có nút xóa nhanh ở đầu */}
        <View className="h-12 flex-row items-center gap-2 rounded-2xl border border-input bg-card pl-3.5 pr-1.5">
          <Search size={18} color={colors.primary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm bài viết, vitamin B12, mẹo hầm nấm..."
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

        <ExploreContentTabs />

        {/* Bộ lọc chủ đề & sắp xếp */}
        <View className="flex-row gap-2">
          <DropdownField
            className="flex-[1.3]"
            label="Chủ đề"
            value={categoryId}
            options={categoryOptions}
            onChange={setCategoryId}
            status={isCategoryLoading ? 'loading' : isCategoryError ? 'error' : undefined}
            onRetry={() => void refetchCategories()}
          />
          <DropdownField
            className="flex-1"
            label="Sắp xếp"
            value={sortOrder}
            options={SORT_OPTIONS}
            onChange={setSortOrder}
          />
        </View>

        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-xs font-semibold text-muted-foreground">{totalItems} bài viết</Text>
          <View className="flex-row items-center gap-3">
            {hasFilters ? (
              <Pressable
                accessibilityRole="button"
                onPress={resetFilters}
                hitSlop={6}
                className="min-h-8 flex-row items-center gap-1 px-1">
                <X size={13} color={colors.primary} />
                <Text className="text-xs font-semibold text-primary">Xóa lọc</Text>
              </Pressable>
            ) : null}
            <Link href={'/my-content' as Href} asChild>
              <Pressable
                accessibilityRole="link"
                hitSlop={6}
                className="min-h-8 flex-row items-center gap-1 px-1">
                <FileText size={13} color={colors.foreground} />
                <Text className="text-xs font-semibold text-foreground">Bài của tôi</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        {/* Danh sách bài viết */}
        <View className="gap-4">
          {isArticlesLoading ? (
            [1, 2, 3].map((i) => <View key={i} className="h-64 rounded-2xl border border-border bg-muted" />)
          ) : isArticlesError ? (
            <ErrorState
              title="Không thể tải danh sách bài viết."
              description="Đã có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại."
              onRetry={() => void refetchArticles()}
            />
          ) : articles.length === 0 ? (
            <EmptyState
              title="Không tìm thấy bài viết phù hợp"
              description="Hãy thử tìm bằng từ khóa khác hoặc xóa bộ lọc chủ đề."
              action={
                hasFilters ? (
                  <PrimaryButton label="Đặt lại tất cả bộ lọc" variant="outline" onPress={resetFilters} />
                ) : undefined
              }
            />
          ) : (
            <>
              {articles.map((post) => (
                <Link key={post.id} href={`/articles/${post.id}` as Href} asChild>
                  <Pressable className="active:opacity-90">
                    <PostCard post={post} />
                  </Pressable>
                </Link>
              ))}
              <LoadMoreButton
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onPress={() => void fetchNextPage()}
              />
            </>
          )}
        </View>

        {/* Lối tắt đóng góp */}
        <View className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <BadgeCheck size={18} color={colors.primaryForeground} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-foreground">Tham gia đóng góp bài viết</Text>
              <Text className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Bài viết về vi chất và thực dưỡng được rà soát trước khi gắn nhãn thẩm định.
              </Text>
            </View>
          </View>
          <View className="mt-3">
            <Link href={'/contributor-status' as Href} asChild>
              <PrimaryButton label="Tìm hiểu chương trình đóng góp" variant="outline" />
            </Link>
          </View>
        </View>
      </View>
    </SiteScreen>
  );
}
