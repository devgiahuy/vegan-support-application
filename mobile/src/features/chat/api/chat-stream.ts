import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import { getAccessToken } from '@/lib/auth-token';
import { API_BASE_URL } from '@/lib/env';
import { chatMapper, extractDeltaText, parseSseEvent } from '../mappers/chat.mapper';
import type { QuotaState, StreamEvent } from '../types/chat.model';

export interface ChatStreamCallbacks {
  onStart?: () => void;
  onDelta?: (text: string, fullContent: string) => void;
  onQuota?: (quota: QuotaState) => void;
  onErrorEvent?: (code: string, message: string) => void;
}

export interface ChatStreamResult {
  content: string;
  topicCodes: string[];
  aborted: boolean;
  completed: boolean;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function getReadableStreamReader(body: ReadableStream<Uint8Array> | null): ReadableStreamDefaultReader<Uint8Array> | null {
  if (!body || typeof body.getReader !== 'function') return null;
  return body.getReader();
}

export async function streamChatMessage(
  sessionId: string,
  content: string,
  idempotencyKey: string,
  signal: AbortSignal,
  callbacks: ChatStreamCallbacks = {}
): Promise<ChatStreamResult> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CHAT.SESSION_MESSAGES(sessionId)}`, {
      method: 'POST',
      headers,
      credentials: 'include',
      signal,
      body: JSON.stringify(chatMapper.toSendDto({ sessionId, content, idempotencyKey })),
    });
  } catch (error) {
    if (isAbortError(error)) return { content: '', topicCodes: [], aborted: true, completed: false };
    throw error;
  }

  const reader = getReadableStreamReader(response.body);
  if (!response.ok || !reader) {
    const errorBody: unknown = await response.json().catch(() => null);
    const err = new Error('Gửi câu hỏi thất bại.') as Error & {
      responseBody?: unknown;
      status?: number;
    };
    err.responseBody = errorBody;
    err.status = response.status;
    throw err;
  }

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
        const code = typeof event.payload.code === 'string' ? event.payload.code : 'AI_PROVIDER_UNAVAILABLE';
        const message = typeof event.payload.message === 'string' ? event.payload.message : 'Trợ lý gặp sự cố.';
        callbacks.onErrorEvent?.(code, message);
        return true;
      }
      case 'message_complete': {
        const codes = event.payload.topicCodes;
        if (Array.isArray(codes)) {
          topicCodes = codes.filter((code): code is string => typeof code === 'string' && code.length > 0);
        }
        const quota = event.payload.quota;
        if (quota && typeof quota === 'object' && !Array.isArray(quota)) {
          callbacks.onQuota?.(chatMapper.toQuotaState(quota as Record<string, unknown>));
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
    if (isAbortError(error)) return { content: '', topicCodes: [], aborted: true, completed: false };
    throw error;
  } finally {
    reader.releaseLock();
  }
}
