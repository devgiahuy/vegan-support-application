import * as React from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useIconColors } from '@/lib/theme-colors';
import { useGenerateRecipeDraftMutation } from '../queries/recipe-draft.queries';
import { getContentErrorMessage } from '../utils/recipe-errors';
import type { RecipeDraftSuggestion } from '../types/recipe-draft.model';

function splitNames(value: string): string[] {
  return value.split(/[,\n;]/).map((name) => name.trim()).filter(Boolean);
}

/**
 * Trợ lý AI gợi ý định lượng, thời gian và các bước nấu từ tên món, mô tả và tên nguyên liệu.
 * Chỉ là bản nháp xem trước: không tạo bài, người dùng phải bấm áp dụng rồi tự kiểm tra/sửa; số liệu AI
 * chưa được xác minh và không có giá trị dinh dưỡng nào được bịa ra.
 */
export function AiRecipeDraftPanel({
  title,
  excerpt,
  existingIngredientNames,
  onApply,
}: {
  title: string;
  excerpt: string;
  /** Tên nguyên liệu đã có trong form, dùng làm gợi ý ban đầu. */
  existingIngredientNames: string[];
  onApply: (suggestion: RecipeDraftSuggestion) => void;
}) {
  const colors = useIconColors();
  const mutation = useGenerateRecipeDraftMutation();
  const [namesText, setNamesText] = React.useState('');
  const [error, setError] = React.useState('');
  const [suggestion, setSuggestion] = React.useState<RecipeDraftSuggestion | null>(null);
  const names = splitNames(namesText.length > 0 ? namesText : existingIngredientNames.join(', '));

  const generate = async () => {
    setError('');
    if (title.trim().length < 3) return setError('Hãy nhập tên món (ít nhất 3 ký tự) ở trên trước.');
    if (excerpt.trim().length < 1) return setError('Hãy nhập mô tả ngắn ở trên trước để AI hiểu ý bạn.');
    if (names.length === 0) return setError('Nhập ít nhất một nguyên liệu chính (cách nhau bằng dấu phẩy).');
    try {
      const result = await mutation.mutateAsync({ title, description: excerpt, ingredientNames: names });
      if (result.ingredients.length === 0 || result.steps.length === 0) {
        setSuggestion(null);
        return setError('AI trả về bản nháp chưa đầy đủ. Hãy thử lại hoặc nhập thủ công.');
      }
      setSuggestion(result);
    } catch (value) {
      setSuggestion(null);
      setError(getContentErrorMessage(value, 'Không lấy được gợi ý từ AI. Vui lòng thử lại.'));
    }
  };

  const apply = () => {
    if (!suggestion) return;
    onApply(suggestion);
    setSuggestion(null);
    Alert.alert('Đã áp dụng', 'Hãy kiểm tra kỹ nguyên liệu, định lượng và các bước trước khi gửi công thức.');
  };

  return (
    <View className="gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4">
      <View className="flex-row items-center gap-1.5">
        <Sparkles size={15} color={colors.primary} />
        <Text className="text-sm font-bold text-foreground">Trợ lý AI soạn nháp</Text>
      </View>
      <Text className="text-xs leading-5 text-muted-foreground">
        AI gợi ý định lượng, thời gian và các bước từ tên món, mô tả và nguyên liệu chính. Đây chỉ là bản nháp để bạn
        chỉnh sửa, chưa được xác minh; AI không phân tích ảnh và không tự điền dinh dưỡng.
      </Text>
      <TextInput
        value={namesText}
        onChangeText={setNamesText}
        placeholder={existingIngredientNames.length ? existingIngredientNames.join(', ') : 'Nguyên liệu chính: đậu hũ, nấm đông cô, cà rốt'}
        placeholderTextColor={colors.mutedForeground}
        multiline
        textAlignVertical="top"
        className="min-h-14 rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground"
      />
      {error ? <Text accessibilityRole="alert" className="text-xs text-destructive">{error}</Text> : null}
      <PrimaryButton
        label={mutation.isPending ? 'AI đang soạn (có thể mất ~1 phút)...' : suggestion ? 'Gợi ý lại' : 'Gợi ý bằng AI'}
        variant="outline"
        loading={mutation.isPending}
        disabled={mutation.isPending}
        icon={<Sparkles size={16} color={colors.primary} />}
        onPress={() => void generate()}
      />

      {suggestion ? (
        <View className="gap-3 rounded-xl border border-border bg-card p-3">
          <Text className="text-xs font-bold uppercase text-muted-foreground">Bản nháp gợi ý</Text>
          <Text className="text-xs text-foreground">
            {suggestion.servings} khẩu phần · chuẩn bị {suggestion.prepTimeMinutes} phút · nấu {suggestion.cookTimeMinutes} phút
          </Text>
          <View className="gap-1">
            {suggestion.ingredients.map((ingredient, index) => (
              <Text key={`${ingredient.name}-${index}`} className="text-xs text-foreground">
                • {ingredient.name} — {ingredient.amount} {ingredient.unit}
                {ingredient.optional ? ' (tuỳ chọn)' : ''}
                {ingredient.confidence !== null ? ` · AI tự tin ${Math.round(ingredient.confidence * 100)}%` : ''}
              </Text>
            ))}
          </View>
          <View className="gap-1">
            {suggestion.steps.map((step, index) => (
              <Text key={`${index}-${step.instruction.slice(0, 12)}`} className="text-xs leading-5 text-foreground">
                {index + 1}. {step.instruction}
                {step.durationMinutes ? ` (${step.durationMinutes} phút)` : ''}
              </Text>
            ))}
          </View>
          {suggestion.assumptions.length > 0 ? (
            <View className="gap-0.5 rounded-lg bg-muted p-2.5">
              <Text className="text-[11px] font-semibold text-muted-foreground">AI đã giả định:</Text>
              {suggestion.assumptions.map((note) => (
                <Text key={note} className="text-[11px] leading-4 text-muted-foreground">• {note}</Text>
              ))}
            </View>
          ) : null}
          {suggestion.provenance ? (
            <Text className="text-[10px] text-muted-foreground">
              Nguồn: {suggestion.provenance.provider} · {suggestion.provenance.model}
              {suggestion.confidence !== null ? ` · độ tự tin chung ${Math.round(suggestion.confidence * 100)}%` : ''}
            </Text>
          ) : null}
          <PrimaryButton label="Áp dụng vào công thức" onPress={apply} />
        </View>
      ) : null}
    </View>
  );
}
