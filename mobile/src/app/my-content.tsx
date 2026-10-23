import * as React from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href, useRouter } from 'expo-router';
import {
  Eye,
  FileText,
  History,
  Pencil,
  Plus,
  Search,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { LoadMoreButton } from '@/components/shared/load-more-button';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useInfiniteRecipesQuery } from '@/features/recipe/queries/recipe.queries';
import { useDeletePostMutation, useInfiniteArticlesQuery } from '@/features/post/queries/post.queries';
import { useInfiniteVideosQuery } from '@/features/video/queries/video.queries';
import { PostStatus } from '@/common/enums';
import { getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { ReviewHistorySheet } from '@/features/review/components/review-history-sheet';
import { BookmarksList } from '@/features/community/components/bookmarks-list';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

type ContentType = 'RECIPE' | 'BLOG' | 'VIDEO';

interface MyContentItem {
  id: string;
  type: ContentType;
  title: string;
  excerpt: string;
  categoryName: string;
  coverImageUrl: string;
  status: PostStatus;
  statusLabel: string;
  version: number;
  formattedPublishedAt: string;
}

const STATUS_FILTERS: { value: 'ALL' | PostStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: PostStatus.PUBLISHED, label: 'Đã duyệt' },
  { value: PostStatus.PENDING_REVIEW, label: 'Chờ duyệt' },
  { value: PostStatus.REJECTED, label: 'Bị từ chối' },
  { value: PostStatus.FLAGGED, label: 'Cần sửa' },
  { value: PostStatus.DRAFT, label: 'Bản nháp' },
];

const TYPE_LABEL: Record<ContentType, string> = {
  RECIPE: 'Công thức',
  BLOG: 'Cẩm nang',
  VIDEO: 'Video',
};

function detailHref(item: MyContentItem): Href {
  if (item.type === 'RECIPE') return `/recipes/${item.id}` as Href;
  if (item.type === 'VIDEO') return `/videos/${item.id}` as Href;
  return `/articles/${item.id}` as Href;
}

function editHref(item: MyContentItem): Href {
  if (item.type === 'RECIPE') return `/recipes/${item.id}/edit` as Href;
  if (item.type === 'VIDEO') return `/videos/${item.id}/edit` as Href;
  return `/articles/${item.id}/edit` as Href;
}

/** Màu nhãn trạng thái — cùng bảng màu với web, có biến thể tối để chữ luôn đọc được. */
function statusTone(status: PostStatus): { badge: string; text: string } {
  switch (status) {
    case PostStatus.PUBLISHED:
      return { badge: 'border-emerald-500/30 bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400' };
    case PostStatus.PENDING_REVIEW:
      return { badge: 'border-amber-500/30 bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400' };
    case PostStatus.REJECTED:
      return { badge: 'border-destructive/30 bg-destructive/15', text: 'text-destructive' };
    case PostStatus.FLAGGED:
      return { badge: 'border-orange-500/30 bg-orange-500/15', text: 'text-orange-600 dark:text-orange-400' };
    default:
      return { badge: 'border-transparent bg-muted', text: 'text-muted-foreground' };
  }
}

