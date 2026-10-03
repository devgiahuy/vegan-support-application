import * as React from 'react';
import { Alert, Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  History,
  Info,
  RotateCw,
  Scale,
  Sparkles,
  X,
} from 'lucide-react-native';

import { ErrorState, LoadingState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import {
  useRecalculateNutritionMutation,
  useRecipeNutritionHistoryQuery,
  useRecipeNutritionQuery,
  useRecipeNutritionStatusQuery,
} from '../queries/recipe-nutrition.queries';
import type { NutrientLine, RecipeNutritionEstimate } from '../types/recipe-nutrition.model';

function OriginBadge({ line }: { line: NutrientLine }) {
  const colors = useIconColors();
  if (line.isAiEstimated) {
    return (
      <View className="flex-row items-center gap-1 rounded-full bg-purple-500/10 px-1.5 py-0.5">
        <Sparkles size={10} color="#7e22ce" />
        <Text className="text-[10px] font-medium text-purple-700">AI ước lượng</Text>
      </View>
    );
  }
  if (line.origin === 'USER_PROVIDED') {
    return (
      <View className="rounded-full bg-amber-500/10 px-1.5 py-0.5">
        <Text className="text-[10px] font-medium text-amber-700">Người dùng nhập</Text>
      </View>
    );
  }
  if (line.origin === 'VERIFIED_OVERRIDE') {
    return (
      <View className="rounded-full bg-blue-500/10 px-1.5 py-0.5">
        <Text className="text-[10px] font-medium text-blue-700">Đã xác minh</Text>
      </View>
    );
  }
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5">
      <Scale size={10} color={colors.primary} />
      <Text className="text-[10px] font-medium text-primary">Từ dữ liệu chuẩn</Text>
    </View>
  );
}

function KeyMetric({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[30%] flex-1 items-center rounded-xl border border-border bg-muted/30 p-2.5">
      <Text className="text-[11px] text-muted-foreground">{label}</Text>
      <Text className="mt-0.5 text-base font-bold text-foreground">{value}</Text>
    </View>
  );
}

