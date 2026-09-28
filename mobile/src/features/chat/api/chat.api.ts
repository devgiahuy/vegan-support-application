import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { FeedbackValue } from '@/common/enums';
import api from '@/lib/axios';
import type { PaginationResult } from '@/types/api';
import { chatMapper } from '../mappers/chat.mapper';
import type {
  ChatFeedbackResponseDto,
  ChatMessageListResponseDto,
  ChatSessionListResponseDto,
  ChatSessionResponseDto,
} from '../types/chat.dto';
import type { ChatMessage, ChatSession, MessageFeedback } from '../types/chat.model';

export const chatApi = {
  createSession: async (title?: string): Promise<ChatSession> => {
    const res = await api.post<ChatSessionResponseDto>(API_ENDPOINTS.CHAT.SESSIONS, title ? { title } : {}, {
      silent: true,
    });
    return chatMapper.toSingleSession(res.data);
  },

  getSessions: async (params?: { page?: number; limit?: number }): Promise<PaginationResult<ChatSession>> => {
    const res = await api.get<ChatSessionListResponseDto>(API_ENDPOINTS.CHAT.SESSIONS, {
      params: { page: params?.page, limit: params?.limit },
      silent: true,
    });
    return chatMapper.toSessionList(res.data);
  },

  getMessages: async (
    sessionId: string,
    params?: { page?: number; limit?: number }
  ): Promise<PaginationResult<ChatMessage>> => {
    const res = await api.get<ChatMessageListResponseDto>(API_ENDPOINTS.CHAT.SESSION_MESSAGES(sessionId), {
      params: { page: params?.page, limit: params?.limit },
      silent: true,
    });
    return chatMapper.toMessageList(res.data);
  },

  sendFeedback: async (messageId: string, value: FeedbackValue, reason?: string): Promise<MessageFeedback> => {
    const res = await api.post<ChatFeedbackResponseDto>(
      API_ENDPOINTS.CHAT.MESSAGE_FEEDBACK(messageId),
      chatMapper.toFeedbackDto(value, reason)
    );
    return chatMapper.toFeedbackModel(res.data);
  },
};
