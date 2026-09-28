export interface MealSlotDto {
  id?: string;
  itemId?: string;
  item_id?: string;
  date?: string;
  mealType?: string;
  meal_type?: string;
  position?: number | string;
  status?: string;
  targetCalories?: number | string;
  target_calories?: number | string;
  calories?: number | string;
  tolerancePercent?: number | string;
  reasonCodes?: (string | null)[] | null;
  warningCodes?: (string | null)[] | null;
  reason?: string;
  unfilledReason?: string;
  recipe?: {
    id?: string;
    revisionId?: string;
    slug?: string;
    title?: string;
    name?: string;
    coverImageUrl?: string;
    difficulty?: string;
    calories?: number | string;
    protein?: number | string;
    carbs?: number | string;
    fat?: number | string;
    servings?: number | string;
  } | null;
}

export interface ShoppingListItemDto {
  ingredientId?: string | null;
  ingredient_id?: string | null;
  canonicalName?: string;
  canonical_name?: string;
  name?: string;
  ingredientName?: string;
  amount?: number | string;
  quantity?: number | string;
  unit?: string;
  sourceItemCount?: number | string;
}

export interface MealPlanDto {
  id?: string;
  weekStart?: string;
  week_start?: string;
  goal?: string;
  targetCalories?: number | string;
  target_calories?: number | string;
  version?: number | string;
  lockVersion?: number | string;
  lock_version?: number | string;
  supersedesMealPlanId?: string | null;
  algorithmVersion?: string;
  recommendationVersion?: string;
  warnings?: (string | null)[] | null;
  nutritionDataQuality?: string;
  nutrition_data_quality?: string;
  micronutrientSummary?: {
    vitaminB12Mcg?: number | string | null;
    vitamin_b12_mcg?: number | string | null;
    recipesWithData?: number | string;
    filledRecipeCount?: number | string;
  } | null;
  explanation?: string | null;
  filledSlots?: number | string;
  filled_slots?: number | string;
  totalSlots?: number | string;
  total_slots?: number | string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  items?: (MealSlotDto | null)[] | null;
  shoppingList?: (ShoppingListItemDto | null)[] | null;
  shopping_list?: (ShoppingListItemDto | null)[] | null;
}

export interface GenerateMealPlanRequestDto {
  weekStart: string;
  goal: string;
  idempotencyKey: string;
  seed?: string;
  supersedesMealPlanId?: string;
}

export interface SwapMealPlanItemRequestDto {
  expectedVersion: number;
  idempotencyKey: string;
  seed?: string;
}

export interface MealPlanResponseDto {
  success?: boolean;
  data?: MealPlanDto | null;
  meta?: null;
}

export interface MealPlanListResponseDto {
  success?: boolean;
  data?: (MealPlanDto | null)[] | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    total_pages?: number;
  } | null;
}

export interface DeleteMealPlanResponseDto {
  success?: boolean;
  data?: { id?: string; deleted?: boolean } | null;
  meta?: null;
}
