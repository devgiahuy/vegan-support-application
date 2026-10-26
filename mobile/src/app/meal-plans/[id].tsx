import * as React from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from 'react-native';
import { Link, type Href, useLocalSearchParams, useRouter } from 'expo-router';
import {
  BarChart3,
  Flame,
  Info,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from 'lucide-react-native';

import { MealType } from '@/common/enums';
import { SiteScreen } from '@/components/layout/site-screen';
import { ShowMoreButton, useShowMore } from '@/components/shared/show-more';
import { PrimaryButton } from '@/components/ui/primary-button';
import { IncompleteDataNotice } from '@/features/meal-analysis/components/incomplete-data-notice';
import { AnalysisWarningModal } from '@/features/meal-analysis/components/analysis-warning-modal';
import {
  useAnalyzeMealPlanMutation,
  useMealAnalysisQuery,
} from '@/features/meal-analysis/queries/meal-analysis.queries';
import type { MealAnalysis, MealAnalysisWarning } from '@/features/meal-analysis/types/meal-analysis.model';
import { MealItemSelector, type SelectedMealItem } from '@/features/meal-plan/components/meal-item-selector';
import { MealSlotCard } from '@/features/meal-plan/components/meal-slot-card';
import { PlanDayCard } from '@/features/meal-plan/components/plan-day-card';
import { PlanShoppingList } from '@/features/meal-plan/components/plan-shopping-list';
import { PlanNutritionTargets } from '@/features/meal-plan/components/plan-nutrition-targets';
import {
  useDeleteMealPlanMutation,
  useManualAddMealMutation,
  useMealPlanDetailQuery,
  useSwapMealItemMutation,
} from '@/features/meal-plan/queries/meal-plan.queries';
import type { EstimatedMacros, MealPlan, MealSlot } from '@/features/meal-plan/types/meal-plan.model';
import { createIdempotencyKey } from '@/features/meal-plan/utils/idempotency';
import { mealsFromPlan } from '@/features/shopping/utils/plan-meals';
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

/** Mã cảnh báo kỹ thuật không cần hiện cho người dùng (đồng bộ `WarningsBanner` của web). */
const HIDDEN_WARNING_CODES = new Set(['UNFILLED_SLOT', 'MICRONUTRIENT_DATA_PARTIAL']);

/** Banner tóm tắt kế hoạch do backend tính (mức nghiêm trọng, ràng buộc ăn kiêng được bảo toàn). */
function PlanSummary({ plan }: { plan: MealPlan }) {
  const colors = useIconColors();
  const summary = plan.userSummary;
  if (!summary || (!summary.title && !summary.detail)) return null;

  const isBlocked = summary.status === 'HARD_CONSTRAINT_BLOCKED';

  // Món vi phạm ràng buộc bắt buộc: chỉ hiện một thẻ đỏ; chi tiết đầy đủ nằm ở mục "Phân tích thực đơn".
  if (isBlocked) {
    return (
      <View className="flex-row items-center gap-1.5 self-start rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1.5">
        <TriangleAlert size={14} color={colors.destructive} />
        <Text className="shrink text-xs font-semibold text-destructive">
          {summary.title || 'Có món chưa đáp ứng yêu cầu ăn uống bắt buộc'}
        </Text>
      </View>
    );
  }

  return (
    <View
      className={cn(
        'gap-1.5 rounded-xl border p-4',
        isBlocked ? 'border-destructive/30 bg-destructive/5' : 'border-primary/20 bg-primary/5'
      )}>
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <View className="flex-row items-center gap-2">
          {isBlocked ? (
            <TriangleAlert size={15} color={colors.destructive} />
          ) : (
            <ShieldCheck size={15} color={colors.primary} />
          )}
          <Text className={cn('text-sm font-semibold', isBlocked ? 'text-destructive' : 'text-foreground')}>
            {summary.title || 'Tóm tắt kế hoạch thực đơn'}
          </Text>
        </View>
        {summary.hardConstraintsPreserved ? (
          <View className="rounded-full border border-emerald-500/30 px-2 py-0.5">
            <Text className="text-[11px] text-emerald-600 dark:text-emerald-400">✓ Bảo toàn ràng buộc ăn kiêng</Text>
          </View>
        ) : null}
      </View>
      {summary.detail ? <Text className="text-xs leading-5 text-muted-foreground">{summary.detail}</Text> : null}
      {summary.suggestion ? (
        <Text className="text-xs italic leading-5 text-muted-foreground">💡 {summary.suggestion}</Text>
      ) : null}
    </View>
  );
}

/** Cảnh báo phát sinh khi tạo thực đơn (món lặp, dữ liệu vi chất...) — nền trung tính, chỉ icon mang màu cảnh báo. */
function PlanWarnings({ plan }: { plan: MealPlan }) {
  const colors = useIconColors();
  const warnings = plan.warnings.filter((warning) => !HIDDEN_WARNING_CODES.has(warning.code));
  if (warnings.length === 0) return null;

  return (
    <View className="gap-2 rounded-xl border border-border bg-card p-4">
      <View className="flex-row items-center gap-2">
        <TriangleAlert size={16} color={colors.warning} />
        <Text className="text-sm font-semibold text-foreground">Lưu ý về thực đơn tuần này</Text>
      </View>
      <View className="gap-3">
        {warnings.map((warning) => (
          <View key={warning.code} className="gap-0.5">
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="text-xs font-semibold text-foreground">{warning.message}</Text>
              <View className="rounded-full border border-border px-1.5 py-0.5">
                <Text className="text-[10px] text-foreground">{warning.severityLabel}</Text>
              </View>
            </View>
            {warning.detail ? (
              <Text className="text-xs leading-5 text-muted-foreground">{warning.detail}</Text>
            ) : null}
            {warning.suggestion ? (
              <Text className="text-xs italic leading-5 text-muted-foreground">💡 {warning.suggestion}</Text>
            ) : null}
            {warning.affectedSlots.length > 0 ? (
              <Text className="text-[11px] text-muted-foreground">
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
  // Danh sách lưu ý có thể rất dài (mỗi ngày một thẻ) nên chỉ hiện thẻ đầu, phần còn lại mở bằng "Xem thêm".
  const warningList = useShowMore(analysis?.warnings ?? [], 1);

  return (
    <View className="rounded-2xl border border-border bg-card p-4">
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
              <Text className="mt-1 text-lg font-bold text-amber-700 dark:text-amber-400">{attentionCount}</Text>
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
            <IncompleteDataNotice notes={analysis.incompleteData} />
          ) : null}

          {analysis.warnings.length === 0 ? (
            <View className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <Text className="text-sm font-semibold text-primary">Không có lưu ý đáng chú ý</Text>
              <Text className="mt-1 text-xs leading-relaxed text-muted-foreground">{analysis.disclaimer}</Text>
            </View>
          ) : (
            warningList.visible.map((warning) => (
              <Pressable
                key={warning.id}
                onPress={() => onOpenWarning(warning)}
                className={cn(
                  'rounded-xl border p-3 active:opacity-80',
                  warning.severity === 'INFO' ? 'border-primary/20 bg-primary/5' : 'border-amber-500/30 bg-amber-500/10'
                )}>
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text
                      className={cn(
                        'text-sm font-bold',
                        warning.severity === 'INFO' ? 'text-primary' : 'text-amber-800 dark:text-amber-300'
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
          <ShowMoreButton
            collapsible={warningList.collapsible}
            expanded={warningList.expanded}
            hiddenCount={warningList.hiddenCount}
            onPress={warningList.toggle}
          />
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

  const { data: plan, error, isLoading, isError, refetch } = useMealPlanDetailQuery(id, isAuthenticated);
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
  const planMeals = mealsFromPlan(plan.items);
  const busy =
    swapMutation.isPending || deleteMutation.isPending || analyzeMutation.isPending || manualAddMutation.isPending;
  const targets = plan.estimatedTargets;

  return (
    <SiteScreen
      onRefresh={() => refetch()}
      // Mỗi khối là con trực tiếp của ScrollView để giữ nguyên vị trí đang xem khi phân tích/lưu ý phía trên tải lại sau khi đổi món.
      contentClassName="gap-4 px-5 pt-4"
      maintainContentPosition
      fab={
        <>
          <MealItemSelector
            visible={pickSlot !== null}
            slotLabel={pickSlot ? `bữa ${pickSlot.mealTypeLabel.toLowerCase()} (${pickSlot.dateLabel})` : 'bữa ăn'}
            onSelect={(item) => void pickMeal(item)}
            onClose={() => setPickSlot(null)}
          />
          <AnalysisWarningModal warning={openWarning} onClose={() => setOpenWarning(null)} />
        </>
      }>
      <>
        <View className="gap-2">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-2xl font-bold tracking-tight text-foreground">
              Thực đơn tuần {plan.formattedWeekRange}
            </Text>
            <Pressable
              disabled={busy}
              onPress={confirmDelete}
              accessibilityRole="button"
              accessibilityLabel="Xóa thực đơn"
              className={cn(
                'h-10 w-10 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10',
                busy ? 'opacity-60' : ''
              )}>
              <Trash2 size={17} color={colors.destructive} />
            </Pressable>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Flame size={15} color={colors.mutedForeground} />
            <Text className="flex-1 text-sm text-muted-foreground">
              Mục tiêu ~{plan.targetCalories} kcal/ngày — {plan.filledSlots}/{plan.totalSlots} bữa đã lấp
            </Text>
          </View>
          <View className="flex-row flex-wrap items-center gap-2 pt-1">
            <View className="rounded-full bg-secondary px-2.5 py-1">
              <Text className="text-xs font-medium text-secondary-foreground">{plan.goalLabel}</Text>
            </View>
            <View className="rounded-full border border-border px-2.5 py-1">
              <Text className="text-xs font-medium text-foreground">Bản {plan.version}</Text>
            </View>
            <View className="rounded-full border border-border px-2.5 py-1">
              <Text className="text-xs font-medium text-foreground">
                Dinh dưỡng: {plan.nutritionDataQualityLabel.toLowerCase()}
              </Text>
            </View>
          </View>
        </View>

        <PlanSummary plan={plan} />
        {targets ? <PlanNutritionTargets targets={targets} /> : null}
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

        {days.map((day) => (
          <PlanDayCard
            key={day.date}
            label={day.label}
            slots={day.slots}
            estimatedTotals={day.estimatedTotals}
            targetCalories={plan.targetCalories}
            targets={targets}>
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
          </PlanDayCard>
        ))}

        <PlanShoppingList items={plan.shoppingList} meals={planMeals} />

        <Text className="text-xs text-muted-foreground">
          {plan.vitaminB12Mcg !== null
            ? `Tổng vitamin B12 ước tính: ${plan.vitaminB12Mcg} mcg (chỉ tính từ món có dữ liệu).`
            : 'Chưa có dữ liệu vitamin B12 cho thực đơn này.'}
        </Text>
      </>
    </SiteScreen>
  );
}
