export const ADMIN_STORAGE_ENDPOINTS = {
  ACCOUNTS: '/admin/storage/accounts',
  POLICIES: '/admin/storage/policies',
  POLICY: (id: string) => `/admin/storage/policies/${id}`,
  ADJUSTMENTS: '/admin/storage/adjustments',
  ACCOUNT_ADJUSTMENTS: (userId: string) => `/admin/storage/accounts/${userId}/adjustments`,
} as const;
