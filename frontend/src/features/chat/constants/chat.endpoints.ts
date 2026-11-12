export const CHAT_ENDPOINTS = {
  SESSIONS: '/chat/sessions',
  SESSION: (id: string) => `/chat/sessions/${id}`,
  SESSION_MESSAGES: (id: string) => `/chat/sessions/${id}/messages`,
  MESSAGE_FEEDBACK: (id: string) => `/chat/messages/${id}/feedback`,
} as const;
