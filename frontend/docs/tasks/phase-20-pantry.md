# Task: Phase 20 — Pantry Inventory Management

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-20-pantry.md`](../../../../backend/docs/prompts/phase-20-pantry.md)
> **Trạng thái Backend**: `READY` (2026-09-23)
> **Trạng thái Frontend**: `READY` (Đã hoàn thành 100% Phase 20)
> **Phụ thuộc**: Phase 03 (Catalog), Phase 12 (Food Data), Phase 15 (Storage)
> **Mức độ ưu tiên**: 🎯 **ĐÃ HOÀN TẤT**

---

## 1. Bối cảnh & Mục tiêu

Quản lý kho thực phẩm / Tủ bếp gia đình (Pantry Inventory):
- Ghi nhận danh sách thực phẩm có sẵn trong tủ bếp, số lượng, hạn sử dụng.
- Cảnh báo thực phẩm sắp hết hạn để ưu tiên nấu trước.
- Gộp trùng thực phẩm thông minh (`POST /pantry/merge`).
- Làm đầu vào cho tính năng gợi ý món ăn từ tủ bếp và tối ưu danh sách đi chợ (Phase 22).

---

## 2. Kế hoạch Endpoints Dự Kiến

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| `GET` | `/api/v1/pantry/items` | Member | Danh sách thực phẩm trong tủ bếp của tôi |
| `POST` | `/api/v1/pantry/items` | Member | Thêm nguyên liệu vào tủ bếp |
| `PATCH` | `/api/v1/pantry/items/:id` | Member | Cập nhật số lượng / hạn dùng |
| `DELETE` | `/api/v1/pantry/items/:id` | Member | Xóa nguyên liệu khỏi tủ bếp |
| `POST` | `/api/v1/pantry/merge` | Member | Xem trước và gộp các nguyên liệu trùng lặp |

---

## 3. Checklist Chuẩn Bị Khi Backend READY
- [x] Xây dựng module `features/pantry` theo 7 tầng scaffold.
- [x] Giao diện quản lý tủ bếp tại `/pantry` phân nhóm theo nguồn và trạng thái (Tất cả, Sắp hết hạn).
- [x] Chỉ báo hạn sử dụng dạng thanh màu: Xanh (an toàn), Vàng (sắp hết hạn trong 3 ngày), Đỏ (đã quá hạn).
- [x] Hộp thoại xác nhận gộp nguyên liệu trùng tên và xem trước tính toán.
