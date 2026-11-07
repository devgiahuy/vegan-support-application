import * as React from 'react';
import { Alert, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';

import { SiteScreen } from '@/components/layout/site-screen';
import { ArticleForm } from '@/features/post/components/article-form';
import { useCreateArticleMutation } from '@/features/post/queries/post.queries';
import { getApiErrorDetail } from '@/lib/api-error';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Viết bài chia sẻ mới (Cẩm nang) — `POST /posts` (type=BLOG) +
 * `POST /posts/:id/submit` ngay sau đó để gửi duyệt. Ảnh bìa tải lên qua luồng
 * reserve → Cloudinary → commit và gắn bằng `assetId`.
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
          submitLabel="Gửi duyệt bài"
          isSubmitting={createMutation.isPending}
          onSubmit={async (values, action) => {
            try {
              const created = await createMutation.mutateAsync(values);
              Alert.alert(
                action === 'DRAFT' ? 'Đã lưu bản nháp' : 'Đã gửi bài viết',
                action === 'DRAFT'
                  ? 'Bài viết đã được lưu vào Bản nháp. Bạn có thể mở lại để chỉnh sửa và gửi duyệt sau.'
                  : 'Bài viết đã được gửi vào hàng đợi kiểm duyệt.'
              );
              router.replace(`/articles/${created.id}` as Href);
            } catch (error) {
              Alert.alert('Không đăng được bài viết', getApiErrorDetail(error, 'Vui lòng kiểm tra dữ liệu và thử lại.'));
            }
          }}
        />
      </View>
    </SiteScreen>
  );
}
