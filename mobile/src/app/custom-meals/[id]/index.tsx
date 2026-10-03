import { Alert, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link, type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Pencil, Trash2, Utensils } from 'lucide-react-native';
import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useCustomMealDetailQuery, useDeleteCustomMealMutation } from '@/features/custom-meal/queries/custom-meal.queries';
import { getCustomMealErrorMessage } from '@/features/custom-meal/utils/custom-meal-errors';
import { useIconColors } from '@/lib/theme-colors';

export default function CustomMealDetailScreen() {
  const colors = useIconColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: meal, isLoading, isError, refetch } = useCustomMealDetailQuery(id ?? '');
  const deleteMutation = useDeleteCustomMealMutation();

  const confirmDelete = () => {
    if (!meal) return;
    Alert.alert('Xóa bữa ăn', 'Nếu bữa ăn đang được dùng trong thực đơn, hệ thống có thể chặn xóa để giữ bản ghi thực đơn.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(meal.id);
            Alert.alert('Đã xóa', 'Bữa ăn đã được xóa.');
            router.replace('/custom-meals' as Href);
          } catch (error) {
            Alert.alert('Không xóa được', getCustomMealErrorMessage(error));
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8"><Text className="text-sm text-muted-foreground">Đang tải bữa ăn...</Text></View>
      </SiteScreen>
    );
  }

  if (isError || !meal) {
    return (
      <SiteScreen>
        <View className="items-center px-5 pt-8">
          <Text className="font-bold text-foreground">Không tìm thấy bữa ăn</Text>
          <PrimaryButton label="Thử lại" className="mt-4 w-full" onPress={() => void refetch()} />
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
          <Metric label="Phần" value={String(meal.servings)} />
          <Metric label="Calo" value={meal.calories === null ? 'Chưa nhập' : String(meal.calories)} />
          <Metric label="Nguyên liệu" value={String(meal.ingredientCount)} />
        </View>
        <View className="gap-2 rounded-2xl border border-border p-4">
          <Text className="font-bold text-foreground">Dinh dưỡng bạn nhập (mỗi bữa)</Text>
          <View className="flex-row gap-2">
            <Metric label="Đạm" value={formatGrams(meal.proteinGrams)} />
            <Metric label="Carb" value={formatGrams(meal.carbsGrams)} />
          </View>
          <View className="flex-row gap-2">
            <Metric label="Béo" value={formatGrams(meal.fatGrams)} />
            <Metric label="Xơ" value={formatGrams(meal.fiberGrams)} />
          </View>
          <Text className="text-[11px] text-muted-foreground">
            {meal.nutritionCoverageLabel}. Chỉ số để trống nghĩa là chưa có dữ liệu, không phải 0.
          </Text>
        </View>
        {meal.tags.length ? <Text className="text-sm text-muted-foreground">#{meal.tags.join(' #')}</Text> : null}
        <View className="gap-2 rounded-2xl border border-border p-4">
          <Text className="font-bold text-foreground">Nguyên liệu</Text>
          {meal.ingredients.map((item) => (
            <View key={item.id} className="flex-row items-center justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2">
              <View className="flex-1">
                <Text className="text-sm text-foreground">{item.displayName}</Text>
                <Text className="text-[11px] text-muted-foreground">
                  {item.ingredientId
                    ? `Nguyên liệu chuẩn${item.canonicalName ? `: ${item.canonicalName}` : ''}`
                    : 'Tên tự nhập (chưa liên kết danh mục)'}
                </Text>
              </View>
              <Text className="text-sm font-semibold text-primary">{item.amount} {item.unit}</Text>
            </View>
          ))}
        </View>
      </View>
    </SiteScreen>
  );
}

function formatGrams(value: number | null): string {
  return value === null ? 'Chưa nhập' : `${value} g`;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-2xl border border-border bg-card p-3">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="mt-1 text-lg font-extrabold text-primary">{value}</Text>
    </View>
  );
}
