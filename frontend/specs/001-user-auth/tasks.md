---

description: "Task list for feature implementation"
---

# Tasks: User Auth (register/login/session/logout)

**Input**: Design documents from `/specs/001-user-auth/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Repo governance (`AGENTS.md`, `ARCHITECTURE.md` §3, `PROGRESS.md` bước 6) yêu cầu **bắt buộc mapper test** cho mỗi API consumer. Không áp dụng TDD đầy đủ; các test khác chỉ chạy khi được yêu cầu.

**Organization**: Task nhóm theo user story (P1 → P3) để mỗi story có thể implement và kiểm thử độc lập.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Có thể chạy song song (khác file, không phụ thuộc task chưa xong)
- **[Story]**: User story tương ứng (US1..US6)
- Mọi task đều có đường dẫn file cụ thể

## Path Conventions

Repo root làm việc là `frontend/` (AGENTS.md §5). Path trong task ghi theo workspace root `vegan-support-application/` để khớp [plan.md](./plan.md):

- Feature code: `frontend/src/features/auth/**`
- Shared: `frontend/src/common/**`, `frontend/src/lib/**`, `frontend/src/types/**`, `frontend/src/components/**`
- Route handlers: `frontend/src/app/api/auth/**`
- Docs: `frontend/docs/**`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Xác nhận contract đã sẵn sàng và chốt baseline trước khi sửa.

- [X] T001 [P] Chạy `npm run sync:swagger` trong `frontend/` và xác nhận 5 endpoint auth (`POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /users/me`) đều `READY` trong `frontend/docs/BACKEND_INTEGRATION.md` §6.2 và có schema trong `frontend/docs/api/auth.md`, `frontend/docs/api/users.md`. Ghi lại nếu catalog lệch so với plan. → Xong: BE local không chạy nên sync không regenerate (`fetch failed` ở cả `:8080`/`:4000`); catalog đã commit nguyên vẹn (git status sạch), 5 endpoint xác nhận `READY`.
- [X] T002 [P] Chạy baseline trên cây hiện tại: `node node_modules/typescript/bin/tsc --noEmit`, `npm test`, `npm run build`, `npm run lint` trong `frontend/`. Ghi lại lỗi có sẵn (nếu có) để không quy sai cho feature này. → Xong: tsc sạch, test 14/14 pass, build thành công, không lỗi baseline.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Hạ tầng dùng chung mà **mọi** user story phụ thuộc: endpoint constant, enum canonical, envelope lỗi, DTO/Model/Mapper auth.

**⚠️ CRITICAL**: Không bắt đầu user story nào trước khi phase này xong.

- [X] T003 Cập nhật `frontend/src/common/constants/api-endpoints.ts`: đổi `AUTH.REFRESH` từ `/auth/refresh-token` thành `/auth/refresh`, **xoá** `AUTH.ME` (`/auth/me` không tồn tại trong contract), thêm nhánh `USERS: { ME: '/users/me' }`. Cấm hardcode path ở nơi khác. (research R2, contracts/auth-api.md §6)
- [X] T004 Cập nhật `frontend/src/common/enums/index.ts`: `UserRole` = `MEMBER`, `CONTRIBUTOR`, `ADMIN` (bỏ `USER`/`STAFF`); `MemberStatus` = `ACTIVE`, `LOCKED`, `BANNED`, `DELETED`; `ContributorType` = `EXPERIENCED_PRACTITIONER`, `NUTRITION_EXPERT`; `ContributorApplicationStatus` = `PENDING`, `APPROVED`, `REJECTED`; `LogoutScope` = `CURRENT`, `ALL_DEVICES`. Giữ `StatusEnum` cũ nguyên vẹn. (data-model.md §1)
- [X] T005 Mở rộng `frontend/src/types/api.ts`: thêm `ApiErrorBody` = `{ code: string; message: string; fields?: Record<string, unknown>; requestId?: string }` và `ApiErrorEnvelope` = `{ success: false; error: ApiErrorBody }`; thêm tùy chọn `success?: false` + `error?: ApiErrorBody` vào `ErrorResponse` **mà không xoá** các field cũ (`status`, `statusCode`, `title`, `message`, `detail`, `Detail`, `errors`). Không dùng `any`. (research R1, contracts/error-envelope.md §1)
- [X] T006 Cập nhật `frontend/src/lib/api-error.ts`: thêm `getApiErrorCode(error): string | undefined` (đọc `error.response.data.error.code`, fallback `code` phẳng) và `getApiErrorFields(error): Record<string, unknown> | undefined` (đọc `error.fields`); sửa `getApiErrorMessage` để ưu tiên `error.error.message` trước shape cũ. Tuyệt đối **không** branch theo text `message`. (contracts/error-envelope.md §2)
- [X] T007 Cập nhật `frontend/src/lib/axios.ts` response interceptor để đọc envelope lồng: lấy `errorData.error?.code`/`errorData.error?.message` trước `errorData.message`/`detail`; giữ nguyên `failedQueue`, cờ `_retry`, điều kiện bỏ qua `/auth/login`, `/auth/logout`, `/auth/refresh-token`, và toast toàn cục cho 5xx/403/429/network. Không đọc `localStorage`. (research R6/R7)
- [X] T008 Migrate mọi tham chiếu enum cũ `UserRole.USER`/`UserRole.STAFF` sang enum mới tại `frontend/src/middleware.ts` (`ADMIN_ROLES`), `frontend/src/components/shared/auth-guard.tsx`, và bất kỳ file nào `rg "UserRole\." frontend/src` còn sót — đảm bảo `tsc` không lỗi do enum đổi. (research R5) → Xong: chỉ `auth.mapper.ts` dùng `USER` (sửa sang `MEMBER`); `site-header.tsx` dùng `user.name` (sửa sang `displayName`/`initials`); `middleware.ts` giữ string `ADMIN` khớp enum mới; tsc sạch.
- [X] T009 [P] Viết lại `frontend/src/features/auth/types/auth.dto.ts` theo contract thật: `UserDto` (`id`, `email`, `displayName`, `avatarUrl?: string | null`, `role`, `status`, `createdAt`, `contributorApplication?: {...} | null`), `AuthSessionResponseDto` (`{ success: true; data: { user: UserDto; accessToken: string; accessTokenExpiresAt: string }; meta: null }`), `RefreshResponseDto`, `LogoutResponseDto`, `ProfileResponseDto`, `RegisterRequestDto` (gồm `contributorRequest?` với `requestedType`/`experience` bắt buộc khi có), `LoginRequestDto`, `LogoutRequestDto` (`allDevices?`). Bỏ các alias sai (`full_name`, `token`, `refresh_token`, `userInfo`). (data-model.md §3)
- [X] T010 [P] Viết lại `frontend/src/features/auth/types/auth.model.ts`: `User` (`id: string`, `email: string`, `displayName: string`, `avatarUrl: string`, `role: UserRole`, `status: MemberStatus`, `createdAt: Date | null`, `contributorApplication: ContributorApplication | null`, `initials: string`); `ContributorApplication` (`status: ContributorApplicationStatus`, `rawStatus: string`, `requestedType: ContributorType | null`, `requestedTypeLabel: string`); `AuthSession` (`accessToken: string`, `accessTokenExpiresAt: Date | null`, `user: User`) — **không** có `refreshToken`; `RefreshedToken`; `LogoutResult`. (data-model.md §2)
- [X] T011 Viết lại `frontend/src/features/auth/mappers/auth.mapper.ts` (extends `BaseBidirectionalMapper` hoặc `BaseMapper` phù hợp) dùng `pickField` + `safe*` cho **mọi** field theo matrix: `toModel(user)` (fallback `displayName='Người dùng'`, `role=MEMBER`, `status=ACTIVE`, `avatarUrl=''`), `toSessionModel` đọc `data.user` (không nhầm `data` thành user), `toRefreshedTokenModel`, `toLogoutResultModel` (`scope` → `LogoutScope`), `toRegisterDto(RegisterFormValues)`. Không `any`, không leak DTO. (data-model.md §6, research R4)
- [X] T012 [P] Tạo `frontend/src/features/auth/mappers/auth.mapper.test.ts` (Vitest) phủ: session lồng `data.user`; `avatarUrl: null`; `contributorApplication: null` và dạng object; `role`/`status` lạ → fallback an toàn; `createdAt` không hợp lệ → `null`; `toRegisterDto` có/không `contributorRequest`; round-trip `toModel`. (research R10, ARCHITECTURE §3) → Xong: 12/12 test pass.

**Checkpoint**: Foundation ready — các user story P1 có thể bắt đầu.

**Ghi chú implement**: để tránh gãy `tsc` giữa chừng, `auth.api.ts` + `queries/auth.queries.ts` + `hooks/useAuth.ts` + `schemas/auth.schema.ts` đã được viết lại sớm theo đúng nội dung T014/T015/T019/T020/T024/T027/T030 (register/login/refresh/logout/getMe qua mapper, `useRegisterMutation`, schema `displayName` + contributor conditional). Các task US tương ứng sẽ verify thay vì code lại.

---

## Phase 3: User Story 1 - Đăng ký tài khoản Member (Priority: P1) 🎯 MVP

**Goal**: Người dùng mới đăng ký bằng email + mật khẩu + tên hiển thị và được đăng nhập ngay với vai trò Member.

**Independent Test**: Mở `/login` → tab "Tạo tài khoản", submit email mới + mật khẩu hợp lệ + tên hiển thị; thấy tên trên header và vào được route cần đăng nhập. Dùng lại email đó → inline lỗi tại field email.

### Implementation for User Story 1

- [X] T013 [US1] Cập nhật `frontend/src/features/auth/schemas/auth.schema.ts`: `registerSchema` gồm `displayName` (2–100 ký tự), `email` (email hợp lệ), `password` (≥ 8 ký tự, ≥ 1 chữ hoa, ≥ 1 chữ số), `confirmPassword` (khớp `password`), thông điệp tiếng Việt. Giữ `LoginFormValues`/`RegisterFormValues` export. (data-model.md §5 V1–V4) → Đã code sớm ở Foundational (kèm conditional contributor của T034); task này verify schema + `tsc` sạch.
- [X] T014 [US1] Thêm `register(payload)` vào `frontend/src/features/auth/api/auth.api.ts`: `api.post<APIResponse<AuthSessionResponseDto>>(API_ENDPOINTS.AUTH.REGISTER, authMapper.toRegisterDto(values))` → `authMapper.toSessionModel(res.data.data)`, trả `AuthSession`. Không leak DTO; truyền `showErrorToast` phù hợp. (contracts/auth-api.md §1) → Đã code sớm ở Foundational; task này verify.
- [X] T015 [US1] Thêm `useRegisterMutation` vào `frontend/src/features/auth/queries/auth.queries.ts`: `mutationFn: authApi.register`; `onSuccess` gọi `useAuthStore.setSession(session.accessToken, session.user)`, seed `AUTH_QUERY_KEYS.me()` bằng `session.user`, không toast trùng với form. (research R8) → Đã code sớm ở Foundational (kèm `useAuth.register`); task này verify.
- [X] T016 [US1] Tạo `frontend/src/features/auth/components/register-form.tsx`: react-hook-form + `zodResolver(registerSchema)`, hiển thị đủ loading/error/success, map lỗi backend vào input qua `getApiErrorCode`/`getApiErrorFields`: `EMAIL_ALREADY_EXISTS` → field email, `VALIDATION_ERROR` → `fields`. Nút submit disable khi `isPending`, thông điệp tiếng Việt, dùng `components/ui/*`.
- [X] T017 [US1] Nối tab "Tạo tài khoản" trong `frontend/src/app/(auth)/login/page.tsx` với `RegisterForm` thật (bỏ `toast.success` giả hiện tại), sau thành công điều hướng theo `from`/mặc định `/`. Giữ `registerSchema` client validate chặn trước khi gửi request.

**Checkpoint**: User Story 1 hoạt động và kiểm thử độc lập (VS-1 trong quickstart.md).

---

## Phase 4: User Story 2 - Đăng nhập email/mật khẩu (Priority: P1)

**Goal**: Member đăng nhập bằng email/mật khẩu; sai thông tin nhận thông báo chung, không lộ tài khoản tồn tại.

**Independent Test**: Đăng nhập bằng tài khoản đã tạo → vào app; thử sai mật khẩu → inline "Email hoặc mật khẩu không đúng."

### Implementation for User Story 2

- [X] T018 [US2] Xác nhận/giữ `loginSchema` trong `frontend/src/features/auth/schemas/auth.schema.ts` là `email` + `password` với thông điệp tiếng Việt; đảm bảo không có field CAPTCHA. (contracts/auth-api.md §2, research R9)
- [X] T019 [US2] Cập nhật `authApi.login` trong `frontend/src/features/auth/api/auth.api.ts`: `api.post<APIResponse<AuthSessionResponseDto>>(API_ENDPOINTS.AUTH.LOGIN, payload)` → `authMapper.toSessionModel(res.data.data)`. (contracts/auth-api.md §2) → Đã code sớm ở Foundational; task này verify.
- [X] T020 [US2] Cập nhật `useLoginMutation` trong `frontend/src/features/auth/queries/auth.queries.ts`: `setSession(session.accessToken, session.user)`, `queryClient.setQueryData(AUTH_QUERY_KEYS.me(), session.user)`; không ghi session khi `accessToken` rỗng. (research R7/R8) → Đã code sớm ở Foundational; task này verify.
- [X] T021 [US2] Xử lý lỗi đăng nhập theo `error.code` trong `frontend/src/features/auth/components/login-form.tsx` (tách từ `login/page.tsx` nếu cần): `INVALID_CREDENTIALS` (401) → inline "Email hoặc mật khẩu không đúng."; `ACCOUNT_LOCKED` (423) và `ACCOUNT_BANNED` (403) → **chỉ** thông báo lỗi đăng nhập thất bại chung, **không** CAPTCHA, **không** đếm ngược; `VALIDATION_ERROR` → map `fields`. (spec Clarifications 2026-09-15, contracts/error-envelope.md §3)
- [X] T022 [US2] Sau đăng nhập thành công, điều hướng về `from` (query param từ middleware) nhưng chặn open redirect: chỉ chấp nhận path nội bộ bắt đầu bằng `/` và không bắt đầu bằng `//`. (middleware.ts hiện set `?from=`)

**Checkpoint**: US1 và US2 cùng hoạt động độc lập (VS-2).

---

## Phase 5: User Story 3 - Duy trì phiên đăng nhập (Priority: P1)

**Goal**: Phiên được khôi phục sau F5 và tự refresh khi access token hết hạn; refresh reuse/hết hạn → logout an toàn.

**Independent Test**: Đăng nhập, F5 vẫn đăng nhập; xoá access token memory nhưng giữ cookie thì request tiếp theo tự refresh và thành công; xoá refresh cookie thì bị đưa về `/login` kèm toast.

### Implementation for User Story 3

- [X] T023 [US3] Sửa `frontend/src/app/api/auth/refresh-token/route.ts`: đổi thứ tự candidate thành `['/auth/refresh', '/auth/refresh-token']` (chỉ fallback 404), forward nguyên văn header `cookie`, forward **mọi** `Set-Cookie` về browser, giữ `502` khi BE down; không log token/cookie. (contracts/route-handlers.md §1)
- [X] T024 [US3] Cập nhật `authApi.refreshToken` trong `frontend/src/features/auth/api/auth.api.ts`: gọi Next proxy `/api/auth/refresh-token` qua axios thô (`baseURL: ''`), map `RefreshResponseDto` → `RefreshedToken` bằng `authMapper.toRefreshedTokenModel`, trả `accessToken`. (contracts/auth-api.md §3) → Đã code sớm ở Foundational; task này verify.
- [X] T025 [US3] Cập nhật refresh-queue trong `frontend/src/lib/axios.ts`: đảm bảo single-flight (nhiều 401 đồng thời chỉ 1 refresh), đọc `accessToken` từ envelope mới, xử lý `INVALID_REFRESH_TOKEN`/`REFRESH_TOKEN_REUSED` → `clearAccessToken()` + `useAuthStore.logout()` + toast 1 lần; không lặp vô hạn. (research R7, contracts/error-envelope.md §3)
- [X] T026 [US3] Cập nhật `frontend/src/components/providers/auth-provider.tsx`: silent-refresh khi memory rỗng, set token + `getMe()` bằng mapper mới; thất bại im lặng giữ guest; không render nháy màn hình login. (research R7)
- [X] T027 [US3] Cập nhật `authApi.getMe` + `useCurrentUserQuery` (`auth.api.ts`, `auth.queries.ts`) sang `API_ENDPOINTS.USERS.ME` = `/users/me`; query `enabled` khi có token; bỏ qua set user khi `id` rỗng để tránh ghi đè session bằng dữ liệu rỗng. (contracts/auth-api.md §5) → Đã code sớm ở Foundational; task này verify.
- [X] T028 [US3] Cập nhật `frontend/src/components/shared/auth-guard.tsx` dùng `UserRole` mới và giữ luồng redirect `/login?from=`; xác nhận `frontend/src/middleware.ts` vẫn chặn route bảo vệ theo cookie + `exp` và chỉ cho `ADMIN` vào `/admin/*`. (research R5)

**Checkpoint**: US3 hoạt động độc lập (VS-3, VS-4).

---

## Phase 6: User Story 4 - Đăng xuất (Priority: P1)

**Goal**: Người dùng đăng xuất phiên hiện tại hoặc tất cả thiết bị, về trạng thái khách.

**Independent Test**: Đăng nhập rồi đăng xuất → header về khách, mở route bảo vệ bị chuyển về `/login`, cookie auth đã xoá.

### Implementation for User Story 4

- [X] T029 [US4] Sửa `frontend/src/app/api/auth/logout/route.ts`: nhận body `{ allDevices?: boolean }` và forward tới `${BACKEND_URL}/auth/logout` (thay vì hardcode `{}`); xoá đủ 4 cookie `accessToken`, `access_token`, `refreshToken`, `refresh_token`; luôn trả `200` idempotent kể cả BE down. (contracts/route-handlers.md §2)
- [X] T030 [US4] Cập nhật `authApi.logout(opts?: { allDevices?: boolean })` trong `frontend/src/features/auth/api/auth.api.ts`: POST `/api/auth/logout` qua axios thô với body scope; giữ fallback hiện có khi BE down; map kết quả qua `authMapper.toLogoutResultModel`. (contracts/auth-api.md §4) → Đã code sớm ở Foundational; task này verify.
- [X] T031 [US4] Cập nhật `useLogoutMutation` trong `frontend/src/features/auth/queries/auth.queries.ts`: `onSettled` → `useAuthStore.logout()` + `queryClient.clear()` + toast "Đã đăng xuất". (research R7)
- [X] T032 [US4] Thêm UI đăng xuất (menu người dùng/header dùng chung) gọi `useLogoutMutation`, có tùy chọn "đăng xuất tất cả thiết bị" khi cần; sau đăng xuất điều hướng về `/`. (FR-006)

**Checkpoint**: US4 hoạt động độc lập (VS-5).

---

## Phase 7: User Story 5 - Đăng ký kèm nguyện vọng Contributor (Priority: P2)

**Goal**: Cho phép gửi nguyện vọng Contributor khi đăng ký, tài khoản vẫn là Member chờ duyệt, không cấp quyền contributor.

**Independent Test**: Bật nguyện vọng, chọn loại + nhập kinh nghiệm → tài khoản `MEMBER`, hồ sơ hiển thị đơn `PENDING`, không có route/menu contributor nào mở.

### Implementation for User Story 5

- [X] T033 [US5] Bổ sung `contributorRequest` vào `RegisterRequestDto` + `toRegisterDto` trong `frontend/src/features/auth/types/auth.dto.ts`, `frontend/src/features/auth/mappers/auth.mapper.ts`: chỉ gửi khi có nguyện vọng; `requestedType` ∈ `EXPERIENCED_PRACTITIONER|NUTRITION_EXPERT`; `experience` bắt buộc ≤ 1000 ký tự; `referenceLinks` lọc phần tử rỗng, mặc định `[]`. (data-model.md §3.1, §5 V5–V6) → Đã code sớm ở Foundational (DTO + mapper + test T012); task này verify.
- [X] T034 [US5] Mở rộng `registerSchema` trong `frontend/src/features/auth/schemas/auth.schema.ts` với `wantsContributor` + `requestedType` + `experience` + `referenceLinks`, dùng `superRefine` để bắt buộc `requestedType`/`experience` khi `wantsContributor = true`. (data-model.md §5 V5) → Đã code sớm ở Foundational; task này verify.
- [X] T035 [US5] Tạo `frontend/src/features/auth/components/contributor-request-fields.tsx`: toggle nguyện vọng, select loại (nhãn tiếng Việt), textarea kinh nghiệm (đếm ≤ 1000), input link tham khảo động; nhận props/`control` từ `RegisterForm`, không gọi API.
- [X] T036 [US5] Tích hợp `ContributorRequestFields` vào `RegisterForm`; hiển thị đơn `PENDING` + `requestedTypeLabel` (từ `User.contributorApplication`) ở nơi phù hợp; thêm kiểm tra bất biến: **không** route/menu/guard nào keyed theo `requestedType` — chỉ `user.role` đã duyệt. (FR-008, data-model.md §2.2)

**Checkpoint**: US5 hoạt động độc lập (VS-6).

---

## Phase 8: User Story 6 - Đăng nhập bằng Google (Priority: P3)

**Goal**: Giữ chỗ UI cho OAuth Google nhưng không triển khai tích hợp (backend chưa có endpoint trong contract đã `READY`).

**Independent Test**: Mở `/login` → nút Google/Apple chỉ thông báo "sẽ sớm khả dụng", không gọi endpoint nào, không vỡ layout; email/password vẫn đầy đủ.

### Implementation for User Story 6

- [X] T037 [US6] Trong `frontend/src/app/(auth)/login/page.tsx`, giữ nút Google/Apple ở dạng placeholder (toast "sẽ sớm khả dụng" / `disabled` rõ ràng), không gọi API, không xử lý callback. (FR-011)
- [X] T038 [US6] Ghi chú ràng buộc P3 trong `frontend/src/features/auth/api/auth.api.ts` (hoặc comment file liên quan): OAuth chờ backend bổ sung endpoint; **không** đánh dấu hoàn thành trong docs và không suy diễn role/quyền từ OAuth. (AGENTS.md documentation accuracy)

**Checkpoint**: US6 chỉ là placeholder — không nghiệm thu như capability backend.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Đồng bộ tài liệu và xác thực cuối.

- [X] T039 [P] Cập nhật `frontend/docs/BACKEND_INTEGRATION.md`: đặt cột `FE integrated` = `Yes` (kèm ngày) cho `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /users/me`; thêm entry changelog nếu behavior/contract thay đổi.
- [X] T040 [P] Cập nhật `frontend/docs/PROGRESS.md`: tăng `%` task #1 (Auth UC-01) theo 7 bước scaffold và append 1 dòng vào bảng "Lịch sử cập nhật".
- [X] T041 [P] Append entry vào `frontend/docs/WORK-LOG.md` theo mẫu (mục tiêu, đã làm, file tạo/sửa, kết quả `tsc`/`npm test`/`build`/test tay, PROGRESS đổi ra sao, còn lại/rủi ro).
- [X] T042 Chạy gate cuối trong `frontend/`: `node node_modules/typescript/bin/tsc --noEmit`, `npm test`, `npm run build`, `npm run lint`, `git diff --check` — tất cả phải sạch. (quickstart.md §2)
- [ ] T043 Chạy xác thực thủ công VS-1 → VS-8 trong `frontend/specs/001-user-auth/quickstart.md` với backend local `http://localhost:4000/api/v1`; ghi lại kết quả từng kịch bản. (quickstart.md §3) → **BLOCKED**: backend local không chạy (`fetch failed` ở cả `:4000`/`:8080`), chưa thể test tay. Làm ngay khi BE chạy.
- [X] T044 [P] Rà soát bất biến kiến trúc bằng `rg`: không `any`/`as any`/`@ts-ignore` trong `frontend/src/features/auth`; không hardcode endpoint (dùng `API_ENDPOINTS`); component không đọc `*Dto`; không cache server-state trong Zustand. (ARCHITECTURE §2/§3, AGENTS.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Không phụ thuộc — chạy ngay.
- **Foundational (Phase 2)**: Phụ thuộc Setup — **CHẶN mọi user story**.
- **User Stories (Phase 3–8)**: Đều phụ thuộc Foundational; sau đó có thể chạy song song hoặc tuần tự theo P1 → P2 → P3.
- **Polish (Phase 9)**: Phụ thuộc các story mong muốn đã xong.

### User Story Dependencies

- **US1 (P1)**: sau Foundational, không phụ thuộc story khác.
- **US2 (P1)**: sau Foundational; dùng chung form/schema với US1 nhưng kiểm thử độc lập.
- **US3 (P1)**: sau Foundational; dùng mapper/query dùng chung, độc lập nghiệm thu.
- **US4 (P1)**: sau Foundational; phụ thuộc state ở US3 để xác thực redirect sau logout.
- **US5 (P2)**: sau Foundational; chạm `auth.dto.ts`/`auth.mapper.ts`/`auth.schema.ts` dùng chung → nên làm sau US1 để tránh xung đột file.
- **US6 (P3)**: sau Foundational; chỉ placeholder.

### Within Each User Story

- Schema/DTO → API → Query → UI → tích hợp.
- US5 sửa lại các file dùng chung ở US1 (không chạy song song với US1).
- Không bắt đầu story mới khi story ưu tiên trước chưa qua checkpoint.

### Parallel Opportunities

- **Setup**: T001, T002 chạy song song.
- **Foundational**: T009 và T010 song song (khác file); T012 song song với các task không phụ thuộc mapper (T003–T008).
- **Polish**: T039, T040, T041, T044 song song (khác file); T042/T043 chạy sau khi code xong.
- **Lưu ý**: T003–T008 cùng chạm file shared nên làm tuần tự; T011 phụ thuộc T009+T010.

---

## Parallel Example: Foundational Phase

```text
# Song song được (khác file):
Task: "T009 Rewrite frontend/src/features/auth/types/auth.dto.ts"
Task: "T010 Rewrite frontend/src/features/auth/types/auth.model.ts"
Task: "T003 Update frontend/src/common/constants/api-endpoints.ts"
Task: "T004 Update frontend/src/common/enums/index.ts"

# Tuần tự (cùng file / phụ thuộc):
Task: "T011 Rewrite frontend/src/features/auth/mappers/auth.mapper.ts"  # cần T009 + T010
Task: "T012 Create frontend/src/features/auth/mappers/auth.mapper.test.ts"  # cần T011
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → Phase 2 Foundational (bắt buộc).
2. Phase 3 US1 (đăng ký) → **STOP & VALIDATE** VS-1.
3. Demo MVP nếu đạt.

### Incremental Delivery

1. Setup + Foundational → nền tảng sẵn sàng.
2. US1 → VS-1 → demo.
3. US2 (đăng nhập) → VS-2 → demo.
4. US3 (giữ phiên) → VS-3/VS-4 → demo.
5. US4 (đăng xuất) → VS-5 → demo.
6. US5 (contributor request) → VS-6.
7. US6 (OAuth placeholder) → VS-8.
8. Polish → VS-7 + gates + docs.

### Parallel Team Strategy

- Set up + Foundational làm chung.
- Sau Foundational: dev A = US1, dev B = US2, dev C = US3/US4 — nhưng US1/US2 cùng chạm `auth.schema.ts`/`login/page.tsx`, cần thống nhất thứ tự; an toàn hơn là US1 → US2 → US3/US4 tuần tự.
- US5 chạm file dùng chung nên làm sau US1.
- Polish chạy song song theo file.

---

## Notes

- [P] = khác file, không phụ thuộc task chưa xong.
- Nhãn [Story] chỉ dùng ở phase user story (Phase 3–8).
- Test bắt buộc duy nhất: mapper test ở T012 (repo governance). Các test khác chỉ thêm khi được yêu cầu.
- Không commit/push khi chưa được yêu cầu (AGENTS.md).
- Điểm dễ sai cần chú ý: `AUTH.ME` cũ (`/auth/me`), `AUTH.REFRESH` cũ, `LoginResponseDto` cũ map nhầm `data`, `UserRole.USER/STAFF` cũ, logout hardcode `{}`.
- Từ nay về sau: flip checkbox trong file này **chỉ bằng Edit tool**, không dùng `Set-Content` PowerShell để tránh hỏng encoding UTF-8.
