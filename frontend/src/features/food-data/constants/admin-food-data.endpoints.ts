export const ADMIN_FOOD_DATA_ENDPOINTS = {
  RECORDS: '/admin/food-data/records',
  RECORD: (id: string) => `/admin/food-data/records/${id}`,
  IMPORT_PREVIEW: '/admin/food-data/imports/preview',
  IMPORT_COMMIT: '/admin/food-data/imports',
} as const;
