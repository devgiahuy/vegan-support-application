# Task: Phase 18 — Meal Portion & Compatibility Analysis

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-18-meal-analysis.md`](../../../../backend/docs/prompts/phase-18-meal-analysis.md)
> **Trạng thái Backend**: `NOT_STARTED`
> **Trạng thái Frontend**: `SCAFFOLD_COMPLETED`
> **Phụ thuộc**: Phase 02 (Profile), Phase 10 (Meal Planner), Phase 12 (Food Data), Phase 13 (Recipe Nutrition), Phase 17 (Custom Meals)
> **Mức độ ưu tiên**: 📋 **KẾ HOẠCH TƯƠNG LAI**

---

## 1. Bối cảnh & Mục tiêu

Phân tích chất lượng và mức độ an toàn của thực đơn:
- Phân tích khẩu phần và cảnh báo vượt ngưỡng an toàn hàng ngày (Daily Upper Limits Warning).
- Kiểm tra tương thích/kỵ thực phẩm trong cùng món, cùng bữa hoặc cùng ngày dựa trên quy tắc Phase 12.
- Cảnh báo mất cân đối vi chất (vd: thiếu sắt, canxi hoặc thừa natri).
- Gợi ý điều chỉnh món ăn hoặc định lượng để khắc phục cảnh báo.

---

## 2. Kế hoạch Endpoints Dự Kiến

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| `POST` | `/api/v1/meal-plans/:id/analyze` | Member | Phân tích thực đơn tuần và trả về danh sách cảnh báo có bằng chứng |

---

## 3. Checklist Chuẩn Bị Khi Backend READY
- [x] Chạy `npm run sync:swagger` để cập nhật schema khi backend triển khai.
- [x] Xây dựng mapper chuyển đổi các mã cảnh báo (`Warning DTO`) sang tooltip và banner màu sắc trực quan (Vàng: Chú ý, Đỏ: Nguy cơ).
- [x] Tích hợp component `MealAnalysisAlerts` trực tiếp vào màn hình xem thực đơn `/meal-plans/[id]`.
- [x] Hiển thị nút "Gợi ý khắc phục" mở hộp thoại gợi ý món ăn thay thế an toàn.
