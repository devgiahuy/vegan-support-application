# Implementation Plan: Catalog (danh mục + nguyên liệu)

**Branch**: `003-catalog` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-catalog/spec.md`
**Backend contract**: `/api/v1` — `docs/api/categories.md` + `docs/api/ingredients.md` + `docs/api/catalog-admin.md` + `docs/BACKEND_INTEGRATION.md` §6.4/§8
**Feature owner modules**: `src/features/category` (cây public) + `src/features/ingredient` (tra cứu + resolve) + `src/features/admin-catalog` (quản trị) — admin gộp 2 domain vì cùng màn hình quản trị, tách `category`/`ingredient` public để dùng lại ở nhiều nơi
**Phụ thuộc**: `001-user-auth` (session, `UserRole.ADMIN`, middleware/guard, envelope lỗi), `002-user-profile` (quy tắc envelope-typing trong `ARCHITECTURE.md` §3)

## Summary

Tích hợp 13 endpoint đã `READY` (1 cây public + 2 tra cứu + 10 admin) thành 3 feature folder đúng kiến trúc DTO → Model → Mapper → API → Query. Trọng tâm kỹ thuật:

1. **Public trước, admin sau**: `features/category` (cây 2 tầng + lọc loại) và `features/ingredient` (list phân trang + resolve NONE/EXACT/AMBIGUOUS) là nền cho mọi màn filter sau này; admin là P2.
2. **Admin catalog**: list phân trang (kèm archived), tạo/sửa với ràng buộc cùng-loại/tối đa-2-tầng/slug-duy-nhất, archive mềm + bắt replacement cùng loại/cùng tầng khi đang được dùng, alias thêm/xóa (204 không body).
3. **Metadata nguyên liệu là full snapshot**: PATCH gửi toàn bộ mảng (trường vắng mặt được hiểu là đã xóa) — form phải preload đủ mảng hiện tại.
4. **Phân trang đặc biệt**: list admin/public dùng `meta {page, limit, total, totalPages}` (KHÁC `PaginationMetadata` chung có `totalItems`) — mapper chuẩn hóa về `PaginationResult<T>` dùng chung, không đổi type global.
5. **Áp dụng bài học 002**: generic axios = đúng shape body (DTO envelope đọc `res.data` trực tiếp); branch theo `error.code`; alias so trùng sau normalize (backend làm, frontend chỉ hiển thị lỗi đúng trường).

## Technical Context

**Language/Version**: TypeScript 5.x (strict) trên Next.js 16 (App Router, React 19)

**Primary Dependencies**: Kế thừa `001/002` (Axios, TanStack Query v5, Zustand, react-hook-form + resolvers, zod 4, shadcn/ui, sonner, lucide-react). Không thêm thư viện mới. Debounce tìm kiếm dùng `src/hooks/useDebounce` đã có.

**Storage**: Không persist thêm. Catalog là server-state qua TanStack (staleTime mặc định 1m; cây public ít đổi có thể nâng staleTime ở query options). Không cache trong Zustand.

**Testing**: Vitest mapper test bắt buộc cho 4 mapper mới (category, ingredient, admin-category, admin-ingredient — có thể gộp 2 mapper admin vào file mapper của domain tương ứng); `tsc --noEmit`; `npm run build`. Test tay theo `quickstart.md` với backend `:4000` (cần tài khoản admin seed).

**Target Platform**: Web, trình duyệt hiện đại, UI tiếng Việt.

**Project Type**: Web frontend (single project) — `frontend/` Next.js App Router.

**Performance Goals**: Mở danh mục thấy cây < 3s; tìm nguyên liệu trả kết quả < 2s sau khi gõ xong (debounce ~400ms để tránh spam request).

**Constraints**: Cùng repo governance + quy tắc envelope-typing (ARCHITECTURE §3, bổ sung từ 002). Thêm: không tự quyết khi AMBIGUOUS; không gửi ngày... (không liên quan); resolve query param tên `query` (không phải `q`).

**Scale/Scope**: 3 feature folder, 13 endpoint (1 public tree + 2 public ingredient + 10 admin), 1–2 route mới (`/danh-muc` public tùy chọn + màn admin trong `(admin)` đã có), 0 Route Handler mới.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` vẫn là template chưa ratify. Áp dụng de-facto governance:

