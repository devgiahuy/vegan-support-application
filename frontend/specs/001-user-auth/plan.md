# Implementation Plan: User Auth (register/login/session/logout)

**Branch**: `001-user-auth` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-user-auth/spec.md`
**Backend contract**: `/api/v1` — `docs/api/auth.md` + `docs/BACKEND_INTEGRATION.md` §6.2
**Feature owner module**: `src/features/auth` (theo mapping `BACKEND_INTEGRATION.md` §5)

## Summary

Tích hợp 4 endpoint auth đã `READY` (`POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`) và `GET /users/me` vào frontend theo đúng kiến trúc bắt buộc DTO → Model → Mapper → API → Query. Trọng tâm kỹ thuật:

1. **Chuẩn hoá envelope thật của backend** (`{success,data,meta}` / `{success:false,error:{code,message,fields,requestId}}`) — hiện `src/types/api.ts` và `src/lib/axios.ts` đang giả định envelope phẳng cũ (`message/detail/errors[]`), phải nâng cấp để đọc được `error.code`.
2. **Sửa sai lệch contract hiện có**: endpoint `/auth/refresh` (không phải `/auth/refresh-token`), `GET /users/me` (không phải `/auth/me`), payload login lồng `data.user` + `data.accessToken`, logout có body `{ allDevices }`.
3. **Auth state**: access token chỉ giữ in-memory (`lib/auth-token.ts` + Zustand `partialize`), refresh nằm HttpOnly cookie; silent-refresh khi F5; refresh-queue chống gọi song song; reuse → revoke + logout an toàn.
4. **UI tiếng Việt**: form đăng nhập/đăng ký có validate zod, map lỗi `fields` vào từng input, xử lý đủ loading/error/success; `ACCOUNT_LOCKED`/`ACCOUNT_BANNED` chỉ hiện thông báo lỗi đăng nhập chung (theo Clarifications 2026-09-15).
5. **Ngoài scope tích hợp**: Google OAuth (P3) và khôi phục mật khẩu/OTP — không có endpoint trong contract đã `READY`, chỉ giữ placeholder UI và không đánh dấu hoàn thành.

## Technical Context

**Language/Version**: TypeScript 5.x (strict) trên Next.js 16 (App Router, React 19)

**Primary Dependencies**: Next.js 16, React 19, Tailwind v4 + shadcn/ui (`new-york`/`radix`), Axios 1.x, TanStack Query v5, Zustand 5, react-hook-form + @hookform/resolvers, zod 4, sonner, lucide-react

**Storage**: Không có persistence phía frontend cho session. Access token in-memory; refresh token do backend quản lý qua HttpOnly cookie cùng-domain. Zustand chỉ persist `user` (client-state). Backend dùng PostgreSQL + Prisma (ngoài phạm vi frontend).

**Testing**: Vitest (`npm test`) cho mapper/unit; `npx tsc --noEmit`; `npm run build`. Backend phases không duy trì integration test suite (theo `AGENTS.md`), nên xác thực end-to-end thực hiện thủ công theo `quickstart.md`.

**Target Platform**: Web (trình duyệt hiện đại), Next.js runtime Node.js + Edge middleware. Ngôn ngữ UI: tiếng Việt.

**Project Type**: Web frontend (single project) — `frontend/` Next.js App Router, backend tách riêng.

**Performance Goals**: Đăng nhập/đăng ký phản hồi cảm nhận < 3s (SC-001/SC-002); silent-refresh sau F5 không chặn first paint (AuthProvider render sau hydrate); không phát sinh nhiều hơn 1 request refresh đồng thời khi nhiều request 401 cùng lúc.

**Constraints**: Không `any`/`as any`/`@ts-ignore`; không hardcode URL (dùng `common/constants/api-endpoints.ts`); component không đọc DTO; không đọc `localStorage` trong interceptor/middleware; dùng alias `@/*`; UI ưu tiên shadcn có sẵn.

**Scale/Scope**: 1 feature (`features/auth`), 5 giao diện client (login, register trong tab auth, onboarding placeholder, OTP placeholder, các guard/header dùng chung), ~4 endpoint backend + 2 Next Route Handler proxy. Số màn hình ảnh hưởng: `/login`, `/`, `(site)` header, `(admin)` guard, `/profile`-like protected routes qua `middleware.ts`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` hiện vẫn là template chưa được ratify (`[PROJECT_NAME]`, `[PRINCIPLE_1_NAME]`…). Không có gate dự án để enforce từ constitution. Áp dụng **de-facto governance** của repo làm gate thay thế:

| Gate (nguồn) | Yêu cầu | Trạng thái plan |
| --- | --- | --- |
| `AGENTS.md` — frontend integration mandatory | Chỉ tích hợp endpoint `READY`; mỗi consumer cần tách Request/Response DTO, UI Model, Mapper, API function, Query key/hook, mapper test | PASS — 5 endpoint đều `READY` (2026-09-15); plan tạo đủ 7 tầng |
| `AGENTS.md` — epic/endpoint constant | Mọi path phải ở `common/constants/api-endpoints.ts`, cấm hardcode trong feature | PASS — bước đầu tiên của tasks là cập nhật constant |
| `ARCHITECTURE.md` §2/§3 | DTO/Model/Mapper bắt buộc, `pickField` + `safe*`, cấm `any`, cấm leak DTO | PASS — thiết kế ở data-model.md + contracts/ |
| `ARCHITECTURE.md` §4 | TanStack cho server-state, Zustand chỉ client-state, Key Factory bắt buộc | PASS — `AUTH_QUERY_KEYS` + mutation invalidate |
| Business-rule safety (`AGENTS.md`) | `requestedType` không cấp quyền; chỉ `user.role` đã duyệt là authoritative | PASS — FR-008 + user story 5 phản ánh đúng |
| `BACKEND_INTEGRATION.md` §6.2 | `ACCOUNT_LOCKED`/`ACCOUNT_BANNED` hiển thị lỗi chung, không UI đặc biệt | PASS — Clarifications 2026-09-15 đã chốt option C |
| Documentation accuracy | Không mô tả UI mock là capability backend đã có | PASS — quickstart ghi rõ OAuth/OTP/forgot là placeholder |

Không có vi phạm cần justify → bỏ trống Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-user-auth/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── auth-api.md      # Contract 5 endpoint backend (đã sync)
│   ├── error-envelope.md# Contract envelope lỗi + danh mục error.code frontend xử lý
│   └── route-handlers.md# Contract 2 Next Route Handler proxy (refresh-token, logout)
└── tasks.md             # Phase 2 output (/speckit-tasks — không tạo ở bước này)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                     # shell trang auth (đã có)
│   │   │   ├── login/page.tsx                 # SỬA: nối register thật, bỏ mock, xử lý error.code
│   │   │   ├── onboarding/page.tsx            # GIỮ placeholder (ngoài scope tích hợp)
│   │   │   └── xac-thuc-otp/page.tsx          # GIỮ placeholder (không có endpoint READY)
│   │   └── api/auth/
│   │       ├── refresh-token/route.ts         # SỬA: gọi /auth/refresh, envelope mới
│   │       └── logout/route.ts                # SỬA: nhận {allDevices}, xoá đủ cookie
│   ├── common/
│   │   ├── constants/api-endpoints.ts         # SỬA: AUTH.REFRESH=/auth/refresh, USERS.ME=/users/me
│   │   └── enums/index.ts                     # SỬA: UserRole/MemberStatus/ContributorType/ApplicationStatus
│   ├── components/
│   │   ├── providers/auth-provider.tsx        # SỬA: silent-refresh dùng mapper mới
│   │   └── shared/auth-guard.tsx              # SỬA: role enum mới
│   ├── features/auth/
│   │   ├── types/auth.dto.ts                  # SỬA: AuthSessionResponseDto/UserDto/RegisterRequestDto/...
│   │   ├── types/auth.model.ts                # SỬA: User/AuthSession/ContributorApplication
│   │   ├── mappers/auth.mapper.ts             # SỬA: toModel/toSessionModel + toRegisterDto + error mapping
│   │   ├── mappers/auth.mapper.test.ts        # TẠO: mapper test
│   │   ├── api/auth.api.ts                    # SỬA: register/login/refresh/logout/getMe qua mapper
│   │   ├── queries/auth.queries.ts            # SỬA: Key Factory + register/login/logout/me hooks
│   │   ├── schemas/auth.schema.ts             # SỬA: login/register + contributor request
│   │   ├── hooks/useAuth.ts                   # SỬA: expose register, isRegistering
│   │   └── components/                        # TẠO: auth-error alert, contributor-request-fields
│   ├── lib/
│   │   ├── axios.ts                           # SỬA: đọc error.code envelope lồng, refresh-queue
│   │   ├── api-error.ts                       # SỬA: getApiErrorCode/getApiErrorFields
│   │   └── types/api.ts                       # SỬA: ApiErrorEnvelope, RegisterRequest...
│   └── store/useAuthStore.ts                  # GIỮ (đã đúng mô hình in-memory) — chỉ chỉnh type User
└── docs/
    ├── BACKEND_INTEGRATION.md                 # SỬA: cột FE integrated + changelog
    ├── PROGRESS.md                            # SỬA: % task #1 + lịch sử cập nhật
    └── WORK-LOG.md                            # SỬA: append entry
```

**Structure Decision**: Single Next.js app; feature cô lập trong `src/features/auth`. Không tạo nested project. Mọi thay đổi dùng lại hạ tầng sẵn có (`lib/axios.ts`, `lib/auth-token.ts`, `lib/mapper`, `components/ui`), không thêm thư viện mới.

## Complexity Tracking

> Không có vi phạm Constitution Check cần justify.
