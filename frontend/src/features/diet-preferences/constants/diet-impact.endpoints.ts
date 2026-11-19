export const DIET_IMPACT_ENDPOINTS = {
  PREVIEW: '/users/me/diet-preferences/impact-preview',
  REPAIR_PREVIEW: '/meal-plans/diet-repair/preview',
  REPAIR_APPLY: '/meal-plans/diet-repair/apply',
  PROGRAM_REVISION: (id: string) => `/meal-programs/${encodeURIComponent(id)}/diet-revision`,
} as const;
