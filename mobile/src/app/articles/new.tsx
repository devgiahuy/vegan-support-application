import * as React from 'react';
import { Alert, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';

import { SiteScreen } from '@/components/layout/site-screen';
import { ArticleForm } from '@/features/post/components/article-form';
import { useCreateArticleMutation } from '@/features/post/queries/post.queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Viết bài chia sẻ mới (Cẩm nang) — `POST /posts` (type=BLOG) +
 * `POST /posts/:id/submit` ngay sau đó để gửi duyệt. Chưa hỗ trợ ảnh bìa (cần
 * luồng upload Cloudinary riêng, ngoài phạm vi task này).
 */
export default function CreateArticleScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const createMutation = useCreateArticleMutation();

  React.useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert('Cần đăng nhập', 'Bạn cần đăng nhập để viết bài chia sẻ mới.');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, router]);

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <Text className="text-2xl font-extrabold tracking-tight text-foreground">Viết bài chia sẻ mới</Text>

        <ArticleForm
          submitLabel="Gửi bài viết"
          isSubmitting={createMutation.isPending}
          onSubmit={async (values) => {
            try {
              const created = await createMutation.mutateAsync(values);
              Alert.alert('Đã gửi bài viết', 'Bài viết đã được gửi cho Ban biên tập kiểm duyệt.');
              router.replace(`/articles/${created.id}` as Href);
            } catch (error) {
              Alert.alert('Không đăng được bài viết', getApiErrorMessage(error, 'Vui lòng kiểm tra dữ liệu và thử lại.'));
            }
          }}
        />
      </View>
    </SiteScreen>
  );
}
