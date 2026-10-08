import { Pressable, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { ArrowRight, Flame } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';
import type { MealPlan } from '../types/meal-plan.model';

/** Card tóm tắt một phiên bản thực đơn — đồng bộ `PlanCard` của web. */
export function PlanCard({ plan }: { plan: MealPlan }) {
  const colors = useIconColors();

  return (
    <Link href={{ pathname: '/meal-plans/[id]', params: { id: plan.id } } as unknown as Href} asChild>
      <Pressable className="gap-2 rounded-2xl border border-border bg-card p-4">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="flex-1 text-base font-bold text-foreground">Tuần {plan.formattedWeekRange}</Text>
          <View className="rounded-full bg-primary/10 px-2.5 py-1">
            <Text className="text-xs font-semibold text-primary">{plan.goalLabel}</Text>
          </View>
        </View>
        <Text className="text-xs text-muted-foreground">
          Bản {plan.version} — {plan.filledSlots}/{plan.totalSlots} bữa đã lấp
          {plan.warnings.length > 0 ? ` — ${plan.warnings.length} lưu ý` : ''}
        </Text>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-1.5">
            <Flame size={14} color={colors.cta} />
            <Text className="text-sm text-muted-foreground">Mục tiêu {plan.targetCalories} kcal/ngày</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Text className="text-xs font-semibold text-primary">Xem chi tiết</Text>
            <ArrowRight size={13} color={colors.primary} />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
