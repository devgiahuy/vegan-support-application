export const RECIPE_NUTRITION_ENDPOINTS = {
  PREVIEW: (id: string) => `/posts/${id}/nutrition/preview`,
  RECALCULATE: (id: string) => `/posts/${id}/nutrition/recalculate`,
  CURRENT: (id: string) => `/posts/${id}/nutrition/current`,
  HISTORY: (id: string) => `/posts/${id}/nutrition/history`,
  STATUS: (id: string) => `/posts/${id}/nutrition/status`,
} as const;
