# Task: Phase 13 — Cooking-aware Recipe Nutrition

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-13-recipe-nutrition.md`](../../../../backend/docs/prompts/phase-13-recipe-nutrition.md)
> **Trạng thái Backend**: `IN_PROGRESS` (Source + OpenAPI đã xong, đang chờ build gate để READY)
> **Trạng thái Frontend**: `PLANNED` (Chuẩn bị sẵn sàng)
> **Mức độ ưu tiên**: ⏳ **ĐÓN ĐẦU BACKEND READY**

---

## 1. Bối cảnh & Mục tiêu

Tính năng tính toán dinh dưỡng công thức nấu ăn dựa trên:
1. Định lượng nguyên liệu sạch sau khi trừ phần bỏ đi (Edible portion).
2. Tác động của nhiệt và phương pháp chế biến (hệ số giữ lại dinh dưỡng - Retention Factor và hệ số hao hụt khối lượng - Yield Factor từ Phase 12).
3. Đánh giá mức độ bao phủ (Coverage) và độ tin cậy (Confidence). Các nguyên liệu chưa có dữ liệu phải được liệt kê rõ là `Uncovered Ingredients` chứ không tự ý đoán.
4. AI chỉ đóng vai trò dự đoán bổ trợ (Provider Adapter) và phải được dán nhãn rõ ràng `AI Estimate`, không ghi đè số liệu tính toán xác định.

---

## 2. Danh sách Endpoints Backend liên quan

Chi tiết xem tại [`frontend/docs/api/recipe-nutrition.md`](../api/recipe-nutrition.md):

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| `POST` | `/api/v1/posts/:id/nutrition/preview` | Member | Xem trước kết quả tính toán dinh dưỡng theo nguyên liệu và các bước nấu |
| `POST` | `/api/v1/posts/:id/nutrition/recalculate` | Tác giả/Admin | Tính toán lại và lưu bản ghi dinh dưỡng chính thức cho công thức |
| `GET` | `/api/v1/posts/:id/nutrition/current` | Public | Lấy bản ghi dinh dưỡng hiện hành của công thức |
| `GET` | `/api/v1/posts/:id/nutrition/history` | Public | Xem lịch sử các lần tính toán dinh dưỡng |
| `GET` | `/api/v1/posts/:id/nutrition/status` | Tác giả/Admin | Kiểm tra xem số liệu dinh dưỡng có bị cũ (stale) do sửa nguyên liệu hay không |

---

## 3. Checklist Chuẩn Bị (Pre-flight Checklist)

- [ ] Đọc tài liệu:
  - [`backend/docs/prompts/phase-13-recipe-nutrition.md`](../../../../backend/docs/prompts/phase-13-recipe-nutrition.md)
  - `docs/SRS.md` mục FR-06 (Cooking-aware Nutrition Estimates)
  - [`frontend/docs/api/recipe-nutrition.md`](../api/recipe-nutrition.md)
- [ ] Khai báo endpoints trong `src/common/constants/api-endpoints.ts`:
  - Thêm nhánh `RECIPE_NUTRITION`: `PREVIEW: (id) => ...`, `RECALCULATE: (id) => ...`, `CURRENT: (id) => ...`, `HISTORY: (id) => ...`, `STATUS: (id) => ...`
- [ ] Nắm rõ mã lỗi nghiệp vụ:
  - `INVALID_SERVINGS`: Số khẩu phần ăn phải lớn hơn 0.
  - `NUTRITION_DATA_INCOMPLETE`: Chưa có đủ dữ liệu để tính toán, hiển thị cảnh báo thiếu thông tin.
  - `NUTRITION_ESTIMATE_STALE`: Công thức đã bị sửa nguyên liệu hoặc phương pháp nấu sau lần tính trước, cần bấm tính lại.

---

## 4. Checklist Triển Khai (7 Tầng Scaffold)

### Tầng 1 & 2: Types DTO & Model
- [ ] Tạo `src/features/recipe-nutrition/types/recipe-nutrition.dto.ts`
- [ ] Tạo `src/features/recipe-nutrition/types/recipe-nutrition.model.ts`:
  - `RecipeNutritionEstimate`, `NutrientPerServing`, `UncoveredIngredient`, `NutritionFreshnessStatus`

### Tầng 3 & 4: Mapper & Unit Test
- [ ] Tạo `src/features/recipe-nutrition/mappers/recipe-nutrition.mapper.ts`:
  - Map tính toán calo/macronutrient trên mỗi khẩu phần ăn (per serving).
  - Tách bạch rõ các vi chất có độ tin cậy cao và vi chất ước lượng từ AI.
- [ ] Tạo unit test `recipe-nutrition.mapper.test.ts` (tối thiểu 10 test cases).

### Tầng 5 & 6: API Client & TanStack Queries
- [ ] Tạo `src/features/recipe-nutrition/api/recipe-nutrition.api.ts`
- [ ] Tạo `src/features/recipe-nutrition/queries/recipe-nutrition.queries.ts`:
  - `useRecipeNutritionQuery(recipeId)`
  - `useRecalculateNutritionMutation()`
  - `usePreviewNutritionMutation()`

### Tầng 7: UI Components & Tích hợp
- [ ] Tạo `RecipeNutritionCard` hiển thị trên trang chi tiết công thức `/recipes/[id]`:
  - Macro chart (Calories, Carb, Protein, Fat per serving).
  - Cảnh báo vi chất thiếu thông tin (`UncoveredIngredientsWarning`).
  - Huy hiệu phân định nguồn: `Tính toán khoa học` vs `AI ước lượng`.
- [ ] Thêm nút "Tính toán dinh dưỡng" trong trình tạo/sửa công thức `/recipes/new` và `/recipes/[id]/edit`.
