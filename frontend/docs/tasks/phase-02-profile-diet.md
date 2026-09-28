# Task: Phase 02 — User Profile, Health & Diet Preferences (UC-13)

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-02-profile-diet.md`](../../../../backend/docs/prompts/phase-02-profile-diet.md)
> **Trạng thái Backend**: `COMPLETED`
> **Trạng thái Frontend**: 90% (Live API kết nối, DTO/Model/Mapper đầy đủ)
> **Mức độ ưu tiên**: 🧪 **CẦN TEST TAY (VP-1..VP-7)**

---

## 1. Bối cảnh & Mục tiêu

Quản lý hồ sơ cá nhân:
- Cập nhật thông tin cơ bản: tên hiển thị, ảnh đại diện.
- Hồ sơ sức khỏe tính toán tự động: Chiều cao, cân nặng, độ tuổi, giới tính, mức độ vận động -> Backend tính BMI, BMR (Mifflin–St Jeor) và TDEE.
- Tùy chọn ăn chay & Ràng buộc cứng: Chọn trường phái ăn chay (Chay thuần, Chay có trứng/sữa...), danh sách dị ứng, loại trừ nguyên liệu và lịch ăn chay định kỳ (PERIODIC).

---

## 2. Checklist Đã Hoàn Thành
- [x] Kết nối 5 endpoints: `GET /users/me`, `PATCH /users/me`, `PUT /users/me/health-profile`, `POST /diet-rules/preview`, `PUT /users/me/diet-preferences`, `PUT /users/me/diet-schedule`.
- [x] Giao diện quản lý hồ sơ tại `/profile` với các tab: Thông tin, Sức khỏe, Chế độ ăn, Bài viết, Đã lưu, Bảo mật.
- [x] Unit tests: `profile.mapper.test.ts` (6 tests), `health.mapper.test.ts` (5 tests), `diet.mapper.test.ts` (8 tests) pass 100%.

---

## 3. Checklist Kịch Bản Test Tay Cần Chạy
- [ ] **VP-1**: Đổi tên hiển thị -> Cập nhật thành công, header hiển thị tên mới.
- [ ] **VP-2**: Nhập chiều cao/cân nặng -> Backend tính đúng BMI và TDEE, UI hiển thị chỉ số sức khỏe.
- [ ] **VP-3**: Chọn trường phái ăn chay -> Xem trước (preview) bộ quy tắc cấm/cho phép tương ứng.
- [ ] **VP-4**: Thêm dị ứng nguyên liệu (vd: Đậu phộng) -> Lưu thành công ràng buộc cứng.
- [ ] **VP-5**: Chọn loại hình ăn chay định kỳ -> Chọn các ngày ăn chay trong tháng (âm lịch/dương lịch).
- [ ] **VP-6**: Tải ảnh đại diện lên -> Hiển thị avatar mới ngay lập tức.
- [ ] **VP-7**: Đổi mật khẩu/bảo mật.
