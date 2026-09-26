# Task: Phase 12 — Food & Nutrient Knowledge Base

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-12-food-data.md`](../../../../backend/docs/prompts/phase-12-food-data.md)
> **Trạng thái Backend**: `COMPLETED` (READY v4.1, PR #19)
> **Trạng thái Frontend**: `PLANNED` (Sẵn sàng xây dựng module mới)
> **Mức độ ưu tiên**: 🌟 **TÍNH NĂNG MỚI ĐÃ SẴN SÀNG**

---

## 1. Bối cảnh & Mục tiêu

Backend Phase 12 đã xây dựng cơ sở dữ liệu dinh dưỡng chuẩn (Canonical Food & Nutrient Knowledge Base) độc lập với AI.
Đây là nền tảng cốt lõi cho các tính năng: tính toán dinh dưỡng nấu nướng (Phase 13), cảnh báo khẩu phần & tương kỵ (Phase 18), quản lý tủ bếp (Phase 20) và nhận diện tủ lạnh/hóa đơn (Phase 21, 22).

Frontend cần xây dựng module `features/food-data` phục vụ 2 nhóm người dùng:
1. **Người dùng thông thường / Khách**:
   - Tra cứu hàm lượng dinh dưỡng chuẩn trên 100g của từng nguyên liệu.
   - Hiển thị nguồn gốc dữ liệu (USDA, Viện Dinh Dưỡng VN, v.v.), giấy phép, phiên bản kiểm định.
   - Tra cứu ngưỡng tiêu thụ khuyến nghị (Reference Intakes / Upper Limits) theo từng nhóm đối tượng.
   - Tra cứu phương pháp nấu nướng và hệ số giữ lại dinh dưỡng (Retention/Yield Factors).
   - Tra cứu các quy tắc tương tác / kỵ thực phẩm theo phạm vi `Cùng món`, `Cùng bữa`, `Cùng ngày`.
2. **Quản trị viên (Admin)**:
   - Quản lý các bản ghi chuẩn (Nutrient, Food Profile, Factor, Rule, Source).
   - Xem trước (preview) và xác nhận (commit) nhập dữ liệu tự động từ các nguồn bên ngoài (idempotent import).

---

## 2. Danh sách Endpoints Backend liên quan

Chi tiết xem tại [`frontend/docs/api/food-data.md`](../api/food-data.md) và [`frontend/docs/api/food-data-admin.md`](../api/food-data-admin.md):

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| `GET` | `/api/v1/food-data/ingredients/:id/nutrients` | Public | Lấy giá trị dinh dưỡng trên 100g và nguồn dữ liệu của nguyên liệu |
| `GET` | `/api/v1/food-data/reference-intakes` | Public | Tra cứu nhu cầu khuyến nghị & giới hạn tối đa theo nhóm đối tượng |
| `GET` | `/api/v1/food-data/ingredient-guidelines` | Public | Tra cứu hướng dẫn định lượng/tần suất ăn an toàn |
| `GET` | `/api/v1/food-data/cooking-methods` | Public | Danh sách phương pháp nấu và hệ số hao hụt/giữ lại chất |
| `GET` | `/api/v1/food-data/interaction-rules` | Public | Tra cứu quy tắc tương tác giữa các nguyên liệu |
| `GET` | `/api/v1/admin/food-data/records` | Admin | Quản lý danh sách bản ghi dinh dưỡng (hỗ trợ lọc theo loại) |
| `POST` | `/api/v1/admin/food-data/records` | Admin | Tạo mới định nghĩa dưỡng chất, quy tắc, nguồn tham chiếu |
| `PUT` | `/api/v1/admin/food-data/records/:id` | Admin | Cập nhật toàn diện một bản ghi |
| `DELETE` | `/api/v1/admin/food-data/records/:id` | Admin | Lưu trữ hoặc thay thế (supersede) bản ghi |
| `POST` | `/api/v1/admin/food-data/imports/preview` | Admin | Xem trước và kiểm tra tính hợp lệ của gói dữ liệu import |
| `POST` | `/api/v1/admin/food-data/imports` | Admin | Thực thi lưu dữ liệu import vào cơ sở dữ liệu chính |

---

## 3. Checklist Chuẩn Bị (Pre-flight Checklist)

- [ ] Đọc tài liệu:
  - [`backend/docs/prompts/phase-12-food-data.md`](../../../../backend/docs/prompts/phase-12-food-data.md)
  - `docs/SRS.md` mục FR-05 (Food Data & Nutrient Knowledge Base)
  - `docs/FOOD_DATA_SOURCES.md` (quy tắc trích dẫn nguồn, giấy phép, không coi missing là 0)
  - [`frontend/docs/api/food-data.md`](../api/food-data.md)
- [ ] Khai báo endpoints trong `src/common/constants/api-endpoints.ts`:
  - Thêm nhánh `FOOD_DATA`: `NUTRIENTS: (id) => ...`, `REFERENCE_INTAKES`, `GUIDELINES`, `COOKING_METHODS`, `INTERACTIONS`
  - Thêm nhánh `ADMIN_FOOD_DATA`: `RECORDS`, `RECORD: (id) => ...`, `IMPORT_PREVIEW`, `IMPORT_COMMIT`
- [ ] Nắm vững quy tắc nghiệp vụ cốt lõi:
  - **Không coi thiếu là 0 (Missing is NOT zero)**: Dưỡng chất không có số liệu phải hiển thị `--` hoặc `Chưa xác định`, tuyệt đối không ghi `0 g`.
  - **Minh bạch xuất xứ (Provenance)**: Mỗi bảng dinh dưỡng phải gắn nhãn nguồn (vd: `USDA FDC 2024`, `NIN 2017`).

---

## 4. Checklist Triển Khai (7 Tầng Scaffold)

### Tầng 1 & 2: Types DTO & Model
- [ ] Tạo `src/features/food-data/types/food-data.dto.ts`:
  - `NutrientItemDto`, `IngredientNutrientsResponseDto`, `ReferenceIntakeDto`
  - `CookingMethodDto`, `InteractionRuleDto`, `FoodDataRecordDto`, `FoodDataImportDto`
- [ ] Tạo `src/features/food-data/types/food-data.model.ts`:
  - `NutrientValue`, `IngredientNutritionFact`, `ReferenceIntake`, `CookingFactor`, `FoodInteraction`

### Tầng 3 & 4: Mapper & Unit Test
- [ ] Tạo `src/features/food-data/mappers/food-data.mapper.ts`:
  - Chuyển đổi an toàn DTO sang Model.
  - Phân loại dưỡng chất đa lượng (Macro: Đạm, Tinh bột, Béo, Xơ) và vi lượng (Micro: Sắt, Kẽm, B12, Canxi...).
  - Xử lý giá trị null/undefined thành `null` chứ không gán `0`.
- [ ] Tạo `src/features/food-data/mappers/food-data.mapper.test.ts`:
  - Test mapping nutrient đầy đủ trường.
  - Test missing nutrient giữ nguyên null.
  - Test map danh sách tương tác kỵ thực phẩm.
  - Đạt tối thiểu 12 test cases.

### Tầng 5 & 6: API Client & TanStack Queries
- [ ] Tạo `src/features/food-data/api/food-data.api.ts`:
  - `getIngredientNutrients(id)`: lấy dinh dưỡng nguyên liệu
  - `getReferenceIntakes()`: lấy giới hạn khuyến nghị
  - `getCookingMethods()`: lấy phương pháp nấu
  - `getInteractionRules()`: lấy tương tác kỵ món
  - `adminGetRecords(params)`, `adminImportPreview(data)`, `adminImportCommit(data)`
- [ ] Tạo `src/features/food-data/queries/food-data.queries.ts`:
  - `FOOD_DATA_KEYS`: Key Factory
  - `useIngredientNutrientsQuery(id)`
  - `useReferenceIntakesQuery()`
  - `useCookingMethodsQuery()`
  - `useInteractionRulesQuery()`

### Tầng 7: UI Components & Màn hình
- [ ] **Bảng thành phần dinh dưỡng chuẩn (`NutritionFactsPanel`)**:
  - Giao diện thiết kế theo tiêu chuẩn nhãn thực phẩm hiện đại, hiển thị rõ năng lượng (Kcal), đạm, béo, đường, xơ, vitamin & khoáng chất.
  - Huy hiệu nguồn gốc dữ liệu (`SourceProvenanceBadge`).
  - Gắn vào chi tiết nguyên liệu tại `/categories#tra-cuu` và popup xem nhanh trong trang công thức.
