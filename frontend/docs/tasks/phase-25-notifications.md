# Task: Phase 25 — In-app Notifications (UC-15)

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-25-notifications.md`](../../../../backend/docs/prompts/phase-25-notifications.md)
> **Trạng thái Backend**: `READY`
> **Trạng thái Frontend**: `COMPLETED` (100% — Đã nối live 4 endpoints, bỏ mock fixture, polling 60s background-paused, optimistic update)
> **Mức độ ưu tiên**: ✅ **HOÀN THÀNH**

---

## 1. Bối cảnh & Mục tiêu

Hệ thống thông báo nội bộ trong ứng dụng (In-app Notifications):
- Thông báo khi bài viết được duyệt/từ chối.
- Thông báo khi có người trả lời bình luận của mình.
- Thông báo khi đơn Contributor có kết quả.
- Chuông thông báo trên thanh điều hướng với huy hiệu đếm số chưa đọc (tối đa `9+`).
- Danh sách thông báo dạng dropdown panel và thao tác "Đánh dấu tất cả đã đọc".

---

## 2. Kế hoạch Endpoints Thực Tế (Backend Phase 25 READY)

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | Member (Owner) | Lấy danh sách thông báo cá nhân (phân trang, newest first) |
| `GET` | `/api/v1/notifications/unread-count` | Member (Owner) | Lấy số đếm thông báo chưa đọc phục vụ chuông header |
| `PATCH` | `/api/v1/notifications/:id/read` | Member (Owner) | Đánh dấu 1 thông báo là đã đọc |
| `PATCH` | `/api/v1/notifications/read-all` | Member (Owner) | Đánh dấu tất cả thông báo là đã đọc |

---

## 3. Checklist Thực Hiện Hoàn Tất
- [x] Đồng bộ OpenAPI schema thông báo vào `docs/API-CATALOG.md` và `docs/api/notifications.md`.
- [x] Mở file `src/features/notification/api/notification.api.ts`:
  - Loại bỏ hoàn toàn mock fixture runtime.
  - Nối axios calls thật với `API_ENDPOINTS.NOTIFICATIONS.*` (`LIST`, `UNREAD_COUNT`, `READ`, `READ_ALL`).
- [x] Cơ chế polling:
  - Tách hook `useUnreadCountQuery` polling định kỳ 60s cho thành viên đăng nhập.
  - Tự động tạm dừng polling khi tab trình duyệt bị ẩn (`refetchIntervalInBackground: false`).
- [x] Cập nhật `notificationMapper` và test suite (14 test cases pass) hỗ trợ đầy đủ các loại thông báo Phase 25.
- [x] Tích hợp lạc quan (optimistic updates) đồng bộ giữa `list` query và `unreadCount` query khi đánh dấu đã đọc.
