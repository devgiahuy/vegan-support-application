import * as React from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { Link, type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, RefreshCw, ShoppingCart, Shuffle, Trash2, TriangleAlert } from 'lucide-react-native';

import { MealType } from '@/common/enums';
import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import {
  useDeleteMealPlanMutation,
  useMealPlanDetailQuery,
  useSwapMealItemMutation,
} from '@/features/meal-plan/queries/meal-plan.queries';
import type { MealPlan, MealSlot } from '@/features/meal-plan/types/meal-plan.model';
import { createIdempotencyKey } from '@/features/meal-plan/utils/idempotency';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MEAL_ORDER = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER];

function getMealPlanErrorMessage(error: unknown): string {
  const code = getApiErrorCode(error);
  if (code === 'MEAL_PLAN_VERSION_CONFLICT') {
    return 'Thực đơn đã có phiên bản mới. Hãy tải lại rồi thao tác lại.';
  }
  if (code === 'NO_ELIGIBLE_RECIPE') {
    return 'Không có món thay thế phù hợp với luật ăn và mục tiêu năng lượng.';
  }
  if (code === 'AUTH_REQUIRED' || code === 'INVALID_ACCESS_TOKEN' || code === 'TOKEN_EXPIRED') {
    return 'Bạn cần đăng nhập để xem thực đơn.';
  }
  return getApiErrorMessage(error, 'Không thể hoàn tất thao tác. Vui lòng thử lại.');
}

function groupSlots(plan: MealPlan): { date: string; label: string; slots: MealSlot[] }[] {
  const dates = Array.from(new Set(plan.items.map((item) => item.date))).sort();
  return dates.map((date, index) => ({
    date,
    label: `${DAY_LABELS[index] ?? ''} ${plan.items.find((item) => item.date === date)?.dateLabel ?? date}`,
    slots: MEAL_ORDER.map((mealType) => plan.items.find((item) => item.date === date && item.mealType === mealType)).filter(
      (slot): slot is MealSlot => Boolean(slot)
    ),
  }));
}

function Warnings({ plan }: { plan: MealPlan }) {
  if (plan.warnings.length === 0) return null;
  return (
    <View className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
      <View className="flex-row items-center gap-2">
        <TriangleAlert size={16} color="#b45309" />
        <Text className="font-semibold text-amber-800">Lưu ý từ hệ thống</Text>
      </View>
      <View className="mt-2 gap-1.5">
        {plan.warnings.map((warning) => (
          <Text key={warning.code} className="text-sm leading-relaxed text-amber-800">
            {warning.message}
          </Text>
        ))}
      </View>
    </View>
  );
}

