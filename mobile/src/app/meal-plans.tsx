import * as React from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { Link, type Href, useRouter } from 'expo-router';
import { CalendarDays, ChevronLeft, ChevronRight, LogIn, Plus, RefreshCw, Sparkles } from 'lucide-react-native';

import { MealPlanGoal } from '@/common/enums';
import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useGenerateMealPlanMutation, useMealPlansQuery } from '@/features/meal-plan/queries/meal-plan.queries';
import type { MealPlan } from '@/features/meal-plan/types/meal-plan.model';
import { createIdempotencyKey, getMondayDateString, shiftWeek } from '@/features/meal-plan/utils/idempotency';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const GOALS = [
  { value: MealPlanGoal.MAINTAIN, label: 'Giữ cân', description: 'Cân bằng năng lượng theo hồ sơ sức khỏe' },
  { value: MealPlanGoal.LOSE, label: 'Giảm cân', description: 'Giảm nhẹ mục tiêu calo hằng ngày' },
  { value: MealPlanGoal.GAIN, label: 'Tăng cân', description: 'Tăng nhẹ năng lượng cho cả tuần' },
];

function getMealPlanErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error);
  if (code === 'HEALTH_PROFILE_INCOMPLETE') {
    return 'Hãy cập nhật hồ sơ sức khỏe trước khi tạo thực đơn.';
  }
  if (code === 'DIET_SCHEDULE_REQUIRED') {
    return 'Bạn cần chọn ngày thực hành ăn chay trong tuần này ở hồ sơ.';
  }
  if (code === 'AUTH_REQUIRED' || code === 'INVALID_ACCESS_TOKEN' || code === 'TOKEN_EXPIRED') {
    return 'Bạn cần đăng nhập để xem và tạo thực đơn.';
  }
  return getApiErrorMessage(error, 'Không thể hoàn tất thao tác. Vui lòng thử lại.');
}

function PlanCard({ plan }: { plan: MealPlan }) {
  return (
    <Link href={{ pathname: '/meal-plans/[id]', params: { id: plan.id } } as unknown as Href} asChild>
      <Pressable className="rounded-2xl border border-border bg-card p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-base font-bold text-foreground">Tuần {plan.formattedWeekRange}</Text>
            <Text className="mt-1 text-xs text-muted-foreground">
              {plan.goalLabel} · {plan.filledSlots}/{plan.totalSlots} bữa · v{plan.version}
            </Text>
          </View>
          <View className="rounded-full bg-primary/10 px-2.5 py-1">
            <Text className="text-xs font-semibold text-primary">{plan.targetCalories} kcal</Text>
          </View>
        </View>
        {plan.warnings.length > 0 ? (
          <Text className="mt-3 text-xs text-amber-700">{plan.warnings.length} lưu ý cần xem</Text>
        ) : null}
      </Pressable>
    </Link>
  );
}

function LoginRequiredCard() {
  const colors = useIconColors();

  return (
    <View className="items-center rounded-2xl border border-dashed border-border p-7">
      <LogIn size={20} color={colors.primary} />
      <Text className="mt-2 text-center font-semibold text-foreground">Cần đăng nhập</Text>
      <Text className="mt-1 text-center text-sm text-muted-foreground">
        Meal plan là dữ liệu cá nhân, cần tài khoản để backend áp dụng hồ sơ sức khỏe và luật ăn chay của bạn.
      </Text>
      <View className="mt-4 w-full">
        <Link href="/(auth)/login" asChild>
          <PrimaryButton label="Đăng nhập" />
        </Link>
      </View>
    </View>
  );
}

