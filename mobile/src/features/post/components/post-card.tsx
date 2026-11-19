import * as React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Clock } from 'lucide-react-native';
import { useIconColors } from '@/lib/theme-colors';
import type { Article } from '../types/post.model';

/**
 * Card bài viết Cẩm nang gọn cho danh sách mobile: ảnh bìa, chuyên mục, thời gian đọc, tiêu đề và mô tả ngắn.
 */
export function PostCard({ post }: { post: Article }) {
  const colors = useIconColors();

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-card">
      <View className="relative aspect-video w-full bg-muted">
        <Image source={{ uri: post.coverImageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        {/* Màu cố định (không theo theme) — nền là ảnh bìa bài viết, độ sáng thay đổi tuỳ ảnh. */}
        <View className="absolute left-2.5 top-2.5 max-w-[85%] flex-row rounded-full bg-black/70 px-2.5 py-1">
          <Text numberOfLines={1} className="shrink text-xs font-medium text-white">
            {post.category.name}
          </Text>
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
                <Text className="text-xs font-medium text-muted-foreground">#{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
