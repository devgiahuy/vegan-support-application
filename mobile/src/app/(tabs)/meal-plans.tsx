import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link, type Href, useRouter } from 'expo-router';
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
} from 'lucide-react-native';

import { MealPlanGoal } from '@/common/enums';
import { SiteScreen } from '@/components/layout/site-screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/state-views';
import { DropdownField } from '@/components/ui/dropdown-field';
import { PrimaryButton } from '@/components/ui/primary-button';
import { PlanCard } from '@/features/meal-plan/components/plan-card';
import { useGenerateMealPlanMutation, useMealPlansQuery } from '@/features/meal-plan/queries/meal-plan.queries';
import { createIdempotencyKey, getMondayDateString, shiftWeek } from '@/features/meal-plan/utils/idempotency';
import { getMealPlanErrorMessage } from '@/features/meal-plan/utils/meal-plan-errors';
import { getApiErrorCode } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const GOALS = [
  { value: MealPlanGoal.MAINTAIN, label: 'Giữ cân', description: 'Ăn đủ năng lượng duy trì' },
  { value: MealPlanGoal.LOSE, label: 'Giảm cân', description: 'Thâm hụt nhẹ, đủ đạm' },
  { value: MealPlanGoal.GAIN, label: 'Tăng cân', description: 'Dư nhẹ, tăng cơ lành mạnh' },
];

const RECENT_PLAN_LIMIT = 5;

function LoginRequiredCard() {
  const colors = useIconColors();

  return (
    <View className="items-center rounded-2xl border border-dashed border-border p-7">
      <CalendarDays size={22} color={colors.primary} />
      <Text className="mt-2 text-center font-semibold text-foreground">Cần đăng nhập</Text>
      <Text className="mt-1 text-center text-sm text-muted-foreground">
        Thực đơn là dữ liệu cá nhân, cần tài khoản để áp dụng hồ sơ sức khỏe và luật ăn chay của bạn.
      </Text>
      <View className="mt-4 w-full">
        <Link href="/(auth)/login" asChild>
          <PrimaryButton label="Đăng nhập" />
        </Link>
      </View>
    </View>
  );
}

/**
 * "Kế hoạch bữa ăn" — tối ưu cho điện thoại:
 * Form tạo thực đơn tuần (nút tuần 44dp, mục tiêu rõ ràng) -> Lưới 2x2 lối tắt công cụ bếp
 * -> Phiên bản thực đơn gần đây.
 */
