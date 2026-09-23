# Task: Phase 06 — Community Interactions (UC-03)

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-06-community.md`](../../../../backend/docs/prompts/phase-06-community.md)
> **Trạng thái Backend**: `COMPLETED` (READY v4.1)
> **Trạng thái Frontend**: 95% (`USE_FIXTURES = false`, Live API kết nối, 11 endpoints đầy đủ)
> **Mức độ ưu tiên**: 🧪 **CẦN TEST TAY (CM-1..CM-4)**

---

## 1. Bối cảnh & Mục tiêu

Tương tác cộng đồng xung quanh bài viết, công thức và video:
- Bình luận (Comments) dạng phân tầng: tối đa 1 tầng reply để tránh phức tạp giao diện.
- Đánh giá công thức (Recipe Rating) 2 trục độc lập: Độ ngon miệng (`taste`: 1-5 sao) và Độ dễ làm (`difficulty`: 1-5 sao).
- Bình chọn (Upvote): Tăng uy tín bài viết, idempotent cả 2 chiều.
- Lưu trữ (Bookmark): Lưu bài viết/công thức vào danh sách cá nhân để xem lại.

---

## 2. Checklist Đã Hoàn Thành
- [x] Kết nối 11 endpoints cộng đồng:
  - `GET /posts/:id/comments`, `POST /posts/:id/comments`, `PATCH /comments/:id`, `DELETE /comments/:id`.
  - `GET /posts/:id/community-summary`: Tổng hợp vote, rating trung bình và trạng thái của người xem (viewer).
  - `PUT /posts/:id/vote`, `DELETE /posts/:id/vote`.
  - `PUT /posts/:id/rating`.
  - `PUT /posts/:id/bookmark`, `DELETE /posts/:id/bookmark`.
  - `GET /users/me/bookmarks`: Danh sách đã lưu hiển thị tại `/profile` (tab Đã lưu).
- [x] `features/community/api/community.api.ts` đã chạy chế độ live (`USE_FIXTURES = false`).
- [x] Unit tests: `community.mapper.test.ts` pass 13/13 test cases.

---

## 3. Checklist Kịch Bản Test Tay Cần Chạy
- [ ] **CM-1**: Gửi bình luận gốc vào bài viết -> Bình luận xuất hiện ngay lập tức.
- [ ] **CM-2**: Trả lời một bình luận (reply tầng 1) -> Hiển thị thụt dòng dưới bình luận gốc.
- [ ] **CM-3**: Bấm Upvote bài viết -> Số vote tăng 1; bấm lần nữa -> Hủy vote, số vote giảm 1.
- [ ] **CM-4**: Chấm điểm công thức (Vị: 5 sao, Độ khó: 2 sao) -> Cập nhật trung bình cộng đồng và lưu lựa chọn của người dùng.
- [ ] **CM-5**: Bấm Lưu bài viết -> Vào tab Đã lưu trong `/profile` thấy bài viết xuất hiện.
