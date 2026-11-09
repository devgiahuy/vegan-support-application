/** @deprecated Use ADMIN_CONTENT_REVIEW endpoints. */
export const REVIEW_QUEUE_ENDPOINTS = {
  LIST: '/review-queue/posts',
  APPROVE: (id: string) => `/review-queue/posts/${id}/approve`,
  REJECT: (id: string) => `/review-queue/posts/${id}/reject`,
} as const;
