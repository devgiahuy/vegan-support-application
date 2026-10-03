import { Alert, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { SiteScreen } from '@/components/layout/site-screen';
import { CustomMealForm, toCustomMealCreateDto } from '@/features/custom-meal/components/custom-meal-form';
import { useCreateCustomMealMutation } from '@/features/custom-meal/queries/custom-meal.queries';
import { getCustomMealErrorMessage } from '@/features/custom-meal/utils/custom-meal-errors';

export default function NewCustomMealScreen() {
  const router = useRouter();
  const mutation = useCreateCustomMealMutation();

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <Text className="text-2xl font-extrabold text-foreground">Tạo bữa ăn tự tạo</Text>
        <CustomMealForm
          submitLabel="Lưu bữa ăn"
          isSubmitting={mutation.isPending}
          onSubmit={async (values) => {
            try {
              const created = await mutation.mutateAsync(toCustomMealCreateDto(values));
              Alert.alert('Đã tạo bữa ăn', 'Bữa ăn cá nhân đã được lưu.');
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
