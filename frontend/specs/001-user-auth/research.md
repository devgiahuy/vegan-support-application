# Phase 0 Research: User Auth

**Feature**: `001-user-auth` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Nguồn dữ liệu: `docs/api/auth.md`, `docs/api/users.md`, `docs/BACKEND_INTEGRATION.md` v1.4, `docs/SRS_Vegan_Support_Application.md` FR-U01/BL-01/BL-13, code hiện trạng `src/features/auth`, `src/lib/*`, `src/features/product` (mẫu end-to-end).

Không có `NEEDS CLARIFICATION` trong Technical Context. Các quyết định dưới đây chốt cách triển khai.

---

## R1 — Envelope: nâng cấp `types/api.ts` thay vì viết lớp riêng cho auth

**Decision**: Mở rộng `src/types/api.ts` để mô tả **cả hai** envelope: giữ `APIResponse<T>` tương thích ngược (optional fields) và bổ sung `ApiErrorEnvelope`/`ApiErrorBody` đúng shape backend `{success:false, error:{code,message,fields,requestId}}`. `ErrorResponse` cũ giữ lại (union) để không phá các consumer hiện có, nhưng thêm field `success?: false` và `error?: ApiErrorBody`.

**Rationale**: Envelope là contract chung toàn hệ thống (BACKEND_INTEGRATION §3.1/§3.2), không riêng auth. Sửa 1 nơi lợi cho toàn bộ feature sau (profile, diet, catalog). `APIResponse<T>` hiện khai báo `data?` optional — chấp nhận được vì mapper đã `safe*` và nhận `null|undefined`.

**Alternatives considered**:
- Tạo `features/auth/types/auth-envelope.dto.ts` riêng → loại, vì envelope không phải đặc thù auth và sẽ nhân bản ở mọi feature.
- Đổi thẳng `ErrorResponse` sang shape mới (breaking) → loại, `api-error.ts`/`axios.ts` đang dùng `message`/`detail`/`errors[]`, đổi cứng gây vỡ nhiều luồng ngoài scope.

**Ảnh hưởng**: `src/types/api.ts`, `src/lib/api-error.ts`, `src/lib/axios.ts`.

---

## R2 — Sửa sai lệch endpoint (contract đã `READY`)

**Decision**:
- `API_ENDPOINTS.AUTH.REFRESH` = `/auth/refresh` (thay `/auth/refresh-token`).
- `API_ENDPOINTS.AUTH.ME` → **bỏ**; thêm `API_ENDPOINTS.USERS.ME` = `/users/me`.
- Next Route Handler vẫn tên thư mục `app/api/auth/refresh-token/route.ts` (để không phá client/refresh-queue đang trỏ `/api/auth/refresh-token`), nhưng **gọi backend `/auth/refresh`** trước; giữ candidate `/auth/refresh-token` làm fallback tương thích.
- Route handler logout gọi `${BACKEND_URL}/auth/logout` với body `{ allDevices }` truyền từ client.

**Rationale**: `docs/api/auth.md` và `BACKEND_INTEGRATION.md §6.2` xác nhận `/auth/refresh` và `/users/me`. `/auth/me` hiện tại là endpoint không tồn tại → `getMe()` sẽ 404. Đổi cả hai phía (constant + route handler) trong cùng change để không rơi vào trạng thái nửa vời.

**Alternatives considered**:
- Đổi tên thư mục route handler thành `refresh/route.ts` → loại, phải sửa thêm `lib/axios.ts` + `auth.api.ts` + `auth-provider.tsx` cùng lúc, tăng rủi ro không cần thiết; path Next là chi tiết nội bộ, không phải contract với BE.
- Dùng `/api/v1/...` trực tiếp qua rewrite cho refresh → loại, mất khả năng forward `Set-Cookie` cùng-domain mà Next handler đang đảm nhiệm.

---

## R3 — Logout: proxy nhận scope `allDevices`

**Decision**: `authApi.logout(opts?: { allDevices?: boolean })` → POST `/api/auth/logout` (Next handler) với body `{ allDevices }`; handler forward body đó tới BE; handler xoá cookie `accessToken`, `access_token`, `refreshToken`, `refresh_token` (đủ cả 2 cách đặt tên) và luôn trả 200 ngay cả khi BE down (idempotent).

