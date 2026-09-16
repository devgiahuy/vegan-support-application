# Data Model: Catalog

**Feature**: `003-catalog` | **Date**: 2026-09-15 | **Sources**: `docs/api/categories.md`, `docs/api/ingredients.md`, `docs/api/catalog-admin.md`, [spec.md](./spec.md), [research.md](./research.md)

Quy ước chung: ID UUID string; timestamp ISO 8601 UTC; enum giữ chuỗi backend qua `safeEnum` + fallback; phân trang catalog (`meta {page,limit,total,totalPages}`) được chuẩn hóa về `PaginationResult<T>` ở mapper.

---

## 1. Enum (`src/common/enums/index.ts` — bổ sung)

| Enum | Giá trị | Nguồn |
| --- | --- | --- |
| `CategoryType` | `FOOD_TYPE`, `RECIPE_GROUP`, `CONTENT_TOPIC` | create/update category |
| `CategoryStatus` | `ACTIVE`, `ARCHIVED` | category status |
| `FoodGroup` | `GRAINS`, `LEGUMES`, `VEGETABLES`, `FRUITS`, `NUTS_SEEDS`, `MUSHROOMS`, `DAIRY_EGGS`, `HERBS_SPICES`, `OTHER` | create/update ingredient |
| `IngredientStatus` | `ACTIVE`, `ARCHIVED` | ingredient status |
| `ResolutionMatch` | `NONE`, `EXACT`, `AMBIGUOUS` | resolve match |

Nhãn tiếng Việt (mapper, không JSX):
- CategoryType: loại thực phẩm / nhóm công thức / chủ đề nội dung.
- FoodGroup: ngũ cốc / đậu / rau / trái cây / hạt / nấm / trứng sữa / thảo mộc–gia vị / khác.

---

## 2. Entities (UI Model)

### 2.1 `Category` (`features/category`)

| Field | Type | Null | Nguồn DTO | Ghi chú |
| --- | --- | --- | --- | --- |
| `id` | `string` | no | `id` | UUID |
| `parentId` | `string \| null` | yes | `parentId` | null = gốc |
| `name` | `string` | no | `name` | fallback `'Danh mục'` |
| `slug` | `string` | no | `slug` | duy nhất trong cùng cha/loại |
| `type` | `CategoryType` | no | `type` | fallback `FOOD_TYPE` + giữ `rawType` khi lạ |
| `typeLabel` | `string` | no | derived |  |
| `status` | `CategoryStatus` | no | `status` | public tree chỉ ACTIVE |
| `sortOrder` | `number` | no | `sortOrder` | fallback 0, dùng sắp xếp hiển thị |
| `createdAt`/`updatedAt` | `Date \| null` | yes | `createdAt`/`updatedAt` |  |
| `children` | `Category[]` | no | `children` (đệ quy 1 tầng) | `null`/thiếu → `[]`; sâu hơn 2 tầng backend không trả |

### 2.2 `Ingredient` (`features/ingredient`)

| Field | Type | Null | Nguồn | Ghi chú |
| --- | --- | --- | --- | --- |
| `id` | `string` | no | `id` |  |
| `canonicalName` | `string` | no | `canonicalName` | tên chuẩn duy nhất |
| `normalizedName` | `string` | no | `normalizedName` | đã chuẩn hóa (backend) |
| `foodGroup` | `FoodGroup` | no | `foodGroup` | + `foodGroupLabel` |
| `status` | `IngredientStatus` | no | `status` | public chỉ ACTIVE |
| `aliases` | `IngredientAlias[]` | no | `aliases` | xem 2.3 |
| `allergenCodes` | `string[]` | no | `allergenCodes` |  |
| `dietCompatibilities` | `Array<{ dietPattern: string; compatible: boolean }>` | no | `dietCompatibilities` | hiển thị thô, không branch logic |
| `traditionWarnings` | `Array<{ tradition: string; warningCode: string; label: string }>` | no | `traditionWarnings` | hiển thị |
| `createdAt`/`updatedAt` | `Date \| null` | yes |  |  |

### 2.3 `IngredientAlias`

| Field | Type | Null | Nguồn | Ghi chú |
| --- | --- | --- | --- | --- |
| `id` | `string` | no | `id`/`aliasId` | rỗng khi shape lạ (không dùng xóa) |
| `alias` | `string` | no | `alias`/`name`/`value` | tên gọi |

### 2.4 `IngredientResolution`

| Field | Type | Null | Ghi chú |
| --- | --- | --- | --- |
| `query` | `string` | no | từ gốc user nhập |
| `normalizedQuery` | `string` | no | backend chuẩn hóa |
| `match` | `ResolutionMatch` | no | fallback `NONE` |
| `candidates` | `Ingredient[]` | no | AMBIGUOUS luôn non-empty theo contract; mapper vẫn chịu `[]` |

---

## 3. Request payloads (admin)

### 3.1 Category (`POST /admin/categories`, `PATCH /admin/categories/:id`)

| Field | Type | Bắt buộc (create) | Ghi chú |
| --- | --- | --- | --- |
| `name` | `string` | yes | không rỗng/trùng sau normalize |
| `type` | `CategoryType` | yes | con phải cùng loại với cha (validate client khi biết cha) |
| `slug` | `string` | no | để trống backend tự sinh; nếu nhập phải duy nhất |
| `parentId` | `string \| null` | no | null = gốc; đổi cha phải cùng loại + không quá 2 tầng |
| `sortOrder` | `integer` | no | mặc định 0 |

