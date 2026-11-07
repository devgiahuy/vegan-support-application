export const COMMUNITY_ENDPOINTS = {
  COMMENTS: (postId: string) => `/posts/${postId}/comments`,
  COMMENT: (id: string) => `/comments/${id}`,
  SUMMARY: (postId: string) => `/posts/${postId}/community-summary`,
  VOTE: (postId: string) => `/posts/${postId}/vote`,
  RATING: (postId: string) => `/posts/${postId}/rating`,
  BOOKMARK: (postId: string) => `/posts/${postId}/bookmark`,
  MY_BOOKMARKS: '/users/me/bookmarks',
} as const;
