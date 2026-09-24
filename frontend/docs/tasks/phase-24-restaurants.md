# Task: Phase 24 — Restaurants & Google Maps Integration (UC-12)

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-24-restaurants.md`](../../../../backend/docs/prompts/phase-24-restaurants.md)
> **Trạng thái Backend**: `NOT_STARTED`
> **Trạng thái Frontend**: 70% (Đã scaffold trọn vẹn 7 tầng, giao diện `/restaurants`, tính khoảng cách Haversine, dùng fixture 0 request)
> **Mức độ ưu tiên**: ⏳ **CHỜ BACKEND READY ĐỂ NỐI LIVE & TÍCH HỢP MAPS SDK**

---

## 1. Bối cảnh & Mục tiêu

Khám phá quán ăn chay lân cận:
- Tìm kiếm quán chay theo tọa độ GPS người dùng và bán kính (km).
- Xem chi tiết quán chay: Địa chỉ, giờ mở cửa, mức giá, thực đơn món chay tiêu biểu.
- Thành viên đề xuất quán chay mới (`POST /restaurants`).
- Quản trị viên duyệt quán chay đề xuất trong Admin Dashboard.
- Hiển thị vị trí trực quan trên bản đồ tương tác (Google Maps JavaScript API).

---

## 2. Kế hoạch Endpoints Dự Kiến

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| `GET` | `/api/v1/restaurants/nearby` | Public | Lấy danh sách quán chay theo lat/lng/radius |
| `GET` | `/api/v1/restaurants/search` | Public | Tìm kiếm quán chay theo từ khóa tên/món ăn |
| `GET` | `/api/v1/restaurants/:id` | Public | Chi tiết thông tin quán chay |
| `POST` | `/api/v1/restaurants` | Member | Người dùng đề xuất quán ăn chay mới |
| `GET` | `/api/v1/location/geocode` | Public | Geocoding địa chỉ sang tọa độ qua API backend |
| `GET` | `/api/v1/admin/restaurants` | Admin | Hàng chờ duyệt quán ăn đề xuất |
| `PATCH` | `/api/v1/admin/restaurants/:id/review` | Admin | Phê duyệt hoặc từ chối quán ăn kèm lý do |

---

## 3. Checklist Chuẩn Bị Khi Backend READY
- [ ] Chạy `npm run sync:swagger` kiểm tra contract thật.
- [ ] Mở file `src/features/restaurant/api/restaurant.api.ts`:
  - Đặt `USE_FIXTURES = false`.
  - Thay thế các hàm mô phỏng bằng axios call thật theo `API_ENDPOINTS.RESTAURANTS.*`.
- [ ] Tích hợp Google Maps JavaScript SDK (hoặc MapLibre):
  - Thay thế `MapPlaceholder` bằng component bản đồ thật hiển thị Marker các quán ăn.
  - Tích hợp sự kiện bấm vào Marker -> Mở thẻ tóm tắt quán ăn tương ứng.
- [ ] Chạy test tay RT-1..RT-4 (kiểm tra quyền Geolocation trình duyệt, tìm quán xung quanh 5km).
