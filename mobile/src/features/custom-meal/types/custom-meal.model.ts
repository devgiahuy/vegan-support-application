export interface CustomMealPhoto {
  id: string;
  url: string;
  sortOrder: number;
  isCover: boolean;
  mimeType: string;
}

export interface CustomMealIngredient {
  id: string;
  ingredientId: string | null;
  displayName: string;
  amount: number;
  unit: string;
}

export interface CustomMeal {
  id: string;
  name: string;
  notes: string | null;
  servings: number;
  sourceNote: string | null;
  calories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatGrams: number | null;
  coverageRatio: number;
  isFullyCovered: boolean;
  unmatchedIngredientCount: number;
  tags: string[];
  photos: CustomMealPhoto[];
  coverPhotoUrl: string | null;
  photoCount: number;
  ingredientCount: number;
  ingredients: CustomMealIngredient[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomMealListResult {
  items: CustomMeal[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  availableTags: { name: string; count: number }[];
}

export interface CustomMealFormValues {
  name: string;
  notes: string;
  servings: number;
  sourceNote: string;
  userCalories: number | null;
  userProteinGrams: number | null;
  userCarbsGrams: number | null;
  userFatGrams: number | null;
  tags: string[];
  ingredients: CustomMealIngredient[];
}
