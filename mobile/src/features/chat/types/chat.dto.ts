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
  feedback?: { value?: string; reason?: string | null; updatedAt?: string } | null;
  completedAt?: string | null;
  completed_at?: string | null;
  createdAt?: string;
  created_at?: string;
}

export interface CreateChatSessionRequestDto {
  title?: string;
}

export interface SendChatMessageRequestDto {
  content: string;
  idempotencyKey: string;
}

export interface ChatFeedbackRequestDto {
  value: string;
  reason?: string;
}

export interface ChatSessionResponseDto {
  success?: boolean;
  data?: ChatSessionDto | null;
  meta?: null;
}

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

export interface ChatFeedbackResponseDto {
  success?: boolean;
  data?: { messageId?: string; value?: string; reason?: string | null; updatedAt?: string } | null;
  meta?: null;
}
