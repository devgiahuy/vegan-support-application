export const INGREDIENT_COMPOSITION_ENDPOINTS = {
  DETAIL: (id: string) => `/admin/ingredients/${id}/composition`,
  SOURCES: '/admin/ingredient-composition-sources',
} as const;
