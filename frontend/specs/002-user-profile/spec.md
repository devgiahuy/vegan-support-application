# Feature Specification: User Profile (hồ sơ, sức khỏe, diet)

**Feature Branch**: `002-user-profile`

**Created**: 2026-09-15

**Status**: Draft

**Input**: User description: "tạo plan làm chức năng user ( các D:\Project\vegan-support-application\frontend\docs\api\users.md)"

**Backend contract**: `frontend/docs/api/users.md` (sync từ OpenAPI) + `frontend/docs/api/diet-rules.md` (riêng `POST /diet-rules/preview`) + `frontend/docs/BACKEND_INTEGRATION.md` §6.2 (các endpoint dưới đây đều `READY` từ 2026-09-15, contract `/api/v1`).

**SRS**: `frontend/docs/SRS_Vegan_Support_Application.md` FR-U02 + BL-02/BL-03/BL-04 (thay `veganType`/`dietSchool` cũ bằng `dietPattern` + `practiceSchedule` + `tradition` + rule confirmation). PROGRESS task #9 (Sức khỏe UC-13, hiện 20%) và một phần task #6 (thực đơn phụ thuộc `HEALTH_PROFILE_INCOMPLETE`).

**Liên quan**: spec `001-user-auth` đã tích hợp `GET /users/me` ở mức đọc 8 field user cơ bản; spec này mở rộng sang cập nhật hồ sơ, sức khỏe và diet.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Xem hồ sơ của tôi (Priority: P1)

Người dùng đã đăng nhập mở trang hồ sơ và thấy đầy đủ thông tin của mình: tên hiển thị, ảnh đại diện, vai trò, chỉ số sức khỏe đã lưu, và tóm tắt chế độ ăn hiện tại.

**Why this priority**: Mọi thao tác hồ sơ/sức khỏe/diet đều bắt đầu từ màn hình này; không xem được thì không làm gì tiếp.

**Independent Test**: Đăng nhập, mở trang hồ sơ, thấy tên + email + ảnh của mình và các khối sức khỏe/diet (có thể trống nếu chưa nhập, nhưng không lỗi).

**Acceptance Scenarios**:

1. **Given** đã đăng nhập, **When** mở trang hồ sơ, **Then** hiển thị đúng tên hiển thị, email, ảnh đại diện, vai trò và ngày tham gia của chính mình.
2. **Given** chưa từng nhập sức khỏe/diet, **When** mở trang hồ sơ, **Then** các khối sức khỏe/diet hiện trạng thái trống kèm lời mời nhập, không báo lỗi.
3. **Given** phiên hết hạn, **When** mở trang hồ sơ, **Then** được đưa về đăng nhập kèm đường quay lại, theo đúng luồng auth đã có.

---

### User Story 2 - Cập nhật tên hiển thị và ảnh đại diện (Priority: P1)

Người dùng đổi tên hiển thị và/hoặc ảnh đại diện, lưu thành công và thấy ngay trên hồ sơ lẫn header.

**Why this priority**: Nhu cầu cơ bản nhất của hồ sơ; endpoint yêu cầu ít nhất một field nên UX phải rõ ràng.

**Independent Test**: Đổi tên, lưu, tải lại trang vẫn thấy tên mới ở cả hồ sơ và header.

**Acceptance Scenarios**:

1. **Given** đang ở form hồ sơ, **When** đổi tên hiển thị hợp lệ và lưu, **Then** tên mới hiện ngay và giữ sau khi tải lại.
2. **Given** nhập URL ảnh không phải HTTP(S), **When** lưu, **Then** form báo lỗi tại trường ảnh, không gửi request.
3. **Given** không đổi gì, **When** bấm lưu, **Then** nút lưu bị vô hiệu hóa hoặc báo cần ít nhất một thay đổi, không gọi API thừa.

---

### User Story 3 - Nhập chỉ số sức khỏe và xem BMI/BMR/TDEE (Priority: P1)

Người dùng nhập chiều cao, cân nặng, tuổi, giới tính, mức vận động và lưu; hệ thống hiện BMI kèm phân loại, BMR, TDEE do backend tính.

**Why this priority**: Cửa ngõ của mọi tính năng dinh dưỡng (thiếu các trường này thì không tạo được thực đơn — mã `HEALTH_PROFILE_INCOMPLETE`); SRS yêu cầu hiển thị dưới 500ms ở phía hiển thị.

**Independent Test**: Nhập đủ 5 chỉ số, lưu, thấy ngay BMI + phân loại + BMR + TDEE; tải lại trang vẫn còn.

**Acceptance Scenarios**:

1. **Given** nhập đủ chiều cao, cân nặng, tuổi, giới tính, mức vận động hợp lệ, **When** lưu, **Then** hiện BMI kèm phân loại châu Á, BMR, TDEE và nguồn dữ liệu thủ công.
2. **Given** BMI dưới 12 hoặc trên 45, **When** lưu thành công, **Then** hiện cảnh báo giá trị bất thường nhưng vẫn lưu.
3. **Given** bỏ trống một trong các trường bắt buộc, **When** lưu, **Then** form chặn tại chỗ bằng tiếng Việt, chưa gửi request.

