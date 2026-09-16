/**
 * DTO nguyên liệu: list public/admin, resolve, response đơn.
 * Theo `docs/api/ingredients.md` + `docs/api/catalog-admin.md`.
 */
export interface IngredientAliasDto {
  id?: string;
  aliasId?: string;
  alias_id?: string;
  alias?: string;
  name?: string;
  value?: string;
}

export interface DietCompatibilityDto {
  dietPattern?: string;
  diet_pattern?: string;
  compatible?: boolean;
}

export interface TraditionWarningDto {
  tradition?: string;
  warningCode?: string;
  warning_code?: string;
  label?: string;
}

export interface IngredientDto {
  id?: string;
  canonicalName?: string;
  canonical_name?: string;
  name?: string;
  normalizedName?: string;
  normalized_name?: string;
  foodGroup?: string;
  food_group?: string;
  status?: string;
  aliases?: (IngredientAliasDto | string | null)[] | null;
  allergenCodes?: (string | null)[] | null;
  allergen_codes?: (string | null)[] | null;
  dietCompatibilities?: (DietCompatibilityDto | null)[] | null;
  diet_compatibilities?: (DietCompatibilityDto | null)[] | null;
  traditionWarnings?: (TraditionWarningDto | null)[] | null;
  tradition_warnings?: (TraditionWarningDto | null)[] | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

/** `GET /ingredients` và `GET /admin/ingredients` (cùng shape). */
export interface IngredientListResponseDto {
  success?: boolean;
  data?: (IngredientDto | null)[] | null;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    total_pages?: number;
  } | null;
}

/** `POST/PATCH /admin/ingredients*` → 1 item đủ. */
export interface IngredientResponseDto {
  success?: boolean;
  data?: IngredientDto | null;
  meta?: null;
}

/** `GET /ingredients/resolve`. */
export interface ResolveResponseDto {
  success?: boolean;
  data?: {
    query?: string;
    normalizedQuery?: string;
    normalized_query?: string;
    match?: string;
    candidates?: (IngredientDto | null)[] | null;
  } | null;
  meta?: null;
}

/** `POST /admin/ingredients` — `canonicalName` + `foodGroup` bắt buộc. */
export interface CreateIngredientRequestDto {
  canonicalName: string;
  foodGroup: string;
  allergenCodes?: string[];
  dietCompatibilities?: Array<{ dietPattern: string; compatible: boolean }>;
  traditionWarnings?: Array<{ tradition: string; warningCode: string; label: string }>;
}

/** `PATCH /admin/ingredients/:id` — full snapshot 3 mảng metadata. */
export interface UpdateIngredientRequestDto {
  canonicalName?: string;
  foodGroup?: string;
  status?: string;
  allergenCodes?: string[];
  dietCompatibilities?: Array<{ dietPattern: string; compatible: boolean }>;
  traditionWarnings?: Array<{ tradition: string; warningCode: string; label: string }>;
}

/** `POST /admin/ingredients/:id/aliases`. */
export interface AddAliasRequestDto {
  alias: string;
}
