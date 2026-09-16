# Phase 0 Research: Catalog

**Feature**: `003-catalog` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Nguồn: `docs/api/categories.md`, `docs/api/ingredients.md`, `docs/api/catalog-admin.md`, `BACKEND_INTEGRATION.md` §6.4/§8, bài học envelope-typing từ `002-user-profile` (ARCHITECTURE §3).

Không có `NEEDS CLARIFICATION` trong Technical Context.

---

## R1 — Ba feature folder: 2 public độc lập + 1 admin gộp

**Decision**: `features/category` (cây public), `features/ingredient` (list + resolve), `features/admin-catalog` (CRUD cả hai + alias, tái dùng Model/Mapper của 2 domain, không định nghĩa entity mới).

**Rationale**: Màn filter nội dung sau này chỉ cần `category`/`ingredient` mà không kéo theo code admin; admin gộp vì cùng màn hình, cùng guard, cùng vòng đời.

**Alternatives considered**:
- Mỗi domain tách cả admin riêng (`admin-category`, `admin-ingredient`) → loại, trùng guard/pagination/filter code, màn admin thực tế hiển thị cạnh nhau.
- Gom tất cả vào một `features/catalog` → loại, màn public cần tree gọn nhẹ, không muốn phụ thuộc form admin.

---

## R2 — Constant endpoint (path là hằng số, method ở call site)

**Decision**:
- `CATEGORIES.TREE = '/categories'` (GET, query `type?`).
- `INGREDIENTS.LIST = '/ingredients'` (GET, query `page/limit/q/foodGroup`), `INGREDIENTS.RESOLVE = '/ingredients/resolve'` (GET, query `query` — **chú ý tên param khác `q`**).
- `ADMIN_CATALOG.CATEGORIES.*`: `LIST '/admin/categories'`, `CREATE '/admin/categories'`, `DETAIL(id)`, `UPDATE(id)`, `ARCHIVE(id)` (cùng path `/admin/categories/:id`, khác method).
- `ADMIN_CATALOG.INGREDIENTS.*`: tương tự + `ALIASES(id)` `/admin/ingredients/:id/aliases` và `ALIAS(id, aliasId)`.

**Rationale**: Một path một constant; method nằm ở call site (tiếp nối R2 của 002).

---

## R3 — Phân trang catalog khác type chung: mapper chuẩn hóa, không đổi global

**Decision**: Response list catalog dùng `meta {page, limit, total, totalPages}` (không có `totalItems`, không có `hasNextPage`). Mapper (`toPaginationModel` viết riêng trong category/ingredient mapper) ánh xạ: `page→page`, `limit→limit`, `total→totalItems`, `totalPages→totalPages`, suy ra `hasNextPage = page < totalPages`, `hasPrevPage = page > 1` — trả đúng `PaginationResult<T>` dùng chung.

**Rationale**: `src/types/api.ts` là contract chung đã ổn định (profile/diet đang dùng); đổi global để vừa 1 feature là sai hướng. Chuẩn hóa ở mapper là đúng chỗ (Mapper Layer cô lập biến thể BE).

**Alternatives considered**: Thêm `PaginationMetadataV2` global → loại, nhân bản type cho khác biệt nhỏ; dùng raw meta ở component → loại, vi phạm "component chỉ nhận Model".

---

## R4 — Resolve: 3 trạng thái, AMBIGUOUS luôn hiện picker

**Decision**: `IngredientResolution` model `{ query, normalizedQuery, match: NONE|EXACT|AMBIGUOUS, candidates: Ingredient[] }`. Component `ResolvePicker`: NONE → empty + gợi ý; EXACT → highlight 1 kết quả (vẫn cho xem); AMBIGUOUS → danh sách ứng viên bắt buộc chọn (radio), không tự chọn hộ. Debounce input ~400ms dùng `useDebounce` đã có; query `enabled` khi từ khóa trim ≥ 2 ký tự.

**Rationale**: Đúng FR-003 và cảnh báo BACKEND_INTEGRATION ("ambiguous luôn trả candidates" — frontend phải hiện picker).

**Alternatives considered**: Tự chọn candidate đầu khi AMBIGUOUS → loại, vi phạm spec và gây sai dây chuyền (dị ứng/công thức).

---

## R5 — Metadata ingredient là full snapshot: form preload đủ mảng

