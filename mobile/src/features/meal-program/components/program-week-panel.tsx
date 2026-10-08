import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { AlertTriangle, Check, ExternalLink, Flame, RefreshCw, Utensils } from 'lucide-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import type { ProgramAlternative, ProgramWeek } from '../types/meal-program.model';

function weekStatusStyle(week: ProgramWeek): { badge: string; text: string } {
  if (week.status === 'FAILED') return { badge: 'bg-destructive/10', text: 'text-destructive' };
  if (week.status === 'PENDING') return { badge: 'bg-amber-500/10', text: 'text-amber-600' };
  return { badge: 'bg-emerald-500/10', text: 'text-emerald-600' };
}

function AlternativeCard({
  alternative,
  locked,
  busy,
  onSelect,
}: {
  alternative: ProgramAlternative;
  locked: boolean;
  busy: boolean;
  onSelect: (alternative: ProgramAlternative) => void;
}) {
  const colors = useIconColors();
  return (
    <View
      className={cn(
        'gap-2 rounded-xl border p-3',
        alternative.selected ? 'border-primary bg-primary/5' : 'border-border bg-background'
      )}>
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-sm font-bold text-foreground">Phương án {alternative.rank + 1}</Text>
        {alternative.selected ? (
          <View className="flex-row items-center gap-1 rounded-full bg-primary px-2 py-0.5">
            <Check size={11} color={colors.primaryForeground} strokeWidth={3} />
            <Text className="text-[11px] font-semibold text-primary-foreground">Đang chọn</Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
        <View className="flex-row items-center gap-1">
          <Utensils size={12} color={colors.mutedForeground} />
          <Text className="text-xs text-muted-foreground">{alternative.mealCount} bữa</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Flame size={12} color={colors.cta} />
          <Text className="text-xs font-medium text-cta">{alternative.totalCalories} kcal / tuần</Text>
        </View>
        {alternative.warningCount > 0 ? (
          <Text className="text-xs text-amber-700">{alternative.warningCount} lưu ý</Text>
        ) : null}
      </View>

      {alternative.sampleDishes.length > 0 ? (
        <Text numberOfLines={2} className="text-xs leading-relaxed text-muted-foreground">
          Ví dụ: {alternative.sampleDishes.join(' · ')}
        </Text>
      ) : null}

      <View className="flex-row gap-2">
        {alternative.mealPlanId ? (
          <Link href={{ pathname: '/meal-plans/[id]', params: { id: alternative.mealPlanId } } as unknown as Href} asChild>
            <Pressable className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-input py-2">
              <ExternalLink size={13} color={colors.foreground} />
              <Text className="text-xs font-semibold text-foreground">Xem thực đơn</Text>
            </Pressable>
          </Link>
        ) : null}
        {!alternative.selected && !locked ? (
          <Pressable
            disabled={busy}
            onPress={() => onSelect(alternative)}
            className={cn('flex-1 items-center justify-center rounded-lg bg-primary py-2', busy ? 'opacity-60' : '')}>
            <Text className="text-xs font-semibold text-primary-foreground">Chọn phương án này</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/**
 * Tab "Thực đơn tuần" — đồng bộ `week-plan-view` của web: chọn tuần, xem các phương án, chọn phương án chính,
 * sinh thêm phương án (có giới hạn do backend), xử lý tuần bị lỗi. Lộ trình đã xác nhận thì khóa mọi thay đổi.
 */
export function ProgramWeekPanel({
  weeks,
  selectedWeekIndex,
  onSelectWeek,
  locked,
  busy,
  onSelectAlternative,
  onRegenerate,
}: {
  weeks: ProgramWeek[];
  selectedWeekIndex: number;
  onSelectWeek: (weekIndex: number) => void;
  locked: boolean;
  busy: boolean;
  onSelectAlternative: (week: ProgramWeek, alternative: ProgramAlternative) => void;
  onRegenerate: (week: ProgramWeek) => void;
}) {
  const colors = useIconColors();
  const week = weeks.find((item) => item.weekIndex === selectedWeekIndex) ?? weeks[0];

  if (!week) {
    return (
      <View className="rounded-2xl border border-dashed border-border p-5">
        <Text className="text-sm text-muted-foreground">Chưa có chi tiết tuần hoặc lộ trình đang được tạo.</Text>
      </View>
    );
  }

  const style = weekStatusStyle(week);

  return (
    <View className="gap-3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
        <View className="flex-row gap-2">
          {weeks.map((item) => {
            const selected = item.weekIndex === week.weekIndex;
            return (
              <Pressable
                key={item.id}
                onPress={() => onSelectWeek(item.weekIndex)}
                className={cn('rounded-lg px-3 py-2', selected ? 'bg-primary' : 'bg-muted')}>
                <Text
                  className={cn(
                    'text-xs font-semibold',
                    selected ? 'text-primary-foreground' : 'text-muted-foreground'
                  )}>
                  Tuần {item.weekNumber}
                  {item.status === 'FAILED' ? ' ⚠' : item.selectedRank !== null ? ' ✓' : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View className="gap-3 rounded-2xl border border-border bg-card p-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-base font-bold text-foreground">Tuần {week.weekNumber}</Text>
            <Text className="text-xs text-muted-foreground">{week.weekRangeLabel}</Text>
          </View>
          <View className={cn('rounded-full px-2.5 py-1', style.badge)}>
            <Text className={cn('text-xs font-semibold', style.text)}>{week.statusLabel}</Text>
          </View>
        </View>

        {week.isProjectionStale ? (
          <View className="flex-row items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3">
            <AlertTriangle size={14} color="#b45309" />
            <Text className="flex-1 text-xs leading-relaxed text-amber-800">
              Tuần này có thể đã cũ vì phương án của tuần trước đã thay đổi. Hãy phân tích lại lộ trình.
            </Text>
          </View>
        ) : null}

        {week.status === 'FAILED' ? (
          <View className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <Text className="text-sm font-semibold text-destructive">Không tạo được tuần này</Text>
            {week.failureMessage ? (
              <Text className="mt-1 text-xs leading-relaxed text-muted-foreground">{week.failureMessage}</Text>
            ) : null}
          </View>
        ) : null}

        {week.alternatives.length === 0 ? (
          <Text className="text-sm text-muted-foreground">
            {week.status === 'PENDING' ? 'Đang tạo phương án cho tuần này...' : 'Tuần này chưa có phương án nào.'}
          </Text>
        ) : (
          <View className="gap-2.5">
            {week.alternatives.map((alternative) => (
              <AlternativeCard
                key={alternative.id}
                alternative={alternative}
                locked={locked}
                busy={busy}
                onSelect={(item) => onSelectAlternative(week, item)}
              />
            ))}
          </View>
        )}

        {!locked ? (
          week.canRegenerate ? (
            <PrimaryButton
              label={week.status === 'FAILED' ? `Thử tạo lại tuần ${week.weekNumber}` : `Sinh thêm phương án cho tuần ${week.weekNumber}`}
              variant="outline"
              loading={busy}
              icon={<RefreshCw size={15} color={colors.foreground} />}
              onPress={() => onRegenerate(week)}
            />
          ) : (
            <Text className="text-center text-[11px] text-muted-foreground">
              Tuần này đã hết lượt sinh thêm phương án. Hãy chọn một trong các phương án hiện có.
            </Text>
          )
        ) : null}
      </View>
    </View>
  );
}
