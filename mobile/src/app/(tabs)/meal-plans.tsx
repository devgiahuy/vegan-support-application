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
  Target,
  Utensils,
} from 'lucide-react-native';

import { MealPlanGoal } from '@/common/enums';
import { SiteScreen } from '@/components/layout/site-screen';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { PlanCard } from '@/features/meal-plan/components/plan-card';
import { useGenerateMealPlanMutation, useMealPlansQuery } from '@/features/meal-plan/queries/meal-plan.queries';
import { createIdempotencyKey, getMondayDateString, shiftWeek } from '@/features/meal-plan/utils/idempotency';
import { getMealPlanErrorMessage } from '@/features/meal-plan/utils/meal-plan-errors';
import { getApiErrorCode, getApiErrorFields } from '@/lib/api-error';
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
      <CalendarDays size={20} color={colors.primary} />
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
 * "Kế hoạch bữa ăn" — đồng bộ `frontend/src/app/(site)/meal-plans/page.tsx`: form tạo thực đơn tuần
 * (tuần bắt đầu, mục tiêu, tạo lại từ phiên bản cũ) + các phiên bản gần đây, lối tắt tới Món ăn của tôi
 * và Lộ trình nhiều tuần.
 */
export default function MealPlansScreen() {
  const colors = useIconColors();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [weekStart, setWeekStart] = React.useState(() => getMondayDateString());
  const [goal, setGoal] = React.useState(MealPlanGoal.MAINTAIN);
  const [supersedesId, setSupersedesId] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [scheduleDates, setScheduleDates] = React.useState<string[] | null>(null);

  const { data, error, isLoading, isError, refetch } = useMealPlansQuery(
    { page: 1, limit: RECENT_PLAN_LIMIT },
    isAuthenticated
  );
  const generateMutation = useGenerateMealPlanMutation();
  const plans = data?.items ?? [];

  const generatePlan = async () => {
    setFormError(null);
    setScheduleDates(null);
    try {
      const plan = await generateMutation.mutateAsync({
        weekStart,
        goal,
        idempotencyKey: createIdempotencyKey('mobile-meal-plan-generate'),
        ...(supersedesId ? { supersedesMealPlanId: supersedesId } : {}),
      });
      router.push({ pathname: '/meal-plans/[id]', params: { id: plan.id } } as unknown as Href);
    } catch (mutationError) {
      if (getApiErrorCode(mutationError) === 'DIET_SCHEDULE_REQUIRED') {
        const dates = getApiErrorFields(mutationError)?.['availableDates'];
        setScheduleDates(Array.isArray(dates) ? dates.filter((d): d is string => typeof d === 'string') : []);
        return;
      }
      setFormError(getMealPlanErrorMessage(mutationError));
    }
  };

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <View>
          <View className="flex-row items-center gap-2">
            <CalendarDays size={18} color={colors.primary} />
            <Text className="text-2xl font-bold tracking-tight text-foreground">Kế hoạch bữa ăn</Text>
          </View>
          <Text className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Tạo thực đơn chay 7 ngày theo mục tiêu, đúng luật ăn, dị ứng và hồ sơ sức khỏe của bạn.
          </Text>
        </View>

        <View className="rounded-2xl border border-border bg-card p-4">
          <Text className="text-base font-bold text-foreground">Tạo thực đơn mới</Text>

          {formError ? (
            <View className="mt-3 flex-row items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
              <AlertCircle size={15} color={colors.destructive} />
              <View className="flex-1">
                <Text className="text-sm text-destructive">{formError}</Text>
                {getApiErrorCode(generateMutation.error) === 'HEALTH_PROFILE_INCOMPLETE' ? (
                  <Link href={'/profile' as Href} asChild>
                    <Pressable>
                      <Text className="mt-1 text-sm font-semibold text-primary underline">Tới hồ sơ sức khỏe</Text>
                    </Pressable>
                  </Link>
                ) : null}
              </View>
            </View>
          ) : null}

          {scheduleDates !== null ? (
            <View className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3">
              <View className="flex-row items-center gap-2">
                <AlertCircle size={15} color="#b45309" />
                <Text className="flex-1 text-sm font-semibold text-amber-800">Bạn đang theo chế độ chay kỳ</Text>
              </View>
              <Text className="mt-1 text-xs leading-relaxed text-amber-800">
                Hãy chọn ít nhất một ngày chay trong tuần này rồi tạo lại thực đơn.
                {scheduleDates.length > 0 ? ` Ngày khả dụng: ${scheduleDates.join(', ')}.` : ''}
              </Text>
              <Link href={'/diet-schedule' as Href} asChild>
                <Pressable>
                  <Text className="mt-1.5 text-sm font-semibold text-primary underline">Chọn ngày chay</Text>
                </Pressable>
              </Link>
            </View>
          ) : null}

          <View className="mt-4 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-foreground">Tuần bắt đầu (Thứ hai)</Text>
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
                  className={cn(
                    'flex-row items-center justify-between rounded-xl border p-3',
                    selected ? 'border-primary bg-primary/10' : 'border-border bg-background'
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
            <>
              <Text className="mt-4 text-sm font-semibold text-foreground">Tạo lại từ phiên bản (tùy chọn)</Text>
              <View className="mt-2 flex-row flex-wrap gap-1.5">
                {[{ id: null as string | null, label: 'Tạo mới hoàn toàn' }, ...plans.map((plan) => ({
                  id: plan.id as string | null,
                  label: `${plan.formattedWeekRange} · bản ${plan.version}`,
                }))].map((option) => {
                  const selected = supersedesId === option.id;
                  return (
                    <Pressable
                      key={option.id ?? 'new'}
                      onPress={() => setSupersedesId(option.id)}
                      className={cn('rounded-full px-3 py-1.5', selected ? 'bg-primary' : 'bg-muted')}>
                      <Text
                        className={cn(
                          'text-xs font-medium',
                          selected ? 'text-primary-foreground' : 'text-muted-foreground'
                        )}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
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

        <View className="flex-row gap-2">
          <Link href={'/custom-meals' as Href} asChild>
            <Pressable className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-input py-2.5">
              <Utensils size={14} color={colors.primary} />
              <Text className="text-xs font-semibold text-foreground">Món ăn của tôi</Text>
            </Pressable>
          </Link>
          <Link href={'/meal-programs' as Href} asChild>
            <Pressable className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-input py-2.5">
              <Target size={14} color={colors.primary} />
              <Text className="text-xs font-semibold text-foreground">Lộ trình nhiều tuần</Text>
            </Pressable>
          </Link>
        </View>

        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-foreground">Phiên bản gần đây</Text>
            {plans.length > 0 ? (
              <Link href={'/meal-plans/saved' as Href} asChild>
                <Pressable className="flex-row items-center gap-1">
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
