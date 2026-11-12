import { Text, View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { CheckCircle2, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react-native';

import { cn } from '@/lib/utils';
import type { PlanUserSummary } from '../types/meal-plan.model';
import { detailLinesOf, groupConstraintDetails } from '../utils/constraint-details';

/**
 * Tóm tắt kế hoạch và bảo toàn ràng buộc ăn kiêng — đồng bộ khối "Tóm tắt kế hoạch" của web: viền xanh khi ràng buộc được
 * giữ, viền hổ phách khi có món chưa đáp ứng (kèm danh sách món + bữa + lý do), huy hiệu "Bảo toàn ràng buộc ăn kiêng"
 * và gợi ý xử lý.
 */
export function PlanSummary({ summary }: { summary: PlanUserSummary }) {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';
  const preserved = summary.hardConstraintsPreserved;
  const detailLines = detailLinesOf(summary.detail);
  const violations = groupConstraintDetails(summary.hardViolations);

  return (
    <View className={cn('gap-3 rounded-2xl border p-4', preserved ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-amber-500/40 bg-amber-500/5')}>
      <View className="flex-row items-start gap-3">
        <View className="mt-0.5 size-9 items-center justify-center rounded-xl bg-emerald-500/15">
          {preserved ? <ShieldCheck size={20} color={dark ? '#6ee7b7' : '#047857'} /> : <TriangleAlert size={20} color="#b45309" />}
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-sm font-bold text-foreground">{summary.title || 'Tóm tắt kế hoạch thực đơn'}</Text>
          {violations.length > 0 ? (
            <View className="mt-1 gap-2">
              {violations.map((group) => (
                <Text key={JSON.stringify([group.name, group.details])} className="text-xs leading-5 text-foreground/85">
                  <Text className="font-semibold">{group.name}</Text>
                  {group.locations.length > 0 ? ` (${group.locations.join(', ')})` : ''}: {group.details.join('. ')}
                </Text>
              ))}
            </View>
          ) : detailLines.length > 1 ? (
            <View className="gap-1">
              {detailLines.map((line, index) => (
                <Text key={`${index}-${line}`} className="text-xs leading-5 text-foreground/85">
                  • {line}
                </Text>
              ))}
            </View>
          ) : detailLines[0] ? (
            <Text className="text-xs leading-5 text-foreground/85">{detailLines[0]}</Text>
          ) : null}
        </View>
      </View>

      {preserved ? (
        <View className="flex-row items-center gap-1.5 self-start rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1">
          <CheckCircle2 size={14} color={dark ? '#34d399' : '#059669'} />
          <Text className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Bảo toàn ràng buộc ăn kiêng</Text>
        </View>
      ) : null}

      {summary.suggestion ? (
        <View className="flex-row items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-2.5">
          <Sparkles size={16} color={dark ? '#fbbf24' : '#d97706'} />
          <Text className="flex-1 text-xs leading-5 text-amber-900 dark:text-amber-200">{summary.suggestion}</Text>
        </View>
      ) : null}
    </View>
  );
}
