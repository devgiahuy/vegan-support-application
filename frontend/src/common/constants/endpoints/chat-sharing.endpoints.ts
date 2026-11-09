/** @deprecated Use AI_ARTIFACTS endpoints. */
export const CHAT_SHARING_ENDPOINTS = {
  SHARE: (id: string) => `/ai-artifacts/${id}/visibility`,
  PUBLIC_LIST: '/ai-artifacts/public',
  VERIFY: (id: string) => `/ai-artifacts/${id}/verifications`,
} as const;
