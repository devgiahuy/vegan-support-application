# Data Model: User Auth

**Feature**: `001-user-auth` | **Date**: 2026-09-15 | **Sources**: `docs/api/auth.md`, `docs/api/users.md`, [spec.md](./spec.md), [research.md](./research.md)

Quy ước chung (BACKEND_INTEGRATION §3.4): ID là UUID string; timestamp ISO 8601 UTC; enum giữ chuỗi từ backend và map qua `safeEnum` với fallback.

---

## 1. Enum dùng chung (`src/common/enums/index.ts`)

| Enum | Giá trị | Nguồn | Ghi chú |
| --- | --- | --- | --- |
| `UserRole` | `MEMBER`, `CONTRIBUTOR`, `ADMIN` | OpenAPI `ProfileResponse.data.role`, `AuthSessionResponse.data.user.role` | Thay `USER/STAFF` cũ; `requestedType` **không** thuộc enum này |
| `MemberStatus` | `ACTIVE`, `LOCKED`, `BANNED`, `DELETED` | OpenAPI `data.status` | BL-13: `LOCKED` chặn login; `BANNED` chặn mutation; `DELETED` revoke + anonymize |
| `ContributorType` | `EXPERIENCED_PRACTITIONER`, `NUTRITION_EXPERT` | `RegisterRequest.contributorRequest.requestedType` | Chỉ mô tả nguyện vọng, không cấp quyền |
| `ContributorApplicationStatus` | `PENDING`, `APPROVED`, `REJECTED` | Ngữ nghĩa BL-01 | OpenAPI hiện để `_truncated`; mapper dùng `safeEnum` + giữ `rawStatus` |
| `LogoutScope` | `CURRENT`, `ALL_DEVICES` | OpenAPI `LogoutResponse.data.scope` | Tương ứng body `{ allDevices: boolean }` |

---

## 2. Entities (UI Model — dữ liệu sạch cho UI)

### 2.1 `User`

Đại diện người dùng hiện tại. Nguồn: `AuthSessionResponse.data.user` và `ProfileResponse.data`.

| Field | Type | Null | Nguồn DTO | Quy tắc |
| --- | --- | --- | --- | --- |
| `id` | `string` | no | `id` | UUID; rỗng ⇒ coi như không có user hợp lệ |
| `email` | `string` | no | `email` | |
| `displayName` | `string` | no | `displayName` | Fallback `'Người dùng'` nếu rỗng |
| `avatarUrl` | `string` | no (dùng `''`) | `avatarUrl` | DTO có thể `null`; UI tự dùng placeholder |
| `role` | `UserRole` | no | `role` | Fallback `UserRole.MEMBER` |
| `status` | `MemberStatus` | no | `status` | Fallback `MemberStatus.ACTIVE` |
| `createdAt` | `Date \| null` | yes | `createdAt` | |
| `contributorApplication` | `ContributorApplication \| null` | yes | `contributorApplication` | Chỉ dùng để **hiển thị** trạng thái đơn |
| `initials` | `string` | no | derived | 1–2 ký tự đầu của `displayName` cho avatar fallback |

Quy tắc bất biến:
- `role` **chỉ** đến từ backend; `contributorApplication.requestedType` không bao giờ được dùng để mở route/quyền (FR-008).
- `GET /users/me` trả thêm `healthProfile`, `dietPreference` — thuộc `features/profile`/`features/diet-preferences`, **không** đưa vào `User` ở slice này.

### 2.2 `ContributorApplication` (model con)

| Field | Type | Null | Nguồn | Quy tắc |
| --- | --- | --- | --- | --- |
| `status` | `ContributorApplicationStatus` | no | `status` | Fallback `PENDING` |
| `rawStatus` | `string` | no | `status` | Chuỗi gốc để hiển thị an toàn khi status lạ |
| `requestedType` | `ContributorType \| null` | yes | `requestedType` | Hiển thị nhãn tiếng Việt |
| `requestedTypeLabel` | `string` | no | derived | "Người thực hành có kinh nghiệm" / "Chuyên gia dinh dưỡng" |

### 2.3 `AuthSession`

Kết quả của đăng nhập/đăng ký. Nguồn: `AuthSessionResponse.data`.

| Field | Type | Null | Nguồn DTO | Ghi chú |
| --- | --- | --- | --- | --- |
| `accessToken` | `string` | no | `accessToken` | Lưu in-memory qua `auth-token.ts`; **không** persist |
| `accessTokenExpiresAt` | `Date \| null` | yes | `accessTokenExpiresAt` | Dùng để quyết định refresh sớm |
| `user` | `User` | no | `user` | |

> Refresh token **không** nằm trong model — backend chỉ đặt HttpOnly cookie.

### 2.4 `RefreshedToken`

Nguồn: `RefreshResponse.data`.

| Field | Type | Null |
| --- | --- | --- |
| `accessToken` | `string` | no |
| `accessTokenExpiresAt` | `Date \| null` | yes |

### 2.5 `LogoutResult`

Nguồn: `LogoutResponse.data`.

| Field | Type | Null |
| --- | --- | --- |
| `loggedOut` | `boolean` | no (luôn true theo schema) |
| `scope` | `LogoutScope` | no |

---

