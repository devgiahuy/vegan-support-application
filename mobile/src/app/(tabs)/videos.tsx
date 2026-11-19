import * as React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, Search, X } from 'lucide-react-native';

import { ExploreContentTabs } from '@/components/layout/explore-content-tabs';
import { SiteScreen } from '@/components/layout/site-screen';
import { EmptyState, ErrorState } from '@/components/shared/state-views';
import { LoadMoreButton } from '@/components/shared/load-more-button';
import { CategoryType } from '@/common/enums';
import { DropdownField } from '@/components/ui/dropdown-field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { buildCategoryOptions } from '@/features/category/utils/category-options';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { VideoCard } from '@/features/video/components/video-card';
import { useInfiniteVideosQuery } from '@/features/video/queries/video.queries';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';

export default function VideosScreen() {
  const colors = useIconColors();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [query, setQuery] = React.useState('');
  const [categoryId, setCategoryId] = React.useState<string | null>(params.category ?? null);

  const {
    data: categoryTree = [],
    isLoading: isCategoryLoading,
    isError: isCategoryError,
    refetch: refetchCategories,
  } = useCategoryTreeQuery(CategoryType.CONTENT_TOPIC);

  const {
    data: videoPages,
    isLoading: isVideosLoading,
    isError: isVideosError,
    refetch: refetchVideos,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteVideosQuery({
    q: query.trim() || undefined,
    category: categoryId || undefined,
  });

  const videos = videoPages?.pages.flatMap((page) => page.items) ?? [];
  const totalItems = videoPages?.pages[0]?.metadata.totalItems ?? videos.length;
  const hasFilters = Boolean(query.trim() || categoryId);
  const categoryOptions = React.useMemo(() => buildCategoryOptions(categoryTree, 'Tất cả chủ đề'), [categoryTree]);

  const resetFilters = () => {
    setQuery('');
    setCategoryId(null);
  };

  const goToCreateVideo = () => {
    if (!isAuthenticated) {
      Alert.alert('Cần đăng nhập', 'Bạn cần đăng nhập để đăng video nấu ăn mới.');
      router.push('/(auth)/login');
      return;
    }
    router.push('/videos/new');
  };

  const headerAction = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Đăng video mới"
      onPress={goToCreateVideo}
      className="h-10 flex-row items-center gap-1 rounded-full bg-primary px-3.5 active:opacity-90">
      <Plus size={15} color={colors.primaryForeground} />
      <Text numberOfLines={1} style={{ flexShrink: 0 }} className="text-xs font-semibold text-primary-foreground">
        Đăng video
      </Text>
    </Pressable>
  );

  return (
    <SiteScreen onRefresh={() => refetchVideos()} headerRight={headerAction}>
      <View className="gap-3 px-5 pt-3.5">
        {/* Tìm kiếm có nút xóa nhanh ở đầu */}
        <View className="h-12 flex-row items-center gap-2 rounded-2xl border border-input bg-card pl-3.5 pr-1.5">
          <Search size={18} color={colors.primary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm video, món ăn, nguyên liệu..."
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

        <DropdownField
          label="Chủ đề"
          value={categoryId}
          options={categoryOptions}
          onChange={setCategoryId}
          status={isCategoryLoading ? 'loading' : isCategoryError ? 'error' : undefined}
          onRetry={() => void refetchCategories()}
        />

        <View className="flex-row items-center justify-between gap-2">
          <Text className="text-xs font-semibold text-muted-foreground">{totalItems} video</Text>
          {hasFilters ? (
            <Pressable
              accessibilityRole="button"
              onPress={resetFilters}
              hitSlop={6}
              className="min-h-8 flex-row items-center gap-1 px-1">
              <X size={13} color={colors.primary} />
              <Text className="text-xs font-semibold text-primary">Xóa bộ lọc</Text>
            </Pressable>
          ) : null}
        </View>

        <View className="gap-4">
          {isVideosLoading ? (
            [1, 2, 3].map((i) => <View key={i} className="h-72 rounded-2xl border border-border bg-muted" />)
          ) : isVideosError ? (
            <ErrorState
              title="Không thể tải danh sách video."
              description="Đã có lỗi xảy ra khi kết nối tới máy chủ. Vui lòng thử lại."
              onRetry={() => void refetchVideos()}
            />
          ) : videos.length === 0 ? (
            <EmptyState
              title="Không tìm thấy video phù hợp"
              description="Hãy thử từ khóa khác hoặc xóa bộ lọc chủ đề để xem nhiều video hơn."
              action={
                hasFilters ? (
                  <PrimaryButton label="Đặt lại bộ lọc" variant="outline" onPress={resetFilters} />
                ) : undefined
              }
            />
          ) : (
            <>
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
              <LoadMoreButton
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                onPress={() => void fetchNextPage()}
              />
            </>
          )}
        </View>
      </View>
    </SiteScreen>
  );
}
