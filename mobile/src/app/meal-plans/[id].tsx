import * as React from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from 'react-native';
import { Link, type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Plus, Trash2 } from 'lucide-react-native';

import { MealType } from '@/common/enums';
import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { MealItemSelector, type SelectedMealItem } from '@/features/meal-plan/components/meal-item-selector';
import { MealSlotCard } from '@/features/meal-plan/components/meal-slot-card';
import { PlanDayCard } from '@/features/meal-plan/components/plan-day-card';
import { PlanHero } from '@/features/meal-plan/components/plan-hero';
import { PlanNutritionTargets } from '@/features/meal-plan/components/plan-nutrition-targets';
import { PlanSummary } from '@/features/meal-plan/components/plan-summary';
import { PlanWarningsBanner } from '@/features/meal-plan/components/plan-warnings-banner';
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
  label: string;
  slots: MealSlot[];
  estimatedTotals: EstimatedMacros | null;
}

function groupDays(plan: MealPlan): DayGroup[] {
  const dayInfo = new Map(plan.days.map((day) => [day.date, day]));
  const dates = Array.from(new Set(plan.items.map((item) => item.date))).sort();
  return dates.map((date, index) => ({
    date,
    label: dayInfo.get(date)?.dateLabel ?? `${DAY_LABELS[index] ?? ''} ${toShortDate(date)}`.trim(),
    slots: MEAL_ORDER.map((mealType) => plan.items.find((item) => item.date === date && item.mealType === mealType)).filter(
      (slot): slot is MealSlot => Boolean(slot)
    ),
    estimatedTotals: dayInfo.get(date)?.estimatedTotals ?? null,
  }));
}

function toShortDate(date: string): string {
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(date);
  return match ? `${match[2]}/${match[1]}` : date;
}

/**
 * Chi tiết một thực đơn tuần — đồng bộ `frontend/src/app/(site)/meal-plans/[id]/page.tsx`: điều hướng "Lịch sử thực đơn /
 * Tạo thực đơn mới" → hero (tuần, mục tiêu, tiến độ, xóa) → tóm tắt & bảo toàn ràng buộc ăn kiêng → mục tiêu 4 chỉ số →
 * lưu ý về thực đơn → 7 ngày × 3 bữa (đổi món, chọn món, nguyên liệu cần mua).
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
      <SiteScreen>
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
      <SiteScreen>
        <View className="items-center px-5 pt-12">
          <ActivityIndicator color={colors.primary} />
          <Text className="mt-3 text-sm text-muted-foreground">Đang tải chi tiết thực đơn...</Text>
        </View>
      </SiteScreen>
    );
  }

  if (isError || !plan) {
    return (
      <SiteScreen>
        <View className="px-5 pt-6">
          <View className="items-center rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <Text className="text-center font-semibold text-destructive">Không tải được thực đơn.</Text>
            <Text className="mt-2 text-center text-sm text-muted-foreground">{getMealPlanErrorMessage(error)}</Text>
            <View className="mt-4">
              <PrimaryButton label="Thử lại" variant="outline" onPress={() => void refetch()} />
            </View>
          </View>
        </View>
      </SiteScreen>
    );
  }

  const days = groupDays(plan);
  const busy = swapMutation.isPending || deleteMutation.isPending || manualAddMutation.isPending;
  // Backend chưa ước tính thì dùng chuẩn theo calo mục tiêu, như web.
  const targets = resolveDailyTargets(plan);

  return (
    <SiteScreen
      onRefresh={() => refetch()}
      // Mỗi khối là con trực tiếp của ScrollView để giữ nguyên vị trí đang xem khi lưu ý phía trên tải lại sau khi đổi món.
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
        <View className="flex-row items-center justify-between gap-3">
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/meal-plans' as Href)}
            className="h-10 flex-row items-center gap-1.5 rounded-xl border border-border px-3 active:bg-muted">
            <Plus size={16} color={colors.foreground} />
            <Text className="text-sm font-medium text-foreground">Tạo thực đơn mới</Text>
          </Pressable>
          <Pressable
            disabled={busy}
            onPress={confirmDelete}
            accessibilityRole="button"
            accessibilityLabel="Xóa thực đơn"
            className={cn('h-10 flex-row items-center gap-1.5 rounded-xl border border-border px-3 active:bg-destructive/10', busy ? 'opacity-60' : '')}>
            <Trash2 size={14} color={colors.mutedForeground} />
            <Text className="text-xs text-muted-foreground">Xóa thực đơn</Text>
          </Pressable>
        </View>

        <PlanHero plan={plan} />
        {plan.userSummary ? <PlanSummary summary={plan.userSummary} /> : null}
        <PlanNutritionTargets targets={targets} />
        <PlanWarningsBanner warnings={plan.warnings} />

        {days.map((day) => (
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
                disabled={busy}
                onSwap={(item) => void swapSlot(item)}
                onPick={setPickSlot}
                onShopping={setShoppingSlot}
              />
            ))}
          </PlanDayCard>
        ))}

        {shoppingSlot ? <SlotShoppingSheet slot={shoppingSlot} onClose={() => setShoppingSlot(null)} /> : null}
      </>
    </SiteScreen>
  );
}
