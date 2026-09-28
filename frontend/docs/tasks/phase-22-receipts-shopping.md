# Task: Phase 22 — Receipt Analysis & Pantry-aware Shopping Gaps

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-22-receipts-shopping.md`](../../../../backend/docs/prompts/phase-22-receipts-shopping.md)
> **Trạng thái Backend**: `READY` (theo `BACKEND_INTEGRATION.md` ngày 2026-09-24)
> **Trạng thái Frontend**: `SPECIFIED & PLANNED` (Spec & Plan tại [`specs/023-receipts-shopping`](../../specs/023-receipts-shopping/))
> **Phụ thuộc**: Phase 10 (Meal Planner), Phase 12 (Food Data), Phase 15 (Storage), Phase 20 (Pantry)
> **Mức độ ưu tiên**: 🎯 **SẴN SÀNG TRIỂN KHAI (Phase 22)**

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

| Method | Endpoint | Quyền | Mục đích | Trạng thái |
|---|---|---|---|---|
| `POST` | `/api/v1/receipt-jobs` | Member | Tải ảnh hóa đơn lên và bắt đầu bóc tách OCR | `READY` |
| `GET` | `/api/v1/receipt-jobs/:id` | Member | Lấy các dòng sản phẩm bóc tách được & tiến trình | `READY` |
| `PATCH` | `/api/v1/receipt-jobs/:id/candidates/:candidateId` | Member | Điều chỉnh tên/số lượng hoặc loại bỏ dòng không khớp | `READY` |
| `POST` | `/api/v1/receipt-jobs/:id/confirm` | Member | Xác nhận nhập các món trên hóa đơn vào Tủ bếp | `READY` |
| `POST` | `/api/v1/receipt-jobs/:id/cancel` | Member | Hủy tác vụ bóc tách hóa đơn chưa xác nhận | `READY` |
| `POST` | `/api/v1/receipt-jobs/:id/retry` | Member | Thử lại bóc tách khi gặp lỗi | `READY` |
| `POST` | `/api/v1/shopping-lists/preview` | Member | Tính toán danh sách nguyên liệu còn thiếu dựa trên tủ bếp | `READY` |

---

## 3. Kế hoạch & Danh sách Task Triển Khai (37 Tasks)

Chi tiết đặc tả và kế hoạch thực thi 7 tầng scaffold đã được biên soạn đầy đủ tại:
- **Feature Spec**: [`specs/023-receipts-shopping/spec.md`](../../specs/023-receipts-shopping/spec.md)
- **Quality Checklist**: [`specs/023-receipts-shopping/checklists/requirements.md`](../../specs/023-receipts-shopping/checklists/requirements.md)
- **Implementation Plan**: [`specs/023-receipts-shopping/plan.md`](../../specs/023-receipts-shopping/plan.md)
- **Tasks Breakdown (37 tasks)**: [`specs/023-receipts-shopping/tasks.md`](../../specs/023-receipts-shopping/tasks.md)

### Tóm tắt các giai đoạn triển khai:
- [ ] **Phase 1: Setup & Foundational**: Endpoints constants, storage `RECEIPT_IMAGE`, DTOs, Clean UI Models, Zod schemas (T001 - T009).
- [ ] **Phase 2: Data Transformation & Testing**: `ReceiptMapper`, `ShoppingGapMapper`, 25+ Vitest tests (T010 - T014).
- [ ] **Phase 3: Network & Polling Layer**: API clients, TanStack Query hooks có polling 2s (T015 - T018).
- [ ] **Phase 4: US1 - Upload & Scan**: Khung upload 1-4 ảnh hóa đơn, progress tracker (T019 - T021).
- [ ] **Phase 5: US2 & US3 - Inspection & Edit**: `ReceiptInspectionView` 2 cột, zoom/pan ảnh, modal sửa dòng hàng (T022 - T026).
- [ ] **Phase 6: US4 & US6 - Confirmation & Lifecycle**: Transactional confirm nhập tủ bếp, hủy, thử lại (T027 - T030).
- [ ] **Phase 7: US5 - Smart Shopping Gaps**: Tích hợp Pantry-aware Shopping Gaps vào `/meal-plans/[id]` (T031 - T034).
- [ ] **Phase 8: Routes & Verification**: Routes `/receipts`, lối vào tự nhiên, typecheck & tests & build (T035 - T037).
