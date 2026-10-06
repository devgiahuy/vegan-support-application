import { Pressable, Text, View } from 'react-native';
import { AlertCircle, CheckCircle2, Circle, Loader } from 'lucide-react-native';

import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import type { ProgramWeek } from '../types/meal-program.model';

/** Tab "Dòng thời gian" — mỗi tuần một mốc với trạng thái và phương án đang chọn; bấm để mở tuần đó. */
export function ProgramTimeline({
  weeks,
  selectedWeekIndex,
  onSelectWeek,
}: {
  weeks: ProgramWeek[];
  selectedWeekIndex: number;
  onSelectWeek: (weekIndex: number) => void;
}) {
  const colors = useIconColors();

  if (weeks.length === 0) {
    return <Text className="text-sm text-muted-foreground">Chưa có tuần nào trong lộ trình.</Text>;
  }

  return (
    <View className="gap-0">
      {weeks.map((week, index) => {
        const isLast = index === weeks.length - 1;
        const Icon =
          week.status === 'FAILED'
            ? AlertCircle
            : week.status === 'PENDING'
              ? Loader
              : week.selectedRank !== null
                ? CheckCircle2
                : Circle;
        const iconColor =
          week.status === 'FAILED' ? colors.destructive : week.selectedRank !== null ? colors.primary : colors.mutedForeground;
        return (
          <Pressable key={week.id} onPress={() => onSelectWeek(week.weekIndex)} className="flex-row gap-3">
            <View className="items-center">
              <Icon size={20} color={iconColor} />
              {!isLast ? <View className="w-0.5 flex-1 bg-border" /> : null}
            </View>
            <View
              className={cn(
                'mb-3 flex-1 rounded-xl border p-3',
                week.weekIndex === selectedWeekIndex ? 'border-primary bg-primary/5' : 'border-border bg-card'
              )}>
              <Text className="text-sm font-bold text-foreground">Tuần {week.weekNumber}</Text>
              <Text className="text-xs text-muted-foreground">{week.weekRangeLabel}</Text>
              <Text className="mt-1 text-xs text-muted-foreground">
                {week.statusLabel}
                {week.selectedRank !== null ? ` · đã chọn phương án ${week.selectedRank + 1}` : ''}
                {week.status === 'READY' && week.selectedRank === null ? ' · chưa chọn phương án' : ''}
                {week.isProjectionStale ? ' · cần phân tích lại' : ''}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
