import { Alert, Text, View } from 'react-native';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { SiteScreen } from '@/components/layout/site-screen';
import { ErrorState, LoadingState } from '@/components/shared/state-views';
import { LoginRequired } from '@/components/shared/login-required';
import { CustomMealForm, toCustomMealCreateDto } from '@/features/custom-meal/components/custom-meal-form';
import { useCustomMealDetailQuery, useUpdateCustomMealMutation } from '@/features/custom-meal/queries/custom-meal.queries';
import { getCustomMealErrorMessage } from '@/features/custom-meal/utils/custom-meal-errors';
import { useAuthStore } from '@/store/useAuthStore';

export default function EditCustomMealScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const mealId = id ?? '';
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data: meal, isLoading, isError, error, refetch } = useCustomMealDetailQuery(mealId);
  const mutation = useUpdateCustomMealMutation(mealId);

  if (!isAuthenticated) {
    return (
      <SiteScreen>
        <LoginRequired title="Đăng nhập để sửa món ăn" />
      </SiteScreen>
    );
  }

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <Text className="text-2xl font-extrabold text-foreground">{meal ? `Chỉnh sửa món ăn: ${meal.name}` : 'Chỉnh sửa món ăn'}</Text>
        {isLoading ? (
          <LoadingState message="Đang tải món ăn..." />
        ) : isError || !meal ? (
          <ErrorState
            title="Không tải được món ăn."
            description={getCustomMealErrorMessage(error)}
            onRetry={() => void refetch()}
          />
        ) : (
          <CustomMealForm
            initial={meal}
            submitLabel="Lưu thay đổi"
            isSubmitting={mutation.isPending}
            onSubmit={async (values) => {
              try {
                const updated = await mutation.mutateAsync(toCustomMealCreateDto(values));
                Alert.alert('Đã cập nhật', 'Món ăn đã được lưu.');
                router.replace(`/custom-meals/${updated.id}` as Href);
              } catch (error) {
                Alert.alert('Không lưu được', getCustomMealErrorMessage(error));
              }
            }}
          />
        )}
      </View>
    </SiteScreen>
  );
}
