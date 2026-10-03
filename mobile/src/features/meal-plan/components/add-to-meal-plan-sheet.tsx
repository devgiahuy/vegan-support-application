import * as React from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Link, type Href, useRouter } from 'expo-router';
import { ArrowLeft, CalendarPlus, Minus, Plus, X } from 'lucide-react-native';

import { MealType } from '@/common/enums';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import {
  useManualAddMealMutation,
  useMealPlanDetailQuery,
  useMealPlansQuery,
} from '../queries/meal-plan.queries';
import type { MealPlan, MealSlot } from '../types/meal-plan.model';
import { createIdempotencyKey } from '../utils/idempotency';
import { getMealPlanErrorMessage } from '../utils/meal-plan-errors';

const MEAL_ORDER = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER];
const MAX_SERVINGS = 20;

function groupByDate(plan: MealPlan): { date: string; label: string; slots: MealSlot[] }[] {
  const dayLabels = new Map(plan.days.map((day) => [day.date, day.dateLabel]));
  const dates = Array.from(new Set(plan.items.map((item) => item.date))).sort();
  return dates.map((date) => ({
    date,
    label: dayLabels.get(date) ?? date,
    slots: MEAL_ORDER.map((type) => plan.items.find((item) => item.date === date && item.mealType === type)).filter(
      (slot): slot is MealSlot => Boolean(slot)
    ),
  }));
}

