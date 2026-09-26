# Task: Phase 25 — In-app Notifications (UC-15)

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-25-notifications.md`](../../../../backend/docs/prompts/phase-25-notifications.md)
> **Trạng thái Backend**: `NOT_STARTED`
> **Trạng thái Frontend**: 70% (Đã scaffold 7 tầng, gắn chuông thông báo Header `NotificationBell`, polling 60s stub, dùng fixture)
> **Mức độ ưu tiên**: ⏳ **CHỜ BACKEND READY ĐỂ NỐI LIVE**

---

## 1. Bối cảnh & Mục tiêu

Hệ thống thông báo nội bộ trong ứng dụng (In-app Notifications):
- Thông báo khi bài viết được duyệt/từ chối.
- Thông báo khi có người trả lời bình luận của mình.
- Thông báo khi đơn Contributor có kết quả.
- Chuông thông báo trên thanh điều hướng với huy hiệu đếm số chưa đọc (tối đa `9+`).
- Danh sách thông báo dạng dropdown panel và thao tác "Đánh dấu tất cả đã đọc".

---

## 2. Kế hoạch Endpoints Dự Kiến

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | Member | Lấy danh sách thông báo cá nhân (phân trang) |
| `PATCH` | `/api/v1/notifications/:id/read` | Member (Owner) | Đánh dấu 1 thông báo là đã đọc |
| `PATCH` | `/api/v1/notifications/read-all` | Member | Đánh dấu tất cả thông báo là đã đọc |

---

## 3. Checklist Chuẩn Bị Khi Backend READY
- [ ] Chạy `npm run sync:swagger` để cập nhật schema thông báo.
- [ ] Mở file `src/features/notification/api/notification.api.ts`:
  - Đặt `USE_FIXTURES = false`.
  - Nối axios calls thật với `API_ENDPOINTS.NOTIFICATIONS.*`.
- [ ] Tinh chỉnh cơ chế polling:
  - Giữ polling định kỳ 60s cho thành viên đăng nhập.
  - Tự động tạm dừng polling khi tab trình duyệt bị ẩn (sử dụng `document.hidden` hoặc TanStack Query `refetchIntervalInBackground: false`).
- [ ] Chạy test tay NT-1..NT-3 (kiểm tra chuông nhảy số khi có thông báo mới, bấm đánh dấu đã đọc giảm số đếm).
