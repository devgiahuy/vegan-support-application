import { Alert, Text, View } from 'react-native';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { SiteScreen } from '@/components/layout/site-screen';
import { CustomMealForm, toCustomMealCreateDto } from '@/features/custom-meal/components/custom-meal-form';
import { useCustomMealDetailQuery, useUpdateCustomMealMutation } from '@/features/custom-meal/queries/custom-meal.queries';
import { getCustomMealErrorMessage } from '@/features/custom-meal/utils/custom-meal-errors';

export default function EditCustomMealScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const mealId = id ?? '';
  const { data: meal, isLoading } = useCustomMealDetailQuery(mealId);
  const mutation = useUpdateCustomMealMutation(mealId);

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <Text className="text-2xl font-extrabold text-foreground">Sửa bữa ăn</Text>
        {isLoading || !meal ? (
          <Text className="text-sm text-muted-foreground">Đang tải bữa ăn...</Text>
        ) : (
          <CustomMealForm
            initial={meal}
            submitLabel="Lưu thay đổi"
            isSubmitting={mutation.isPending}
            onSubmit={async (values) => {
              try {
                const updated = await mutation.mutateAsync(toCustomMealCreateDto(values));
                Alert.alert('Đã cập nhật', 'Bữa ăn đã được lưu.');
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
