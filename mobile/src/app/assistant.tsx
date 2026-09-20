import * as React from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Bot, MessageCirclePlus, Send, Sparkles, Square, ThumbsDown, ThumbsUp } from 'lucide-react-native';

import { FeedbackValue, ChatRole } from '@/common/enums';
import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import {
  useChatFeedbackMutation,
  useChatMessagesQuery,
  useChatSessionsQuery,
  useCreateChatSessionMutation,
  useSendChatMessage,
} from '@/features/chat/queries/chat.queries';
import type { ChatMessage, QuotaState } from '@/features/chat/types/chat.model';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const QUICK_PROMPTS = [
  'Hôm nay tôi nên ăn gì để đủ đạm thực vật?',
  'Gợi ý bữa tối chay ít calo nhưng no lâu',
  'Đậu hũ và nấm có đủ protein không?',
];

function QuotaBanner({ quota }: { quota: QuotaState | null }) {
  if (!quota) return null;
  const exhausted = quota.exhausted;
  return (
    <View className={cn('mt-4 rounded-2xl border p-3', exhausted ? 'border-destructive/30 bg-destructive/5' : 'border-primary/20 bg-primary/5')}>
      <Text className={cn('text-sm font-semibold', exhausted ? 'text-destructive' : 'text-primary')}>
        {exhausted ? 'Đã hết lượt hỏi hôm nay' : `Còn ${quota.remaining}/${quota.limit} lượt hôm nay`}
      </Text>
      <Text className="mt-1 text-xs text-muted-foreground">Hạn mức cấp lại lúc {quota.resetAtLabel}.</Text>
    </View>
  );
}

