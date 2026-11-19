import { Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';

import { PrimaryButton } from '@/components/ui/primary-button';
import type { DietaryRepairResult } from '@/features/diet-preferences/types/diet-impact.model';
import { summarizeDietRepair } from '@/features/diet-preferences/utils/diet-repair-result';

export function DietRepairResult({ result, onRetry }: { result: DietaryRepairResult; onRetry: () => void }) {
  const summary = summarizeDietRepair(result);

  return (
    <View className="gap-4">
      <View className={`gap-2 rounded-xl border p-4 ${summary.complete ? 'border-primary/30 bg-primary/5' : 'border-amber-400/50 bg-amber-500/10'}`}>
        <Text accessibilityRole="header" className="text-lg font-semibold text-foreground">{summary.title}</Text>
        <Text className="text-sm leading-5 text-muted-foreground">{summary.detail}</Text>
        <Text className="text-xs leading-5 text-muted-foreground">Thiết lập ăn uống mới vẫn được áp dụng dù một số thực đơn chưa điều chỉnh được.</Text>
      </View>
      {result.results.map((plan) => (
        <View key={plan.planId} className="gap-3 rounded-xl border border-border bg-card p-4">
          <Text className="text-sm leading-5 text-foreground">{plan.message || (plan.status === 'UPDATED' ? 'Đã cập nhật món ăn.' : 'Nội dung thực đơn được giữ nguyên.')}</Text>
          {plan.remainingAffectedMeals > 0 ? (
            <Text className="text-xs text-destructive">Còn {plan.remainingAffectedMeals} bữa cần xử lý.</Text>
          ) : null}
          <Link href={`/meal-plans/${plan.planId}` as Href} asChild>
            <PrimaryButton label="Xem thực đơn" variant="outline" />
          </Link>
        </View>
      ))}
      {!summary.complete ? <PrimaryButton label="Tìm lại món thay thế" onPress={onRetry} /> : null}
      <Link href={'/(tabs)/profile' as Href} asChild>
        <PrimaryButton label="Về hồ sơ" variant="outline" />
      </Link>
    </View>
  );
}
