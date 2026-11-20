import * as React from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Link, type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { AlertCircle, CheckCircle2, Plus, Trash2, X } from 'lucide-react-native';

import { MealType } from '@/common/enums';
import { SiteScreen } from '@/components/layout/site-screen';
import { ErrorState, LoadingState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
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
  const [swappingSlotId, setSwappingSlotId] = React.useState<string | null>(null);
  const [pickingSlotId, setPickingSlotId] = React.useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = React.useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [viewTab, setViewTab] = React.useState<'days' | 'overview'>('days');
  const [selectedDay, setSelectedDay] = React.useState<string>('ALL');

  const swapSlot = async (slot: MealSlot) => {
    if (!plan) return;
    setActionFeedback(null);
    setSwappingSlotId(slot.id);
    try {
      const updated = await swapMutation.mutateAsync({
        planId: plan.id,
        itemId: slot.id,
        expectedVersion: plan.lockVersion,
        idempotencyKey: createIdempotencyKey('mobile-meal-plan-swap'),
      });
      const updatedSlot = updated.items.find((item) => item.id === slot.id);
      const nextTitle = updatedSlot?.recipeTitle || 'món mới';
      setActionFeedback({
        tone: 'success',
        message: `Đã đổi ${slot.mealTypeLabel.toLowerCase()} sang "${nextTitle}".`,
      });
    } catch (mutationError) {
      const message = getMealPlanErrorMessage(mutationError);
      setActionFeedback({ tone: 'error', message });
      if (Platform.OS !== 'web') {
        Alert.alert('Không đổi được món', message);
      }
    } finally {
      setSwappingSlotId(null);
    }
  };

  const pickMeal = async (item: SelectedMealItem) => {
    if (!plan || !pickSlot) return;
    const slot = pickSlot;
    setPickSlot(null);
    setActionFeedback(null);
    setPickingSlotId(slot.id);
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
      setActionFeedback({
        tone: 'success',
        message: `Đã chọn "${item.title}" cho ${slot.mealTypeLabel.toLowerCase()}.`,
      });
    } catch (mutationError) {
      const message = getMealPlanErrorMessage(mutationError);
      setActionFeedback({ tone: 'error', message });
      if (Platform.OS !== 'web') {
        Alert.alert('Không thêm được món', message);
      }
    } finally {
      setPickingSlotId(null);
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
      headerRight={
        <View className="flex-row items-center gap-1.5">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tạo thực đơn mới"
            onPress={() => router.push('/meal-plans' as Href)}
            className="h-11 w-11 items-center justify-center rounded-full bg-primary/10 active:opacity-80">
            <Plus size={18} color={colors.primary} />
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={confirmDelete}
            accessibilityRole="button"
            accessibilityLabel="Xóa thực đơn"
            className={cn(
              'h-11 w-11 items-center justify-center rounded-full bg-destructive/10 active:opacity-80',
              busy ? 'opacity-60' : ''
            )}>
            <Trash2 size={17} color={colors.destructive} />
          </Pressable>
        </View>
      }
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
        <PlanHero plan={plan} />

        <DietaryCompatibilityBanner
          compatibility={plan.compatibility}
          repairHref={`/diet-repair?planIds=${encodeURIComponent(plan.id)}&revision=${plan.compatibility?.dietaryRevision ?? 0}` as Href}
        />

        {actionFeedback ? (
          <View
            accessibilityRole="alert"
            className={cn(
              'flex-row items-center gap-2.5 rounded-2xl border px-3.5 py-3',
              actionFeedback.tone === 'success'
                ? 'border-primary/35 bg-primary/10'
                : 'border-destructive/35 bg-destructive/10'
            )}>
            {actionFeedback.tone === 'success' ? (
              <CheckCircle2 size={16} color={colors.primary} />
            ) : (
              <AlertCircle size={16} color={colors.destructive} />
            )}
            <Text
              className={cn(
                'flex-1 text-xs font-medium leading-5',
                actionFeedback.tone === 'success' ? 'text-foreground' : 'text-destructive'
              )}>
              {actionFeedback.message}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng thông báo"
              onPress={() => setActionFeedback(null)}
              className="h-8 w-8 items-center justify-center rounded-full active:bg-muted">
              <X size={14} color={colors.mutedForeground} />
            </Pressable>
          </View>
        ) : null}

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
                    swapping={swappingSlotId === slot.id}
                    picking={pickingSlotId === slot.id}
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
          </View>
        )}

        {shoppingSlot ? <SlotShoppingSheet slot={shoppingSlot} onClose={() => setShoppingSlot(null)} /> : null}
      </>
    </SiteScreen>
  );
}