**Rationale**: `LogoutRequest` trong `docs/api/auth.md` chỉ có `allDevices?: boolean`. `LogoutResponse` trả `{loggedOut:true, scope:'CURRENT'|'ALL_DEVICES'}`. Handler hiện tại chỉ xoá `accessToken`/`refreshToken` và không nhận body → không đạt FR-006 (scope ALL_DEVICES) và có thể để cookie rơi vào tên `access_token`.

**Alternatives considered**: Gọi trực tiếp `api.post('/auth/logout')` từ client → loại, không xoá được cookie do Next/edge đang giữ, khiến middleware vẫn cho qua cho tới khi cookie hết hạn.

---

## R4 — DTO/Model/Mapper: viết lại theo contract thật

**Decision**: Thay toàn bộ DTO/Model hiện có (đang giả định `full_name`, `token`, `refresh_token` trong body) bằng bộ bám OpenAPI:

| Khái niệm | DTO (thô) | Model (sạch) |
| --- | --- | --- |
| User | `UserDto` — `id`, `email`, `displayName`, `avatarUrl?`, `role`, `status`, `createdAt`, `contributorApplication?` (union `object|null`) | `User` — `id`, `email`, `displayName`, `avatarUrl`, `role: UserRole`, `status: MemberStatus`, `createdAt: Date\|null`, `contributorApplication: ContributorApplication\|null`, `initials` (derived) |
| Session (login/register) | `AuthSessionResponseDto` — `{success:true, data:{user, accessToken, accessTokenExpiresAt}, meta:null}` | `AuthSession` — `accessToken`, `accessTokenExpiresAt: Date\|null`, `user: User` |
| Refresh | `RefreshResponseDto` — `{success:true, data:{accessToken, accessTokenExpiresAt}, meta:null}` | `RefreshedToken` — `accessToken`, `accessTokenExpiresAt: Date\|null` |
| Logout | `LogoutResponseDto` — `{success:true, data:{loggedOut:true, scope}, meta:null}` | `LogoutResult` — `scope: 'CURRENT'\|'ALL_DEVICES'` |
| Profile (`GET /users/me`) | `ProfileResponseDto` — `data` = UserDto + `healthProfile`/`dietPreference` (bỏ qua phần ngoài scope) | dùng lại `User` (chỉ map 7 field đầu; phần health/diet để `features/profile` xử lý) |
| Register request | `RegisterRequestDto` | map từ `RegisterFormValues` trong `toRegisterDto` |

Bỏ `refreshToken` khỏi `AuthSession` (backend **không** trả refresh token trong body — chỉ HttpOnly cookie). Thêm `accessTokenExpiresAt` để UI/AuthProvider biết khi nào cần silent-refresh.

**Rationale**: `LoginResponseDto` cũ tìm `['user','userInfo','data']` với `data` là `UserDto` — nhưng thực tế `data` là cả session object → `toModel` sẽ nhận nhầm session thành user và mọi field ra rỗng. Phải tách `toModel` (user) và `toSessionModel` (session) rõ ràng.

**Alternatives considered**: Giữ alias cũ (`full_name`, `token`…) thêm vào candidate list để tương thích → loại, không có backend nào trả các tên đó trong contract hiện tại; giữ lại chỉ tạo code chết và che lỗi mapping.

---

## R5 — Enum canonical (role, status, contributor)

**Decision**: Mở rộng `src/common/enums/index.ts`:

- `UserRole`: `MEMBER`, `CONTRIBUTOR`, `ADMIN` (thay `USER/STAFF` hiện có).
- `MemberStatus`: `ACTIVE`, `LOCKED`, `BANNED`, `DELETED`.
- `ContributorType`: `EXPERIENCED_PRACTITIONER`, `NUTRITION_EXPERT`.
- `ContributorApplicationStatus`: enum string từ backend; `PENDING/APPROVED/REJECTED` (giá trị chưa list đủ trong OpenAPI — mapper dùng `safeEnum` với fallback an toàn, giữ nguyên chuỗi gốc trong model `rawStatus` để hiển thị).

Cập nhật mọi chỗ đang dùng `UserRole.USER`/`UserRole.STAFF`: `middleware.ts` (`ADMIN_ROLES`), `components/shared/auth-guard.tsx`, `store/useAuthStore.ts` (gián tiếp), `auth.mapper.ts`.

