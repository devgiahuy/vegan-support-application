import { Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { CalendarDays, CheckCircle2, Flame, Sparkles } from 'lucide-react-native';

import type { MealPlan } from '../types/meal-plan.model';

/**
 * Đầu trang chi tiết thực đơn — đồng bộ khối "Hero header" của web: nhãn "Kế hoạch thực đơn tuần", mục tiêu, bản,
 * chất lượng dữ liệu dinh dưỡng, tiêu đề tuần, mục tiêu calo và tiến độ lấp bữa. Nút "Xóa thực đơn" nằm ở thanh trên cùng.
 */
export function PlanHero({ plan }: { plan: MealPlan }) {
  const { colorScheme } = useColorScheme();
  const emerald = colorScheme === 'dark' ? '#34d399' : '#059669';
  const complete = plan.totalSlots > 0 && plan.filledSlots === plan.totalSlots;

  return (
    <View className="gap-4 rounded-3xl border border-emerald-500/20 bg-emerald-50/60 p-5 dark:bg-emerald-950/30">
      <View className="gap-3">
        <View className="flex-row flex-wrap items-center gap-2">
          <View className="flex-row items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
            <CalendarDays size={14} color={emerald} />
            <Text className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Kế hoạch thực đơn tuần</Text>
          </View>
          <View className="flex-row items-center gap-1 rounded-full border border-emerald-300/40 bg-emerald-100/90 px-2.5 py-1 dark:bg-emerald-950/80">
            <Sparkles size={12} color={emerald} />
            <Text className="text-xs font-medium text-emerald-800 dark:text-emerald-300">{plan.goalLabel}</Text>
          </View>
          <View className="rounded-full border border-border bg-background/60 px-2.5 py-1">
            <Text className="text-xs text-muted-foreground">Bản {plan.version}</Text>
          </View>
          <View className="rounded-full border border-border bg-background/60 px-2.5 py-1">
            <Text className="text-xs text-muted-foreground">Dinh dưỡng: {plan.nutritionDataQualityLabel.toLowerCase()}</Text>
          </View>
        </View>

        <Text className="text-2xl font-black tracking-tight text-foreground">Thực đơn tuần {plan.formattedWeekRange}</Text>

        <View className="flex-row flex-wrap items-center gap-2.5">
          <View className="flex-row items-center gap-2 rounded-xl border border-border bg-card/80 px-3.5 py-1.5">
            <Flame size={16} color="#f97316" />
            <Text className="text-xs font-medium text-foreground">
              Mục tiêu <Text className="font-mono font-bold">~{plan.targetCalories.toLocaleString('vi-VN')}</Text> kcal/ngày
            </Text>
          </View>
          <View className="flex-row items-center gap-2 rounded-xl border border-border bg-card/80 px-3.5 py-1.5">
            <CheckCircle2 size={16} color={emerald} />
            <Text className="text-xs font-medium text-foreground">
              Tiến độ: <Text className="font-bold text-emerald-600 dark:text-emerald-400">{plan.filledSlots}/{plan.totalSlots}</Text> bữa đã lấp
            </Text>
            {complete ? (
              <View className="rounded-full bg-emerald-500/15 px-1.5 py-0.5">
                <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">100%</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}
