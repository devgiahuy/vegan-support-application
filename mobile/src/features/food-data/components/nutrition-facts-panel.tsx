import * as React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Award, ExternalLink, Flame, ShieldCheck, Sparkles, X } from 'lucide-react-native';
import * as Linking from 'expo-linking';

import { ErrorState, LoadingState } from '@/components/shared/state-views';
import { useIconColors } from '@/lib/theme-colors';
import { useIngredientNutrientsQuery, useReferenceIntakesQuery } from '../queries/food-data.queries';
import type { NutrientItem, ProvenanceInfo } from '../types/food-data.model';

/** Huy hiệu nguồn dữ liệu; chạm để xem xuất xứ, phiên bản và giấy phép (đồng bộ `SourceProvenanceBadge` của web). */
function SourceBadge({ provenance }: { provenance: ProvenanceInfo }) {
  const colors = useIconColors();
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        className="min-h-8 flex-row items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1">
        <ShieldCheck size={12} color="#059669" />
        <Text numberOfLines={1} className="max-w-[110px] text-[11px] font-medium text-emerald-800">
          {provenance.sourceName}
        </Text>
      </Pressable>
      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View className="w-full max-w-sm rounded-2xl bg-card p-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center gap-2">
                <View className="h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                  <Award size={18} color="#059669" />
                </View>
                <Text className="flex-1 text-base font-semibold text-foreground">Minh bạch xuất xứ dữ liệu</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                onPress={() => setOpen(false)}
                className="h-11 w-11 items-center justify-center rounded-full">
                <X size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View className="mt-3 gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <View className="flex-row justify-between gap-2">
                <Text className="text-xs text-muted-foreground">Nguồn xuất bản:</Text>
                <Text className="text-xs font-semibold text-foreground">{provenance.sourceName}</Text>
              </View>
              <View className="flex-row justify-between gap-2">
                <Text className="text-xs text-muted-foreground">Nhà cung cấp:</Text>
                <Text className="text-xs font-medium text-foreground">{provenance.provider}</Text>
              </View>
              <View className="flex-row justify-between gap-2">
                <Text className="text-xs text-muted-foreground">Phiên bản kiểm định:</Text>
                <Text className="font-mono text-xs text-foreground">{provenance.sourceVersion}</Text>
              </View>
              {provenance.effectiveFrom ? (
                <View className="flex-row justify-between gap-2">
                  <Text className="text-xs text-muted-foreground">Hiệu lực từ:</Text>
                  <Text className="font-mono text-xs text-foreground">{provenance.effectiveFrom}</Text>
                </View>
              ) : null}
            </View>

            {provenance.attribution ? (
              <View className="mt-2 rounded-md border-l-2 border-emerald-500 bg-emerald-50/60 p-2.5">
                <Text className="text-xs font-medium text-emerald-900">Trích dẫn bản quyền bắt buộc:</Text>
                <Text className="mt-0.5 text-xs text-muted-foreground">{provenance.attribution}</Text>
              </View>
            ) : null}

            <View className="mt-3 flex-row items-center justify-between gap-2">
              <Text className="flex-1 text-xs text-muted-foreground">
                Giấy phép: <Text className="font-semibold text-foreground">{provenance.licenseName}</Text>
              </Text>
              {provenance.sourceUrl ? (
                <Pressable
                  accessibilityRole="link"
                  onPress={() => void Linking.openURL(provenance.sourceUrl as string)}
                  className="min-h-10 flex-row items-center gap-1 rounded-lg border border-input px-3">
                  <Text className="text-xs font-semibold text-foreground">Xem nguồn</Text>
                  <ExternalLink size={12} color={colors.foreground} />
                </Pressable>
              ) : null}
            </View>

            <Text className="mt-3 border-t border-border pt-2 text-[11px] italic text-muted-foreground">
              Dữ liệu dinh dưỡng chuẩn hóa trên 100g phần ăn được, phục vụ giáo dục dinh dưỡng, không thay thế chẩn đoán y khoa.
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

/**
 * Bảng "Giá trị Dinh dưỡng" của một nguyên liệu (trên 100g phần ăn được) — đồng bộ `NutritionFactsPanel` của web:
 * quy đổi gia dụng, năng lượng, đa lượng, vitamin & khoáng chất, dưỡng chất khác và %DV.
 * Dưỡng chất chưa có dữ liệu hiển thị "--" / "Chưa xác định", không bao giờ coi là 0.
 */
export function NutritionFactsPanel({ ingredientId }: { ingredientId: string }) {
  const { height } = useWindowDimensions();
  const { data, isLoading, isError, refetch } = useIngredientNutrientsQuery(ingredientId, { preparation: 'raw' });
  const { data: intakes } = useReferenceIntakesQuery({ populationCode: 'GENERAL_ADULT', limit: 100 });

  const calculateDV = (code: string, amount: number | null): number | null => {
    if (amount === null || !intakes?.items?.length) return null;
    const ref = intakes.items.find((r) => r.nutrientCode === code && r.populationCode === 'GENERAL_ADULT');
    if (!ref || ref.value <= 0) return null;
    return Math.round((amount / ref.value) * 100);
  };

  const renderRow = (item: NutrientItem, bold = false) => {
    const dv = calculateDV(item.code, item.amount);
    return (
      <View key={item.id || item.code} className="flex-row items-center justify-between border-b border-muted py-1.5">
        <View className="flex-1 flex-row flex-wrap items-center gap-1.5 pr-2">
          <Text className={bold ? 'text-xs font-bold text-foreground' : 'text-xs text-foreground'}>{item.name}</Text>
          <Text className="font-mono text-[11px] text-muted-foreground">
            {item.isMissing ? 'Chưa xác định' : `${item.amount} ${item.unit}`}
          </Text>
        </View>
        <Text className="font-mono text-xs font-bold text-foreground">{!item.isMissing && dv !== null ? `${dv}%` : '--'}</Text>
      </View>
    );
  };

  if (isLoading) return <LoadingState message="Đang tải dữ liệu dinh dưỡng..." />;
  if (isError) {
    return (
      <ErrorState
        title="Không thể tải dữ liệu dinh dưỡng"
        description="Đã xảy ra lỗi khi kết nối với cơ sở dữ liệu dinh dưỡng chuẩn."
        onRetry={() => void refetch()}
      />
    );
  }
  if (
    !data ||
    (data.energyKcal === null &&
      data.macronutrients.length === 0 &&
      data.vitamins.length === 0 &&
      data.minerals.length === 0)
  ) {
    return (
      <View className="items-center rounded-2xl border border-dashed border-border p-6">
        <Sparkles size={22} color="#9ca3af" />
        <Text className="mt-2 text-center font-semibold text-foreground">Chưa có hồ sơ dinh dưỡng kiểm định</Text>
        <Text className="mt-1 text-center text-sm text-muted-foreground">
          Dữ liệu thành phần trên 100g cho nguyên liệu này đang được chuẩn hóa và kiểm định bởi ban biên tập.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ maxHeight: height * 0.72 }} showsVerticalScrollIndicator={false}>
      <View className="gap-1 pb-2">
        <View className="flex-row items-start justify-between gap-2">
          <View className="flex-1">
            <Text className="text-xl font-black uppercase tracking-tight text-foreground">Giá trị Dinh dưỡng</Text>
            <Text className="mt-0.5 text-xs text-muted-foreground">
              Tính trên 100g phần ăn được ({data.ediblePortionPercent}% ăn được)
            </Text>
          </View>
          <SourceBadge provenance={data.provenance} />
        </View>

        {data.householdConversions.length > 0 ? (
          <View className="my-1 flex-row flex-wrap gap-x-2 gap-y-0.5 rounded-lg bg-muted/40 px-2 py-1">
            <Text className="text-[11px] font-medium text-muted-foreground">Quy đổi:</Text>
            {data.householdConversions.map((c) => (
              <Text key={c.id || c.unitName} className="font-mono text-[11px] text-muted-foreground">
                {c.quantity} {c.unitName} ≈ {c.grams}g
              </Text>
            ))}
          </View>
        ) : null}

        <View className="my-2 flex-row items-baseline justify-between border-y-4 border-foreground py-2">
          <View className="flex-row items-center gap-1.5">
            <Flame size={18} color="#f59e0b" />
            <Text className="text-sm font-black uppercase text-foreground">Năng lượng / Calo</Text>
          </View>
          <Text className="font-mono text-2xl font-black text-foreground">
            {data.energyKcal !== null ? data.energyKcal : '--'}
            <Text className="text-xs font-normal text-muted-foreground"> kcal</Text>
          </Text>
        </View>

        <Text className="pb-1 text-right text-[11px] font-bold text-muted-foreground">% Giá trị Hàng ngày (% DV)*</Text>

        <View className="border-t border-foreground">
          {data.macronutrients.length > 0 ? (
            data.macronutrients.map((m) => renderRow(m, true))
          ) : (
            <Text className="py-1 text-xs italic text-muted-foreground">Chưa có thông số đa lượng chi tiết.</Text>
          )}
        </View>

        {data.vitamins.length > 0 || data.minerals.length > 0 ? (
          <View className="mt-2 border-t-4 border-foreground pt-2">
            <Text className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Vitamin & Khoáng chất
            </Text>
            {data.minerals.map((m) => renderRow(m))}
            {data.vitamins.map((v) => renderRow(v))}
          </View>
        ) : null}

        {data.otherNutrients.length > 0 ? (
          <View className="mt-1 border-t border-muted pt-1">
            <Text className="mb-0.5 text-[11px] font-semibold text-muted-foreground">Dưỡng chất khác:</Text>
            <View className="flex-row flex-wrap gap-2">
              {data.otherNutrients.map((other) => (
                <View key={other.id || other.code} className="rounded bg-muted/60 px-1.5 py-0.5">
                  <Text className="text-[10px] text-muted-foreground">
                    {other.name}: {other.isMissing ? '--' : `${other.amount} ${other.unit}`}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View className="mt-3 gap-1 border-t-2 border-foreground/40 pt-2">
          <Text className="text-[10px] leading-normal text-muted-foreground">
            * % Giá trị Hàng ngày (% DV) cho biết một khẩu phần 100g thực phẩm đóng góp bao nhiêu vào chế độ dinh dưỡng khuyến
            nghị hàng ngày.
          </Text>
          <Text className="text-[10px] font-medium leading-normal text-emerald-700 dark:text-emerald-400">
            ** Quy tắc an toàn: Ký hiệu (--) thể hiện dưỡng chất chưa có dữ liệu xét nghiệm trong nguồn kiểm định, tuyệt đối không
            được coi là bằng 0.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

/** Popup hiện bảng dinh dưỡng của một nguyên liệu (đồng bộ hộp thoại xem nhanh dinh dưỡng của web). */
export function IngredientNutritionModal({
  ingredient,
  onClose,
}: {
  ingredient: { id: string; name: string } | null;
  onClose: () => void;
}) {
  const colors = useIconColors();
  return (
    <Modal visible={Boolean(ingredient)} animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/60 px-5">
        <Pressable accessibilityLabel="Đóng" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View className="max-h-[88%] w-full max-w-md overflow-hidden rounded-3xl border border-border bg-background p-5">
          <View className="mb-2 flex-row items-center justify-between gap-2">
            <Text numberOfLines={1} className="flex-1 text-sm font-semibold text-muted-foreground">
              {ingredient?.name}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              onPress={onClose}
              hitSlop={6}
              className="h-11 w-11 items-center justify-center rounded-full bg-muted">
              <X size={18} color={colors.foreground} />
            </Pressable>
          </View>
          {ingredient ? <NutritionFactsPanel ingredientId={ingredient.id} /> : null}
        </View>
      </View>
    </Modal>
  );
}
