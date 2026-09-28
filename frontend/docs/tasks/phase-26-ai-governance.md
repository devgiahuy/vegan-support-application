# Task: Phase 26 — Admin AI Governance & Safety (UC-16)

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-26-ai-governance.md`](../../../../backend/docs/prompts/phase-26-ai-governance.md)
> **Trạng thái Backend**: `READY`
> **Trạng thái Frontend**: 100% (Đã kết nối live 7 endpoints, 7 tầng hoàn chỉnh, Vitest 11/11 tests passed, build passed)
> **Mức độ ưu tiên**: ✅ **HOÀN THÀNH TÍCH HỢP LIVE**

---

## 1. Bối cảnh & Mục tiêu

Hệ thống giám sát và quản trị an toàn mô hình AI dành cho Quản trị viên:
- Theo dõi chỉ số vận hành AI: Tổng quan sức khỏe 24h (`GET /admin/ai/health`), tổng số câu hỏi, thời gian phản hồi trung bình (latency), tỷ lệ gặp lỗi, chi phí/quota (`GET /admin/ai/metrics`).
- Kiểm duyệt nhật ký gọi AI: **Bảo mật tuyệt đối** — dữ liệu cá nhân (PII), thông tin sức khỏe nhạy cảm phải được che mờ (redacted) trước khi hiển thị cho Admin (`GET /admin/ai/requests`).
- Cờ cảnh báo an toàn nội dung (Safety Flags): Tự động phát hiện các tín hiệu cảnh báo rủi ro an toàn mà không tự ý xử phạt cứng người dùng (`GET /admin/ai/flags`).
- Quản lý tính năng AI (Feature Toggles): Bật/tắt hoặc chuyển đổi nhà cung cấp/mô hình AI cho từng tính năng kèm lý do kiểm toán bắt buộc (`GET /admin/ai/features`, `PATCH /admin/ai/features/:feature`).
- Lịch sử kiểm toán cấu hình AI: Truy vết mọi thay đổi trạng thái kèm actorId, phiên bản và lý do (`GET /admin/ai/features/audit`).

---

## 2. Danh Sách Endpoints Live (Đã tích hợp)

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| `GET` | `/api/v1/admin/ai/health` | Admin | Tổng quan sức khỏe vận hành 24 giờ & chính sách lưu trữ 90 ngày |
| `GET` | `/api/v1/admin/ai/metrics` | Admin | Thống kê số lượng request, độ trễ, tỷ lệ hiệu chỉnh theo khoảng thời gian |
| `GET` | `/api/v1/admin/ai/requests` | Admin | Xem nhật ký request đã che mờ thông tin riêng tư (redacted) |
| `GET` | `/api/v1/admin/ai/flags` | Admin | Danh sách các cờ cảnh báo an toàn cần xem xét |
| `GET` | `/api/v1/admin/ai/features` | Admin | Trạng thái bật/tắt, phiên bản, model đang cấu hình của các tính năng AI |
| `PATCH` | `/api/v1/admin/ai/features/:feature` | Admin | Bật/tắt tính năng hoặc đổi model kèm lý do bắt buộc và chống xung đột 409 |
| `GET` | `/api/v1/admin/ai/features/audit` | Admin | Lịch sử kiểm toán các lần thay đổi cấu hình tính năng AI |

---

## 3. Checklist Hoàn Thành Khi Nối Live
- [x] Chạy `npm run sync:swagger` để cập nhật schema quản trị AI vào catalog.
- [x] Mở file `src/features/ai-governance/api/ai-governance.api.ts`:
  - Đặt `USE_FIXTURES = false`.
  - Nối axios calls thật với `API_ENDPOINTS.AI_GOVERNANCE.*`.
- [x] Kiểm tra tính năng Redaction: Quét DOM và phản hồi API đảm bảo không có bất kỳ chuỗi thông tin nhạy cảm thô nào bị lọt ra giao diện.
- [x] Bổ sung component `HealthSummary` và `FeaturesAuditTable` vào Tab Quản trị AI (`/admin/dashboard?tab=ai-governance`).
- [x] Chạy test tay AG-1..AG-4 trong Admin Dashboard.
- [x] 100% Verification gates passed (`npx tsc --noEmit`, `npm test`, `npm run build`).