function MacroBar({ estimate }: { estimate: RecipeNutritionEstimate }) {
  const split = estimate.macroSplit;
  if (!split) return null;
  const segments = [
    { label: 'Đạm', percent: split.proteinPercent, color: 'bg-primary' },
    { label: 'Tinh bột', percent: split.carbsPercent, color: 'bg-cta' },
    { label: 'Béo', percent: split.fatPercent, color: 'bg-sky-500' },
  ];
  return (
    <View className="gap-2">
      <Text className="text-xs font-semibold text-foreground">Phân bổ năng lượng (ước tính)</Text>
      <View className="h-2.5 flex-row overflow-hidden rounded-full bg-muted">
        {segments.map((segment) => (
          <View key={segment.label} className={segment.color} style={{ width: `${segment.percent}%` }} />
        ))}
      </View>
      <View className="flex-row flex-wrap gap-x-4 gap-y-1">
        {segments.map((segment) => (
          <View key={segment.label} className="flex-row items-center gap-1.5">
            <View className={cn('h-2 w-2 rounded-full', segment.color)} />
            <Text className="text-[11px] text-muted-foreground">
              {segment.label} {segment.percent}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function Collapsible({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useIconColors();
  const [open, setOpen] = React.useState(false);
  return (
    <View>
      <Pressable onPress={() => setOpen((value) => !value)} className="flex-row items-center gap-1">
        <Text className="text-xs font-semibold text-foreground">{title}</Text>
        {open ? <ChevronUp size={14} color={colors.foreground} /> : <ChevronDown size={14} color={colors.foreground} />}
      </Pressable>
      {open ? <View className="mt-2 gap-1.5">{children}</View> : null}
    </View>
  );
}

function HistoryModal({ postId, onClose }: { postId: string; onClose: () => void }) {
  const colors = useIconColors();
  const { data, isLoading, isError, refetch } = useRecipeNutritionHistoryQuery(postId, true);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Đóng" />
        <View className="max-h-[80%] rounded-t-3xl bg-background px-5 pb-6 pt-4">
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
          <Text className="text-base font-bold text-foreground">Tính lại dinh dưỡng</Text>
          <Text className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Hệ thống đối soát nguyên liệu sau sơ chế và áp dụng hệ số giữ lại dinh dưỡng của cách nấu cho phiên bản hiện tại.
          </Text>
          <View className="mt-3 flex-row items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 p-3">
            <View className="flex-1">
              <Text className="text-xs font-semibold text-foreground">Cho phép AI ước lượng chỉ số còn thiếu</Text>
              <Text className="mt-0.5 text-[11px] text-muted-foreground">
                Giá trị do AI bổ sung luôn được gắn nhãn &quot;AI ước lượng&quot;.
              </Text>
            </View>
            <Switch value={useAiFallback} onValueChange={setUseAiFallback} />
          </View>
          <View className="mt-4 flex-row gap-2">
            <PrimaryButton label="Hủy" variant="outline" className="flex-1" onPress={onClose} />
            <PrimaryButton
              label={isPending ? 'Đang tính...' : 'Tính lại'}
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
 * Thẻ "Phân tích dinh dưỡng theo cách nấu" — đồng bộ `RecipeNutritionCard` của web, hiển thị theo mỗi khẩu phần:
 * chỉ số chính, phân bổ năng lượng, nguyên liệu thiếu dữ liệu, bảng dưỡng chất kèm nguồn gốc số liệu
 * (từ dữ liệu chuẩn / AI ước lượng), giả định, độ tin cậy và lịch sử. Số liệu luôn là ước tính tham khảo;
 * chỉ số không có dữ liệu thì không hiển thị (không coi là 0).
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
        <Text className="text-center text-sm font-semibold text-foreground">Chưa có thông tin dinh dưỡng chi tiết</Text>
        <Text className="text-center text-xs leading-relaxed text-muted-foreground">
          {canManage
            ? 'Bạn là tác giả. Hãy tính dinh dưỡng tự động dựa trên nguyên liệu và các bước nấu.'
            : 'Công thức này chưa được phân tích dinh dưỡng theo phương pháp chế biến.'}
        </Text>
        <View className="mt-1 w-full flex-row gap-2">
          <PrimaryButton label="Thử lại" variant="outline" className="flex-1" onPress={() => void refetch()} />
          {canManage ? (
            <PrimaryButton
              label="Tính ngay"
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

  const byCode = (code: string) => nutrition.nutrients.find((line) => line.code === code);
  const metric = (code: string, label: string) => {
    const line = byCode(code);
    return <KeyMetric key={code} label={label} value={line ? `${line.formattedAmount} ${line.unit}` : 'Chưa có'} />;
  };
  const primaryCodes = ['ENERGY_KCAL', 'PROTEIN', 'CARBS', 'FAT', 'FIBER'];
  const otherNutrients = nutrition.nutrients.filter((line) => !primaryCodes.includes(line.code));

  return (
    <View className="gap-4 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-start gap-2.5">
        <View className="rounded-xl bg-primary/10 p-2">
          <Activity size={18} color={colors.primary} />
        </View>
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground">Dinh dưỡng theo cách nấu</Text>
          <Text className="text-xs text-muted-foreground">
            Mỗi khẩu phần ({nutrition.servings} khẩu phần), có tính hao hụt khi chế biến
          </Text>
        </View>
      </View>

      {nutrition.isPreview ? (
        <View className="flex-row items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <Info size={15} color={colors.primary} />
          <Text className="flex-1 text-xs leading-relaxed text-muted-foreground">
            Đây là ước tính tính tại chỗ từ nguyên liệu hiện có, chưa phải bản chính thức do tác giả lưu.
          </Text>
        </View>
      ) : null}

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
            className="flex-row items-center gap-1 rounded-full border border-primary/40 px-3 py-1.5">
            <RotateCw size={13} color={colors.primary} />
            <Text className="text-xs font-semibold text-primary">Tính lại</Text>
          </Pressable>
        ) : null}
      </View>

      {isStale ? (
        <View className="flex-row items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <AlertTriangle size={15} color="#b45309" />
          <View className="flex-1">
            <Text className="text-xs font-bold text-amber-900">Dữ liệu dinh dưỡng có thể đã cũ</Text>
            <Text className="mt-0.5 text-xs text-amber-800">
              Công thức hoặc nguyên liệu đã thay đổi sau lần tính trước.
              {canManage ? ' Hãy bấm "Tính lại" để làm mới.' : ''}
            </Text>
          </View>
        </View>
      ) : null}

      {status?.aiJobStatusLabel ? (
        <Text className="text-[11px] text-muted-foreground">Trạng thái AI: {status.aiJobStatusLabel}</Text>
      ) : null}
      {nutrition.aiProviderDown ? (
        <Text className="text-[11px] text-amber-700">
          Dịch vụ AI tạm thời không khả dụng; chỉ hiển thị số liệu tính từ dữ liệu chuẩn.
        </Text>
      ) : null}

      <View className="flex-row flex-wrap gap-2">
        {metric('ENERGY_KCAL', 'Năng lượng')}
        {metric('PROTEIN', 'Đạm')}
        {metric('CARBS', 'Tinh bột')}
        {metric('FAT', 'Béo')}
        {metric('FIBER', 'Chất xơ')}
      </View>

      <MacroBar estimate={nutrition} />

      {nutrition.uncoveredIngredients.length > 0 ? (
        <View className="gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3">
          <View className="flex-row items-start gap-2">
            <AlertTriangle size={15} color="#b45309" />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-amber-900">
                {nutrition.uncoveredIngredients.length} nguyên liệu chưa có dữ liệu thành phần chuẩn
              </Text>
              <Text className="mt-0.5 text-xs leading-relaxed text-amber-800">
                Số liệu chỉ phản ánh phần nguyên liệu đã biết, nên có thể thấp hơn thực tế. Độ tin cậy: {nutrition.confidencePercent}%.
              </Text>
            </View>
          </View>
          <Collapsible title="Xem nguyên liệu thiếu dữ liệu">
            {nutrition.uncoveredIngredients.map((item, index) => (
              <View key={`${item.displayName}-${index}`} className="rounded-lg bg-amber-100/60 px-2.5 py-1.5">
                <Text className="text-xs font-semibold text-amber-950">{item.displayName}</Text>
                <Text className="text-[11px] text-amber-800">{item.reason}</Text>
              </View>
            ))}
          </Collapsible>
        </View>
      ) : null}

      {otherNutrients.length > 0 ? (
        <View className="gap-1">
          <Text className="text-xs font-semibold text-foreground">Vi chất và dưỡng chất khác</Text>
          {otherNutrients.map((line) => (
            <View key={line.code} className="gap-1 border-b border-border/60 py-2">
              <View className="flex-row items-center justify-between gap-2">
                <Text className="flex-1 text-sm text-foreground">{line.name}</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {line.formattedAmount} {line.unit}
                </Text>
              </View>
              <View className="flex-row flex-wrap items-center gap-2">
                <OriginBadge line={line} />
                {line.rangeLabel ? (
                  <Text className="text-[10px] text-muted-foreground">
                    Khoảng {line.rangeLabel} {line.unit}
                  </Text>
                ) : null}
                {line.confidencePercent > 0 && line.confidencePercent < 100 ? (
                  <Text className="text-[10px] text-muted-foreground">tin cậy {line.confidencePercent}%</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {nutrition.assumptions.length > 0 ? (
        <Collapsible title={`Giả định khi tính (${nutrition.assumptions.length})`}>
          {nutrition.assumptions.map((assumption, index) => (
            <Text key={`${assumption.code}-${index}`} className="text-[11px] leading-relaxed text-muted-foreground">
              • {assumption.message}
              {assumption.isAiEstimated ? ' (AI ước lượng)' : ''}
            </Text>
          ))}
        </Collapsible>
      ) : null}

      {nutrition.sourceLabels.length > 0 ? (
        <Text className="text-[11px] text-muted-foreground">Nguồn dữ liệu: {nutrition.sourceLabels.join(', ')}</Text>
      ) : null}

      <View className="flex-row items-start gap-2 border-t border-border pt-3">
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