**Decision**: Form ingredient tải sẵn toàn bộ `allergenCodes`, `dietCompatibilities`, `traditionWarnings` hiện tại vào state; mọi chỉnh sửa (thêm/xóa/sửa phần tử) thao tác trên mảng đầy đủ rồi gửi trọn khi save. Không có chế độ "chỉ gửi field đổi" cho 3 mảng này (chỉ `canonicalName/foodGroup/status` mới cho cập nhật từng phần — nhưng để đơn giản và an toàn, form luôn gửi full object).

**Rationale**: Backend coi mảng vắng mặt là đã xóa (BACKEND_INTEGRATION §6.4). Gửi partial sẽ vô tình xóa metadata.

**Alternatives considered**: Gửi partial + merge ở client → loại, client không biết backend đã thay đổi gì, dễ mất dữ liệu.

---

## R6 — Archive + replacement cùng loại/cùng tầng

**Decision**: `CategoryManager`: nút Archive mở `ReplacementPicker` (chọn trong cây active, validate client: cùng `type`, cùng tầng — cha-null hay con — với item bị archive) rồi mới gọi `DELETE /admin/categories/:id?replacementId=...`. Khi backend trả `CATEGORY_REPLACEMENT_REQUIRED` (đang được dùng mà chưa chọn) → mở picker bắt buộc; `INVALID_CATEGORY_REPLACEMENT` → báo và cho chọn lại; `CATEGORY_REPLACEMENT_CONFLICT` → refresh cây rồi chọn lại.

**Rationale**: Đúng §6.4 (replacement cùng type/tầng trong transaction) và §8.

**Alternatives considered**: Gọi DELETE không replacement rồi xử lý lỗi sau → loại, trải nghiệm chắp vá và dễ để catalog rơi vào trạng thái treo.

---

## R7 — Alias: 204 không body, cập nhật lạc quan

**Decision**: `deleteAlias` dùng `api.delete<void>` và không parse body; `onSuccess` invalidate `ADMIN_INGREDIENT_QUERY_KEYS` + list public (alias ảnh hưởng resolve). Thêm alias thì validate trùng ở client (so sánh sau trim+lowercase, cảnh báo normalize) nhưng vẫn để backend quyết định cuối (`INGREDIENT_ALIAS_CONFLICT`).

**Rationale**: 204 không body — parse JSON sẽ crash; optimistic update + invalidate giữ UI đồng bộ.

---

## R8 — RBAC admin: route + query đều chặn

**Decision**: Màn admin bọc `AuthGuard roles={[UserRole.ADMIN]}` (middleware đã chặn `/admin/*` ở Edge); query admin không cần `enabled` theo role (đã ở route bảo vệ) nhưng mutation lỗi `403 FORBIDDEN` vẫn hiện trang "không đủ quyền" thay vì toast chung.

**Rationale**: Hai lớp (Edge + client) theo kiến trúc hiện có; 403 ở màn admin mang nghĩa hết quyền rõ ràng, không phải lỗi hệ thống.

---

## R9 — Public tree: staleTime dài, không auth

**Decision**: `useCategoryTreeQuery(type?)` gọi không cần token (public), `staleTime: 10 * 60 * 1000` (cây ít đổi), `gcTime` mặc định. Không gửi Authorization thủ công — axios tự gắn nếu có (vô hại).

**Rationale**: Cây public dùng ở nhiều màn; cache 10 phút giảm request mà vẫn tươi sau mutation admin (invalidate `CATEGORY_QUERY_KEYS.all`).

---

## R10 — Kiểm thử

**Decision**: Mapper test bắt buộc cho category (tree lồng + thiếu children + enum lạ), ingredient (list meta mapping + resolve 3 trạng thái + alias shape), admin (create/update payload + archive response). `tsc/test/build` là gate. Test tay theo `quickstart.md` với tài khoản admin seed.

---

## Tổng hợp quyết định

| ID | Quyết định cốt lõi |
| --- | --- |
| R1 | 2 feature public + 1 admin gộp, tái dùng Model/Mapper domain |
| R2 | Constant theo path; chú ý param resolve tên `query` |
| R3 | Chuẩn hóa `meta` catalog về `PaginationResult` ở mapper |
| R4 | AMBIGUOUS bắt buộc picker; debounce 400ms; enabled khi ≥2 ký tự |
| R5 | Metadata form luôn full snapshot (preload đủ mảng) |
| R6 | Archive mở replacement picker cùng loại/cùng tầng trước |
| R7 | DELETE alias 204 không parse body; invalidate cả public |
| R8 | Guard ADMIN 2 lớp; 403 hiện trang quyền |
| R9 | Tree public staleTime 10m, không cần auth |
| R10 | Mapper test + gates + quickstart thủ công |

Không còn mục nào cần làm rõ thêm.
