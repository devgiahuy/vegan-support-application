import * as React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { ArrowUp, Square } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';

export const CHAT_MAX_LENGTH = 2000;

/** Khung nhập câu hỏi dạng pill: tự giãn tối đa ~5 dòng, nút Gửi/Dừng tích hợp — đồng bộ `Composer` của web. */
export function Composer({
  isStreaming,
  disabled,
  placeholder = 'Hỏi về món chay, dinh dưỡng, thực đơn...',
  onSend,
  onAbort,
}: {
  isStreaming: boolean;
  disabled?: boolean;
  placeholder?: string;
  onSend: (content: string) => void | Promise<void>;
  onAbort: () => void;
}) {
  const colors = useIconColors();
  const [draft, setDraft] = React.useState('');
  const canSend = !isStreaming && !disabled && draft.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    const content = draft.trim();
    setDraft('');
    void onSend(content);
  };

  return (
    <View>
      <View className="flex-row items-end gap-2 rounded-2xl border border-border bg-card p-2">
        <TextInput
          value={draft}
          onChangeText={setDraft}
          multiline
          maxLength={CHAT_MAX_LENGTH}
          editable={!isStreaming && !disabled}
          placeholder={disabled ? 'Trợ lý tạm thời chưa nhận câu hỏi mới' : placeholder}
          placeholderTextColor={colors.mutedForeground}
          accessibilityLabel="Nhập câu hỏi cho trợ lý"
          className="max-h-32 min-h-9 flex-1 px-2.5 py-1.5 text-sm leading-relaxed text-foreground"
        />
        {isStreaming ? (
          <Pressable
            onPress={onAbort}
            accessibilityLabel="Dừng nhận câu trả lời"
            className="h-9 w-9 items-center justify-center rounded-xl bg-destructive">
            <Square size={14} color="#ffffff" fill="#ffffff" />
          </Pressable>
        ) : (
          <Pressable
            onPress={submit}
            disabled={!canSend}
            accessibilityLabel="Gửi câu hỏi"
            className={cn('h-9 w-9 items-center justify-center rounded-xl', canSend ? 'bg-primary' : 'bg-muted opacity-60')}>
            <ArrowUp size={16} strokeWidth={2.5} color={canSend ? colors.primaryForeground : colors.mutedForeground} />
          </Pressable>
        )}
      </View>
      {draft.length > CHAT_MAX_LENGTH * 0.8 ? (
        <Text className="mt-1 px-2 text-right text-[11px] text-muted-foreground">
          {draft.length}/{CHAT_MAX_LENGTH}
        </Text>
      ) : null}
    </View>
  );
}
