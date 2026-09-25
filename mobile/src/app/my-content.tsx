import * as React from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href, useRouter } from 'expo-router';
import { BookOpen, ChefHat, FileText, Pencil, Search, Trash2, Video as VideoIcon } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useRecipesQuery } from '@/features/recipe/queries/recipe.queries';
import { useArticlesQuery, useDeletePostMutation } from '@/features/post/queries/post.queries';
import { useVideosQuery } from '@/features/video/queries/video.queries';
import { PostStatus } from '@/common/enums';
import { getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';

type ContentType = 'RECIPE' | 'BLOG' | 'VIDEO';

interface MyContentItem {
  id: string;
  type: ContentType;
  title: string;
  excerpt: string;
  coverImageUrl: string;
  status: PostStatus;
  statusLabel: string;
  version: number;
  formattedPublishedAt: string;
}

const STATUS_FILTERS: { value: 'ALL' | PostStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: PostStatus.PUBLISHED, label: 'Đã xuất bản' },
  { value: PostStatus.PENDING_REVIEW, label: 'Chờ duyệt' },
  { value: PostStatus.REJECTED, label: 'Từ chối' },
  { value: PostStatus.FLAGGED, label: 'Cần chỉnh sửa' },
  { value: PostStatus.DRAFT, label: 'Bản nháp' },
];

const TYPE_LABEL: Record<ContentType, string> = {
  RECIPE: 'Công thức',
  BLOG: 'Cẩm nang',
  VIDEO: 'Video',
};

function typeIcon(type: ContentType) {
  if (type === 'RECIPE') return ChefHat;
  if (type === 'VIDEO') return VideoIcon;
  return BookOpen;
}

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

function statusBadgeClass(status: PostStatus): string {
  switch (status) {
    case PostStatus.PUBLISHED:
      return 'bg-emerald-500/10';
    case PostStatus.PENDING_REVIEW:
      return 'bg-amber-500/10';
    case PostStatus.REJECTED:
    case PostStatus.FLAGGED:
      return 'bg-destructive/10';
    default:
      return 'bg-muted';
  }
}

function statusTextClass(status: PostStatus): string {
  switch (status) {
    case PostStatus.PUBLISHED:
      return 'text-emerald-600';
    case PostStatus.PENDING_REVIEW:
      return 'text-amber-600';
    case PostStatus.REJECTED:
    case PostStatus.FLAGGED:
      return 'text-destructive';
    default:
      return 'text-muted-foreground';
  }
}

