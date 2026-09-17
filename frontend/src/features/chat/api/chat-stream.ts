'use client';

import { API_BASE_URL } from '@/lib/env';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { extractDeltaText, parseSseEvent } from '../mappers/chat.mapper';
import type { QuotaState, StreamEvent } from '../types/chat.model';
import { chatMapper } from '../mappers/chat.mapper';

export interface ChatStreamCallbacks {
  onStart?: () => void;
  onDelta?: (text: string, fullContent: string) => void;
  onQuota?: (quota: QuotaState) => void;
  onErrorEvent?: (code: string, message: string) => void;
}

export interface ChatStreamResult {
  /** Nội dung đầy đủ khi `message_complete` (rỗng nếu abort/lỗi trước đó). */
  content: string;
  /** Mã chủ đề BE phân loại (allowlist) — dùng cho behavior event, không bao giờ raw text. */
  topicCodes: string[];
  /** true khi stream bị abort giữa chừng. */
  aborted: boolean;
  /** true khi nhận `message_complete`. */
  completed: boolean;
}

/**
 * Gửi câu hỏi qua SSE POST (`fetch` + `ReadableStream`, KHÔNG qua axios
 * để interceptor refresh/toast không chen vào stream).
 * Chỉ resolve khi `message_complete` / `error` / abort / đóng stream.
 */
export async function streamChatMessage(
  sessionId: string,
  content: string,
  idempotencyKey: string,
  signal: AbortSignal,
  callbacks: ChatStreamCallbacks = {}
): Promise<ChatStreamResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHAT.SESSION_MESSAGES(sessionId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      credentials: 'include',
      signal,
      body: JSON.stringify(chatMapper.toSendDto({ sessionId, content, idempotencyKey })),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { content: '', topicCodes: [], aborted: true, completed: false };
    }
    throw error;
  }

  if (!response.ok || !response.body) {
    // Lỗi HTTP (quota, rate-limit, validation...) ném về query layer xử lý theo error.code.
    const errorBody: unknown = await response.json().catch(() => null);
    const err = new Error('Gửi câu hỏi thất bại.') as Error & {
      responseBody?: unknown;
      status?: number;
    };
    err.responseBody = errorBody;
    err.status = response.status;
    throw err;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';
  let topicCodes: string[] = [];
  let completed = false;

  const dispatch = (block: string): boolean => {
    const event: StreamEvent = parseSseEvent(block);
    switch (event.type) {
      case 'message_start':
        callbacks.onStart?.();
        return false;
      case 'content_delta': {
        const delta = extractDeltaText(event.payload);
        if (delta) {
          fullContent += delta;
          callbacks.onDelta?.(delta, fullContent);
        }
        return false;
      }
      case 'quota':
        callbacks.onQuota?.(chatMapper.toQuotaState(event.payload));
        return false;
      case 'error': {
        const code =
          typeof event.payload['code'] === 'string'
            ? event.payload['code']
            : 'AI_PROVIDER_UNAVAILABLE';
        const message =
          typeof event.payload['message'] === 'string'
            ? event.payload['message']
            : 'Trợ lý gặp sự cố.';
        callbacks.onErrorEvent?.(code, message);
        return true;
      }
      case 'message_complete': {
        const codes = event.payload['topicCodes'];
        if (Array.isArray(codes)) {
          topicCodes = codes.filter((c): c is string => typeof c === 'string' && c.length > 0);
        }
        completed = true;
        return true;
      }
      default:
        return false;
    }
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';
      for (const block of blocks) {
        if (block.trim().length === 0) continue;
        if (dispatch(block)) {
          await reader.cancel().catch(() => undefined);
          return { content: fullContent, topicCodes, aborted: false, completed };
        }
      }
      if (signal.aborted) {
        await reader.cancel().catch(() => undefined);
        return { content: '', topicCodes: [], aborted: true, completed: false };
      }
    }
    if (buffer.trim().length > 0 && dispatch(buffer)) {
      return { content: fullContent, topicCodes, aborted: false, completed };
    }
    return { content: fullContent, topicCodes, aborted: false, completed };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { content: '', topicCodes: [], aborted: true, completed: false };
    }
    throw error;
  } finally {
    reader.releaseLock();
  }
}