/** Thẻ một bài đăng — đồng bộ thẻ "Quản lý bài viết cá nhân" của web: ảnh bìa, nhãn trạng thái/loại, tiêu đề, trích đoạn, thao tác. */
function MyContentRow({
  item,
  colors,
  onDelete,
  onHistory,
  isDeleting,
}: {
  item: MyContentItem;
  colors: ReturnType<typeof useIconColors>;
  onDelete: (item: MyContentItem) => void;
  onHistory: (item: MyContentItem) => void;
  isDeleting: boolean;
}) {
  const tone = statusTone(item.status);
  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      <Link href={detailHref(item)} asChild>
        <Pressable>
          <View className="h-32 w-full bg-muted">
            {item.coverImageUrl ? (
              <Image source={{ uri: item.coverImageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <View className="flex-1 items-center justify-center">
                <UtensilsCrossed size={26} color={colors.mutedForeground} />
              </View>
            )}
          </View>
          <View className="gap-1.5 p-4 pb-2">
            <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
              <View className={cn('rounded-full border px-2.5 py-0.5', tone.badge)}>
                <Text className={cn('text-[11px] font-medium', tone.text)}>{item.statusLabel}</Text>
              </View>
              <View className="rounded-full border border-border px-2 py-0.5">
                <Text className="text-[10px] text-foreground">{TYPE_LABEL[item.type]}</Text>
              </View>
              {item.categoryName ? (
                <Text numberOfLines={1} className="text-xs text-muted-foreground">
                  • {item.categoryName}
                </Text>
              ) : null}
            </View>
            <Text className="text-xs text-muted-foreground">
              {item.formattedPublishedAt ? `Đăng ngày ${item.formattedPublishedAt}` : 'Chưa xuất bản'}
            </Text>
            <Text numberOfLines={2} className="text-base font-semibold leading-snug text-foreground">
              {item.title}
            </Text>
            {item.excerpt ? (
              <Text numberOfLines={1} className="text-xs text-muted-foreground">
                {item.excerpt}
              </Text>
            ) : null}
          </View>
        </Pressable>
      </Link>
      <View className="flex-row items-center justify-between px-3 pb-3 pt-1">
        <Pressable
          onPress={() => onHistory(item)}
          className="flex-row items-center gap-1.5 rounded-xl px-2.5 py-2 active:bg-muted">
          <History size={14} color={colors.mutedForeground} />
          <Text className="text-xs font-medium text-muted-foreground">Lịch sử duyệt</Text>
        </Pressable>
        <View className="flex-row gap-1">
          <Link href={detailHref(item)} asChild>
            <Pressable accessibilityLabel="Xem chi tiết" className="h-9 w-9 items-center justify-center rounded-xl active:bg-muted">
              <Eye size={16} color={colors.foreground} />
            </Pressable>
          </Link>
          <Link href={editHref(item)} asChild>
            <Pressable accessibilityLabel="Sửa" className="h-9 w-9 items-center justify-center rounded-xl active:bg-muted">
              <Pencil size={16} color={colors.foreground} />
            </Pressable>
          </Link>
          <Pressable
            accessibilityLabel="Xoá"
            onPress={() => onDelete(item)}
            disabled={isDeleting}
            className="h-9 w-9 items-center justify-center rounded-xl active:bg-destructive/10">
            <Trash2 size={16} color={colors.destructive} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/**
 * "Bài viết của tôi" — gộp Công thức/Cẩm nang/Video do người dùng hiện tại đăng, lọc
 * theo `author.id` từ chính danh sách công khai (`GET /recipes|articles|videos`) vì
 * backend chưa có API "bài đăng của tôi" riêng — đồng bộ cách làm của
 * `frontend/src/app/(site)/profile/page.tsx` (biến `myPosts`). Có thể sửa/xoá trực
 * tiếp vì mọi mục ở đây chắc chắn thuộc sở hữu người dùng.
 */
export default function MyContentScreen() {
  const colors = useIconColors();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | PostStatus>('ALL');
  const [historyItem, setHistoryItem] = React.useState<MyContentItem | null>(null);

  const {
    data: recipePages,
    isLoading: isRecipesLoading,
    isError: isRecipesError,
    refetch: refetchRecipes,
    hasNextPage: hasMoreRecipes,
    fetchNextPage: fetchMoreRecipes,
    isFetchingNextPage: isFetchingMoreRecipes,
  } = useInfiniteRecipesQuery({ limit: 50 });
  const {
    data: articlePages,
    isLoading: isArticlesLoading,
    isError: isArticlesError,
    refetch: refetchArticles,
    hasNextPage: hasMoreArticles,
    fetchNextPage: fetchMoreArticles,
    isFetchingNextPage: isFetchingMoreArticles,
  } = useInfiniteArticlesQuery({ limit: 50 });
  const {
    data: videoPages,
    isLoading: isVideosLoading,
    isError: isVideosError,
    refetch: refetchVideos,
    hasNextPage: hasMoreVideos,
    fetchNextPage: fetchMoreVideos,
    isFetchingNextPage: isFetchingMoreVideos,
  } = useInfiniteVideosQuery({ limit: 50 });

  // Backend chưa có API "bài đăng của tôi" nên phải duyệt các danh sách chung; "Tải thêm" nạp trang kế của cả 3 loại.
  const hasMore = Boolean(hasMoreRecipes || hasMoreArticles || hasMoreVideos);
  const isFetchingMore = isFetchingMoreRecipes || isFetchingMoreArticles || isFetchingMoreVideos;
  const fetchMore = () => {
    if (hasMoreRecipes) void fetchMoreRecipes();
    if (hasMoreArticles) void fetchMoreArticles();
    if (hasMoreVideos) void fetchMoreVideos();
  };

  const deleteMutation = useDeletePostMutation();

  const isLoading = isRecipesLoading || isArticlesLoading || isVideosLoading;
  const isError = isRecipesError || isArticlesError || isVideosError;
  const refetchAll = () => {
    void refetchRecipes();
    void refetchArticles();
    void refetchVideos();
  };

  const myItems = React.useMemo<MyContentItem[]>(() => {
    if (!currentUserId) return [];

    const fromRecipes: MyContentItem[] = (recipePages?.pages.flatMap((page) => page.items) ?? [])
      .filter((r) => r.author.id === currentUserId)
      .map((r) => ({
        id: r.id,
        type: 'RECIPE',
        title: r.title,
        excerpt: r.description,
        categoryName: r.category.name,
        coverImageUrl: r.coverImageUrl,
        status: r.status,
        statusLabel: r.statusLabel,
        version: r.version,
        formattedPublishedAt: r.formattedPublishedAt,
      }));

    const fromArticles: MyContentItem[] = (articlePages?.pages.flatMap((page) => page.items) ?? [])
      .filter((a) => a.author.id === currentUserId)
      .map((a) => ({
        id: a.id,
        type: 'BLOG',
        title: a.title,
        excerpt: a.excerpt,
        categoryName: a.category.name,
        coverImageUrl: a.coverImageUrl,
        status: a.status,
        statusLabel: a.statusLabel,
        version: a.version,
        formattedPublishedAt: a.formattedPublishedAt,
      }));

    const fromVideos: MyContentItem[] = (videoPages?.pages.flatMap((page) => page.items) ?? [])
      .filter((v) => v.author.id === currentUserId)
      .map((v) => ({
        id: v.id,
        type: 'VIDEO',
        title: v.title,
        excerpt: v.excerpt,
        categoryName: v.category.name,
        coverImageUrl: v.thumbnailUrl,
        status: v.status,
        statusLabel: v.statusLabel,
        version: v.version,
        formattedPublishedAt: v.formattedPublishedAt,
      }));

    return [...fromRecipes, ...fromArticles, ...fromVideos];
  }, [recipePages?.pages, articlePages?.pages, videoPages?.pages, currentUserId]);

  const filteredItems = React.useMemo(() => {
    let list = myItems;
    if (statusFilter !== 'ALL') {
      list = list.filter((item) => item.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (item) => item.title.toLowerCase().includes(q) || item.excerpt.toLowerCase().includes(q)
      );
    }
    return list;
  }, [myItems, statusFilter, search]);

  const confirmDelete = (item: MyContentItem) => {
    Alert.alert('Xoá bài đăng', `Bạn có chắc muốn xoá "${item.title}"? Hành động này không thể hoàn tác.`, [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync({ id: item.id, expectedVersion: item.version });
            Alert.alert('Đã xoá', 'Bài đăng đã được xoá.');
          } catch (error) {
            Alert.alert('Không xoá được', getApiErrorMessage(error));
          }
        },
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8">
          <View className="items-center rounded-3xl border border-border bg-card p-6">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <FileText size={28} color={colors.primary} />
            </View>
            <Text className="mt-4 text-center text-xl font-bold text-foreground">
              Đăng nhập để xem bài viết của bạn
            </Text>
            <Text className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
              Công thức, cẩm nang và video bạn đã đăng sẽ hiển thị ở đây.
            </Text>
            <View className="mt-5 w-full">
              <Link href={'/(auth)/login' as Href} asChild>
                <PrimaryButton label="Đăng nhập ngay" />
              </Link>
            </View>
          </View>
        </View>
      </SiteScreen>
    );
  }

  return (
    <SiteScreen onRefresh={async () => refetchAll()}>
      <View className="gap-4 px-5 pb-4 pt-4">
        <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          <View className="gap-1">
            <Text className="text-lg font-bold text-foreground">Quản lý bài viết cá nhân</Text>
            <Text className="text-xs leading-5 text-muted-foreground">
              Quản lý công thức, cẩm nang, video của bạn và theo dõi trạng thái kiểm duyệt.
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Link href={'/articles/new' as Href} asChild>
              <PrimaryButton
                label="Viết bài mới"
                className="h-11 flex-1"
                icon={<Plus size={16} color={colors.primaryForeground} />}
              />
            </Link>
            <Link href={'/recipes/new' as Href} asChild>
              <PrimaryButton
                label="Đăng công thức"
                variant="outline"
                className="h-11 flex-1"
                icon={<UtensilsCrossed size={16} color={colors.primary} />}
              />
            </Link>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="gap-1.5 px-5">
          {STATUS_FILTERS.map((f) => {
            const count =
              f.value === 'ALL' ? myItems.length : myItems.filter((item) => item.status === f.value).length;
            const active = statusFilter === f.value;
            return (
              <Pressable
                key={f.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setStatusFilter(f.value)}
                className={cn('rounded-full px-3 py-1.5', active ? 'bg-primary' : 'bg-secondary')}>
                <Text className={cn('text-xs font-medium', active ? 'text-primary-foreground' : 'text-secondary-foreground')}>
                  {f.label} ({count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="flex-row items-center gap-2 rounded-xl border border-input bg-background px-3">
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm bài viết của bạn..."
            placeholderTextColor={colors.mutedForeground}
            className="h-10 flex-1 text-sm text-foreground"
          />
        </View>

        {isLoading ? (
          <View className="gap-3">
            {[1, 2].map((i) => (
              <View key={i} className="h-28 rounded-2xl border border-border bg-muted" />
            ))}
          </View>
        ) : isError ? (
          <View className="items-center rounded-2xl border border-dashed border-border p-6">
            <Text className="text-center text-sm text-muted-foreground">
              Không tải được danh sách bài đăng. Kiểm tra kết nối mạng và thử lại.
            </Text>
            <View className="mt-3 w-full">
              <PrimaryButton label="Thử lại" variant="outline" onPress={refetchAll} />
            </View>
          </View>
        ) : filteredItems.length === 0 ? (
          <View className="items-center gap-2 rounded-2xl border border-dashed border-border p-6">
            <Text className="text-center text-sm text-muted-foreground">
              {myItems.length === 0
                ? 'Chưa có bài viết hoặc công thức nào trong danh mục này.'
                : 'Không có bài đăng phù hợp bộ lọc. Thử đổi trạng thái hoặc từ khoá tìm kiếm.'}
            </Text>
            <View className="flex-row flex-wrap items-center justify-center gap-2 pt-1">
              <Pressable
                onPress={() => router.push('/recipes/new' as Href)}
                className="flex-row items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5">
                <Plus size={13} color={colors.foreground} />
                <Text className="text-xs font-medium text-foreground">Đăng công thức mới</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push('/articles/new' as Href)}
                className="flex-row items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5">
                <Plus size={13} color={colors.foreground} />
                <Text className="text-xs font-medium text-foreground">Viết cẩm nang mới</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View className="gap-3">
            {filteredItems.map((item) => (
              <MyContentRow
                key={`${item.type}-${item.id}`}
                item={item}
                colors={colors}
                onDelete={confirmDelete}
                onHistory={setHistoryItem}
                isDeleting={deleteMutation.isPending}
              />
            ))}
            <LoadMoreButton hasNextPage={hasMore} isFetchingNextPage={isFetchingMore} onPress={fetchMore} />
          </View>
        )}

        <Text className="text-[11px] leading-4 text-muted-foreground">
          Danh sách lấy từ nội dung đã xuất bản. Bản nháp hoặc bài đang chờ duyệt chưa hiển thị ở đây; hãy mở
          &quot;Lịch sử duyệt&quot; của bài để xem các bản chỉnh sửa đang chờ.
        </Text>

        <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          <View>
            <Text className="text-base font-bold text-foreground">Nội dung đã lưu</Text>
            <Text className="mt-0.5 text-xs text-muted-foreground">Món ăn và video bạn đã lưu để xem lại sau.</Text>
          </View>
          <BookmarksList />
        </View>
      </View>
      <ReviewHistorySheet
        postId={historyItem?.id ?? null}
        title={historyItem?.title}
        onClose={() => setHistoryItem(null)}
      />
    </SiteScreen>
  );
}
