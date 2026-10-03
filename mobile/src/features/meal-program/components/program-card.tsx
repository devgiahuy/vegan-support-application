import { Pressable, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { ArrowRight, CalendarRange, TriangleAlert } from 'lucide-react-native';

import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import type { MealProgram } from '../types/meal-program.model';

export function programStatusStyle(status: MealProgram['status']): { badge: string; text: string } {
  if (status === 'CONFIRMED') return { badge: 'bg-emerald-500/10', text: 'text-emerald-600' };
  if (status === 'FAILED') return { badge: 'bg-destructive/10', text: 'text-destructive' };
  if (status === 'PARTIAL' || status === 'GENERATING') return { badge: 'bg-amber-500/10', text: 'text-amber-600' };
  return { badge: 'bg-primary/10', text: 'text-primary' };
}

/** Card tóm tắt một lộ trình: tên, trạng thái, khoảng ngày, mục tiêu và tiến độ số tuần. */
export function ProgramCard({ program }: { program: MealProgram }) {
  const colors = useIconColors();
  const style = programStatusStyle(program.status);
  const progress = program.horizonWeeks > 0 ? Math.min(100, (program.readyWeeks / program.horizonWeeks) * 100) : 0;

  return (
    <Link href={`/meal-programs/${program.id}` as Href} asChild>
      <Pressable className="gap-3 rounded-2xl border border-border bg-card p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text numberOfLines={2} className="text-base font-bold text-foreground">
              {program.title}
            </Text>
            <View className="mt-1 flex-row items-center gap-1.5">
              <CalendarRange size={12} color={colors.mutedForeground} />
              <Text className="text-xs text-muted-foreground">
                {program.rangeLabel} · {program.goalLabel}
              </Text>
            </View>
          </View>
          <View className={cn('rounded-full px-2.5 py-1', style.badge)}>
            <Text className={cn('text-xs font-semibold', style.text)}>{program.statusLabel}</Text>
          </View>
        </View>

        <View className="gap-1.5">
          <View className="h-1.5 overflow-hidden rounded-full bg-muted">
            <View className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </View>
          <Text className="text-[11px] text-muted-foreground">
            {program.readyWeeks}/{program.horizonWeeks} tuần sẵn sàng
            {program.failedWeeks > 0 ? ` · ${program.failedWeeks} tuần lỗi` : ''}
          </Text>
        </View>

        <View className="flex-row items-center justify-between">
          {program.warningCount > 0 ? (
            <View className="flex-row items-center gap-1">
              <TriangleAlert size={12} color="#b45309" />
              <Text className="text-[11px] font-medium text-amber-700">{program.warningCount} lưu ý phân tích</Text>
            </View>
          ) : (
            <View />
          )}
          <View className="flex-row items-center gap-1">
            <Text className="text-xs font-semibold text-primary">Xem chi tiết</Text>
            <ArrowRight size={13} color={colors.primary} />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
