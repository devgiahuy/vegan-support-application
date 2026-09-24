import * as React from 'react';
import { Pressable, Share, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href, useLocalSearchParams } from 'expo-router';
import { AlertTriangle, ArrowLeft, Clock, Hourglass, Share2 } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { PostCard } from '@/features/post/components/post-card';
import { useArticleDetailQuery, useRelatedArticlesQuery } from '@/features/post/queries/post.queries';
import { CommunityPanel } from '@/features/community/components/community-panel';
import { PostStatus } from '@/common/enums';
import { useIconColors } from '@/lib/theme-colors';

/**
 * Chi tiết bài viết Cẩm nang — đồng bộ `frontend/src/app/(site)/articles/[id]/page.tsx`:
 * ảnh bìa, nội dung đầy đủ, tác giả, tag, bài liên quan cùng danh mục, khối cộng đồng
 * (upvote/bình luận — BLOG không hỗ trợ lưu/đánh giá theo backend).
 */
export default function ArticleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useIconColors();
  const { data: article, isLoading, isError, refetch } = useArticleDetailQuery(id ?? '');
  const { data: relatedArticles = [] } = useRelatedArticlesQuery(article?.id ?? '');

  const handleShare = () => {
    if (!article) return;
    void Share.share({ message: `${article.title} — VeggieConnect`, title: article.title });
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
          <View className="mt-6 flex-row gap-3">
            <Link href={'/articles' as Href} asChild>
              <PrimaryButton
                label="Quay lại danh sách"
                variant="outline"
                icon={<ArrowLeft size={16} color={colors.foreground} />}
              />
            </Link>
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

        <View className="aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted">
          <Image source={{ uri: article.coverImageUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        </View>

        <View className="gap-3">
          <View className="flex-row flex-wrap items-center gap-2">
            <View className="rounded-full bg-primary/10 px-2.5 py-1">
              <Text className="text-xs font-semibold text-primary">{article.category.name}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Clock size={12} color={colors.mutedForeground} />
              <Text className="text-xs text-muted-foreground">{article.readingTimeMinutes} phút đọc</Text>
            </View>
            {article.formattedPublishedAt ? (
              <Text className="text-xs text-muted-foreground">• {article.formattedPublishedAt}</Text>
            ) : null}
          </View>

          <Text className="text-2xl font-extrabold tracking-tight text-foreground">{article.title}</Text>

          {article.excerpt ? (
            <Text className="text-sm leading-relaxed text-muted-foreground">{article.excerpt}</Text>
          ) : null}

          <View className="flex-row items-center gap-2">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Text className="text-xs font-bold text-primary">{article.author.name.charAt(0)}</Text>
            </View>
            <Text className="flex-1 text-sm font-semibold text-foreground">{article.author.name}</Text>
          </View>
        </View>

        <View className="gap-2">
          <PrimaryButton
            label="Chia sẻ"
            variant="outline"
            icon={<Share2 size={16} color={colors.foreground} />}
            onPress={handleShare}
          />
        </View>

        <View className="rounded-2xl border border-border p-4">
          <Text className="text-sm leading-relaxed text-foreground">
            {article.content || 'Đang cập nhật nội dung cho bài viết này...'}
          </Text>
        </View>

        {article.tags.length > 0 ? (
          <View className="flex-row flex-wrap gap-2">
            {article.tags.map((tag) => (
              <View key={tag} className="rounded-md bg-muted px-2.5 py-1">
                <Text className="text-xs font-medium text-muted-foreground">#{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Cộng đồng: BLOG chỉ hỗ trợ upvote + bình luận (backend từ chối bookmark/rating) */}
        <CommunityPanel
          postId={article.id}
          showBookmark={false}
          showRating={false}
          commentPlaceholder="Chia sẻ cảm nhận hoặc câu hỏi về bài viết..."
        />

        {relatedArticles.length > 0 ? (
          <View className="gap-3 pt-2">
            <Text className="text-lg font-bold text-foreground">Bài viết liên quan</Text>
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
