import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { CalendarRange, Filter, Plus, Target } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { LoadMoreButton } from '@/components/shared/load-more-button';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ProgramCard } from '@/features/meal-program/components/program-card';
import { useInfiniteMealProgramsQuery } from '@/features/meal-program/queries/meal-program.queries';
import { getMealProgramErrorMessage } from '@/features/meal-program/utils/meal-program-errors';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';

/** Bộ lọc trạng thái — chỉ gồm các trạng thái mà `GET /meal-programs?status=` hỗ trợ. */
const STATUS_FILTERS = [
  { value: undefined, label: 'Tất cả' },
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'PARTIAL', label: 'Một phần' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
] as const;

/** Danh sách lộ trình nhiều tuần của người dùng — đồng bộ `meal-programs` của web. */
export default function MealProgramsScreen() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [status, setStatus] = React.useState<string | undefined>(undefined);
  const { data, error, isLoading, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteMealProgramsQuery({ limit: 20, status });
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
      <View className="gap-5 px-5 pb-8 pt-4">
        <View className="gap-1 border-b border-border pb-5">
          <View className="flex-row items-center gap-1.5">
            <Target size={15} color={colors.primary} />
            <Text className="text-xs font-medium text-primary">Kế hoạch dài hạn</Text>
          </View>
          <Text className="text-2xl font-bold tracking-tight text-foreground">Lộ trình Dinh dưỡng Nhiều tuần</Text>
          <Text className="text-xs leading-5 text-muted-foreground">
            Thiết kế chương trình ăn chay 2-12 tuần theo mục tiêu cụ thể, chọn phương án cho từng tuần và xem phân
            tích dinh dưỡng tích lũy.
          </Text>
        </View>

        <Link href={'/meal-programs/new' as Href} asChild>
          <PrimaryButton label="Tạo lộ trình mới" icon={<Plus size={16} color={colors.primaryForeground} />} />
        </Link>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5" contentContainerClassName="px-5">
          <View className="flex-row items-center gap-1 rounded-lg bg-muted p-1">
            <View className="px-1.5">
              <Filter size={14} color={colors.mutedForeground} />
            </View>
            {STATUS_FILTERS.map((filter) => {
              const selected = filter.value === status;
              return (
                <Pressable
                  key={filter.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setStatus(filter.value)}
                  className={cn('rounded-md px-3 py-1.5', selected ? 'bg-background' : '')}>
                  <Text
                    className={cn(
                      'text-xs',
                      selected ? 'font-semibold text-foreground' : 'text-muted-foreground'
                    )}>
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

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
            title={status ? 'Không có lộ trình phù hợp' : 'Chưa có lộ trình nào'}
            description={
              status
                ? 'Chưa có lộ trình nào ở trạng thái này. Hãy thử chọn bộ lọc khác.'
                : 'Bắt đầu bằng lộ trình 2 tuần để hệ thống tạo các phương án thực đơn mỗi tuần.'
            }
            icon={<CalendarRange size={26} color={colors.primary} />}
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