## 3. Request payloads

### 3.1 `RegisterRequestDto` → `POST /auth/register`

| Field | Type | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| `email` | `string` (email) | yes | Validate zod |
| `password` | `string` | yes | ≥ 8 ký tự, ≥1 chữ hoa, ≥1 số (SRS FR-U01) |
| `displayName` | `string` | yes | 2–100 ký tự |
| `contributorRequest` | `object` | no | Chỉ gửi khi user bật nguyện vọng |
| `contributorRequest.requestedType` | `ContributorType` | yes khi có `contributorRequest` | |
| `contributorRequest.experience` | `string` | yes khi có `contributorRequest` | ≤ 1000 ký tự (SRS FR-U05a) |
| `contributorRequest.referenceLinks` | `string[]` | no | Mặc định `[]` |

### 3.2 `LoginRequestDto` → `POST /auth/login`

| Field | Type | Bắt buộc |
| --- | --- | --- |
| `email` | `string` (email) | yes |
| `password` | `string` | yes |

### 3.3 `LogoutRequestDto` → `POST /auth/logout`

| Field | Type | Bắt buộc |
| --- | --- | --- |
| `allDevices` | `boolean` | no (mặc định `false` = CURRENT) |

---

## 4. State transitions

### 4.1 Session lifecycle (client + backend)

```text
Guest
  │ login/register thành công
  ▼
Authenticated (accessToken in-memory, refresh HttpOnly cookie)
  │ access token hết hạn + refresh còn hạn  →  silent refresh (rotation)  →  Authenticated
  │ refresh hết hạn / invalid / reused      →  Logout (clear memory + Zustand; toast)
  │ user bấm đăng xuất (CURRENT/ALL_DEVICES) →  Logout
  ▼
Guest
```

Điều kiện bất biến khi refresh: mọi request 401 cùng lúc chỉ tạo **một** refresh call; request chờ được giải phóng sau đó; `_retry` chặn vòng lặp vô hạn.

### 4.2 Contributor application (chỉ hiển thị ở slice này)

```text
(không có đơn) ──register kèm contributorRequest──▶ PENDING
PENDING ──admin approve──▶ APPROVED   (tài khoản role → CONTRIBUTOR; ngoài scope slice)
PENDING ──admin reject──▶ REJECTED    (apply lại sau 30 ngày; ngoài scope slice)
```

Frontend **không** thực hiện transition nào ở 4.2; chỉ đọc và render.

---

## 5. Validation rules

| # | Rule | Nơi enforce |
| --- | --- | --- |
| V1 | `email` đúng định dạng; không rỗng | zod client + backend |
| V2 | `password` ≥ 8, ≥ 1 chữ hoa, ≥ 1 số | zod client + backend |
| V3 | `confirmPassword === password` | zod client |
| V4 | `displayName` 2–100 ký tự | zod client + backend |
| V5 | Nếu bật nguyện vọng contributor: `requestedType` và `experience` bắt buộc, `experience` ≤ 1000 | zod client + backend |
| V6 | `referenceLinks` là danh sách URL không rỗng (bỏ phần tử rỗng trước khi gửi) | zod client + backend |
| V7 | Lỗi `VALIDATION_ERROR` từ backend map theo `error.fields` vào đúng input | form layer |

---

## 6. DTO ↔ Model mapping matrix

| Model field | `pickField` candidates | `safe*` helper | Fallback |
| --- | --- | --- | --- |
| `User.id` | `['id']` | `safeString` | `''` |
| `User.email` | `['email']` | `safeString` | `''` |
| `User.displayName` | `['displayName', 'display_name']` | `safeString` | `'Người dùng'` |
| `User.avatarUrl` | `['avatarUrl', 'avatar_url']` | `safeString` | `''` |
| `User.role` | `['role']` | `safeEnum(UserRole)` | `UserRole.MEMBER` |
| `User.status` | `['status']` | `safeEnum(MemberStatus)` | `MemberStatus.ACTIVE` |
| `User.createdAt` | `['createdAt', 'created_at']` | `safeDate` | `null` |
| `User.contributorApplication` | `['contributorApplication', 'contributor_application']` | object guard + nested mapper | `null` |
| `ContributorApplication.status` | `['status']` | `safeEnum` | `PENDING` |
| `ContributorApplication.requestedType` | `['requestedType', 'requested_type']` | `safeEnum` | `null` |
| `AuthSession.accessToken` | `['accessToken', 'access_token']` | `safeString` | `''` |
| `AuthSession.accessTokenExpiresAt` | `['accessTokenExpiresAt', 'access_token_expires_at']` | `safeDate` | `null` |

`toSessionModel` nhận envelope `{ data: { user, accessToken, accessTokenExpiresAt } }` và gọi `toModel(data.user)`. Không dùng alias `refreshToken`/`token`.

---

## 7. Error contract (model hoá nhẹ)

`ApiErrorBody`: `{ code: string; message: string; fields?: Record<string, unknown>; requestId?: string }`. Frontend chỉ đọc `code` và `fields`; `message` chỉ hiển thị fallback. Bảng ánh xạ code → UI nằm ở [research.md](./research.md) R6 và [contracts/error-envelope.md](./contracts/error-envelope.md).
