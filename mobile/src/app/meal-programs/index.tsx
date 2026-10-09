import { Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { CalendarRange, Plus } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { LoadMoreButton } from '@/components/shared/load-more-button';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ProgramCard } from '@/features/meal-program/components/program-card';
import { useInfiniteMealProgramsQuery } from '@/features/meal-program/queries/meal-program.queries';
import { getMealProgramErrorMessage } from '@/features/meal-program/utils/meal-program-errors';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';

/** Danh sách lộ trình nhiều tuần của người dùng — đồng bộ `meal-programs` của web. */
export default function MealProgramsScreen() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data, error, isLoading, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteMealProgramsQuery({ limit: 20 });
  const programs = data?.pages.flatMap((page) => page.items) ?? [];

  if (!isAuthenticated) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8">
          <View className="items-center rounded-3xl border border-border bg-card p-6">
            <Text className="text-center text-xl font-bold text-foreground">Đăng nhập để tạo lộ trình</Text>
            <Text className="mt-2 text-center text-sm text-muted-foreground">
              Lộ trình nhiều tuần dùng hồ sơ sức khỏe và chế độ ăn của bạn nên cần tài khoản.
            </Text>
            <View className="mt-5 w-full">
              <Link href={'/(auth)/login' as Href} asChild>
                <PrimaryButton label="Đăng nhập ngay" />
              </Link>
            </View>
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
            <Text className="text-2xl font-extrabold text-foreground">Lộ trình nhiều tuần</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Tạo lộ trình 2-12 tuần, chọn phương án cho từng tuần và xem phân tích tích lũy.
            </Text>
          </View>
          <Link href={'/meal-programs/new' as Href} asChild>
            <PrimaryButton label="Tạo" icon={<Plus size={16} color={colors.primaryForeground} />} />
          </Link>
        </View>

        {isLoading ? (
          <LoadingState message="Đang tải lộ trình..." />
        ) : isError ? (
          <ErrorState
            title="Không tải được lộ trình."
            description={getMealProgramErrorMessage(error)}
            onRetry={() => void refetch()}
          />
        ) : programs.length === 0 ? (
          <EmptyState
            title="Chưa có lộ trình nào"
            description="Bắt đầu bằng lộ trình 2 tuần để hệ thống tạo các phương án thực đơn mỗi tuần."
            icon={<CalendarRange size={26} color={colors.primary} />}
            action={
              <Link href={'/meal-programs/new' as Href} asChild>
                <PrimaryButton label="Tạo lộ trình" />
              </Link>
            }
          />
        ) : (
          <View className="gap-3">
            {programs.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
            <LoadMoreButton
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onPress={() => void fetchNextPage()}
            />
          </View>
        )}
      </View>
    </SiteScreen>
  );
}
