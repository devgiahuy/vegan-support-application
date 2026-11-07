export const MEAL_PLANS_ENDPOINTS = {
  GENERATE: '/meal-plans/generate',
  LIST: '/meal-plans',
  DETAIL: (id: string) => `/meal-plans/${id}`,
  SWAP: (id: string, itemId: string) => `/meal-plans/${id}/items/${itemId}/swap`,
  MANUAL_ADD: (id: string, itemId: string) => `/meal-plans/${id}/items/${itemId}/manual-add`,
  DELETE: (id: string) => `/meal-plans/${id}`,
  ANALYZE: (id: string) => `/meal-plans/${id}/analyze`,
  ANALYSIS: (id: string) => `/meal-plans/${id}/analysis`,
} as const;
