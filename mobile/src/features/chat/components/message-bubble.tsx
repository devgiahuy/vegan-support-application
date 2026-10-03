import * as React from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Bookmark, Bot, Copy, ShieldAlert, Sparkles, ThumbsDown, ThumbsUp, User } from 'lucide-react-native';

import { AiArtifactType, ChatMessageStatus, ChatRole, FeedbackValue } from '@/common/enums';
import { SaveArtifactSheet } from '@/features/ai-artifact/components/save-artifact-sheet';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useChatFeedbackMutation } from '../queries/chat.queries';
import type { ChatMessage } from '../types/chat.model';
import { ChatMarkdown } from './chat-markdown';

const DEFAULT_ARTIFACT_TITLE = 'Câu trả lời từ Trợ lý VeggieConnect';

/** Bong bóng tin nhắn người dùng / trợ lý. Trợ lý: Markdown, ghi chú dự phòng, sao chép, đánh giá, lưu thành tri thức AI. */
export function MessageBubble({ message, sessionId }: { message: ChatMessage; sessionId: string }) {
  const colors = useIconColors();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const feedbackMutation = useChatFeedbackMutation();
  const [saveOpen, setSaveOpen] = React.useState(false);

  const fromUser = message.role === ChatRole.USER;
  const completed = message.status === ChatMessageStatus.COMPLETED;
  const showToolbar = !fromUser && completed && message.content.length > 0;

  const sendFeedback = (value: FeedbackValue) => {
    if (feedbackMutation.isPending) return;
    feedbackMutation.mutate(
      { messageId: message.id, sessionId, value },
      { onError: () => Alert.alert('Không gửi được đánh giá', 'Vui lòng thử lại sau.') }
    );
  };

  const copyOrShare = () => {
    // Không có module clipboard trong build hiện tại; bảng chia sẻ hệ điều hành có sẵn mục "Sao chép".
    void Share.share({ message: message.content });
  };

  const openSave = () => {
    if (!isAuthenticated) {
      Alert.alert('Cần đăng nhập', 'Vui lòng đăng nhập để lưu và chia sẻ tri thức AI.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/(auth)/login' as Href) },
      ]);
      return;
    }
    setSaveOpen(true);
  };

  if (fromUser) {
    return (
      <View className="flex-row items-end justify-end gap-2">
        <View className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5">
          <Text selectable className="text-sm leading-relaxed text-primary-foreground">
            {message.content}
          </Text>
        </View>
        <View className="h-7 w-7 items-center justify-center rounded-full bg-primary/10">
          <User size={14} color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-row items-start gap-2">
      <View className="h-7 w-7 items-center justify-center rounded-full bg-primary">
        <Sparkles size={14} color={colors.primaryForeground} />
      </View>
      <View className="max-w-[88%] flex-1 gap-1.5">
        <Text className="px-1 text-[11px] font-medium text-muted-foreground">Trợ lý Dinh dưỡng VeggieConnect</Text>
        <View className="rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-3">
          <ChatMarkdown content={message.content} />

          {message.isFallback ? (
            <View className="mt-3 flex-row items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5">
              <ShieldAlert size={14} color="#b45309" style={{ marginTop: 1 }} />
              <Text className="flex-1 text-xs leading-relaxed text-amber-800">
                Ghi chú: Đây là câu trả lời dự phòng do hệ thống AI trực tiếp đang quá tải hoặc gián đoạn kết nối.
              </Text>
            </View>
          ) : null}

          {message.disclaimer ? (
            <Text className="mt-2.5 text-[11px] leading-relaxed text-muted-foreground">{message.disclaimer}</Text>
          ) : null}
        </View>

        {showToolbar ? (
          <View className="flex-row items-center gap-1 px-1">
            <Pressable onPress={copyOrShare} accessibilityLabel="Sao chép hoặc chia sẻ nội dung" className="h-8 w-8 items-center justify-center rounded-md">
              <Copy size={15} color={colors.mutedForeground} />
            </Pressable>
            <Pressable
              onPress={() => sendFeedback(FeedbackValue.UP)}
              accessibilityLabel="Câu trả lời hữu ích"
              className={cn('h-8 w-8 items-center justify-center rounded-md', message.feedback === FeedbackValue.UP ? 'bg-primary/15' : '')}>
              <ThumbsUp size={15} color={message.feedback === FeedbackValue.UP ? colors.primary : colors.mutedForeground} />
            </Pressable>
            <Pressable
              onPress={() => sendFeedback(FeedbackValue.DOWN)}
              accessibilityLabel="Câu trả lời chưa hữu ích"
              className={cn('h-8 w-8 items-center justify-center rounded-md', message.feedback === FeedbackValue.DOWN ? 'bg-primary/15' : '')}>
              <ThumbsDown size={15} color={message.feedback === FeedbackValue.DOWN ? colors.primary : colors.mutedForeground} />
            </Pressable>
            {message.isFallback ? null : (
              <Pressable onPress={openSave} accessibilityLabel="Lưu thành tri thức AI" className="h-8 flex-row items-center gap-1 rounded-md px-2">
                <Bookmark size={15} color={colors.primary} />
                <Text className="text-xs font-medium text-primary">Lưu</Text>
              </Pressable>
            )}
          </View>
        ) : null}
      </View>

      <SaveArtifactSheet
        visible={saveOpen}
        type={AiArtifactType.CHAT_ANSWER}
        sourceId={message.id}
        defaultTitle={DEFAULT_ARTIFACT_TITLE}
        defaultSummary={message.content.slice(0, 150)}
        onClose={() => setSaveOpen(false)}
      />
    </View>
  );
}

/** Bong bóng tạm khi trợ lý đang trả lời (stream). */
export function StreamingBubble({ text }: { text: string }) {
  const colors = useIconColors();
  return (
    <View className="flex-row items-start gap-2">
      <View className="h-7 w-7 items-center justify-center rounded-full bg-primary">
        <Sparkles size={14} color={colors.primaryForeground} />
      </View>
      <View className="max-w-[88%] flex-1">
        <View className="rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-3">
          {text.length > 0 ? (
            <ChatMarkdown content={text} />
          ) : (
            <View className="flex-row items-center gap-1.5">
              <Bot size={14} color={colors.primary} />
              <Text className="text-sm text-muted-foreground">Đang suy nghĩ...</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

/** Tin nhắn người dùng vừa gửi, hiển thị tạm trước khi server trả lại lịch sử. */
export function PendingUserBubble({ text }: { text: string }) {
  const colors = useIconColors();
  return (
    <View className="flex-row items-end justify-end gap-2">
      <View className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5">
        <Text className="text-sm leading-relaxed text-primary-foreground">{text}</Text>
      </View>
      <View className="h-7 w-7 items-center justify-center rounded-full bg-primary/10">
        <User size={14} color={colors.primary} />
      </View>
    </View>
  );
}
