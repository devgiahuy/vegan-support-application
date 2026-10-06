import { Pressable, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { CalendarDays, Plus } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { PlanCard } from '@/features/meal-plan/components/plan-card';
import { useInfiniteMealPlansQuery } from '@/features/meal-plan/queries/meal-plan.queries';
import { getMealPlanErrorMessage } from '@/features/meal-plan/utils/meal-plan-errors';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';

/** Lịch sử thực đơn đã lưu — đồng bộ `meal-plans/saved` của web, phân trang kiểu "Tải thêm". */
export default function SavedMealPlansScreen() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { data, error, isLoading, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteMealPlansQuery(10, isAuthenticated);

  const plans = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[0]?.metadata.totalItems ?? plans.length;

  if (!isAuthenticated) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8">
          <View className="items-center rounded-3xl border border-border bg-card p-6">
            <Text className="text-center text-xl font-bold text-foreground">Đăng nhập để xem thực đơn đã lưu</Text>
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
      <View className="gap-4 px-5 pt-4">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <CalendarDays size={18} color={colors.primary} />
              <Text className="text-2xl font-bold tracking-tight text-foreground">Thực đơn đã lưu</Text>
            </View>
            <Text className="mt-1 text-sm text-muted-foreground">
              {plans.length > 0 ? `${total} phiên bản thực đơn của bạn` : 'Lịch sử các thực đơn tuần bạn đã tạo.'}
            </Text>
          </View>
          <Link href={'/meal-plans' as Href} asChild>
            <Pressable className="flex-row items-center gap-1.5 rounded-full bg-primary px-3 py-2">
              <Plus size={13} color={colors.primaryForeground} />
              <Text className="text-xs font-semibold text-primary-foreground">Tạo mới</Text>
            </Pressable>
          </Link>
        </View>

        {isLoading ? (
          <LoadingState message="Đang tải thực đơn..." />
        ) : isError ? (
          <ErrorState
            title="Không tải được thực đơn."
            description={getMealPlanErrorMessage(error)}
            onRetry={() => void refetch()}
          />
        ) : plans.length === 0 ? (
          <EmptyState
            title="Chưa có thực đơn nào"
            description="Tạo thực đơn tuần đầu tiên để bắt đầu."
            icon={<CalendarDays size={22} color={colors.mutedForeground} />}
          />
        ) : (
          <View className="gap-3">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
            {hasNextPage ? (
              <PrimaryButton
                label={isFetchingNextPage ? 'Đang tải...' : 'Tải thêm'}
                variant="outline"
                loading={isFetchingNextPage}
                onPress={() => void fetchNextPage()}
              />
            ) : null}
          </View>
        )}
      </View>
    </SiteScreen>
  );
}
