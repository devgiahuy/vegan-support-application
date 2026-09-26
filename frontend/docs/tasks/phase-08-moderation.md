# Task: Phase 08 — Moderation & Trust Safety (UC-11)

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-08-moderation.md`](../../../../backend/docs/prompts/phase-08-moderation.md)
> **Trạng thái Backend**: `COMPLETED`
> **Trạng thái Frontend**: 95% (Live API kết nối cho Báo cáo, Quản trị Người dùng, Bình luận và Báo cáo vi phạm)
> **Mức độ ưu tiên**: 🧪 **CẦN TEST TAY (MA-1..MA-4 & TS-1..TS-3)**

---

## 1. Bối cảnh & Mục tiêu

Hệ thống kiểm duyệt và an toàn nền tảng:
- Người dùng gửi báo cáo vi phạm đối với bài viết hoặc bình luận không lành mạnh (`POST /reports`).
- Quản trị viên xử lý báo cáo vi phạm gộp theo đối tượng (`PATCH /admin/reports/:id/resolve`).
- Quản trị viên quản lý trạng thái tài khoản: Khóa (`LOCKED`), Cấm (`BANNED`), Mở khóa, Xóa.
- Quản trị viên ẩn hoặc khôi phục bình luận độc hại.
- Người dùng xóa toàn bộ lịch sử hành vi cá nhân hóa (`DELETE /users/me/behavior-history`).

---

## 2. Checklist Đã Hoàn Thành
- [x] Kết nối các endpoints live:
  - `POST /reports`: Báo cáo vi phạm (chặn tự báo cáo bài của mình, chặn báo cáo trùng).
  - `GET /admin/reports`, `PATCH /admin/reports/:id/resolve`: Xử lý báo cáo trong Admin Dashboard.
  - `GET /admin/users`, `PATCH /admin/users/:id/status`: Quản lý trạng thái tài khoản người dùng.
  - `GET /admin/comments`, `PATCH /admin/comments/:id/status`: Kiểm duyệt bình luận.
  - `DELETE /users/me/behavior-history`: Xóa lịch sử hành vi tại tab Bảo mật `/profile`.
- [x] Nút báo cáo `ReportButton` đặt tại bài viết, công thức, video và bình luận.
- [x] Unit tests: `moderation.mapper.test.ts` (12 tests), `safety.mapper.test.ts` (12 tests) pass 100%.

---

## 3. Checklist Kịch Bản Test Tay Cần Chạy
- [ ] **MA-1**: Đăng nhập Member A -> Bấm báo cáo bài viết của Member B kèm lý do -> Gửi thành công.
- [ ] **MA-2**: Member A bấm báo cáo lại bài viết đó -> Hệ thống chặn báo cáo trùng (`REPORT_ALREADY_EXISTS`).
- [ ] **MA-3**: Đăng nhập Admin -> Xem danh sách báo cáo vi phạm -> Giải quyết báo cáo kèm lý do (tối thiểu 10 ký tự).
- [ ] **MA-4**: Admin khóa tài khoản vi phạm -> Tài khoản đó không thể đăng nhập hoặc thao tác.
- [ ] **TS-1**: Thành viên bấm "Xóa lịch sử hành vi" tại tab Bảo mật -> Xác nhận hộp thoại -> Lịch sử được xóa, hệ thống chuyển về cold-start recommendations.
