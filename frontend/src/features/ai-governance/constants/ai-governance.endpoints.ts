export const AI_GOVERNANCE_ENDPOINTS = {
  HEALTH: '/admin/ai/health',
  METRICS: '/admin/ai/metrics',
  REQUESTS: '/admin/ai/requests',
  FLAGS: '/admin/ai/flags',
  FEATURES: '/admin/ai/features',
  FEATURES_AUDIT: '/admin/ai/features/audit',
  FEATURE_TOGGLE: (feature: string) => `/admin/ai/features/${feature}`,
} as const;
