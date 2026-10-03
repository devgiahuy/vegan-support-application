import { Text, View } from 'react-native';
import { Apple, ChefHat, MessageSquare, Receipt } from 'lucide-react-native';

import { AiArtifactType } from '@/common/enums';
import { ChatMarkdown } from '@/features/chat/components/chat-markdown';
import { useIconColors } from '@/lib/theme-colors';
import type { AiArtifactContent, RecognitionItem } from '../types/ai-artifact.model';

function RecognitionList({ items }: { items: RecognitionItem[] }) {
  if (items.length === 0) {
    return <Text className="text-sm text-muted-foreground">Chưa có mục nào.</Text>;
  }
  return (
    <View className="gap-2">
      {items.map((item, index) => (
        <View key={`${item.name}-${index}`} className="flex-row items-center justify-between gap-3 rounded-xl border border-border bg-card p-3">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">{item.name}</Text>
            <Text className="text-xs text-muted-foreground">{item.quantityLabel}</Text>
          </View>
          <View className="items-end">
            <Text className="text-[11px] font-medium text-muted-foreground">{item.statusLabel}</Text>
            <Text className="text-[11px] text-muted-foreground">{item.confidencePercent}% tin cậy</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Hiển thị ảnh chụp nội dung bất biến của AI artifact theo từng loại. */
export function ArtifactContent({ content }: { content: AiArtifactContent }) {
  const colors = useIconColors();

  switch (content.type) {
    case AiArtifactType.CHAT_ANSWER:
      return (
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <MessageSquare size={14} color={colors.primary} />
            <Text className="text-xs font-medium text-muted-foreground">Câu trả lời từ Trợ lý AI</Text>
          </View>
          <View className="rounded-xl border border-border bg-card p-3.5">
            {content.answer.length > 0 ? (
              <ChatMarkdown content={content.answer} />
            ) : (
              <Text className="text-sm text-muted-foreground">(Nội dung câu trả lời trống)</Text>
            )}
          </View>
        </View>
      );

    case AiArtifactType.RECIPE_NUTRITION:
      return (
        <View className="gap-3">
          <View className="gap-1 border-b border-border pb-2">
            <View className="flex-row items-center gap-2">
              <ChefHat size={14} color={colors.primary} />
              <Text className="flex-1 text-sm font-bold text-foreground">{content.recipeTitle}</Text>
            </View>
            <Text className="text-xs text-muted-foreground">
              {content.servings} khẩu phần · {content.rawGrams} g sống → {content.cookedGrams} g chín
            </Text>
          </View>
          <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Dinh dưỡng ước tính mỗi khẩu phần · độ tin cậy chung {content.confidencePercent}%
          </Text>
          <View className="gap-1.5">
            {content.nutrients.map((nutrient, index) => (
              <View key={`${nutrient.code}-${index}`} className="flex-row items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">{nutrient.name}</Text>
                  {nutrient.rangeLabel ? (
                    <Text className="text-[11px] text-muted-foreground">Khoảng dao động {nutrient.rangeLabel}</Text>
                  ) : null}
                </View>
                <View className="items-end">
                  <Text className="text-sm font-semibold text-foreground">
                    {nutrient.amount} {nutrient.unit}
                  </Text>
                  <Text className="text-[11px] text-muted-foreground">{nutrient.confidencePercent}% tin cậy</Text>
                </View>
              </View>
            ))}
          </View>
          {content.disclaimer.length > 0 ? (
            <Text className="text-[11px] italic text-muted-foreground">* {content.disclaimer}</Text>
          ) : null}
        </View>
      );

    case AiArtifactType.FRIDGE_RECOGNITION:
      return (
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Apple size={14} color={colors.primary} />
            <Text className="text-xs font-medium text-muted-foreground">Nguyên liệu nhận diện từ ảnh tủ lạnh</Text>
          </View>
          <RecognitionList items={content.items} />
        </View>
      );

    case AiArtifactType.RECEIPT_EXTRACTION:
      return (
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Receipt size={14} color={colors.primary} />
            <Text className="text-xs font-medium text-muted-foreground">Mặt hàng trích xuất từ hóa đơn</Text>
          </View>
          <RecognitionList items={content.items} />
        </View>
      );
  }
}
