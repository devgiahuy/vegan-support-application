import { Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Lightbulb, TriangleAlert } from 'lucide-react-native';

import type { PlanWarning } from '../types/meal-plan.model';

/** Mã cảnh báo kỹ thuật nội bộ không cần hiện cho người dùng (đồng bộ `WarningsBanner` của web). */
const HIDDEN_WARNING_CODES = new Set(['UNFILLED_SLOT', 'MICRONUTRIENT_DATA_PARTIAL']);

/**
 * Banner "Lưu ý về thực đơn tuần này" — đồng bộ `WarningsBanner` của web: tiêu đề kèm số lưu ý, mỗi lưu ý một thẻ gồm
 * tên, nhãn mức độ, giải thích và gợi ý (có biểu tượng bóng đèn).
 */
export function PlanWarningsBanner({ warnings }: { warnings: PlanWarning[] }) {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';
  const visible = warnings.filter((warning) => !HIDDEN_WARNING_CODES.has(warning.code));
  if (visible.length === 0) return null;

  return (
    <View className="rounded-2xl border border-amber-300/60 bg-amber-500/10 p-4 dark:border-amber-900/50">
      <View className="flex-row items-start gap-3">
        <View className="mt-0.5 size-9 items-center justify-center rounded-xl bg-amber-500/20">
          <TriangleAlert size={20} color={dark ? '#fcd34d' : '#b45309'} />
        </View>
        <View className="min-w-0 flex-1 gap-2.5">
          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <Text className="text-sm font-bold text-foreground">Lưu ý về thực đơn tuần này</Text>
            <View className="rounded-full border border-amber-500/20 bg-amber-500/15 px-2.5 py-0.5">
              <Text className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">{visible.length} lưu ý</Text>
            </View>
          </View>

          <View className="gap-2.5">
            {visible.map((warning) => (
              <View key={warning.code} className="gap-1.5 rounded-xl border border-amber-200/60 bg-card/85 p-3.5 dark:border-amber-900/40">
                <View className="flex-row flex-wrap items-center gap-2">
                  {warning.message ? <Text className="text-xs font-semibold text-foreground">{warning.message}</Text> : null}
                  {warning.severityLabel ? (
                    <View className="rounded-full border border-amber-300 bg-amber-100/70 px-2 py-0.5 dark:border-amber-800 dark:bg-amber-950/70">
                      <Text className="text-[10px] font-medium text-amber-800 dark:text-amber-300">{warning.severityLabel}</Text>
                    </View>
                  ) : null}
                </View>
                {warning.detail ? <Text className="text-xs leading-5 text-muted-foreground">{warning.detail}</Text> : null}
                {warning.suggestion ? (
                  <View className="flex-row items-start gap-2 pt-1">
                    <Lightbulb size={14} color={dark ? '#fbbf24' : '#d97706'} />
                    <Text className="flex-1 text-xs font-medium leading-5 text-amber-900 dark:text-amber-200">{warning.suggestion}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
