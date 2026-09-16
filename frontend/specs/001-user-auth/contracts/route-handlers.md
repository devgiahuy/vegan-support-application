# Contract: Next Route Handlers (proxy auth)

**Feature**: `001-user-auth` | **Nguồn**: `src/app/api/auth/*/route.ts` hiện trạng + `BACKEND_INTEGRATION.md` §2/§6.2
**Mục đích**: giữ cookie HttpOnly cùng-domain và xoá được cookie phía Next (middleware đọc cookie này).

Hai route handler dưới đây là **proxy mỏng**, không chứa business logic (ARCHITECTURE §1).

---

## 1. `POST /api/auth/refresh-token`

**File**: `src/app/api/auth/refresh-token/route.ts`

| Khía cạnh | Contract |
| --- | --- |
| Input | `POST`, không body bắt buộc; cookie `refreshToken`/`refresh_token` từ browser |
| Forward | `POST ${BACKEND_URL}/auth/refresh` với header `cookie` (nguyên văn) và body `{}` |
| Fallback | Thử `/auth/refresh-token` **chỉ khi** candidate đầu trả 404 (giữ tương thích BE cũ) |
| Success | Forward JSON body nguyên vẹn + forward **mọi** `Set-Cookie` (`getSetCookie()` hoặc header `set-cookie`) |
| BE down | Trả `502 { message: 'Không thể làm mới phiên đăng nhập.' }` để axios interceptor hiểu refresh thất bại, không treo queue |
| Không được | Không tự parse/ghi đè token; không thêm business rule; không log token/cookie |

**Thay đổi so với hiện trạng**: danh sách candidate đảo thành `['/auth/refresh', '/auth/refresh-token']` (hiện đang `['/auth/refresh-token', '/auth/refresh']`).

---

## 2. `POST /api/auth/logout`

**File**: `src/app/api/auth/logout/route.ts`

| Khía cạnh | Contract |
| --- | --- |
| Input | `POST`, body tùy chọn `{ allDevices?: boolean }` |
| Forward | `POST ${BACKEND_URL}/auth/logout` với `cookie` gốc + body `{ allDevices }` (**hiện tại đang hardcode `{}`**) |
| Success | Luôn trả `200 { message: 'Đã đăng xuất' }` **bất kể** BE phản hồi gì (idempotent, UX logout phải luôn thành công) |
| Xoá cookie | `accessToken`, `access_token`, `refreshToken`, `refresh_token` (đủ 2 cách đặt tên để khớp `middleware.ts`) |
| BE down | Vẫn xoá cookie phía Next và trả 200 |
| Không được | Không dùng `cookies.delete` cho tên không tồn tại như sự phụ thuộc; không throw ra ngoài |

**Thay đổi so với hiện trạng**: nhận và forward `allDevices`; xoá thêm 2 tên cookie snake_case.

---

## 3. Luồng cookie (bất biến)

1. `login`/`register` đi trực tiếp qua rewrite `/api/v1/*` → BE set cookie cùng-domain.
2. Access token trong memory (`lib/auth-token.ts`) được gắn `Authorization: Bearer`.
3. Khi 401 → `lib/axios.ts` gọi `/api/auth/refresh-token` → handler forward `Set-Cookie` từ BE → browser cập nhật cookie → retry request gốc.
4. `logout` → handler xoá cookie phía Next → middleware thấy hết token → chặn route bảo vệ.

## 4. Definition of Done

- [ ] Refresh handler gọi `/auth/refresh` trước; forward đủ `Set-Cookie`.
- [ ] Logout handler forward `{ allDevices }` và xoá đủ 4 tên cookie.
- [ ] Không rò rỉ token/cookie vào log.
- [ ] Middleware vẫn redirect đúng sau logout (kiểm tra thủ công theo quickstart).
