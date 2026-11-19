import * as React from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Link, type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, Trash2 } from 'lucide-react-native';

import { MealType } from '@/common/enums';
import { SiteScreen } from '@/components/layout/site-screen';
import { ErrorState, LoadingState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { MealAnalysisPanel } from '@/features/meal-analysis/components/meal-analysis-panel';
import { MealItemSelector, type SelectedMealItem } from '@/features/meal-plan/components/meal-item-selector';
import { MealSlotCard } from '@/features/meal-plan/components/meal-slot-card';
import { PlanDayCard } from '@/features/meal-plan/components/plan-day-card';
import { PlanHero } from '@/features/meal-plan/components/plan-hero';
import { PlanNutritionTargets } from '@/features/meal-plan/components/plan-nutrition-targets';
import { PlanSummary } from '@/features/meal-plan/components/plan-summary';
import { PlanWarningsBanner } from '@/features/meal-plan/components/plan-warnings-banner';
import { DietaryCompatibilityBanner } from '@/features/diet-preferences/components/dietary-compatibility-banner';
import { SlotShoppingSheet } from '@/features/meal-plan/components/slot-shopping-sheet';
import {
  useDeleteMealPlanMutation,
  useManualAddMealMutation,
  useMealPlanDetailQuery,
  useSwapMealItemMutation,
} from '@/features/meal-plan/queries/meal-plan.queries';
import type { EstimatedMacros, MealPlan, MealSlot } from '@/features/meal-plan/types/meal-plan.model';
import { createIdempotencyKey } from '@/features/meal-plan/utils/idempotency';
import { getMealPlanErrorMessage } from '@/features/meal-plan/utils/meal-plan-errors';
import { resolveDailyTargets } from '@/features/meal-plan/utils/nutrition-targets';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MEAL_ORDER = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER];

interface DayGroup {
  date: string;
  shortLabel: string;
  label: string;
  slots: MealSlot[];
  estimatedTotals: EstimatedMacros | null;
}

function groupDays(plan: MealPlan): DayGroup[] {
  const dayInfo = new Map(plan.days.map((day) => [day.date, day]));
  const dates = Array.from(new Set(plan.items.map((item) => item.date))).sort();
  return dates.map((date, index) => {
    const shortWeekday = DAY_LABELS[index] ?? toShortDate(date);
    return {
      date,
      shortLabel: shortWeekday,
      label: dayInfo.get(date)?.dateLabel ?? `${DAY_LABELS[index] ?? ''} ${toShortDate(date)}`.trim(),
      slots: MEAL_ORDER.map((mealType) => plan.items.find((item) => item.date === date && item.mealType === mealType)).filter(
        (slot): slot is MealSlot => Boolean(slot)
      ),
      estimatedTotals: dayInfo.get(date)?.estimatedTotals ?? null,
    };
  });
}

function toShortDate(date: string): string {
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(date);
  return match ? `${match[2]}/${match[1]}` : date;
}

/**
 * Chi tiết một thực đơn tuần — tối ưu cho điện thoại:
 * Thanh tab "Thực đơn theo ngày" (chọn nhanh T2..CN hoặc Cả tuần) | "Tổng quan & Phân tích" (kèm badge cảnh báo).
 */
