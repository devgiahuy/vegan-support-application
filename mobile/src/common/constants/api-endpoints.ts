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
    DIET_PREFERENCES: '/users/me/diet-preferences',
  },
  DIET_RULES: {
    PREVIEW: '/diet-rules/preview',
  },
  CATEGORIES: {
    TREE: '/categories',
  },
  POSTS: {
    LIST: '/posts',
    DETAIL: (idOrSlug: string) => `/posts/${idOrSlug}`,
    RELATED: (id: string) => `/posts/${id}/related`,
    SUBMIT: (id: string) => `/posts/${id}/submit`,
  },
  COMMUNITY: {
    COMMENTS: (postId: string) => `/posts/${postId}/comments`,
    COMMENT: (id: string) => `/comments/${id}`,
    SUMMARY: (postId: string) => `/posts/${postId}/community-summary`,
    VOTE: (postId: string) => `/posts/${postId}/vote`,
    BOOKMARK: (postId: string) => `/posts/${postId}/bookmark`,
    RATING: (postId: string) => `/posts/${postId}/rating`,
    MY_BOOKMARKS: '/users/me/bookmarks',
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
  CONTRIBUTOR: {
    APPLICATIONS: '/contributor-applications',
    APPLICATIONS_ME: '/contributor-applications/me',
  },
} as const;
