import * as React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { Plus, Search, Utensils } from 'lucide-react-native';
import { SiteScreen } from '@/components/layout/site-screen';
import { LoadMoreButton } from '@/components/shared/load-more-button';
import { PrimaryButton } from '@/components/ui/primary-button';
import { CustomMealCard } from '@/features/custom-meal/components/custom-meal-card';
import {
  useDeleteCustomMealMutation,
  useInfiniteCustomMealsQuery,
} from '@/features/custom-meal/queries/custom-meal.queries';
import type { CustomMeal } from '@/features/custom-meal/types/custom-meal.model';
import { getCustomMealErrorMessage } from '@/features/custom-meal/utils/custom-meal-errors';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';

export default function CustomMealsScreen() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data, isLoading, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteCustomMealsQuery({ limit: 20 });
  const meals = React.useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data?.pages]);
  const deleteMutation = useDeleteCustomMealMutation();
  const [search, setSearch] = React.useState('');

  // Backend chưa có tham số tìm theo tên nên lọc theo tên/mô tả trên các món đã tải (không dấu, không phân biệt hoa thường).
  const visibleMeals = React.useMemo(() => {
    const normalize = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
    const needle = normalize(search.trim());
    if (!needle) return meals;
    return meals.filter((meal) => normalize(`${meal.name} ${meal.notes ?? ''}`).includes(needle));
  }, [meals, search]);

  const confirmDelete = (meal: CustomMeal) => {
    Alert.alert(
      'Xóa món ăn',
      `Xóa "${meal.name}"? Nếu món đang được dùng trong thực đơn, hệ thống có thể chặn xóa để giữ bản ghi thực đơn.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () =>
            deleteMutation.mutate(meal.id, {
              onError: (error) => Alert.alert('Không xóa được', getCustomMealErrorMessage(error)),
            }),
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8">
          <View className="items-center rounded-2xl border border-border p-6">
            <Text className="text-center text-lg font-bold text-foreground">Đăng nhập để tạo món ăn của bạn</Text>
            <Text className="mt-2 text-center text-sm text-muted-foreground">
              Món ăn của tôi là dữ liệu cá nhân, có thể đưa vào thực đơn tuần và phân tích dinh dưỡng.
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
        <View>
          <View className="flex-row items-center gap-1.5">
            <Utensils size={14} color={colors.primary} />
            <Text className="text-sm font-semibold text-primary">Góc Bếp Cá Nhân</Text>
          </View>
          <Text className="mt-1 text-3xl font-bold tracking-tight text-foreground">Món ăn của tôi</Text>
          <Text className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Lưu giữ công thức nấu ăn thường nhật của riêng bạn, đính kèm ảnh thực tế và tùy chỉnh đưa vào thực đơn tuần.
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="h-11 flex-1 flex-row items-center gap-2 rounded-xl border border-input bg-card px-3">
            <Search size={16} color={colors.mutedForeground} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Tìm theo tên món ăn..."
              placeholderTextColor={colors.mutedForeground}
              className="flex-1 text-sm text-foreground"
            />
          </View>
          <Link href={'/custom-meals/new' as Href} asChild>
            <Pressable
              accessibilityRole="button"
              className="h-11 flex-row items-center justify-center gap-1.5 rounded-xl bg-primary px-4 active:opacity-90">
              <Plus size={16} color={colors.primaryForeground} />
              <Text numberOfLines={1} className="text-sm font-semibold text-primary-foreground">Tạo món mới</Text>
            </Pressable>
          </Link>
        </View>

        {isLoading ? (
          [1, 2].map((item) => <View key={item} className="h-72 rounded-2xl border border-border bg-muted" />)
        ) : isError ? (
          <View className="items-center rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <Text className="font-semibold text-destructive">Không tải được danh sách món ăn.</Text>
            <PrimaryButton label="Thử lại" variant="outline" className="mt-3 w-full" onPress={() => void refetch()} />
          </View>
        ) : meals.length === 0 ? (
          <View className="items-center rounded-2xl border border-dashed border-border p-8">
            <Text className="text-center font-bold text-foreground">Chưa có món ăn nào</Text>
            <Text className="mt-1 text-center text-sm text-muted-foreground">
              Tạo món ăn đầu tiên của bạn với nguyên liệu, thẻ phân loại và dinh dưỡng bạn tự nhập.
            </Text>
            <Link href={'/custom-meals/new' as Href} asChild>
              <PrimaryButton label="Tạo món mới" className="mt-4 w-full" />
            </Link>
          </View>
        ) : visibleMeals.length === 0 ? (
          <View className="items-center rounded-2xl border border-dashed border-border p-8">
            <Text className="text-center font-bold text-foreground">Không tìm thấy món ăn phù hợp</Text>
            <Text className="mt-1 text-center text-sm text-muted-foreground">
              Thử từ khóa khác{hasNextPage ? ', hoặc bấm "Tải thêm" để tìm trong các món còn lại.' : '.'}
            </Text>
            <LoadMoreButton
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onPress={() => void fetchNextPage()}
            />
          </View>
        ) : (
          <>
            {visibleMeals.map((meal) => (
              <CustomMealCard key={meal.id} meal={meal} onDelete={confirmDelete} />
            ))}
            <LoadMoreButton
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onPress={() => void fetchNextPage()}
            />
          </>
        )}
      </View>
    </SiteScreen>
  );
}
