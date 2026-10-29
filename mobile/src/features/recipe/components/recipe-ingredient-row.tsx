import * as React from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { CircleAlert, CircleCheck, Trash2 } from 'lucide-react-native';

import { ResolutionMatch } from '@/common/enums';
import { IngredientPicker } from '@/features/ingredient/components/ingredient-picker';
import { useIngredientResolveQuery } from '@/features/ingredient/queries/ingredient.queries';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import type { EditorIngredient } from '../utils/recipe-editor';
import { RecipeUnitPicker } from './recipe-unit-picker';

export interface IngredientRowErrors {
  name?: string;
  amount?: string;
  unit?: string;
}

/**
 * Một dòng nguyên liệu: tên (gợi ý nguyên liệu chuẩn) + số lượng + đơn vị. Đồng bộ `recipe-ingredient-row.tsx` của web:
 * - Dò tên khi dòng được nạp (bản nháp AI, trang sửa) và khi rời ô tên; chỉ tự liên kết khi BE trả đúng MỘT kết quả (EXACT).
 * - AMBIGUOUS phải để người dùng chọn từ gợi ý; sửa tên sau khi đã liên kết thì bỏ liên kết cũ.
 */
export function RecipeIngredientRow({
  index,
  ingredient,
  errors,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  ingredient: EditorIngredient;
  errors: IngredientRowErrors;
  canRemove: boolean;
  onChange: (patch: Partial<EditorIngredient>) => void;
  onRemove: () => void;
}) {
  const colors = useIconColors();
  const name = ingredient.name.trim();
  const [resolveTarget, setResolveTarget] = React.useState(() => (ingredient.ingredientId ? '' : name));
  const resolution = useIngredientResolveQuery(ingredient.ingredientId ? '' : resolveTarget);
  const current = !ingredient.ingredientId && resolveTarget !== '' && resolveTarget === name ? resolution : null;
  const exact =
    current?.data?.match === ResolutionMatch.EXACT && current.data.candidates.length === 1 ? current.data.candidates[0] : undefined;

  React.useEffect(() => {
    if (exact) onChange({ name: exact.canonicalName, ingredientId: exact.id });
  }, [exact, onChange]);

  const hasError = Boolean(errors.name || errors.amount || errors.unit);
  const hint = ingredient.ingredientId ? (
    <View className="flex-row items-center gap-1">
      <CircleCheck size={12} color={colors.primary} />
      <Text className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Đã liên kết danh mục chuẩn</Text>
    </View>
  ) : current?.isFetching || exact ? (
    <View className="flex-row items-center gap-1">
      <ActivityIndicator size="small" color={colors.mutedForeground} />
      <Text className="text-[11px] font-medium text-muted-foreground">Đang tìm trong danh mục chuẩn…</Text>
    </View>
  ) : name.length > 0 ? (
    <View className="flex-row items-center gap-1">
      <CircleAlert size={12} color={colors.cta} />
      <Text className="flex-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
        {current?.data?.match === ResolutionMatch.AMBIGUOUS
          ? `Có ${current.data.candidates.length} nguyên liệu khớp — chọn một từ gợi ý`
          : current?.data?.match === ResolutionMatch.NONE
            ? 'Không có trong danh mục chuẩn — thử tên khác hoặc chọn từ gợi ý'
            : 'Chưa liên kết — chọn từ gợi ý để hiển thị cho người ăn kiêng'}
      </Text>
    </View>
  ) : null;

  return (
    <View className={cn('gap-2 rounded-xl border bg-card p-3', hasError ? 'border-destructive/60' : 'border-border')}>
      <View className="flex-row items-center justify-between">
        <Text className="text-xs font-semibold text-muted-foreground">Nguyên liệu {index + 1}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Xóa nguyên liệu ${index + 1}`}
          disabled={!canRemove}
          hitSlop={8}
          onPress={onRemove}
          className={cn('h-8 w-8 items-center justify-center', canRemove ? '' : 'opacity-30')}>
          <Trash2 size={15} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <View>
        <IngredientPicker
          showHints={false}
          placeholder="Tên nguyên liệu, vd: Đậu hũ"
          value={{ displayName: ingredient.name, ingredientId: ingredient.ingredientId }}
          onChange={(next) => onChange({ name: next.displayName, ingredientId: next.ingredientId })}
          onBlur={() => {
            if (!ingredient.ingredientId) setResolveTarget(name);
          }}
        />
        <View className="mt-1 min-h-4">{hint}</View>
        {errors.name ? <Text className="mt-0.5 text-xs text-destructive">{errors.name}</Text> : null}
      </View>

      <View className="flex-row items-start gap-2">
        <View className="flex-1">
          <TextInput
            accessibilityLabel={`Định lượng nguyên liệu ${index + 1}`}
            value={ingredient.amount}
            onChangeText={(amount) => onChange({ amount })}
            keyboardType="decimal-pad"
            placeholder="Số lượng"
            placeholderTextColor={colors.mutedForeground}
            className={cn('h-11 rounded-xl border bg-background px-3 text-sm text-foreground', errors.amount ? 'border-destructive/60' : 'border-input')}
          />
          {errors.amount ? <Text className="mt-0.5 text-xs text-destructive">{errors.amount}</Text> : null}
        </View>
        <View className="flex-[1.2]">
          <RecipeUnitPicker
            label={`Đơn vị nguyên liệu ${index + 1}`}
            value={ingredient.unit}
            invalid={Boolean(errors.unit)}
            onChange={(unit) => onChange({ unit })}
          />
          {errors.unit ? <Text className="mt-0.5 text-xs text-destructive">{errors.unit}</Text> : null}
        </View>
      </View>
    </View>
  );
}
