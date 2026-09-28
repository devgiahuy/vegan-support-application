import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { Clock, Play } from 'lucide-react-native';
import { useIconColors } from '@/lib/theme-colors';
import type { CookingVideo } from '../types/video.model';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
}

export function VideoCard({ video }: { video: CookingVideo }) {
  const colors = useIconColors();
  const duration = formatDuration(video.durationSeconds);

  return (
    <Link href={`/videos/${video.id}` as Href} asChild>
      <Pressable className="overflow-hidden rounded-2xl border border-border bg-card">
        <View className="relative aspect-video w-full">
          <Image source={{ uri: video.thumbnailUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          <View className="absolute inset-0 items-center justify-center bg-black/15">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Play size={20} color={colors.primaryForeground} fill={colors.primaryForeground} />
            </View>
          </View>
          {/* Màu cố định (không theo theme) — nền là ảnh thumbnail, độ sáng thay đổi tuỳ
              ảnh, không thể dựa vào token sáng/tối để đảm bảo tương phản. */}
          <View className="absolute left-2.5 top-2.5 rounded-full bg-black/70 px-2.5 py-1">
            <Text className="text-xs font-medium text-white">{video.category.name}</Text>
          </View>
          {duration ? (
            <View className="absolute bottom-2.5 right-2.5 rounded-md bg-black/75 px-2 py-1">
              <Text className="text-xs font-semibold text-white">{duration}</Text>
            </View>
          ) : null}
        </View>

        <View className="gap-2 p-4">
          <View className="flex-row items-center gap-1.5">
            <Clock size={12} color={colors.mutedForeground} />
            <Text className="text-xs text-muted-foreground">
              {video.formattedPublishedAt || 'Video hướng dẫn'}
            </Text>
          </View>

          <Text numberOfLines={2} className="text-base font-bold leading-snug text-foreground">
            {video.title}
          </Text>

          {video.excerpt ? (
            <Text numberOfLines={2} className="text-sm leading-relaxed text-muted-foreground">
              {video.excerpt}
            </Text>
          ) : null}

          {video.tags.length > 0 ? (
            <View className="flex-row flex-wrap gap-1.5 pt-0.5">
              {video.tags.slice(0, 3).map((tag) => (
                <View key={tag} className="rounded-md bg-muted px-2 py-0.5">
                  <Text className="text-[11px] font-medium text-muted-foreground">#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}
