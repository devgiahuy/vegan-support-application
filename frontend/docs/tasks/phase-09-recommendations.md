# Task: Phase 09 — Behavioral Tracking & Recommendations v1

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-09-recommendations.md`](../../../../backend/docs/prompts/phase-09-recommendations.md)
> **Trạng thái Backend**: `COMPLETED`
> **Trạng thái Frontend**: 90% (Live API kết nối, tracking fire-and-forget, consent toggle)
> **Mức độ ưu tiên**: 🧪 **CẦN TEST TAY (RC-1..RC-5)**

---

## 1. Bối cảnh & Mục tiêu

Cơ chế gợi ý nội dung có giải thích (Explainable Recommendations v1):
- Ghi nhận sự kiện hành vi người dùng (xem bài, tìm kiếm, lưu công thức) khi có sự đồng ý (Consent).
- Tính toán gợi ý trang chủ (`/recommendations/home`) ưu tiên lọc bỏ món vi phạm dị ứng / chế độ ăn trước khi xếp hạng.
- Quyền riêng tư: Người dùng có thể bật/tắt cá nhân hóa bất kỳ lúc nào. Khi tắt, hệ thống trả về gợi ý ngẫu nhiên hoặc bài viết phổ biến (cold-start).

---

## 2. Checklist Đã Hoàn Thành
- [x] Kết nối 4 endpoints live:
  - `POST /behavior-events`: Ghi nhận sự kiện với cơ chế deduplicate 5 phút.
  - `GET /users/me/personalization`: Lấy trạng thái đồng ý cá nhân hóa.
  - `PUT /users/me/personalization`: Bật/tắt cá nhân hóa.
  - `GET /recommendations/home`: Lấy danh sách gợi ý kèm lý do hiển thị (`reasonCodes`).
- [x] Hook `useTrackBehaviorEvent` tích hợp tại các điểm chạm xem bài, công thức, video.
- [x] Khối "Gợi ý dành riêng cho bạn" tại Trang chủ `/`.
- [x] Công tắc bật/tắt cá nhân hóa tại `/profile` (tab Bảo mật).
- [x] Unit tests: `recommendation.mapper.test.ts` pass 12/12 test cases.

---

## 3. Checklist Kịch Bản Test Tay Cần Chạy
- [ ] **RC-1**: Khách vãng lai xem trang chủ -> Nhận danh sách bài viết nổi bật chung.
- [ ] **RC-2**: Đăng nhập Member -> Trang chủ hiển thị khối gợi ý cá nhân kèm lý do (vd: `Dựa trên sở thích món nấm`).
- [ ] **RC-3**: Đảm bảo các món chứa nguyên liệu bị dị ứng trong Profile **không bao giờ** xuất hiện trong danh sách gợi ý.
- [ ] **RC-4**: Vào tab Bảo mật -> Tắt tính năng cá nhân hóa -> Trang chủ lập tức chuyển về danh sách cold-start.
- [ ] **RC-5**: Bật lại cá nhân hóa -> Gợi ý được khôi phục.
