export const FOOD_DATA_ENDPOINTS = {
  NUTRIENTS: (ingredientId: string) => `/food-data/ingredients/${ingredientId}/nutrients`,
  REFERENCE_INTAKES: '/food-data/reference-intakes',
  GUIDELINES: '/food-data/ingredient-guidelines',
  COOKING_METHODS: '/food-data/cooking-methods',
  INTERACTIONS: '/food-data/interaction-rules',
} as const;
