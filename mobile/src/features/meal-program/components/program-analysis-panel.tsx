import { Text, View } from 'react-native';
import { AlertTriangle, Info, LineChart } from 'lucide-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import type { MealProgram } from '../types/meal-program.model';

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <View className="min-w-[46%] flex-1 rounded-xl border border-border bg-card p-3">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="mt-1 text-lg font-bold text-primary">{value}</Text>
      {note ? <Text className="text-[11px] text-muted-foreground">{note}</Text> : null}
    </View>
  );
}

/**
 * Tab "Phân tích tích lũy" — năng lượng và vitamin B12 ước tính trên các tuần đã chọn phương án, cùng cảnh báo
 * lặp món/tuần chưa đủ dữ liệu. Chỉ số thiếu dữ liệu hiển thị "Chưa có", không coi là 0.
 */
export function ProgramAnalysisPanel({
  program,
  busy,
  onReanalyze,
}: {
  program: MealProgram;
  busy: boolean;
  onReanalyze: () => void;
}) {
  const colors = useIconColors();
  const analysis = program.analysis;

  if (!analysis) {
    return (
      <View className="items-center gap-2 rounded-2xl border border-dashed border-border p-6">
        <LineChart size={22} color={colors.mutedForeground} />
        <Text className="text-center font-semibold text-foreground">Chưa có phân tích tích lũy</Text>
        <Text className="text-center text-sm text-muted-foreground">
          Phân tích xuất hiện sau khi ít nhất một tuần có phương án được chọn.
        </Text>
        {!program.isConfirmed ? <PrimaryButton label="Phân tích lộ trình" loading={busy} className="mt-2 w-full" onPress={onReanalyze} /> : null}
      </View>
    );
  }

  const nutrition = analysis.nutrition;

  return (
    <View className="gap-4">
      {analysis.isStale ? (
        <View className="flex-row items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <AlertTriangle size={15} color="#b45309" />
          <View className="flex-1">
            <Text className="text-sm font-semibold text-amber-900">Phân tích đã cũ</Text>
            <Text className="mt-0.5 text-xs leading-relaxed text-amber-800">
              {analysis.invalidatedFromWeekNumber !== null
                ? `Từ tuần ${analysis.invalidatedFromWeekNumber} trở đi dữ liệu đã thay đổi. `
                : ''}
              Hãy phân tích lại để cập nhật.
            </Text>
          </View>
        </View>
      ) : null}

      {nutrition ? (
        <View className="gap-3">
          <Text className="text-base font-bold text-foreground">Dinh dưỡng ước tính tích lũy</Text>
          <View className="flex-row flex-wrap gap-2.5">
            <Stat
              label="Tuần đã phân tích"
              value={`${nutrition.analyzedWeeks}/${nutrition.horizonWeeks}`}
              note={
                nutrition.incompleteWeekNumbers.length > 0
                  ? `Chưa tính: tuần ${nutrition.incompleteWeekNumbers.join(', ')}`
                  : undefined
              }
            />
            <Stat label="Tổng năng lượng" value={`${nutrition.totalCalories} kcal`} />
            <Stat label="Trung bình mỗi ngày" value={`${nutrition.averageDailyCalories} kcal`} />
            <Stat
              label="Vitamin B12 trung bình / tuần"
              value={nutrition.averageWeeklyVitaminB12Mcg === null ? 'Chưa có' : `${nutrition.averageWeeklyVitaminB12Mcg} mcg`}
              note={
                nutrition.totalVitaminB12Mcg === null
                  ? 'Chưa đủ dữ liệu vi chất'
                  : `Tổng ${nutrition.totalVitaminB12Mcg} mcg (chỉ tính từ món có dữ liệu)`
              }
            />
          </View>
        </View>
      ) : null}

      <View className="gap-2.5">
        <Text className="text-base font-bold text-foreground">Lưu ý ({analysis.warnings.length})</Text>
        {analysis.warnings.length === 0 ? (
          <View className="rounded-xl border border-primary/20 bg-primary/5 p-3">
            <Text className="text-sm font-semibold text-primary">Không có lưu ý đáng chú ý</Text>
          </View>
        ) : (
          analysis.warnings.map((warning) => (
            <View
              key={warning.key}
              className={cn(
                'gap-1 rounded-xl border p-3',
                warning.isCaution ? 'border-amber-300 bg-amber-50' : 'border-border bg-card'
              )}>
              <View className="flex-row items-start gap-2">
                {warning.isCaution ? <AlertTriangle size={14} color="#b45309" /> : <Info size={14} color={colors.mutedForeground} />}
                <Text className={cn('flex-1 text-sm font-semibold', warning.isCaution ? 'text-amber-900' : 'text-foreground')}>
                  {warning.title}
                </Text>
              </View>
              <Text className="text-xs leading-relaxed text-muted-foreground">{warning.description}</Text>
              {warning.suggestion ? (
                <Text className="text-xs leading-relaxed text-foreground">Gợi ý: {warning.suggestion}</Text>
              ) : null}
            </View>
          ))
        )}
      </View>

      {!program.isConfirmed ? (
        <PrimaryButton label="Phân tích lại" variant="outline" loading={busy} onPress={onReanalyze} />
      ) : null}

      <Text className="text-[11px] italic leading-relaxed text-muted-foreground">
        Số liệu chỉ là ước tính tham khảo từ dữ liệu món ăn hiện có, không thay thế tư vấn của chuyên gia dinh dưỡng.
      </Text>
    </View>
  );
}
