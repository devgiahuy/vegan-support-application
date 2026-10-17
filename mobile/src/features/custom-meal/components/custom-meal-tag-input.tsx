import * as React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useIconColors } from '@/lib/theme-colors';
import { MAX_TAGS_PER_MEAL, addUserTags } from '../utils/tag-normalizer';

/** Nhập thẻ dạng chip: gõ rồi bấm Enter hoặc dấu phẩy để thêm, bấm × để xóa. */
export function CustomMealTagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const colors = useIconColors();
  const [input, setInput] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const commit = (raw: string) => {
    if (!raw.trim()) return;
    const result = addUserTags(tags, raw);
    setError(result.error);
    if (result.tags.length !== tags.length) {
      onChange(result.tags);
      setInput('');
    }
  };

  const handleChange = (value: string) => {
    // Dấu phẩy/chấm phẩy kết thúc một thẻ ngay khi gõ.
    if (/[,;]/.test(value)) commit(value);
    else setInput(value);
  };

  return (
    <View className="gap-1.5">
      <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Thẻ ({tags.length}/{MAX_TAGS_PER_MEAL})
      </Text>
      {tags.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {tags.map((tag) => (
            <View key={tag} className="flex-row items-center gap-1 rounded-full bg-primary/10 py-1 pl-3 pr-2">
              <Text className="text-xs font-medium text-primary">#{tag}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Xóa thẻ ${tag}`}
                hitSlop={8}
                onPress={() => onChange(tags.filter((item) => item !== tag))}>
                <X size={13} color={colors.primary} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
      <TextInput
        value={input}
        onChangeText={handleChange}
        onSubmitEditing={() => commit(input)}
        onBlur={() => commit(input)}
        returnKeyType="done"
        blurOnSubmit={false}
        placeholder="meal-prep, bữa trưa…"
        placeholderTextColor={colors.mutedForeground}
        editable={tags.length < MAX_TAGS_PER_MEAL}
        className="h-12 rounded-xl border border-input bg-background px-4 text-sm text-foreground"
      />
      {error ? <Text className="text-xs text-destructive">{error}</Text> : null}
    </View>
  );
}
