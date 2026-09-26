# Task: Phase 05 — Search & Related Content (UC-04)

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-05-search.md`](../../../../backend/docs/prompts/phase-05-search.md)
> **Trạng thái Backend**: `COMPLETED`
> **Trạng thái Frontend**: 75% (Route `/search` đã nối query thật `q`, debounced, filter pills)
> **Mức độ ưu tiên**: 🧪 **CẦN TEST VỚI DỮ LIỆU CONTENT THẬT**

---

## 1. Bối cảnh & Mục tiêu

Tính năng tìm kiếm toàn văn (Postgres Full-Text Search):
- Tìm kiếm từ khóa theo tiêu đề, trích dẫn, nguyên liệu.
- Bộ lọc kết hợp: Loại nội dung (Tất cả / Công thức / Bài viết / Video), Danh mục, Trường phái ăn chay.
- Gợi ý nội dung liên quan (Related Posts) bám theo độ tương đồng danh mục/nguyên liệu và bảo đảm an toàn dị ứng.

---

## 2. Checklist Đã Hoàn Thành
- [x] Trang tìm kiếm `/search` với ô nhập từ khóa debounced 300ms.
- [x] Gọi đồng thời các query tìm kiếm thật: `GET /posts?type=RECIPE&q=...`, `GET /posts?type=POST&q=...`, `GET /posts?type=VIDEO&q=...`.
- [x] Giao diện hiển thị phân tab kết quả, trạng thái rỗng thân thiện (Empty State) và gợi ý từ khóa phổ biến.

---

## 3. Checklist Công Việc Cần Chuẩn Bị & Test Tay
- [ ] Kiểm tra phản hồi tìm kiếm khi Backend seed dữ liệu phong phú (tiếng Việt có dấu và không dấu).
- [ ] Kiểm tra phân trang kết quả tìm kiếm khi số lượng bài viết > 10.
- [ ] Đảm bảo bài viết bị vi phạm hoặc bài viết chưa duyệt không xuất hiện trong kết quả tìm kiếm công khai.
