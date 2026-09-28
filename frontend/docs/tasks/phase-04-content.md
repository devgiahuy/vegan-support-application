# Task: Phase 04 — Content Core & Media (UC-02, UC-05)

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-04-content.md`](../../../../backend/docs/prompts/phase-04-content.md)
> **Trạng thái Backend**: `COMPLETED` (READY v4.1)
> **Trạng thái Frontend**: 95% (Live API kết nối, DTO/Model/Mapper đầy đủ cho Post, Recipe, Video)
> **Mức độ ưu tiên**: 🚨 **CẦN MIGRATE SANG PHASE 15 (UPLOAD) VÀ PHASE 16 (SUBMIT)**

---

## 1. Bối cảnh & Mục tiêu

Quản lý toàn bộ nội dung do người dùng đóng góp:
- Công thức món chay (Recipe): Khẩu phần, thời gian nấu, nguyên liệu định lượng, các bước thực hiện, thông tin calo.
- Bài viết kiến thức / Blog (Post): Tiêu đề, trích dẫn, nội dung Markdown, danh mục chủ đề.
- Video nấu ăn (Video): Tải video trực tiếp (Cloudinary) hoặc nhúng từ YouTube, trình phát video kép `VideoPlayer`.

---

## 2. Checklist Đã Hoàn Thành
- [x] Kết nối các endpoints `/posts` CRUD:
  - `GET /posts`: Lọc theo loại (RECIPE, POST, VIDEO), danh mục, tác giả.
  - `GET /posts/:idOrSlug`: Chi tiết bài viết hoặc công thức.
  - `POST /posts`, `PATCH /posts/:id`, `DELETE /posts/:id`.
  - `GET /posts/:id/related`: Danh sách nội dung liên quan.
- [x] Giao diện các trang: `/recipes`, `/recipes/[id]`, `/recipes/new`, `/articles`, `/articles/[id]`, `/articles/new`, `/videos`, `/videos/[id]`, `/videos/new`.
- [x] Unit tests: `post.mapper.test.ts` (10 tests), `recipe.mapper.test.ts` (8 tests), `video.mapper.test.ts` (5 tests), `upload.api.test.ts` (5 tests).

---

## 3. Checklist Công Việc Cần Migrate (Kết nối với Phase 15 & 16)
- [ ] **Migrate Upload Flow**: Chuyển đổi `ImageUploader` và `VideoUploader` từ endpoint signature cũ sang luồng Reservation Phase 15 (xem [`phase-15-storage-quota.md`](./phase-15-storage-quota.md)).
- [ ] **Migrate Submit Flow**: Thêm nút "Gửi kiểm duyệt" (`POST /posts/:id/submit`) thay vì auto-publish (xem [`phase-16-video-review.md`](./phase-16-video-review.md)).
- [ ] Test tay tạo bài viết mới khi Backend có database content seed.
