import type { ChatMessageStatus, ChatOwnerType, ChatRole, FeedbackValue } from '@/common/enums';

export interface ChatSession {
  id: string;
  title: string;
  ownerType: ChatOwnerType;
  ownerTypeLabel: string;
  expiresAt: Date | null;
  isExpired: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

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

export interface MessageFeedback {
  messageId: string;
  value: FeedbackValue | null;
  reason: string | null;
  updatedAt: Date | null;
}

export interface QuotaState {
  used: number;
  limit: number;
  remaining: number;
  resetAtLabel: string;
  exhausted: boolean;
}

export interface StreamEvent {
  type: 'message_start' | 'content_delta' | 'message_complete' | 'quota' | 'error' | 'unknown';
  payload: Record<string, unknown>;
}

export interface SendChatMessageInput {
  sessionId: string;
  content: string;
  idempotencyKey: string;
}
