import { Pressable, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { ArrowRight, Award, CalendarRange, Target, TriangleAlert } from 'lucide-react-native';

import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import type { MealProgram } from '../types/meal-program.model';

export function programStatusStyle(status: MealProgram['status']): { badge: string; text: string } {
  if (status === 'CONFIRMED') return { badge: 'bg-emerald-500/10', text: 'text-emerald-600' };
  if (status === 'FAILED') return { badge: 'bg-destructive/10', text: 'text-destructive' };
  if (status === 'PARTIAL' || status === 'GENERATING') return { badge: 'bg-amber-500/10', text: 'text-amber-600' };
  return { badge: 'bg-primary/10', text: 'text-primary' };
}

/** Card một lộ trình (cùng bố cục card của web): dải tiêu đề + trạng thái, tên, mục tiêu, khoảng ngày, tiến độ. */
export function ProgramCard({ program }: { program: MealProgram }) {
  const colors = useIconColors();
  const style = programStatusStyle(program.status);
  const progress = program.horizonWeeks > 0 ? Math.min(100, (program.readyWeeks / program.horizonWeeks) * 100) : 0;

  return (
    <Link href={`/meal-programs/${program.id}` as Href} asChild>
      <Pressable className="overflow-hidden rounded-2xl border border-border bg-card">
        <View className="h-28 items-center justify-center bg-secondary">
          <Award size={34} color={colors.primary} />
          <Text className="mt-1.5 text-xs font-medium text-secondary-foreground">
            Lộ trình {program.horizonWeeks} tuần
          </Text>
          <View className={cn('absolute right-3 top-3 rounded-full bg-background px-2.5 py-1')}>
            <Text className={cn('text-xs font-semibold', style.text)}>{program.statusLabel}</Text>
          </View>
        </View>

        <View className="gap-3 p-4">
          <View className="gap-1">
            <Text numberOfLines={2} className="text-lg font-semibold text-foreground">
              {program.title}
            </Text>
            <Text className="text-sm text-muted-foreground">Mục tiêu: {program.goalLabel}</Text>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <CalendarRange size={13} color={colors.mutedForeground} />
              <Text className="text-xs text-muted-foreground">{program.rangeLabel}</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Target size={13} color={colors.mutedForeground} />
              <Text className="text-xs text-muted-foreground">
                {program.readyWeeks}/{program.horizonWeeks} tuần sẵn sàng
              </Text>
            </View>
          </View>

          <View className="h-1.5 overflow-hidden rounded-full bg-muted">
            <View className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </View>

          {program.failedWeeks > 0 || program.warningCount > 0 ? (
            <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
              {program.failedWeeks > 0 ? (
                <Text className="text-[11px] font-medium text-destructive">{program.failedWeeks} tuần lỗi</Text>
              ) : null}
              {program.warningCount > 0 ? (
                <View className="flex-row items-center gap-1">
                  <TriangleAlert size={12} color="#b45309" />
                  <Text className="text-[11px] font-medium text-amber-700">{program.warningCount} lưu ý phân tích</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <View className="h-10 flex-row items-center justify-center gap-1.5 rounded-md bg-secondary">
            <Text className="text-sm font-medium text-secondary-foreground">Xem chi tiết lộ trình</Text>
            <ArrowRight size={16} color={colors.primary} />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
