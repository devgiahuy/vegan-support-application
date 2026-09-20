export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  USERS: {
    ME: '/users/me',
    HEALTH_PROFILE: '/users/me/health-profile',
  },
  CATEGORIES: {
    TREE: '/categories',
  },
  POSTS: {
    LIST: '/posts',
    DETAIL: (idOrSlug: string) => `/posts/${idOrSlug}`,
    RELATED: (id: string) => `/posts/${id}/related`,
  },
  MEAL_PLANS: {
    GENERATE: '/meal-plans/generate',
    LIST: '/meal-plans',
    DETAIL: (id: string) => `/meal-plans/${id}`,
    SWAP: (planId: string, itemId: string) => `/meal-plans/${planId}/items/${itemId}/swap`,
    DELETE: (id: string) => `/meal-plans/${id}`,
  },
  CHAT: {
    SESSIONS: '/chat/sessions',
    SESSION_MESSAGES: (id: string) => `/chat/sessions/${id}/messages`,
    MESSAGE_FEEDBACK: (id: string) => `/chat/messages/${id}/feedback`,
  },
} as const;
