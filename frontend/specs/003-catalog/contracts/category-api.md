# Contract: Category API (`/api/v1`) — frontend consumer

**Feature**: `003-catalog` | **Status nguồn**: `BACKEND_INTEGRATION.md` §6.4 — tất cả `READY` (2026-09-15)
**Nguồn schema**: `docs/api/categories.md` + `docs/api/catalog-admin.md`. OpenAPI là source of truth.
**Dùng chung**: envelope, `error.code` helpers, refresh-queue, `AuthGuard ADMIN` từ `001-user-auth`.

Base URL đã gồm `/api/v1`. Public không cần auth; admin cần Bearer + role ADMIN.

---

## 1. `GET /categories` (public)

- **Constant**: `CATEGORIES.TREE = '/categories'`
- **Auth**: không bắt buộc
- **Query**: `type?` (`FOOD_TYPE`/`RECIPE_GROUP`/`CONTENT_TOPIC`)
- **Success** `200` → `CategoryTreeResponse`: `data` là **mảng** cây (mỗi node có `children[]`, tối đa 2 tầng).
  → `categoryMapper.toTreeModel(res.data)` (envelope đọc `res.data` trực tiếp).
- **Query**: `useCategoryTreeQuery(type?)`, `staleTime` 10 phút.
- **Errors**: `400 VALIDATION_ERROR` (type sai) → empty + thông báo.

## 2. `GET /admin/categories` (admin)

- **Constant**: `ADMIN_CATALOG.CATEGORIES.LIST = '/admin/categories'`
- **Query**: `page/limit/type/status` (gồm `ARCHIVED`)
- **Success** `200` → `AdminCategoryListResponse`: `data` mảng phẳng + `meta {page,limit,total,totalPages}`.
  → mapper chuẩn hóa `total→totalItems`, suy `hasNextPage/hasPrevPage`, trả `PaginationResult<Category>` (không đổi type global).
- **Query**: `useAdminCategoriesQuery(params)` + Key Factory.

## 3. `POST /admin/categories`

- **Constant**: `ADMIN_CATALOG.CATEGORIES.CREATE` (cùng path)
- **Request**: `{ name*, type*, slug?, parentId?, sortOrder? }` (`*` bắt buộc khi tạo).
- **Success** `201` → `CategoryResponse` (1 node).
- **Errors**: `INVALID_CATALOG_NAME`, `INVALID_CATEGORY_PARENT`, `CATEGORY_TYPE_MISMATCH`, `CATEGORY_DEPTH_EXCEEDED`, `CATEGORY_SLUG_CONFLICT`, `VALIDATION_ERROR` → map field (xem [catalog-errors.md](./catalog-errors.md)).

## 4. `PATCH /admin/categories/:id`

- **Constant**: `ADMIN_CATALOG.CATEGORIES.UPDATE(id)` — gửi partial (chỉ field đổi).
- **Success** `200` → `CategoryResponse`. Invalidate tree + admin list.

## 5. `DELETE /admin/categories/:id` (archive)

- **Constant**: `ADMIN_CATALOG.CATEGORIES.ARCHIVE(id)` — cùng path, method DELETE.
- **Query**: `replacementId?` — bắt buộc khi backend báo `CATEGORY_REPLACEMENT_REQUIRED`.
- **Success** `200` → `CatalogArchiveResponse` (`{id, status:'ARCHIVED'}`).
- **Hành vi UI**: mở `ReplacementPicker` (cùng type/cùng tầng) trước khi gọi; `INVALID_CATEGORY_REPLACEMENT` → chọn lại; `CATEGORY_REPLACEMENT_CONFLICT` → refresh cây + chọn lại. Invalidate tree + admin list.

## 6. Tổng hợp constant (category)

```ts
CATEGORIES.TREE                        // '/categories' — GET
ADMIN_CATALOG.CATEGORIES.LIST          // '/admin/categories' — GET
ADMIN_CATALOG.CATEGORIES.CREATE        // '/admin/categories' — POST
ADMIN_CATALOG.CATEGORIES.UPDATE(id)    // `/admin/categories/${id}` — PATCH
ADMIN_CATALOG.CATEGORIES.ARCHIVE(id)   // `/admin/categories/${id}` — DELETE
```

## 7. Definition of Done

- [ ] Tree public đúng 2 tầng, lọc loại, staleTime 10m, không cần auth.
- [ ] Admin list gồm archived, phân trang chuẩn hóa đúng `PaginationResult`.
- [ ] Tạo/sửa validate cùng-loại/tối đa-2-tầng ở client + map lỗi field backend.
- [ ] Archive luôn qua replacement picker khi cần; tree public mất item ngay sau invalidate.
- [ ] Mapper test phủ tree lồng, thiếu `children`, enum lạ, meta mapping.
