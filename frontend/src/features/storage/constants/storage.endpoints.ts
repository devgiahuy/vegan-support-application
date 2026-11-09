export const STORAGE_ENDPOINTS = {
  ME: '/storage/me',
  ASSET: (id: string) => `/storage/assets/${id}`,
} as const;