export default function MealPlansScreen() {
  const colors = useIconColors();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [weekStart, setWeekStart] = React.useState(() => getMondayDateString());
  const [goal, setGoal] = React.useState(MealPlanGoal.MAINTAIN);

  const { data, error, isLoading, isError, refetch } = useMealPlansQuery({ limit: 10 }, isAuthenticated);
  const generateMutation = useGenerateMealPlanMutation();
  const plans = data?.items ?? [];

  const generatePlan = async () => {
    if (!isAuthenticated) {
      Alert.alert('Cần đăng nhập', 'Bạn cần đăng nhập để tạo thực đơn tuần.');
      return;
    }

    try {
      const plan = await generateMutation.mutateAsync({
        weekStart,
        goal,
        idempotencyKey: createIdempotencyKey('mobile-meal-plan-generate'),
      });
      router.push({ pathname: '/meal-plans/[id]', params: { id: plan.id } } as unknown as Href);
    } catch (mutationError) {
      Alert.alert('Không tạo được thực đơn', getMealPlanErrorMessage(mutationError));
    }
  };

  return (
    <SiteScreen>
      <View className="px-5 pt-4">
        <View className="flex-row items-center gap-2">
          <CalendarDays size={18} color={colors.primary} />
          <Text className="text-xl font-bold text-foreground">Meal plan / thực đơn</Text>
        </View>
        <Text className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Tạo thực đơn 7 ngày theo hồ sơ sức khỏe, luật ăn chay, dị ứng và mục tiêu năng lượng.
        </Text>

        <View className="mt-5 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-foreground">Tuần bắt đầu</Text>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => setWeekStart((current) => shiftWeek(current, -1))}
                className="h-9 w-9 items-center justify-center rounded-full bg-muted">
                <ChevronLeft size={16} color={colors.foreground} />
              </Pressable>
              <Text className="min-w-24 text-center text-sm font-semibold text-foreground">{weekStart}</Text>
              <Pressable
                onPress={() => setWeekStart((current) => shiftWeek(current, 1))}
                className="h-9 w-9 items-center justify-center rounded-full bg-muted">
                <ChevronRight size={16} color={colors.foreground} />
              </Pressable>
            </View>
          </View>

          <Text className="mt-4 text-sm font-semibold text-foreground">Mục tiêu</Text>
          <View className="mt-2 gap-2">
            {GOALS.map((item) => {
              const selected = goal === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => setGoal(item.value)}
                  className={cn('rounded-xl border p-3', selected ? 'border-primary bg-primary/10' : 'border-border bg-background')}>
                  <Text className={cn('text-sm font-semibold', selected ? 'text-primary' : 'text-foreground')}>
                    {item.label}
                  </Text>
                  <Text className="mt-1 text-xs text-muted-foreground">{item.description}</Text>
                </Pressable>
              );
            })}
          </View>

          <View className="mt-4">
            <PrimaryButton
              label={generateMutation.isPending ? 'Đang tạo thực đơn...' : 'Tạo thực đơn tuần'}
              loading={generateMutation.isPending}
              icon={<Sparkles size={16} color={colors.primaryForeground} />}
              onPress={() => void generatePlan()}
            />
          </View>
        </View>

        <View className="mt-7 flex-row items-center justify-between">
          <Text className="text-lg font-bold text-foreground">Thực đơn đã lưu</Text>
          {isAuthenticated ? (
            <Pressable onPress={() => void refetch()} className="h-9 w-9 items-center justify-center rounded-full bg-muted">
              <RefreshCw size={15} color={colors.foreground} />
            </Pressable>
          ) : null}
        </View>

        <View className="mt-3 gap-3">
          {!isAuthenticated ? (
            <LoginRequiredCard />
          ) : isLoading ? (
            <View className="items-center rounded-2xl border border-border p-6">
              <ActivityIndicator color={colors.primary} />
              <Text className="mt-3 text-sm text-muted-foreground">Đang tải thực đơn...</Text>
            </View>
          ) : isError ? (
            <View className="items-center rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
              <Text className="text-center font-semibold text-destructive">Không tải được danh sách thực đơn.</Text>
              <Text className="mt-2 text-center text-sm text-muted-foreground">{getMealPlanErrorMessage(error)}</Text>
              <View className="mt-4">
                <PrimaryButton label="Thử lại" variant="outline" onPress={() => void refetch()} />
              </View>
            </View>
          ) : plans.length === 0 ? (
            <View className="items-center rounded-2xl border border-dashed border-border p-7">
              <Plus size={20} color={colors.primary} />
              <Text className="mt-2 text-center font-semibold text-foreground">Chưa có thực đơn nào</Text>
              <Text className="mt-1 text-center text-sm text-muted-foreground">
                Chọn tuần và mục tiêu phía trên để tạo thực đơn đầu tiên.
              </Text>
            </View>
          ) : (
            plans.map((plan) => <PlanCard key={plan.id} plan={plan} />)
          )}
        </View>
      </View>
    </SiteScreen>
  );
}
