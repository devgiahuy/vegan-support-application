export const CONTENT_REVIEW_ENDPOINTS = {
  SUBMIT: (postId: string) => `/posts/${postId}/submit`,
  HISTORY: (postId: string) => `/posts/${postId}/review-history`,
} as const;
