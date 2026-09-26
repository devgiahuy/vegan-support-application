/**
 * DTO nguyên liệu — chỉ phần tra cứu công khai (`GET /ingredients`), đồng bộ
 * `frontend/src/features/ingredient/types/ingredient.dto.ts` (bỏ phần admin/resolve
 * vì mobile chưa có màn tạo công thức gắn ingredientId).
 */
export interface IngredientAliasDto {
  id?: string;
  aliasId?: string;
  alias_id?: string;
  alias?: string;
  name?: string;
  value?: string;
}

export interface IngredientDto {
  id?: string;
  canonicalName?: string;
  canonical_name?: string;
  name?: string;
  foodGroup?: string;
  food_group?: string;
  aliases?: (IngredientAliasDto | string | null)[] | null;
  allergenCodes?: (string | null)[] | null;
  allergen_codes?: (string | null)[] | null;
}

/** `GET /ingredients`. */
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
