import * as React from 'react';
import { Alert, Text, View } from 'react-native';
import { Link, type Href, useLocalSearchParams, useRouter } from 'expo-router';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { VideoForm } from '@/features/video/components/video-form';
import { useUpdateVideoMutation, useVideoDetailQuery } from '@/features/video/queries/video.queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/store/useAuthStore';

/** Sửa video của chính mình — `PATCH /posts/:id` rồi gửi lại duyệt. Author-only. */
export default function EditVideoScreen() {
  const router = useRouter();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: video, isLoading, isError } = useVideoDetailQuery(id ?? '');
  const updateMutation = useUpdateVideoMutation();

  const isOwner = !!currentUserId && video?.author.id === currentUserId;

  if (isLoading) {
    return (
      <SiteScreen>
        <View className="items-center justify-center px-5 py-20">
          <Text className="text-sm text-muted-foreground">Đang tải video...</Text>
        </View>
      </SiteScreen>
    );
  }

  if (isError || !video) {
    return (
      <SiteScreen>
        <View className="items-center px-5 py-16">
          <Text className="mt-4 text-xl font-bold text-foreground">Không tìm thấy video</Text>
          <View className="mt-6">
            <Link href={'/videos' as Href} asChild>
              <PrimaryButton label="Về danh sách video" />
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
          <Text className="mt-4 text-xl font-bold text-foreground">Bạn không có quyền sửa video này</Text>
          <Text className="mt-2 text-center text-sm text-muted-foreground">
            Chỉ tác giả mới có thể chỉnh sửa video của mình.
          </Text>
          <View className="mt-6">
            <Link href={`/videos/${video.id}` as Href} asChild>
              <PrimaryButton label="Về trang video" />
            </Link>
          </View>
        </View>
      </SiteScreen>
    );
  }

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <Text className="text-2xl font-extrabold tracking-tight text-foreground">Chỉnh sửa video</Text>

        <VideoForm
          initial={{
            title: video.title,
            excerpt: video.excerpt,
            youtubeUrl: video.videoUrl,
            body: video.summary,
            tags: video.tags,
            categoryId: video.category.id || null,
            coverMedia: video.coverMedia,
          }}
          submitLabel="Lưu thay đổi"
          isSubmitting={updateMutation.isPending}
          onSubmit={async (values) => {
            try {
              await updateMutation.mutateAsync({
                id: video.id,
                input: {
                  title: values.title,
                  excerpt: values.excerpt,
                  youtubeUrl: values.youtubeUrl,
                  body: values.body,
                  categoryIds: values.categoryIds,
                  tags: values.tags,
                  coverMedia: values.coverMedia,
                  expectedVersion: video.version,
                },
              });
              Alert.alert('Đã lưu', 'Video đã được cập nhật và gửi lại để duyệt.');
              router.replace(`/videos/${video.id}` as Href);
            } catch (error) {
              Alert.alert('Không lưu được', getApiErrorMessage(error, 'Vui lòng kiểm tra dữ liệu và thử lại.'));
            }
          }}
        />
      </View>
    </SiteScreen>
  );
}
