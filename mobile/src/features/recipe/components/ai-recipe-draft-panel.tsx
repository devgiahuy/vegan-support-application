import * as React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Bot, ChevronDown, Sparkles } from 'lucide-react-native';

import { FormSheet } from '@/components/shared/form-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useIconColors } from '@/lib/theme-colors';
import { difficultyLabel } from '../utils/recipe-editor';
import { useGenerateRecipeDraftMutation } from '../queries/recipe-draft.queries';
import { getContentErrorMessage } from '../utils/recipe-errors';
import type { RecipeDraftSuggestion } from '../types/recipe-draft.model';
import { TagInput } from './tag-input';

const POPULAR_VEGAN_INGREDIENTS = [
  'Đậu hũ', 'Nấm đông cô', 'Cà rốt', 'Nước cốt dừa', 'Hành boa-rô', 'Sả cây', 'Nấm đùi gà', 'Khoai tây', 'Bột cà ri', 'Rau mùi',
];

export interface AiRecipeDraftSeed {
  /** Tên món và mô tả lấy thẳng từ bước "Thông tin cơ bản" — không hỏi lại. */
  title: string;
  description: string;
  /** Tên nguyên liệu đã nhập ở form, dùng làm danh sách khởi đầu. */
  ingredientNames: string[];
}

/**
 * Trợ lý AI ở bước "Nguyên liệu" (chỉ khi tạo mới) — đồng bộ `ai-recipe-draft-assistant.tsx` của web.
 * Dùng tên món + mô tả đã nhập ở bước 1 và danh sách nguyên liệu chính do người dùng nhập; AI không tự thêm nguyên liệu,
 * chỉ ước lượng số lượng/đơn vị cho đúng các nguyên liệu đó và soạn các bước nấu. Kết quả xem trước rồi mới áp dụng.
 */
export function AiRecipeDraftPanel({
  seed,
  onApply,
  onEditBasics,
}: {
  seed: AiRecipeDraftSeed;
  onApply: (suggestion: RecipeDraftSuggestion) => void;
  /** Quay về bước thông tin cơ bản khi thiếu tên món hoặc mô tả. */
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
  const missingBasics = title.length < 3 || !description;

  const toggle = () => {
    // Mỗi lần mở lại, lấy danh sách nguyên liệu mới nhất từ form làm điểm khởi đầu.
    if (!open && seed.ingredientNames.length > 0) setIngredientNames(seed.ingredientNames);
    setOpen(!open);
  };

  const generate = async () => {
    setValidationError('');
    if (missingBasics) return setValidationError('Cần tên món (tối thiểu 3 ký tự) và mô tả ngắn ở bước 1 để AI gợi ý.');
    if (ingredientNames.length === 0) return setValidationError('Thêm ít nhất 1 nguyên liệu chính để AI định lượng.');
    try {
      const result = await mutation.mutateAsync({ title, description, ingredientNames });
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
            Tùy chọn. AI điền sẵn nguyên liệu, bước nấu, khẩu phần và thời gian; bạn vẫn sửa được mọi thứ trước khi gửi.
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
              {title ? <Text className="font-medium">{title}</Text> : <Text className="italic text-muted-foreground">chưa có tên món</Text>}
            </Text>
            <Pressable accessibilityRole="link" onPress={onEditBasics} hitSlop={8}>
              <Text className="text-xs font-semibold text-primary">Sửa tên & mô tả</Text>
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
        <FormSheet title="Gợi ý công thức từ AI" onClose={() => setSuggestion(null)}>
          <View className="flex-row flex-wrap items-center gap-2">
            {suggestion.confidence !== null ? (
              <View className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
                <Bot size={12} color={colors.primary} />
                <Text className="text-xs font-semibold text-primary">Độ tin cậy: {Math.round(suggestion.confidence * 100)}%</Text>
              </View>
            ) : null}
            <Text className="text-xs text-muted-foreground">
              {suggestion.servings} khẩu phần · sơ chế {suggestion.prepTimeMinutes} phút · nấu {suggestion.cookTimeMinutes} phút · {difficultyLabel(suggestion.difficulty)}
            </Text>
          </View>
          <Text className="text-[11px] leading-4 text-muted-foreground">
            Đây chỉ là bản nháp do AI ước lượng, chưa được xác minh. Hãy kiểm tra lại định lượng và cách nấu; AI không điền dinh dưỡng.
          </Text>

          <View className="gap-1.5">
            <Text className="text-sm font-bold text-foreground">Nguyên liệu ({suggestion.ingredients.length})</Text>
            {suggestion.ingredients.map((ingredient, index) => (
              <View key={`${ingredient.name}-${index}`} className="flex-row items-baseline justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2">
                <Text className="flex-1 text-sm text-foreground">
                  {ingredient.name}
                  {ingredient.optional ? <Text className="text-xs text-muted-foreground"> (tuỳ chọn)</Text> : null}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {ingredient.amount} {ingredient.unit}
                  {ingredient.confidence !== null ? ` (${Math.round(ingredient.confidence * 100)}%)` : ''}
                </Text>
              </View>
            ))}
          </View>

          <View className="gap-2">
            <Text className="text-sm font-bold text-foreground">Các bước nấu ({suggestion.steps.length})</Text>
            {suggestion.steps.map((step, index) => (
              <View key={`${index}-${step.instruction.slice(0, 12)}`} className="flex-row gap-3">
                <View className="size-6 items-center justify-center rounded-full bg-primary">
                  <Text className="text-xs font-semibold text-primary-foreground">{index + 1}</Text>
                </View>
                <Text className="flex-1 pt-0.5 text-sm leading-5 text-foreground">
                  {step.instruction}
                  {step.durationMinutes ? <Text className="text-xs text-muted-foreground"> ({step.durationMinutes} phút)</Text> : null}
                </Text>
              </View>
            ))}
          </View>

          {suggestion.assumptions.length > 0 ? (
            <View className="gap-1 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
              <Text className="text-xs font-semibold text-foreground">AI đã giả định</Text>
              {suggestion.assumptions.map((note) => (
                <Text key={note} className="text-xs leading-4 text-muted-foreground">• {note}</Text>
              ))}
            </View>
          ) : null}
          {suggestion.provenance ? (
            <Text className="text-[10px] text-muted-foreground">Nguồn: {suggestion.provenance.provider} · {suggestion.provenance.model}</Text>
          ) : null}

          <PrimaryButton label="Áp dụng vào công thức" onPress={apply} />
          <PrimaryButton label="Đóng" variant="outline" onPress={() => setSuggestion(null)} />
        </FormSheet>
      ) : null}
    </View>
  );
}
