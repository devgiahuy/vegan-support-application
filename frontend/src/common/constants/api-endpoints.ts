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
} as const;
