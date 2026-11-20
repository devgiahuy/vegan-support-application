import * as React from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Flame,
  History,
  Info,
  RotateCw,
  X,
} from 'lucide-react-native';

import { ErrorState, LoadingState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import {
  useRecalculateNutritionMutation,
  useRecipeNutritionHistoryQuery,
  useRecipeNutritionQuery,
  useRecipeNutritionStatusQuery,
} from '../queries/recipe-nutrition.queries';
import type { NutrientLine, RecipeNutritionEstimate, UncoveredIngredient } from '../types/recipe-nutrition.model';

interface MacroTile {
  key: string;
  label: string;
  line: NutrientLine | undefined;
  percent: number | undefined;
  dotClass: string;
  barClass: string;
  tileClass: string;
  labelClass: string;
}

/** Khối năng lượng + phân bổ macro — bố cục đồng bộ `MacroDistributionBar` của web (kcal, thanh macro, 3 ô Đạm/Tinh bột/Béo). */
export function MacroSummary({ estimate }: { estimate: RecipeNutritionEstimate }) {
  const byCode = (code: string) => estimate.nutrients.find((line) => line.code === code);
  const energy = byCode('ENERGY_KCAL');
  const split = estimate.macroSplit;
  const tiles: MacroTile[] = [
    {
      key: 'PROTEIN',
      label: 'Đạm',
      line: byCode('PROTEIN'),
      percent: split?.proteinPercent,
      dotClass: 'bg-emerald-500',
      barClass: 'bg-emerald-500',
      tileClass: 'border-emerald-200/60 bg-emerald-50/60 dark:border-emerald-800/40 dark:bg-emerald-950/30',
      labelClass: 'text-emerald-800 dark:text-emerald-300',
    },
    {
      key: 'CARBS',
      label: 'Tinh bột',
      line: byCode('CARBS'),
      percent: split?.carbsPercent,
      dotClass: 'bg-amber-500',
      barClass: 'bg-amber-500',
      tileClass: 'border-amber-200/60 bg-amber-50/60 dark:border-amber-800/40 dark:bg-amber-950/30',
      labelClass: 'text-amber-800 dark:text-amber-300',
    },
    {
      key: 'FAT',
      label: 'Béo',
      line: byCode('FAT'),
      percent: split?.fatPercent,
      dotClass: 'bg-sky-500',
      barClass: 'bg-sky-500',
      tileClass: 'border-sky-200/60 bg-sky-50/60 dark:border-sky-800/40 dark:bg-sky-950/30',
      labelClass: 'text-sky-800 dark:text-sky-300',
    },
  ];
  const totalGrams = tiles.reduce((sum, tile) => sum + (tile.line?.amount ?? 0), 0);

  return (
    <View className="gap-4 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <View className="flex-row items-center gap-2.5">
          <View className="rounded-xl bg-orange-100 p-2 dark:bg-orange-950/50">
            <Flame size={20} color="#ea580c" />
          </View>
          <View>
            <View className="flex-row items-baseline gap-1.5">
              <Text className="text-2xl font-bold text-foreground">
                {energy ? `~${energy.formattedAmount}` : '—'}
              </Text>
              <Text className="text-sm font-semibold uppercase text-muted-foreground">kcal</Text>
            </View>
            <Text className="text-xs text-muted-foreground">năng lượng mỗi khẩu phần</Text>
          </View>
        </View>
        <View className="rounded-md bg-muted px-2.5 py-1">
          <Text className="text-xs font-medium text-muted-foreground">Khẩu phần: {estimate.servings} người ăn</Text>
        </View>
      </View>

      <View className="gap-1.5">
        <View className="flex-row items-center justify-between gap-2">
          <Text className="flex-1 text-xs font-medium text-muted-foreground">Tỷ lệ phân bổ đa lượng chất (Macro)</Text>
          <Text className="text-xs font-medium text-muted-foreground">
            {totalGrams > 0 ? `${totalGrams.toFixed(1).replace('.', ',')}g tổng` : 'Chưa có'}
          </Text>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Phân bổ năng lượng đạm, tinh bột, béo"
          className="h-3 w-full flex-row overflow-hidden rounded-full bg-muted/60">
          {totalGrams > 0
            ? tiles.map((tile) => {
                const width = ((tile.line?.amount ?? 0) / totalGrams) * 100;
                return width > 0 ? (
                  <View key={tile.key} className={tile.barClass} style={{ width: `${width}%` }} />
                ) : null;
              })
            : null}
        </View>
      </View>

      <View className="flex-row gap-2">
        {tiles.map((tile) => (
          <View key={tile.key} className={`flex-1 items-center rounded-lg border px-2 py-3 ${tile.tileClass}`}>
            <View className="mb-1 flex-row items-center justify-center gap-1.5">
              <View className={`h-2 w-2 rounded-full ${tile.dotClass}`} />
              <Text numberOfLines={1} className={`text-xs font-semibold ${tile.labelClass}`}>
                {tile.label}
              </Text>
            </View>
            <Text className="text-base font-bold text-foreground">
              {tile.line ? `~${tile.line.formattedAmount}${tile.line.unit}` : '—'}
            </Text>
            <Text className="mt-0.5 text-[11px] text-muted-foreground">
              {tile.percent !== undefined ? `${tile.percent}% calo` : 'Chưa có'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Cảnh báo nguyên liệu chưa có dữ liệu thành phần chuẩn — đồng bộ `UncoveredIngredientsAlert` của web. */
export function UncoveredIngredientsAlert({
  ingredients,
  confidencePercent,
}: {
  ingredients: UncoveredIngredient[];
  confidencePercent: number;
}) {
  const [open, setOpen] = React.useState(false);
  if (ingredients.length === 0) return null;
  return (
    <View className="rounded-xl border border-amber-300/80 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/30">
      <View className="flex-row items-start gap-3">
        <View className="mt-0.5 rounded-md bg-amber-200/80 p-1 dark:bg-amber-900/60">
          <AlertTriangle size={16} color="#92400e" />
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <Text className="flex-shrink text-sm font-semibold text-amber-900 dark:text-amber-200">
              Có {ingredients.length} nguyên liệu chưa có dữ liệu thành phần chuẩn
            </Text>
            <View className="rounded-full bg-amber-200/60 px-2 py-0.5 dark:bg-amber-900/50">
              <Text className="text-xs font-medium text-amber-800 dark:text-amber-300">Độ bao phủ: {confidencePercent}%</Text>
            </View>
          </View>
          <Text className="mt-1 text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/90">
            Số liệu dinh dưỡng hiển thị là mức tối thiểu đã xác định từ các nguyên liệu đã biết. Các nguyên liệu thiếu chưa
            được tính vào tổng năng lượng.
          </Text>
          <Pressable onPress={() => setOpen((value) => !value)} className="mt-2.5 flex-row items-center gap-1 self-start">
            <Text className="text-xs font-semibold text-amber-900 dark:text-amber-200">
              {open ? 'Thu gọn danh sách nguyên liệu' : 'Xem chi tiết các nguyên liệu thiếu'}
            </Text>
            {open ? <ChevronUp size={14} color="#78350f" /> : <ChevronDown size={14} color="#78350f" />}
          </Pressable>
          {open ? (
            <View className="mt-3 gap-2 border-t border-amber-200/60 pt-2.5 dark:border-amber-800/40">
              {ingredients.map((item, index) => (
                <View
                  key={`${item.displayName}-${index}`}
                  className="flex-row items-start gap-2 rounded-md bg-amber-100/50 p-2 dark:bg-amber-900/20">
                  <Info size={14} color="#b45309" />
                  <Text className="flex-1 text-xs text-amber-800/80 dark:text-amber-300/80">
                    <Text className="font-semibold text-amber-950 dark:text-amber-100">{item.displayName}</Text> ({item.reason})
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function HistoryModal({ postId, onClose }: { postId: string; onClose: () => void }) {
  const colors = useIconColors();
  const { data, isLoading, isError, refetch } = useRecipeNutritionHistoryQuery(postId, true);

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/60 px-5">
        <Pressable accessibilityLabel="Đóng" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View className="w-full max-w-md max-h-[80%] rounded-3xl border border-border bg-background p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold text-foreground">Lịch sử tính dinh dưỡng</Text>
            <Pressable onPress={onClose} accessibilityLabel="Đóng" className="h-9 w-9 items-center justify-center rounded-full bg-muted">
              <X size={16} color={colors.foreground} />
            </Pressable>
          </View>
          <ScrollView className="mt-3" contentContainerClassName="gap-2 pb-2">
            {isLoading ? (
              <LoadingState message="Đang tải lịch sử..." />
            ) : isError ? (
              <ErrorState title="Không tải được lịch sử." onRetry={() => void refetch()} />
            ) : (data?.items.length ?? 0) === 0 ? (
              <Text className="py-4 text-center text-sm text-muted-foreground">Chưa có lần tính nào được lưu.</Text>
            ) : (
              data?.items.map((item, index) => (
                <View key={`${item.estimateVersion}-${index}`} className="rounded-xl border border-border bg-card p-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-foreground">
                      Lần {item.estimateVersion ?? '—'}
                      {item.status === 'CURRENT' ? ' · Hiện hành' : ''}
                    </Text>
                    <Text className="text-[11px] text-muted-foreground">{item.formattedDate}</Text>
                  </View>
                  <Text className="mt-1 text-xs text-muted-foreground">
                    {item.caloriesPerServing !== null ? `${Math.round(item.caloriesPerServing)} kcal/khẩu phần` : 'Chưa có năng lượng'}
                    {' · '}
                    {item.servings} khẩu phần · tin cậy {item.confidencePercent}%
                    {item.aiUsed ? ' · có AI hỗ trợ' : ''}
                    {item.isStale ? ' · đã cũ' : ''}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function RecalculateModal({
  isPending,
  onClose,
  onConfirm,
}: {
  isPending: boolean;
  onClose: () => void;
  onConfirm: (useAiFallback: boolean) => void;
}) {
  const [useAiFallback, setUseAiFallback] = React.useState(true);
  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full max-w-sm rounded-2xl bg-card p-5">
          <Text className="text-base font-bold text-foreground">Tính toán lại dinh dưỡng</Text>
          <Text className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Hệ thống sẽ phân tích lại toàn bộ nguyên liệu sạch và các bước nấu của phiên bản hiện tại.
          </Text>
          <View className="mt-3 flex-row items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-3">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-foreground">Cho phép AI ước lượng vi chất còn thiếu</Text>
              <Text className="mt-0.5 text-[11px] text-muted-foreground">
                Gắn nhãn &quot;AI ước lượng&quot; rõ ràng cho các giá trị bổ trợ.
              </Text>
            </View>
            <Switch value={useAiFallback} onValueChange={setUseAiFallback} />
          </View>
          <View className="mt-4 flex-row gap-2">
            <PrimaryButton label="Hủy" variant="outline" className="flex-1" onPress={onClose} />
            <PrimaryButton
              label={isPending ? 'Đang tính...' : 'Bắt đầu tính lại'}
              className="flex-1"
              loading={isPending}
              onPress={() => onConfirm(useAiFallback)}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Thẻ "Phân tích Dinh dưỡng Nấu nướng" — đồng bộ `RecipeNutritionCard` của web, hiển thị theo mỗi khẩu phần:
 * năng lượng, phân bổ macro (đạm/tinh bột/béo), nguyên liệu thiếu dữ liệu, giả định, độ tin cậy và lịch sử.
 * Không hiển thị bảng vi chất. Số liệu luôn là ước tính tham khảo; chỉ số không có dữ liệu thì không
 * hiển thị là 0.
 */
export function RecipeNutritionCard({ postId, canManage }: { postId: string; canManage: boolean }) {
  const colors = useIconColors();
  const { data: nutrition, isLoading, isError, refetch } = useRecipeNutritionQuery(postId);
  const { data: status } = useRecipeNutritionStatusQuery(postId, canManage);
  const recalculate = useRecalculateNutritionMutation(postId);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [recalcOpen, setRecalcOpen] = React.useState(false);

  const isStale = Boolean(status?.isStale || nutrition?.isStale);

  const confirmRecalculate = async (useAiFallback: boolean) => {
    try {
      await recalculate.mutateAsync({ useAiFallback, expectedPostVersion: nutrition?.postVersion || undefined });
      setRecalcOpen(false);
    } catch (error) {
      Alert.alert('Không tính lại được', getApiErrorMessage(error, 'Đã có lỗi trong quá trình tính toán.'));
    }
  };

  if (isLoading) return <LoadingState message="Đang tính dinh dưỡng theo cách nấu..." />;

  if (isError || !nutrition) {
    return (
      <View className="items-center gap-2 rounded-2xl border border-dashed border-border bg-card/50 p-5">
        <Activity size={22} color={colors.primary} />
        <Text className="text-center text-sm font-semibold text-foreground">Chưa có thông tin dinh dưỡng chính thức</Text>
        <Text className="text-center text-xs leading-relaxed text-muted-foreground">
          {canManage
            ? 'Bạn là tác giả của công thức này. Hãy kích hoạt tính toán dinh dưỡng tự động dựa trên nguyên liệu và các bước nấu.'
            : 'Công thức này chưa được phân tích dinh dưỡng chi tiết theo phương pháp chế biến.'}
        </Text>
        <View className="mt-1 w-full flex-row gap-2">
          <PrimaryButton label="Thử lại" variant="outline" className="flex-1" onPress={() => void refetch()} />
          {canManage ? (
            <PrimaryButton
              label="Tính toán dinh dưỡng ngay"
              className="flex-1"
              icon={<RotateCw size={15} color={colors.primaryForeground} />}
              onPress={() => setRecalcOpen(true)}
            />
          ) : null}
        </View>
        {recalcOpen ? (
          <RecalculateModal
            isPending={recalculate.isPending}
            onClose={() => setRecalcOpen(false)}
            onConfirm={(ai) => void confirmRecalculate(ai)}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View className="gap-4 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-start gap-2.5 border-b border-border/60 pb-3">
        <View className="rounded-xl bg-emerald-50 p-2 dark:bg-emerald-950/60">
          <Activity size={18} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground">Phân tích Dinh dưỡng Nấu nướng</Text>
          <Text className="text-xs text-muted-foreground">
            Có tính đến hao hụt nhiệt độ và phương pháp chế biến (Cooking-aware)
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {nutrition.isPreview ? null : (
          <Pressable
            onPress={() => setHistoryOpen(true)}
            className="flex-row items-center gap-1 rounded-full border border-input px-3 py-1.5">
            <History size={13} color={colors.mutedForeground} />
            <Text className="text-xs text-muted-foreground">Lịch sử tính</Text>
          </Pressable>
        )}
        {canManage ? (
          <Pressable
            onPress={() => setRecalcOpen(true)}
            className="flex-row items-center gap-1 rounded-full border border-emerald-300 px-3 py-1.5 dark:border-emerald-800">
            <RotateCw size={13} color={colors.primary} />
            <Text className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Tính lại</Text>
          </Pressable>
        ) : null}
      </View>

      {isStale ? (
        <View className="flex-row items-start gap-2.5 rounded-xl border border-amber-300/80 bg-amber-50/90 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/40">
          <AlertTriangle size={16} color="#b45309" />
          <View className="flex-1 gap-2">
            <View>
              <Text className="text-xs font-bold text-amber-950 dark:text-amber-200">Dữ liệu dinh dưỡng có thể đã cũ</Text>
              <Text className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-300/90">
                Công thức hoặc nguyên liệu đã có sự thay đổi sau lần tính trước.
              </Text>
            </View>
            {canManage ? (
              <Pressable
                onPress={() => setRecalcOpen(true)}
                className="self-start rounded-md bg-amber-600 px-3 py-1.5 active:bg-amber-700">
                <Text className="text-xs font-semibold text-white">Làm mới ngay</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      <MacroSummary estimate={nutrition} />

      <UncoveredIngredientsAlert
        ingredients={nutrition.uncoveredIngredients}
        confidencePercent={nutrition.confidencePercent}
      />

      <View className="flex-row items-start gap-2 border-t border-border/50 pt-3">
        <Info size={14} color={colors.mutedForeground} />
        <Text className="flex-1 text-[11px] leading-relaxed text-muted-foreground">{nutrition.disclaimer}</Text>
      </View>

      {historyOpen ? <HistoryModal postId={postId} onClose={() => setHistoryOpen(false)} /> : null}
      {recalcOpen ? (
        <RecalculateModal
          isPending={recalculate.isPending}
          onClose={() => setRecalcOpen(false)}
          onConfirm={(ai) => void confirmRecalculate(ai)}
        />
      ) : null}
    </View>
  );
}
