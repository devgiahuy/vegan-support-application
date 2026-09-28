# Task: Phase 17 — Custom Meals, Photos & User Tags

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-17-custom-meals.md`](../../../../backend/docs/prompts/phase-17-custom-meals.md)
> **Trạng thái Backend**: `NOT_STARTED`
> **Trạng thái Frontend**: `PLANNED`
> **Phụ thuộc**: Backend Phase 04 (Content), Phase 12 (Food Data), Phase 15 (Storage)
> **Mức độ ưu tiên**: 📋 **KẾ HOẠCH TƯƠNG LAI**

---

## 1. Bối cảnh & Mục tiêu

Cho phép thành viên tự tạo món ăn cá nhân (Private Custom Meals):
- Không bắt buộc phải nộp duyệt công khai như Recipe chính thống.
- Định lượng nguyên liệu linh hoạt từ ngân hàng nguyên liệu Phase 12.
- Đính kèm nhiều hình ảnh thực tế (sử dụng hạn ngạch lưu trữ Phase 15).
- Tự gắn thẻ cá nhân (User Tags) để phân loại (vd: `món ăn sáng nhanh`, `shopee`, `món yêu thích`). Lưu ý: `shopee` chỉ là metadata text, không phải dịch vụ liên kết sàn TMĐT.
- Sử dụng món ăn cá nhân vào thực đơn tuần (Phase 10).

---

## 2. Kế hoạch Endpoints Dự Kiến (Target Contracts)

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| `GET` | `/api/v1/custom-meals` | Member (Owner) | Danh sách món ăn cá nhân của tôi |
| `POST` | `/api/v1/custom-meals` | Member | Tạo món ăn cá nhân mới |
| `GET` | `/api/v1/custom-meals/:id` | Member (Owner) | Chi tiết món ăn cá nhân |
| `PATCH` | `/api/v1/custom-meals/:id` | Member (Owner) | Chỉnh sửa món ăn cá nhân |
| `DELETE` | `/api/v1/custom-meals/:id` | Member (Owner) | Xóa món ăn cá nhân (kiểm tra an toàn nếu đang được dùng trong thực đơn) |
| `POST` | `/api/v1/custom-meals/:id/media` | Member (Owner) | Đính kèm ảnh có kiểm soát quota |

---

## 3. Checklist Chuẩn Bị Khi Backend READY
- [ ] Chạy `npm run sync:swagger` để cập nhật schema mới.
- [ ] Khai báo endpoints tại `src/common/constants/api-endpoints.ts` trong nhánh `CUSTOM_MEALS`.
- [ ] Tạo module `features/custom-meal` với 7 tầng scaffold:
  - DTO/Model/Mapper cho Custom Meal.
  - Form tạo món cá nhân với chọn nguyên liệu và upload ảnh qua Reservation Phase 15.
  - Nút thêm nhanh vào thực đơn tuần `/meal-plans`.
