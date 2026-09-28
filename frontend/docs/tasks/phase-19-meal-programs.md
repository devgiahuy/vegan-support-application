# Task: Phase 19 — Multi-week Meal Programs

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-19-meal-programs.md`](../../../../backend/docs/prompts/phase-19-meal-programs.md)
> **Trạng thái Backend**: `NOT_STARTED`
> **Trạng thái Frontend**: `PLANNED`
> **Phụ thuộc**: Phase 10 (Meal Planner), Phase 17 (Custom Meals), Phase 18 (Meal Analysis)
> **Mức độ ưu tiên**: 📋 **KẾ HOẠCH TƯƠNG LAI**

---

## 1. Bối cảnh & Mục tiêu

Chương trình dinh dưỡng nhiều tuần (Multi-week Programs):
- Thiết kế lộ trình ăn uống 2 tuần, 4 tuần, 8 tuần theo mục tiêu cụ thể (vd: "21 ngày làm quen với thuần chay", "Thanh lọc cơ thể 4 tuần", "Tăng cơ thuần chay").
- Theo dõi tiến trình thực hiện của người dùng qua từng tuần.
- Phân tích tích lũy dinh dưỡng (Cumulative Nutrition Analysis) theo chu kỳ chương trình.

---

## 2. Kế hoạch Endpoints Dự Kiến

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| `GET` | `/api/v1/meal-programs` | Public / Member | Danh sách các chương trình dinh dưỡng có sẵn |
| `POST` | `/api/v1/meal-programs` | Member | Khởi tạo hoặc tham gia một chương trình nhiều tuần |
| `GET` | `/api/v1/meal-programs/:id` | Member | Chi tiết tiến trình chương trình theo tuần |
| `PATCH` | `/api/v1/meal-programs/:id` | Member | Cập nhật tiến độ hoặc tùy chỉnh tuần ăn |

---

## 3. Checklist Chuẩn Bị Khi Backend READY
- [ ] Xây dựng module `features/meal-program` theo 7 tầng scaffold.
- [ ] Giao diện timeline lộ trình chương trình với các mốc tuần (`ProgramTimelineView`).
- [ ] Biểu đồ theo dõi năng lượng và dinh dưỡng tích lũy qua các tuần (`CumulativeNutritionChart`).
