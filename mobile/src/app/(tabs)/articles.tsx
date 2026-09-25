import * as React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Link, type Href, useLocalSearchParams } from 'expo-router';
import { BadgeCheck, BookOpen, Plus, Search } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { PostCard } from '@/features/post/components/post-card';
import { useArticlesQuery } from '@/features/post/queries/post.queries';
import { CategoryType } from '@/common/enums';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { CategoryFilterPills } from '@/features/category/components/category-filter-pills';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';

type DietSchool = 'ALL' | 'PHAT_GIAO' | 'DAO_GIAO' | 'THUAN_CHAY';

const DIET_SCHOOL_FILTERS: { value: DietSchool; label: string }[] = [
  { value: 'ALL', label: 'Tất cả trường phái' },
  { value: 'PHAT_GIAO', label: 'Chay Phật giáo' },
  { value: 'DAO_GIAO', label: 'Chay Đạo giáo / Cao Đài' },
  { value: 'THUAN_CHAY', label: 'Thuần chay (Vegan)' },
];

/**
 * "Cẩm nang" — đồng bộ bố cục/nội dung `frontend/src/app/(site)/articles/page.tsx`
 * (hero banner, tìm kiếm, pill trường phái/chủ đề, grid bài viết, callout kiểm chứng).
 * Bộ lọc trường phái ăn chay hiện chỉ là placeholder UI giống bản gốc (backend chưa
 * có field `dietSchool` trên Article — xem `frontend/.../post.model.ts` phần Legacy).
 */
