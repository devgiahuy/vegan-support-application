# Implementation Plan: FE English Routes Rename

**Branch**: `004-fe-english-routes` | **Date**: 2026-09-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-fe-english-routes/spec.md`

## Summary

Đổi toàn bộ slug trang FE từ tiếng Việt sang tiếng Anh để đồng bộ với tên chức năng backend (recipes, articles, videos, categories, restaurants, meal-plans, assistant, search, profile, verify-otp), giữ UI tiếng Việt. Cách làm: `git mv` thư mục route trong `src/app/(site|auth)`, thêm `redirects()` 308 trong `next.config.ts` cho 20 cặp old→new (giữ query), cập nhật ~96 link (`site-header/footer`, pages, `features/*` components, `router.push`/`redirect`/`form action`), chỉnh `middleware.ts` + login `?from=` về URL mới, xóa alias `/video/upload`, cập nhật canonical/copy-link/sitemap và tài liệu route. Verify bằng grep 0 link cũ + `tsc` + `vitest` + `next build` + kiểm thử tay theo [quickstart.md](./quickstart.md).

## Technical Context

**Language/Version**: TypeScript 5 strict, Next.js 16.2.6 App Router, React 19.2.4

**Primary Dependencies**: Tailwind CSS v4, shadcn/ui (new-york, radix-ui), Axios 1.x (`withCredentials`), TanStack Query v5 (Key Factory), Zustand 5 (client-state), lucide-react, zod + react-hook-form (forms hiện hữu)

**Storage**: N/A ở FE (dữ liệu qua backend PostgreSQL + Prisma qua `/api/v1`; không thêm table/migration trong feature này)

**Testing**: `node node_modules/typescript/bin/tsc --noEmit` (không lỗi mới), `npm test` (vitest run), `npm run build` (next build), kiểm thử tay theo quickstart + quét grep hồi quy

**Target Platform**: Web browsers desktop/mobile (Next.js SSR + Client Components hiện hữu)

**Project Type**: Web application — frontend-only change, không đổi backend API

**Performance Goals**: Redirect URL cũ → mới dưới 3 giây (SC-002); không 404 cho URL cũ hợp lệ; internal link trỏ thẳng URL mới (không đi vòng redirect)

**Constraints**: UI hiển thị giữ tiếng Việt (ARCHITECTURE.md); không trang mồ côi (mọi route mới có entry point); import duy nhất `@/*`; cấm `any`/`as any`; endpoint BE không đổi (`/api/v1` + `common/constants/api-endpoints.ts` giữ nguyên); redirect 308 bảo toàn query/hash; canonical duy nhất là URL mới

**Scale/Scope**: ~25 `page.tsx` (19 rename + giữ `/`, `/login`, `/onboarding`, `/admin`), 20 redirect rules, ~96 vị trí link trong `src/`, 1 file `next.config.ts`, 1 file `middleware.ts`, header/footer + docs route liên quan

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

> `.specify/memory/constitution.md` hiện là template placeholder (chưa ratify nguyên tắc nào) nên không có gate nào chặn. Các ràng buộc dự án thật nằm ở `AGENTS.md` + `docs/ARCHITECTURE.md` + `docs/BACKEND_INTEGRATION.md`, được kiểm như sau:

- [x] DTO/Model/Mapper: feature không đổi API/BE contract → không thêm/sửa `api/*.api.ts`, không cần mapper mới; nếu chạm API phải kèm mapper (không vi phạm).
- [x] Không `any`, không hard-code BE endpoint trong feature, dùng `@/*` — rename chỉ đổi slug FE, `api-endpoints.ts` giữ nguyên.
- [x] Ưu tiên shadcn/ui, không sửa logic `components/ui/*` — rename không đụng shadcn.
- [x] Orphan-page rule — FR-009 + entry-point contract đảm bảo mỗi route mới có điểm vào; header/footer là điểm vào chính.
- [x] VI UI preserved — FR-007, chỉ đổi slug.
- [x] Auth là UX-only, BE-authoritative — middleware/login chỉ đổi path, không đổi logic phân quyền.
- [x] Docs accuracy — FR-008 cập nhật BACKEND_INTEGRATION mục 5 + ví dụ URL + changelog trong cùng change.
- [x] Verify gates — quickstart bắt buộc `tsc` + `npm test` + `npm run build` + `git diff --check`.

**Post-design re-check (2026-09-16)**: PASS — research/data-model/contracts/quickstart không thêm vi phạm mới; không cần Complexity Tracking (không có violation cần justify).

## Project Structure

### Documentation (this feature)

```text
specs/004-fe-english-routes/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── route-contract.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
frontend/
├── next.config.ts                  # thêm redirects() 308 old→new
├── src/
│   ├── middleware.ts               # matcher + redirect ?from= dùng URL Anh (/profile)
│   ├── app/
│   │   ├── (site)/                 # git mv: cong-thuc→recipes, bai-viet→articles(+tao-moi→new, chinh-sua→edit),
│   │   │   │                      #   video→videos, dang-video→videos/new, dang-cong-thuc→recipes/new,
│   │   │   │                      #   danh-muc→categories, ban-do→restaurants, tim-kiem→search,
│   │   │   │                      #   ho-so→profile, ke-hoach-bua-an→meal-plans(+da-luu→saved), tro-ly-ai→assistant
│   │   │   └── video/upload/       # xóa sau khi redirect → /videos/new
│   │   ├── (auth)/xac-thuc-otp/    # git mv → verify-otp (giữ (auth) layout)
│   │   └── (site)/page.tsx, (auth)/login, (auth)/onboarding, (admin)/admin  # giữ nguyên
│   ├── components/layout/
│   │   ├── site-header.tsx         # NAV_ITEMS + form action + dropdown links → URL Anh
│   │   └── site-footer.tsx         # COLUMNS links → URL Anh
│   ├── features/
│   │   ├── recipe/components/      # recipe-card/detail breadcrumb → /recipes*
│   │   ├── post/components/        # post-card/detail/editor/copy-link → /articles*, /profile?tab=
│   │   ├── restaurant/components/  # detail-view/sheet → /restaurants*
│   │   ├── category/components/    # category-tree → /categories?type=
│   │   └── video/data/             # giữ mock, chỉ đổi link /videos/[id]
│   └── lib/axios.ts                # comment redirectToLoginIfProtected khớp /profile (không đổi logic)
└── docs/
    ├── BACKEND_INTEGRATION.md      # mục 5 + ví dụ URL + changelog
    ├── ARCHITECTURE.md             # ví dụ route orphan-page nếu còn trích URL cũ
    ├── PROGRESS.md + WORK-LOG.md   # cập nhật ở phase implement (không phải plan)
```

**Structure Decision**: Single frontend project (`frontend/`), App Router route-groups giữ nguyên, chỉ rename leaf slugs. Không đổi backend, không migration, không feature-folder rename.

## Complexity Tracking

> Không có violation cần justify — mục này để trống theo template.
