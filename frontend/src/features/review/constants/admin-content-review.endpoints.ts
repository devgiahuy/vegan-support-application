export const ADMIN_CONTENT_REVIEW_ENDPOINTS = {
  LIST: '/admin/content-review',
  DETAIL: (revisionId: string) => `/admin/content-review/${revisionId}`,
  DECISION: (revisionId: string) => `/admin/content-review/${revisionId}`,
  NUTRITION: (revisionId: string) => `/admin/content-review/${revisionId}/nutrition`,
  NUTRITION_RECALCULATE: (revisionId: string) =>
    `/admin/content-review/${revisionId}/nutrition/recalculate`,
} as const;
