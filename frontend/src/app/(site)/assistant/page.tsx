'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  TriangleAlert,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Plus,
  ArrowDown,
  Globe,
} from 'lucide-react';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ChatMessageStatus, ChatRole } from '@/common/enums';
import type { ChatMessage } from '@/features/chat/types/chat.model';
import {
  useChatMessagesQuery,
  useChatSessionsQuery,
  useCreateChatSessionMutation,
  useSendChatMessage,
} from '@/features/chat/queries/chat.queries';
import { MessageBubble } from '@/features/chat/components/message-bubble';
import { Composer } from '@/features/chat/components/composer';
import { Disclaimer } from '@/features/chat/components/disclaimer';
import { SessionList } from '@/features/chat/components/session-list';
import { FeedbackButtons } from '@/features/chat/components/feedback-buttons';
import { ShareAnswerButton } from '@/features/chat/components/share-answer-button';
import { VerifyAnswerButton } from '@/features/chat/components/verify-answer-button';
import { QuotaBanner } from '@/features/chat/components/quota-banner';
import { FallbackNotice } from '@/features/chat/components/fallback-notice';
import { ChatWelcome } from '@/features/chat/components/chat-welcome';

const streamingPlaceholder = (sessionId: string, content: string): ChatMessage => ({
  id: 'streaming',
  sessionId,
  role: ChatRole.ASSISTANT,
  roleLabel: 'Trợ lý',
  status: ChatMessageStatus.STREAMING,
  content,
  isFallback: false,
  disclaimer: null,
  feedback: null,
  completedAt: null,
  createdAt: null,
});

const pendingUserPlaceholder = (sessionId: string, content: string): ChatMessage => ({
  id: 'pending-user',
  sessionId,
  role: ChatRole.USER,
  roleLabel: 'Bạn',
  status: ChatMessageStatus.COMPLETE,
  content,
  isFallback: false,
  disclaimer: null,
  feedback: null,
  completedAt: null,
  createdAt: null,
});

/**
 * Trang Trợ lý AI VeggieConnect:
 * - Giao diện conversational canvas toàn màn hình chuẩn ChatGPT/Claude.
 * - Sidebar thông minh cho cả Khách và Thành viên đã đăng nhập.
 * - Bento Hero gợi ý câu hỏi khi mở phiên mới.
 * - Render Markdown phong phú cho công thức và dinh dưỡng.
 */
function AssistantContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionId, setSessionId] = React.useState(() => searchParams.get('session') ?? '');
  const [createFailed, setCreateFailed] = React.useState(false);
  const [desktopSidebarOpen, setDesktopSidebarOpen] = React.useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const creatingRef = React.useRef(false);
  const threadRef = React.useRef<HTMLDivElement>(null);

  const createSession = useCreateChatSessionMutation();
  const messagesQuery = useChatMessagesQuery(sessionId, sessionId.length > 0);
  const sessionsQuery = useChatSessionsQuery();
  const {
    isStreaming,
    streamingContent,
    streamError,
    quota,
    maintenance,
    pendingUserContent,
    send,
    abort,
  } = useSendChatMessage(sessionId);

  // Tự tạo phiên đầu tiên nếu chưa có tham số `?session=`
  React.useEffect(() => {
    if (sessionId.length > 0 || creatingRef.current || createFailed) return;
    creatingRef.current = true;
    createSession.mutate(undefined, {
      onSuccess: (session) => {
        setSessionId(session.id);
        router.replace(`/assistant?session=${session.id}`);
      },
      onError: () => {
        creatingRef.current = false;
        setCreateFailed(true);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, createFailed]);

  const messages = messagesQuery.data?.items ?? [];
  const currentSession = sessionsQuery.data?.items.find((s) => s.id === sessionId);

  // Tự động cuộn xuống cuối khi có tin nhắn mới hoặc streaming
  React.useEffect(() => {
    if (isAtBottom && threadRef.current) {
      threadRef.current.scrollTo({
        top: threadRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages.length, streamingContent, pendingUserContent, isAtBottom]);

  // Kiểm tra vị trí cuộn để hiển thị nút "Cuộn xuống cuối"
  const handleScroll = () => {
    const el = threadRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsAtBottom(distanceToBottom < 100);
  };

  const scrollToBottom = () => {
    if (threadRef.current) {
      threadRef.current.scrollTo({
        top: threadRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setIsAtBottom(true);
    }
  };

  const retryCreate = () => {
    setCreateFailed(false);
    creatingRef.current = false;
  };

  const handleSelectSession = (id: string) => {
    abort();
    setSessionId(id);
    router.replace(`/assistant?session=${id}`);
  };

  const handleNewChat = () => {
    abort();
    createSession.mutate(undefined, {
      onSuccess: (session) => {
        setSessionId(session.id);
        router.replace(`/assistant?session=${session.id}`);
      },
    });
  };

  return (
    <div className="fixed inset-x-0 bottom-0 top-16 z-10 flex overflow-hidden bg-background">
      {/* 1. Mobile Sidebar Sheet */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="w-[300px] p-4 sm:w-[340px]">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
              Lịch sử trò chuyện
            </SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto">
            <SessionList
              activeId={sessionId}
              onSelect={(id) => {
                handleSelectSession(id);
                setMobileSidebarOpen(false);
              }}
              onNewChat={() => {
                handleNewChat();
                setMobileSidebarOpen(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* 2. Desktop Sidebar */}
      <aside
        className={cn(
          'hidden flex-col border-r border-border/70 bg-muted/20 backdrop-blur-xs transition-all duration-200 lg:flex',
          desktopSidebarOpen ? 'w-[280px] p-3.5' : 'w-0 overflow-hidden border-r-0 p-0'
        )}
      >
        <div className="flex h-full flex-col justify-between overflow-y-auto pr-1">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Lịch sử trò chuyện
              </h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setDesktopSidebarOpen(false)}
                className="size-7 text-muted-foreground hover:text-foreground"
                aria-label="Thu gọn thanh bên"
                title="Thu gọn thanh bên"
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </div>
            <SessionList
              activeId={sessionId}
              onSelect={handleSelectSession}
              onNewChat={handleNewChat}
            />
          </div>
        </div>
      </aside>

      {/* 3. Main Chat Canvas */}
      <main className="relative flex flex-1 flex-col overflow-hidden bg-background">
        {/* Chat Top Bar */}
        <header className="flex h-13 shrink-0 items-center justify-between border-b border-border/60 bg-background/85 px-4 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            {/* Mobile drawer trigger */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setMobileSidebarOpen(true)}
              className="size-8 text-muted-foreground lg:hidden"
              aria-label="Mở danh sách đoạn chat"
            >
              <Menu className="size-4" />
            </Button>

            {/* Desktop re-open button */}
            {!desktopSidebarOpen && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setDesktopSidebarOpen(true)}
                className="hidden size-8 text-muted-foreground hover:text-foreground lg:inline-flex"
                aria-label="Mở thanh bên"
                title="Mở thanh bên"
              >
                <PanelLeftOpen className="size-4" />
              </Button>
            )}

            {/* Session Info */}
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="size-3.5" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground tracking-tight line-clamp-1">
                  {currentSession?.title || 'Trợ lý Dinh dưỡng Chay'}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quota Badge */}
            <QuotaBanner quota={quota} variant="pill" />

            {/* New chat quick button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              disabled={createSession.isPending}
              className="hidden h-8 gap-1.5 rounded-xl border-border/80 px-2.5 text-xs sm:inline-flex"
              aria-label="Đoạn chat mới"
            >
              <Plus className="size-3.5" />
              <span>Mới</span>
            </Button>

            {/* Khám phá câu trả lời công khai */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push('/assistant/public')}
              className="hidden h-8 gap-1.5 rounded-xl px-2.5 text-xs sm:inline-flex"
              aria-label="Khám phá câu trả lời công khai"
            >
              <Globe className="size-3.5" />
              <span>Khám phá</span>
            </Button>
          </div>
        </header>

        {/* Maintenance notice if active */}
        {maintenance && (
          <div className="px-4 pt-3">
            <FallbackNotice maintenance={maintenance} />
          </div>
        )}

        {/* Quota exhausted banner if active */}
        {quota?.exhausted && (
          <div className="px-4 pt-3">
            <QuotaBanner quota={quota} variant="banner" />
          </div>
        )}

        {/* Message Thread Scroll Container */}
        <div
          ref={threadRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 pt-4 pb-8 sm:px-6"
        >
          <div className="mx-auto max-w-3xl space-y-4">
            {/* Creating session loading */}
            {!createFailed && sessionId.length === 0 && (
              <div className="py-16">
                <LoadingState message="Đang kết nối Trợ lý Dinh dưỡng..." />
              </div>
            )}

            {/* Loading messages */}
            {sessionId.length > 0 && messagesQuery.isLoading && (
              <div className="py-16">
                <LoadingState message="Đang tải lịch sử tin nhắn..." />
              </div>
            )}

            {/* Error loading messages */}
            {sessionId.length > 0 && messagesQuery.isError && (
              <div className="py-12">
                <ErrorState
                  title="Không tải được tin nhắn."
                  onRetry={() => void messagesQuery.refetch()}
                />
              </div>
            )}

            {/* Session creation failed */}
            {createFailed && (
              <div className="py-12">
                <ErrorState title="Không khởi tạo được phiên trò chuyện." onRetry={retryCreate} />
              </div>
            )}

            {/* Empty State / Welcome Screen */}
            {sessionId.length > 0 &&
              !messagesQuery.isLoading &&
              !messagesQuery.isError &&
              messages.length === 0 &&
              !isStreaming && <ChatWelcome onSelectPrompt={(prompt) => void send(prompt)} />}

            {/* Messages */}
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                actions={(item) => (
                  <div className="flex items-center">
                    <FeedbackButtons message={item} sessionId={sessionId} />
                    <ShareAnswerButton message={item} />
                    <VerifyAnswerButton messageId={item.id} />
                  </div>
                )}
              />
            ))}

            {/* Tin nhắn người dùng đang gửi (optimistic) hiển thị ngay khi đang chờ/streaming phản hồi */}
            {pendingUserContent && isStreaming && (
              <MessageBubble message={pendingUserPlaceholder(sessionId, pendingUserContent)} />
            )}

            {/* Streaming message */}
            {(isStreaming || streamingContent.length > 0) && (
              <MessageBubble
                message={streamingPlaceholder(sessionId, streamingContent)}
                streamingText={streamingContent}
              />
            )}

            {/* Stream Error Alert */}
            {streamError && (
              <Alert variant="destructive" className="rounded-2xl">
                <TriangleAlert className="size-4" />
                <AlertTitle>Chưa gửi được câu hỏi</AlertTitle>
                <AlertDescription className="text-xs">{streamError}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Floating Scroll-to-Bottom Button */}
        {!isAtBottom && (
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={scrollToBottom}
              className="gap-1.5 rounded-full border border-border/80 bg-background/95 px-3.5 py-1 text-xs shadow-md backdrop-blur-md hover:bg-background"
              aria-label="Cuộn xuống cuối tin nhắn"
            >
              <ArrowDown className="size-3.5 animate-bounce text-emerald-600 dark:text-emerald-400" />
              <span>Cuộn xuống cuối</span>
            </Button>
          </div>
        )}

        {/* Bottom Floating Composer */}
        <footer className="shrink-0 border-t border-border/40 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-4 pt-2 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-2">
            {sessionId.length > 0 && !maintenance && !quota?.exhausted ? (
              <Composer
                isStreaming={isStreaming}
                onSend={(content) => void send(content)}
                onAbort={abort}
              />
            ) : (
              <div className="rounded-2xl border border-border/80 bg-muted/40 p-3 text-center text-xs text-muted-foreground">
                {quota?.exhausted
                  ? 'Bạn đã đạt giới hạn câu hỏi hôm nay. Lịch sử vẫn được lưu trữ bình thường.'
                  : 'Trợ lý đang tạm bảo trì hệ thống. Vui lòng quay lại sau ít phút.'}
              </div>
            )}

            <div className="px-1">
              <Disclaimer />
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function AssistantPage() {
  return (
    <Suspense fallback={<LoadingState message="Đang tải trợ lý dinh dưỡng..." />}>
      <AssistantContent />
    </Suspense>
  );
}
