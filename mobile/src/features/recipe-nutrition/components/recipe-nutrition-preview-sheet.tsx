import * as React from 'react';
import { Switch, Text, View } from 'react-native';
import { AlertTriangle, Info, RotateCw, Sparkles } from 'lucide-react-native';

import { FormSheet } from '@/components/shared/form-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { getApiErrorMessage } from '@/lib/api-error';
import { useIconColors } from '@/lib/theme-colors';
import { usePreviewNutritionMutation } from '../queries/recipe-nutrition.queries';
import type { RecipeNutritionEstimate } from '../types/recipe-nutrition.model';
import { Collapsible, KeyMetric, MacroBar } from './recipe-nutrition-card';

/**
 * "Xem trước dinh dưỡng" khi sửa công thức — đồng bộ `RecipeNutritionPreviewDrawer` của web: chạy
 * `POST /posts/:id/nutrition/preview` (không lưu), tùy chọn bật AI ước lượng bổ trợ. Tính trên bản đã lưu của công thức.
 */
export function RecipeNutritionPreviewSheet({ postId, onClose }: { postId: string; onClose: () => void }) {
  const colors = useIconColors();
  const preview = usePreviewNutritionMutation(postId);
  const [useAiFallback, setUseAiFallback] = React.useState(false);
  const [result, setResult] = React.useState<RecipeNutritionEstimate | null>(null);

  const run = () => {
    preview.mutate({ useAiFallback }, { onSuccess: (estimate) => setResult(estimate) });
  };

  const metric = (code: string, label: string) => {
    const line = result?.nutrients.find((item) => item.code === code);
    return <KeyMetric key={code} label={label} value={line ? `${line.formattedAmount} ${line.unit}` : 'Chưa có'} />;
  };

  return (
    <FormSheet title="Xem trước dinh dưỡng" onClose={onClose} busy={preview.isPending}>
      <View className="gap-4 pb-4">
        <Text className="text-xs leading-5 text-muted-foreground">
          Mô phỏng calo và vi chất theo phương pháp nấu từ bản công thức đã lưu (không lưu vào hệ thống). Lưu thay đổi trước nếu bạn vừa chỉnh nguyên liệu.
        </Text>

        <View className="gap-3 rounded-2xl border border-border bg-muted/40 p-3">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground">Bật AI ước lượng bổ trợ</Text>
              <Text className="text-[11px] text-muted-foreground">Suy đoán hệ số nấu khi nguyên liệu chưa đủ dữ liệu nhiệt.</Text>
            </View>
            <Switch value={useAiFallback} onValueChange={setUseAiFallback} disabled={preview.isPending} />
          </View>
          <PrimaryButton
            label={preview.isPending ? 'Đang tính…' : result ? 'Cập nhật xem trước' : 'Bắt đầu xem trước'}
            loading={preview.isPending}
            disabled={preview.isPending}
            icon={
              useAiFallback ? (
                <Sparkles size={15} color={colors.primaryForeground} />
              ) : (
                <RotateCw size={15} color={colors.primaryForeground} />
              )
            }
            onPress={run}
          />
        </View>

        {preview.isError ? (
          <View className="flex-row items-start gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
            <AlertTriangle size={15} color={colors.destructive} />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-destructive">Không thể xem trước dinh dưỡng</Text>
              <Text className="mt-0.5 text-xs text-destructive">
                {getApiErrorMessage(preview.error, 'Kiểm tra lại nguyên liệu, số lượng hoặc số khẩu phần.')}
              </Text>
            </View>
          </View>
        ) : null}

        {!result && !preview.isPending && !preview.isError ? (
          <View className="items-center rounded-2xl border border-dashed border-border p-5">
            <Text className="text-sm font-medium text-foreground">Chưa có dữ liệu xem trước</Text>
            <Text className="mt-1 text-center text-xs text-muted-foreground">Bấm “Bắt đầu xem trước” để phân tích tạm thời.</Text>
          </View>
        ) : null}

        {result ? (
          <View className="gap-4">
            <Text className="text-xs text-muted-foreground">Mỗi khẩu phần ({result.servings} khẩu phần)</Text>
            <View className="flex-row flex-wrap gap-2">
              {metric('ENERGY_KCAL', 'Năng lượng')}
              {metric('PROTEIN', 'Đạm')}
              {metric('CARBS', 'Tinh bột')}
              {metric('FAT', 'Béo')}
              {metric('FIBER', 'Chất xơ')}
            </View>
            <MacroBar estimate={result} />
            {result.uncoveredIngredients.length > 0 ? (
              <View className="gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3">
                <View className="flex-row items-start gap-2">
                  <AlertTriangle size={15} color="#b45309" />
                  <Text className="flex-1 text-xs leading-5 text-amber-900">
                    {result.uncoveredIngredients.length} nguyên liệu chưa có dữ liệu chuẩn nên số liệu có thể thấp hơn thực tế. Độ tin cậy: {result.confidencePercent}%.
                  </Text>
                </View>
                <Collapsible title="Xem nguyên liệu thiếu dữ liệu">
                  {result.uncoveredIngredients.map((item, index) => (
                    <Text key={`${item.displayName}-${index}`} className="text-xs text-amber-900">
                      • {item.displayName}: {item.reason}
                    </Text>
                  ))}
                </Collapsible>
              </View>
            ) : null}
            <View className="flex-row items-start gap-2 border-t border-border pt-3">
              <Info size={14} color={colors.mutedForeground} />
              <Text className="flex-1 text-[11px] leading-relaxed text-muted-foreground">{result.disclaimer}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </FormSheet>
  );
}
