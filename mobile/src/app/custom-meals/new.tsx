import { Alert, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { SiteScreen } from '@/components/layout/site-screen';
import { LoginRequired } from '@/components/shared/login-required';
import { CustomMealForm, toCustomMealCreateDto } from '@/features/custom-meal/components/custom-meal-form';
import { useCreateCustomMealMutation } from '@/features/custom-meal/queries/custom-meal.queries';
import { getCustomMealErrorMessage } from '@/features/custom-meal/utils/custom-meal-errors';
import { useAuthStore } from '@/store/useAuthStore';

export default function NewCustomMealScreen() {
  const router = useRouter();
  const mutation = useCreateCustomMealMutation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return (
      <SiteScreen>
        <LoginRequired title="Đăng nhập để tạo món ăn của bạn" />
      </SiteScreen>
    );
  }

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <Text className="text-2xl font-extrabold text-foreground">Tạo món ăn cá nhân mới</Text>
        <CustomMealForm
          submitLabel="Lưu món ăn cá nhân"
          isSubmitting={mutation.isPending}
          onSubmit={async (values) => {
            try {
              const created = await mutation.mutateAsync(toCustomMealCreateDto(values));
              Alert.alert('Đã tạo món ăn', 'Món ăn cá nhân đã được lưu.');
              router.replace(`/custom-meals/${created.id}` as Href);
            } catch (error) {
              Alert.alert('Không tạo được', getCustomMealErrorMessage(error, 'Vui lòng kiểm tra dữ liệu và thử lại.'));
            }
          }}
        />
      </View>
    </SiteScreen>
  );
}
