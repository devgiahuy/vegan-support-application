/**
 * DTO danh mục: cây public (`CategoryTreeResponse`), list admin, response đơn, archive.
 * Theo `docs/api/categories.md` + `docs/api/catalog-admin.md`.
 */

/** Node danh mục thô (public tree lồng `children`, admin list phẳng). */
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

/** Meta phân trang catalog `{page,limit,total,totalPages}` (khác type chung). */
export interface CatalogPageMetaDto {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  total_pages?: number;
}

/** `GET /admin/categories` → list phẳng + meta. */
export interface AdminCategoryListResponseDto {
  success?: boolean;
  data?: (CategoryDto | null)[] | null;
  meta?: CatalogPageMetaDto | null;
}

/** `POST/PATCH /admin/categories*` → 1 node. */
export interface CategoryResponseDto {
  success?: boolean;
  data?: CategoryDto | null;
  meta?: null;
}

/** `DELETE /admin/*` → `{id, status: 'ARCHIVED'}`. */
export interface CatalogArchiveResponseDto {
  success?: boolean;
  data?: { id?: string; status?: string } | null;
  meta?: null;
}

/** `POST /admin/categories` — `name` + `type` bắt buộc. */
export interface CreateCategoryRequestDto {
  name: string;
  type: string;
  slug?: string;
  parentId?: string | null;
  sortOrder?: number;
}

/** `PATCH /admin/categories/:id` — partial, chỉ gửi field đổi. */
export interface UpdateCategoryRequestDto {
  name?: string;
  type?: string;
  slug?: string;
  parentId?: string | null;
  sortOrder?: number;
}
