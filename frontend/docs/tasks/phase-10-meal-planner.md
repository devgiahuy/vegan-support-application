# Task: Phase 10 — Weekly Meal Planner (UC-06)

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-10-meal-planner.md`](../../../../backend/docs/prompts/phase-10-meal-planner.md)
> **Trạng thái Backend**: `COMPLETED`
> **Trạng thái Frontend**: 95% (Live API kết nối, 5 endpoints, lưới 7x3, swap version-gated)
> **Mức độ ưu tiên**: 🧪 **CẦN TEST TAY (MP-1..MP-6)**

---

## 1. Bối cảnh & Mục tiêu

Lập thực đơn ăn chay hàng tuần:
- Tạo hoặc tái tạo thực đơn 7 ngày x 3 bữa (Sáng, Trưa, Tối) = 21 bữa ăn dựa trên trường phái ăn chay, mục tiêu sức khỏe (Giảm cân, Duy trì, Tăng cơ) và dị ứng đã lưu.
- Đổi món (Swap meal slot): Thay thế một bữa ăn bằng món ăn khác an toàn với chế độ ăn, có kiểm soát phiên bản tránh xung đột (`lockVersion`).
- Danh sách mua sắm (Shopping List): Tự động tổng hợp danh sách nguyên liệu cần mua cho cả tuần.
- Lưu và quản lý lịch sử các tuần thực đơn.

---

## 2. Checklist Đã Hoàn Thành
- [x] Kết nối 5 endpoints live:
  - `POST /meal-plans/generate`: Tạo thực đơn tuần mới (yêu cầu ngày bắt đầu là Thứ Hai).
  - `GET /meal-plans`: Danh sách thực đơn các tuần đã lưu.
  - `GET /meal-plans/:id`: Chi tiết thực đơn tuần kèm thông tin dinh dưỡng và danh sách mua sắm.
  - `PATCH /meal-plans/:id/items/:itemId/swap`: Đổi món cho một ô bữa ăn cụ thể.
  - `DELETE /meal-plans/:id`: Xóa thực đơn đã lưu.
- [x] Giao diện các trang: `/meal-plans`, `/meal-plans/saved`, `/meal-plans/[id]`.
- [x] Bảng điều khiển 7 ngày x 3 bữa, hộp thoại đổi món, hộp thoại xác nhận xóa, danh sách đi chợ.
- [x] Unit tests: `meal-plan.mapper.test.ts` pass 14/14 test cases.

---

## 3. Checklist Kịch Bản Test Tay Cần Chạy
- [ ] **MP-1**: Bấm "Tạo thực đơn tuần mới" -> Chọn tuần bắt đầu từ Thứ Hai -> Tạo thành công thực đơn 21 bữa.
- [ ] **MP-2**: Kiểm tra toàn bộ 21 bữa ăn không vi phạm danh sách dị ứng đã thiết lập trong Profile.
- [ ] **MP-3**: Bấm "Đổi món" ở bữa Trưa Thứ Tư -> Chọn món thay thế từ danh sách gợi ý -> Đổi món thành công, calo được cập nhật.
- [ ] **MP-4**: Mở tab "Danh sách mua sắm" -> Xem tổng hợp số lượng nguyên liệu cần mua cho tuần.
- [ ] **MP-5**: Xem danh sách các tuần thực đơn đã lưu tại `/meal-plans/saved`.
- [ ] **MP-6**: Xóa một thực đơn cũ -> Thực đơn biến mất khỏi danh sách.
