export const ADMIN_CONTRIBUTOR_ENDPOINTS = {
  LIST: '/admin/contributor-applications',
  REVIEW: (id: string) => `/admin/contributor-applications/${id}/review`,
  INVITE: '/admin/contributor-invitations',
  REVOKE: (userId: string) => `/admin/contributors/${userId}/revoke`,
} as const;
