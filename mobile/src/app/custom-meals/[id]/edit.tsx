import { Alert, Text, View } from 'react-native';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { SiteScreen } from '@/components/layout/site-screen';
import { CustomMealForm, toCustomMealCreateDto } from '@/features/custom-meal/components/custom-meal-form';
import { useCustomMealDetailQuery, useUpdateCustomMealMutation } from '@/features/custom-meal/queries/custom-meal.queries';
import { getApiErrorMessage } from '@/lib/api-error';

export default function EditCustomMealScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const mealId = id ?? '';
  const { data: meal, isLoading } = useCustomMealDetailQuery(mealId);
  const mutation = useUpdateCustomMealMutation(mealId);

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <Text className="text-2xl font-extrabold text-foreground">Sua bua an</Text>
        {isLoading || !meal ? (
          <Text className="text-sm text-muted-foreground">Dang tai bua an...</Text>
        ) : (
          <CustomMealForm
            initial={meal}
            submitLabel="Luu thay doi"
            isSubmitting={mutation.isPending}
            onSubmit={async (values) => {
              try {
                const updated = await mutation.mutateAsync(toCustomMealCreateDto(values));
                Alert.alert('Da cap nhat', 'Bua an da duoc luu.');
                router.replace(`/custom-meals/${updated.id}` as Href);
              } catch (error) {
                Alert.alert('Khong luu duoc', getApiErrorMessage(error));
              }
            }}
          />
        )}
      </View>
    </SiteScreen>
  );
}

