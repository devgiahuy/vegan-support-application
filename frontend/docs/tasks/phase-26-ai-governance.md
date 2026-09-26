# Task: Phase 26 — Admin AI Governance & Safety (UC-16)

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-26-ai-governance.md`](../../../../backend/docs/prompts/phase-26-ai-governance.md)
> **Trạng thái Backend**: `NOT_STARTED`
> **Trạng thái Frontend**: 70% (Đã scaffold 7 tầng, tab `ai-governance` trong Admin Dashboard, che mờ dữ liệu nhạy cảm, dùng fixture)
> **Mức độ ưu tiên**: ⏳ **CHỜ BACKEND READY ĐỂ NỐI LIVE**

---

## 1. Bối cảnh & Mục tiêu

Hệ thống giám sát và quản trị an toàn mô hình AI dành cho Quản trị viên:
- Theo dõi chỉ số vận hành AI: Tổng số câu hỏi, thời gian phản hồi trung bình (latency), tỷ lệ gặp lỗi, chi phí/quota.
- Kiểm duyệt nhật ký gọi AI: **Bảo mật tuyệt đối** — dữ liệu cá nhân (PII), thông tin sức khỏe nhạy cảm phải được che mờ (redacted) trước khi hiển thị cho Admin.
- Cờ cảnh báo vi phạm nội dung (Safety Flags): Tự động phát hiện các câu hỏi vi phạm tiêu chuẩn cộng đồng hoặc hướng dẫn y tế sai lệch.
- Quản lý tính năng AI (Feature Toggles): Bật/tắt hoặc chuyển đổi nhà cung cấp/mô hình AI cho từng tính năng (Chat, Nhận diện tủ lạnh, Bóc tách hóa đơn) kèm lý do kiểm toán bắt buộc.

---

## 2. Kế hoạch Endpoints Dự Kiến

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| `GET` | `/api/v1/admin/ai/metrics` | Admin | Thống kê số lượng request, độ trễ theo khoảng thời gian |
| `GET` | `/api/v1/admin/ai/requests` | Admin | Xem nhật ký request đã che mờ thông tin riêng tư |
| `GET` | `/api/v1/admin/ai/flags` | Admin | Danh sách các cờ cảnh báo an toàn cần xem xét |
| `GET` | `/api/v1/admin/ai/features` | Admin | Trạng thái bật/tắt và model đang cấu hình của các tính năng AI |
| `PATCH` | `/api/v1/admin/ai/features/:feature` | Admin | Bật/tắt tính năng hoặc đổi model kèm lý do bắt buộc |

---

## 3. Checklist Chuẩn Bị Khi Backend READY
- [ ] Chạy `npm run sync:swagger` để cập nhật schema quản trị AI.
- [ ] Mở file `src/features/ai-governance/api/ai-governance.api.ts`:
  - Đặt `USE_FIXTURES = false`.
  - Nối axios calls thật với `API_ENDPOINTS.AI_GOVERNANCE.*`.
- [ ] Kiểm tra tính năng Redaction: Quét DOM đảm bảo không có bất kỳ chuỗi thông tin nhạy cảm thô nào bị lọt ra giao diện.
- [ ] Chạy test tay AG-1..AG-3 trong Admin Dashboard (`/admin/dashboard?tab=ai-governance`).