export default function MealPlansScreen() {
  const colors = useIconColors();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [weekStart, setWeekStart] = React.useState(() => getMondayDateString());
  const [goal, setGoal] = React.useState(MealPlanGoal.MAINTAIN);
  const [supersedesId, setSupersedesId] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);

  const { data, error, isLoading, isError, refetch } = useMealPlansQuery(
    { page: 1, limit: RECENT_PLAN_LIMIT },
    isAuthenticated
  );
  const generateMutation = useGenerateMealPlanMutation();
  const plans = data?.items ?? [];

  const generatePlan = async () => {
    setFormError(null);
    try {
      const plan = await generateMutation.mutateAsync({
        weekStart,
        goal,
        idempotencyKey: createIdempotencyKey('mobile-meal-plan-generate'),
        ...(supersedesId ? { supersedesMealPlanId: supersedesId } : {}),
      });
      router.push({ pathname: '/meal-plans/[id]', params: { id: plan.id } } as unknown as Href);
    } catch (mutationError) {
      setFormError(getMealPlanErrorMessage(mutationError));
    }
  };

  return (
    <SiteScreen onRefresh={isAuthenticated ? () => refetch() : undefined}>
      <View className="gap-4 px-5 pt-3.5">
        <Text className="text-sm leading-relaxed text-muted-foreground">
          Tạo thực đơn chay 7 ngày theo mục tiêu, đúng thiết lập ăn uống và hồ sơ sức khỏe của bạn.
        </Text>

        <View className="rounded-2xl border border-border bg-card p-4">
          <Text className="text-base font-bold text-foreground">Tạo thực đơn mới</Text>

          {formError ? (
            <View className="mt-3 flex-row items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
              <AlertCircle size={15} color={colors.destructive} />
              <View className="flex-1">
                <Text className="text-sm text-destructive">{formError}</Text>
                {getApiErrorCode(generateMutation.error) === 'HEALTH_PROFILE_INCOMPLETE' ? (
                  <Link href={'/profile' as Href} asChild>
                    <Pressable className="min-h-10 justify-center">
                      <Text className="mt-1 text-sm font-semibold text-primary underline">Tới hồ sơ sức khỏe</Text>
                    </Pressable>
                  </Link>
                ) : null}
              </View>
            </View>
          ) : null}

          <View className="mt-4 flex-row items-center justify-between gap-2">
            <Text className="flex-1 text-sm font-semibold text-foreground">Tuần bắt đầu (Thứ 2)</Text>
            <View className="flex-row items-center gap-1.5">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tuần trước"
                onPress={() => setWeekStart((current) => shiftWeek(current, -1))}
                className="h-11 w-11 items-center justify-center rounded-full bg-muted active:opacity-80">
                <ChevronLeft size={18} color={colors.foreground} />
              </Pressable>
              <Text className="min-w-24 text-center text-sm font-semibold text-foreground">{weekStart}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tuần sau"
                onPress={() => setWeekStart((current) => shiftWeek(current, 1))}
                className="h-11 w-11 items-center justify-center rounded-full bg-muted active:opacity-80">
                <ChevronRight size={18} color={colors.foreground} />
              </Pressable>
            </View>
          </View>

          <Text className="mt-4 text-sm font-semibold text-foreground">Mục tiêu</Text>
          <View className="mt-2 gap-2" accessibilityRole="radiogroup">
            {GOALS.map((item) => {
              const selected = goal === item.value;
              return (
                <Pressable
                  key={item.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setGoal(item.value)}
                  className={cn(
                    'min-h-12 flex-row items-center justify-between rounded-xl border p-3',
                    selected ? 'border-primary bg-primary/10' : 'border-border bg-background active:bg-muted/40'
                  )}>
                  <View className="flex-1">
                    <Text className={cn('text-sm font-semibold', selected ? 'text-primary' : 'text-foreground')}>
                      {item.label}
                    </Text>
                    <Text className="mt-0.5 text-xs text-muted-foreground">{item.description}</Text>
                  </View>
                  {selected ? (
                    <View className="h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <Check size={12} color={colors.primaryForeground} strokeWidth={3} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {plans.length > 0 ? (
            <View className="mt-4 flex-row items-center justify-between gap-3">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">Tạo lại từ phiên bản</Text>
                <Text className="text-xs text-muted-foreground">(tùy chọn)</Text>
              </View>
              <DropdownField<string | null>
                className="w-44"
                label="Chọn phiên bản"
                value={supersedesId}
                options={[
                  { value: null, label: 'Tạo mới hoàn toàn', shortLabel: 'Tạo mới' },
                  ...plans.map((plan) => ({
                    value: plan.id as string | null,
                    label: `${plan.formattedWeekRange} · bản ${plan.version}`,
                  })),
                ]}
                onChange={setSupersedesId}
              />
            </View>
          ) : null}

          <View className="mt-4">
            <PrimaryButton
              label={generateMutation.isPending ? 'Đang tạo thực đơn...' : 'Tạo thực đơn tuần'}
              loading={generateMutation.isPending}
              icon={<Sparkles size={16} color={colors.primaryForeground} />}
              onPress={() => void generatePlan()}
            />
          </View>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-foreground">Phiên bản gần đây</Text>
            {plans.length > 0 ? (
              <Link href={'/meal-plans/saved' as Href} asChild>
                <Pressable accessibilityRole="link" className="min-h-11 flex-row items-center gap-1 px-1">
                  <Text className="text-xs font-semibold text-primary">Xem tất cả</Text>
                  <ArrowRight size={13} color={colors.primary} />
                </Pressable>
              </Link>
            ) : null}
          </View>

          {!isAuthenticated ? (
            <LoginRequiredCard />
          ) : isLoading ? (
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
              description="Tạo thực đơn đầu tiên ở biểu mẫu phía trên — hệ thống sẽ cân đối 21 bữa theo mục tiêu của bạn."
              icon={<Plus size={20} color={colors.primary} />}
            />
          ) : (
            plans.map((plan) => <PlanCard key={plan.id} plan={plan} />)
          )}
        </View>
      </View>
    </SiteScreen>
  );
}
