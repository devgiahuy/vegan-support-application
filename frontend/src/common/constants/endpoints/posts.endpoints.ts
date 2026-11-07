export const POSTS_ENDPOINTS = {
  LIST: '/posts',
  MINE: '/posts/mine',
  DETAIL: (idOrSlug: string) => `/posts/${idOrSlug}`,
  CREATE: '/posts',
  UPDATE: (id: string) => `/posts/${id}`,
  DELETE: (id: string) => `/posts/${id}`,
  RELATED: (id: string) => `/posts/${id}/related`,
} as const;
