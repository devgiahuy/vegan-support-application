import * as React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Clock } from 'lucide-react-native';
import { useIconColors } from '@/lib/theme-colors';
import type { Article } from '../types/post.model';

/**
 * Card bài viết Cẩm nang, đồng bộ bố cục với
 * `frontend/src/features/post/components/post-card.tsx` (bản dọc, bỏ
 * bookmark/share/vote vì feature cộng đồng chưa dựng ở mobile).
 */
export function PostCard({ post }: { post: Article }) {
  const colors = useIconColors();

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      <View className="relative aspect-video w-full">
        <Image source={{ uri: post.coverImageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        {/* Màu cố định (không theo theme) — nền là ảnh bìa bài viết, độ sáng thay đổi tuỳ
            ảnh, không thể dựa vào token sáng/tối để đảm bảo tương phản. */}
        <View className="absolute left-2.5 top-2.5 rounded-full bg-black/70 px-2.5 py-1">
          <Text className="text-xs font-medium text-white">{post.category.name}</Text>
        </View>
      </View>

      <View className="gap-2 p-4">
        <View className="flex-row items-center gap-1.5">
          <Clock size={12} color={colors.mutedForeground} />
          <Text className="text-xs text-muted-foreground">{post.readingTimeMinutes} phút đọc</Text>
          {post.formattedPublishedAt ? (
            <Text className="text-xs text-muted-foreground">• {post.formattedPublishedAt}</Text>
          ) : null}
        </View>

        <Text numberOfLines={2} className="text-base font-bold leading-snug text-foreground">
          {post.title}
        </Text>

        {post.excerpt ? (
          <Text numberOfLines={2} className="text-sm leading-relaxed text-muted-foreground">
            {post.excerpt}
          </Text>
        ) : null}

        {post.tags.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5 pt-0.5">
            {post.tags.slice(0, 3).map((tag) => (
              <View key={tag} className="rounded-md bg-muted px-2 py-0.5">
                <Text className="text-[11px] font-medium text-muted-foreground">#{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View className="mt-1 flex-row items-center gap-2 border-t border-border pt-3">
          <View className="h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <Text className="text-xs font-bold text-primary">{post.author.name.charAt(0)}</Text>
          </View>
          <Text numberOfLines={1} className="flex-1 text-xs font-semibold text-foreground">
            {post.author.name}
          </Text>
        </View>
      </View>
    </View>
  );
}
