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
  INGREDIENTS: {
    LIST: '/ingredients',
    RESOLVE: '/ingredients/resolve',
  },
  ADMIN_CATALOG: {
    CATEGORIES: {
      LIST: '/admin/categories',
      CREATE: '/admin/categories',
      UPDATE: (id: string) => `/admin/categories/${id}`,
      ARCHIVE: (id: string) => `/admin/categories/${id}`,
    },
    INGREDIENTS: {
      LIST: '/admin/ingredients',
      CREATE: '/admin/ingredients',
      UPDATE: (id: string) => `/admin/ingredients/${id}`,
      ARCHIVE: (id: string) => `/admin/ingredients/${id}`,
      ALIASES: (id: string) => `/admin/ingredients/${id}/aliases`,
      ALIAS: (id: string, aliasId: string) => `/admin/ingredients/${id}/aliases/${aliasId}`,
    },
  },
  POSTS: {
    LIST: '/posts',
    DETAIL: (idOrSlug: string) => `/posts/${idOrSlug}`,
    CREATE: '/posts',
    UPDATE: (id: string) => `/posts/${id}`,
    DELETE: (id: string) => `/posts/${id}`,
    RELATED: (id: string) => `/posts/${id}/related`,
  },
  UPLOADS: {
    SIGNATURE: '/uploads/signature',
  },
  REVIEW_QUEUE: {
    LIST: '/review-queue/posts',
    APPROVE: (id: string) => `/review-queue/posts/${id}/approve`,
    REJECT: (id: string) => `/review-queue/posts/${id}/reject`,
  },
  MEAL_PLANS: {
    GENERATE: '/meal-plans/generate',
    LIST: '/meal-plans',
    DETAIL: (id: string) => `/meal-plans/${id}`,
    SWAP: (id: string, itemId: string) => `/meal-plans/${id}/items/${itemId}/swap`,
    DELETE: (id: string) => `/meal-plans/${id}`,
  },
  CHAT: {
    SESSIONS: '/chat/sessions',
    SESSION_MESSAGES: (id: string) => `/chat/sessions/${id}/messages`,
    MESSAGE_FEEDBACK: (id: string) => `/chat/messages/${id}/feedback`,
  },
  RECOMMENDATIONS: {
    EVENTS: '/behavior-events',
    CONSENT: '/users/me/personalization',
    HOME: '/recommendations/home',
  },
  // TODO(BE-READY): Community còn PLANNED — nhánh dưới CHƯA được import ở đâu.
  COMMUNITY: {
    COMMENTS: (postId: string) => `/posts/${postId}/comments`,
    COMMENT: (id: string) => `/comments/${id}`,
    SUMMARY: (postId: string) => `/posts/${postId}/community-summary`,
    VOTE: (postId: string) => `/posts/${postId}/vote`,
    RATING: (postId: string) => `/posts/${postId}/rating`,
    BOOKMARK: (postId: string) => `/posts/${postId}/bookmark`,
    MY_BOOKMARKS: '/users/me/bookmarks',
  },
  // TODO(BE-READY): Moderation-admin còn PLANNED — nhánh dưới CHƯA được import ở đâu.
  MODERATION_ADMIN: {
    REPORTS: '/admin/reports',
    REPORT_RESOLVE: (id: string) => `/admin/reports/${id}/resolve`,
    USERS: '/admin/users',
    USER_STATUS: (id: string) => `/admin/users/${id}/status`,
    COMMENTS: '/admin/comments',
    COMMENT_STATUS: (id: string) => `/admin/comments/${id}/status`,
  },
  // TODO(BE-READY): Contributors còn PLANNED — 2 nhánh dưới CHƯA được import ở đâu.
  CONTRIBUTOR: {
    APPLY: '/contributor-applications',
    MY_APPLICATIONS: '/contributor-applications/me',
  },
  ADMIN_CONTRIBUTOR: {
    LIST: '/admin/contributor-applications',
    REVIEW: (id: string) => `/admin/contributor-applications/${id}/review`,
  },
  // TODO(BE-READY): Trust-safety leftovers còn PLANNED — nhánh dưới CHƯA được import ở đâu.
  SAFETY: {
    REPORTS: '/reports',
    BEHAVIOR_HISTORY: '/users/me/behavior-history',
  },
  // TODO(BE-READY): Chat sharing/verification còn PLANNED — nhánh dưới CHƯA được import ở đâu.
  CHAT_SHARING: {
    SHARE: (id: string) => `/chat/messages/${id}/share`,
    PUBLIC_LIST: '/chat/public',
    VERIFY: (id: string) => `/chat/messages/${id}/verification`,
  },
  // TODO(BE-READY): Notifications còn PLANNED — nhánh dưới CHƯA được import ở đâu.
  NOTIFICATIONS: {
    LIST: '/notifications',
    READ: (id: string) => `/notifications/${id}/read`,
    READ_ALL: '/notifications/read-all',
  },
  // TODO(BE-READY): Restaurants/location còn PLANNED — 3 nhánh dưới CHƯA được import ở đâu.
  RESTAURANTS: {
    NEARBY: '/restaurants/nearby',
    SEARCH: '/restaurants/search',
    DETAIL: (id: string) => `/restaurants/${id}`,
    SUBMIT: '/restaurants',
  },
  LOCATION: {
    GEOCODE: '/location/geocode',
  },
  ADMIN_RESTAURANTS: {
    LIST: '/admin/restaurants',
    REVIEW: (id: string) => `/admin/restaurants/${id}/review`,
  },
  // TODO(BE-READY): AI governance còn PLANNED — nhánh dưới CHƯA được import ở đâu.
  AI_GOVERNANCE: {
    METRICS: '/admin/ai/metrics',
    REQUESTS: '/admin/ai/requests',
    FLAGS: '/admin/ai/flags',
    FEATURES: '/admin/ai/features',
    FEATURE_TOGGLE: (feature: string) => `/admin/ai/features/${feature}`,
  },
} as const;
