import * as React from 'react';
import { Alert, Linking, Pressable, Share, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { ExternalLink, Pencil, Share2, Sparkles, Trash2 } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { CommunityPanel } from '@/features/community/components/community-panel';
import { VideoCard } from '@/features/video/components/video-card';
import { useRelatedVideosQuery, useVideoDetailQuery } from '@/features/video/queries/video.queries';
import { useDeletePostMutation } from '@/features/post/queries/post.queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';

export default function VideoDetailScreen() {
  const colors = useIconColors();
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const { data: video, isLoading, isError, refetch } = useVideoDetailQuery(id ?? '');
  const { data: relatedVideos = [] } = useRelatedVideosQuery(video?.id ?? '');
  const deleteMutation = useDeletePostMutation();

  const isOwner = !!currentUserId && video?.author.id === currentUserId;

  const openVideo = () => {
    if (!video?.videoUrl) return;
    void Linking.openURL(video.videoUrl);
  };

  const shareVideo = () => {
    if (!video) return;
    void Share.share({ title: video.title, message: `${video.title} - VeggieConnect` });
  };

  const confirmDelete = () => {
    if (!video) return;
    Alert.alert('Xoá video', 'Bạn có chắc muốn xoá video này? Hành động này không thể hoàn tác.', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync({ id: video.id, expectedVersion: video.version });
            Alert.alert('Đã xoá', 'Video đã được xoá.');
            router.replace('/videos' as Href);
          } catch (error) {
            Alert.alert('Không xoá được', getApiErrorMessage(error));
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SiteScreen>
        <View className="gap-4 px-5 pt-4">
          <View className="h-8 w-24 rounded-lg bg-muted" />
          <View className="aspect-video rounded-3xl bg-muted" />
          <View className="h-8 rounded-lg bg-muted" />
          <View className="h-28 rounded-2xl bg-muted" />
        </View>
      </SiteScreen>
    );
  }

  if (isError || !video) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8">
          <View className="items-center rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <Text className="font-semibold text-destructive">Không thể tải video.</Text>
            <Text className="mt-1 text-center text-sm text-muted-foreground">
              Video có thể đã bị ẩn hoặc máy chủ đang bận. Vui lòng thử lại.
            </Text>
            <View className="mt-4 w-full gap-2">
              <PrimaryButton label="Thử lại" variant="outline" onPress={() => void refetch()} />
              <Link href={'/videos' as Href} asChild>
                <PrimaryButton label="Về danh sách video" />
              </Link>
            </View>
          </View>
        </View>
      </SiteScreen>
    );
  }

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <View className="overflow-hidden rounded-3xl border border-border bg-card">
          <Pressable onPress={openVideo} className="relative aspect-video w-full">
            <Image source={{ uri: video.thumbnailUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            <View className="absolute inset-0 items-center justify-center bg-black/20">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-primary">
                <ExternalLink size={22} color={colors.primaryForeground} />
              </View>
            </View>
          </Pressable>
        </View>

        <View className="gap-3">
          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <View className="flex-row flex-wrap items-center gap-2">
              <View className="rounded-full bg-primary/10 px-2.5 py-1">
                <Text className="text-xs font-semibold text-primary">{video.category.name}</Text>
              </View>
              {video.formattedPublishedAt ? (
                <Text className="text-xs text-muted-foreground">{video.formattedPublishedAt}</Text>
              ) : null}
            </View>
            {isOwner ? (
              <View className="flex-row gap-1.5">
                <Link href={`/videos/${video.id}/edit` as Href} asChild>
                  <Pressable className="h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Pencil size={14} color={colors.foreground} />
                  </Pressable>
                </Link>
                <Pressable
                  onPress={confirmDelete}
                  disabled={deleteMutation.isPending}
                  className="h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                  <Trash2 size={14} color={colors.destructive} />
                </Pressable>
              </View>
            ) : null}
          </View>

          <Text className="text-2xl font-extrabold tracking-tight text-foreground">{video.title}</Text>

          {video.excerpt ? (
            <Text className="text-sm leading-relaxed text-muted-foreground">{video.excerpt}</Text>
          ) : null}

          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Text className="text-xs font-bold text-primary">{video.author.name.charAt(0)}</Text>
            </View>
            <Text className="flex-1 text-sm font-semibold text-foreground">{video.author.name}</Text>
          </View>
        </View>

        <View className="gap-2">
          <PrimaryButton
            label="Mở video"
            disabled={!video.videoUrl}
            icon={<ExternalLink size={16} color={colors.primaryForeground} />}
            onPress={openVideo}
          />
          <PrimaryButton
            label="Chia sẻ"
            variant="outline"
            icon={<Share2 size={16} color={colors.foreground} />}
            onPress={shareVideo}
          />
        </View>

        <CommunityPanel postId={video.id} showBookmark commentPlaceholder="Chia sẻ cảm nhận hoặc câu hỏi về video..." />

        <View className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <View className="flex-row items-center gap-2">
            <Sparkles size={16} color={colors.primary} />
            <Text className="font-bold text-foreground">Tóm tắt công thức</Text>
          </View>
          <Text className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {video.summary || 'Backend chưa có tóm tắt công thức cho video này.'}
          </Text>
        </View>

        {video.tags.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {video.tags.map((tag) => (
              <View key={tag} className="rounded-md bg-muted px-2.5 py-1">
                <Text className="text-xs font-medium text-muted-foreground">#{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {relatedVideos.length > 0 ? (
          <View className="gap-3 pt-2">
            <Text className="text-lg font-bold text-foreground">Video liên quan</Text>
            {relatedVideos.map((item) => (
              <VideoCard key={item.id} video={item} />
            ))}
          </View>
        ) : null}
      </View>
    </SiteScreen>
  );
}