**Rationale**: OpenAPI chốt `role: MEMBER|CONTRIBUTOR|ADMIN`, `status: ACTIVE|LOCKED|BANNED|DELETED`. Giữ `USER/STAFF` sẽ khiến `safeEnum` fallback sai vai trò → guard và badge hiển thị lệch.

**Alternatives considered**: Thêm `MEMBER` vào enum cũ mà giữ `USER/STAFF` → loại, tạo hai nguồn chân lý trái nghĩa; `STAFF` không tồn tại trong contract.

**Rủi ro cần xử lý khi code**: `admin` layout và `middleware.ts` đang check `ADMIN` — vẫn khớp. Cần rà lại mọi `UserRole.USER` còn sót để tránh lỗi TS.

---

## R6 — Xử lý lỗi theo `error.code` + thông báo chung cho lock/ban

**Decision**: Thêm vào `lib/api-error.ts`: `getApiErrorCode(error)`, `getApiErrorFields(error)` (đọc `error.error.code`/`error.error.fields`, fallback shape cũ). `lib/axios.ts` đọc `errorData.error?.code` trước khi dùng `errorData.error.message`.

Bảng map code → hành vi UI (theo BACKEND_INTEGRATION §8 + Clarifications 2026-09-15):

| `error.code` | Hành vi frontend |
| --- | --- |
| `INVALID_CREDENTIALS` | Inline error tại form đăng nhập: "Email hoặc mật khẩu không đúng." |
| `ACCOUNT_LOCKED`, `ACCOUNT_BANNED` | **Cùng** thông báo lỗi đăng nhập thất bại chung; **không** CAPTCHA, không đếm ngược thử lại |
| `EMAIL_ALREADY_EXISTS` | Inline error tại field email form đăng ký |
| `VALIDATION_ERROR` | Map `error.fields` vào từng input; fallback alert chung |
| `AUTH_REQUIRED`, `TOKEN_EXPIRED` | Để refresh-queue xử lý; hết khả năng → logout + điều hướng login kèm `from` |
| `INVALID_REFRESH_TOKEN`, `REFRESH_TOKEN_REUSED` | Xoá auth state, toast "Phiên đăng nhập đã hết hạn/đã bị thu hồi", về login |
| `INVALID_ACCESS_TOKEN` | Xoá auth state, yêu cầu đăng nhập lại |
| `ACCOUNT_DELETED`/`DELETED` (nếu gặp) | Hiển thị lỗi chung, không tiết lộ chi tiết |

**Rationale**: FR-009 yêu cầu branch theo code, cấm branch theo text. Clarification chốt option C: lock/ban không có UI riêng.

**Alternatives considered**: Branch theo HTTP status (423/403/409) → loại, dễ sai khi backend đổi status; code ổn định hơn và đã được BACKEND_INTEGRATION chỉ định.

---

## R7 — Auth session lifecycle & refresh queue

**Decision**:
- `authApi.refresh()` gọi Next proxy `/api/auth/refresh-token`, map `RefreshResponseDto` → `RefreshedToken`, trả `accessToken`.
- `AuthProvider` giữ luồng hiện có (F5 → silent-refresh → `getMe`), nhưng dùng mapper mới và chỉ set token khi có giá trị; thất bại im lặng (guest).
- `lib/axios.ts` giữ `failedQueue` + `_retry`, thêm nhánh đọc envelope mới; khi refresh thất bại: `clearAccessToken()`, `useAuthStore.logout()`, toast 1 lần.
- Mutation login gọi `setSession(accessToken, user)`, set query data `me`, invalidate `AUTH_QUERY_KEYS.all`.
- Mutation logout `onSettled`: `logout()` store + `queryClient.clear()` (đúng như hiện tại).

**Rationale**: Cơ chế đã đúng tinh thần ARCHITECTURE §4; chỉ cần đồng bộ với shape mới và tránh ghi đè session bằng dữ liệu rỗng.

**Alternatives considered**: Chuyển hẳn sang Next Route Handler cho login/register (proxy cùng-domain) → loại ở phạm vi này vì rewrite `/api/v1/*` đã giữ cookie cùng-domain; chỉ 2 thao tác cần proxy tường minh (refresh/logout) vì cần xoá cookie phía Next.

