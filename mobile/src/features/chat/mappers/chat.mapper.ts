import { ChatMessageStatus, ChatOwnerType, ChatRole, FeedbackValue } from '@/common/enums';
import { BaseMapper, pickField, safeArray, safeDate, safeEnum, safeNumber, safeString } from '@/lib/mapper';
import type { PaginationResult } from '@/types/api';
import type {
  ChatFeedbackRequestDto,
  ChatFeedbackResponseDto,
  ChatMessageDto,
  ChatMessageListResponseDto,
  ChatSessionDto,
  ChatSessionListResponseDto,
  ChatSessionResponseDto,
  SendChatMessageRequestDto,
} from '../types/chat.dto';
import type {
  ChatMessage,
  ChatSession,
  MessageFeedback,
  QuotaState,
  SendChatMessageInput,
  StreamEvent,
} from '../types/chat.model';

const OWNER_LABELS: Record<ChatOwnerType, string> = {
  [ChatOwnerType.AUTHENTICATED]: 'Cá nhân',
  [ChatOwnerType.GUEST]: 'Khách',
};

const ROLE_LABELS: Record<ChatRole, string> = {
  [ChatRole.USER]: 'Bạn',
  [ChatRole.ASSISTANT]: 'Trợ lý',
};

const STREAM_EVENT_TYPES = ['message_start', 'content_delta', 'message_complete', 'quota', 'error'] as const;

function formatResetLabel(iso: string): string {
  if (iso.length === 0) return 'nửa đêm';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'nửa đêm';
  const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const day = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  return `${time} ${day}`;
}

export function parseSseEvent(rawBlock: string): StreamEvent {
  let type: StreamEvent['type'] = 'unknown';
  const dataLines: string[] = [];
  for (const line of rawBlock.split('\n')) {
    if (line.startsWith('event:')) {
      const name = line.slice('event:'.length).trim();
      type = (STREAM_EVENT_TYPES as readonly string[]).includes(name) ? (name as StreamEvent['type']) : 'unknown';
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart());
    }
  }

  let payload: Record<string, unknown> = {};
  if (dataLines.length > 0) {
    try {
      const parsed: unknown = JSON.parse(dataLines.join('\n'));
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        payload = parsed as Record<string, unknown>;
      }
    } catch {
      payload = {};
    }
  }

  return { type, payload };
}

export function extractDeltaText(payload: Record<string, unknown>): string {
  return safeString(pickField<string>(payload, ['content', 'delta', 'text'], ''));
}

export class ChatMapper extends BaseMapper<ChatSessionDto, ChatSession> {
  toModel(dto: ChatSessionDto | null | undefined): ChatSession {
    const ownerType = safeEnum(
      pickField(dto, ['ownerType', 'owner_type'], 'AUTHENTICATED'),
      ChatOwnerType,
      ChatOwnerType.AUTHENTICATED
    );
    const expiresAt = safeDate(pickField(dto, ['expiresAt', 'expires_at'], null));

    return {
      id: safeString(pickField(dto, ['id'], '')),
      title: safeString(pickField(dto, ['title'], '')) || 'Đoạn chat mới',
      ownerType,
      ownerTypeLabel: OWNER_LABELS[ownerType],
      expiresAt,
      isExpired: expiresAt !== null && expiresAt.getTime() < Date.now(),
      createdAt: safeDate(pickField(dto, ['createdAt', 'created_at'], null)),
      updatedAt: safeDate(pickField(dto, ['updatedAt', 'updated_at'], null)),
    };
  }

  toSingleSession(dto: ChatSessionResponseDto | null | undefined): ChatSession {
    return this.toModel(pickField(dto, ['data'], null) as ChatSessionDto | null);
  }

