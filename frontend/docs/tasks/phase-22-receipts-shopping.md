# Task: Phase 22 — Receipt Analysis & Pantry-aware Shopping Gaps

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-22-receipts-shopping.md`](../../../../backend/docs/prompts/phase-22-receipts-shopping.md)
> **Trạng thái Backend**: `NOT_STARTED`
> **Trạng thái Frontend**: `PLANNED`
> **Phụ thuộc**: Phase 10 (Meal Planner), Phase 12 (Food Data), Phase 15 (Storage), Phase 20 (Pantry)
> **Mức độ ưu tiên**: 📋 **KẾ HOẠCH TƯƠNG LAI**

---

## 1. Bối cảnh & Mục tiêu

Quét hóa đơn mua hàng và tối ưu danh sách đi chợ:
1. **Quét hóa đơn siêu thị (Receipt Scan)**:
   - Chụp ảnh hóa đơn mua thực phẩm.
   - AI bóc tách các dòng sản phẩm, khớp với nguyên liệu chuẩn trong Catalog.
   - Người dùng xem lại, chỉnh sửa số lượng và xác nhận cập nhật số dư vào Tủ bếp.
2. **Danh sách đi chợ thông minh (Pantry-aware Shopping Gaps)**:
   - So sánh nguyên liệu cần thiết cho thực đơn tuần (Phase 10) với nguyên liệu hiện có sẵn trong tủ bếp (Phase 20).
   - Chỉ liệt kê số lượng còn thiếu (Missing gaps) cần phải mua, tránh mua thừa gây lãng phí.

---

## 2. Kế hoạch Endpoints Dự Kiến

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| `POST` | `/api/v1/receipt-jobs` | Member | Tải ảnh hóa đơn lên và bắt đầu bóc tách OCR |
| `GET` | `/api/v1/receipt-jobs/:id` | Member | Lấy các dòng sản phẩm bóc tách được |
| `PATCH` | `/api/v1/receipt-jobs/:id/candidates/:candidateId` | Member | Điều chỉnh tên/số lượng hoặc loại bỏ dòng không khớp |
| `POST` | `/api/v1/receipt-jobs/:id/confirm` | Member | Xác nhận nhập các món trên hóa đơn vào Tủ bếp |
| `POST` | `/api/v1/shopping-lists/preview` | Member | Tính toán danh sách nguyên liệu còn thiếu dựa trên tủ bếp |

---

## 3. Checklist Chuẩn Bị Khi Backend READY
- [ ] Xây dựng module `features/receipt` theo 7 tầng scaffold.
- [ ] Giao diện xem lại hóa đơn (`ReceiptInspectionView`): so sánh ảnh hóa đơn bên trái và bảng bóc tách bên phải.
- [ ] Tích hợp tính năng "Đi chợ thông minh" vào màn hình thực đơn `/meal-plans/[id]`:
  - Nút chuyển đổi giữa "Tất cả nguyên liệu" và "Chỉ mua phần còn thiếu".
  - Đánh dấu các món đã có sẵn trong nhà.