export default function ArticlesScreen() {
  const colors = useIconColors();
  const params = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = React.useState('');
  const [categoryId, setCategoryId] = React.useState<string | null>(params.category ?? null);
  const [dietSchool, setDietSchool] = React.useState<DietSchool>('ALL');

  const {
    data: categoryTree = [],
    isLoading: isCategoryLoading,
    isError: isCategoryError,
    refetch: refetchCategories,
  } = useCategoryTreeQuery(CategoryType.CONTENT_TOPIC);

  const {
    data: articlesPagination,
    isLoading: isArticlesLoading,
    isError: isArticlesError,
    refetch: refetchArticles,
  } = useArticlesQuery({
    q: query.trim() || undefined,
    category: categoryId || undefined,
  });

  const articles = articlesPagination?.items ?? [];
  const hasFilters = Boolean(categoryId || query || dietSchool !== 'ALL');

  const resetFilters = () => {
    setQuery('');
    setCategoryId(null);
    setDietSchool('ALL');
  };

  return (
    <SiteScreen>
      <View className="gap-6 px-5 pt-4">
        {/* Hero banner */}
        <View className="rounded-3xl border border-primary/20 bg-primary/10 p-5">
          <View className="flex-row items-center gap-1.5 self-start rounded-full bg-primary/20 px-2.5 py-1">
            <BookOpen size={13} color={colors.primary} />
            <Text className="text-xs font-semibold text-primary">Cẩm Nang Thực Dưỡng Chay</Text>
          </View>
          <Text className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">
            Kiến Thức & Kinh Nghiệm Ăn Chay Khoa Học
          </Text>
          <Text className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Tổng hợp các bài chia sẻ dinh dưỡng đã được Chuyên gia kiểm chứng, mẹo nấu nước dùng
            thanh ngọt và nét đẹp văn hoá ăn chay tại Việt Nam.
          </Text>
          <View className="mt-4 gap-2.5">
            <Link href={'/articles/new' as Href} asChild>
              <PrimaryButton
                label="Viết bài chia sẻ mới"
                icon={<Plus size={16} color={colors.primaryForeground} />}
              />
            </Link>
            <Link href={'/my-content' as Href} asChild>
              <PrimaryButton label="Bài viết của tôi" variant="outline" />
            </Link>
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center gap-2 rounded-2xl border border-input bg-card px-3.5">
            <Search size={16} color={colors.mutedForeground} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Tìm bài viết, vitamin B12, mẹo hầm nấm..."
              placeholderTextColor={colors.mutedForeground}
              className="h-11 flex-1 text-sm text-foreground"
            />
          </View>
          <Link href={'/categories' as Href} asChild>
            <Pressable className="h-11 items-center justify-center rounded-2xl bg-muted px-3.5">
              <Text className="text-xs font-semibold text-foreground">Danh mục</Text>
            </Pressable>
          </Link>
        </View>

        {/* Trường phái */}
        <View className="flex-row flex-wrap gap-2">
          {DIET_SCHOOL_FILTERS.map((s) => {
            const selected = dietSchool === s.value;
            return (
              <Pressable
                key={s.value}
                onPress={() => setDietSchool(s.value)}
                className={cn('rounded-full px-3 py-1.5', selected ? 'bg-primary' : 'bg-muted')}>
                <Text
                  className={cn(
                    'text-xs font-medium',
                    selected ? 'text-primary-foreground' : 'text-muted-foreground'
                  )}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Chủ đề (danh mục thật) */}
        <View className="border-t border-border pt-4">
          <Text className="mb-2 text-xs text-muted-foreground">Chủ đề</Text>
          {isCategoryLoading ? (
            <View className="h-8 rounded-lg bg-muted" />
          ) : isCategoryError ? (
            <Pressable onPress={() => void refetchCategories()}>
              <Text className="text-sm text-primary underline">Không tải được danh mục. Thử lại.</Text>
            </Pressable>
          ) : categoryTree.length === 0 ? (
            <Text className="text-sm text-muted-foreground">Chưa có chủ đề nội dung.</Text>
          ) : (
            <CategoryFilterPills items={categoryTree} selectedId={categoryId} onSelect={setCategoryId} />
          )}
        </View>

        {/* Danh sách bài viết — 4 trạng thái */}
        <View className="gap-4">
          {isArticlesLoading ? (
            [1, 2, 3].map((i) => <View key={i} className="h-64 rounded-2xl border border-border bg-muted" />)
          ) : isArticlesError ? (
            <View className="items-center rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
              <Text className="font-semibold text-destructive">Không thể tải danh sách bài viết.</Text>
              <Text className="mt-1 text-center text-sm text-muted-foreground">
                Đã có lỗi xảy ra trong quá trình nạp bài viết từ máy chủ.
              </Text>
              <View className="mt-4">
                <PrimaryButton label="Thử lại" variant="outline" onPress={() => void refetchArticles()} />
              </View>
            </View>
          ) : articles.length === 0 ? (
            <View className="items-center rounded-2xl border border-dashed border-border p-8">
              <Text className="text-lg font-bold text-foreground">Không tìm thấy bài viết phù hợp</Text>
              <Text className="mt-1 text-center text-sm text-muted-foreground">
                Hãy thử tìm bằng từ khoá khác hoặc xoá bộ lọc chủ đề để xem nhiều nội dung hơn.
              </Text>
              {hasFilters ? (
                <View className="mt-4">
                  <PrimaryButton label="Đặt lại tất cả bộ lọc" variant="outline" onPress={resetFilters} />
                </View>
              ) : null}
            </View>
          ) : (
            articles.map((post) => (
              <Link key={post.id} href={`/articles/${post.id}` as Href} asChild>
                <Pressable>
                  <PostCard post={post} />
                </Pressable>
              </Link>
            ))
          )}
        </View>

        {/* Expert verification callout */}
        <View className="rounded-3xl border border-primary/20 bg-primary/5 p-5">
          <View className="flex-row items-center gap-3.5">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary">
              <BadgeCheck size={20} color={colors.primaryForeground} />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-foreground">Quy trình Kiểm chứng Dinh dưỡng</Text>
              <Text className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Mọi bài viết về vi chất, phòng chống thiếu máu và thực dưỡng đều được thẩm định bởi
                chuyên gia dinh dưỡng trước khi gắn nhãn Đã kiểm chứng.
              </Text>
            </View>
          </View>
          <View className="mt-4">
            <Link href="/contributor-status" asChild>
              <PrimaryButton label="Tham gia đóng góp bài viết" variant="outline" />
            </Link>
          </View>
        </View>
      </View>
    </SiteScreen>
  );
}
