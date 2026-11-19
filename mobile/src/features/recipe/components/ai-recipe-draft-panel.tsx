import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Bot, ChevronDown, Clock, Info, Sparkles, Utensils } from 'lucide-react-native';

import { FormSheet } from '@/components/shared/form-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { difficultyLabel } from '../utils/recipe-editor';
import { useGenerateRecipeDraftMutation } from '../queries/recipe-draft.queries';
import { getContentErrorMessage } from '../utils/recipe-errors';
import type { RecipeDraftSuggestion } from '../types/recipe-draft.model';
import { TagInput } from './tag-input';

/** Chỉ hiện gợi ý thời gian khi ước tính của AI khác giá trị đang dùng (do người dùng đã nhập). */
function differsFromSuggestedTiming(suggestion: RecipeDraftSuggestion): boolean {
  const timing = suggestion.suggestedTiming;
  return (
    timing !== null &&
    (timing.servings !== suggestion.servings ||
      timing.prepTimeMinutes !== suggestion.prepTimeMinutes ||
      timing.cookTimeMinutes !== suggestion.cookTimeMinutes)
  );
}

const POPULAR_VEGAN_INGREDIENTS = [
  'Đậu hũ', 'Nấm đông cô', 'Cà rốt', 'Nước cốt dừa', 'Hành boa-rô', 'Sả cây', 'Nấm đùi gà', 'Khoai tây', 'Bột cà ri', 'Rau mùi',
];

export interface AiRecipeDraftSeed {
  /** Thông tin lấy thẳng từ bước "Thông tin cơ bản" — không hỏi lại. Tên món và mô tả có thể để trống để AI gợi ý. */
  title: string;
  description: string;
  /** Chỉ có giá trị khi người dùng đã nhập số hợp lệ; BE giữ nguyên các giá trị này. */
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  /** Tên nguyên liệu đã nhập ở form, dùng làm danh sách khởi đầu. */
  ingredientNames: string[];
}

/**
 * Trợ lý AI ở bước "Nguyên liệu" (chỉ khi tạo mới) — đồng bộ `ai-recipe-draft-assistant.tsx` của web.
 * Dùng thông tin đã nhập ở bước 1 và danh sách nguyên liệu chính do người dùng nhập; AI gợi ý các thông tin còn trống
 * (tên món, mô tả, khẩu phần, thời gian), không tự thêm nguyên liệu, chỉ ước lượng số lượng/đơn vị cho đúng các
 * nguyên liệu đó và soạn các bước nấu. Giá trị người dùng đã nhập được giữ nguyên. Kết quả xem trước rồi mới áp dụng.
 */
