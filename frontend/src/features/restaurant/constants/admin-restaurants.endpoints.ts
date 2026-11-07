export const ADMIN_RESTAURANTS_ENDPOINTS = {
  QUEUE: '/admin/restaurants',
  LIST: '/admin/restaurants',
  REVIEW: (id: string) => `/admin/restaurants/${id}/review`,
} as const;
