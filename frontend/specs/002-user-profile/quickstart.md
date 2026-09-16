# Quickstart Validation: User Profile

**Feature**: `002-user-profile` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Hướng dẫn xác thực end-to-end sau khi implement. Chi tiết ở `data-model.md` và `contracts/`.

## 1. Prerequisites

- Backend `:4000` chạy + đã seed (diet rule set v1 bắt buộc cho preview).
- Frontend `.env` trỏ `:4000`; `npm run dev` ở `frontend/`.
- Tài khoản đã đăng nhập (dùng tài khoản seed member hoặc tài khoản đăng ký từ luồng `001-user-auth`).

## 2. Static gates (bắt buộc, chạy trong `frontend/`)

| Lệnh | Kỳ vọng |
| --- | --- |
| `node node_modules/typescript/bin/tsc --noEmit` | 0 lỗi mới, không `any` mới |
| `npm test` | mapper test profile/health/diet pass, không regress test cũ |
| `npm run build` | thành công |
| `npm run lint` | không lỗi mới |
| `git diff --check` | sạch |

## 3. Kịch bản xác thực thủ công

### VP-1 — Xem hồ sơ (P1, FR-001, SC-001)

1. Đăng nhập, mở `/ho-so`.
2. **Kỳ vọng**: thấy tên, email, ảnh, vai trò, ngày tham gia của chính mình trong < 3s; khối sức khỏe/diet trống có lời mời nhập (nếu chưa có), không lỗi.
3. Mở DevTools Network: `GET /users/me` trả 200 đúng envelope.

### VP-2 — Cập nhật tên/ảnh (P1, FR-002, SC-002)

1. Đổi tên hiển thị → Lưu → thấy tên mới ở cả hồ sơ và header; F5 vẫn giữ.
2. Nhập URL ảnh không phải HTTP(S) → bị chặn tại client, không có request.
3. Không đổi gì → nút lưu disabled (không gọi API thừa).
4. Mạng lỗi/backend 400 → lỗi map đúng field.

### VP-3 — Sức khỏe + BMI/BMR/TDEE (P1, FR-003/FR-004, SC-003)

1. Nhập đủ 5 chỉ số hợp lệ → Lưu → thấy ngay BMI + phân loại + BMR + TDEE + nguồn thủ công, không cần F5; F5 vẫn còn.
2. Nhập số liệu cho BMI ngoài 12–45 (vd cao 250cm nặng 30kg) → lưu xong hiện cảnh báo nhưng vẫn lưu.
3. Bỏ trống tuổi → chặn tại client bằng tiếng Việt, không gửi request.
4. Đối chiếu số hiển thị khớp `data` trong Network response (không tính lại ở client).

### VP-4 — Xem trước + xác nhận diet (P2, FR-005/FR-006/FR-007, SC-004/SC-006)

1. Chọn thuần chay + chay kỳ + Phật giáo → Xem trước → thấy từng rule kèm toggle; rule cứng disabled + nhãn "Luôn bật".
2. Tắt vài rule thường, thêm 1 dị ứng + 1 kiêng (kèm ingredientId nếu có) → Xác nhận → lưu thành công, thấy ràng buộc hiệu lực.
3. F5 → lựa chọn giữ nguyên.
4. Kiểm tra request `PUT diet-preferences`: đủ `rules[]` + đúng `ruleSetVersion`, có `allergies`/`ingredientExclusions`.
5. Giả lập backend đổi rule set (nếu làm được) hoặc `requiresRuleReview: true` → UI đưa về màn preview, không tự bật rule.

### VP-5 — Lịch chay kỳ (P2, FR-008, SC-005)

1. Với lịch chay kỳ: chọn vài ngày → Lưu → F5 vẫn đúng các ngày.
2. Chuyển sang trường chay → màn lịch bị khóa/ẩn, không gửi `dates`.
3. Tài khoản chưa lưu diet mà gọi lưu lịch (test bằng cách xóa preferences ở BE nếu cần) → UI chặn + hướng dẫn quay lại lưu diet trước.
4. Nhập ngày sai định dạng → chặn tại client.

### VP-6 — Mã lỗi và edge (FR-009/FR-010)

1. Tắt backend tạm thời → lưu → báo lỗi kết nối tiếng Việt, dữ liệu đã nhập còn nguyên.
2. Backend trả `VALIDATION_ERROR` có `fields` → lỗi map đúng input.
3. Mở thực đơn khi chưa có sức khỏe (nếu test được) → thấy link về nhập sức khỏe thay vì crash.

### VP-7 — Ngoài scope (không đánh dấu hoàn thành nhầm)

1. Không có nút tải file ảnh lên; avatar chỉ là ô nhập URL.
2. Không có đồng bộ thiết bị đeo; nguồn duy nhất là nhập tay.
3. Không có nút xóa lịch sử hành vi (endpoint còn `PLANNED`).

## 4. Definition of Done (feature)

- [ ] Static gate §2 pass.
- [ ] VP-1 → VP-6 pass với backend local.
- [ ] `docs/BACKEND_INTEGRATION.md`: `FE integrated = Yes` cho 5 endpoint users/diet + preview, kèm ngày.
- [ ] `docs/PROGRESS.md`: cập nhật % task #9 (và #6 nếu liên quan) + lịch sử.
- [ ] `docs/WORK-LOG.md`: append entry.
- [ ] Không commit nếu chưa được yêu cầu.
