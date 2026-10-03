import * as React from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { Compass, History, Plus, Sparkles } from 'lucide-react-native';

import { SiteHeader } from '@/components/layout/site-header';
import { ErrorState, LoadingState } from '@/components/shared/state-views';
import { ChatWelcome } from '@/features/chat/components/chat-welcome';
import { Composer } from '@/features/chat/components/composer';
import { Disclaimer, FallbackNotice } from '@/features/chat/components/fallback-notice';
import { MessageBubble, PendingUserBubble, StreamingBubble } from '@/features/chat/components/message-bubble';
import { QuotaExhaustedBanner, QuotaPill } from '@/features/chat/components/quota-banner';
import { SessionListSheet } from '@/features/chat/components/session-list-sheet';
import {
  useChatMessagesQuery,
  useChatSessionsQuery,
  useCreateChatSessionMutation,
  useSendChatMessage,
} from '@/features/chat/queries/chat.queries';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';

const SESSION_TITLE_MAX = 60;

function titleFromPrompt(prompt: string): string {
  const oneLine = prompt.replace(/\s+/g, ' ').trim();
  return oneLine.length > SESSION_TITLE_MAX ? `${oneLine.slice(0, SESSION_TITLE_MAX - 1)}…` : oneLine;
}

/**
 * Trợ lý dinh dưỡng AI — bố cục "canvas hội thoại" của web thu gọn cho mobile: thanh trên (hạn mức, đổi phiên, đoạn chat
 * mới, khám phá tri thức), thông báo bảo trì/hết lượt, màn chào với 4 gợi ý, bong bóng Markdown, ô nhập cố định phía dưới.
 */
export default function AssistantScreen() {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const scrollRef = React.useRef<ScrollView>(null);

  // `null` = tự chọn phiên gần nhất; `''` = đang soạn đoạn chat mới (phiên chỉ tạo khi gửi câu đầu tiên).
  const [selectedSessionId, setSelectedSessionId] = React.useState<string | null>(null);
  const [sessionsOpen, setSessionsOpen] = React.useState(false);
  const createSessionMutation = useCreateChatSessionMutation();
  const sessionsQuery = useChatSessionsQuery();

  const activeSessionId = selectedSessionId ?? sessionsQuery.data?.items?.[0]?.id ?? '';
  const messagesQuery = useChatMessagesQuery(activeSessionId, activeSessionId.length > 0);
  const sendState = useSendChatMessage(activeSessionId);

  const messages = messagesQuery.data?.items ?? [];
  const hasConversation = messages.length > 0 || !!sendState.pendingUserContent || !!sendState.streamingContent;
  const showWelcome = !hasConversation && !messagesQuery.isLoading;

  const scrollToEnd = React.useCallback(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, []);

  const startNewChat = () => {
    if (sendState.isStreaming) {
      Alert.alert('Đang trả lời', 'Hãy chờ trợ lý trả lời xong hoặc bấm Dừng trước khi tạo đoạn chat mới.');
      return;
    }
    setSelectedSessionId('');
    setSessionsOpen(false);
  };

  const selectSession = (id: string) => {
    if (sendState.isStreaming) {
      Alert.alert('Đang trả lời', 'Hãy chờ trợ lý trả lời xong hoặc bấm Dừng trước khi đổi đoạn chat.');
      return;
    }
    setSelectedSessionId(id);
    setSessionsOpen(false);
  };

  const ensureSession = async (firstPrompt: string): Promise<string> => {
    if (activeSessionId.length > 0) return activeSessionId;
    const session = await createSessionMutation.mutateAsync(titleFromPrompt(firstPrompt));
    setSelectedSessionId(session.id);
    return session.id;
  };

  const send = async (content: string) => {
    const trimmed = content.trim();
    if (trimmed.length === 0 || sendState.isStreaming) return;
    try {
      const sessionId = await ensureSession(trimmed);
      await sendState.send(trimmed, sessionId);
    } catch {
      Alert.alert('Không gửi được câu hỏi', 'Vui lòng kiểm tra kết nối và thử lại.');
    }
  };

  const quotaExhausted = sendState.quota?.exhausted === true;
  const composerDisabled = sendState.maintenance || quotaExhausted;

  return (
    <View className="flex-1 bg-background">
      <SiteHeader />

      <View className="gap-2 border-b border-border px-5 pb-3 pt-3">
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Sparkles size={17} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text numberOfLines={1} className="text-base font-bold text-foreground">
              Trợ lý dinh dưỡng
            </Text>
            <Text numberOfLines={1} className="text-[11px] text-muted-foreground">
              {isAuthenticated ? 'Tư vấn chay mang tính tham khảo' : 'Chế độ khách · hạn mức thấp hơn tài khoản'}
            </Text>
          </View>
          <Pressable
            onPress={() => setSessionsOpen(true)}
            accessibilityLabel="Danh sách đoạn chat"
            className="h-9 w-9 items-center justify-center rounded-full bg-muted">
            <History size={16} color={colors.foreground} />
          </Pressable>
          <Pressable
            onPress={startNewChat}
            accessibilityLabel="Đoạn chat mới"
            className="h-9 w-9 items-center justify-center rounded-full bg-primary">
            <Plus size={16} color={colors.primaryForeground} />
          </Pressable>
        </View>

        <View className="flex-row items-center justify-between gap-2">
          <QuotaPill quota={sendState.quota} />
          <Link href={'/ai-knowledge' as Href} asChild>
            <Pressable className="ml-auto flex-row items-center gap-1.5 rounded-full border border-border px-3 py-1.5">
              <Compass size={12} color={colors.primary} />
              <Text className="text-xs font-semibold text-primary">Khám phá tri thức AI</Text>
            </Pressable>
          </Link>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerClassName="grow gap-3.5 px-5 pb-4 pt-4"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={scrollToEnd}>
          <FallbackNotice maintenance={sendState.maintenance} />
          <QuotaExhaustedBanner quota={sendState.quota} />

          {messagesQuery.isLoading ? (
            <LoadingState message="Đang tải lịch sử..." />
          ) : messagesQuery.isError ? (
            <ErrorState title="Không tải được lịch sử trò chuyện." onRetry={() => void messagesQuery.refetch()} />
          ) : showWelcome ? (
            <ChatWelcome onSelectPrompt={(prompt) => void send(prompt)} disabled={composerDisabled} />
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} sessionId={activeSessionId} />
              ))}
              {sendState.pendingUserContent ? <PendingUserBubble text={sendState.pendingUserContent} /> : null}
              {sendState.isStreaming ? <StreamingBubble text={sendState.streamingContent} /> : null}
            </>
          )}

          {sendState.streamError ? (
            <View className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
              <Text className="text-sm font-semibold text-destructive">{sendState.streamError}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View className="gap-2 border-t border-border bg-background px-4 pb-3 pt-2.5">
          <Composer isStreaming={sendState.isStreaming} disabled={composerDisabled} onSend={send} onAbort={sendState.abort} />
          <Disclaimer />
        </View>
      </KeyboardAvoidingView>

      <SessionListSheet
        visible={sessionsOpen}
        activeId={activeSessionId}
        creating={createSessionMutation.isPending}
        onSelect={selectSession}
        onNewChat={startNewChat}
        onClose={() => setSessionsOpen(false)}
      />
    </View>
  );
}
