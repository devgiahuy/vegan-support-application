# WORK-LOG — Nhật ký làm việc (agent cập nhật sau mỗi task)

> Agent BẮT BUỘC append 1 entry sau mỗi task xong (xem `ARCHITECTURE.md` mục 7).
> Mỗi entry ghi: đã làm gì, file đổi, cách verify, % PROGRESS đổi ra sao.

## Mẫu entry (copy khi ghi mới)

```md
## [YYYY-MM-DD] — <tên task>

- Mục tiêu:
- Đã làm:
- File tạo/sửa:
- Verify: `npx tsc --noEmit` (kết quả), `npm test` (kết quả), test tay (mô tả)
- PROGRESS: <task> <cũ>% → <mới>% (lý do)
- Còn lại / rủi ro:
```

---

## [2026-09-15] — Khởi tạo PROGRESS + WORK-LOG + rule ARCHITECTURE

- Mục tiêu: có 2 file theo dõi + rule bắt agent cập nhật sau mỗi task.
- Đã làm:
  - Tạo `docs/PROGRESS.md` (bảng % theo 7 bước scaffold + lịch sử cập nhật).
  - Tạo `docs/WORK-LOG.md` (file này + mẫu entry).
  - Thêm `ARCHITECTURE.md` mục 7 bắt cập nhật cả 2 file sau mỗi task.
- File tạo/sửa:
  - Tạo `frontend/docs/PROGRESS.md`
  - Tạo `frontend/docs/WORK-LOG.md`
  - Sửa `frontend/docs/ARCHITECTURE.md` (thêm mục 7)
- Verify: đọc lại 3 file sau sửa (chưa chạy `tsc`/`test` vì chỉ sửa docs).
- PROGRESS: task 11 (Docs) → 100%.
- Còn lại / rủi ro: % các task 0-10 là ước lượng từ UI mock, agent phải rà soát + hiệu chỉnh ở task code kế tiếp.