---

### User Story 4 - Xem trước và xác nhận chế độ ăn (Priority: P2)

Người dùng chọn kiểu ăn (thuần chay hoặc có trứng sữa), lịch thực hành (trường chay hoặc chay kỳ), truyền thống; xem trước từng quy tắc kèm công tắc bật/tắt rồi xác nhận lưu, đồng thời khai báo dị ứng và nguyên liệu kiêng.

**Why this priority**: Luồng diet-rule confirmation là cam kết BL-02/BL-03; backend là nơi quyết định, frontend chỉ gửi đúng ID quy tắc + trạng thái.

**Independent Test**: Chọn chế độ ăn, xem trước quy tắc, tắt/bật vài quy tắc cho phép, xác nhận, tải lại vẫn giữ nguyên lựa chọn.

**Acceptance Scenarios**:

1. **Given** đã chọn kiểu ăn/lịch/truyền thống, **When** xem trước, **Then** từng quy tắc hiện rõ tên, nguồn, mặc định và quy tắc cứng (không cho tắt).
2. **Given** đã xem trước, **When** xác nhận lưu kèm dị ứng và danh sách kiêng, **Then** lựa chọn được lưu và trang hiển thị ràng buộc hiệu lực hiện tại.
3. **Given** backend yêu cầu xem lại quy tắc, **When** lưu, **Then** người dùng được đưa về màn xem trước thay vì báo lỗi chung, không tự bật quy tắc mới.

---

### User Story 5 - Đặt ngày chay kỳ (Priority: P2)

Người dùng theo lịch chay kỳ chọn các ngày áp dụng trong tháng/tuần và lưu; người ăn trường chay không cần bước này.

**Why this priority**: Hoàn thiện luồng PERIODIC theo đúng ngữ nghĩa múi giờ Việt Nam; sai định dạng ngày là lỗi phổ biến cần chặn ở client.

**Independent Test**: Chọn vài ngày, lưu, tải lại vẫn thấy đúng các ngày đã chọn.

**Acceptance Scenarios**:

1. **Given** lịch thực hành là chay kỳ, **When** chọn các ngày và lưu, **Then** danh sách ngày được lưu và hiển thị đúng.
2. **Given** lịch thực hành là trường chay, **When** mở phần lịch, **Then** không bắt chọn ngày và không gửi danh sách ngày.
3. **Given** chưa lưu lựa chọn chế độ ăn, **When** mở phần lịch chay kỳ, **Then** được hướng dẫn quay lại lưu chế độ ăn trước, không cho lưu lịch đơn lẻ.

### Edge Cases

- Mất mạng khi lưu: giữ lại nội dung đã nhập, báo lỗi kết nối tiếng Việt, cho thử lại.
- Backend trả lỗi validation theo từng trường: map đúng vào input tương ứng, không chỉ toast chung.
- Backend trả `HEALTH_PROFILE_INCOMPLETE` ở màn hình khác (vd thực đơn): hiển thị đường dẫn về nhập sức khỏe, không crash.
- Dị ứng và loại trừ nguyên liệu luôn là ràng buộc cứng: UI không cho tắt, không gửi thay thế tự chế cho ID quy tắc.
- Ngày chay kỳ chỉ nhận định dạng ngày `YYYY-MM-DD`, không gửi giờ/phút; múi giờ hiển thị là Việt Nam.
- Ảnh đại diện chỉ nhận URL HTTP(S); không có tải file ảnh lên trong phạm vi này.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống PHẢI hiển thị hồ sơ của người dùng đang đăng nhập gồm tên hiển thị, email, ảnh đại diện, vai trò, trạng thái đơn contributor (nếu có), sức khỏe đã lưu và tóm tắt chế độ ăn.
- **FR-002**: Hệ thống PHẢI cho phép cập nhật tên hiển thị và URL ảnh đại diện (HTTP(S)); yêu cầu ít nhất một field thay đổi mới gửi; vô hiệu hóa lưu khi không có gì đổi.
- **FR-003**: Hệ thống PHẢI cho phép lưu 5 chỉ số sức khỏe (chiều cao, cân nặng, tuổi, giới tính, mức vận động) và hiển thị BMI kèm phân loại, BMR, TDEE, nguồn dữ liệu do backend trả về.
- **FR-004**: Hệ thống PHẢI cảnh báo khi BMI dưới 12 hoặc trên 45, và hiển thị lưu ý dinh dưỡng khi BMI dưới 16 hoặc trên 35.
- **FR-005**: Hệ thống PHẢI cho phép xem trước bộ quy tắc ăn theo bộ ba đã chọn (kiểu ăn, lịch thực hành, truyền thống), hiển thị rõ quy tắc cứng không được tắt, rồi mới cho xác nhận lưu.
- **FR-006**: Hệ thống PHẢI gửi đúng ID quy tắc + trạng thái bật/tắt khi lưu lựa chọn chế độ ăn; không tự chế ràng buộc thay cho ID quy tắc.
- **FR-007**: Hệ thống PHẢI quản lý dị ứng và danh sách kiêng riêng khỏi công tắc quy tắc; hai nhóm này luôn là ràng buộc cứng và hiển thị riêng.
- **FR-008**: Hệ thống PHẢI cho phép lưu danh sách ngày chay kỳ dạng `YYYY-MM-DD` khi lịch là chay kỳ; không gửi ngày khi lịch là trường chay; yêu cầu lưu chế độ ăn trước khi lưu lịch.
- **FR-009**: Hệ thống PHẢI xử lý lỗi nghiệp vụ bằng mã lỗi (`HEALTH_PROFILE_INCOMPLETE`, `DIET_RULE_RECONFIRMATION_REQUIRED`, `DIET_SCHEDULE_REQUIRED`, `DIET_RULES_UNAVAILABLE`, `INVALID_DIET_RULE_SELECTION`, `DIET_PREFERENCES_REQUIRED`, `DIET_SCHEDULE_NOT_APPLICABLE`, `INVALID_INGREDIENT_EXCLUSIONS`, `VALIDATION_ERROR`), không suy đoán theo nội dung thông báo.
- **FR-010**: Mọi form PHẢI kiểm tra phía client bằng tiếng Việt, map lỗi từng trường từ backend vào đúng input, và xử lý đủ 4 trạng thái tải/lỗi/trống/thành công.

