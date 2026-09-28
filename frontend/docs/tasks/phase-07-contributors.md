# Task: Phase 07 — Contributor Applications (Legacy Baseline)

> **Tương ứng Backend Prompt**: [`backend/docs/prompts/phase-07-contributors.md`](../../../../backend/docs/prompts/phase-07-contributors.md)
> **Trạng thái Backend**: `COMPLETED` (Đang được thay thế bởi Phase 14)
> **Trạng thái Frontend**: 90% (Đang chạy baseline subtype)
> **Mức độ ưu tiên**: ⏳ **GIỮ NGUYÊN BASELINE ĐỂ CHỜ MIGRATE PHASE 14**

---

## 1. Bối cảnh & Mục tiêu

Giai đoạn xây dựng nền tảng xét duyệt người đóng góp:
- Thành viên nộp đơn xin nâng cấp lên Người đóng góp (Contributor).
- Quản trị viên duyệt hoặc từ chối đơn trong Admin Dashboard.
- **Lưu ý**: Giai đoạn này là baseline tạm thời. Phase 14 sẽ bỏ subtype và chuyển sang mô hình Unified Contributor (xem [`phase-14-unified-contributors.md`](./phase-14-unified-contributors.md)).

---

## 2. Checklist Đã Hoàn Thành
- [x] Kết nối 4 endpoints live:
  - `POST /contributor-applications`: Nộp đơn.
  - `GET /contributor-applications/me`: Lịch sử đơn cá nhân.
  - `GET /admin/contributor-applications`: Hàng chờ xét duyệt.
  - `PATCH /admin/contributor-applications/:id/review`: Phê duyệt/từ chối.
- [x] Form nộp đơn tại `/profile` (tab Contributor) và hàng chờ duyệt tại `/admin/dashboard?tab=contrib-apps`.
- [x] Unit tests: `contributor.mapper.test.ts` pass 12/12 test cases.

---

## 3. Checklist Chuẩn Bị Cho Phase 14
- [ ] Không đầu tư mở rộng thêm các tính năng theo subtype cũ.
- [ ] Chuẩn bị kế hoạch chuyển đổi sang `approvalBasis` khi Backend Phase 14 hoàn tất build gate.
