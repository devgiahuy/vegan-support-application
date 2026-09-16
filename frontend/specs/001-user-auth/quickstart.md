# Quickstart Validation: User Auth

**Feature**: `001-user-auth` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Hướng dẫn xác thực end-to-end sau khi implement. Không chứa code implementation — chi tiết ở `data-model.md` và `contracts/`.

## 1. Prerequisites

- Backend chạy ở `http://localhost:4000` với 5 endpoint §6.2 `READY`.
- `frontend/.env.local`:
  ```text
  NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
  BACKEND_API_URL=http://localhost:4000/api/v1
  ```
- Node + dependencies đã cài (`npm install` trong `frontend/`).
- Một tài khoản test (đăng ký mới qua UI) và (tùy chọn) một tài khoản `ADMIN` seed từ backend.

## 2. Static gates (bắt buộc, chạy trong `frontend/`)

| Lệnh | Kỳ vọng |
| --- | --- |
| `node node_modules/typescript/bin/tsc --noEmit` | 0 lỗi, không `any` mới |
| `npm test` | mapper test auth pass, các test cũ không regress |
| `npm run build` | build thành công, không lỗi route handler |
| `npm run lint` | không lỗi mới |
| `git diff --check` | không whitespace error |

## 3. Kịch bản xác thực thủ công

### VS-1 — Đăng ký và tự đăng nhập (P1, FR-001/FR-002, SC-001)

1. Mở `/login`, chọn tab "Tạo tài khoản".
2. Nhập tên hiển thị, email mới, mật khẩu đạt chuẩn (≥8, có chữ hoa, có số), xác nhận mật khẩu.
3. Submit.

**Kỳ vọng**: tài khoản được tạo, người dùng được đăng nhập ngay (thấy tên trên header), hoàn tất < 3 phút; không thấy màn hình login lại.
**Negative**: dùng lại email đó → inline lỗi tại field email ("email đã được sử dụng"), không tạo tài khoản thứ hai.
**Client validate**: mật khẩu dưới 8 ký tự → chặn tại chỗ, không gửi request.

### VS-2 — Đăng nhập và lỗi xác thực (P1, FR-003/FR-009)

1. Đăng xuất, rồi đăng nhập lại bằng email/mật khẩu vừa tạo.
2. Thử lại với mật khẩu sai.

**Kỳ vọng**: lần đúng → vào app ở trạng thái đăng nhập; lần sai → inline "Email hoặc mật khẩu không đúng.", không tiết lộ email tồn tại.
**Bổ sung**: nếu backend trả `ACCOUNT_LOCKED` (423) hoặc `ACCOUNT_BANNED` (403), UI **chỉ** hiện thông báo lỗi đăng nhập thất bại chung — **không** CAPTCHA, **không** đếm ngược (Clarifications 2026-09-15).

### VS-3 — Duy trì phiên sau F5 (P1, FR-004/FR-005, SC-003/SC-004)

1. Đang đăng nhập, nhấn F5 trang bất kỳ.
2. (Nâng cao) Xóa access token trong memory bằng DevTools mà giữ cookie, rồi thao tác gọi API cần quyền.

**Kỳ vọng**: vẫn đăng nhập, không nháy màn hình login; request 401 được refresh tự động rồi retry thành công; chỉ **một** request `/api/auth/refresh-token` dù nhiều request 401 cùng lúc (quan sát Network tab).

### VS-4 — Refresh thất bại / reuse (P1, FR-005)

1. Xóa refresh cookie trong DevTools (hoặc dùng refresh token đã bị thu hồi), rồi thao tác gọi API cần quyền.

**Kỳ vọng**: auth state bị xóa, có toast "Phiên đăng nhập đã hết hạn" (hoặc "đã bị thu hồi"), chuyển về `/login` với `?from=<path>`; không lặp refresh vô hạn.

### VS-5 — Đăng xuất (P1, FR-006)

1. Đang đăng nhập, mở menu người dùng → "Đăng xuất".
2. Thử mở một route bảo vệ (vd `/profile` hoặc `/dashboard`).

**Kỳ vọng**: header về trạng thái khách; route bảo vệ bị middleware chuyển về `/login`; cookie auth đã bị xóa.
**ALL_DEVICES**: nếu UI có lựa chọn "đăng xuất tất cả thiết bị", chọn nó và kiểm tra phiên trên một trình duyệt/thiết bị khác hết hiệu lực.

### VS-6 — Đăng ký kèm nguyện vọng Contributor (P2, FR-007/FR-008, SC-005)

1. Ở tab đăng ký, bật nguyện vọng contributor, chọn loại + nhập kinh nghiệm + link tham khảo.
2. Submit và kiểm tra hồ sơ/`/users/me`.

**Kỳ vọng**: `role` vẫn là `MEMBER`; hồ sơ hiển thị đơn `PENDING` kèm loại nguyện vọng; **không** xuất hiện menu/route contributor nào; token không chứa quyền contributor.
**Negative**: bật nguyện vọng nhưng bỏ trống kinh nghiệm → chặn tại client; nếu backend trả `VALIDATION_ERROR`, lỗi map đúng vào field.

### VS-7 — Biến thể payload / mapper resilience (ARCHITECTURE §3)

1. Trong lúc test, xác nhận UI **không vỡ** khi backend trả `avatarUrl: null`, `contributorApplication: null`, `role`/`status` lạ.
2. Xác nhận không có component nào đọc DTO thô (grep `features/auth` cho `Dto` trong JSX/component).

**Kỳ vọng**: fallback an toàn (avatar placeholder, không crash).

### VS-8 — Ngoài scope (đảm bảo không "đánh dấu hoàn thành" nhầm)

1. Nút Google/Apple → chỉ thông báo "sẽ sớm khả dụng".
2. Tab "Khôi phục mật khẩu" và `/xac-thuc-otp` → vẫn là placeholder demo.

**Kỳ vọng**: không gọi endpoint không tồn tại; `BACKEND_INTEGRATION.md` không ghi các mục này là `READY`/FE integrated.

## 4. Definition of Done (feature)

- [ ] Tất cả static gate §2 pass.
- [ ] VS-1 → VS-7 pass với backend local.
- [ ] `docs/BACKEND_INTEGRATION.md`: cột `FE integrated` = Yes cho 4 endpoint auth + `/users/me`, kèm ngày/changelog.
- [ ] `docs/PROGRESS.md`: cập nhật % task #1 + lịch sử cập nhật.
- [ ] `docs/WORK-LOG.md`: append entry (mục tiêu, file đổi, kết quả verify, rủi ro còn lại).
- [ ] Không commit nếu chưa được yêu cầu.
