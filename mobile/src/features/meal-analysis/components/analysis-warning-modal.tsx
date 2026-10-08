import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { BookMarked, TriangleAlert, X } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';
import type { MealAnalysisWarning } from '../types/meal-analysis.model';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-3 border-b border-border/60 py-2">
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="flex-1 text-right text-xs font-semibold text-foreground">{value}</Text>
    </View>
  );
}

/**
 * Chi tiết một cảnh báo phân tích: diễn giải, số đo so với ngưỡng, độ tin cậy, nguồn bằng chứng, món/nguyên
 * liệu liên quan và gợi ý điều chỉnh. Cảnh báo chỉ mang tính tham khảo, không phải lệnh cấm.
 */
export function AnalysisWarningModal({
  warning,
  onClose,
}: {
  warning: MealAnalysisWarning | null;
  onClose: () => void;
}) {
  const colors = useIconColors();
  if (!warning) return null;

  const measured =
    warning.measuredValue !== null
      ? `${warning.measuredValue}${warning.unit ? ` ${warning.unit}` : ''}`
      : null;
  const limit = warning.limitValue !== null ? `${warning.limitValue}${warning.unit ? ` ${warning.unit}` : ''}` : null;
  const comparisonLabel =
    warning.targetComparison === 'ABOVE'
      ? 'Cao hơn mục tiêu ước tính'
      : warning.targetComparison === 'BELOW'
        ? 'Thấp hơn mục tiêu ước tính'
        : null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Đóng" />
        <View className="max-h-[85%] rounded-t-3xl bg-background px-5 pb-6 pt-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 flex-row items-start gap-2">
              <TriangleAlert size={18} color={colors.cta} />
              <View className="flex-1">
                <Text className="text-base font-bold text-foreground">{warning.title}</Text>
                <Text className="mt-0.5 text-xs text-muted-foreground">
                  {warning.severityLabel} · {warning.scopeLabel}
                  {warning.targetDate ? ` · ${warning.targetDate}` : ''}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} accessibilityLabel="Đóng" className="h-9 w-9 items-center justify-center rounded-full bg-muted">
              <X size={16} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView className="mt-3" contentContainerClassName="gap-3 pb-2">
            <Text className="text-sm leading-relaxed text-foreground">{warning.explanation}</Text>
            {warning.detail && warning.detail !== warning.explanation ? (
              <Text className="text-xs leading-relaxed text-muted-foreground">{warning.detail}</Text>
            ) : null}

            {measured || limit || comparisonLabel || warning.confidence > 0 ? (
              <View className="rounded-xl border border-border bg-card px-3">
                {measured ? <DetailRow label="Giá trị ước tính" value={measured} /> : null}
                {limit ? <DetailRow label="Ngưỡng tham chiếu" value={limit} /> : null}
                {comparisonLabel ? <DetailRow label="So với mục tiêu" value={comparisonLabel} /> : null}
                {warning.confidence > 0 ? (
                  <DetailRow label="Độ tin cậy" value={`${Math.round(warning.confidence * 100)}%`} />
                ) : null}
              </View>
            ) : null}

            {warning.suggestedAdjustment ? (
              <View className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                <Text className="text-xs font-semibold text-primary">Gợi ý điều chỉnh</Text>
                <Text className="mt-1 text-sm leading-relaxed text-foreground">{warning.suggestedAdjustment}</Text>
              </View>
            ) : null}

            {warning.affectedItems.length > 0 ? (
              <View className="gap-1.5">
                <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Món liên quan</Text>
                {warning.affectedItems.map((item) => (
                  <View key={`${item.itemId}-${item.name}`} className="rounded-lg bg-muted/60 px-3 py-2">
                    <Text className="text-sm font-medium text-foreground">{item.name || 'Món trong thực đơn'}</Text>
                    <Text className="text-[11px] text-muted-foreground">
                      {item.mealTypeLabel}
                      {item.date ? ` · ${item.date}` : ''}
                      {item.servings !== null ? ` · ${item.servings} khẩu phần` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            {warning.affectedIngredients.length > 0 ? (
              <Text className="text-xs text-muted-foreground">
                Nguyên liệu liên quan: {warning.affectedIngredients.join(', ')}
              </Text>
            ) : null}

            {warning.evidenceSource || warning.evidenceGradeLabel ? (
              <View className="flex-row items-start gap-2 rounded-xl border border-border p-3">
                <BookMarked size={15} color={colors.mutedForeground} />
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-foreground">Cơ sở khoa học</Text>
                  {warning.evidenceSource ? (
                    <Text className="mt-0.5 text-xs text-muted-foreground">
                      {warning.evidenceSource}
                      {warning.evidenceSourceVersion ? ` (${warning.evidenceSourceVersion})` : ''}
                    </Text>
                  ) : null}
                  {warning.evidenceGradeLabel ? (
                    <Text className="mt-0.5 text-xs text-muted-foreground">{warning.evidenceGradeLabel}</Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {warning.incompleteDataNotes.length > 0 ? (
              <View className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                <Text className="text-xs font-semibold text-amber-800">Dữ liệu chưa đầy đủ</Text>
                <Text className="mt-1 text-xs leading-relaxed text-amber-800">
                  {warning.incompleteDataNotes.join(' · ')}
                </Text>
              </View>
            ) : null}

            <Text className="text-[11px] italic text-muted-foreground">
              Cảnh báo chỉ mang tính tham khảo dinh dưỡng, không thay thế tư vấn của chuyên gia y tế.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