function SlotCard({
  slot,
  disabled,
  onSwap,
}: {
  slot: MealSlot;
  disabled: boolean;
  onSwap: (slot: MealSlot) => void;
}) {
  const colors = useIconColors();

  return (
    <View className={cn('rounded-xl border p-3', slot.filled ? 'border-border bg-background' : 'border-dashed border-border bg-muted/40')}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xs font-semibold uppercase text-muted-foreground">{slot.mealTypeLabel}</Text>
          <Text className="mt-1 text-sm font-semibold text-foreground">
            {slot.filled ? slot.recipeTitle : slot.unfilledReason}
          </Text>
          <Text className="mt-1 text-xs text-muted-foreground">
            {slot.filled ? `${slot.formattedCalories} · mục tiêu ${slot.targetCalories} kcal` : 'Bữa trống'}
          </Text>
        </View>
        {slot.filled ? (
          <Pressable
            disabled={disabled}
            onPress={() => onSwap(slot)}
            className="h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Shuffle size={15} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function MealPlanDetailScreen() {
  const router = useRouter();
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';

  const { data: plan, error, isLoading, isError, refetch } = useMealPlanDetailQuery(id, isAuthenticated);
  const swapMutation = useSwapMealItemMutation();
  const deleteMutation = useDeleteMealPlanMutation();

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

  const confirmDelete = () => {
    if (!plan) return;
    Alert.alert('Xóa thực đơn?', `Tuần ${plan.formattedWeekRange} sẽ được xóa khỏi danh sách đã lưu.`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          void deleteMutation
            .mutateAsync({ id: plan.id, expectedVersion: plan.lockVersion })
            .then(() => router.replace('/meal-plans' as Href))
            .catch((mutationError) => Alert.alert('Không xóa được thực đơn', getMealPlanErrorMessage(mutationError)));
        },
      },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <SiteScreen>
        <View className="px-5 pt-6">
          <Link href={'/meal-plans' as Href} asChild>
            <Pressable className="flex-row items-center gap-2">
              <ArrowLeft size={16} color={colors.foreground} />
              <Text className="text-sm font-semibold text-foreground">Quay lại danh sách</Text>
            </Pressable>
          </Link>
          <View className="mt-6 items-center rounded-2xl border border-dashed border-border p-7">
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
          <Link href={'/meal-plans' as Href} asChild>
            <Pressable className="flex-row items-center gap-2">
              <ArrowLeft size={16} color={colors.foreground} />
              <Text className="text-sm font-semibold text-foreground">Quay lại danh sách</Text>
            </Pressable>
          </Link>
          <View className="mt-6 items-center rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
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

  const days = groupSlots(plan);
  const busy = swapMutation.isPending || deleteMutation.isPending;

  return (
    <SiteScreen>
      <View className="px-5 pt-4">
        <View className="flex-row items-center justify-between">
          <Link href={'/meal-plans' as Href} asChild>
            <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-muted">
              <ArrowLeft size={17} color={colors.foreground} />
            </Pressable>
          </Link>
          <View className="flex-row gap-2">
            <Pressable onPress={() => void refetch()} className="h-10 w-10 items-center justify-center rounded-full bg-muted">
              <RefreshCw size={16} color={colors.foreground} />
            </Pressable>
            <Pressable
              disabled={busy}
              onPress={confirmDelete}
              className="h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 size={16} color="#dc2626" />
            </Pressable>
          </View>
        </View>

        <Text className="mt-4 text-2xl font-bold text-foreground">Tuần {plan.formattedWeekRange}</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          {plan.goalLabel} · {plan.filledSlots}/{plan.totalSlots} bữa · {plan.nutritionDataQualityLabel} · v{plan.version}
        </Text>

        <View className="mt-4 flex-row gap-2">
          <View className="flex-1 rounded-xl border border-border bg-card p-3">
            <Text className="text-xs text-muted-foreground">Mục tiêu/ngày</Text>
            <Text className="mt-1 text-lg font-bold text-primary">{plan.targetCalories} kcal</Text>
          </View>
          <View className="flex-1 rounded-xl border border-border bg-card p-3">
            <Text className="text-xs text-muted-foreground">Vitamin B12</Text>
            <Text className="mt-1 text-lg font-bold text-primary">
              {plan.vitaminB12Mcg === null ? 'N/A' : `${plan.vitaminB12Mcg} mcg`}
            </Text>
          </View>
        </View>

        <Warnings plan={plan} />

        <View className="mt-6 gap-4">
          {days.map((day) => (
            <View key={day.date} className="rounded-2xl border border-border bg-card p-4">
              <Text className="text-base font-bold text-foreground">{day.label}</Text>
              <View className="mt-3 gap-2.5">
                {day.slots.map((slot) => (
                  <SlotCard key={slot.id} slot={slot} disabled={busy} onSwap={(item) => void swapSlot(item)} />
                ))}
              </View>
            </View>
          ))}
        </View>

        <View className="mt-6 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center gap-2">
            <ShoppingCart size={16} color={colors.primary} />
            <Text className="text-base font-bold text-foreground">Danh sách đi chợ</Text>
          </View>
          <View className="mt-3 gap-2">
            {plan.shoppingList.length === 0 ? (
              <Text className="text-sm text-muted-foreground">Chưa có nguyên liệu cần mua.</Text>
            ) : (
              plan.shoppingList.map((item, index) => (
                <View key={`${item.ingredientId ?? item.name}-${index}`} className="rounded-xl bg-muted/50 px-3 py-2">
                  <Text className="text-sm font-medium text-foreground">{item.displayLine}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </View>
    </SiteScreen>
  );
}
