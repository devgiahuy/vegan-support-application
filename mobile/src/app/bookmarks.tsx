import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { Bookmark, ChefHat, Video as VideoIcon } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useMyBookmarksQuery } from '@/features/community/queries/community.queries';
import type { BookmarkedItem } from '@/features/community/types/community.model';
import { formatDate } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';

function bookmarkHref(item: BookmarkedItem): Href {
  return (item.type === 'RECIPE' ? `/recipes/${item.postId}` : `/videos/${item.postId}`) as Href;
}

/** 1 dòng trong danh sách "Đã lưu" — Recipe/Video, backend không hỗ trợ Blog. */
function BookmarkRow({ item, colors }: { item: BookmarkedItem; colors: ReturnType<typeof useIconColors> }) {
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
 * Danh sách nội dung đã lưu (`GET /users/me/bookmarks`) — chỉ Công thức/Video theo
 * đúng giới hạn backend (Bài viết/Cẩm nang không hỗ trợ bookmark).
 */
export default function BookmarksScreen() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: pagination, isLoading, isError, refetch } = useMyBookmarksQuery({ limit: 50 });
  const items = pagination?.items ?? [];

  if (!isAuthenticated) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8">
          <View className="items-center rounded-3xl border border-border bg-card p-6">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Bookmark size={28} color={colors.primary} />
            </View>
            <Text className="mt-4 text-center text-xl font-bold text-foreground">
              Đăng nhập để xem mục đã lưu
            </Text>
            <Text className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
              Công thức và video bạn lưu lại sẽ hiển thị ở đây.
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
          <Text className="text-2xl font-bold tracking-tight text-foreground">Đã lưu</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            Công thức và video bạn đã đánh dấu lưu lại.
          </Text>
        </View>

        {isLoading ? (
          <View className="gap-3">
            {[1, 2, 3].map((i) => (
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
              <BookmarkRow key={item.postId} item={item} colors={colors} />
            ))}
          </View>
        )}
      </View>
    </SiteScreen>
  );
}
