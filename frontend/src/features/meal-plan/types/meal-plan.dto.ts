/**
 * DTO thực đơn tuần: generate/list/detail/swap/delete.
 * Theo `docs/api/meal-plans.md` (sync OpenAPI 2026-09-16).
 * Envelope `{success, data, meta}` dùng trực tiếp — cấm bọc `APIResponse<>` 2 tầng.
 */

/** Món trong một ô bữa (thô, chấp nhận biến thể BE). Shape thật (verify live 2026-09-16):
 * slot `{id,date,mealType,position,status,targetCalories,calories,tolerancePercent,recipe,reasonCodes,warningCodes}`,
 * recipe `{id,revisionId,slug,title,coverImageUrl,difficulty}` (không có nutrition). */
export interface MealSlotDto {
  id?: string;
  itemId?: string;
  date?: string;
  mealType?: string;
  meal_type?: string;
  position?: number | string;
  status?: string;
  targetCalories?: number | string;
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

/** Dòng danh sách đi chợ (thô). Shape thật: `{ingredientId,canonicalName,amount,unit,sourceItemCount}`. */
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

/** Thực đơn tuần thô (detail đầy đủ slots + shoppingList). */
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
  micronutrientSummary?: {
    vitaminB12Mcg?: number | string | null;
    recipesWithData?: number | string;
    filledRecipeCount?: number | string;
  } | null;
  explanation?: string | null;
  filledSlots?: number | string;
  totalSlots?: number | string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  constraintSnapshot?: unknown;
  items?: (MealSlotDto | null)[] | null;
  shoppingList?: (ShoppingListItemDto | null)[] | null;
  shopping_list?: (ShoppingListItemDto | null)[] | null;
}

/** `POST /meal-plans/generate` — `weekStart` (Thứ Hai), `goal`, `idempotencyKey` bắt buộc. */
export interface GenerateMealPlanRequestDto {
  weekStart: string;
  goal: string;
  idempotencyKey: string;
  seed?: string;
  supersedesMealPlanId?: string;
}

/** `PATCH /meal-plans/:id/items/:itemId/swap` — `expectedVersion` + `idempotencyKey` bắt buộc. */
export interface SwapMealPlanItemRequestDto {
  expectedVersion: number;
  idempotencyKey: string;
  seed?: string;
}

/** `POST /meal-plans/generate` / `GET /meal-plans/:id` / swap → detail đầy đủ. */
export interface MealPlanResponseDto {
  success?: boolean;
  data?: MealPlanDto | null;
  meta?: null;
}

/** `GET /meal-plans` → mảng summary (không có `items`/`shoppingList`). */
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

/** `DELETE /meal-plans/:id` → `{id, deleted}`. */
export interface DeleteMealPlanResponseDto {
  success?: boolean;
  data?: { id?: string; deleted?: boolean } | null;
  meta?: null;
}
