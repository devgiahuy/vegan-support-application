# Contract: Ingredient API (`/api/v1`) — frontend consumer

**Feature**: `003-catalog` | **Status nguồn**: `BACKEND_INTEGRATION.md` §6.4 — tất cả `READY` (2026-09-15)
**Nguồn schema**: `docs/api/ingredients.md` + `docs/api/catalog-admin.md`.

---

## 1. `GET /ingredients` (public)

- **Constant**: `INGREDIENTS.LIST = '/ingredients'`
- **Auth**: không bắt buộc
- **Query**: `page/limit/q/foodGroup`
- **Success** `200` → `IngredientListResponse`: `data` mảng + `meta {page,limit,total,totalPages}`.
  → mapper chuẩn hóa về `PaginationResult<Ingredient>` (như category).
- **Query**: `useIngredientsQuery(params)`, debounce `q` ~400ms ở component, `enabled` khi component mount (cho phép q rỗng = duyệt tất cả).

## 2. `GET /ingredients/resolve` (public)

- **Constant**: `INGREDIENTS.RESOLVE = '/ingredients/resolve'`
- **Auth**: không bắt buộc
- **Query**: **`query`** (bắt buộc, tên param khác `q` — chú ý khi code).
- **Success** `200` → `IngredientResolutionResponse`: `data = {query, normalizedQuery, match: NONE|EXACT|AMBIGUOUS, candidates[]}`.
  → `ingredientMapper.toResolutionModel(res.data)`.
- **Query**: `useIngredientResolveQuery(query, { enabled: trim.length >= 2 })`, debounce ~400ms.
- **Hành vi UI**: NONE → empty + gợi ý; EXACT → highlight 1 kết quả; AMBIGUOUS → picker bắt buộc chọn, không tự chọn hộ.

## 3. `GET /admin/ingredients` (admin)

- **Constant**: `ADMIN_CATALOG.INGREDIENTS.LIST = '/admin/ingredients'`
- **Query**: `page/limit/q/foodGroup/status` (gồm `ARCHIVED`).
- **Success** `200` → `IngredientListResponse` (cùng shape public).

## 4. `POST /admin/ingredients`

- **Constant**: `ADMIN_CATALOG.INGREDIENTS.CREATE` (cùng path)
- **Request**: `{ canonicalName*, foodGroup*, allergenCodes?, dietCompatibilities?, traditionWarnings? }`.
- **Success** `201` → `IngredientResponse` (1 item đủ).
- **Errors**: `INVALID_CATALOG_NAME`, `INVALID_INGREDIENT_METADATA`, `INGREDIENT_NAME_CONFLICT` → map field.

## 5. `PATCH /admin/ingredients/:id`

- **Constant**: `ADMIN_CATALOG.INGREDIENTS.UPDATE(id)` — gửi **full snapshot** 3 mảng metadata (preload đủ vào form, trường vắng = đã xóa) + `canonicalName/foodGroup/status` đổi.
- **Success** `200` → `IngredientResponse`.

## 6. `DELETE /admin/ingredients/:id` (archive)

- **Constant**: `ADMIN_CATALOG.INGREDIENTS.ARCHIVE(id)` — không body/query thêm.
- **Success** `200` → `CatalogArchiveResponse`. Public list + resolve không còn item sau invalidate.

## 7. `POST /admin/ingredients/:id/aliases`

- **Constant**: `ADMIN_CATALOG.INGREDIENTS.ALIASES(id)` — body `{ alias* }` (trim, không rỗng).
- **Success** `201` → `IngredientResponse` đủ (cập nhật aliases ngay).
- **Errors**: `INGREDIENT_ALIAS_CONFLICT` → báo trùng tại field.

## 8. `DELETE /admin/ingredients/:id/aliases/:aliasId`

- **Constant**: `ADMIN_CATALOG.INGREDIENTS.ALIAS(id, aliasId)` — không body.
- **Success** `204` **rỗng** — client dùng `api.delete<void>`, không parse body; `onSuccess` invalidate admin list + public list.
- **Errors**: `404 NOT_FOUND` → refresh list.

## 9. Tổng hợp constant (ingredient)

```ts
INGREDIENTS.LIST                       // '/ingredients' — GET
INGREDIENTS.RESOLVE                    // '/ingredients/resolve' — GET (param `query`)
ADMIN_CATALOG.INGREDIENTS.LIST         // '/admin/ingredients' — GET
ADMIN_CATALOG.INGREDIENTS.CREATE       // '/admin/ingredients' — POST
ADMIN_CATALOG.INGREDIENTS.UPDATE(id)   // `/admin/ingredients/${id}` — PATCH
ADMIN_CATALOG.INGREDIENTS.ARCHIVE(id)  // `/admin/ingredients/${id}` — DELETE
ADMIN_CATALOG.INGREDIENTS.ALIASES(id)  // `/admin/ingredients/${id}/aliases` — POST
ADMIN_CATALOG.INGREDIENTS.ALIAS(id, aliasId) // `.../aliases/${aliasId}` — DELETE (204)
```

## 10. Definition of Done

- [ ] Tìm kiếm debounce, không dấu ra kết quả, phân trang chuẩn hóa.
- [ ] Resolve đủ 3 trạng thái; AMBIGUOUS bắt buộc picker.
- [ ] Form ingredient preload đủ metadata (full snapshot khi save).
- [ ] Alias thêm/xóa cập nhật ngay; DELETE 204 không parse body.
- [ ] Mapper test phủ meta mapping, 3 trạng thái resolve, alias shape lạ.