  toSessionList(dto: ChatSessionListResponseDto | null | undefined): PaginationResult<ChatSession> {
    const rawItems = pickField(dto, ['data'], null) as (ChatSessionDto | null)[] | null;
    const items = this.toModelList(safeArray<ChatSessionDto | null, ChatSessionDto | null>(rawItems, (item) => item));
    const meta = pickField(dto, ['meta'], null) as ChatSessionListResponseDto['meta'];
    const page = safeNumber(pickField(meta, ['page'], 1));
    const limit = safeNumber(pickField(meta, ['limit'], 20));
    const totalItems = safeNumber(pickField(meta, ['total'], items.length));
    const totalPages = safeNumber(pickField(meta, ['totalPages', 'total_pages'], 1));

    return {
      items,
      metadata: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  toMessage(dto: ChatMessageDto | null | undefined): ChatMessage {
    const role = safeEnum(pickField(dto, ['role'], 'USER'), ChatRole, ChatRole.USER);
    const feedbackRaw = pickField(dto, ['feedback'], null) as { value?: string } | null;

    return {
      id: safeString(pickField(dto, ['id'], '')),
      sessionId: safeString(pickField(dto, ['sessionId', 'session_id'], '')),
      role,
      roleLabel: ROLE_LABELS[role],
      status: safeEnum(pickField(dto, ['status'], 'COMPLETED'), ChatMessageStatus, ChatMessageStatus.COMPLETED),
      content: safeString(pickField(dto, ['content'], ''), ''),
      isFallback: pickField<boolean>(dto, ['fallback'], false),
      disclaimer: safeString(pickField(dto, ['disclaimer'], ''), '') || null,
      feedback:
        feedbackRaw && typeof feedbackRaw === 'object'
          ? safeEnum(feedbackRaw.value, FeedbackValue, null as unknown as FeedbackValue)
          : null,
      completedAt: safeDate(pickField(dto, ['completedAt', 'completed_at'], null)),
      createdAt: safeDate(pickField(dto, ['createdAt', 'created_at'], null)),
    };
  }

  toMessageList(dto: ChatMessageListResponseDto | null | undefined): PaginationResult<ChatMessage> {
    const rawItems = pickField(dto, ['data'], null) as (ChatMessageDto | null)[] | null;
    const items = safeArray<ChatMessageDto | null, ChatMessage>(rawItems, (item) => this.toMessage(item));
    const meta = pickField(dto, ['meta'], null) as ChatMessageListResponseDto['meta'];
    const page = safeNumber(pickField(meta, ['page'], 1));
    const limit = safeNumber(pickField(meta, ['limit'], 100));
    const totalItems = safeNumber(pickField(meta, ['total'], items.length));
    const totalPages = safeNumber(pickField(meta, ['totalPages', 'total_pages'], 1));

    return {
      items,
      metadata: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  toFeedbackModel(dto: ChatFeedbackResponseDto | null | undefined): MessageFeedback {
    const data = pickField(dto, ['data'], null) as ChatFeedbackResponseDto['data'];
    return {
      messageId: safeString(pickField(data, ['messageId', 'message_id'], '')),
      value: safeEnum(pickField(data, ['value'], null), FeedbackValue, FeedbackValue.UP),
      reason: safeString(pickField(data, ['reason'], ''), '') || null,
      updatedAt: safeDate(pickField(data, ['updatedAt', 'updated_at'], null)),
    };
  }

  toQuotaState(payload: Record<string, unknown>, fallbackLimit = 5): QuotaState {
    const limit = safeNumber(pickField(payload, ['limit'], fallbackLimit));
    const used = safeNumber(
      pickField(payload, ['used'], Math.max(limit - safeNumber(pickField(payload, ['remaining'], limit)), 0))
    );
    const remaining = Math.max(limit - used, 0);
    return {
      used,
      limit,
      remaining,
      resetAtLabel: formatResetLabel(safeString(pickField(payload, ['resetAt', 'reset_at'], ''))),
      exhausted: remaining === 0,
    };
  }

  toSendDto(input: SendChatMessageInput): SendChatMessageRequestDto {
    return { content: input.content, idempotencyKey: input.idempotencyKey };
  }

  toFeedbackDto(value: FeedbackValue, reason?: string): ChatFeedbackRequestDto {
    return { value, ...(reason ? { reason } : {}) };
  }
}

export const chatMapper = new ChatMapper();
