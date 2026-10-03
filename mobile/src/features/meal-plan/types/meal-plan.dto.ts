/**
 * DTO meal plans — khớp OpenAPI backend (`MealPlanResponse`). Các field mới của contract 2026-09-28
 * (`days`, `userSummary`, `warningDetails`, `estimatedNutritionTargets`) đều optional để tương thích ngược.
 */
export interface MealSlotDto {
  id?: string;
  itemId?: string;
  item_id?: string;
  date?: string;
  mealType?: string;
  meal_type?: string;
  position?: number | string;
  status?: string;
  sourceType?: string;
  targetCalories?: number | string;
  target_calories?: number | string;
  servings?: number | string | null;
  calories?: number | string | null;
  tolerancePercent?: number | string | null;
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
  } | null;
  customMeal?: {
    id?: string;
    name?: string;
    nutritionCoverage?: string;
  } | null;
  unresolved?: {
    code?: string;
    reason?: string;
    hardConstraintsPreserved?: boolean;
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

export interface MealPlanWarningDetailDto {
  code?: string;
  severity?: string;
  severityLabel?: string;
  message?: string;
  detail?: string;
  suggestion?: string;
  advisory?: boolean;
  affectedSlots?: {
    itemId?: string;
    date?: string;
    mealType?: string;
    name?: string;
  }[];
}

export interface EstimatedMacroDto {
  proteinGrams?: number | string | null;
  fiberGrams?: number | string | null;
  fatGrams?: number | string | null;
  carbohydrateGrams?: number | string | null;
}

export interface MealPlanDayDto {
  date?: string;
  dayOfWeek?: string;
  estimatedTotals?:
    | (EstimatedMacroDto & {
        estimated?: boolean;
        confidence?: number | string;
        uncertaintyNotes?: (string | null)[] | null;
      })
    | null;
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
  warningDetails?: (MealPlanWarningDetailDto | null)[] | null;
  userSummary?: {
    status?: string;
    title?: string;
    detail?: string;
    suggestion?: string | null;
    hardConstraintsPreserved?: boolean;
  } | null;
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
  days?: (MealPlanDayDto | null)[] | null;
  estimatedNutritionTargets?:
    | (EstimatedMacroDto & {
        estimated?: boolean;
        source?: string;
        sourceDetail?: string;
        tolerancePercent?: number | string;
      })
    | null;
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

/** Body `PATCH /meal-plans/:id/items/:itemId/manual-add`. */
export interface ManualAddMealItemRequestDto {
  expectedVersion: number;
  idempotencyKey: string;
  sourceType: 'RECIPE' | 'CUSTOM_MEAL';
  recipeId?: string;
  customMealId?: string;
  servings?: number;
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
