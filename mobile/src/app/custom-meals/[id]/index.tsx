import { Alert, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Pencil, Trash2, Utensils } from 'lucide-react-native';
import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useCustomMealDetailQuery, useDeleteCustomMealMutation } from '@/features/custom-meal/queries/custom-meal.queries';
import { getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';

export default function CustomMealDetailScreen() {
  const colors = useIconColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: meal, isLoading, isError, refetch } = useCustomMealDetailQuery(id ?? '');
  const deleteMutation = useDeleteCustomMealMutation();

  const confirmDelete = () => {
    if (!meal) return;
    Alert.alert('Xoa bua an', 'Neu bua an dang duoc dung trong meal plan, backend co the chan xoa de giu snapshot.', [
      { text: 'Huy', style: 'cancel' },
      {
        text: 'Xoa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(meal.id);
            Alert.alert('Da xoa', 'Bua an da duoc xoa.');
            router.replace('/custom-meals' as Href);
          } catch (error) {
            Alert.alert('Khong xoa duoc', getApiErrorMessage(error));
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8"><Text className="text-sm text-muted-foreground">Dang tai bua an...</Text></View>
      </SiteScreen>
    );
  }

  if (isError || !meal) {
    return (
      <SiteScreen>
        <View className="items-center px-5 pt-8">
          <Text className="font-bold text-foreground">Khong tim thay bua an</Text>
          <PrimaryButton label="Thu lai" className="mt-4 w-full" onPress={() => void refetch()} />
        </View>
      </SiteScreen>
    );
  }

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <View className="h-48 overflow-hidden rounded-2xl border border-border bg-muted">
          {meal.coverPhotoUrl ? (
            <Image source={{ uri: meal.coverPhotoUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <View className="h-full items-center justify-center">
              <Utensils size={32} color={colors.mutedForeground} />
            </View>
          )}
        </View>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-2xl font-extrabold text-foreground">{meal.name}</Text>
            {meal.notes ? <Text className="mt-2 text-sm text-muted-foreground">{meal.notes}</Text> : null}
          </View>
          <View className="flex-row gap-2">
            <Link href={`/custom-meals/${meal.id}/edit` as Href} asChild>
              <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Pencil size={16} color={colors.foreground} />
              </Pressable>
            </Link>
            <Pressable onPress={confirmDelete} className="h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 size={16} color={colors.destructive} />
            </Pressable>
          </View>
        </View>
        <View className="flex-row gap-2">
          <Metric label="Phan" value={String(meal.servings)} />
          <Metric label="Calo" value={meal.calories === null ? '-' : String(meal.calories)} />
          <Metric label="Nguyen lieu" value={String(meal.ingredientCount)} />
        </View>
        {meal.tags.length ? <Text className="text-sm text-muted-foreground">#{meal.tags.join(' #')}</Text> : null}
        <View className="gap-2 rounded-2xl border border-border p-4">
          <Text className="font-bold text-foreground">Nguyen lieu</Text>
          {meal.ingredients.map((item) => (
            <View key={item.id} className="flex-row justify-between rounded-xl bg-muted/50 px-3 py-2">
              <Text className="flex-1 text-sm text-foreground">{item.displayName}</Text>
              <Text className="text-sm font-semibold text-primary">{item.amount} {item.unit}</Text>
            </View>
          ))}
        </View>
      </View>
    </SiteScreen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-2xl border border-border bg-card p-3">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="mt-1 text-lg font-extrabold text-primary">{value}</Text>
    </View>
  );
}