function MessageBubble({
  message,
  sessionId,
}: {
  message: ChatMessage;
  sessionId: string;
}) {
  const colors = useIconColors();
  const feedbackMutation = useChatFeedbackMutation();
  const fromUser = message.role === ChatRole.USER;

  const sendFeedback = (value: FeedbackValue) => {
    feedbackMutation.mutate(
      { messageId: message.id, sessionId, value },
      {
        onError: () => Alert.alert('Không gửi được đánh giá', 'Vui lòng thử lại sau.'),
      }
    );
  };

  return (
    <View className={cn('max-w-[92%] rounded-2xl p-3', fromUser ? 'self-end bg-primary' : 'self-start border border-border bg-card')}>
      <Text className={cn('text-sm leading-relaxed', fromUser ? 'text-primary-foreground' : 'text-foreground')}>
        {message.content}
      </Text>
      {message.disclaimer && !fromUser ? (
        <Text className="mt-2 text-xs leading-relaxed text-muted-foreground">{message.disclaimer}</Text>
      ) : null}
      {!fromUser ? (
        <View className="mt-2 flex-row items-center gap-2">
          <Pressable
            onPress={() => sendFeedback(FeedbackValue.UP)}
            className={cn('h-8 w-8 items-center justify-center rounded-full', message.feedback === FeedbackValue.UP ? 'bg-primary/15' : 'bg-muted')}>
            <ThumbsUp size={14} color={message.feedback === FeedbackValue.UP ? colors.primary : colors.mutedForeground} />
          </Pressable>
          <Pressable
            onPress={() => sendFeedback(FeedbackValue.DOWN)}
            className={cn('h-8 w-8 items-center justify-center rounded-full', message.feedback === FeedbackValue.DOWN ? 'bg-destructive/10' : 'bg-muted')}>
            <ThumbsDown size={14} color={message.feedback === FeedbackValue.DOWN ? '#dc2626' : colors.mutedForeground} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function StreamingBubble({ text }: { text: string }) {
  return (
    <View className="self-start rounded-2xl border border-border bg-card p-3">
      <Text className="text-sm leading-relaxed text-foreground">{text.length > 0 ? text : 'Đang suy nghĩ...'}</Text>
    </View>
  );
}

export default function AssistantScreen() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [sessionId, setSessionId] = React.useState('');
  const [input, setInput] = React.useState('');
  const createSessionMutation = useCreateChatSessionMutation();
  const sessionsQuery = useChatSessionsQuery();
  const activeSessionId = sessionId || sessionsQuery.data?.items?.[0]?.id || '';
  const messagesQuery = useChatMessagesQuery(activeSessionId, activeSessionId.length > 0);
  const sendState = useSendChatMessage(activeSessionId);

  const createSession = async () => {
    try {
      const session = await createSessionMutation.mutateAsync('Trợ lý dinh dưỡng');
      setSessionId(session.id);
    } catch {
      Alert.alert('Không tạo được phiên chat', 'Vui lòng kiểm tra kết nối và thử lại.');
    }
  };

  const ensureSession = async (): Promise<string> => {
    if (activeSessionId.length > 0) return activeSessionId;
    const session = await createSessionMutation.mutateAsync('Trợ lý dinh dưỡng');
    setSessionId(session.id);
    return session.id;
  };

  const send = async (content: string) => {
    const trimmed = content.trim();
    if (trimmed.length === 0 || sendState.isStreaming) return;
    try {
      const activeSessionId = await ensureSession();
      setInput('');
      await sendState.send(trimmed, activeSessionId);
    } catch {
      Alert.alert('Không gửi được câu hỏi', 'Vui lòng thử lại sau.');
    }
  };

  const messages = messagesQuery.data?.items ?? [];
  const hasContent = messages.length > 0 || sendState.pendingUserContent || sendState.streamingContent;

  return (
    <SiteScreen>
      <View className="px-5 pt-4">
        <View className="flex-row items-center gap-2">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-cta/15">
            <Bot size={18} color={colors.cta} />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">Assistant / chat AI</Text>
            <Text className="mt-0.5 text-xs text-muted-foreground">
              Tư vấn dinh dưỡng chay mang tính tham khảo, không thay thế chẩn đoán y khoa.
            </Text>
          </View>
        </View>

        <QuotaBanner quota={sendState.quota} />

        {sendState.maintenance ? (
          <View className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-3">
            <Text className="text-sm font-semibold text-amber-800">Trợ lý đang bảo trì</Text>
            <Text className="mt-1 text-xs text-amber-800">Bạn vẫn có thể xem lịch sử trò chuyện.</Text>
          </View>
        ) : null}

        {isAuthenticated ? (
          <View className="mt-4">
            <PrimaryButton
              label={createSessionMutation.isPending ? 'Đang tạo phiên...' : 'Đoạn chat mới'}
              loading={createSessionMutation.isPending}
              variant="outline"
              icon={<MessageCirclePlus size={16} color={colors.foreground} />}
              onPress={() => void createSession()}
            />
          </View>
        ) : (
          <View className="mt-4 rounded-2xl border border-border bg-card p-3">
            <Text className="text-sm font-semibold text-foreground">Bạn đang dùng chế độ khách</Text>
            <Text className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Backend sẽ cấp cookie khách riêng và giới hạn lượt hỏi thấp hơn tài khoản đã đăng nhập.
            </Text>
          </View>
        )}

        <View className="mt-5 gap-3">
          {messagesQuery.isLoading ? (
            <View className="items-center rounded-2xl border border-border p-6">
              <ActivityIndicator color={colors.primary} />
              <Text className="mt-3 text-sm text-muted-foreground">Đang tải lịch sử...</Text>
            </View>
          ) : !hasContent ? (
            <View className="rounded-2xl border border-dashed border-border p-6">
              <View className="flex-row items-center gap-2">
                <Sparkles size={16} color={colors.cta} />
                <Text className="font-semibold text-foreground">Bạn muốn hỏi gì hôm nay?</Text>
              </View>
              <Text className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Hỏi về đạm thực vật, calo, gợi ý món chay hoặc thay thế nguyên liệu phù hợp với mục tiêu của bạn.
              </Text>
              <View className="mt-4 gap-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <Pressable
                    key={prompt}
                    onPress={() => void send(prompt)}
                    className="rounded-xl border border-border bg-card px-3 py-2.5">
                    <Text className="text-sm text-foreground">{prompt}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} sessionId={activeSessionId} />
              ))}
              {sendState.pendingUserContent ? (
                <View className="self-end rounded-2xl bg-primary p-3">
                  <Text className="text-sm leading-relaxed text-primary-foreground">{sendState.pendingUserContent}</Text>
                </View>
              ) : null}
              {sendState.isStreaming ? <StreamingBubble text={sendState.streamingContent} /> : null}
            </>
          )}
        </View>

        {sendState.streamError ? (
          <View className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
            <Text className="text-sm font-semibold text-destructive">{sendState.streamError}</Text>
          </View>
        ) : null}

        <View className="mt-5 rounded-2xl border border-border bg-card p-3">
          <TextInput
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            placeholder="Hỏi về dinh dưỡng chay, nguyên liệu, bữa ăn..."
            placeholderTextColor={colors.mutedForeground}
            className="min-h-20 text-sm text-foreground"
            editable={!sendState.isStreaming && !sendState.maintenance}
          />
          <View className="mt-3 flex-row items-center justify-between gap-3">
            <Text className="text-xs text-muted-foreground">{input.length}/2000</Text>
            {sendState.isStreaming ? (
              <Pressable onPress={sendState.abort} className="flex-row items-center gap-2 rounded-xl bg-muted px-4 py-3">
                <Square size={14} color={colors.foreground} />
                <Text className="text-sm font-semibold text-foreground">Dừng</Text>
              </Pressable>
            ) : (
              <Pressable
                disabled={input.trim().length === 0 || sendState.maintenance}
                onPress={() => void send(input)}
                className={cn(
                  'flex-row items-center gap-2 rounded-xl px-4 py-3',
                  input.trim().length === 0 || sendState.maintenance ? 'bg-muted opacity-60' : 'bg-primary'
                )}>
                <Text
                  className={cn(
                    'text-sm font-semibold',
                    input.trim().length === 0 || sendState.maintenance ? 'text-muted-foreground' : 'text-primary-foreground'
                  )}>
                  Gửi
                </Text>
                <Send size={14} color={input.trim().length === 0 || sendState.maintenance ? colors.mutedForeground : colors.primaryForeground} />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </SiteScreen>
  );
}
