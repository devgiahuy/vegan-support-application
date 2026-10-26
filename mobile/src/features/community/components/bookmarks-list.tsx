import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { Bookmark, ChefHat, Video as VideoIcon } from 'lucide-react-native';

import { LoadMoreButton } from '@/components/shared/load-more-button';
import { PrimaryButton } from '@/components/ui/primary-button';
import { formatDate, cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import { useInfiniteMyBookmarksQuery } from '../queries/community.queries';
import type { BookmarkedItem } from '../types/community.model';

type TypeFilter = 'ALL' | BookmarkedItem['type'];

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'RECIPE', label: 'Công thức' },
  { value: 'VIDEO', label: 'Video' },
];

function bookmarkHref(item: BookmarkedItem): Href {
  return (item.type === 'RECIPE' ? `/recipes/${item.postId}` : `/videos/${item.postId}`) as Href;
}

/** 1 dòng trong danh sách "Đã lưu" — Recipe/Video, backend không hỗ trợ Blog. */
function BookmarkRow({ item }: { item: BookmarkedItem }) {
  const colors = useIconColors();
  const TypeIcon = item.type === 'RECIPE' ? ChefHat : VideoIcon;
  return (
    <Link href={bookmarkHref(item)} asChild>
      <Pressable className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-3">
        <View className="h-16 w-16 overflow-hidden rounded-xl bg-muted">
          {item.coverImageUrl ? (
            <Image source={{ uri: item.coverImageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : null}
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-1">
            <TypeIcon size={12} color={colors.primary} />
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              {item.type === 'RECIPE' ? 'Công thức' : 'Video'}
            </Text>
          </View>
          <Text numberOfLines={2} className="text-sm font-semibold text-foreground">
            {item.title}
          </Text>
          {item.bookmarkedAt ? (
            <Text className="text-xs text-muted-foreground">Đã lưu {formatDate(item.bookmarkedAt)}</Text>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

/**
 * Danh sách nội dung đã lưu (`GET /users/me/bookmarks`) kèm bộ lọc Tất cả / Công thức / Video — chỉ Công thức và
 * Video theo đúng giới hạn backend (Bài viết/Cẩm nang không hỗ trợ bookmark). Dùng ở màn "Đã lưu" và cuối "Bài viết của tôi".
 */
export function BookmarksList() {
  const colors = useIconColors();
  const [filter, setFilter] = React.useState<TypeFilter>('ALL');
  const { data, isLoading, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteMyBookmarksQuery({ limit: 20, ...(filter === 'ALL' ? {} : { type: filter }) });
  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View className="gap-3">
      <View className="flex-row gap-2">
        {TYPE_FILTERS.map((option) => {
          const active = filter === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setFilter(option.value)}
              className={cn('rounded-full border px-3.5 py-1.5', active ? 'border-primary bg-primary' : 'border-border bg-card')}>
              <Text className={cn('text-xs font-semibold', active ? 'text-primary-foreground' : 'text-foreground')}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View className="gap-3">
          {[1, 2].map((i) => (
            <View key={i} className="h-24 rounded-2xl border border-border bg-muted" />
          ))}
        </View>
      ) : isError ? (
        <View className="items-center rounded-2xl border border-dashed border-border p-6">
          <Text className="text-center text-sm text-muted-foreground">
            Không tải được danh sách đã lưu. Kiểm tra kết nối mạng và thử lại.
          </Text>
          <View className="mt-3 w-full">
            <PrimaryButton label="Thử lại" variant="outline" onPress={() => void refetch()} />
          </View>
        </View>
      ) : items.length === 0 ? (
        <View className="items-center rounded-2xl border border-dashed border-border p-6">
          <Bookmark size={22} color={colors.mutedForeground} />
          <Text className="mt-2 text-center font-semibold text-foreground">Chưa lưu gì cả</Text>
          <Text className="mt-1 text-center text-sm text-muted-foreground">
            Bấm biểu tượng lưu ở công thức hoặc video để xem lại tại đây.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {items.map((item) => (
            <BookmarkRow key={item.postId} item={item} />
          ))}
          <LoadMoreButton
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onPress={() => void fetchNextPage()}
          />
        </View>
      )}
    </View>
  );
}
