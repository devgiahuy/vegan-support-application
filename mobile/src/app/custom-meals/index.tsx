import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { CustomMealCard } from '@/features/custom-meal/components/custom-meal-card';
import { useCustomMealsQuery } from '@/features/custom-meal/queries/custom-meal.queries';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

export default function CustomMealsScreen() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data, isLoading, isError, refetch } = useCustomMealsQuery({ limit: 50 });
  const allMeals = React.useMemo(() => data?.items ?? [], [data?.items]);
  const [activeTag, setActiveTag] = React.useState<string | null>(null);

  const tagCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const meal of allMeals) {
      for (const tag of meal.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [allMeals]);

  const meals = activeTag ? allMeals.filter((meal) => meal.tags.includes(activeTag)) : allMeals;

  if (!isAuthenticated) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8">
          <View className="items-center rounded-2xl border border-border p-6">
            <Text className="text-center text-lg font-bold text-foreground">Đăng nhập để tạo bữa ăn riêng</Text>
            <Text className="mt-2 text-center text-sm text-muted-foreground">
              Bữa ăn tự tạo là dữ liệu cá nhân, có thể đưa vào thực đơn tuần và phân tích dinh dưỡng.
            </Text>
            <Link href={'/(auth)/login' as Href} asChild>
              <PrimaryButton label="Đăng nhập" className="mt-4 w-full" />
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
            <Text className="text-2xl font-extrabold text-foreground">Bữa ăn tự tạo</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Lưu món riêng, tag cá nhân và dinh dưỡng tự nhập để dùng trong thực đơn tuần.
            </Text>
          </View>
          <Link href={'/custom-meals/new' as Href} asChild>
            <PrimaryButton label="Tạo" icon={<Plus size={16} color={colors.primaryForeground} />} />
          </Link>
        </View>

        {tagCounts.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
            <View className="flex-row gap-2">
              {[{ tag: null as string | null, count: allMeals.length }, ...tagCounts.map(([tag, count]) => ({ tag: tag as string | null, count }))].map(
                (option) => {
                  const selected = activeTag === option.tag;
                  return (
                    <Pressable
                      key={option.tag ?? 'all'}
                      onPress={() => setActiveTag(option.tag)}
                      className={cn('rounded-full px-3 py-1.5', selected ? 'bg-primary' : 'bg-muted')}>
                      <Text
                        className={cn(
                          'text-xs font-medium',
                          selected ? 'text-primary-foreground' : 'text-muted-foreground'
                        )}>
                        {option.tag ? `#${option.tag}` : 'Tất cả'} ({option.count})
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>
          </ScrollView>
        ) : null}

        {isLoading ? (
          [1, 2, 3].map((item) => <View key={item} className="h-56 rounded-2xl border border-border bg-muted" />)
        ) : isError ? (
          <View className="items-center rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <Text className="font-semibold text-destructive">Không tải được danh sách bữa ăn tự tạo.</Text>
            <PrimaryButton label="Thử lại" variant="outline" className="mt-3 w-full" onPress={() => void refetch()} />
          </View>
        ) : meals.length === 0 ? (
          <View className="items-center rounded-2xl border border-dashed border-border p-8">
            <Text className="text-center font-bold text-foreground">Chưa có bữa ăn riêng</Text>
            <Text className="mt-1 text-center text-sm text-muted-foreground">
              Tạo bữa đầu tiên với nguyên liệu, tag và dinh dưỡng bạn tự nhập.
            </Text>
            <Link href={'/custom-meals/new' as Href} asChild>
              <PrimaryButton label="Tạo bữa ăn" className="mt-4 w-full" />
            </Link>
          </View>
        ) : (
          meals.map((meal) => <CustomMealCard key={meal.id} meal={meal} />)
        )}
      </View>
    </SiteScreen>
  );
}
