# Phase 0 Research: User Profile

**Feature**: `002-user-profile` | **Date**: 2026-09-15 | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

Nguồn: `docs/api/users.md`, `docs/api/diet-rules.md`, `BACKEND_INTEGRATION.md` §6.2/§7.2/§8, SRS FR-U02 + BL-02/BL-03/BL-04, code hiện trạng (`features/auth`, `features/health/lib/bmi.ts`, `app/(site)/ho-so/page.tsx`).

Không có `NEEDS CLARIFICATION` trong Technical Context.

---

## R1 — Tách 2 feature folder, dùng chung `User` từ auth

**Decision**: `features/profile` sở hữu hồ sơ chi tiết + sức khỏe; `features/diet-preferences` sở hữu diet flow. Phần hiển thị tên/email/avatar/role dùng lại `User` từ `features/auth` (không định nghĩa lại); `features/profile` định nghĩa `DetailedProfile` mở rộng thêm `healthProfile` + `dietPreference` tóm tắt.

**Rationale**: Đúng mapping §5 và nguyên tắc feature độc lập (profile không import diet, diet không import profile; cả hai chỉ dùng chung `common/lib/types` + `User` từ auth như entity dùng chung đã duyệt).

**Alternatives considered**:
- Gom tất cả vào `features/profile` → loại, diet flow (preview → preferences → schedule) đủ lớn để thành domain riêng và §5 đã chỉ định `features/diet-preferences`.
- Định nghĩa `Profile` riêng không dùng `User` → loại, nhân đôi nguồn chân lý cho cùng một con người.

---

## R2 — Constant endpoint mới (giữ `USERS.ME` đã có)

**Decision**: Bổ sung vào `API_ENDPOINTS`:
- `USERS.UPDATE_ME = '/users/me'` (PATCH — cùng path với ME, khác method; hằng số là path nên tái dùng `USERS.ME` cho cả GET/PATCH, không tạo constant trùng — quyết định này ghi rõ để implement thống nhất).
- `USERS.HEALTH_PROFILE = '/users/me/health-profile'` (PUT).
- `USERS.DIET_PREFERENCES = '/users/me/diet-preferences'` (PUT).
- `USERS.DIET_SCHEDULE = '/users/me/diet-schedule'` (PUT).
- `DIET_RULES.PREVIEW = '/diet-rules/preview'` (POST).

**Rationale**: Hằng số mô tả path; method nằm ở call site (`api.put/patch`). Tránh 2 constant cùng giá trị gây nhầm.

**Alternatives considered**: Tạo `UPDATE_ME` riêng cùng giá trị → loại, trùng lặp và dễ lệch khi đổi path.

---

## R3 — Sức khỏe: backend tính, frontend hiển thị + phân loại

**Decision**: `HealthProfile` model giữ nguyên số backend trả (`bmi/bmr/tdee` đã làm tròn 2 decimals — **không** tính lại). Phân loại BMI + cảnh báo dùng `features/health/lib/bmi.ts` có sẵn (`calcBmi` đã có `isOutOfSafeRange` cho <12/>45 và chuẩn châu Á); bổ sung `EXTRA_ACTIVE` (1.9) vào `ACTIVITY_LEVELS` vì backend enum có 5 mức mà lib hiện chỉ có 4. Disclaimer BMI <16/>35 render theo SRS FR-U02 edge.

**Rationale**: Backend là nguồn tính toán duy nhất (tránh lệch 2 decimals); lib hiện có đã đúng công thức Mifflin–St Jeor và chuẩn châu Á, chỉ thiếu 1 mức vận động.

**Alternatives considered**:
- Tính lại BMI/BMR/TDEE ở client để "preview trước khi lưu" → loại ở slice này, dễ lệch rounding với backend và SRS chỉ yêu cầu hiển thị sau lưu; có thể làm sau như enhancement UX.
- Sửa công thức/lib → loại, lib đã khớp SRS (BMI=kg/m²; BMR Nam +5/Nữ −161; TDEE ×[1.2|1.375|1.55|1.725|1.9]).

---

## R4 — Diet flow 3 bước đúng §7.2, state máy ở client tối thiểu

**Decision**: Luồng UI: (1) `DietSelector` (3 nhóm radio: pattern/schedule/tradition) → (2) gọi `preview` → render `DietRuleList` (mỗi rule có toggle, rule cứng `isHard`/required disabled + nhãn "Luôn bật") + `AllergyEditor` + `ExclusionEditor` → (3) `savePreferences` (gửi `dietPattern/practiceSchedule/tradition/ruleSetVersion/rules[]` + `scheduleDates?` + `allergies[]` + `ingredientExclusions[]`) → nếu `PERMANENT` xong; nếu `PERIODIC` chuyển sang `ScheduleEditor` → `saveSchedule({dates})`.

**Rationale**: Khớp BACKEND_INTEGRATION §7.2 từng bước; `ruleSetVersion` từ preview phải gửi lại nguyên vẹn (backend dùng để phát hiện `INVALID_DIET_RULE_SELECTION`).

**Alternatives considered**:
- Gộp preview + save vào 1 màn không bước trung gian → loại, vi phạm yêu cầu "user xác nhận toàn bộ rule" và khó xử lý `DIET_RULE_RECONFIRMATION_REQUIRED`.
- Lưu nháp client (localStorage) giữa các bước → loại, thêm state không cần thiết; dữ liệu form giữ trong memory của wizard component là đủ.

---

## R5 — Mã lỗi diet và hành vi UI