| Gate (nguồn) | Yêu cầu | Trạng thái plan |
| --- | --- | --- |
| `AGENTS.md` — chỉ tích hợp `READY` | 13 endpoint §6.4 đều `READY` | PASS |
| `AGENTS.md` — DTO/Model/Mapper/Query/test mỗi consumer | Đủ 7 tầng mỗi consumer | PASS |
| `BACKEND_INTEGRATION.md` §5 mapping | `features/category` + `features/ingredient` (+ admin gộp) | PASS |
| Business-rule safety | Archive/replacement/metadata do backend enforce | PASS |
| RBAC | Admin route + query đều check `ADMIN` đã duyệt | PASS (middleware + AuthGuard đã có) |
| Documentation accuracy | Không mô tả proposal (PLANNED) hay health (không UI) là scope | PASS — loại trừ rõ trong spec |

Không vi phạm → bỏ trống Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/003-catalog/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── category-api.md  # Contract cây public + admin categories
│   ├── ingredient-api.md# Contract list + resolve + admin ingredients/aliases
│   └── catalog-errors.md# Contract mã lỗi catalog + hành vi UI
└── tasks.md             # Phase 2 (/speckit-tasks — không tạo ở bước này)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── common/
│   │   ├── constants/api-endpoints.ts   # SỬA: thêm CATEGORIES, INGREDIENTS, ADMIN_CATALOG
│   │   └── enums/index.ts               # SỬA: CategoryType, CategoryStatus, FoodGroup, IngredientStatus, ResolutionMatch
│   ├── features/category/               # TẠO (public)
│   │   ├── types/{category.dto,category.model}.ts
│   │   ├── mappers/category.mapper.ts (+ .test.ts)
│   │   ├── api/category.api.ts          # getTree(type?)
│   │   ├── queries/category.queries.ts
│   │   └── components/category-tree.tsx
│   ├── features/ingredient/             # TẠO (public)
│   │   ├── types/{ingredient.dto,ingredient.model}.ts
│   │   ├── mappers/ingredient.mapper.ts (+ .test.ts)
│   │   ├── api/ingredient.api.ts        # search + resolve
│   │   ├── queries/ingredient.queries.ts
│   │   └── components/{ingredient-search,resolve-picker}.tsx
│   ├── features/admin-catalog/          # TẠO (admin, gộp 2 domain)
│   │   ├── types/admin-catalog.dto.ts   # request DTO admin (tái dùng Model domain)
│   │   ├── api/admin-catalog.api.ts     # CRUD categories/ingredients/aliases (dùng mapper domain)
│   │   ├── queries/admin-catalog.queries.ts
│   │   ├── schemas/admin-catalog.schema.ts
│   │   └── components/{category-manager,ingredient-manager,alias-editor,replacement-picker}.tsx
│   └── app/
│       ├── (site)/danh-muc/page.tsx     # TẠO (tùy chọn, dùng category-tree) — quyết định ở implement
│       └── (admin)/admin/               # SỬA: thêm mục quản trị catalog (dùng AuthGuard roles ADMIN đã có)
└── docs/
    ├── BACKEND_INTEGRATION.md           # SỬA: FE integrated + changelog
    ├── PROGRESS.md                      # SỬA: task catalog mới hoặc task #4
    └── WORK-LOG.md                      # SỬA: append entry
```

**Structure Decision**: 2 feature public độc lập (`category`, `ingredient`) để màn khác tái dùng; 1 feature admin gộp (`admin-catalog`) vì cùng màn hình + cùng guard, tái dùng Model/Mapper của 2 domain (không định nghĩa lại entity). Không Route Handler mới.

## Complexity Tracking

> Không có vi phạm Constitution Check cần justify.
