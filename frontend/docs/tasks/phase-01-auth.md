# Task: Phase 01 — Authentication & Sessions (UC-01)

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-01-auth.md`](../../../../backend/docs/prompts/phase-01-auth.md)
> **Trạng thái Backend**: `COMPLETED`
> **Trạng thái Frontend**: 95% (API thật đã kết nối, DTO/Model/Mapper đầy đủ, giao diện Redesign Scandinavian)
> **Mức độ ưu tiên**: 🧪 **CẦN TEST TAY END-TO-END (VS-1..VS-8)**

---

## 1. Bối cảnh & Mục tiêu

Triển khai luồng xác thực an toàn: Đăng ký Member, Đăng nhập, Token refresh tự động chống race condition bằng Web Locks, Đăng xuất (xóa cookie HttpOnly), và lấy thông tin phiên qua `/users/me`.

---

## 2. Checklist Đã Hoàn Thành
- [x] 4 Endpoints Auth: `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` đã kết nối live.
- [x] Route handlers proxy: `src/app/api/auth/[login,logout,refresh-token,register]/route.ts`.
- [x] Quản lý token: In-memory access token + HttpOnly refresh cookie + rotation.
- [x] Redesign trải nghiệm đăng nhập/đăng ký split 50/50 phong cách Scandinavian cao cấp.
- [x] Unit tests: `auth.mapper.test.ts` pass 12/12 test cases.

---

## 3. Checklist Kịch Bản Test Tay (Manual Test Debt)
Cần khởi động backend `:4000` và chạy các kịch bản:
- [ ] **VS-1**: Đăng ký tài khoản Member mới hợp lệ -> Tự động đăng nhập và chuyển hướng sang onboarding.
- [ ] **VS-2**: Đăng ký với email đã tồn tại -> Báo lỗi `AUTH_EMAIL_EXISTS`.
- [ ] **VS-3**: Đăng nhập với mật khẩu sai -> Báo lỗi thông báo rõ ràng, không tiết lộ user tồn tại hay không.
- [ ] **VS-4**: Đăng nhập thành công -> Lưu session, thanh Header hiển thị avatar và tên người dùng.
- [ ] **VS-5**: Tự động refresh token khi accessToken hết hạn (kiểm tra tab Network không bị gián đoạn thao tác).
- [ ] **VS-6**: Đăng xuất trên thiết bị hiện tại -> Xóa cookie, chuyển về trạng thái khách.
- [ ] **VS-7**: Đăng xuất toàn bộ thiết bị (`allDevices: true`).
- [ ] **VS-8**: Truy cập trang bảo vệ (`/profile`, `/admin`) khi chưa đăng nhập -> Chuyển hướng sang `/login?redirect=...`.
