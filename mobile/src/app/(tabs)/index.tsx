import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import {
  CalendarDays,
  Camera,
  ChevronRight,
  LogIn,
  Scale,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
  Warehouse,
} from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { EmptyState, ErrorState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useMealPlanDetailQuery, useMealPlansQuery } from '@/features/meal-plan/queries/meal-plan.queries';
import { RecommendedForYou } from '@/features/recommendation/components/recommended-for-you';
import { RecipeCard } from '@/features/recipe/components/recipe-card';
import { useRecipesQuery } from '@/features/recipe/queries/recipe.queries';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';

function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDayShort(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return match ? `${match[3]}/${match[2]}` : date;
}

/**
 * Trang chủ — điểm bắt đầu tác vụ trên điện thoại:
 * 1. Nhiệm vụ chính (Bữa ăn hôm nay / Lập thực đơn 7 ngày hoặc Đăng nhập & Khám phá).
 * 2. Công cụ hằng ngày ưu tiên theo tần suất dùng (Tủ bếp, Quét AI, Trợ lý AI, Tra cứu 100g).
 * 3. Tối đa 3 công thức gợi ý / nổi bật dạng hàng ngang gọn kèm "Xem tất cả" sang Khám phá.
 */
export default function HomeScreen() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const {
    data: plansPagination,
    isLoading: isPlansLoading,
    refetch: refetchPlans,
  } = useMealPlansQuery({ page: 1, limit: 1 }, isAuthenticated);
  const latestPlanSummary = isAuthenticated ? plansPagination?.items[0] : undefined;
  const { data: latestPlanDetail } = useMealPlanDetailQuery(
    latestPlanSummary?.id ?? '',
    Boolean(isAuthenticated && latestPlanSummary?.id && latestPlanSummary.items.length === 0)
  );
  const activePlan = latestPlanDetail ?? latestPlanSummary;

  const {
    data: recipesPagination,
    isLoading: isRecipesLoading,
    isError: isRecipesError,
    refetch: refetchRecipes,
  } = useRecipesQuery({ limit: 3 });
  const recipes = (recipesPagination?.items ?? []).slice(0, 3);

  const { daySlots, isTodaySlots, displayDateLabel } = React.useMemo(() => {
    const items = activePlan?.items ?? [];
    if (items.length === 0) {
      return { daySlots: [], isTodaySlots: false, displayDateLabel: '' };
    }
    const todayIso = getTodayIsoDate();
    const todayMatches = items.filter((slot) => slot.date === todayIso);
    if (todayMatches.length > 0) {
      return { daySlots: todayMatches.slice(0, 3), isTodaySlots: true, displayDateLabel: formatDayShort(todayIso) };
    }
    const firstDate = items[0]?.date ?? '';
    return {
      daySlots: items.filter((slot) => slot.date === firstDate).slice(0, 3),
      isTodaySlots: false,
      displayDateLabel: formatDayShort(firstDate),
    };
  }, [activePlan]);

  return (
    <SiteScreen
      showFooter={false}
      onRefresh={() =>
        Promise.all([
          refetchRecipes(),
          isAuthenticated ? refetchPlans() : Promise.resolve(),
        ])
      }>
      {/* Khối 1: Nhiệm vụ chính theo trạng thái người dùng */}
      <View className="px-5 pt-4">
        {isAuthenticated && isPlansLoading ? (
          <View className="h-48 rounded-3xl border border-border bg-muted" />
        ) : isAuthenticated && activePlan ? (
          <View className="gap-3.5 rounded-3xl border border-border bg-card p-4">
            <View className="flex-row items-start justify-between gap-2">
              <View className="min-w-0 flex-1">
                <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {isTodaySlots
                    ? `Bữa ăn hôm nay (${displayDateLabel})`
                    : `Thực đơn tuần ${activePlan.formattedWeekRange}`}
                </Text>
                <Text className="mt-0.5 text-lg font-bold text-foreground">
                  {isTodaySlots ? 'Lịch bữa ăn trong ngày' : 'Kế hoạch bữa ăn gần nhất'}
                </Text>
              </View>
              <View className="rounded-full bg-primary/10 px-2.5 py-1">
                <Text className="text-xs font-semibold text-primary">
                  {activePlan.goalLabel} · {activePlan.targetCalories} kcal
                </Text>
              </View>
            </View>

            {daySlots.length > 0 ? (
              <View className="gap-2 rounded-2xl bg-muted/40 p-3">
                {daySlots.map((slot) => (
                  <View key={slot.id} className="flex-row items-center gap-2.5">
                    <View className="w-12 items-center rounded-lg bg-background px-1.5 py-1">
                      <Text className="text-xs font-semibold text-primary">{slot.mealTypeLabel}</Text>
                    </View>
                    <Text numberOfLines={1} className="min-w-0 flex-1 text-sm font-medium text-foreground">
                      {slot.filled ? slot.recipeTitle : 'Chưa chọn món cho bữa này'}
                    </Text>
                    {slot.filled && slot.calories > 0 ? (
                      <Text className="text-xs text-muted-foreground">{slot.calories} kcal</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-sm text-muted-foreground">
                Đã sắp xếp {activePlan.filledSlots}/{activePlan.totalSlots} bữa ăn cho tuần{' '}
                {activePlan.formattedWeekRange}.
              </Text>
            )}

            <View className="flex-row gap-2">
              <Link href={`/meal-plans/${activePlan.id}` as Href} asChild>
                <PrimaryButton label="Xem thực đơn tuần" className="flex-[1.5]" />
              </Link>
              <Link href={'/shopping-preview' as Href} asChild>
                <PrimaryButton
                  label="Cần mua"
                  variant="outline"
                  className="flex-1"
                  icon={<ShoppingBag size={15} color={colors.foreground} />}
                  iconPosition="left"
                />
              </Link>
            </View>
          </View>
        ) : isAuthenticated ? (
          <View className="gap-3 rounded-3xl border border-border bg-card p-5">
            <View className="flex-row items-center gap-1.5">
              <CalendarDays size={15} color={colors.primary} />
              <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
                Bắt đầu tuần ăn chay
              </Text>
            </View>
            <Text className="text-xl font-bold leading-snug text-foreground">
              Tạo thực đơn 7 ngày phù hợp với bạn
            </Text>
            <Text className="text-sm leading-relaxed text-muted-foreground">
              Hệ thống tự sắp xếp bữa sáng, trưa, tối theo mục tiêu năng lượng và tránh các nguyên liệu bạn đã khai báo.
            </Text>
            <View className="gap-2 pt-1">
              <Link href={'/meal-plans' as Href} asChild>
                <PrimaryButton
                  label="Lên thực đơn ngay"
                  icon={<CalendarDays size={16} color={colors.primaryForeground} />}
                  iconPosition="left"
                />
              </Link>
              <Link href={'/diet-preferences' as Href} asChild>
                <PrimaryButton
                  label="Thiết lập ăn uống & dị ứng"
                  variant="outline"
                  icon={<SlidersHorizontal size={15} color={colors.foreground} />}
                  iconPosition="left"
                />
              </Link>
            </View>
          </View>
        ) : (
          <View className="gap-3 rounded-3xl border border-border bg-card p-5">
            <Text className="text-xs font-semibold uppercase tracking-wide text-primary">
              Đồng hành ăn chay khoa học
            </Text>
            <Text className="text-xl font-bold leading-snug text-foreground">
              Chọn món dễ dàng, ăn chay đủ chất mỗi ngày
            </Text>
            <Text className="text-sm leading-relaxed text-muted-foreground">
              Tìm công thức phù hợp khẩu vị hoặc đăng nhập để lưu thực đơn 7 ngày và lọc dị ứng cá nhân.
            </Text>
            <View className="gap-2 pt-1">
              <Link href={'/recipes' as Href} asChild>
                <PrimaryButton
                  label="Khám phá món chay"
                  icon={<UtensilsCrossed size={16} color={colors.primaryForeground} />}
                  iconPosition="left"
                />
              </Link>
              <Link href={'/(auth)/login' as Href} asChild>
                <PrimaryButton
                  label="Đăng nhập để tạo thực đơn"
                  variant="outline"
                  icon={<LogIn size={15} color={colors.foreground} />}
                  iconPosition="left"
                />
              </Link>
            </View>
          </View>
        )}
      </View>

      {/* Khối 2: Công cụ hằng ngày — phân thứ tự ưu tiên rõ */}
      <View className="mt-7 px-5">
        <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Công cụ hằng ngày
        </Text>

        <View className="mt-2.5 flex-row gap-2.5">
          <Link href={'/pantry' as Href} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tủ bếp gia đình: Nguyên liệu và hạn dùng"
              className="min-h-[88px] flex-1 justify-between rounded-2xl border border-border bg-card p-3.5 active:bg-muted/60">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Warehouse size={18} color={colors.primary} />
              </View>
              <View className="mt-2">
                <Text numberOfLines={1} className="text-sm font-bold text-foreground">
                  Tủ bếp gia đình
                </Text>
                <Text numberOfLines={1} className="mt-0.5 text-xs text-muted-foreground">
                  Nguyên liệu & hạn dùng
                </Text>
              </View>
            </Pressable>
          </Link>

          <Link href={'/fridge-scan' as Href} asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quét tủ lạnh và hóa đơn bằng AI"
              className="min-h-[88px] flex-1 justify-between rounded-2xl border border-border bg-card p-3.5 active:bg-muted/60">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Camera size={18} color={colors.primary} />
              </View>
              <View className="mt-2">
                <Text numberOfLines={1} className="text-sm font-bold text-foreground">
                  Quét tủ lạnh AI
                </Text>
                <Text numberOfLines={1} className="mt-0.5 text-xs text-muted-foreground">
                  Nhận diện nguyên liệu
                </Text>
              </View>
            </Pressable>
          </Link>
        </View>

        <View className="mt-2.5 gap-2">
          <Link href={'/assistant' as Href} asChild>
            <Pressable
              accessibilityRole="button"
              className="min-h-14 flex-row items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 active:bg-muted/60">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles size={18} color={colors.primary} />
              </View>
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="text-sm font-bold text-foreground">
                  Trợ lý AI dinh dưỡng
                </Text>
                <Text numberOfLines={1} className="mt-0.5 text-xs text-muted-foreground">
                  Hỏi thay thế nguyên liệu, vi chất & khẩu phần
                </Text>
              </View>
              <ChevronRight size={18} color={colors.mutedForeground} />
            </Pressable>
          </Link>

          <Link href={'/food-data' as Href} asChild>
            <Pressable
              accessibilityRole="button"
              className="min-h-14 flex-row items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 active:bg-muted/60">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Scale size={18} color={colors.primary} />
              </View>
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="text-sm font-bold text-foreground">
                  Tra cứu thực phẩm 100g
                </Text>
                <Text numberOfLines={1} className="mt-0.5 text-xs text-muted-foreground">
                  Thành phần dinh dưỡng, kiêng kỵ & chế biến
                </Text>
              </View>
              <ChevronRight size={18} color={colors.mutedForeground} />
            </Pressable>
          </Link>
        </View>
      </View>

      {/* Khối 3: Xem nhanh công thức — tối đa 3 món gọn, dẫn sang Khám phá */}
      <RecommendedForYou />

      <View className="mt-7 px-5 pb-4">
        <View className="flex-row items-end justify-between gap-2">
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-1.5">
              <TrendingUp size={14} color={colors.cta} />
              <Text className="text-xs font-semibold uppercase tracking-wide text-cta">
                Xu hướng
              </Text>
            </View>
            <Text className="mt-0.5 text-lg font-bold text-foreground">Món chay nổi bật</Text>
          </View>
          <Link href={'/recipes' as Href} asChild>
            <Pressable
              accessibilityRole="link"
              hitSlop={6}
              className="min-h-11 flex-row items-center gap-0.5 px-1">
              <Text className="text-xs font-semibold text-primary">Xem tất cả</Text>
              <ChevronRight size={14} color={colors.primary} />
            </Pressable>
          </Link>
        </View>

        <View className="mt-3 gap-2.5">
          {isRecipesLoading ? (
            [1, 2, 3].map((i) => (
              <View key={i} className="h-[88px] w-full rounded-2xl border border-border bg-muted" />
            ))
          ) : isRecipesError ? (
            <ErrorState
              title="Không tải được công thức."
              description="Kiểm tra kết nối mạng và thử lại."
              onRetry={() => void refetchRecipes()}
            />
          ) : recipes.length === 0 ? (
            <EmptyState
              title="Chưa có công thức nào"
              description="Hãy là người đầu tiên chia sẻ món chay với cộng đồng."
            />
          ) : (
            recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} variant="row" />)
          )}
        </View>
      </View>
    </SiteScreen>
  );
}
