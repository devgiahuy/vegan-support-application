import * as React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PlayCircle, Plus, Search, Video } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { CategoryType } from '@/common/enums';
import { CategoryFilterPills } from '@/features/category/components/category-filter-pills';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { VideoCard } from '@/features/video/components/video-card';
import { useVideosQuery } from '@/features/video/queries/video.queries';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';

export default function VideosScreen() {
  const colors = useIconColors();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [query, setQuery] = React.useState('');
  const [categoryId, setCategoryId] = React.useState<string | null>(null);

  const {
    data: categoryTree = [],
    isLoading: isCategoryLoading,
    isError: isCategoryError,
    refetch: refetchCategories,
  } = useCategoryTreeQuery(CategoryType.CONTENT_TOPIC);

  const {
    data: videosPagination,
    isLoading: isVideosLoading,
    isError: isVideosError,
    refetch: refetchVideos,
  } = useVideosQuery({
    q: query.trim() || undefined,
    category: categoryId || undefined,
  });

  const videos = videosPagination?.items ?? [];
  const totalItems = videosPagination?.metadata.totalItems ?? videos.length;
  const hasFilters = Boolean(query.trim() || categoryId);

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

  return (
    <SiteScreen>
      <View className="gap-6 px-5 pt-4">
        <View className="rounded-3xl border border-primary/20 bg-primary/10 p-5">
          <View className="flex-row items-center gap-1.5 self-start rounded-full bg-primary/20 px-2.5 py-1">
            <PlayCircle size={13} color={colors.primary} />
            <Text className="text-xs font-semibold text-primary">Video nấu ăn chay</Text>
          </View>
          <Text className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">
            Học nấu món chay bằng video thực tế
          </Text>
          <Text className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Xem các video hướng dẫn nấu ăn chay công khai từ cộng đồng VeggieConnect, kèm tóm tắt công thức khi có sẵn.
          </Text>
          <View className="mt-3 flex-row items-center gap-2 self-start rounded-full bg-background/70 px-3 py-1.5">
            <Video size={14} color={colors.primary} />
            <Text className="text-xs font-semibold text-foreground">{totalItems} video hướng dẫn đang có sẵn</Text>
          </View>
          <View className="mt-4 gap-2.5">
            <PrimaryButton
              label="Đăng video mới"
              icon={<Plus size={16} color={colors.primaryForeground} />}
              onPress={goToCreateVideo}
            />
          </View>
        </View>

        <View className="flex-row items-center gap-2 rounded-2xl border border-input bg-card px-3.5">
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm video, món ăn, nguyên liệu..."
            placeholderTextColor={colors.mutedForeground}
            className="h-11 flex-1 text-sm text-foreground"
          />
        </View>

        <View className="border-t border-border pt-4">
          <Text className="mb-2 text-xs text-muted-foreground">Chủ đề</Text>
          {isCategoryLoading ? (
            <View className="h-8 rounded-lg bg-muted" />
          ) : isCategoryError ? (
            <Pressable onPress={() => void refetchCategories()}>
              <Text className="text-sm text-primary underline">Không tải được danh mục. Thử lại.</Text>
            </Pressable>
          ) : categoryTree.length === 0 ? (
            <Text className="text-sm text-muted-foreground">Chưa có chủ đề video.</Text>
          ) : (
            <CategoryFilterPills items={categoryTree} selectedId={categoryId} onSelect={setCategoryId} />
          )}
        </View>

        <View className="gap-4">
          {isVideosLoading ? (
            [1, 2, 3].map((i) => <View key={i} className="h-72 rounded-2xl border border-border bg-muted" />)
          ) : isVideosError ? (
            <View className="items-center rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
              <Text className="font-semibold text-destructive">Không thể tải danh sách video.</Text>
              <Text className="mt-1 text-center text-sm text-muted-foreground">
                Đã có lỗi xảy ra khi kết nối tới máy chủ. Vui lòng thử lại.
              </Text>
              <View className="mt-4">
                <PrimaryButton label="Thử lại" variant="outline" onPress={() => void refetchVideos()} />
              </View>
            </View>
          ) : videos.length === 0 ? (
            <View className="items-center rounded-2xl border border-dashed border-border p-8">
              <Text className="text-lg font-bold text-foreground">Không tìm thấy video phù hợp</Text>
              <Text className="mt-1 text-center text-sm text-muted-foreground">
                Hãy thử từ khóa khác hoặc xóa bộ lọc chủ đề để xem nhiều video hơn.
              </Text>
              {hasFilters ? (
                <View className="mt-4">
                  <PrimaryButton label="Đặt lại bộ lọc" variant="outline" onPress={resetFilters} />
                </View>
              ) : null}
            </View>
          ) : (
            videos.map((video) => <VideoCard key={video.id} video={video} />)
          )}
        </View>
      </View>
    </SiteScreen>
  );
}