export function AiRecipeDraftPanel({
  seed,
  onApply,
  onEditBasics,
}: {
  seed: AiRecipeDraftSeed;
  onApply: (suggestion: RecipeDraftSuggestion) => void;
  /** Quay về bước thông tin cơ bản để sửa tên món, mô tả, khẩu phần hoặc thời gian. */
  onEditBasics: () => void;
}) {
  const colors = useIconColors();
  const mutation = useGenerateRecipeDraftMutation();
  const [open, setOpen] = React.useState(false);
  const [ingredientNames, setIngredientNames] = React.useState<string[]>(seed.ingredientNames);
  const [validationError, setValidationError] = React.useState('');
  const [suggestion, setSuggestion] = React.useState<RecipeDraftSuggestion | null>(null);

  const title = seed.title.trim();
  const description = seed.description.trim();
  const invalidTitle = title.length > 0 && title.length < 3;

  const toggle = () => {
    // Mỗi lần mở lại, lấy danh sách nguyên liệu mới nhất từ form làm điểm khởi đầu.
    if (!open && seed.ingredientNames.length > 0) setIngredientNames(seed.ingredientNames);
    setOpen(!open);
  };

  const generate = async () => {
    setValidationError('');
    if (invalidTitle) return setValidationError('Tên món cần ít nhất 3 ký tự hoặc để trống để AI gợi ý.');
    if (ingredientNames.length === 0) return setValidationError('Thêm ít nhất 1 nguyên liệu chính để AI định lượng.');
    try {
      const result = await mutation.mutateAsync({
        title,
        description,
        servings: seed.servings,
        prepTimeMinutes: seed.prepTimeMinutes,
        cookTimeMinutes: seed.cookTimeMinutes,
        ingredientNames,
      });
      if (result.ingredients.length === 0 || result.steps.length === 0) {
        return setValidationError('AI trả về bản nháp chưa đầy đủ. Hãy thử lại hoặc nhập thủ công.');
      }
      setSuggestion(result);
    } catch (error) {
      setValidationError(getContentErrorMessage(error, 'Không lấy được gợi ý từ AI. Vui lòng thử lại.'));
    }
  };

  const apply = () => {
    if (!suggestion) return;
    onApply(suggestion);
    setSuggestion(null);
    setOpen(false);
  };

  return (
    <View className="rounded-xl border border-primary/25 bg-primary/5">
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={toggle} className="flex-row items-center gap-3 p-4">
        <View className="size-9 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles size={16} color={colors.primary} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text className="text-sm font-semibold text-foreground">Để AI gợi ý định lượng và các bước nấu</Text>
          <Text className="text-xs leading-4 text-muted-foreground">
            AI gợi ý thông tin còn trống, định lượng và các bước nấu. Bạn có thể chỉnh sửa trước khi gửi.
          </Text>
        </View>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <ChevronDown size={16} color={colors.mutedForeground} />
        </View>
      </Pressable>

      {open ? (
        <View className="gap-4 border-t border-primary/15 p-4">
          <View className="flex-row flex-wrap items-baseline justify-between gap-2">
            <Text className="flex-1 text-sm text-foreground">
              <Text className="text-muted-foreground">Món: </Text>
              {title ? <Text className="font-medium">{title}</Text> : <Text className="italic text-muted-foreground">để AI gợi ý tên món</Text>}
            </Text>
            <Pressable accessibilityRole="link" onPress={onEditBasics} hitSlop={8}>
              <Text className="text-xs font-semibold text-primary">Sửa thông tin cơ bản</Text>
            </Pressable>
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">Nguyên liệu chính bạn có</Text>
            <TagInput value={ingredientNames} onChange={setIngredientNames} disabled={mutation.isPending} quickSuggestions={POPULAR_VEGAN_INGREDIENTS} />
            <Text className="text-xs text-muted-foreground">Đã thêm {ingredientNames.length} nguyên liệu. AI chỉ nhận chữ, không nhận ảnh.</Text>
          </View>

          {validationError ? (
            <View className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
              <Text accessibilityRole="alert" className="text-xs text-destructive">{validationError}</Text>
            </View>
          ) : null}

          <PrimaryButton
            label={mutation.isPending ? 'AI đang gợi ý… (có thể mất ~1 phút)' : 'Tạo gợi ý'}
            loading={mutation.isPending}
            disabled={mutation.isPending}
            icon={<Sparkles size={16} color={colors.primaryForeground} />}
            onPress={() => void generate()}
          />
        </View>
      ) : null}

      {suggestion ? (
        <FormSheet
          title="Gợi ý công thức từ AI"
          variant="bottom-sheet"
          onClose={() => setSuggestion(null)}
          footer={
            <View className="flex-row gap-2.5">
              <PrimaryButton
                label="Đóng"
                variant="outline"
                onPress={() => setSuggestion(null)}
                className="flex-1"
              />
              <PrimaryButton
                label="Áp dụng vào công thức"
                onPress={apply}
                className="flex-[1.8]"
              />
            </View>
          }>
          {/* Thẻ tóm tắt tên món, mô tả & thông số chính */}
          <View className="gap-3 rounded-2xl border border-border bg-card p-4">
            {suggestion.title ? (
              <View className="gap-1">
                <Text className="text-lg font-bold leading-snug text-foreground">{suggestion.title}</Text>
                {suggestion.description ? (
                  <Text className="text-sm leading-relaxed text-muted-foreground">{suggestion.description}</Text>
                ) : null}
              </View>
            ) : null}

            <View className="flex-row flex-wrap items-center gap-2">
              {suggestion.confidence !== null ? (
                <View className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
                  <Bot size={13} color={colors.primary} />
                  <Text className="text-xs font-semibold text-primary">
                    Tin cậy {Math.round(suggestion.confidence * 100)}%
                  </Text>
                </View>
              ) : null}
              <View className="flex-row items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                <Utensils size={12} color={colors.mutedForeground} />
                <Text className="text-xs font-medium text-foreground">{suggestion.servings} khẩu phần</Text>
              </View>
              <View className="flex-row items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                <Clock size={12} color={colors.mutedForeground} />
                <Text className="text-xs font-medium text-foreground">
                  Sơ chế {suggestion.prepTimeMinutes}p · Nấu {suggestion.cookTimeMinutes}p
                </Text>
              </View>
              <View className="rounded-full bg-muted px-2.5 py-1">
                <Text className="text-xs font-medium text-foreground">{difficultyLabel(suggestion.difficulty)}</Text>
              </View>
            </View>

            {differsFromSuggestedTiming(suggestion) ? (
              <Text className="text-xs leading-relaxed text-muted-foreground">
                AI ước tính {suggestion.suggestedTiming?.servings} khẩu phần · sơ chế {suggestion.suggestedTiming?.prepTimeMinutes} phút · nấu {suggestion.suggestedTiming?.cookTimeMinutes} phút. Giá trị bạn đã nhập được giữ nguyên.
              </Text>
            ) : null}
          </View>

          {/* Lưu ý bản nháp AI */}
          <View className="flex-row items-start gap-2 rounded-xl bg-muted/60 px-3 py-2.5">
            <Info size={14} color={colors.mutedForeground} style={{ marginTop: 2 }} />
            <Text className="flex-1 text-xs leading-relaxed text-muted-foreground">
              Đây là bản nháp do AI ước lượng, chưa được xác minh. Hãy kiểm tra lại định lượng và cách nấu; AI không tự điền dinh dưỡng.
            </Text>
          </View>

          {/* Nguyên liệu */}
          <View className="gap-2">
            <Text className="text-sm font-bold text-foreground">Nguyên liệu ({suggestion.ingredients.length})</Text>
            <View className="overflow-hidden rounded-2xl border border-border bg-card">
              {suggestion.ingredients.map((ingredient, index) => (
                <View
                  key={`${ingredient.name}-${index}`}
                  className={cn(
                    'flex-row items-center justify-between gap-3 px-3.5 py-2.5',
                    index > 0 ? 'border-t border-border' : ''
                  )}>
                  <Text className="min-w-0 flex-1 text-sm font-medium text-foreground">
                    {ingredient.name}
                    {ingredient.optional ? <Text className="text-xs font-normal text-muted-foreground"> (tuỳ chọn)</Text> : null}
                  </Text>
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-sm font-semibold text-foreground">
                      {ingredient.amount} {ingredient.unit}
                    </Text>
                    {ingredient.confidence !== null ? (
                      <View className="rounded-full bg-muted px-2 py-0.5">
                        <Text className="text-[11px] font-medium text-muted-foreground">
                          {Math.round(ingredient.confidence * 100)}%
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Các bước nấu */}
          <View className="gap-2">
            <Text className="text-sm font-bold text-foreground">Các bước nấu ({suggestion.steps.length})</Text>
            <View className="gap-2.5">
              {suggestion.steps.map((step, index) => (
                <View
                  key={`${index}-${step.instruction.slice(0, 12)}`}
                  className="flex-row items-start gap-3 rounded-2xl border border-border bg-card p-3">
                  <View className="mt-0.5 size-6 items-center justify-center rounded-full bg-primary">
                    <Text className="text-xs font-bold text-primary-foreground">{index + 1}</Text>
                  </View>
                  <View className="min-w-0 flex-1 gap-1.5">
                    <Text className="text-sm leading-relaxed text-foreground">{step.instruction}</Text>
                    {step.durationMinutes ? (
                      <View className="flex-row items-center gap-1 self-start rounded-full bg-muted px-2 py-0.5">
                        <Clock size={11} color={colors.mutedForeground} />
                        <Text className="text-xs font-medium text-muted-foreground">{step.durationMinutes} phút</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {suggestion.assumptions.length > 0 ? (
            <View className="gap-1.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5">
              <Text className="text-xs font-bold text-foreground">AI đã giả định</Text>
              {suggestion.assumptions.map((note) => (
                <Text key={note} className="text-xs leading-relaxed text-foreground/85">
                  • {note}
                </Text>
              ))}
            </View>
          ) : null}

          {suggestion.provenance ? (
            <Text className="text-xs text-muted-foreground">
              Nguồn gợi ý: {suggestion.provenance.provider} · {suggestion.provenance.model}
            </Text>
          ) : null}
        </FormSheet>
      ) : null}
    </View>
  );
}
