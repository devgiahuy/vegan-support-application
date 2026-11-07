export const PANTRY_ENDPOINTS = {
  ITEMS: '/pantry/items',
  ITEM_DETAIL: (id: string) => `/pantry/items/${id}`,
  EXPIRING_SOON: '/pantry/items/expiring-soon',
  ADJUSTMENTS: (id: string) => `/pantry/items/${id}/adjustments`,
  MERGE_PREVIEW: '/pantry/merge-preview',
  MERGE: '/pantry/merge',
} as const;