function Body({
  recipeId,
  recipeTitle,
  onClose,
}: {
  recipeId: string;
  recipeTitle: string;
  onClose: () => void;
}) {
  const colors = useIconColors();
  const router = useRouter();
  const [planId, setPlanId] = React.useState<string | null>(null);
  const [servings, setServings] = React.useState(1);

  const plansQuery = useMealPlansQuery({ page: 1, limit: 10 });
  const detailQuery = useMealPlanDetailQuery(planId ?? '', planId !== null);
  const manualAdd = useManualAddMealMutation();

  const plan = detailQuery.data;
  const plans = plansQuery.data?.items ?? [];

  const addToSlot = async (slot: MealSlot) => {
    if (!plan) return;
    try {
      await manualAdd.mutateAsync({
        planId: plan.id,
        itemId: slot.id,
        expectedVersion: plan.lockVersion,
        idempotencyKey: createIdempotencyKey('mobile-recipe-add'),
        sourceType: 'RECIPE',
        recipeId,
        servings,
      });
      onClose();
      Alert.alert('Đã thêm vào thực đơn', `"${recipeTitle}" đã được thêm vào bữa ${slot.mealTypeLabel.toLowerCase()} ${slot.dateLabel}.`, [
        { text: 'Để sau', style: 'cancel' },
        {
          text: 'Xem thực đơn',
          onPress: () => router.push({ pathname: '/meal-plans/[id]', params: { id: plan.id } } as unknown as Href),
        },
      ]);
    } catch (error) {
      Alert.alert('Không thêm được món', getMealPlanErrorMessage(error));
    }
  };

  return (
    <View className="max-h-[88%] rounded-t-3xl bg-background px-5 pb-6 pt-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground">Thêm vào thực đơn</Text>
          <Text numberOfLines={2} className="mt-0.5 text-xs text-muted-foreground">
            {recipeTitle}
          </Text>
        </View>
        <Pressable onPress={onClose} accessibilityLabel="Đóng" className="h-9 w-9 items-center justify-center rounded-full bg-muted">
          <X size={16} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView className="mt-3" contentContainerClassName="gap-2.5 pb-2">
        {planId === null ? (
          plansQuery.isLoading ? (
            <LoadingState message="Đang tải thực đơn của bạn..." />
          ) : plansQuery.isError ? (
            <ErrorState title="Không tải được thực đơn." onRetry={() => void plansQuery.refetch()} />
          ) : plans.length === 0 ? (
            <EmptyState
              title="Bạn chưa có thực đơn nào"
              description="Hãy tạo thực đơn tuần trước, sau đó quay lại để thêm món."
              action={
                <Link href={'/meal-plans' as Href} asChild>
                  <PrimaryButton label="Tạo thực đơn tuần" onPress={onClose} />
                </Link>
              }
            />
          ) : (
            <>
              <Text className="text-xs font-semibold text-muted-foreground">Chọn thực đơn</Text>
              {plans.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => setPlanId(item.id)}
                  className="rounded-xl border border-border bg-card p-3 active:bg-muted">
                  <Text className="text-sm font-semibold text-foreground">Tuần {item.formattedWeekRange}</Text>
                  <Text className="mt-0.5 text-xs text-muted-foreground">
                    {item.goalLabel} · bản {item.version} · {item.filledSlots}/{item.totalSlots} bữa
                  </Text>
                </Pressable>
              ))}
            </>
          )
        ) : detailQuery.isLoading ? (
          <LoadingState message="Đang tải thực đơn..." />
        ) : detailQuery.isError || !plan ? (
          <ErrorState title="Không tải được thực đơn." onRetry={() => void detailQuery.refetch()} />
        ) : (
          <>
            <Pressable onPress={() => setPlanId(null)} className="flex-row items-center gap-1.5 self-start">
              <ArrowLeft size={14} color={colors.primary} />
              <Text className="text-xs font-semibold text-primary">Chọn thực đơn khác</Text>
            </Pressable>

            <View className="flex-row items-center justify-between rounded-xl border border-border bg-muted/30 p-2.5">
              <Text className="text-xs font-medium text-foreground">Số khẩu phần cho bữa này</Text>
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => setServings((value) => Math.max(1, value - 1))}
                  disabled={servings <= 1}
                  className="h-8 w-8 items-center justify-center rounded-lg border border-input bg-background">
                  <Minus size={14} color={colors.foreground} />
                </Pressable>
                <Text className="w-7 text-center text-sm font-bold text-foreground">{servings}</Text>
                <Pressable
                  onPress={() => setServings((value) => Math.min(MAX_SERVINGS, value + 1))}
                  disabled={servings >= MAX_SERVINGS}
                  className="h-8 w-8 items-center justify-center rounded-lg border border-input bg-background">
                  <Plus size={14} color={colors.foreground} />
                </Pressable>
              </View>
            </View>

            <Text className="text-xs font-semibold text-muted-foreground">
              Chọn bữa — bữa đã có món sẽ được thay bằng món này
            </Text>
            {groupByDate(plan).map((day) => (
              <View key={day.date} className="gap-1.5 rounded-xl border border-border bg-card p-3">
                <Text className="text-sm font-bold text-foreground">{day.label}</Text>
                {day.slots.map((slot) => (
                  <Pressable
                    key={slot.id}
                    disabled={manualAdd.isPending}
                    onPress={() => void addToSlot(slot)}
                    className={cn(
                      'flex-row items-center justify-between gap-2 rounded-lg border px-3 py-2.5 active:opacity-80',
                      slot.filled ? 'border-border bg-background' : 'border-dashed border-primary/40 bg-primary/5'
                    )}>
                    <View className="flex-1">
                      <Text className="text-xs font-semibold text-muted-foreground">{slot.mealTypeLabel}</Text>
                      <Text numberOfLines={1} className="text-sm text-foreground">
                        {slot.filled ? slot.recipeTitle : 'Bữa trống — thêm món vào đây'}
                      </Text>
                    </View>
                    <CalendarPlus size={16} color={colors.primary} />
                  </Pressable>
                ))}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Bottom sheet "Thêm vào thực đơn" từ chi tiết công thức: chọn một thực đơn → chọn bữa → chọn tay món
 * (`manual-add`). Backend kiểm tra ràng buộc cứng (chế độ ăn, dị ứng, nguyên liệu loại trừ) và có thể từ chối.
 */
export function AddToMealPlanSheet({
  visible,
  recipeId,
  recipeTitle,
  onClose,
}: {
  visible: boolean;
  recipeId: string;
  recipeTitle: string;
  onClose: () => void;
}) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!visible) return null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Đóng" />
        {isAuthenticated ? (
          <Body recipeId={recipeId} recipeTitle={recipeTitle} onClose={onClose} />
        ) : (
          <View className="rounded-t-3xl bg-background px-5 pb-8 pt-5">
            <Text className="text-center text-lg font-bold text-foreground">Đăng nhập để dùng thực đơn</Text>
            <Text className="mt-2 text-center text-sm text-muted-foreground">
              Thực đơn tuần là dữ liệu cá nhân, cần tài khoản để thêm món.
            </Text>
            <View className="mt-4">
              <Link href={'/(auth)/login' as Href} asChild>
                <PrimaryButton label="Đăng nhập" onPress={onClose} />
              </Link>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
