export const ADMIN_CATALOG_ENDPOINTS = {
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
} as const;
