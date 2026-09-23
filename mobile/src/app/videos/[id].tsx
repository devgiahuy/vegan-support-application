import * as React from 'react';
import { Alert, Linking, Pressable, Share, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Bookmark, ExternalLink, MessageCircle, Play, Share2, Sparkles, ThumbsUp } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import {
  useBookmarkMutation,
  useCommentThreadQuery,
  useCommunitySummaryQuery,
  useCreateCommentMutation,
  useVoteMutation,
} from '@/features/community/queries/community.queries';
import { VideoCard } from '@/features/video/components/video-card';
import { useRelatedVideosQuery, useVideoDetailQuery } from '@/features/video/queries/video.queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

export default function VideoDetailScreen() {
  const colors = useIconColors();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [comment, setComment] = React.useState('');

  const { data: video, isLoading, isError, refetch } = useVideoDetailQuery(id ?? '');
  const { data: relatedVideos = [] } = useRelatedVideosQuery(video?.id ?? '');
  const { data: summary } = useCommunitySummaryQuery(video?.id ?? '');
  const { data: commentsPagination, isLoading: isCommentsLoading } = useCommentThreadQuery(video?.id ?? '', {
    limit: 10,
    order: 'oldest',
  });
  const voteMutation = useVoteMutation();
  const bookmarkMutation = useBookmarkMutation();
  const createCommentMutation = useCreateCommentMutation();
  const comments = commentsPagination?.items ?? [];

  const openVideo = () => {
    if (!video?.videoUrl) return;
    void Linking.openURL(video.videoUrl);
  };

  const shareVideo = () => {
    if (!video) return;
    void Share.share({ title: video.title, message: `${video.title} - VeggieConnect` });
  };

  const requireLogin = (message: string): boolean => {
    if (isAuthenticated) return true;
    Alert.alert('Cần đăng nhập', message);
    router.push('/(auth)/login');
    return false;
  };

  const toggleVote = async () => {
    if (!video || !requireLogin('Bạn cần đăng nhập để upvote video.')) return;
    try {
      await voteMutation.mutateAsync({ postId: video.id, voted: !(summary?.viewerVoted ?? false) });
    } catch (error) {
      Alert.alert('Không thể bình chọn', getApiErrorMessage(error));
    }
  };

  const toggleBookmark = async () => {
    if (!video || !requireLogin('Bạn cần đăng nhập để lưu video.')) return;
    try {
      await bookmarkMutation.mutateAsync({ postId: video.id, bookmarked: !(summary?.viewerBookmarked ?? false) });
    } catch (error) {
      Alert.alert('Không thể lưu video', getApiErrorMessage(error));
    }
  };

  const submitComment = async () => {
    if (!video || !requireLogin('Bạn cần đăng nhập để bình luận.')) return;
    const content = comment.trim();
    if (content.length < 2) {
      Alert.alert('Bình luận quá ngắn', 'Vui lòng nhập ít nhất 2 ký tự.');
      return;
    }
    try {
      await createCommentMutation.mutateAsync({ postId: video.id, content });
      setComment('');
    } catch (error) {
      Alert.alert('Không gửi được bình luận', getApiErrorMessage(error));
    }
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
        <Link href={'/videos' as Href} asChild>
          <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-muted">
            <ArrowLeft size={18} color={colors.foreground} />
          </Pressable>
        </Link>

        <View className="overflow-hidden rounded-3xl border border-border bg-card">
          <Pressable onPress={openVideo} className="relative aspect-video w-full">
            <Image source={{ uri: video.thumbnailUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            <View className="absolute inset-0 items-center justify-center bg-black/20">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-primary">
                <Play size={26} color={colors.primaryForeground} fill={colors.primaryForeground} />
              </View>
            </View>
          </Pressable>
        </View>

        <View className="gap-3">
          <View className="flex-row flex-wrap items-center gap-2">
            <View className="rounded-full bg-primary/10 px-2.5 py-1">
              <Text className="text-xs font-semibold text-primary">{video.category.name}</Text>
            </View>
            {video.formattedPublishedAt ? (
              <Text className="text-xs text-muted-foreground">{video.formattedPublishedAt}</Text>
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

        <View className="rounded-2xl border border-border bg-card p-4">
          <Text className="font-bold text-foreground">Cộng đồng</Text>
          <View className="mt-3 flex-row gap-2">
            <Pressable
              disabled={voteMutation.isPending}
              onPress={() => void toggleVote()}
              className={cn(
                'h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl border',
                summary?.viewerVoted ? 'border-primary bg-primary/10' : 'border-input bg-background'
              )}>
              <ThumbsUp size={16} color={summary?.viewerVoted ? colors.primary : colors.foreground} />
              <Text className={cn('text-sm font-semibold', summary?.viewerVoted ? 'text-primary' : 'text-foreground')}>
                {summary?.voteCount ?? 0}
              </Text>
            </Pressable>
            <Pressable
              disabled={bookmarkMutation.isPending}
              onPress={() => void toggleBookmark()}
              className={cn(
                'h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl border',
                summary?.viewerBookmarked ? 'border-primary bg-primary/10' : 'border-input bg-background'
              )}>
              <Bookmark size={16} color={summary?.viewerBookmarked ? colors.primary : colors.foreground} />
              <Text className={cn('text-sm font-semibold', summary?.viewerBookmarked ? 'text-primary' : 'text-foreground')}>
                {summary?.viewerBookmarked ? 'Đã lưu' : 'Lưu'}
              </Text>
            </Pressable>
          </View>
        </View>

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

        <View className="rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center gap-2">
            <MessageCircle size={16} color={colors.primary} />
            <Text className="font-bold text-foreground">Bình luận</Text>
          </View>

          <View className="mt-3 gap-2">
            <TextInput
              value={comment}
              onChangeText={setComment}
              multiline
              placeholder="Chia sẻ cảm nhận hoặc câu hỏi về video..."
              placeholderTextColor={colors.mutedForeground}
              className="min-h-20 rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground"
              textAlignVertical="top"
            />
            <PrimaryButton
              label={createCommentMutation.isPending ? 'Đang gửi...' : 'Gửi bình luận'}
              loading={createCommentMutation.isPending}
              onPress={() => void submitComment()}
            />
          </View>

          <View className="mt-4 gap-3">
            {isCommentsLoading ? (
              <Text className="text-sm text-muted-foreground">Đang tải bình luận...</Text>
            ) : comments.length === 0 ? (
              <Text className="text-sm text-muted-foreground">Chưa có bình luận nào.</Text>
            ) : (
              comments.map((item) => (
                <View key={item.id} className="rounded-xl bg-muted/60 p-3">
                  <Text className="text-sm font-semibold text-foreground">{item.author?.displayName ?? 'Người dùng'}</Text>
                  <Text className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {item.content ?? 'Bình luận đã bị ẩn.'}
                  </Text>
                  {item.replies.length > 0 ? (
                    <View className="mt-2 gap-2 border-l border-border pl-3">
                      {item.replies.map((reply) => (
                        <Text key={reply.id} className="text-sm text-muted-foreground">
                          {reply.author?.displayName ?? 'Người dùng'}: {reply.content ?? 'Bình luận đã bị ẩn.'}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </View>

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
