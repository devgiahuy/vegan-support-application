import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { AlertTriangle, ChevronRight } from 'lucide-react-native';

import { FormSheet } from '@/components/shared/form-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import type { DietaryCompatibility } from '@/features/diet-preferences/types/diet-impact.model';
import { cn } from '@/lib/utils';

/** Đọc assessment do backend trả; không suy sự phù hợp từ thông báo đã đóng trên thiết bị. */
export function DietaryCompatibilityBanner({
  compatibility,
  repairHref,
  compact = false,
}: {
  compatibility: DietaryCompatibility | null;
  repairHref?: Href;
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  if (!compatibility || compatibility.status !== 'NEEDS_REVIEW') return null;

  const heading =
    compatibility.affectedMealCount > 0
      ? `${compatibility.affectedMealCount} bữa cần xem lại theo hồ sơ ăn uống hiện tại`
      : 'Thực đơn cần được xem lại theo hồ sơ ăn uống hiện tại';

  if (compact) {
    return (
      <View accessibilityRole="alert" className="flex-row items-center gap-2 rounded-xl border border-amber-400/50 bg-amber-500/10 px-3.5 py-2.5">
        <AlertTriangle size={15} color="#d97706" />
        <Text className="flex-1 text-xs font-semibold text-foreground">{heading}</Text>
      </View>
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${heading}. Nhấn để xem chi tiết.`}
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-3 rounded-2xl border border-amber-400/60 bg-amber-500/10 p-3.5 active:bg-amber-500/15"
      >
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20">
          <AlertTriangle size={18} color="#d97706" />
        </View>
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="text-sm font-bold text-foreground">{heading}</Text>
          <Text className="text-xs text-muted-foreground">
            Nhấn để xem danh sách món bị ảnh hưởng{repairHref ? ' và tìm món thay thế' : ''}.
          </Text>
        </View>
        <ChevronRight size={18} color="#b45309" />
      </Pressable>

      {open ? (
        <FormSheet
          title="Bữa cần xem lại"
          variant="bottom-sheet"
          onClose={() => setOpen(false)}
          footer={
            <View className="flex-row gap-2.5">
              <PrimaryButton
                label="Đóng"
                variant="outline"
                onPress={() => setOpen(false)}
                className="flex-1"
              />
              {repairHref ? (
                <PrimaryButton
                  label="Tìm món thay thế"
                  onPress={() => {
                    setOpen(false);
                    router.push(repairHref);
                  }}
                  className="flex-[1.6]"
                />
              ) : null}
            </View>
          }
        >
          <View className="flex-row items-start gap-2.5 rounded-xl border border-amber-400/40 bg-amber-500/10 p-3">
            <AlertTriangle size={16} color="#d97706" style={{ marginTop: 2 }} />
            <View className="flex-1 gap-1">
              <Text className="text-sm font-semibold text-foreground">{heading}</Text>
              <Text className="text-xs leading-relaxed text-muted-foreground">
                Nội dung thực đơn đang được giữ nguyên. Những món dưới đây không còn phù hợp hoặc chưa đủ dữ liệu để xác minh; giữ thực đơn không có nghĩa chúng phù hợp với thiết lập mới.
              </Text>
            </View>
          </View>

          {compatibility.items.length > 0 ? (
            <View className="overflow-hidden rounded-2xl border border-border bg-card">
              {compatibility.items.map((meal, index) => (
                <View
                  key={meal.itemId}
                  className={cn(
                    'gap-1 px-3.5 py-3',
                    index > 0 ? 'border-t border-border' : ''
                  )}
                >
                  <Text className="text-sm font-semibold text-foreground">{meal.name}</Text>
                  <Text className="text-xs text-muted-foreground">
                    {meal.dateLabel} · {meal.mealTypeLabel}
                  </Text>
                  <Text className="text-xs leading-relaxed text-destructive">
                    {meal.unverified ? 'Chưa xác minh được: ' : ''}
                    {meal.reasonLabels.join('; ')}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </FormSheet>
      ) : null}
    </>
  );
}
