/**
 * DTO danh mục — bản đọc (cây public `GET /categories`), đồng bộ
 * `frontend/src/features/category/types/category.dto.ts`.
 */
export interface CategoryDto {
  id?: string;
  parentId?: string | null;
  parent_id?: string | null;
  name?: string;
  category_name?: string;
  slug?: string;
  type?: string;
  categoryType?: string;
  status?: string;
  sortOrder?: number | string;
  sort_order?: number | string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  children?: (CategoryDto | null)[] | null;
}

/** `GET /categories` → cây (data là mảng). */
export interface CategoryTreeResponseDto {
  success?: boolean;
  data?: (CategoryDto | null)[] | null;
  meta?: null;
}
