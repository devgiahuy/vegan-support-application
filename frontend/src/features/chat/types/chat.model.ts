import type { ChatMessageStatus, ChatOwnerType, ChatRole, FeedbackValue } from '@/common/enums';

/** Phiên trò chuyện dùng cho UI. */
export interface ChatSession {
  id: string;
  title: string;
  ownerType: ChatOwnerType;
  ownerTypeLabel: string;
  expiresAt: Date | null;
  isExpired: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  /** Xem trước tin nhắn gần nhất (client ghép, không từ BE). */
  previewText: string;
}

/** Tin nhắn trong phiên. `STREAMING`/`FAILED` chỉ tồn tại ở local state. */
export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatRole;
  roleLabel: string;
  status: ChatMessageStatus;
  content: string;
  isFallback: boolean;
  disclaimer: string | null;
  feedback: FeedbackValue | null;
  completedAt: Date | null;
  createdAt: Date | null;
}

/** Đánh giá câu trả lời. */
export interface MessageFeedback {
  messageId: string;
  value: FeedbackValue | null;
  reason: string | null;
  updatedAt: Date | null;
}

/** Trạng thái hạn mức lượt dùng trong ngày. */
export interface QuotaState {
  used: number;
  limit: number;
  remaining: number;
  resetAtLabel: string;
  exhausted: boolean;
}

/** Sự kiện SSE đã parse (nội bộ, cho `chat-stream.ts`). */
export interface StreamEvent {
  type: 'message_start' | 'content_delta' | 'message_complete' | 'quota' | 'error' | 'unknown';
  payload: Record<string, unknown>;
}

/** Input gửi câu hỏi (client sinh `idempotencyKey` trước khi gửi). */
export interface SendChatMessageInput {
  sessionId: string;
  content: string;
  idempotencyKey: string;
}
