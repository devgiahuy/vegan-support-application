import * as React from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, Calendar, Clock, Eye, Hourglass, Pencil, Share2, Tag, Trash2 } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { PostCard } from '@/features/post/components/post-card';
import {
  useArticleDetailQuery,
  useDeletePostMutation,
  useRelatedArticlesQuery,
} from '@/features/post/queries/post.queries';
import { CommunityPanel } from '@/features/community/components/community-panel';
import { ChatMarkdown } from '@/features/chat/components/chat-markdown';
import { ReportButton } from '@/features/safety/components/report-button';
import { PostStatus } from '@/common/enums';
import { getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Chi tiết bài viết Cẩm nang — đồng bộ `frontend/src/app/(site)/articles/[id]/page.tsx`:
 * ảnh bìa, nội dung đầy đủ, tác giả, tag, bài liên quan cùng danh mục, khối cộng đồng
 * (upvote/bình luận — BLOG không hỗ trợ lưu/đánh giá theo backend).
 */
export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useIconColors();
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { data: article, isLoading, isError, refetch } = useArticleDetailQuery(id ?? '');
  const { data: relatedArticles = [] } = useRelatedArticlesQuery(article?.id ?? '');
  const deleteMutation = useDeletePostMutation();

  const isOwner = !!currentUserId && article?.author.id === currentUserId;

  const handleShare = () => {
    if (!article) return;
    void Share.share({ message: `${article.title} — VeggieConnect`, title: article.title });
  };

  const confirmDelete = () => {
    if (!article) return;
    Alert.alert('Xoá bài viết', 'Bạn có chắc muốn xoá bài viết này? Hành động này không thể hoàn tác.', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Xoá',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync({ id: article.id, expectedVersion: article.version });
            Alert.alert('Đã xoá', 'Bài viết đã được xoá.');
            router.replace('/articles' as Href);
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
        <View className="items-center justify-center px-5 py-20">
          <Text className="text-sm text-muted-foreground">Đang tải bài viết...</Text>
        </View>
      </SiteScreen>
    );
  }

  if (isError || !article) {
    return (
      <SiteScreen>
        <View className="items-center px-5 py-16">
          <Text className="text-5xl">📖</Text>
          <Text className="mt-4 text-xl font-bold text-foreground">Không tìm thấy bài viết</Text>
          <Text className="mt-2 text-center text-sm text-muted-foreground">
            Bài viết bạn đang tìm có thể đã bị xóa hoặc không tồn tại.
          </Text>
          <View className="mt-6">
            <PrimaryButton label="Thử lại" onPress={() => void refetch()} />
          </View>
        </View>
      </SiteScreen>
    );
  }

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        {article.status === PostStatus.PENDING_REVIEW ? (
          <View className="flex-row items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <Hourglass size={18} color="#d97706" />
            <View className="flex-1">
              <Text className="font-semibold text-foreground">Bài viết đang chờ kiểm duyệt</Text>
              <Text className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Nội dung đang được Ban biên tập VeggieConnect kiểm định.
              </Text>
            </View>
          </View>
        ) : null}

        {article.status === PostStatus.REJECTED ? (
          <View className="flex-row items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
            <AlertTriangle size={18} color={colors.destructive} />
            <View className="flex-1">
              <Text className="font-semibold text-destructive">Bài viết không được phê duyệt</Text>
              <Text className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Nội dung chưa đáp ứng tiêu chuẩn biên tập của VeggieConnect.
              </Text>
            </View>
          </View>
        ) : null}

        {/* Đầu bài — đồng bộ `post-detail-view.tsx` của web: huy hiệu chuyên mục, tiêu đề, tóm tắt, thanh tác giả. */}
        <View className="gap-3">
          <View className="flex-row flex-wrap items-center gap-2">
            <View className="rounded-full bg-primary px-3 py-1">
              <Text className="text-xs font-semibold text-primary-foreground">{article.category.name}</Text>
            </View>
          </View>

          <Text className="text-2xl font-extrabold leading-tight tracking-tight text-foreground">{article.title}</Text>

          {article.excerpt ? (
            <Text className="text-base leading-relaxed text-muted-foreground">{article.excerpt}</Text>
          ) : null}

          <View className="gap-3 border-t border-border pt-4">
            <View className="flex-row items-center gap-3">
              <UserAvatar name={article.author.name} uri={article.author.avatarUrl} size={48} className="border-2 border-primary/20" />
              <View className="flex-1 gap-1">
                <View className="flex-row flex-wrap items-center gap-2">
                  <Text className="shrink text-base font-bold text-foreground">{article.author.name}</Text>
                  <View className="rounded-full bg-muted px-2 py-0.5">
                    <Text className="text-[10px] font-medium text-muted-foreground">Tác giả</Text>
                  </View>
                </View>
                <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
                  {article.formattedPublishedAt ? (
                    <View className="flex-row items-center gap-1">
                      <Calendar size={13} color={colors.mutedForeground} />
                      <Text className="text-xs text-muted-foreground">{article.formattedPublishedAt}</Text>
                    </View>
                  ) : null}
                  <View className="flex-row items-center gap-1">
                    <Clock size={13} color={colors.mutedForeground} />
                    <Text className="text-xs text-muted-foreground">{article.readingTimeMinutes} phút đọc</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Eye size={13} color={colors.mutedForeground} />
                    <Text className="text-xs text-muted-foreground">{article.stats.views.toLocaleString('vi-VN')} lượt xem</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Hành động dạng viên thuốc như web. Không có "Lưu bài": backend không hỗ trợ bookmark cho BLOG. */}
            <View className="flex-row flex-wrap gap-2">
              <Pressable
                accessibilityRole="button"
                onPress={handleShare}
                className="h-9 flex-row items-center gap-1.5 rounded-full border border-input bg-background px-3.5 active:bg-muted">
                <Share2 size={15} color={colors.foreground} />
                <Text className="text-sm font-medium text-foreground">Chia sẻ</Text>
              </Pressable>
              {isOwner ? (
                <>
                  <Link href={`/articles/${article.id}/edit` as Href} asChild>
                    <Pressable
                      accessibilityRole="button"
                      className="h-9 flex-row items-center gap-1.5 rounded-full bg-primary/10 px-3.5 active:bg-primary/20">
                      <Pencil size={14} color={colors.primary} />
                      <Text className="text-sm font-medium text-primary">Sửa bài</Text>
                    </Pressable>
                  </Link>
                  <Pressable
                    accessibilityRole="button"
                    onPress={confirmDelete}
                    disabled={deleteMutation.isPending}
                    className="h-9 flex-row items-center gap-1.5 rounded-full border border-destructive/30 bg-background px-3.5 active:bg-destructive/10">
                    <Trash2 size={14} color={colors.destructive} />
                    <Text className="text-sm font-medium text-destructive">Xoá bài</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          </View>
        </View>

        <View className="aspect-video w-full overflow-hidden rounded-3xl border border-border bg-muted">
          <Image source={{ uri: article.coverImageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        </View>

        <View>
          {article.content ? (
            <ChatMarkdown content={article.content} />
          ) : (
            <Text className="text-sm leading-relaxed text-foreground">Đang cập nhật nội dung cho bài viết này...</Text>
          )}
        </View>

        {article.tags.length > 0 ? (
          <View className="flex-row flex-wrap items-center gap-2 border-t border-border pt-4">
            <View className="flex-row items-center gap-1">
              <Tag size={13} color={colors.mutedForeground} />
              <Text className="text-xs font-semibold text-muted-foreground">Chủ đề liên quan:</Text>
            </View>
            {article.tags.map((tag) => (
              <View key={tag} className="rounded-lg bg-primary/10 px-2.5 py-1">
                <Text className="text-xs font-semibold text-primary">#{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Khung tác giả cuối bài. Mô tả chung vì hồ sơ tác giả chưa có tiểu sử riêng và không khẳng định chuyên môn. */}
        <View className="gap-3 rounded-3xl border border-border bg-card p-5">
          <View className="flex-row items-center gap-4">
            <UserAvatar name={article.author.name} uri={article.author.avatarUrl} size={64} className="border-2 border-primary/30" />
            <View className="flex-1 flex-row flex-wrap items-center gap-2">
              <Text className="shrink text-lg font-bold text-foreground">{article.author.name}</Text>
              <View className="rounded-full bg-primary/10 px-2 py-0.5">
                <Text className="text-xs font-medium text-primary">Tác giả</Text>
              </View>
            </View>
          </View>
          <Text className="text-sm leading-relaxed text-muted-foreground">
            Thành viên tâm huyết chia sẻ kinh nghiệm nấu món chay ngon, dinh dưỡng và gìn giữ văn hoá ẩm thực chay truyền thống.
          </Text>
        </View>

        {!isOwner ? <ReportButton targetType="POST" targetId={article.id} /> : null}

        {/* Cộng đồng: BLOG chỉ hỗ trợ upvote + bình luận (backend từ chối bookmark/rating) */}
        <CommunityPanel
          postId={article.id}
          showBookmark={false}
          showRating={false}
          commentPlaceholder="Chia sẻ cảm nhận hoặc câu hỏi về bài viết..."
        />

        {relatedArticles.length > 0 ? (
          <View className="gap-3 pt-2">
            <View className="gap-0.5">
              <Text className="text-xl font-bold text-foreground">Bài viết cẩm nang liên quan</Text>
              <Text className="text-xs text-muted-foreground">Khám phá thêm kiến thức dinh dưỡng và kinh nghiệm ăn chay cùng chuyên mục</Text>
            </View>
            <View className="gap-3">
              {relatedArticles.map((item) => (
                <Link key={item.id} href={`/articles/${item.id}` as Href} asChild>
                  <Pressable>
                    <PostCard post={item} />
                  </Pressable>
                </Link>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </SiteScreen>
  );
}
