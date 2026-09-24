import * as React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Bookmark, MessageCircle, Star, ThumbsUp } from 'lucide-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import {
  useBookmarkMutation,
  useCommentThreadQuery,
  useCommunitySummaryQuery,
  useCreateCommentMutation,
  useRatingMutation,
  useVoteMutation,
} from '../queries/community.queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

function StarRow({
  value,
  onChange,
  colors,
}: {
  value: number;
  onChange: (v: number) => void;
  colors: ReturnType<typeof useIconColors>;
}) {
  return (
    <View className="flex-row gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} hitSlop={4}>
          <Star
            size={22}
            color={colors.cta}
            fill={n <= value ? colors.cta : 'transparent'}
            strokeWidth={1.8}
          />
        </Pressable>
      ))}
    </View>
  );
}

/**
 * Khối "Cộng đồng" dùng chung cho Công thức/Video/Bài viết: upvote, lưu bài
 * (Recipe/Video), đánh giá khẩu vị + độ khó (chỉ Recipe), bình luận. Chỉ hiện các
 * hành động backend cho phép với đúng loại nội dung (BLOG không bookmark/rating
 * được — backend từ chối `BOOKMARK_TYPE_NOT_SUPPORTED`).
 */
export function CommunityPanel({
  postId,
  showBookmark = true,
  showRating = false,
  commentPlaceholder = 'Chia sẻ cảm nhận hoặc câu hỏi...',
}: {
  postId: string;
  showBookmark?: boolean;
  showRating?: boolean;
  commentPlaceholder?: string;
}) {
  const colors = useIconColors();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [comment, setComment] = React.useState('');
  const [tasteDraft, setTasteDraft] = React.useState(0);
  const [difficultyDraft, setDifficultyDraft] = React.useState(0);

  const { data: summary } = useCommunitySummaryQuery(postId);
  const { data: commentsPagination, isLoading: isCommentsLoading } = useCommentThreadQuery(postId, {
    limit: 10,
    order: 'oldest',
  });
  const voteMutation = useVoteMutation();
  const bookmarkMutation = useBookmarkMutation();
  const ratingMutation = useRatingMutation();
  const createCommentMutation = useCreateCommentMutation();
  const comments = commentsPagination?.items ?? [];

  React.useEffect(() => {
    if (summary?.viewerRating) {
      setTasteDraft(summary.viewerRating.taste);
      setDifficultyDraft(summary.viewerRating.difficulty);
    }
  }, [summary?.viewerRating]);

  const requireLogin = (message: string): boolean => {
    if (isAuthenticated) return true;
    Alert.alert('Cần đăng nhập', message);
    router.push('/(auth)/login');
    return false;
  };

  const toggleVote = async () => {
    if (!requireLogin('Bạn cần đăng nhập để upvote.')) return;
    try {
      await voteMutation.mutateAsync({ postId, voted: !(summary?.viewerVoted ?? false) });
    } catch (error) {
      Alert.alert('Không thể bình chọn', getApiErrorMessage(error));
    }
  };

  const toggleBookmark = async () => {
    if (!requireLogin('Bạn cần đăng nhập để lưu lại.')) return;
    try {
      await bookmarkMutation.mutateAsync({ postId, bookmarked: !(summary?.viewerBookmarked ?? false) });
    } catch (error) {
      Alert.alert('Không thể lưu', getApiErrorMessage(error));
    }
  };

  const submitRating = async (taste: number, difficulty: number) => {
    if (!requireLogin('Bạn cần đăng nhập để đánh giá.')) return;
    try {
      await ratingMutation.mutateAsync({ postId, taste, difficulty });
    } catch (error) {
      Alert.alert('Không thể gửi đánh giá', getApiErrorMessage(error));
    }
  };

  const submitComment = async () => {
    if (!requireLogin('Bạn cần đăng nhập để bình luận.')) return;
    const content = comment.trim();
    if (content.length < 2) {
      Alert.alert('Bình luận quá ngắn', 'Vui lòng nhập ít nhất 2 ký tự.');
      return;
    }
    try {
      await createCommentMutation.mutateAsync({ postId, content });
      setComment('');
    } catch (error) {
      Alert.alert('Không gửi được bình luận', getApiErrorMessage(error));
    }
  };

  return (
    <View className="gap-4">
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
          {showBookmark ? (
            <Pressable
              disabled={bookmarkMutation.isPending}
              onPress={() => void toggleBookmark()}
              className={cn(
                'h-11 flex-1 flex-row items-center justify-center gap-2 rounded-xl border',
                summary?.viewerBookmarked ? 'border-primary bg-primary/10' : 'border-input bg-background'
              )}>
              <Bookmark size={16} color={summary?.viewerBookmarked ? colors.primary : colors.foreground} />
              <Text
                className={cn(
                  'text-sm font-semibold',
                  summary?.viewerBookmarked ? 'text-primary' : 'text-foreground'
                )}>
                {summary?.viewerBookmarked ? 'Đã lưu' : 'Lưu'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {showRating ? (
        <View className="rounded-2xl border border-border bg-card p-4">
          <Text className="font-bold text-foreground">Đánh giá món ăn</Text>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            {summary?.rating?.count
              ? `${summary.rating.count} lượt đánh giá • Vị: ${summary.rating.tasteAverage?.toFixed(1) ?? '-'}/5 • Độ khó: ${summary.rating.difficultyAverage?.toFixed(1) ?? '-'}/5`
              : 'Chưa có lượt đánh giá nào — hãy là người đầu tiên!'}
          </Text>

          <View className="mt-3 gap-3">
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-muted-foreground">Khẩu vị</Text>
              <StarRow value={tasteDraft} onChange={setTasteDraft} colors={colors} />
            </View>
            <View className="gap-1.5">
              <Text className="text-xs font-semibold text-muted-foreground">Độ khó thực hiện</Text>
              <StarRow value={difficultyDraft} onChange={setDifficultyDraft} colors={colors} />
            </View>
            <PrimaryButton
              label={ratingMutation.isPending ? 'Đang gửi...' : 'Gửi đánh giá'}
              variant="outline"
              loading={ratingMutation.isPending}
              disabled={tasteDraft === 0 || difficultyDraft === 0}
              onPress={() => void submitRating(tasteDraft, difficultyDraft)}
            />
          </View>
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
            placeholder={commentPlaceholder}
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
                <Text className="text-sm font-semibold text-foreground">
                  {item.author?.displayName ?? 'Người dùng'}
                </Text>
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
    </View>
  );
}
