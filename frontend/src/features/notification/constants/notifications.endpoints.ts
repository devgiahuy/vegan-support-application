export const NOTIFICATIONS_ENDPOINTS = {
  LIST: '/notifications',
  UNREAD_COUNT: '/notifications/unread-count',
  READ: (id: string) => `/notifications/${id}/read`,
  READ_ALL: '/notifications/read-all',
} as const;
