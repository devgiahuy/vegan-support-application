/**
 * DTO chat AI private: sessions, messages (SSE), feedback.
 * Theo `docs/api/ai-chat.md` (sync OpenAPI 2026-09-16).
 * Envelope `{success, data, meta}` dùng trực tiếp — cấm bọc `APIResponse<>` 2 tầng.
 */

/** Phiên chat thô. */
export interface ChatSessionDto {
  id?: string;
  title?: string;
  ownerType?: string;
  owner_type?: string;
  expiresAt?: string | null;
  expires_at?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

/** Tin nhắn chat thô (shape `ChatMessageListResponse.data[]`). */
export interface ChatMessageDto {
  id?: string;
  sessionId?: string;
  session_id?: string;
  role?: string;
  status?: string;
  content?: string | null;
  provider?: string | null;
  modelId?: string | null;
  model_id?: string | null;
  fallback?: boolean;
  topicCodes?: (string | null)[] | null;
  topic_codes?: (string | null)[] | null;
  disclaimer?: string | null;
  feedback?: { value?: string } | null;
  completedAt?: string | null;
  completed_at?: string | null;
  createdAt?: string;
  created_at?: string;
}

/** `POST /chat/sessions` — `title` optional, KHÔNG gửi `guestId`. */
export interface CreateChatSessionRequestDto {
  title?: string;
}

/** `POST /chat/sessions/:id/messages` — `content` + `idempotencyKey` bắt buộc. */
export interface SendChatMessageRequestDto {
  content: string;
  idempotencyKey: string;
}

/** `POST /chat/messages/:id/feedback` — `value` bắt buộc, `reason` optional. */
export interface ChatFeedbackRequestDto {
  value: string;
  reason?: string;
}

/** `POST /chat/sessions` → 1 phiên. */
export interface ChatSessionResponseDto {
  success?: boolean;
  data?: ChatSessionDto | null;
  meta?: null;
}

/** `GET /chat/sessions` → mảng phiên + meta phân trang. */
export interface ChatSessionListResponseDto {
  success?: boolean;
  data?: (ChatSessionDto | null)[] | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    total_pages?: number;
  } | null;
}

/** `GET /chat/sessions/:id/messages` → mảng tin nhắn + meta phân trang. */
export interface ChatMessageListResponseDto {
  success?: boolean;
  data?: (ChatMessageDto | null)[] | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    total_pages?: number;
  } | null;
}

/** `POST /chat/messages/:id/feedback` → upsert feedback. */
export interface ChatFeedbackResponseDto {
  success?: boolean;
  data?: { messageId?: string; value?: string; reason?: string | null; updatedAt?: string } | null;
  meta?: null;
}

/** Payload `data:` của 1 SSE event (đã parse JSON). */
export interface ChatStreamEventPayload {
  content?: string;
  delta?: string;
  text?: string;
  messageId?: string;
  message_id?: string;
  used?: number | string;
  limit?: number | string;
  remaining?: number | string;
  resetAt?: string | null;
  code?: string;
  message?: string;
}
