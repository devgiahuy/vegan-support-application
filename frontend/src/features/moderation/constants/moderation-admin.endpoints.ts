export const MODERATION_ADMIN_ENDPOINTS = {
  REPORTS: '/admin/reports',
  REPORT_RESOLVE: (id: string) => `/admin/reports/${id}/resolve`,
  USERS: '/admin/users',
  USER_STATUS: (id: string) => `/admin/users/${id}/status`,
  COMMENTS: '/admin/comments',
  COMMENT_STATUS: (id: string) => `/admin/comments/${id}/status`,
} as const;