function MyContentRow({
  item,
  colors,
  onDelete,
  isDeleting,
}: {
  item: MyContentItem;
  colors: ReturnType<typeof useIconColors>;
  onDelete: (item: MyContentItem) => void;
  isDeleting: boolean;
}) {
  const TypeIcon = typeIcon(item.type);
  return (
    <View className="gap-2 rounded-2xl border border-border bg-card p-3">
      <Link href={detailHref(item)} asChild>
        <Pressable className="flex-row items-center gap-3">
          <View className="h-16 w-16 overflow-hidden rounded-xl bg-muted">
            {item.coverImageUrl ? (
              <Image source={{ uri: item.coverImageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : null}
          </View>
          <View className="flex-1 gap-1">
            <View className="flex-row items-center gap-1">
              <TypeIcon size={12} color={colors.primary} />
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                {TYPE_LABEL[item.type]}
              </Text>
            </View>
            <Text numberOfLines={2} className="text-sm font-semibold text-foreground">
              {item.title}
            </Text>
            {item.formattedPublishedAt ? (
              <Text className="text-xs text-muted-foreground">{item.formattedPublishedAt}</Text>
            ) : null}
          </View>
          <View className={`rounded-full px-2 py-1 ${statusBadgeClass(item.status)}`}>
            <Text className={`text-[11px] font-semibold ${statusTextClass(item.status)}`}>{item.statusLabel}</Text>
          </View>
        </Pressable>
      </Link>
      <View className="flex-row gap-2 border-t border-border pt-2">
        <Link href={editHref(item)} asChild>
          <Pressable className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-muted py-2">
            <Pencil size={13} color={colors.foreground} />
            <Text className="text-xs font-semibold text-foreground">Sửa</Text>
          </Pressable>
        </Link>
        <Pressable
          onPress={() => onDelete(item)}
          disabled={isDeleting}
          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-destructive/10 py-2"
        >
          <Trash2 size={13} color={colors.destructive} />
          <Text className="text-xs font-semibold text-destructive">Xoá</Text>
        </Pressable>
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

  const {
    data: recipesPagination,
    isLoading: isRecipesLoading,
    isError: isRecipesError,
    refetch: refetchRecipes,
  } = useRecipesQuery({ limit: 50 });
  const {
    data: articlesPagination,
    isLoading: isArticlesLoading,
    isError: isArticlesError,
    refetch: refetchArticles,
  } = useArticlesQuery({ limit: 50 });
  const {
    data: videosPagination,
    isLoading: isVideosLoading,
    isError: isVideosError,
    refetch: refetchVideos,
  } = useVideosQuery({ limit: 50 });

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

    const fromRecipes: MyContentItem[] = (recipesPagination?.items ?? [])
      .filter((r) => r.author.id === currentUserId)
      .map((r) => ({
        id: r.id,
        type: 'RECIPE',
        title: r.title,
        excerpt: r.description,
        coverImageUrl: r.coverImageUrl,
        status: r.status,
        statusLabel: r.statusLabel,
        version: r.version,
        formattedPublishedAt: r.formattedPublishedAt,
      }));

    const fromArticles: MyContentItem[] = (articlesPagination?.items ?? [])
      .filter((a) => a.author.id === currentUserId)
      .map((a) => ({
        id: a.id,
        type: 'BLOG',
        title: a.title,
        excerpt: a.excerpt,
        coverImageUrl: a.coverImageUrl,
        status: a.status,
        statusLabel: a.statusLabel,
        version: a.version,
        formattedPublishedAt: a.formattedPublishedAt,
      }));

    const fromVideos: MyContentItem[] = (videosPagination?.items ?? [])
      .filter((v) => v.author.id === currentUserId)
      .map((v) => ({
        id: v.id,
        type: 'VIDEO',
        title: v.title,
        excerpt: v.excerpt,
        coverImageUrl: v.thumbnailUrl,
        status: v.status,
        statusLabel: v.statusLabel,
        version: v.version,
        formattedPublishedAt: v.formattedPublishedAt,
      }));

    return [...fromRecipes, ...fromArticles, ...fromVideos];
  }, [recipesPagination?.items, articlesPagination?.items, videosPagination?.items, currentUserId]);

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
    <SiteScreen>
      <View className="gap-4 px-5 pt-4">
        <View>
          <Text className="text-2xl font-bold tracking-tight text-foreground">Bài viết của tôi</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Công thức, cẩm nang và video bạn đã đăng — theo dõi trạng thái duyệt, sửa hoặc xoá.
          </Text>
        </View>

        <View className="flex-row items-center gap-2 rounded-xl border border-input bg-background px-3">
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm theo tiêu đề..."
            placeholderTextColor={colors.mutedForeground}
            className="flex-1 py-2.5 text-sm text-foreground"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
          <View className="flex-row gap-2">
            {STATUS_FILTERS.map((f) => {
              const count =
                f.value === 'ALL' ? myItems.length : myItems.filter((item) => item.status === f.value).length;
              const active = statusFilter === f.value;
              return (
                <Pressable
                  key={f.value}
                  onPress={() => setStatusFilter(f.value)}
                  className={`rounded-full px-3 py-1.5 ${active ? 'bg-primary' : 'bg-muted'}`}
                >
                  <Text className={`text-xs font-semibold ${active ? 'text-primary-foreground' : 'text-foreground'}`}>
                    {f.label} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {isLoading ? (
          <View className="gap-3">
            {[1, 2, 3].map((i) => (
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
          <View className="items-center rounded-2xl border border-dashed border-border p-6">
            <FileText size={22} color={colors.mutedForeground} />
            <Text className="mt-2 text-center font-semibold text-foreground">
              {myItems.length === 0 ? 'Bạn chưa đăng nội dung nào' : 'Không có bài đăng phù hợp bộ lọc'}
            </Text>
            <Text className="mt-1 text-center text-sm text-muted-foreground">
              {myItems.length === 0
                ? 'Đăng công thức, bài chia sẻ hoặc video đầu tiên của bạn.'
                : 'Thử đổi bộ lọc trạng thái hoặc từ khoá tìm kiếm.'}
            </Text>
            {myItems.length === 0 ? (
              <View className="mt-4 w-full">
                <PrimaryButton label="Viết công thức mới" onPress={() => router.push('/recipes/new' as Href)} />
              </View>
            ) : null}
          </View>
        ) : (
          <View className="gap-3">
            {filteredItems.map((item) => (
              <MyContentRow
                key={`${item.type}-${item.id}`}
                item={item}
                colors={colors}
                onDelete={confirmDelete}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </View>
        )}
      </View>
    </SiteScreen>
  );
}
