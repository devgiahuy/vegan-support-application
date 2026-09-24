# Task: Phase 03 — Category & Ingredient Catalog

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-03-catalog.md`](../../../../backend/docs/prompts/phase-03-catalog.md)
> **Trạng thái Backend**: `COMPLETED`
> **Trạng thái Frontend**: 75% (Live API kết nối, cây danh mục 2 tầng, màn Admin quản lý)
> **Mức độ ưu tiên**: 🧪 **CẦN TEST TAY (VC-1..VC-6)**

---

## 1. Bối cảnh & Mục tiêu

Cung cấp cây phân loại danh mục (Category Tree tối đa 2 tầng) và cơ sở dữ liệu nguyên liệu chuẩn (Canonical Ingredients) phục vụ tra cứu, phân loại bài viết/công thức và giải quyết tên nguyên liệu tiếng Việt có/không dấu.

---

## 2. Checklist Đã Hoàn Thành
- [x] Kết nối các endpoints:
  - `GET /categories`: Cây danh mục hoạt động tối đa 2 tầng.
  - `GET /ingredients`: Danh sách nguyên liệu chuẩn (hỗ trợ phân trang, nhóm thực phẩm).
  - `GET /ingredients/resolve`: Giải quyết tên nguyên liệu (Exact, Ambiguous, None).
  - 10 Endpoints Quản trị Catalog: CRUD danh mục & nguyên liệu, quản lý bí danh (aliases).
- [x] Trang khám phá `/categories` với bộ lọc loại danh mục và tra cứu nguyên liệu (`#tra-cuu`, `#phan-giai`).
- [x] Unit tests: `category.mapper.test.ts` (6 tests), `ingredient.mapper.test.ts` (16 tests) pass 100%.

---

## 3. Checklist Kịch Bản Test Tay Cần Chạy
- [ ] **VC-1**: Tải cây danh mục công thức tại `/recipes` -> Hiển thị đúng các danh mục con.
- [ ] **VC-2**: Tìm kiếm nguyên liệu gõ tiếng Việt không dấu (vd: `dau hu`) -> Trả về đúng `Đậu hũ`.
- [ ] **VC-3**: Giải quyết tên nguyên liệu nhập tự do -> Hiển thị danh sách gợi ý khi gặp tên mơ hồ (ambiguous).
- [ ] **VC-4**: Admin thêm mới danh mục con -> Kiểm tra danh mục con phải cùng type với cha.
- [ ] **VC-5**: Admin thêm bí danh (alias) cho nguyên liệu -> Thao tác thành công.
- [ ] **VC-6**: Admin xóa/lưu trữ danh mục đang được sử dụng -> Hệ thống cảnh báo hoặc yêu cầu danh mục thay thế.