export default function MealPlanDetailScreen() {
  const router = useRouter();
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';

  const { data: plan, error, isLoading, isError, refetch } = useMealPlanDetailQuery(id, isAuthenticated);
  const swapMutation = useSwapMealItemMutation();
  const manualAddMutation = useManualAddMealMutation();
  const deleteMutation = useDeleteMealPlanMutation();

  const [pickSlot, setPickSlot] = React.useState<MealSlot | null>(null);
  const [shoppingSlot, setShoppingSlot] = React.useState<MealSlot | null>(null);
  const [viewTab, setViewTab] = React.useState<'days' | 'overview'>('days');
  const [selectedDay, setSelectedDay] = React.useState<string>('ALL');

  const swapSlot = async (slot: MealSlot) => {
    if (!plan) return;
    try {
      await swapMutation.mutateAsync({
        planId: plan.id,
        itemId: slot.id,
        expectedVersion: plan.lockVersion,
        idempotencyKey: createIdempotencyKey('mobile-meal-plan-swap'),
      });
    } catch (mutationError) {
      Alert.alert('Không đổi được món', getMealPlanErrorMessage(mutationError));
    }
  };

  const pickMeal = async (item: SelectedMealItem) => {
    if (!plan || !pickSlot) return;
    const slot = pickSlot;
    setPickSlot(null);
    try {
      await manualAddMutation.mutateAsync({
        planId: plan.id,
        itemId: slot.id,
        expectedVersion: plan.lockVersion,
        idempotencyKey: createIdempotencyKey('mobile-meal-plan-manual'),
        sourceType: item.sourceType,
        ...(item.sourceType === 'RECIPE' ? { recipeId: item.id } : { customMealId: item.id }),
        servings: item.servings,
      });
    } catch (mutationError) {
      Alert.alert('Không thêm được món', getMealPlanErrorMessage(mutationError));
    }
  };

  const deletePlan = async () => {
    if (!plan) return;
    try {
      await deleteMutation.mutateAsync({ id: plan.id, expectedVersion: plan.lockVersion });
      router.replace('/meal-plans' as Href);
    } catch (mutationError) {
      Alert.alert('Không xóa được thực đơn', getMealPlanErrorMessage(mutationError));
    }
  };

  const confirmDelete = () => {
    if (!plan) return;
    const deleteMessage = `Tuần ${plan.formattedWeekRange} sẽ được xóa khỏi danh sách đã lưu.`;

    if (Platform.OS === 'web') {
      const confirm = (globalThis as unknown as { confirm?: (message?: string) => boolean }).confirm;
      if (!confirm || confirm(deleteMessage)) {
        void deletePlan();
      }
      return;
    }

    Alert.alert('Xóa thực đơn?', deleteMessage, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => void deletePlan(),
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <SiteScreen title="Chi tiết thực đơn">
        <View className="px-5 pt-6">
          <View className="items-center rounded-2xl border border-dashed border-border p-7">
            <Text className="font-semibold text-foreground">Cần đăng nhập</Text>
            <Text className="mt-1 text-center text-sm text-muted-foreground">
              Bạn cần đăng nhập để xem chi tiết thực đơn đã lưu.
            </Text>
            <View className="mt-4 w-full">
              <Link href="/(auth)/login" asChild>
                <PrimaryButton label="Đăng nhập" />
              </Link>
            </View>
          </View>
        </View>
      </SiteScreen>
    );
  }

  if (isLoading) {
    return (
      <SiteScreen title="Chi tiết thực đơn">
        <View className="px-5 pt-6">
          <LoadingState message="Đang tải chi tiết thực đơn..." />
        </View>
      </SiteScreen>
    );
  }

  if (isError || !plan) {
    return (
      <SiteScreen title="Chi tiết thực đơn">
        <View className="px-5 pt-6">
          <ErrorState
            title="Không tải được thực đơn."
            description={getMealPlanErrorMessage(error)}
            onRetry={() => void refetch()}
          />
        </View>
      </SiteScreen>
    );
  }

  const days = groupDays(plan);
  const visibleDays = selectedDay === 'ALL' ? days : days.filter((day) => day.date === selectedDay);
  const busy = swapMutation.isPending || deleteMutation.isPending || manualAddMutation.isPending;
  const targets = resolveDailyTargets(plan);
  const noticeCount =
    plan.warnings.filter((w) => w.code !== 'UNFILLED_SLOT' && w.code !== 'MICRONUTRIENT_DATA_PARTIAL').length +
    (plan.compatibility?.status === 'NEEDS_REVIEW' ? 1 : 0);

  return (
    <SiteScreen
      title={`Thực đơn ${plan.formattedWeekRange}`}
      onRefresh={() => refetch()}
      contentClassName="gap-4 px-5 pt-4"
      maintainContentPosition
      fab={
        <MealItemSelector
          visible={pickSlot !== null}
          slotLabel={pickSlot ? `bữa ${pickSlot.mealTypeLabel.toLowerCase()} (${pickSlot.dateLabel})` : 'bữa ăn'}
          onSelect={(item) => void pickMeal(item)}
          onClose={() => setPickSlot(null)}
        />
      }>
      <>
        <View className="flex-row items-center justify-between gap-2">
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/meal-plans' as Href)}
            className="min-h-11 flex-row items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 active:bg-muted">
            <Plus size={16} color={colors.foreground} />
            <Text className="text-sm font-medium text-foreground">Tạo thực đơn mới</Text>
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={confirmDelete}
            accessibilityRole="button"
            accessibilityLabel="Xóa thực đơn"
            className={cn(
              'min-h-11 flex-row items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 active:bg-destructive/10',
              busy ? 'opacity-60' : ''
            )}>
            <Trash2 size={15} color={colors.destructive} />
            <Text className="text-xs font-semibold text-destructive">Xóa thực đơn</Text>
          </Pressable>
        </View>

        <PlanHero plan={plan} />

        <DietaryCompatibilityBanner
          compatibility={plan.compatibility}
          repairHref={`/diet-repair?planIds=${encodeURIComponent(plan.id)}&revision=${plan.compatibility?.dietaryRevision ?? 0}` as Href}
        />

        {/* Thanh chuyển 2 tab */}
        <View
          accessibilityRole="tablist"
          className="flex-row gap-1 rounded-2xl border border-border bg-muted/70 p-1">
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: viewTab === 'days' }}
            onPress={() => setViewTab('days')}
            className={cn(
              'min-h-11 flex-1 items-center justify-center rounded-xl px-2',
              viewTab === 'days' ? 'border border-border/60 bg-background' : 'active:bg-background/50'
            )}>
            <Text className={cn('text-xs', viewTab === 'days' ? 'font-bold text-primary' : 'font-medium text-muted-foreground')}>
              Thực đơn theo ngày
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: viewTab === 'overview' }}
            onPress={() => setViewTab('overview')}
            className={cn(
              'min-h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-xl px-2',
              viewTab === 'overview' ? 'border border-border/60 bg-background' : 'active:bg-background/50'
            )}>
            <Text className={cn('text-xs', viewTab === 'overview' ? 'font-bold text-primary' : 'font-medium text-muted-foreground')}>
              Tổng quan & Phân tích
            </Text>
            {noticeCount > 0 ? (
              <View className="h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1">
                <Text className="text-[11px] font-bold text-amber-700 dark:text-amber-300">{noticeCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {viewTab === 'days' ? (
          <>
            {/* Bộ lọc chọn nhanh từng ngày */}
            {days.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="-mx-5"
                contentContainerClassName="gap-1.5 px-5">
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedDay === 'ALL' }}
                  onPress={() => setSelectedDay('ALL')}
                  className={cn(
                    'min-h-11 justify-center rounded-full border px-4',
                    selectedDay === 'ALL' ? 'border-primary bg-primary' : 'border-border bg-card'
                  )}>
                  <Text
                    className={cn(
                      'text-xs font-semibold',
                      selectedDay === 'ALL' ? 'text-primary-foreground' : 'text-foreground'
                    )}>
                    Cả tuần
                  </Text>
                </Pressable>
                {days.map((day) => {
                  const active = selectedDay === day.date;
                  return (
                    <Pressable
                      key={day.date}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => setSelectedDay(day.date)}
                      className={cn(
                        'min-h-11 justify-center rounded-full border px-3.5',
                        active ? 'border-primary bg-primary' : 'border-border bg-card'
                      )}>
                      <Text
                        className={cn(
                          'text-xs font-semibold',
                          active ? 'text-primary-foreground' : 'text-foreground'
                        )}>
                        {day.shortLabel} ({toShortDate(day.date)})
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            {visibleDays.map((day) => (
              <PlanDayCard
                key={day.date}
                label={day.label}
                slots={day.slots}
                estimatedTotals={day.estimatedTotals}
                targetCalories={plan.targetCalories}
                targets={targets}>
                {day.slots.map((slot) => (
                  <MealSlotCard
                    key={slot.id}
                    slot={slot}
                    dietaryWarning={plan.compatibility?.items.find((item) => item.itemId === slot.id)?.reasonLabels.join('; ')}
                    disabled={busy}
                    onSwap={(item) => void swapSlot(item)}
                    onPick={setPickSlot}
                    onShopping={setShoppingSlot}
                  />
                ))}
              </PlanDayCard>
            ))}
          </>
        ) : (
          <View className="gap-4">
            {plan.userSummary ? <PlanSummary summary={plan.userSummary} /> : null}
            <PlanNutritionTargets targets={targets} />
            <PlanWarningsBanner warnings={plan.warnings} />
            <MealAnalysisPanel planId={plan.id} planVersion={plan.lockVersion} />
          </View>
        )}

        {shoppingSlot ? <SlotShoppingSheet slot={shoppingSlot} onClose={() => setShoppingSlot(null)} /> : null}
      </>
    </SiteScreen>
  );
}
