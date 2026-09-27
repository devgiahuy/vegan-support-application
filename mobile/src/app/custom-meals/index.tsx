import { Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { CustomMealCard } from '@/features/custom-meal/components/custom-meal-card';
import { useCustomMealsQuery } from '@/features/custom-meal/queries/custom-meal.queries';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';

export default function CustomMealsScreen() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data, isLoading, isError, refetch } = useCustomMealsQuery({ limit: 20 });
  const meals = data?.items ?? [];

  if (!isAuthenticated) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8">
          <View className="items-center rounded-2xl border border-border p-6">
            <Text className="text-center text-lg font-bold text-foreground">Dang nhap de tao bua an rieng</Text>
            <Text className="mt-2 text-center text-sm text-muted-foreground">
              Custom meal la bua an ca nhan, co the dua vao meal plan va phan tich dinh duong.
            </Text>
            <Link href={'/(auth)/login' as Href} asChild>
              <PrimaryButton label="Dang nhap" className="mt-4 w-full" />
            </Link>
          </View>
        </View>
      </SiteScreen>
    );
  }

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text className="text-2xl font-extrabold text-foreground">Bua an tu tao</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Luu mon rieng, tag ca nhan va dinh duong tu nhap de dung trong meal plan.
            </Text>
          </View>
          <Link href={'/custom-meals/new' as Href} asChild>
            <PrimaryButton label="Tao" icon={<Plus size={16} color={colors.primaryForeground} />} />
          </Link>
        </View>

        {isLoading ? (
          [1, 2, 3].map((item) => <View key={item} className="h-56 rounded-2xl border border-border bg-muted" />)
        ) : isError ? (
          <View className="items-center rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <Text className="font-semibold text-destructive">Khong tai duoc custom meals.</Text>
            <PrimaryButton label="Thu lai" variant="outline" className="mt-3 w-full" onPress={() => void refetch()} />
          </View>
        ) : meals.length === 0 ? (
          <View className="items-center rounded-2xl border border-dashed border-border p-8">
            <Text className="text-center font-bold text-foreground">Chua co bua an rieng</Text>
            <Text className="mt-1 text-center text-sm text-muted-foreground">
              Tao bua dau tien voi nguyen lieu, tag va dinh duong ban tu nhap.
            </Text>
            <Link href={'/custom-meals/new' as Href} asChild>
              <PrimaryButton label="Tao bua an" className="mt-4 w-full" />
            </Link>
          </View>
        ) : (
          meals.map((meal) => <CustomMealCard key={meal.id} meal={meal} />)
        )}
      </View>
    </SiteScreen>
  );
}
