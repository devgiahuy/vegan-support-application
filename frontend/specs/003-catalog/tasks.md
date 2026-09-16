---

description: "Task list for feature implementation"
---

# Tasks: Catalog (danh mục + nguyên liệu)

**Input**: Design documents from `/specs/003-catalog/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Repo governance yêu cầu **bắt buộc mapper test** cho mỗi API consumer mới. Không áp dụng TDD đầy đủ; các test khác chỉ chạy khi được yêu cầu.

**Organization**: Task nhóm theo user story (P1 → P2) để mỗi story có thể implement và kiểm thử độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác file, không phụ thuộc task chưa xong)
- **[Story]**: User story tương ứng (US1..US4)
- Mọi task đều có đường dẫn file cụ thể

## Path Conventions

Repo root làm việc là `frontend/` (AGENTS.md §5). Path trong task ghi theo workspace root `vegan-support-application/` để khớp [plan.md](./plan.md):

- Feature code: `frontend/src/features/category/**`, `frontend/src/features/ingredient/**`, `frontend/src/features/admin-catalog/**`
- Shared: `frontend/src/common/**`
- Docs: `frontend/docs/**`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Xác nhận contract sẵn sàng và chốt baseline.

- [X] T001 [P] Chạy `npm run sync:swagger` trong `frontend/` (backend `:4000` chạy được) và xác nhận 13 endpoint catalog (`GET /categories`, `GET /ingredients`, `GET /ingredients/resolve`, 10 endpoint `/admin/*`) đều `READY` trong `frontend/docs/BACKEND_INTEGRATION.md` §6.4 và có schema trong `frontend/docs/api/categories.md`, `frontend/docs/api/ingredients.md`, `frontend/docs/api/catalog-admin.md`.
- [X] T002 [P] Chạy baseline trong `frontend/`: `node node_modules/typescript/bin/tsc --noEmit`, `npm test`, `npm run build`, `npm run lint`. Ghi lại lỗi có sẵn để không quy sai cho feature này (đã biết: lint còn lỗi baseline cũ, 2 blank-line-EOF).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Hạ tầng dùng chung mà **mọi** user story phụ thuộc: constant, enum, DTO/Model/Mapper + test.

**⚠️ CRITICAL**: Không bắt đầu user story nào trước khi phase này xong.

- [X] T003 Cập nhật `frontend/src/common/constants/api-endpoints.ts`: thêm `CATEGORIES: { TREE: '/categories' }`, `INGREDIENTS: { LIST: '/ingredients', RESOLVE: '/ingredients/resolve' }`, `ADMIN_CATALOG: { CATEGORIES: { LIST: '/admin/categories', CREATE: '/admin/categories', DETAIL: (id) => ..., UPDATE: (id) => ..., ARCHIVE: (id) => ... }, INGREDIENTS: { LIST: '/admin/ingredients', CREATE: '/admin/ingredients', DETAIL: (id) => ..., UPDATE: (id) => ..., ARCHIVE: (id) => ..., ALIASES: (id) => ..., ALIAS: (id, aliasId) => ... } }`. Cấm hardcode path ở nơi khác. (research R2)
- [X] T004 Cập nhật `frontend/src/common/enums/index.ts`: thêm `CategoryType` (`FOOD_TYPE`, `RECIPE_GROUP`, `CONTENT_TOPIC`), `CategoryStatus` (`ACTIVE`, `ARCHIVED`), `FoodGroup` (`GRAINS`, `LEGUMES`, `VEGETABLES`, `FRUITS`, `NUTS_SEEDS`, `MUSHROOMS`, `DAIRY_EGGS`, `HERBS_SPICES`, `OTHER`), `IngredientStatus` (`ACTIVE`, `ARCHIVED`), `ResolutionMatch` (`NONE`, `EXACT`, `AMBIGUOUS`). Không sửa enum đã có. (data-model.md §1)
- [X] T005 [P] Tạo `frontend/src/features/category/types/category.dto.ts`: `CategoryDto` (`id?`, `parentId?`, `name?`, `slug?`, `type?`, `status?`, `sortOrder?`, `createdAt?`, `created_at?`, `updatedAt?`, `updated_at?`, `children?: (CategoryDto | null)[] | null`), `CategoryTreeResponseDto` (`{ success?: boolean; data?: (CategoryDto | null)[] | null; meta?: null }`), `AdminCategoryListResponseDto` (`{ success?: boolean; data?: (CategoryDto | null)[] | null; meta?: { page?: number; limit?: number; total?: number; totalPages?: number } | null }`), `CategoryResponseDto` (`{ success?: boolean; data?: CategoryDto | null; meta?: null }`), `CatalogArchiveResponseDto` (`{ success?: boolean; data?: { id?: string; status?: string } | null; meta?: null }`), `CreateCategoryRequestDto` (`{ name: string; type: string; slug?: string; parentId?: string | null; sortOrder?: number }`), `UpdateCategoryRequestDto` (partial, không có `status`). Dùng trực tiếp làm axios generic, đọc `res.data`. (data-model.md §2.1/§3.1, quy tắc envelope-typing)
- [X] T006 [P] Tạo `frontend/src/features/category/types/category.model.ts`: `Category` (`id: string`, `parentId: string | null`, `name: string` fallback `'Danh mục'`, `slug: string`, `type: CategoryType` fallback `FOOD_TYPE`, `typeLabel: string`, `status: CategoryStatus`, `sortOrder: number` fallback `0`, `createdAt: Date | null`, `updatedAt: Date | null`, `children: Category[]` fallback `[]`). (data-model.md §2.1)
- [X] T007 [P] Tạo `frontend/src/features/ingredient/types/ingredient.dto.ts`: `IngredientDto` (đủ 12 field theo schema, toàn optional), `IngredientAliasDto` (`id?`, `aliasId?`, `alias_id?`, `alias?`, `name?`, `value?`), `IngredientListResponseDto` (data mảng + meta catalog), `IngredientResponseDto` (data 1 item), `ResolveResponseDto` (`{ success?: boolean; data?: { query?: string; normalizedQuery?: string; match?: string; candidates?: (IngredientDto | null)[] | null } | null; meta?: null }`), `CreateIngredientRequestDto` (`{ canonicalName: string; foodGroup: string; allergenCodes?: string[]; dietCompatibilities?: Array<{ dietPattern: string; compatible: boolean }>; traditionWarnings?: Array<{ tradition: string; warningCode: string; label: string }> }`), `UpdateIngredientRequestDto` (thêm `status?`). Dùng trực tiếp làm axios generic. (data-model.md §2.2/§3.3)
- [X] T008 [P] Tạo `frontend/src/features/ingredient/types/ingredient.model.ts`: `Ingredient` (đủ 12 field §2.2: `foodGroupLabel`, `aliases: IngredientAlias[]`, `allergenCodes: string[]`, `dietCompatibilities`, `traditionWarnings`, ngày `Date | null`), `IngredientAlias` (`id: string`, `alias: string`), `IngredientResolution` (`query: string`, `normalizedQuery: string`, `match: ResolutionMatch` fallback `NONE`, `candidates: Ingredient[]`). (data-model.md §2.2–§2.4)
- [X] T009 [P] Tạo `frontend/src/features/admin-catalog/types/admin-catalog.dto.ts`: tái export type từ 2 DTO domain để import một nơi (không định nghĩa entity mới); thêm `ArchiveCategoryQuery` (`{ replacementId?: string }`). (research R1)
- [X] T010 Tạo `frontend/src/features/category/mappers/category.mapper.ts` (extends `BaseMapper<CategoryDto, Category>`): `toModel` dùng `pickField` + `safe*` cho mọi field (`parentId` `''` → `null`, `children` đệ quy `toModelList`, thiếu/null → `[]`); `toPaginationModel` viết riêng chuẩn hóa meta catalog (`total→totalItems`, suy `hasNextPage = page < totalPages`, `hasPrevPage = page > 1`) trả đúng `PaginationResult<Category>`; `toTreeModel(dto: CategoryTreeResponseDto)` (data mảng → `toModelList`); `toCreateDto`/`toUpdateDto` (update chỉ gửi field đổi). Không `any`. (data-model.md §6, research R3)
- [X] T011 Tạo `frontend/src/features/ingredient/mappers/ingredient.mapper.ts` (extends `BaseMapper<IngredientDto, Ingredient>`): `toModel` (alias qua `toAliasModel` với candidates `['id','aliasId','alias_id']`/`['alias','name','value']`, compat/warnings giữ nguyên phần tử object đã sanitize); `toPaginationModel` chuẩn hóa meta như category; `toListModel`, `toResolutionModel` (`match` fallback `NONE`, candidates `[]` khi thiếu), `toCreateDto`/`toUpdateDto` (update gửi full snapshot 3 mảng metadata — caller preload đủ). (data-model.md §6, research R5)
- [X] T012 [P] Tạo `frontend/src/features/category/mappers/category.mapper.test.ts` (Vitest): tree 2 tầng lồng đúng; `children: null`/thiếu → `[]`; `type`/`status` lạ → fallback `FOOD_TYPE`/`ACTIVE`; meta `{page,limit,total,totalPages}` → `PaginationResult` đúng (`totalItems`, `hasNextPage/hasPrevPage` suy ra); `toUpdateDto` chỉ gửi field đổi. (research R10)
- [X] T013 [P] Tạo `frontend/src/features/ingredient/mappers/ingredient.mapper.test.ts` (Vitest): item đủ field; alias shape lạ (`name`/`value`, thiếu `id`); resolve đủ 3 trạng thái NONE/EXACT/AMBIGUOUS + candidates null → `[]`; meta mapping; `toUpdateDto` giữ full snapshot mảng. (research R10)

**Checkpoint**: Foundation ready — các user story có thể bắt đầu.

---

## Phase 3: User Story 1 - Duyệt cây danh mục (Priority: P1) 🎯 MVP

**Goal**: Mọi người dùng (kể cả khách) xem cây danh mục 2 tầng, lọc theo loại.

**Independent Test**: Mở trang/khối danh mục không cần đăng nhập, thấy cây cha–con; đổi lọc loại → cây đổi theo; `GET /categories?type=...` 200 trong Network.

### Implementation for User Story 1

- [X] T014 [US1] Tạo `frontend/src/features/category/api/category.api.ts`: `getTree(type?: CategoryType): Promise<Category[]>` qua `api.get<CategoryTreeResponseDto>(API_ENDPOINTS.CATEGORIES.TREE, { params: type ? { type } : {}, silent: true })` → `categoryMapper.toTreeModel(res.data)`. Không leak DTO. (contracts/category-api.md §1)
- [X] T015 [US1] Tạo `frontend/src/features/category/queries/category.queries.ts`: `CATEGORY_QUERY_KEYS = { all: ['categories'], tree: (type?) => [...all, 'tree', type] }`, `useCategoryTreeQuery(type?)` với `staleTime: 10 * 60 * 1000`. Không cần auth. (research R9)
- [X] T016 [US1] Tạo `frontend/src/features/category/components/category-tree.tsx`: nhận `Category[]`, render cây 2 tầng (cha + chip/link con), sắp xếp theo `sortOrder`, filter loại (select 3 loại + tất cả) gọi `onTypeChange`, đủ loading/error/empty/success bằng shared + shadcn, tiếng Việt. Component thuần hiển thị (query ở parent). (FR-001)
- [X] T017 [US1] Tạo `frontend/src/app/(site)/danh-muc/page.tsx`: dùng `useCategoryTreeQuery` + `CategoryTree`, giữ layout site. Nếu trang danh mục đã tồn tại dưới tên khác thì tích hợp vào đó thay vì tạo mới (ghi rõ trong WORK-LOG). (FR-001)

**Checkpoint**: User Story 1 hoạt động và kiểm thử độc lập (VC-1 trong quickstart.md).

---

## Phase 4: User Story 2 - Tra cứu nguyên liệu và phân biệt trùng tên (Priority: P1)

**Goal**: Tìm nguyên liệu (có/không dấu) có phân trang; phân giải rõ NONE/EXACT/AMBIGUOUS, mơ hồ bắt buộc tự chọn.

**Independent Test**: Gõ "dau phong" ra "Đậu phộng"; tên mơ hồ → danh sách ứng viên (không tự quyết); tên bịa → trạng thái không trùng khớp.

### Implementation for User Story 2

- [X] T018 [US2] Tạo `frontend/src/features/ingredient/api/ingredient.api.ts`: `searchIngredients(params: { page?; limit?; q?; foodGroup? }): Promise<PaginationResult<Ingredient>>` qua `api.get<IngredientListResponseDto>(API_ENDPOINTS.INGREDIENTS.LIST, { params, silent: true })` → `toPaginationModel`; `resolveIngredient(query: string): Promise<IngredientResolution>` qua `api.get<ResolveResponseDto>(API_ENDPOINTS.INGREDIENTS.RESOLVE, { params: { query }, silent: true })` → `toResolutionModel` (**chú ý param tên `query`, không phải `q`**). (contracts/ingredient-api.md §1–§2)
- [X] T019 [US2] Tạo `frontend/src/features/ingredient/queries/ingredient.queries.ts`: `INGREDIENT_QUERY_KEYS = { all: ['ingredients'], list: (p) => [...all, 'list', p], resolve: (q) => [...all, 'resolve', q] }`, `useIngredientsQuery(params)`, `useIngredientResolveQuery(query, { enabled: trim.length >= 2 })`. Không cần auth. (research R4)
- [X] T020 [US2] Tạo `frontend/src/features/ingredient/components/ingredient-search.tsx`: ô tìm kiếm (dùng `useDebounce` ~400ms đã có) + lọc nhóm thực phẩm (select 9 nhóm + tất cả) + phân trang (dùng `components/shared/pagination.tsx`) + hiển thị tên chuẩn/nhóm/dị ứng; đủ loading/error/empty/success, tiếng Việt. (FR-002)
- [X] T021 [US2] Tạo `frontend/src/features/ingredient/components/resolve-picker.tsx`: nhận `IngredientResolution` — NONE → empty + gợi ý từ khác; EXACT → highlight 1 kết quả; AMBIGUOUS → radio list ứng viên bắt buộc `onSelect`, **không** tự chọn hộ. (FR-003, research R4)

**Checkpoint**: US1 và US2 cùng hoạt động độc lập (VC-2).

---

## Phase 5: User Story 3 - Admin quản lý danh mục (Priority: P2)

**Goal**: Admin CRUD danh mục (kèm archived), ràng buộc cùng-loại/tối đa-2-tầng, archive qua replacement picker.

**Independent Test**: Đăng nhập admin: tạo con đúng loại → sửa tên → archive kèm replacement → mất khỏi public, còn trong admin list; member vào trang admin bị chặn.

### Implementation for User Story 3

- [X] T022 [US3] Tạo `frontend/src/features/admin-catalog/api/admin-category.api.ts` (phần categories): `listAdminCategories(params): Promise<PaginationResult<Category>>`, `createCategory(payload): Promise<Category>`, `updateCategory(id, payload): Promise<Category>`, `archiveCategory(id, replacementId?): Promise<{ id: string; status: string }>` (DELETE với `params: replacementId ? { replacementId } : {}`) — dùng `categoryMapper`, đọc `res.data` trực tiếp (DTO envelope). (contracts/category-api.md §2–§5)
- [X] T023 [US3] Tạo `frontend/src/features/admin-catalog/queries/admin-category.queries.ts` (phần categories): `ADMIN_CATALOG_QUERY_KEYS = { all: ['admin-catalog'], categories: (p) => [...all, 'categories', p] }`, hooks list/create/update/archive (mutation nào cũng invalidate categories + `CATEGORY_QUERY_KEYS.all` để tree public refresh). `403` ở màn admin hiện trang quyền (không toast hệ thống đè — xử lý ở component). (research R8/R9)
- [X] T024 [US3] Tạo `frontend/src/features/admin-catalog/schemas/category.schema.ts` (phần category): `categoryFormSchema` — `name` (trim, không rỗng), `type` (enum 3 loại, bắt buộc khi tạo), `slug` (optional, rỗng được; nếu nhập phải slug-case `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`), `parentId` (optional, UUID hoặc rỗng), `sortOrder` (nguyên ≥ 0, mặc định 0); refine cùng-loại với cha khi biết cha (truyền `parentType` qua context hoặc validate ở component). Thông điệp tiếng Việt. (data-model.md §5 V1–V4)
- [X] T025 [US3] Tạo `frontend/src/features/admin-catalog/components/category-manager.tsx`: table/list phân trang (dùng shared pagination) + lọc loại/trạng thái + form tạo/sửa (dialog shadcn) + nút Archive; map `VALIDATION_ERROR.fields` + mã catalog (`CATEGORY_SLUG_CONFLICT` → field slug/tên, `CATEGORY_DEPTH_EXCEEDED`, `CATEGORY_TYPE_MISMATCH`, `INVALID_CATEGORY_PARENT`, `INVALID_CATALOG_NAME`) vào đúng chỗ; toast thành công tiếng Việt. (FR-004/FR-005, contracts/catalog-errors.md)
- [X] T026 [US3] Tạo `frontend/src/features/admin-catalog/components/replacement-picker.tsx` (gồm `filterReplacementCandidates` + `ReplacementDialog`): nhận cây active + item bị archive, chỉ list ứng viên cùng `type` và cùng tầng (gốc/con) để chọn `replacementId`; xác nhận → `onConfirm(replacementId)`; xử lý `CATEGORY_REPLACEMENT_REQUIRED` (mở bắt buộc), `INVALID_CATEGORY_REPLACEMENT` (chọn lại), `CATEGORY_REPLACEMENT_CONFLICT` (refresh cây + chọn lại). (FR-006, research R6)
- [X] T027 [US3] Tích hợp `CategoryManager` vào màn admin (+ bọc `AuthGuard ADMIN` toàn trang, xóa mock categories/slug) (`frontend/src/app/(admin)/admin/` — trang/section mới hoặc mở rộng trang hiện có, bọc `AuthGuard roles={[UserRole.ADMIN]}`), giữ layout admin. Ghi rõ vị trí trong WORK-LOG. (FR-009)

**Checkpoint**: US3 hoạt động độc lập (VC-3).

---

## Phase 6: User Story 4 - Admin quản lý nguyên liệu và tên gọi khác (Priority: P2)

**Goal**: Admin CRUD nguyên liệu + metadata full snapshot + alias thêm/xóa (204); public mất item đã archive.

**Independent Test**: Đăng nhập admin: tạo nguyên liệu + metadata → public thấy; trùng tên → báo trùng; sửa xóa 1 mảng metadata → backend hiểu đã xóa; thêm/xóa alias → resolve cập nhật ngay.

### Implementation for User Story 4

- [X] T028 [US4] Mở rộng `frontend/src/features/admin-catalog/api/admin-ingredient.api.ts` (phần ingredients): `listAdminIngredients(params)`, `createIngredient(payload)`, `updateIngredient(id, payload-full-snapshot)`, `archiveIngredient(id)`, `addAlias(id, alias): Promise<Ingredient>`, `deleteAlias(id, aliasId): Promise<void>` (dùng `api.delete<void>`, **không parse body 204**) — dùng `ingredientMapper`, đọc `res.data` trực tiếp. (contracts/ingredient-api.md §3–§8)
- [X] T029 [US4] Mở rộng `frontend/src/features/admin-catalog/queries/admin-ingredient.queries.ts` (phần ingredients): keys `ingredients: (p) => ...`; hooks list/create/update/archive/addAlias/deleteAlias — mutation nào cũng invalidate admin keys + `INGREDIENT_QUERY_KEYS.all` (alias ảnh hưởng resolve public). (research R7)
- [X] T030 [US4] Mở rộng `frontend/src/features/admin-catalog/schemas/ingredient.schema.ts` (phần ingredient): `ingredientFormSchema` — `canonicalName` (trim, không rỗng), `foodGroup` (enum 9 nhóm, bắt buộc khi tạo), `allergenCodes` (mảng string), `dietCompatibilities` (mảng `{dietPattern, compatible}`), `traditionWarnings` (mảng `{tradition, warningCode, label}` không rỗng từng field), `alias` (thêm mới: trim không rỗng). Thông điệp tiếng Việt. (data-model.md §5)
- [X] T031 [US4] Tạo `frontend/src/features/admin-catalog/components/ingredient-manager.tsx`: table phân trang + tìm kiếm + lọc nhóm/trạng thái + form tạo/sửa **preload đủ 3 mảng metadata** (nhấn mạnh: save luôn full snapshot) + nút Archive; map mã lỗi (`INGREDIENT_NAME_CONFLICT` → field tên, `INVALID_INGREDIENT_METADATA`, `CATALOG_REFERENCE_CONFLICT` → refresh + làm lại). (FR-007, research R5)
- [X] T032 [US4] Tạo `frontend/src/features/admin-catalog/components/alias-editor.tsx`: list alias ( chip + nút xóa, xác nhận trước khi xóa) + thêm alias (validate trùng trim+lowercase ở client, cảnh báo normalize); `INGREDIENT_ALIAS_CONFLICT` → báo tại field; xóa xong invalidate ngay (không chờ). (FR-008, research R7)
- [X] T033 [US4] Tích hợp `IngredientManager` (+ `AliasEditor` trong form/detail) vào màn admin cạnh `CategoryManager`, cùng guard ADMIN, giữ layout. Ghi rõ vị trí trong WORK-LOG. (FR-009) → Xong: tab `ingredients` mới trong admin page (dưới guard ADMIN toàn trang từ T027)

**Checkpoint**: US3 và US4 cùng hoạt động độc lập (VC-4).

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Đồng bộ tài liệu và xác thực cuối.

- [X] T034 [P] Cập nhật `frontend/docs/BACKEND_INTEGRATION.md`: đặt `FE integrated` = `Yes` (kèm ngày) cho 13 endpoint catalog (`GET /categories`, 5 admin categories, `GET /ingredients`, `GET /ingredients/resolve`, 5 admin ingredients + 2 alias); thêm entry changelog nếu behavior/contract thay đổi.
- [X] T035 [P] Cập nhật `frontend/docs/PROGRESS.md`: thêm task catalog (hoặc cập nhật task #4 tìm kiếm nếu diet/catalog gắn vào đó) theo 7 bước scaffold + append lịch sử cập nhật.
- [X] T036 [P] Append entry vào `frontend/docs/WORK-LOG.md` theo mẫu (mục tiêu, đã làm, file tạo/sửa, kết quả `tsc`/`npm test`/`build`/test tay, PROGRESS đổi ra sao, còn lại/rủi ro).
- [X] T037 Chạy gate cuối trong `frontend/`: `node node_modules/typescript/bin/tsc --noEmit`, `npm test`, `npm run build`, `npm run lint` (so với baseline T002 — chỉ quan tâm lỗi mới), `git diff --check`. (quickstart.md §2)
- [ ] T038 Chạy xác thực thủ công VC-1 → VC-6 (API-level đã pass hết bằng curl 2026-09-15 — xem WORK-LOG; còn test tay UI) trong `frontend/specs/003-catalog/quickstart.md` với backend local (dùng cả guest + member + admin seed); ghi lại kết quả từng kịch bản. (quickstart.md §3)
- [X] T039 [P] Rà soát bất biến kiến trúc bằng `rg` trong 3 feature mới: không `any`/`as any`/`@ts-ignore`; không hardcode endpoint (dùng `API_ENDPOINTS`); component không đọc `*Dto`; không cache server-state trong Zustand; AMBIGUOUS không tự chọn; không gửi ngày... (không liên quan); rule cứng/dị ứng/kiêng không tắt được (tái dùng từ diet nếu có). (ARCHITECTURE §2/§3, AGENTS.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Không phụ thuộc — chạy ngay.
- **Foundational (Phase 2)**: Phụ thuộc Setup — **CHẶN mọi user story**.
- **User Stories (Phase 3–6)**: Đều phụ thuộc Foundational; sau đó tuần tự P1 → P2 (US3/US4 chạm file `admin-catalog.*` dùng chung nên không song song với nhau).
- **Polish (Phase 7)**: Phụ thuộc các story mong muốn đã xong.

### User Story Dependencies

- **US1 (P1)**: sau Foundational, không phụ thuộc story khác.
- **US2 (P1)**: sau Foundational; độc lập file với US1 → có thể song song nếu đủ người.
- **US3 (P2)**: sau Foundational; nên sau US1 (dùng cây/mapper category chung).
- **US4 (P2)**: sau Foundational; nên sau US2 (dùng mapper/query ingredient chung).

### Within Each User Story

- Schema/DTO → API → Query → UI → tích hợp (đúng scaffold ARCHITECTURE §5).
- Mapper + test xong ở Foundational trước khi story dùng.
- Không bắt đầu story mới khi story ưu tiên trước chưa qua checkpoint.

### Parallel Opportunities

- **Setup**: T001, T002 song song.
- **Foundational**: T005∥T006∥T007∥T008∥T009 (5 file DTO/Model khác nhau); T012∥T013 sau khi mapper tương ứng xong; T003∥T004 song song với nhóm DTO/Model.
- **US3/US4 components**: tách nhỏ hơn nữa nếu cần người song song (form/table/picker khác file).
- **Polish**: T034∥T035∥T036∥T039 (khác file); T037/T038 sau khi code xong.
- **Lưu ý**: T010 cần T005+T006; T011 cần T007+T008; US3/US4 chạm file `admin-catalog.*` dùng chung nên tuần tự.

---

## Parallel Example: Foundational DTO/Model

```text
# Song song được (khác file):
Task: "T005 Create frontend/src/features/category/types/category.dto.ts"
Task: "T006 Create frontend/src/features/category/types/category.model.ts"
Task: "T007 Create frontend/src/features/ingredient/types/ingredient.dto.ts"
Task: "T008 Create frontend/src/features/ingredient/types/ingredient.model.ts"
Task: "T009 Create frontend/src/features/admin-catalog/types/admin-catalog.dto.ts"

# Tuần tự (phụ thuộc):
Task: "T010 Create frontend/src/features/category/mappers/category.mapper.ts"  # cần T005 + T006
Task: "T012 Create frontend/src/features/category/mappers/category.mapper.test.ts"  # cần T010
```

---

## Implementation Strategy

### MVP First (User Stories 1–2)

1. Phase 1 Setup → Phase 2 Foundational (bắt buộc).
2. Phase 3 US1 (cây danh mục) → **STOP & VALIDATE** VC-1.
3. Phase 4 US2 (tra cứu) → VC-2 → demo public catalog.

### Incremental Delivery

1. Setup + Foundational → nền tảng sẵn sàng.
2. US1 → VC-1 → demo.
3. US2 → VC-2 → demo.
4. US3 (admin categories) → VC-3 → demo.
5. US4 (admin ingredients) → VC-4 → demo.
6. Polish → VC-5/VC-6 + gates + docs.

### Parallel Team Strategy

- Setup + Foundational làm chung.
- Sau Foundational: dev A = US1→US3, dev B = US2→US4 (cặp domain song song), dev C = Polish/docs.
- US3/US4 chạm file admin dùng chung → cùng dev hoặc tuần tự.

---

## Notes

- [P] = khác file, không phụ thuộc task chưa xong.
- Nhãn [Story] chỉ dùng ở phase user story (Phase 3–6).
- Test bắt buộc: mapper test ở T012/T013 (repo governance). Các test khác chỉ thêm khi được yêu cầu.
- Không commit/push khi chưa được yêu cầu (AGENTS.md).
- Điểm dễ sai: param resolve tên `query` (không phải `q`); meta catalog `{total}` → map sang `totalItems`; DELETE alias 204 không parse body; PATCH ingredient là full snapshot; generic axios = shape body thật (quy tắc envelope-typing).
- Flip checkbox trong file này **chỉ bằng Edit tool** (không dùng `Set-Content` PowerShell để tránh hỏng encoding UTF-8).
