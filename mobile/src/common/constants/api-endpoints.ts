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
    DIET_SCHEDULE: '/users/me/diet-schedule',
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
    ANALYZE: (id: string) => `/meal-plans/${id}/analyze`,
    ANALYSIS: (id: string) => `/meal-plans/${id}/analysis`,
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
  INGREDIENTS: {
    LIST: '/ingredients',
  },
  FOOD_DATA: {
    NUTRIENTS: (ingredientId: string) => `/food-data/ingredients/${ingredientId}/nutrients`,
    REFERENCE_INTAKES: '/food-data/reference-intakes',
    GUIDELINES: '/food-data/ingredient-guidelines',
    COOKING_METHODS: '/food-data/cooking-methods',
    INTERACTIONS: '/food-data/interaction-rules',
  },
} as const;
