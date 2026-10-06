import * as React from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from 'react-native';
import { Link, type Href, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  BarChart3,
  Info,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  TriangleAlert,
} from 'lucide-react-native';

import { MealType } from '@/common/enums';
import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { AnalysisWarningModal } from '@/features/meal-analysis/components/analysis-warning-modal';
import {
  useAnalyzeMealPlanMutation,
  useMealAnalysisQuery,
} from '@/features/meal-analysis/queries/meal-analysis.queries';
import type { MealAnalysis, MealAnalysisWarning } from '@/features/meal-analysis/types/meal-analysis.model';
import { MealItemSelector, type SelectedMealItem } from '@/features/meal-plan/components/meal-item-selector';
import { MealSlotCard } from '@/features/meal-plan/components/meal-slot-card';
import {
  useDeleteMealPlanMutation,
  useManualAddMealMutation,
  useMealPlanDetailQuery,
  useSwapMealItemMutation,
} from '@/features/meal-plan/queries/meal-plan.queries';
import type { EstimatedMacros, MealPlan, MealSlot } from '@/features/meal-plan/types/meal-plan.model';
import { createIdempotencyKey } from '@/features/meal-plan/utils/idempotency';
import {
  getMealAnalysisErrorMessage,
  getMealPlanErrorMessage,
} from '@/features/meal-plan/utils/meal-plan-errors';
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

function formatMacros(macros: EstimatedMacros): string {
  const part = (label: string, value: number | null) => `${label} ${value === null ? '—' : `${Math.round(value)}g`}`;
  return [
    part('Đạm', macros.proteinGrams),
    part('Xơ', macros.fiberGrams),
    part('Béo', macros.fatGrams),
    part('Tinh bột', macros.carbohydrateGrams),
  ].join(' · ');
}

function PlanSummary({ plan }: { plan: MealPlan }) {
  const colors = useIconColors();
  const summary = plan.userSummary;
  if (!summary || (!summary.title && !summary.detail)) return null;

  const isBlocked = summary.status === 'HARD_CONSTRAINT_BLOCKED';
  const isAdvisory = summary.status === 'ADVISORY_ADJUSTMENTS';

  return (
    <View
      className={cn(
        'mt-4 rounded-2xl border p-4',
        isBlocked
          ? 'border-destructive/30 bg-destructive/5'
          : isAdvisory
            ? 'border-amber-300 bg-amber-50'
            : 'border-primary/20 bg-primary/5'
      )}>
      <View className="flex-row items-center gap-2">
        {isBlocked || isAdvisory ? (
          <TriangleAlert size={16} color={isBlocked ? colors.destructive : '#b45309'} />
        ) : (
          <ShieldCheck size={16} color={colors.primary} />
        )}
        <Text
          className={cn(
            'flex-1 font-semibold',
            isBlocked ? 'text-destructive' : isAdvisory ? 'text-amber-800' : 'text-primary'
          )}>
          {summary.title}
        </Text>
      </View>
      {summary.detail ? <Text className="mt-1.5 text-sm leading-relaxed text-foreground">{summary.detail}</Text> : null}
      {summary.suggestion ? (
        <Text className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{summary.suggestion}</Text>
      ) : null}
    </View>
  );
}