### Key Entities *(include if feature involves data)*

- **Profile (Hồ sơ)**: định danh, email, tên hiển thị, ảnh đại diện, vai trò, trạng thái tài khoản, ngày tham gia, đơn contributor, kèm ảnh chụp nhanh sức khỏe và chế độ ăn.
- **HealthProfile (Sức khỏe)**: chiều cao, cân nặng, tuổi, giới tính, mức vận động (đầu vào) + BMI, BMR, TDEE, nguồn dữ liệu, thời điểm cập nhật (backend tính).
- **DietPreference (Lựa chọn chế độ ăn)**: kiểu ăn, lịch thực hành, truyền thống, phiên bản bộ quy tắc, thời điểm xác nhận, danh sách quy tắc kèm trạng thái, lịch, dị ứng, loại trừ nguyên liệu, ràng buộc hiệu lực.
- **DietRule (Quy tắc)**: định danh quy tắc, tên, nguồn, mặc định, cờ cứng (luôn bật), trạng thái bật/tắt của người dùng.
- **Allergy (Dị ứng)**: mã chất gây dị ứng, nhãn hiển thị, mức độ — luôn là ràng buộc cứng.
- **IngredientExclusion (Kiêng nguyên liệu)**: định danh chuẩn (tùy chọn), tên nguyên liệu, lý do — luôn là ràng buộc cứng.
- **DietSchedule (Lịch chay kỳ)**: lịch thực hành, múi giờ, danh sách ngày `YYYY-MM-DD`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người dùng mở trang hồ sơ và thấy đầy đủ thông tin của mình trong dưới 3 giây sau khi trang tải xong (mạng ổn định).
- **SC-002**: 95% lần lưu tên/ảnh hợp lệ thành công ngay lần thử đầu và hiển thị đúng sau khi tải lại.
- **SC-003**: 95% lần lưu đủ 5 chỉ số sức khỏe hiện BMI/BMR/TDEE ngay mà không cần tải lại trang.
- **SC-004**: 100% lần xác nhận chế độ ăn gửi đúng ID quy tắc + trạng thái (không có ràng buộc tự chế), kiểm chứng qua dữ liệu backend trả về.
- **SC-005**: 90% người dùng chay kỳ lưu lịch thành công ngay lần đầu khi đã có lựa chọn chế độ ăn.
- **SC-006**: 0 trường hợp quy tắc cứng bị tắt hoặc dị ứng/kiêng bị bỏ qua ở phía hiển thị sau khi lưu.

## Assumptions

- Các endpoint trong phạm vi (`GET/PATCH /users/me`, `PUT /users/me/health-profile`, `POST /diet-rules/preview`, `PUT /users/me/diet-preferences`, `PUT /users/me/diet-schedule`) đã `READY` theo BACKEND_INTEGRATION v1.5 và giữ nguyên envelope `{success, data, meta}` / `{success:false, error:{code,message,fields,requestId}}`.
- ID là UUID string, timestamp ISO 8601 UTC, ngày chay kỳ là `YYYY-MM-DD` theo múi giờ `Asia/Ho_Chi_Minh`; frontend không suy đoán nội dung thông báo, chỉ dùng mã lỗi.
- Ảnh đại diện chỉ là URL HTTP(S) do người dùng dán; không có tải file ảnh lên backend trong phạm vi này (không có endpoint `READY`).
- `DELETE /users/me/behavior-history` còn `PLANNED` → ngoài phạm vi spec này.
- Tính năng đo sức khỏe qua thiết bị đeo/wearable là Phase 2 → ngoài phạm vi; nguồn dữ liệu duy nhất là nhập tay (`MANUAL`).
- Người dùng đã đăng nhập mới dùng được các màn hình này (luồng auth và route bảo vệ đã có từ spec `001-user-auth`).
