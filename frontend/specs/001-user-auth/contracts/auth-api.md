# Contract: Auth API (`/api/v1`) — frontend consumer

**Feature**: `001-user-auth` | **Status nguồn**: `BACKEND_INTEGRATION.md` §6.2 — tất cả `READY` (2026-09-15)
**Nguồn schema**: `docs/api/auth.md`, `docs/api/users.md` (đã sync từ OpenAPI). Đây là bản mô tả phía consumer; OpenAPI tại `/api-docs.json` là source of truth.

Base URL: `NEXT_PUBLIC_API_URL` (client, qua axios) — `/api/v1` đã bao gồm, **không** nối thêm.
Endpoint constant: `src/common/constants/api-endpoints.ts` — cấm hardcode path trong feature.
Auth: `withCredentials: true` (refresh HttpOnly cookie). Access token gắn `Authorization: Bearer` từ memory.

---

## 1. `POST /auth/register`

- **Constant**: `API_ENDPOINTS.AUTH.REGISTER`
- **Auth**: public
- **Request**: `RegisterRequestDto` (xem [data-model.md §3.1](../data-model.md))
- **Success** `201`:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "<uuid>",
        "email": "user@example.com",
        "displayName": "Nguyễn Văn A",
        "avatarUrl": null,
        "role": "MEMBER",
        "status": "ACTIVE",
        "createdAt": "2026-09-15T08:30:00.000Z",
        "contributorApplication": { "status": "PENDING", "requestedType": "NUTRITION_EXPERT" }
      },
      "accessToken": "<jwt>",
      "accessTokenExpiresAt": "2026-09-15T08:45:00.000Z"
    },
    "meta": null
  }
  ```
  → Mapper: `authMapper.toSessionModel(res.data.data)` trả `AuthSession`.
  → Hành vi UI: lưu token in-memory + Zustand `setSession`, invalidate/seed `me`, chuyển trang.
- **Errors**:
  | Status | `error.code` | UI |
  | --- | --- | --- |
  | 400 | `VALIDATION_ERROR` / `INVALID_JSON` | Map `error.fields` vào input; không retry tự động |
  | 409 | `EMAIL_ALREADY_EXISTS` | Inline lỗi tại field email |
- **Bất biến**: `user.role` luôn `MEMBER` khi vừa đăng ký dù có `contributorRequest`; `contributorApplication.status` = `PENDING`; token không chứa quyền contributor.

---

## 2. `POST /auth/login`

- **Constant**: `API_ENDPOINTS.AUTH.LOGIN`
- **Auth**: public
- **Request**: `LoginRequestDto` (`email`, `password`)
- **Success** `200`: cùng shape `AuthSessionResponse` như register.
  → `authMapper.toSessionModel` → `AuthSession`.
- **Errors**:
  | Status | `error.code` | UI |
  | --- | --- | --- |
  | 401 | `INVALID_CREDENTIALS` | Inline "Email hoặc mật khẩu không đúng." (không tiết lộ tài khoản tồn tại) |
  | 403 | `ACCOUNT_BANNED` / `FORBIDDEN` | **Thông báo lỗi đăng nhập thất bại chung** (Clarifications 2026-09-15) |
  | 423 | `ACCOUNT_LOCKED` | **Thông báo lỗi đăng nhập thất bại chung**; **không** CAPTCHA, **không** đếm ngược |
- **Side effect**: backend đặt `Set-Cookie` access + refresh (HttpOnly). Response body vẫn chứa `accessToken`.
- **Ghi chú**: `LoginRequest` schema **không** có trường CAPTCHA → không triển khai CAPTCHA (R6/R9).

---

## 3. `POST /auth/refresh`

- **Constant**: `API_ENDPOINTS.AUTH.REFRESH` = `/auth/refresh`
- **Auth**: refresh HttpOnly cookie (không cần Bearer)
- **Request**: không body
- **Success** `200`:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "<jwt>",
      "accessTokenExpiresAt": "2026-09-15T09:00:00.000Z"
    },
    "meta": null
  }
  ```
  → `authMapper.toRefreshedTokenModel(res.data.data)` trả `RefreshedToken`.
- **Rotation**: mỗi lần gọi cấp refresh token mới (BE quyết định). Frontend không đọc/ghi cookie.
- **Errors**:
  | Status | `error.code` | UI |
  | --- | --- | --- |
  | 401 | `INVALID_REFRESH_TOKEN` | Clear auth state, toast "Phiên đăng nhập đã hết hạn", về login |
  | 403 | `REFRESH_TOKEN_REUSED` | Clear auth state, toast "Phiên đã bị thu hồi", về login |
- **Transport**: **luôn** đi qua Next Route Handler `/api/auth/refresh-token` (xem [route-handlers.md](./route-handlers.md)) để forward cookie cùng-domain; `authApi.refresh()` không gọi `/auth/refresh` trực tiếp.

---

## 4. `POST /auth/logout`

- **Constant**: `API_ENDPOINTS.AUTH.LOGOUT` = `/auth/logout`
- **Auth**: Bearer (và refresh cookie)
- **Request**: `LogoutRequestDto` — `{ "allDevices": false }` (mặc định CURRENT)
- **Success** `200`:
  ```json
  { "success": true, "data": { "loggedOut": true, "scope": "CURRENT" }, "meta": null }
  ```
  → `authMapper.toLogoutResultModel`.
- **Idempotent**: gọi lại vẫn 200.
- **Transport**: đi qua Next Route Handler `/api/auth/logout` (xoá cookie phía Next); xem [route-handlers.md](./route-handlers.md).
- **Hành vi UI**: `onSettled` → clear access token memory + `useAuthStore.logout()` + `queryClient.clear()` + toast "Đã đăng xuất".

---

## 5. `GET /users/me` (dùng cho khôi phục/đồng bộ phiên)

- **Constant**: `API_ENDPOINTS.USERS.ME` = `/users/me` (**không** phải `/auth/me`)
- **Auth**: Bearer bắt buộc
- **Success** `200` → `ProfileResponse`; consumer auth chỉ map 7 field user đầu:
  `id`, `email`, `displayName`, `avatarUrl`, `role`, `status`, `createdAt`, `contributorApplication`.
  Phần `healthProfile`/`dietPreference` **không** thuộc slice này (để `features/profile`).
  → `authMapper.toModel(res.data.data)` trả `User`.
- **Errors**: `401 AUTH_REQUIRED` / `403 FORBIDDEN` → interceptor refresh-queue; thất bại ⇒ logout.

---

## 6. Tổng hợp constant cần có

```ts
API_ENDPOINTS.AUTH.REGISTER        // '/auth/register'
API_ENDPOINTS.AUTH.LOGIN           // '/auth/login'
API_ENDPOINTS.AUTH.REFRESH         // '/auth/refresh'   (sửa từ '/auth/refresh-token')
API_ENDPOINTS.AUTH.LOGOUT          // '/auth/logout'
API_ENDPOINTS.USERS.ME             // '/users/me'       (mới; bỏ AUTH.ME '/auth/me')
```

## 7. Definition of Done cho contract này

- [ ] Constant khớp §6, không hardcode path trong `features/auth`.
- [ ] `api/auth.api.ts` typed `APIResponse<...Dto>`, trả `Model`, không leak DTO.
- [ ] Mapper test phủ shape thật (nested `data.user`) + biến thể `null`/kiểu sai.
- [ ] `ACCOUNT_LOCKED`/`ACCOUNT_BANNED` dùng thông báo chung, không UI đặc biệt.
- [ ] `requestedType` không cấp quyền ở bất kỳ đâu (route/guard/menu).
