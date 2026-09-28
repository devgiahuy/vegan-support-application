import * as React from 'react';
import { Alert, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';

import { SiteScreen } from '@/components/layout/site-screen';
import { VideoForm } from '@/features/video/components/video-form';
import { useCreateVideoMutation } from '@/features/video/queries/video.queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/store/useAuthStore';

export default function CreateVideoScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const createVideoMutation = useCreateVideoMutation();

  React.useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert('Cần đăng nhập', 'Bạn cần đăng nhập để đăng video nấu ăn mới.');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, router]);

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <Text className="text-2xl font-extrabold text-foreground">Đăng video nấu ăn</Text>

        <VideoForm
          submitLabel="Gửi video"
          isSubmitting={createVideoMutation.isPending}
          onSubmit={async (values) => {
            try {
              const created = await createVideoMutation.mutateAsync({
                title: values.title,
                excerpt: values.excerpt,
                youtubeUrl: values.youtubeUrl,
                body: values.body,
                categoryIds: values.categoryIds,
                tags: values.tags,
                coverMedia: values.coverMedia,
              });
              Alert.alert('Đã gửi video', 'Video đã được gửi lên hệ thống nội dung.');
              router.replace(`/videos/${created.id}` as Href);
            } catch (error) {
              Alert.alert('Không đăng được video', getApiErrorMessage(error, 'Vui lòng kiểm tra dữ liệu và thử lại.'));
            }
          }}
        />
      </View>
    </SiteScreen>
  );
}
