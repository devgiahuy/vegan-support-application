# Meal Planning & Pantry System Specification Updates

## 1. Changelog & System Overview

- **4.1 – 2026-09-28:** Clarified four-macro estimated weekly planning/analysis, target provenance, non-blocking manual over-target warnings, and explicit 21-slot/unresolved behavior.
- **Change 2026-09-29 (v4.18):** Backward-compatible request validation now accepts omitted, `null`, and blank values for optional descriptive text introduced in Phases 12, 17, and 19–23.
  - Create-style values normalize to omission.
  - Nullable update-style values preserve `null` clearing semantics and normalize blank text to `null`.
  - **Covered fields:** food-data descriptions/actions/rationale, custom-meal notes/source notes, meal-program optional title, Pantry freshness/optional adjustment reasons, recognition freshness observations, receipt uncertainty notes, and optional AI artifact/verification presentation text.
  - **Unchanged:** IDs, amounts, units, versions, idempotency/security/state fields, routes, methods, and response shapes.
- **Version 4.17 (2026-09-28) – Meal plans / Pantry:**
  - Additive $7 \times 3$ day view and unresolved reasons.
  - Generated plans use hard-safe fallback and estimated protein/fiber/fat/carbohydrate targets.
  - Manual macro excess is advisory; weekly analysis suppresses micronutrient-completeness warnings.
  - Safe `g` / `kg` / `cái` normalization.
  - Confirmed pantry expiry severity added; custom meal adds optional fiber.
  - **Task:** Run `npm run sync:swagger`; extend existing DTO/Model/Mapper for additive fields and warnings. Do not alter endpoint paths or existing fields.

---

## 2. API Endpoints Specification

