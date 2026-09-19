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
} as const;