---

## R8 — Query keys & hook

**Decision**: `AUTH_QUERY_KEYS = { all: ['auth'], me: () => ['auth','me'] }` (giữ), thêm `useRegisterMutation`. `useCurrentUserQuery` giữ `enabled: !!token`, thêm `staleTime` mặc định và tránh set user khi query trả rỗng (`id` rỗng → bỏ qua). `useAuth()` expose thêm `register`, `isRegistering`.

**Rationale**: Key Factory bắt buộc theo ARCHITECTURE §4. Không cần key riêng cho session vì session là client-state.

**Alternatives considered**: Đặt auth state vào TanStack thay Zustand → loại, token phải in-memory và không persist; ARCHITECTURE §4 chốt Zustand cho token/user.

---

## R9 — Form: schema, contributor request, phạm vi UI

**Decision**:
- `loginSchema`: email + password (giữ).
- `registerSchema`: thêm `displayName` (2–100), `email`, `password` (≥8, có chữ hoa + số), `confirmPassword`, tùy chọn nhóm `wantsContributor` + `requestedType` + `experience` + `referenceLinks`. Khi `wantsContributor = true` thì `experience` bắt buộc và `requestedType` bắt buộc (refine).
- Trang `/login` sửa tab "Tạo tài khoản" để gọi `useRegisterMutation` thật (hiện đang `toast.success` giả) và tự đăng nhập sau khi thành công (backend trả session).
- Tab "Khôi phục" và `/xac-thuc-otp` giữ nguyên dạng placeholder demo (không có endpoint `READY`), ghi nhãn rõ "sắp khả dụng" — **không** đánh dấu hoàn thành.
- Nút Google/Apple giữ `toast.info("sẽ sớm khả dụng")` — P3.

**Rationale**: FR-007 cần đủ field; SRS FR-U01 cho phép optional `contributorRequest`. Không được mô tả demo là capability backend (AGENTS.md documentation accuracy).

**Alternatives considered**: Tách trang `/register` riêng → loại ở slice này để giảm diện tích thay đổi; tab hiện có đủ chỗ và giữ UX liền mạch. Có thể tách ở task sau khi cần deep-link.

---

## R10 — Kiểm thử

**Decision**:
- Thêm `auth.mapper.test.ts` (Vitest) phủ: session lồng `data.user`, số/biến thể `null`, `role/status` lạ → fallback, `contributorApplication` null/object, `toRegisterDto` có/không contributor, và round-trip `toModel`.
- `tsc --noEmit`, `npm test`, `npm run build` là gate bắt buộc trước khi báo xong.
- Test tay end-to-end theo `quickstart.md` với backend local `http://localhost:4000/api/v1`.

**Rationale**: AGENTS.md yêu cầu mapper test cho mỗi consumer; backend không có test suite nên phần tích hợp chỉ xác thực thủ công + type-level.

**Alternatives considered**: Dùng MSW mock HTTP → loại ở phạm vi này vì repo chưa có hạ tầng, thêm mới sẽ vượt scope (có thể cân nhắc ở feature sau).

---

## Tổng hợp quyết định

| ID | Quyết định cốt lõi |
| --- | --- |
| R1 | Nâng `types/api.ts` với `ApiErrorEnvelope` (nested `error`), giữ tương thích ngược |
| R2 | Sửa endpoint: `/auth/refresh`, `/users/me`; route handler proxy trỏ đúng BE |
| R3 | Logout nhận `{allDevices}`, xoá đủ 2 tên cookie, idempotent |
| R4 | Viết lại DTO/Model/Mapper theo contract thật; bỏ refresh token khỏi body model |
| R5 | Enum canonical `MEMBER/CONTRIBUTOR/ADMIN` + `ACTIVE/LOCKED/BANNED/DELETED` |
| R6 | Branch theo `error.code`; lock/ban dùng thông báo đăng nhập chung |
| R7 | Giữ refresh-queue; đồng bộ với envelope + mapper mới |
| R8 | Key Factory + `useRegisterMutation`, tránh ghi user rỗng |
| R9 | Register form thật gồm contributor request tùy chọn; OTP/forgot/OAuth là placeholder |
| R10 | Mapper test + tsc/test/build + quickstart thủ công |

Không còn mục nào cần làm rõ thêm.
