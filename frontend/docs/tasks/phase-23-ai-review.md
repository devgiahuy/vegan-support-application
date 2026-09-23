# Task: Phase 23 — AI Sharing & Unified Contributor Verification

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-23-ai-review.md`](../../../../backend/docs/prompts/phase-23-ai-review.md)
> **Trạng thái Backend**: `NOT_STARTED`
> **Trạng thái Frontend**: `PLANNED` (Đang có scaffold fixture chat-sharing cũ, sẽ migrate sang AI Artifacts)
> **Phụ thuộc**: Phase 11 (AI Chat), Phase 13 (Recipe Nutrition), Phase 14 (Unified Contributor), Phase 21, 22
> **Mức độ ưu tiên**: 📋 **KẾ HOẠCH TƯƠNG LAI**

---

## 1. Bối cảnh & Mục tiêu

Chia sẻ câu trả lời của AI và kiểm chứng bởi cộng đồng chuyên gia:
- Người dùng lưu câu trả lời hữu ích từ AI Chat thành `AI Artifact` có phiên bản cố định.
- Cho phép chia sẻ công khai qua liên kết rút gọn (chỉ chia sẻ câu trả lời cụ thể, không để lộ lịch sử chat cá nhân).
- **Kiểm chứng chuyên gia (Contributor Verification)**:
  - Mọi Contributor đã duyệt (Unified Contributor từ Phase 14) hoặc Admin đều có quyền kiểm chứng câu trả lời.
  - Cấm tự kiểm chứng bài chia sẻ của chính mình.
  - Huy hiệu hiển thị: "Được kiểm chứng bởi Người đóng góp", **tuyệt đối không ghi "chứng nhận khoa học"**.
  - Admin có quyền ghi đè hoặc thu hồi kiểm chứng kèm lý do kiểm toán.

---

## 2. Kế hoạch Endpoints Dự Kiến

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| `POST` | `/api/v1/ai-artifacts` | Member | Lưu câu trả lời thành artifact cố định |
| `PATCH` | `/api/v1/ai-artifacts/:id/visibility` | Member (Owner) | Bật/tắt chế độ chia sẻ công khai |
| `GET` | `/api/v1/ai-artifacts/public` | Public | Danh sách các câu trả lời AI hữu ích được chia sẻ |
| `POST` | `/api/v1/ai-artifacts/:id/verifications` | Contributor/Admin | Thêm đánh giá kiểm chứng của chuyên gia |
| `PATCH` | `/api/v1/admin/ai-verifications/:id` | Admin | Can thiệp/hủy bỏ kiểm chứng vi phạm kèm lý do |

---

## 3. Checklist Chuẩn Bị Khi Backend READY
- [ ] Migrate `features/chat/components/share-*` và `specs/014-chat-sharing-verification` sang hợp đồng `AI Artifacts` mới.
- [ ] Nâng cấp trang `/assistant/public` để hiển thị huy hiệu kiểm chứng chuẩn và ghi chú của Contributor.
- [ ] Kiểm tra phân quyền: Nút "Kiểm chứng" chỉ xuất hiện với người dùng có vai trò `CONTRIBUTOR` hoặc `ADMIN`.
