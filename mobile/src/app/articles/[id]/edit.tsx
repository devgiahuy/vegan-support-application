import * as React from 'react';
import { Alert, Text, View } from 'react-native';
import { Link, type Href, useLocalSearchParams, useRouter } from 'expo-router';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ArticleForm } from '@/features/post/components/article-form';
import { useArticleDetailQuery, useUpdateArticleMutation } from '@/features/post/queries/post.queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/store/useAuthStore';

/** Sửa bài viết của chính mình — `PATCH /posts/:id` rồi gửi lại duyệt. Author-only. */
export default function EditArticleScreen() {
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: article, isLoading, isError } = useArticleDetailQuery(id ?? '');
  const updateMutation = useUpdateArticleMutation();

  const isOwner = !!currentUserId && article?.author.id === currentUserId;

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
          <Text className="mt-4 text-xl font-bold text-foreground">Không tìm thấy bài viết</Text>
          <View className="mt-6">
            <Link href={'/articles' as Href} asChild>
              <PrimaryButton label="Về danh sách bài viết" />
            </Link>
          </View>
        </View>
      </SiteScreen>
    );
  }

  if (!isOwner) {
    return (
      <SiteScreen>
        <View className="items-center px-5 py-16">
          <Text className="mt-4 text-xl font-bold text-foreground">Bạn không có quyền sửa bài viết này</Text>
          <Text className="mt-2 text-center text-sm text-muted-foreground">
            Chỉ tác giả mới có thể chỉnh sửa bài viết của mình.
          </Text>
          <View className="mt-6">
            <Link href={`/articles/${article.id}` as Href} asChild>
              <PrimaryButton label="Về trang bài viết" />
            </Link>
          </View>
        </View>
      </SiteScreen>
    );
  }

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <Text className="text-2xl font-extrabold tracking-tight text-foreground">Chỉnh sửa bài viết</Text>

        <ArticleForm
          initial={{
            title: article.title,
            excerpt: article.excerpt,
            body: article.content,
            tags: article.tags,
            categoryId: article.category.id || null,
          }}
          submitLabel="Lưu thay đổi"
          isSubmitting={updateMutation.isPending}
          onSubmit={async (values) => {
            try {
              await updateMutation.mutateAsync({
                id: article.id,
                input: { ...values, expectedVersion: article.version },
              });
              Alert.alert('Đã lưu', 'Bài viết đã được cập nhật và gửi lại để duyệt.');
              router.replace(`/articles/${article.id}` as Href);
            } catch (error) {
              Alert.alert('Không lưu được', getApiErrorMessage(error, 'Vui lòng kiểm tra dữ liệu và thử lại.'));
            }
          }}
        />
      </View>
    </SiteScreen>
  );
}
