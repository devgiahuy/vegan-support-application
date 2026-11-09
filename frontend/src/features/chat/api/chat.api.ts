import api from '@/lib/axios';
import { CHAT_ENDPOINTS } from '@/features/chat/constants/chat.endpoints';
import type { PaginationResult } from '@/types/api';
import type {
  ChatFeedbackResponseDto,
  ChatMessageListResponseDto,
  ChatSessionListResponseDto,
  ChatSessionResponseDto,
  DeleteChatSessionRequestDto,
  DeleteChatSessionResponseDto,
} from '../types/chat.dto';
import type {
  ChatMessage,
  ChatSession,
  DeletedChatSession,
  MessageFeedback,
} from '../types/chat.model';
import type { FeedbackValue } from '@/common/enums';
import { chatMapper } from '../mappers/chat.mapper';

/**
 * Consumer endpoint chat private qua axios.
 * Riêng gửi câu hỏi (SSE stream) nằm ở `chat-stream.ts` — KHÔNG qua interceptor.
 * API đọc data và metadata từ envelope trước khi gọi mapper.
 */
export const chatApi = {
  /** `POST /chat/sessions` — backend tự cấp cookie `chatGuest` cho khách. */
  createSession: async (title?: string): Promise<ChatSession> => {
    const res = await api.post<ChatSessionResponseDto>(
      CHAT_ENDPOINTS.SESSIONS,
      title ? { title } : {},
      { silent: true }
    );
    return chatMapper.toSingleSession(res.data?.data);
  },

  /** `GET /chat/sessions` — chỉ user đăng nhập (query layer gate `enabled`). */
  getSessions: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginationResult<ChatSession>> => {
    const res = await api.get<ChatSessionListResponseDto>(CHAT_ENDPOINTS.SESSIONS, {
      params: { page: params?.page, limit: params?.limit },
      silent: true,
    });
    return chatMapper.toSessionList(res.data?.data, res.data?.meta);
  },

  /** `DELETE /chat/sessions/:id` — ẩn phiên của tài khoản khỏi lịch sử. */
  deleteSession: async (input: DeleteChatSessionRequestDto): Promise<DeletedChatSession> => {
    const res = await api.delete<DeleteChatSessionResponseDto>(CHAT_ENDPOINTS.SESSION(input.id), {
      silent: true,
    });
    return chatMapper.toDeletedSession(res.data);
  },

  /** `GET /chat/sessions/:id/messages` — lịch sử theo ownership. */
  getMessages: async (
    sessionId: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginationResult<ChatMessage>> => {
    const res = await api.get<ChatMessageListResponseDto>(
      CHAT_ENDPOINTS.SESSION_MESSAGES(sessionId),
      {
        params: { page: params?.page, limit: params?.limit },
        silent: true,
      }
    );
    return chatMapper.toMessageList(res.data?.data, res.data?.meta);
  },

  /** `POST /chat/messages/:id/feedback` — upsert UP/DOWN. */
  sendFeedback: async (
    messageId: string,
    value: FeedbackValue,
    reason?: string
  ): Promise<MessageFeedback> => {
    const res = await api.post<ChatFeedbackResponseDto>(
      CHAT_ENDPOINTS.MESSAGE_FEEDBACK(messageId),
      chatMapper.toFeedbackDto(value, reason),
      { showErrorToast: true }
    );
    return chatMapper.toFeedbackModel(res.data?.data);
  },
};
