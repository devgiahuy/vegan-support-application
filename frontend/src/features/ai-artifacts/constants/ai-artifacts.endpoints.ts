export const AI_ARTIFACTS_ENDPOINTS = {
  BASE: '/ai-artifacts',
  PUBLIC: '/ai-artifacts/public',
  BY_ID: (id: string) => `/ai-artifacts/${id}`,
  VISIBILITY: (id: string) => `/ai-artifacts/${id}/visibility`,
  SUBMIT: (id: string) => `/ai-artifacts/${id}/submit`,
  VERIFICATIONS: (id: string) => `/ai-artifacts/${id}/verifications`,
} as const;
