import * as React from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import type { FeedbackValue } from '@/common/enums';
import { useAuthStore } from '@/store/useAuthStore';
import { getNextPageNumber } from '@/lib/pagination';
import { chatApi } from '../api/chat.api';
import { streamChatMessage } from '../api/chat-stream';
import type { QuotaState } from '../types/chat.model';
import { createChatIdempotencyKey } from '../utils/idempotency';

export const CHAT_QUERY_KEYS = {
  all: ['chat'] as const,
  sessions: () => [...CHAT_QUERY_KEYS.all, 'sessions'] as const,
  messages: (sessionId: string) => [...CHAT_QUERY_KEYS.all, 'messages', sessionId] as const,
};

function getStreamErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const body = (error as { responseBody?: unknown }).responseBody;
  if (typeof body !== 'object' || body === null) return undefined;
  const nested = (body as { error?: { code?: unknown } }).error?.code;
  return typeof nested === 'string' && nested.length > 0 ? nested : undefined;
}

/** Danh sách phiên chat phân trang kiểu "Tải thêm"; phiên gần nhất nằm ở trang đầu. */
export function useChatSessionsQuery() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useInfiniteQuery({
    queryKey: CHAT_QUERY_KEYS.sessions(),
    queryFn: ({ pageParam }) => chatApi.getSessions({ page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: getNextPageNumber,
    staleTime: 30 * 1000,
    enabled: isAuthenticated,
  });
}

/**
 * Tin nhắn của một phiên, sắp theo thời gian tăng dần nên tin mới nhất nằm ở trang cuối. Vì vậy tự nạp
 * hết các trang (100 tin/trang) để cuối hội thoại luôn đầy đủ, thay vì cắt ở 100 tin đầu.
 */
export function useChatMessagesQuery(sessionId: string, enabled = true) {
  const query = useInfiniteQuery({
    queryKey: CHAT_QUERY_KEYS.messages(sessionId),
    queryFn: ({ pageParam }) => chatApi.getMessages(sessionId, { page: pageParam, limit: 100 }),
    initialPageParam: 1,
    getNextPageParam: getNextPageNumber,
    select: (data) => ({ items: data.pages.flatMap((page) => page.items) }),
    staleTime: 30 * 1000,
    enabled: enabled && sessionId.length > 0,
  });

  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = query;
  React.useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  return query;
}

export function useCreateChatSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) => chatApi.createSession(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.sessions() });
    },
  });
}

export function useChatFeedbackMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: {
      messageId: string;
      sessionId: string;
      value: FeedbackValue;
      reason?: string;
    }) => chatApi.sendFeedback(vars.messageId, vars.value, vars.reason),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.messages(vars.sessionId) });
    },
  });
}

export interface SendChatState {
  isStreaming: boolean;
  streamingContent: string;
  streamError: string | null;
  quota: QuotaState | null;
  maintenance: boolean;
  pendingUserContent: string | null;
}

export function useSendChatMessage(sessionId: string) {
  const queryClient = useQueryClient();
  const controllerRef = React.useRef<AbortController | null>(null);
  const [state, setState] = React.useState<SendChatState>({
    isStreaming: false,
    streamingContent: '',
    streamError: null,
    quota: null,
    maintenance: false,
    pendingUserContent: null,
  });

  React.useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const abort = React.useCallback(() => {
    controllerRef.current?.abort();
    setState((prev) => ({
      ...prev,
      isStreaming: false,
      streamingContent: '',
      pendingUserContent: null,
    }));
  }, []);

  const send = React.useCallback(
    async (content: string, targetSessionId = sessionId): Promise<void> => {
      const trimmed = content.trim();
      if (state.isStreaming || trimmed.length === 0 || targetSessionId.length === 0) return;

      const controller = new AbortController();
      controllerRef.current = controller;
      setState((prev) => ({
        ...prev,
        isStreaming: true,
        streamingContent: '',
        pendingUserContent: trimmed,
        streamError: null,
      }));

      try {
        const result = await streamChatMessage(targetSessionId, trimmed, createChatIdempotencyKey(), controller.signal, {
          onDelta: (_, fullContent) => setState((prev) => ({ ...prev, streamingContent: fullContent })),
          onQuota: (quota) => setState((prev) => ({ ...prev, quota })),
          onErrorEvent: (code, message) =>
            setState((prev) => ({
              ...prev,
              maintenance: code === 'AI_FEATURE_DISABLED' ? true : prev.maintenance,
              streamError:
                code === 'AI_QUOTA_EXCEEDED'
                  ? 'Bạn đã hết lượt hôm nay.'
                  : code === 'AI_FEATURE_DISABLED'
                    ? 'Trợ lý đang bảo trì. Vui lòng quay lại sau.'
                    : message,
            })),
        });

        if (result.aborted) {
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            streamingContent: '',
            pendingUserContent: null,
          }));
          return;
        }

        if (result.completed) {
          await queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.messages(targetSessionId) });
        }

        setState((prev) => ({
          ...prev,
          isStreaming: false,
          streamingContent: '',
          pendingUserContent: null,
        }));
      } catch (error) {
        const code = getStreamErrorCode(error);
        const streamError =
          code === 'AI_FEATURE_DISABLED'
            ? 'Trợ lý đang bảo trì. Lịch sử trò chuyện vẫn xem được.'
            : code === 'AI_QUOTA_EXCEEDED'
              ? 'Bạn đã hết lượt hôm nay. Hạn mức cấp lại lúc nửa đêm.'
              : code === 'AI_RATE_LIMITED'
                ? 'Bạn thao tác quá nhanh. Vui lòng chờ giây lát rồi thử lại.'
                : code === 'CHAT_REQUEST_IN_PROGRESS'
                  ? 'Câu hỏi trước vẫn đang xử lý. Vui lòng chờ hoàn tất.'
                  : 'Không thể gửi câu hỏi. Vui lòng thử lại.';

        setState((prev) => ({
          ...prev,
          isStreaming: false,
          pendingUserContent: null,
          maintenance: code === 'AI_FEATURE_DISABLED' ? true : prev.maintenance,
          streamError,
        }));
      }
    },
    [queryClient, sessionId, state.isStreaming]
  );

  return { ...state, send, abort };
}