**Decision**: Bảng ánh xạ (chi tiết ở [contracts/diet-errors.md](./contracts/diet-errors.md)):
- `DIET_RULE_RECONFIRMATION_REQUIRED` → quay về màn preview (giữ lựa chọn đã chọn), toast nhẹ, không tự bật rule mới.
- `DIET_SCHEDULE_REQUIRED` → yêu cầu chọn ngày (chuyển sang ScheduleEditor / báo tại đó).
- `DIET_PREFERENCES_REQUIRED` → chặn lưu lịch, điều hướng về màn preferences.
- `DIET_RULES_UNAVAILABLE` → vô hiệu hóa toàn bộ nút lưu diet, hiện trạng thái cấu hình chưa sẵn sàng.
- `INVALID_DIET_RULE_SELECTION` → sync lại preview và yêu cầu xác nhận lại toàn bộ.
- `HEALTH_PROFILE_INCOMPLETE` (gặp ở màn khác) → link về nhập sức khỏe.
- `INVALID_INGREDIENT_EXCLUSIONS` → báo bỏ mục rỗng/trùng.
- Quy tắc cứng/dị ứng/kiêng: không có toggle tắt; gửi đúng `ruleDefinitionId + enabled`.

**Rationale**: BACKEND_INTEGRATION §8 đã chốt hành vi từng mã; frontend chỉ thực thi, không sáng tạo thêm.

---

## R6 — Đồng bộ Zustand user sau PATCH me

**Decision**: Sau `PATCH /users/me` thành công, gọi `useAuthStore.setUser(profileMapper.toUser(...))` (dùng lại `User` từ auth) + invalidate `PROFILE_QUERY_KEYS.detail` và `AUTH_QUERY_KEYS.me()`. Không tạo store mới.

**Rationale**: Header (`site-header.tsx`) đọc Zustand `user`; đồng bộ để tên/avatar mới hiện ngay không cần F5. `setUser` đã có từ `001-user-auth`.

**Alternatives considered**: Chỉ invalidate query và chờ refetch → loại, header không đọc query mà đọc store nên sẽ hiển thị cũ tới lần F5.

---

## R7 — Avatar là URL, validate HTTP(S)

**Decision**: `avatarUrl` là text input + preview ảnh; zod `.url('URL ảnh không hợp lệ')` + refine `startsWith('http://') || startsWith('https://')`; cho phép rỗng (xóa ảnh → gửi `null`). Không upload file.

**Rationale**: Contract `UpdateBasicProfileRequest.avatarUrl` là `string|null` format `uri`; PATCH yêu cầu HTTP(S) theo §6.2; không có endpoint upload `READY`.

---

## R8 — Ngày chay kỳ `YYYY-MM-DD`

**Decision**: `ScheduleEditor` dùng multi-select ngày (ô `input type="date"` thêm từng ngày + list chip xóa, hoặc calendar đơn giản tự code). Validate regex `^\d{4}-\d{2}-\d{2}$` + `safeDate` ở mapper; gửi mảng string nguyên văn, không convert timezone. Hiển thị theo `Asia/Ho_Chi_Minh` (mặc định của `toLocaleDateString('vi-VN')` trên máy user VN; không ép timezone ở client vì backend đã chốt semantic).

**Rationale**: Tránh bug lệch ngày do `new Date('YYYY-MM-DD')` parse UTC. Backend lưu PostgreSQL `DATE`.

**Alternatives considered**: Dùng thư viện calendar (react-day-picker) → loại ở slice này, chưa có trong deps và input date + chip đủ dùng; có thể nâng cấp sau.

---

## R9 — Trang `/ho-so` refactor giữ layout

**Decision**: Đọc kỹ `app/(site)/ho-so/page.tsx` hiện tại (~914 dòng mock) khi implement; thay từng khối mock bằng consumer thật (`useDetailedProfileQuery`, `BasicProfileForm`, `HealthProfileForm`, `HealthSummary`, link sang diet), giữ nguyên layout/style/token. Không viết lại trang từ đầu.

**Rationale**: Giảm rủi ro mất UX đã duyệt; đúng tinh thần "mock được thay bằng integration".

**Alternatives considered**: Viết trang mới → loại, mất công và dễ lệch design.

---

## R10 — Kiểm thử

**Decision**: Mapper test bắt buộc cho 4 mapper mới (`profile`, `health`, `diet` gồm preview/preferences/schedule): shape thật + biến thể `null`/thiếu field + enum lạ + round-trip request DTO. `tsc/test/build` là gate. Test tay theo `quickstart.md` với backend `:4000` (cần tài khoản đã đăng nhập; seed member có sẵn).

**Rationale**: Cùng governance với `001-user-auth`.

---

## Tổng hợp quyết định

| ID | Quyết định cốt lõi |
| --- | --- |
| R1 | 2 feature folder; dùng lại `User` từ auth |
| R2 | Thêm 4 constant path mới; tái dùng `USERS.ME` cho GET/PATCH |
| R3 | Backend tính BMI/BMR/TDEE; bổ sung `EXTRA_ACTIVE` 1.9; cảnh báo theo SRS |
| R4 | Wizard 3 bước preview → preferences → schedule; gửi đúng ID rule + version |
| R5 | Ánh xạ mã lỗi diet theo §8, không sáng tạo thêm |
| R6 | Đồng bộ Zustand user sau PATCH + invalidate cả 2 key |
| R7 | Avatar là URL HTTP(S), cho phép null |
| R8 | Ngày `YYYY-MM-DD` nguyên văn, không convert timezone |
| R9 | Refactor `/ho-so` giữ layout |
| R10 | Mapper test + gates + quickstart thủ công |

Không còn mục nào cần làm rõ thêm.