PATCH gửi partial (chỉ field đổi) — khác với metadata ingredient.

### 3.2 Archive category (`DELETE /admin/categories/:id?replacementId=...`)

Không body. `replacementId` là query param, bắt buộc khi item đang được dùng (backend `CATEGORY_REPLACEMENT_REQUIRED` nếu thiếu).

### 3.3 Ingredient (`POST /admin/ingredients`, `PATCH /admin/ingredients/:id`)

| Field | Type | Bắt buộc (create) | Ghi chú |
| --- | --- | --- | --- |
| `canonicalName` | `string` | yes | duy nhất sau normalize |
| `foodGroup` | `FoodGroup` | yes |  |
| `allergenCodes` | `string[]` | no | **full snapshot** |
| `dietCompatibilities` | `Array<{dietPattern, compatible}>` | no | **full snapshot** |
| `traditionWarnings` | `Array<{tradition, warningCode, label}>` | no | **full snapshot** |
| `status` | `IngredientStatus` | no (chỉ PATCH) | đổi ACTIVE/ARCHIVED |

### 3.4 Alias (`POST /admin/ingredients/:id/aliases`, `DELETE .../aliases/:aliasId`)

- Add: `{ alias: string }` (không rỗng). Response 201 `IngredientResponse` đủ.
- Delete: không body/param thêm; response **204 rỗng** — client không parse body.

---

## 4. State transitions

### 4.1 Category lifecycle

```text
(draft form) ──POST──▶ ACTIVE ──PATCH──▶ ACTIVE (đổi tên/cha/slug/thứ tự)
ACTIVE ──DELETE (+replacementId nếu đang dùng)──▶ ARCHIVED (mất khỏi public, còn trong admin list)
```

### 4.2 Ingredient lifecycle

```text
(draft form) ──POST──▶ ACTIVE ──PATCH (full snapshot metadata)──▶ ACTIVE
ACTIVE ──DELETE──▶ ARCHIVED (mất khỏi public + resolve)
Alias: [] ──POST──▶ [..., alias] ──DELETE──▶ [...] (204)
```

### 4.3 Resolve (không có transition — query thuần)

```text
query (≥2 ký tự, debounce) ──GET resolve──▶ NONE | EXACT (1) | AMBIGUOUS (candidates[])
```

---

## 5. Validation rules

| # | Rule | Nơi enforce |
| --- | --- | --- |
| V1 | `name`/`canonicalName`/`alias` không rỗng (trim) | zod + backend |
| V2 | Category con cùng `type` với cha (khi biết cha ở client) | zod/client + backend `CATEGORY_TYPE_MISMATCH` |
| V3 | Không tạo/chuyển tầng 3 (client đếm từ cây đã tải khi biết) | client + backend `CATEGORY_DEPTH_EXCEEDED` |
| V4 | `slug` (nếu nhập) slug-case, duy nhất trong cha/loại | client format + backend `CATEGORY_SLUG_CONFLICT` |
| V5 | Archive item đang dùng bắt buộc `replacementId` cùng loại/cùng tầng | client picker + backend |
| V6 | Metadata ingredient gửi full snapshot (preload đủ mảng vào form) | client + backend |
| V7 | Alias không trùng sau trim+lowercase (cảnh báo normalize) | client + backend `INGREDIENT_ALIAS_CONFLICT` |
| V8 | Từ khóa resolve trim, ≥ 2 ký tự mới gọi | client (query `enabled`) |
| V9 | Lỗi `VALIDATION_ERROR` map theo `error.fields` | form layer |

---

## 6. DTO ↔ Model mapping matrix (trích yếu)

| Model field | `pickField` candidates | `safe*` | Fallback |
| --- | --- | --- | --- |
| `Category.id` | `['id']` | `safeString` | `''` |
| `Category.parentId` | `['parentId','parent_id']` | `safeString` + `'' → null` | `null` |
| `Category.type` | `['type','categoryType']` | `safeEnum(CategoryType)` | `FOOD_TYPE` |
| `Category.status` | `['status']` | `safeEnum(CategoryStatus)` | `ACTIVE` |
| `Category.children` | `['children']` | đệ quy `toModelList` | `[]` |
| `Ingredient.canonicalName` | `['canonicalName','canonical_name','name']` | `safeString` | `''` |
| `Ingredient.foodGroup` | `['foodGroup','food_group']` | `safeEnum(FoodGroup)` | `OTHER` |
| `Ingredient.aliases` | `['aliases']` | `safeArray` + `toAlias` | `[]` |
| `IngredientAlias.id` | `['id','aliasId','alias_id']` | `safeString` | `''` |
| `IngredientAlias.alias` | `['alias','name','value']` | `safeString` | `''` |
| `Resolution.match` | `['match']` | `safeEnum(ResolutionMatch)` | `NONE` |
| Pagination `totalItems` | `['total']` (meta catalog) | `safeNumber` | `0` |

DTO `*ResponseDto` đều là envelope `{success,data,meta}` — axios generic dùng trực tiếp, đọc `res.data` (quy tắc envelope-typing).
