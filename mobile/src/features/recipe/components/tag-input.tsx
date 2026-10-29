import * as React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Plus, X } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';

/**
 * Ô nhập dạng thẻ: gõ tên rồi nhấn Enter (hoặc dấu phẩy) để thêm; có hàng "Gợi ý nhanh" chạm để thêm.
 * Đồng bộ `frontend/.../tag-input.tsx`.
 */
export function TagInput({
  value,
  onChange,
  placeholder = 'Gõ tên nguyên liệu rồi nhấn Enter, vd: Đậu hũ',
  maxTags = 50,
  disabled = false,
  quickSuggestions,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  quickSuggestions?: string[];
}) {
  const colors = useIconColors();
  const [text, setText] = React.useState('');

  const addMany = (items: string[]) => {
    const next = [...value];
    for (const raw of items) {
      const tag = raw.trim();
      if (tag && !next.includes(tag) && next.length < maxTags) next.push(tag);
    }
    if (next.length !== value.length) onChange(next);
  };

  const handleChange = (input: string) => {
    if (input.includes(',')) {
      const parts = input.split(',');
      addMany(parts.slice(0, -1));
      setText(parts[parts.length - 1] ?? '');
      return;
    }
    setText(input);
  };

  const commit = () => {
    addMany([text]);
    setText('');
  };

  const remaining = (quickSuggestions ?? []).filter((item) => !value.includes(item));

  return (
    <View className="gap-2">
      <View className="rounded-xl border border-input bg-background px-3">
        {value.length > 0 ? (
          <View className="flex-row flex-wrap gap-1.5 pt-2.5">
            {value.map((tag) => (
              <View key={tag} className="flex-row items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1">
                <Text className="text-xs font-medium text-primary">{tag}</Text>
                {disabled ? null : (
                  <Pressable accessibilityRole="button" accessibilityLabel={`Xóa ${tag}`} hitSlop={8} onPress={() => onChange(value.filter((item) => item !== tag))}>
                    <X size={12} color={colors.primary} />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        ) : null}
        <TextInput
          value={text}
          onChangeText={handleChange}
          onSubmitEditing={commit}
          onBlur={commit}
          editable={!disabled && value.length < maxTags}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          returnKeyType="done"
          blurOnSubmit={false}
          textAlignVertical="center"
          className="h-12 text-sm text-foreground"
        />
      </View>
      {remaining.length > 0 && !disabled ? (
        <View className="gap-1.5">
          <Text className="text-[11px] text-muted-foreground">Gợi ý nhanh:</Text>
          <View className="flex-row flex-wrap gap-1.5">
            {remaining.map((item) => (
              <Pressable key={item} accessibilityRole="button" onPress={() => addMany([item])} className="flex-row items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 active:bg-muted">
                <Plus size={11} color={colors.mutedForeground} />
                <Text className="text-xs text-foreground">{item}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
