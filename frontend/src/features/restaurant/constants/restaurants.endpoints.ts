export const RESTAURANTS_ENDPOINTS = {
  NEARBY: '/restaurants/nearby',
  SEARCH: '/restaurants/search',
  DETAIL: (id: string) => `/restaurants/${id}`,
  SUBMIT: '/restaurants',
} as const;
