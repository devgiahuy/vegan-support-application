import * as React from 'react';
import { Alert, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';

import { SiteScreen } from '@/components/layout/site-screen';
import { RecipeForm } from '@/features/recipe/components/recipe-form';
import { useCreateRecipeMutation } from '@/features/recipe/queries/recipe.queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Đăng công thức mới — `POST /posts` (type=RECIPE) + `POST /posts/:id/submit` ngay
 * sau đó để gửi duyệt. Chưa hỗ trợ ảnh bìa (cần luồng upload Cloudinary riêng).
 */
export default function CreateRecipeScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const createMutation = useCreateRecipeMutation();

  React.useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert('Cần đăng nhập', 'Bạn cần đăng nhập để đăng công thức mới.');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, router]);

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <Text className="text-2xl font-extrabold tracking-tight text-foreground">Đăng công thức mới</Text>

        <RecipeForm
          submitLabel="Gửi công thức"
          isSubmitting={createMutation.isPending}
          onSubmit={async (values) => {
            try {
              const created = await createMutation.mutateAsync(values);
              Alert.alert('Đã gửi công thức', 'Công thức đã được gửi cho Ban biên tập kiểm duyệt.');
              router.replace(`/recipes/${created.id}` as Href);
            } catch (error) {
              Alert.alert('Không đăng được công thức', getApiErrorMessage(error, 'Vui lòng kiểm tra dữ liệu và thử lại.'));
            }
          }}
        />
      </View>
    </SiteScreen>
  );
}
