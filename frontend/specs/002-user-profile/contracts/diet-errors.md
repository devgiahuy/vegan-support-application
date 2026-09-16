# Contract: Diet Error Codes → UI Behavior

**Feature**: `002-user-profile` | **Nguồn**: `BACKEND_INTEGRATION.md` §8, Clarifications: không có UI đặc biệt ngoài bảng dưới — mọi mã đều có hành vi xác định.

Nguyên tắc: branch theo `error.code` (qua `getApiErrorCode`), `message` chỉ fallback hiển thị. Toast global (5xx/403/429/network) trong `lib/axios.ts` giữ nguyên — không toast đè.

| Code | HTTP | Hành vi UI frontend |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Map `error.fields` vào đúng input (tên/ảnh/chỉ số/ngày); không retry |
| `DIET_RULE_RECONFIRMATION_REQUIRED` | 409 | Quay về màn preview, giữ nguyên lựa chọn đã chọn; toast nhẹ "Bộ quy tắc đã thay đổi, vui lòng xem lại"; **không** tự bật rule mới |
| `INVALID_DIET_RULE_SELECTION` | 409 | Gọi lại preview (sync mới) rồi yêu cầu user xác nhận lại toàn bộ rule |
| `DIET_RULE_REQUIRED` | 409 | Giữ bật quy tắc cứng của diet pattern ở UI (không cho tắt từ đầu nên mã này chỉ là lưới an toàn) |
| `DIET_SCHEDULE_REQUIRED` | 409 | Yêu cầu chọn ngày: chuyển sang `ScheduleEditor` / báo tại đó |
| `DIET_PREFERENCES_REQUIRED` | 409 | Chặn lưu lịch; điều hướng user về màn lưu diet preference trước |
| `DIET_SCHEDULE_NOT_APPLICABLE` | 409 | Ẩn/khóa màn lịch khi `practiceSchedule` là `PERMANENT`; không gửi ngày |
| `DIET_RULES_UNAVAILABLE` | 503 | Vô hiệu hóa toàn bộ nút lưu diet; hiện trạng thái "cấu hình chưa sẵn sàng", cho thử lại sau |
| `INVALID_INGREDIENT_EXCLUSIONS` | 400 | Báo bỏ mục rỗng/trùng khỏi danh sách kiêng (client đã dedupe trước) |
| `HEALTH_PROFILE_INCOMPLETE` | 409 | Hiện đường dẫn về nhập sức khỏe (link tới `/ho-so` khối sức khỏe); không crash màn hình gọi |
| `NO_ELIGIBLE_RECIPE` | 409 | (Màn thực đơn, ngoài scope slice này) Hiển thị slot trống/warnings — ghi nhận để feature meal-plan dùng |
| `AUTH_REQUIRED` / `TOKEN_EXPIRED` / `INVALID_REFRESH_TOKEN` / `REFRESH_TOKEN_REUSED` | 401/403 | Luồng auth chung từ `001-user-auth` (refresh-queue → logout + về login) |

## Definition of Done

- [ ] Mọi mã trong bảng có nhánh xử lý riêng, không gom vào alert chung (trừ `message` fallback).
- [ ] Không có chỗ nào branch theo text `message`.
- [ ] `requiresRuleReview === true` sau save cũng đưa về màn preview (tương đương reconfirmation).
