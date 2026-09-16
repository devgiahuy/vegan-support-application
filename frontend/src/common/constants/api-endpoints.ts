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
      DETAIL: (id: string) => `/admin/categories/${id}`,
      UPDATE: (id: string) => `/admin/categories/${id}`,
      ARCHIVE: (id: string) => `/admin/categories/${id}`,
    },
    INGREDIENTS: {
      LIST: '/admin/ingredients',
      CREATE: '/admin/ingredients',
      DETAIL: (id: string) => `/admin/ingredients/${id}`,
      UPDATE: (id: string) => `/admin/ingredients/${id}`,
      ARCHIVE: (id: string) => `/admin/ingredients/${id}`,
      ALIASES: (id: string) => `/admin/ingredients/${id}/aliases`,
      ALIAS: (id: string, aliasId: string) => `/admin/ingredients/${id}/aliases/${aliasId}`,
    },
  },
  PRODUCTS: {
    LIST: '/products',
    DETAIL: (id: string | number) => `/products/${id}`,
    CREATE: '/products',
    UPDATE: (id: string | number) => `/products/${id}`,
    DELETE: (id: string | number) => `/products/${id}`,
  },
} as const;