function PlanWarnings({ plan }: { plan: MealPlan }) {
  if (plan.warnings.length === 0) return null;

  return (
    <View className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
      <View className="flex-row items-center gap-2">
        <TriangleAlert size={16} color="#b45309" />
        <Text className="font-semibold text-amber-800">Lưu ý về thực đơn này</Text>
      </View>
      <View className="mt-2 gap-2.5">
        {plan.warnings.map((warning) => (
          <View key={warning.code}>
            <Text className="text-sm font-medium leading-relaxed text-amber-900">{warning.message}</Text>
            {warning.detail ? (
              <Text className="mt-0.5 text-xs leading-relaxed text-amber-800">{warning.detail}</Text>
            ) : null}
            {warning.suggestion ? (
              <Text className="mt-0.5 text-xs leading-relaxed text-amber-800">Gợi ý: {warning.suggestion}</Text>
            ) : null}
            {warning.affectedSlots.length > 0 ? (
              <Text className="mt-0.5 text-[11px] text-amber-700">
                Ảnh hưởng:{' '}
                {warning.affectedSlots.map((slot) => `${slot.mealTypeLabel} ${toShortDate(slot.date)}`).join(', ')}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function AnalysisPanel({
  analysis,
  error,
  isLoading,
  isError,
  isAnalyzing,
  onAnalyze,
  onOpenWarning,
}: {
  analysis: MealAnalysis | undefined;
  error: unknown;
  isLoading: boolean;
  isError: boolean;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onOpenWarning: (warning: MealAnalysisWarning) => void;
}) {
  const colors = useIconColors();
  const attentionCount = analysis ? analysis.summary.highCount + analysis.summary.cautionCount : 0;

  return (
    <View className="mt-6 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-center gap-2">
        <BarChart3 size={16} color={colors.primary} />
        <Text className="text-base font-bold text-foreground">Phân tích thực đơn</Text>
      </View>
      <Text className="mt-1 text-xs leading-relaxed text-muted-foreground">
        Kiểm tra khẩu phần, giới hạn dinh dưỡng, mục tiêu đạm/xơ/béo/tinh bột ước tính và cách kết hợp món trong
        tuần.
      </Text>

      <View className="mt-4">
        <PrimaryButton
          label={isAnalyzing ? 'Đang phân tích...' : analysis ? 'Phân tích lại' : 'Phân tích thực đơn'}
          loading={isAnalyzing}
          icon={<BarChart3 size={16} color={colors.primaryForeground} />}
          onPress={onAnalyze}
        />
      </View>

      {isLoading ? (
        <View className="mt-4 items-center rounded-xl border border-border p-4">
          <ActivityIndicator color={colors.primary} />
          <Text className="mt-2 text-sm text-muted-foreground">Đang tải kết quả phân tích...</Text>
        </View>
      ) : isError && !analysis ? (
        <View className="mt-4 rounded-xl border border-dashed border-border p-4">
          <Text className="text-sm font-semibold text-foreground">Chưa có phân tích hiện hành</Text>
          <Text className="mt-1 text-sm leading-relaxed text-muted-foreground">{getMealAnalysisErrorMessage(error)}</Text>
        </View>
      ) : analysis ? (
        <View className="mt-4 gap-3">
          {analysis.summary.statusTitle ? (
            <View className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <Text className="text-sm font-semibold text-primary">{analysis.summary.statusTitle}</Text>
              {analysis.summary.statusDetail ? (
                <Text className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {analysis.summary.statusDetail}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View className="flex-row gap-2">
            <View className="flex-1 rounded-xl bg-muted/50 p-3">
              <Text className="text-xs text-muted-foreground">Lưu ý</Text>
              <Text className="mt-1 text-lg font-bold text-foreground">{analysis.summary.warningCount}</Text>
            </View>
            <View className="flex-1 rounded-xl bg-muted/50 p-3">
              <Text className="text-xs text-muted-foreground">Nên chú ý</Text>
              <Text className="mt-1 text-lg font-bold text-amber-700">{attentionCount}</Text>
            </View>
            <View className="flex-1 rounded-xl bg-muted/50 p-3">
              <Text className="text-xs text-muted-foreground">Độ tin cậy</Text>
              <Text className="mt-1 text-lg font-bold text-primary">{analysis.confidencePercent}%</Text>
            </View>
          </View>

          <Text className="text-xs text-muted-foreground">
            Cập nhật: {analysis.formattedCreatedAt}
            {analysis.isStale ? ' · cần phân tích lại vì thực đơn đã thay đổi' : ''}
          </Text>

          {analysis.incompleteData.length > 0 ? (
            <View className="rounded-xl border border-amber-300 bg-amber-50 p-3">
              <Text className="text-sm font-semibold text-amber-800">Dữ liệu chưa đầy đủ</Text>
              <Text className="mt-1 text-xs leading-relaxed text-amber-800">{analysis.incompleteData.join(', ')}</Text>
            </View>
          ) : null}

          {analysis.warnings.length === 0 ? (
            <View className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <Text className="text-sm font-semibold text-primary">Không có lưu ý đáng chú ý</Text>
              <Text className="mt-1 text-xs leading-relaxed text-muted-foreground">{analysis.disclaimer}</Text>
            </View>
          ) : (
            analysis.warnings.map((warning) => (
              <Pressable
                key={warning.id}
                onPress={() => onOpenWarning(warning)}
                className={cn(
                  'rounded-xl border p-3 active:opacity-80',
                  warning.severity === 'INFO' ? 'border-primary/20 bg-primary/5' : 'border-amber-300 bg-amber-50'
                )}>
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text
                      className={cn(
                        'text-sm font-bold',
                        warning.severity === 'INFO' ? 'text-primary' : 'text-amber-800'
                      )}>
                      {warning.title}
                    </Text>
                    <Text className="mt-1 text-xs text-muted-foreground">
                      {warning.severityLabel} · {warning.scopeLabel}
                    </Text>
                  </View>
                  <Info size={15} color={colors.mutedForeground} />
                </View>
                <Text numberOfLines={3} className="mt-2 text-sm leading-relaxed text-foreground">
                  {warning.explanation}
                </Text>
                {warning.affectedItemNames.length > 0 ? (
                  <Text numberOfLines={1} className="mt-2 text-xs text-muted-foreground">
                    Món liên quan: {warning.affectedItemNames.join(', ')}
                  </Text>
                ) : null}
                <Text className="mt-1.5 text-[11px] font-semibold text-primary">Xem chi tiết</Text>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

export default function MealPlanDetailScreen() {
  const router = useRouter();
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';

  const { data: plan, error, isLoading, isError, refetch, isRefetching } = useMealPlanDetailQuery(id, isAuthenticated);
  const {
    data: analysis,
    error: analysisError,
    isLoading: isAnalysisLoading,
    isError: isAnalysisError,
  } = useMealAnalysisQuery(id, isAuthenticated && id.length > 0);
  const swapMutation = useSwapMealItemMutation();
  const manualAddMutation = useManualAddMealMutation();
  const deleteMutation = useDeleteMealPlanMutation();
  const analyzeMutation = useAnalyzeMealPlanMutation(id, plan?.lockVersion ?? 0);

  const [pickSlot, setPickSlot] = React.useState<MealSlot | null>(null);
  const [openWarning, setOpenWarning] = React.useState<MealAnalysisWarning | null>(null);

  /** Cảnh báo phân tích theo từng ô (chỉ dùng khi phân tích còn hiện hành). */
  const warningsBySlotId = React.useMemo(() => {
    const map = new Map<string, MealAnalysisWarning[]>();
    if (!analysis || analysis.isStale) return map;
    for (const warning of analysis.warnings) {
      for (const item of warning.affectedItems) {
        if (!item.itemId) continue;
        map.set(item.itemId, [...(map.get(item.itemId) ?? []), warning]);
      }
    }
    return map;
  }, [analysis]);

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

  const refreshPlan = async () => {
    try {
      const result = await refetch();
      if (result.error) {
        Alert.alert('Không tải lại được thực đơn', getMealPlanErrorMessage(result.error));
      }
    } catch (refreshError) {
      Alert.alert('Không tải lại được thực đơn', getMealPlanErrorMessage(refreshError));
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

  const analyzePlan = async () => {
    if (!plan) return;
    try {
      await analyzeMutation.mutateAsync();
    } catch (mutationError) {
      Alert.alert('Không phân tích được thực đơn', getMealAnalysisErrorMessage(mutationError));
    }
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

  const days = groupDays(plan);
  const busy =
    swapMutation.isPending || deleteMutation.isPending || analyzeMutation.isPending || manualAddMutation.isPending;
  const targets = plan.estimatedTargets;

  return (
    <SiteScreen>
      <View className="px-5 pt-4">
        <View className="flex-row items-center justify-between">
          <Link href={'/meal-plans/saved' as Href} asChild>
            <Pressable className="flex-row items-center gap-1.5">
              <ArrowLeft size={15} color={colors.foreground} />
              <Text className="text-xs font-semibold text-foreground">Lịch sử thực đơn</Text>
            </Pressable>
          </Link>
          <View className="flex-row gap-2">
            <Pressable
              disabled={busy || isRefetching}
              onPress={() => void refreshPlan()}
              className={cn(
                'h-10 w-10 items-center justify-center rounded-full bg-muted',
                busy || isRefetching ? 'opacity-60' : ''
              )}>
              {isRefetching ? (
                <ActivityIndicator size="small" color={colors.foreground} />
              ) : (
                <RefreshCw size={16} color={colors.foreground} />
              )}
            </Pressable>
            <Pressable
              disabled={busy}
              onPress={confirmDelete}
              className="h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 size={16} color={colors.destructive} />
            </Pressable>
          </View>
        </View>

        <Text className="mt-4 text-2xl font-bold text-foreground">Thực đơn tuần {plan.formattedWeekRange}</Text>
        <Text className="mt-1 text-sm text-muted-foreground">
          {plan.goalLabel} · {plan.filledSlots}/{plan.totalSlots} bữa · Dinh dưỡng: {plan.nutritionDataQualityLabel} · bản{' '}
          {plan.version}
        </Text>

        <View className="mt-4 flex-row gap-2">
          <View className="flex-1 rounded-xl border border-border bg-card p-3">
            <Text className="text-xs text-muted-foreground">Mục tiêu/ngày</Text>
            <Text className="mt-1 text-lg font-bold text-primary">{plan.targetCalories} kcal</Text>
          </View>
          <View className="flex-1 rounded-xl border border-border bg-card p-3">
            <Text className="text-xs text-muted-foreground">Vitamin B12 ước tính</Text>
            <Text className="mt-1 text-lg font-bold text-primary">
              {plan.vitaminB12Mcg === null ? 'Chưa có' : `${plan.vitaminB12Mcg} mcg`}
            </Text>
          </View>
        </View>

        {targets ? (
          <View className="mt-2 rounded-xl border border-border bg-card p-3">
            <Text className="text-xs text-muted-foreground">Mục tiêu tham khảo mỗi ngày (ước tính)</Text>
            <Text className="mt-1 text-sm font-semibold text-foreground">{formatMacros(targets)}</Text>
          </View>
        ) : null}

        <PlanSummary plan={plan} />
        <PlanWarnings plan={plan} />

        <AnalysisPanel
          analysis={analysis}
          error={analysisError}
          isLoading={isAnalysisLoading}
          isError={isAnalysisError}
          isAnalyzing={analyzeMutation.isPending}
          onAnalyze={() => void analyzePlan()}
          onOpenWarning={setOpenWarning}
        />

        <View className="mt-6 gap-4">
          {days.map((day) => (
            <View key={day.date} className="rounded-2xl border border-border bg-card p-4">
              <Text className="text-base font-bold text-foreground">{day.label}</Text>
              <View className="mt-3 gap-2.5">
                {day.slots.map((slot) => {
                  const slotWarnings = warningsBySlotId.get(slot.id) ?? [];
                  return (
                    <MealSlotCard
                      key={slot.id}
                      slot={slot}
                      disabled={busy}
                      warningCount={slotWarnings.length}
                      onWarningPress={() => setOpenWarning(slotWarnings[0] ?? null)}
                      onSwap={(item) => void swapSlot(item)}
                      onPick={setPickSlot}
                    />
                  );
                })}
              </View>
              {day.estimatedTotals ? (
                <Text className="mt-3 border-t border-border pt-2 text-[11px] text-muted-foreground">
                  Ước tính cả ngày: {formatMacros(day.estimatedTotals)}
                </Text>
              ) : null}
            </View>
          ))}
        </View>

        <View className="mt-6 rounded-2xl border border-border bg-card p-4">
          <View className="flex-row items-center gap-2">
            <ShoppingCart size={16} color={colors.primary} />
            <Text className="text-base font-bold text-foreground">Danh sách đi chợ</Text>
            <Text className="text-xs text-muted-foreground">({plan.shoppingList.length} nguyên liệu)</Text>
          </View>
          <View className="mt-3 gap-2">
            {plan.shoppingList.length === 0 ? (
              <Text className="text-sm text-muted-foreground">Chưa có nguyên liệu cần mua.</Text>
            ) : (
              plan.shoppingList.map((item, index) => (
                <View
                  key={`${item.ingredientId ?? item.name}-${index}`}
                  className="flex-row items-center justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2">
                  <Text className="flex-1 text-sm font-medium text-foreground">{item.name}</Text>
                  <Text className="text-xs font-semibold text-primary">
                    {item.quantity} {item.unit}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        <Text className="mt-4 text-xs text-muted-foreground">
          {plan.vitaminB12Mcg !== null
            ? `Tổng vitamin B12 ước tính: ${plan.vitaminB12Mcg} mcg (chỉ tính từ món có dữ liệu).`
            : 'Chưa có dữ liệu vitamin B12 cho thực đơn này.'}
        </Text>
      </View>

      <MealItemSelector
        visible={pickSlot !== null}
        slotLabel={pickSlot ? `bữa ${pickSlot.mealTypeLabel.toLowerCase()} (${pickSlot.dateLabel})` : 'bữa ăn'}
        onSelect={(item) => void pickMeal(item)}
        onClose={() => setPickSlot(null)}
      />
      <AnalysisWarningModal warning={openWarning} onClose={() => setOpenWarning(null)} />
    </SiteScreen>
  );
}