- [ ] **Màn hình tra cứu tương tác thực phẩm (`FoodInteractionTable`)**:
  - Tìm kiếm cặp nguyên liệu có tương tác.
  - Hiển thị mức độ khuyến cáo: `Cảnh báo`, `Lưu ý`, `Hợp khẩu vị`.
- [ ] **Tab Dữ liệu Dinh dưỡng trong Admin Dashboard (`/admin/dashboard?tab=food-data`)**:
  - Quản lý danh mục chất dinh dưỡng, xem trước gói nhập dữ liệu.

---

## 5. Verification & Testing

- [ ] `node node_modules/typescript/bin/tsc --noEmit` (0 lỗi).
- [ ] `npm test` (toàn bộ tests pass, mapper test của food-data pass).
- [ ] `npm run build` (build thành công không lỗi).
- [ ] Test tay tra cứu dinh dưỡng: Chọn một nguyên liệu phổ biến (vd: Đậu hũ) -> Xem bảng phân tích dinh dưỡng trên 100g.
- [ ] Kiểm tra tính toàn vẹn: Dưỡng chất chưa có thông tin không bị hiển thị thành số 0.

---

## 6. Cập nhật Tài liệu Bàn giao

- [ ] Cập nhật `frontend/docs/BACKEND_INTEGRATION.md`: chuyển `FE integrated = Yes` cho các endpoint food-data.
- [ ] Cập nhật `frontend/docs/PROGRESS.md`: thêm dòng tiến độ cho Phase 12 Food Data.
- [ ] Cập nhật `frontend/docs/WORK-LOG.md`: ghi lại chi tiết triển khai Phase 12.
