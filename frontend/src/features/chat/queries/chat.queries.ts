'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/useAuthStore';
import { chatApi } from '../api/chat.api';
import { streamChatMessage } from '../api/chat-stream';
import type { FeedbackValue } from '@/common/enums';
import type { QuotaState } from '../types/chat.model';
import { newIdempotencyKey } from '@/features/meal-plan/utils/idempotency';

export const CHAT_QUERY_KEYS = {
  all: ['chat'] as const,
  sessions: () => [...CHAT_QUERY_KEYS.all, 'sessions'] as const,
  messages: (sessionId: string) => [...CHAT_QUERY_KEYS.all, 'messages', sessionId] as const,
};

/** Đọc mã lỗi nghiệp vụ từ body lỗi của stream (`fetch`, không phải axios). */
function getStreamErrorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const body = (error as { responseBody?: unknown }).responseBody;
  if (typeof body !== 'object' || body === null) return undefined;
  const nested = (body as { error?: { code?: unknown } }).error?.code;
  return typeof nested === 'string' && nested.length > 0 ? nested : undefined;
}

/** Danh sách phiên — chỉ user đăng nhập (guest không bắn request vô ích). */
export function useChatSessionsQuery() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.sessions(),
    queryFn: () => chatApi.getSessions({ page: 1, limit: 20 }),
    staleTime: 30 * 1000,
    enabled: isAuthenticated,
  });
}

/** Lịch sử tin nhắn 1 phiên theo ownership. */
export function useChatMessagesQuery(sessionId: string, enabled = true) {
  return useQuery({
    queryKey: CHAT_QUERY_KEYS.messages(sessionId),
    queryFn: () => chatApi.getMessages(sessionId, { page: 1, limit: 100 }),
    staleTime: 30 * 1000,
    enabled: enabled && sessionId.length > 0,
  });
}

/** Tạo phiên mới (member + guest). */
export function useCreateChatSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) => chatApi.createSession(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_QUERY_KEYS.sessions() });
    },
  });
}

/** Đánh giá UP/DOWN cho câu trả lời (upsert, đổi được). */
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
      toast.success('Đã ghi nhận đánh giá của bạn.');
    },
    onError: () => {
      toast.error('Không thể gửi đánh giá', { description: 'Vui lòng thử lại.' });
    },
  });
}

export interface SendChatState {
  isStreaming: boolean;
  streamingContent: string;
  streamError: string | null;
  quota: QuotaState | null;
  /** true khi backend báo tính năng AI đang tắt (lịch sử vẫn xem được). */
  maintenance: boolean;
  /** Nội dung tin nhắn người dùng vừa gửi, hiển thị ngay lập tức trong khi chờ/streaming câu trả lời. */
  pendingUserContent: string | null;
}

/**
 * Gửi câu hỏi qua SSE. Buffer stream giữ ở `useState` cục bộ (ephemeral);
 * chỉ commit vào cache khi `message_complete`. Abort khi unmount/chuyển trang.
 */
export function useSendChatMessage(
  sessionId: string,
  opts: { onAssistantComplete?: (topicCodes: string[]) => void } = {}
) {
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
    async (content: string): Promise<void> => {
      const trimmed = content.trim();
      if (state.isStreaming || trimmed.length === 0) return;
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
        const result = await streamChatMessage(
          sessionId,
          trimmed,
          newIdempotencyKey(),
          controller.signal,
          {
            onDelta: (_, fullContent) =>
              setState((prev) => ({ ...prev, streamingContent: fullContent })),
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
          }
        );
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
          if (result.topicCodes.length > 0) opts.onAssistantComplete?.(result.topicCodes);
          await queryClient.invalidateQueries({
            queryKey: CHAT_QUERY_KEYS.messages(sessionId),
          });
        }
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          streamingContent: '',
          pendingUserContent: null,
        }));
      } catch (error) {
        const code = getStreamErrorCode(error);
        if (code === 'AI_FEATURE_DISABLED') {
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            pendingUserContent: null,
            maintenance: true,
            streamError: 'Trợ lý đang bảo trì. Lịch sử trò chuyện vẫn xem được.',
          }));
          return;
        }
        if (code === 'AI_QUOTA_EXCEEDED') {
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            pendingUserContent: null,
            streamError: 'Bạn đã hết lượt hôm nay. Hạn mức cấp lại lúc nửa đêm.',
          }));
          return;
        }
        if (code === 'AI_RATE_LIMITED') {
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            pendingUserContent: null,
            streamError: 'Bạn thao tác quá nhanh. Vui lòng chờ giây lát rồi thử lại.',
          }));
          return;
        }
        if (code === 'CHAT_REQUEST_IN_PROGRESS') {
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            pendingUserContent: null,
            streamError: 'Câu hỏi trước vẫn đang xử lý. Vui lòng chờ hoàn tất.',
          }));
          return;
        }
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          pendingUserContent: null,
          streamError: 'Không thể gửi câu hỏi. Vui lòng thử lại.',
        }));
      }
    },
    [queryClient, sessionId, state.isStreaming, opts]
  );

  return { ...state, send, abort };
}