| Method | Endpoint | Status | Date | Breaking Change / Contract Status | Description / Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/meal-plans/generate` | `READY` | 2026-09-28 | Yes (contract update pending) | Auth; Monday–Sunday $7 \times 3$; hard-safe fallback fills compatible slots; four-macro estimated targets |
| `GET` | `/meal-plans` | `READY` | 2026-09-16 | Yes (2026-09-16) | Auth; own plans, pagination/filter tuần |
| `GET` | `/meal-plans/:id` | `READY` | 2026-09-28 | Yes (contract update pending) | Existing `items` retained; additive `days` $7 \times 3$, explicit unresolved reason, estimated four-macro targets/totals |
| `GET` / `POST` | `/custom-meals` | `READY` | 2026-09-28 | Yes (contract update pending) | Additive `userFiberGrams`; safe unit labels normalize to `g` / `kg` / `cái`; existing fields retained |
| `PATCH` | `/meal-plans/:id/items/:itemId/manual-add` | `READY` | 2026-09-28 | Yes (contract update pending) / No | Saves hard-compatible choice; refreshed analysis returns advisory `MACRO_TARGET_EXCEEDED` / advisory four-macro warning without rollback |
| `POST` | `/meal-plans/:id/analyze` | `READY` | 2026-09-28 | Yes (contract update pending) / No | Estimated protein/fiber/fat/carbohydrate focus; retained portion/ingredient compatibility warnings; no micronutrient-completeness warning; compatibility retained |
| `GET` | `/meal-plans/:id/analysis` | `READY` | 2026-09-28 | Yes (contract update pending) / No | Current v2 fingerprint-validated four-macro result; old v1 analysis becomes stale; no micronutrient-completeness warnings |
| `GET` / `POST` | `/pantry/items` | `READY` | 2026-09-28 | Yes (contract update pending) | UI units normalize safe aliases to `g` / `kg` / `cái`; additive expiry status; count mass stays unresolved without reviewed conversion |
| `GET` / `PATCH` / `DELETE` | `/pantry/items/:id` | `READY` | 2026-09-28 | Yes (contract update pending) | Additive `expiryStatus`, `daysUntilExpiry`, `expiryStatusAsOf`; optimistic version/accounting unchanged |
| `GET` / `POST` | `/pantry/items/:id/adjustments` | `READY` | 2026-09-23 | Yes (2026-09-26) | Paginated immutable ledger; idempotent consume/restore/adjust; negative balance blocked; FE: `features/pantry` |
| `GET` | `/pantry/items/expiring-soon` | `READY` | 2026-09-28 | Yes (contract update pending) | Date-only boundary; `>3 GOOD`, `>1..3 WARNING`, `<=1 ALERT`, past date `EXPIRED` for confirmed items |

---

## 3. Core Business Rules & Planning Requirements

### Rule 9: Macro Dimensions
Weekly-plan generation and user-facing nutrition comparison use four estimated dimensions only: **protein, fiber, fat, and carbohydrates**. Micronutrient completeness is not a generation blocker or weekly-plan warning.

### Rule 10: Target Provenance & Calculation
Macro targets extend the existing health-profile target:
$$\text{Target Energy} = \text{stored TDEE} \times \text{configured goal factor}$$
This is then converted through the configured protein/fat/carbohydrate energy distribution and fiber-per-1000-kcal factor. The response identifies this source, tolerance, and estimate status; these values are guidance rather than measurements.

### Rule 11: Manual Insertion
Manual insertion preserves a hard-compatible user choice and returns advisory over-target warnings after recalculating the day. Allergy, explicit exclusion, diet-pattern, and enabled-tradition violations remain blocking.

### Rule 12: Plan Slot Generation
Generated plans attempt all Monday-through-Sunday breakfast/lunch/dinner slots ($7 \times 3 = 21$ slots). Calorie/macro tolerance and repetition are scoring preferences, not reasons to hide a hard-compatible candidate; a genuinely unresolved slot remains explicit with a reason.

---

## 4. Detailed Execution Logic (Vietnamese Specs)

- **Cấu trúc Plan & Điều kiện lọc:**
  - Plan cố định **Monday–Sunday**, 7 ngày $\times$ 3 bữa với tỷ lệ năng lượng sáng/trưa/tối là `25/40/35`.
  - Món ứng viên (Candidate) phải là **published Recipe**, có thuộc tính `mealPlannerEligible` và toàn bộ nguyên liệu (ingredient) đã được canonical hóa. Thiếu calories/macros chỉ làm giảm độ tin cậy chứ không tự ý loại món.
  - Backend kiểm tra và áp dụng dị ứng (*allergy*), loại trừ rõ ràng (*explicit exclusion*), chế độ ăn (*diet pattern*) và truyền thống (*enabled tradition*) theo từng ngày trước mọi bước tính điểm (*scoring*).

- **Dung sai Calorie & Xử lý slot chưa hoàn tất:**
  - Dung sai calorie bắt đầu ở mức $\pm 15\%$, sau đó nới lỏng thành $\pm 20\%$.
  - Nếu vẫn không có món đạt trong ngưỡng tolerance, hệ thống sẽ chọn món **hard-compatible** có giá trị gần với mục tiêu dinh dưỡng ước tính (*estimated protein/fiber/fat/carbohydrate targets*) nhất và trả về cảnh báo `NUTRITION_TARGET_OUTSIDE_TOLERANCE`.
  - Tránh trùng lặp món (*repetition*) chỉ là tiêu chí chấm điểm ưu tiên (*scoring preference*). Chỉ khi không còn bất kỳ candidate hard-compatible nào thì slot mới trả về `UNFILLED` đi kèm mã lỗi `unresolved.code/reason`.

- **Quy chuẩn danh sách mua sắm (Shopping List) & Đơn vị tính:**
  - Shopping list tự động cộng dồn khối lượng: $\text{kg} \rightarrow \text{g}$.
  - Đơn vị đếm (*count*) hiển thị là `cái` và tuyệt đối không tự quy đổi sang gram nếu chưa có conversion được phê duyệt (*reviewed conversion*).
  - Đơn vị không tương thích sẽ được tách thành các dòng riêng biệt và trả về mã `SHOPPING_UNIT_NOT_COMBINED`.

- **Mục tiêu Dinh dưỡng & Thao tác thủ công:**
  - Nguồn mục tiêu (*Target source*) tính từ $\text{health-profile TDEE} \times \text{goal factor}$, sau đó áp tỷ lệ phân bổ năng lượng protein/fat/carbohydrate và hệ số `fiber-per-1000-kcal`.
  - Toàn bộ target/tổng dinh dưỡng đều là giá trị ước tính (*estimate*) có kèm theo tolerance/confidence/uncertainty. Quá trình phân tích tuần (*weekly analysis*) **không phát sinh** cảnh báo thiếu vi chất (*micronutrient-completeness warning*).
  - Thao tác thêm món thủ công (*Manual add*) vẫn lưu thành công nếu đạt an toàn cứng (*hard-safe*) và chỉ trả về cảnh báo macro mang tính khuyến nghị (*advisory macro warning*).