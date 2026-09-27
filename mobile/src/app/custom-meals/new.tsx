import { Alert, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { SiteScreen } from '@/components/layout/site-screen';
import { CustomMealForm, toCustomMealCreateDto } from '@/features/custom-meal/components/custom-meal-form';
import { useCreateCustomMealMutation } from '@/features/custom-meal/queries/custom-meal.queries';
import { getApiErrorMessage } from '@/lib/api-error';

export default function NewCustomMealScreen() {
  const router = useRouter();
  const mutation = useCreateCustomMealMutation();

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <Text className="text-2xl font-extrabold text-foreground">Tao bua an tu tao</Text>
        <CustomMealForm
          submitLabel="Luu bua an"
          isSubmitting={mutation.isPending}
          onSubmit={async (values) => {
            try {
              const created = await mutation.mutateAsync(toCustomMealCreateDto(values));
              Alert.alert('Da tao bua an', 'Bua an ca nhan da duoc luu.');
              router.replace(`/custom-meals/${created.id}` as Href);
            } catch (error) {
              Alert.alert('Khong tao duoc', getApiErrorMessage(error, 'Vui long kiem tra du lieu va thu lai.'));
            }
          }}
        />
      </View>
    </SiteScreen>
  );
}

