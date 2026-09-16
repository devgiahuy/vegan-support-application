# Feature Specification: User Auth (register/login/session/logout)

**Feature Branch**: `001-user-auth`

**Created**: 2026-09-15

**Status**: Draft

**Input**: User description: "tạo plan làm chức năng auth ( các endpoint D:\Project\vegan-support-application\frontend\docs\api\auth.md)"

**Backend contract**: `frontend/docs/api/auth.md` (sync từ OpenAPI) + `frontend/docs/BACKEND_INTEGRATION.md` §6.2 (4 endpoint Auth đều `READY` từ 2026-09-15, contract `/api/v1`).

**SRS**: `frontend/docs/SRS_Vegan_Support_Application.md` FR-U01 + BL-01 + BL-13. PROGRESS task #1 (Auth UC-01, hiện 50%).

## Clarifications

### Session 2026-09-15

- Q: Khi người dùng sai mật khẩu nhiều lần và backend trả `ACCOUNT_LOCKED` (HTTP 423), frontend chỉ cần hiển thị thông báo khóa tài khoản, hay còn phải hiển thị và xử lý CAPTCHA? → A: Chỉ cần thông báo lỗi đăng nhập thất bại chung; không CAPTCHA, không UI đếm ngược/thời gian thử lại riêng.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Đăng ký tài khoản Member (Priority: P1)

Người dùng mới nhập email + mật khẩu + tên hiển thị để tạo tài khoản Member và được đăng nhập ngay để dùng app.

**Why this priority**: Không có đăng ký thì không có user, mọi luồng Member/contributor đều chặn. Đây là cửa vào MVP.

**Independent Test**: Mở trang đăng ký, nhập email mới + mật khẩu đạt chuẩn + tên hiển thị, submit thành công thì thấy mình đã đăng nhập (tên hiển thị trên header) và có thể mở trang yêu cầu đăng nhập.

**Acceptance Scenarios**:

1. **Given** người dùng chưa có tài khoản, **When** submit form đăng ký hợp lệ, **Then** tài khoản được tạo với vai trò Member và người dùng được đăng nhập ngay trong dưới 3 giây.
2. **Given** email đã tồn tại, **When** submit đăng ký, **Then** form báo lỗi "email đã được sử dụng" tại trường email, không tạo tài khoản trùng.
3. **Given** mật khẩu yếu (dưới 8 ký tự), **When** submit, **Then** form chặn ngay phía client kèm thông điệp tiếng Việt, chưa gửi request.

---

### User Story 2 - Đăng nhập email/mật khẩu (Priority: P1)

Member đã có tài khoản nhập email + mật khẩu để vào app, sai thì báo lỗi chung chung không lộ tài khoản có tồn tại hay không.

**Why this priority**: Luồng vào app hằng ngày, P1 cùng đăng ký.

**Independent Test**: Dùng tài khoản đã đăng ký để đăng nhập thành công; thử sai mật khẩu thì nhận thông báo lỗi đăng nhập chung.

**Acceptance Scenarios**:

1. **Given** tài khoản hợp lệ, **When** đăng nhập đúng email/mật khẩu, **Then** người dùng vào được trang chủ ở trạng thái đã đăng nhập.
2. **Given** sai email hoặc sai mật khẩu, **When** submit, **Then** hiển thị lỗi chung "email hoặc mật khẩu không đúng", không tiết lộ email có tồn tại.
3. **Given** tài khoản bị khóa tạm thời do sai nhiều lần hoặc bị chặn, **When** đăng nhập, **Then** hiển thị thông báo lỗi đăng nhập thất bại chung, không hiện CAPTCHA hay bộ đếm thời gian thử lại riêng.

---

### User Story 3 - Duy trì phiên đăng nhập (Priority: P1)

Người dùng đã đăng nhập tải lại trang hoặc quay lại sau khi access token hết hạn vẫn ở trạng thái đăng nhập, không bị đá ra oan.

**Why this priority**: Mất session sau F5 là lỗi nghiêm trọng UX; refresh rotation là cam kết của backend (reuse revoke cả family).

**Independent Test**: Đăng nhập, F5 trang vẫn còn đăng nhập; chờ token hết hạn rồi thao tác tiếp vẫn không bị logout nếu refresh còn hạn.

**Acceptance Scenarios**:

1. **Given** đã đăng nhập và tải lại trang, **When** app khởi động, **Then** phiên được khôi phục im lặng, không hiện màn hình login nháy.
2. **Given** access token hết hạn nhưng refresh còn hạn, **When** gọi API, **Then** phiên được làm mới tự động, request gốc được thử lại thành công.
3. **Given** refresh bị dùng lại (reuse) hoặc hết hạn, **When** làm mới, **Then** người dùng bị đăng xuất an toàn kèm cảnh báo phiên đã bị thu hồi.

---

### User Story 4 - Đăng xuất (Priority: P1)

Người dùng bấm đăng xuất thì thoát phiên hiện tại (hoặc tất cả thiết bị nếu chọn), quay về trạng thái khách.

**Why this priority**: An toàn tài khoản cơ bản; backend hỗ trợ scope CURRENT/ALL_DEVICES.

**Independent Test**: Đăng nhập rồi đăng xuất: header về trạng thái khách, vào trang bảo vệ thì bị chuyển về login.

**Acceptance Scenarios**:

1. **Given** đang đăng nhập, **When** đăng xuất phiên hiện tại, **Then** auth state bị xóa, không gọi được API cần quyền nữa.
2. **Given** người dùng chọn "đăng xuất tất cả thiết bị", **When** xác nhận, **Then** mọi phiên khác cũng hết hiệu lực.

---

### User Story 5 - Đăng ký kèm nguyện vọng Contributor (Priority: P2)

Người dùng khi đăng ký có thể gửi kèm nguyện vọng trở thành Contributor (loại kinh nghiệm hoặc chuyên gia dinh dưỡng + kinh nghiệm + link tham khảo) mà tài khoản vẫn là Member chờ duyệt.

**Why this priority**: Cam kết BL-01/SRS FR-U01; giá trị tuyển contributor nhưng không chặn luồng auth chính.

**Independent Test**: Đăng ký kèm nguyện vọng hợp lệ thì tài khoản vẫn là Member và hồ sơ hiển thị đơn đang PENDING; duyệt/từ chối là việc của admin (ngoài scope spec này).

**Acceptance Scenarios**:

1. **Given** form đăng ký có nguyện vọng Contributor hợp lệ, **When** submit, **Then** tài khoản Member được tạo kèm đơn ở trạng thái chờ duyệt, token đăng nhập không chứa quyền contributor.
2. **Given** người dùng chỉ đăng ký thường, **When** submit, **Then** không tạo đơn contributor nào.

---

### User Story 6 - Đăng nhập bằng Google (Priority: P3)

Người dùng chọn "Đăng nhập bằng Google" để tạo/liên kết tài khoản nhanh.

**Why this priority**: SRS FR-U01 ghi P2 "nếu OAuth chặn thì giữ email/pass và giảm scope". Backend contract `docs/api/auth.md` hiện tại không có endpoint OAuth nên story này ở P3, triển khai sau khi backend chốt contract.

**Independent Test**: (Khi backend sẵn sàng) bấm nút Google, hoàn tất OAuth thì vào app ở trạng thái đăng nhập.

**Acceptance Scenarios**:

1. **Given** OAuth Google thành công, **When** callback về app, **Then** tài khoản được tạo hoặc liên kết và người dùng đăng nhập.
2. **Given** backend chưa hỗ trợ OAuth, **When** mở trang login, **Then** app vẫn đầy đủ email/pass, nút Google ẩn hoặc báo "sắp ra mắt", không vỡ layout.

### Edge Cases

- Mất mạng khi submit: giữ lại nội dung đã nhập (draft), báo lỗi kết nối tiếng Việt, cho thử lại.
- Backend trả lỗi validation theo từng trường (`fields`): map đúng vào từng input, không chỉ toast chung.
- Tài khoản `LOCKED`/`BANNED`/`DELETED` (BL-13): frontend không có UI riêng, quy tắc theo backend enforce — mọi trường hợp đăng nhập thất bại đều hiển thị thông báo lỗi đăng nhập thất bại chung (đã chốt ở Clarifications); không CAPTCHA, không đếm ngược; luôn branch theo `error.code`, không tự đoán text message.
- Cookie HttpOnly hết hạn giữa chừng: mọi request lỗi 401 đi qua hàng đợi refresh duy nhất, không gọi refresh song song, không lặp vô hạn.
- Đăng ký kèm `contributorRequest` thiếu `experience`: backend 400 validation, form báo đúng trường.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống PHẢI cho phép đăng ký bằng email + mật khẩu (tối thiểu 8 ký tự) + tên hiển thị, tạo tài khoản vai trò Member và đăng nhập ngay.
- **FR-002**: Hệ thống PHẢI báo lỗi email trùng bằng mã `EMAIL_ALREADY_EXISTS` tại trường email khi đăng ký.
- **FR-003**: Hệ thống PHẢI cho phép đăng nhập email/mật khẩu; sai thông tin báo lỗi chung theo mã `INVALID_CREDENTIALS`, không tiết lộ tài khoản tồn tại.
- **FR-004**: Hệ thống PHẢI duy trì phiên sau tải lại trang bằng cơ chế làm mới im lặng, không bắt đăng nhập lại khi refresh còn hạn.
- **FR-005**: Hệ thống PHẢI tự làm mới access token khi hết hạn (rotation), hàng đợi refresh chống gọi song song; phát hiện reuse thì thu hồi cả nhóm và đăng xuất an toàn.
- **FR-006**: Hệ thống PHẢI cho phép đăng xuất phiên hiện tại và đăng xuất tất cả thiết bị (scope CURRENT/ALL_DEVICES), xóa auth state phía client.
- **FR-007**: Hệ thống PHẢI hỗ trợ đăng ký kèm nguyện vọng Contributor (`requestedType` là `EXPERIENCED_PRACTITIONER` hoặc `NUTRITION_EXPERT`, `experience` bắt buộc, `referenceLinks` tùy chọn); tài khoản vẫn là Member, đơn ở trạng thái chờ, quyền contributor không xuất hiện trong token.
- **FR-008**: Giao diện PHẢI không bao giờ mở route contributor dựa trên `requestedType` người dùng tự khai; chỉ dựa trên vai trò đã duyệt từ backend.
- **FR-009**: Hệ thống PHẢI xử lý lỗi nghiệp vụ bằng `error.code` (không branch theo text message), tối thiểu: `AUTH_REQUIRED`, `INVALID_CREDENTIALS`, `EMAIL_ALREADY_EXISTS`, `ACCOUNT_LOCKED`, `ACCOUNT_BANNED`, `TOKEN_EXPIRED`, `INVALID_REFRESH_TOKEN`, `REFRESH_TOKEN_REUSED`, `VALIDATION_ERROR`. Riêng `ACCOUNT_LOCKED` và `ACCOUNT_BANNED` khi đăng nhập chỉ hiển thị thông báo lỗi đăng nhập thất bại chung, không có UI CAPTCHA hay đếm ngược thử lại.
- **FR-010**: Mọi form PHẢI validate phía client (tiếng Việt), map lỗi `fields` từ backend vào đúng input, và xử lý đủ 4 trạng thái loading/error/empty/success.
- **FR-011**: Đăng nhập Google là P3 — PHẠM VI spec này chỉ giữ chỗ trên UI; triển khai đầy đủ khi backend công bố endpoint OAuth trong contract.

### Key Entities *(include if feature involves data)*

- **User (Member)**: tài khoản đã xác thực — định danh, email, tên hiển thị, ảnh đại diện, vai trò (Member/Contributor/Admin), trạng thái (active/locked/banned).
- **AuthSession**: phiên đăng nhập — access token + thời điểm hết hạn + thông tin user hiện tại; refresh token chỉ nằm ở HttpOnly cookie, frontend không đọc trực tiếp.
- **ContributorApplication**: đơn nguyện vọng contributor — loại yêu cầu, kinh nghiệm, link tham khảo, trạng thái chờ/duyệt/từ chối; luôn gắn với một User Member.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người dùng mới hoàn tất đăng ký và ở trạng thái đăng nhập trong dưới 3 phút kể từ khi mở form (đo từ lúc mở trang đến khi thấy tên mình trên header).
- **SC-002**: 95% lần đăng nhập hợp lệ thành công ngay lần thử đầu khi nhập đúng thông tin.
- **SC-003**: 100% lần tải lại trang khi phiên còn hạn giữ nguyên trạng thái đăng nhập, không hiện màn hình login trung gian.
- **SC-004**: 0 trường hợp tài khoản bị đá ra oan khi access token hết hạn nhưng refresh còn hạn (refresh tự động thành công).
- **SC-005**: 100% đơn contributor gửi kèm khi đăng ký tạo đúng tài khoản Member + đơn chờ duyệt, không cấp nhầm quyền contributor.
- **SC-006**: 90% người dùng thử sai mật khẩu hiểu được thông báo lỗi và thử lại đúng mà không cần hỗ trợ.

## Assumptions

- Backend 4 endpoint auth (`register/login/refresh/logout` + `GET /users/me`) đã `READY` theo BACKEND_INTEGRATION v1.4 và giữ nguyên contract envelope `{success, data, meta}` / `{success:false, error:{code,message,fields,requestId}}`.
- Base URL `/api/v1`, ID là UUID string, timestamp ISO 8601 UTC; frontend không tự đoán message text.
- Không có OTP/xác thực email trong contract backend hiện tại → ngoài phạm vi spec này (PROGRESS ghi "thiếu OTP" được hiểu là backlog Phase 2, không phải regression của spec này).
- Google OAuth chưa có trong `docs/api/auth.md` → P3 giữ chỗ UI, không chặn nghiệm thu P1/P2.
- Quy tắc BL-01/BL-13 giữ nguyên: luôn Member trước, tối đa 1 đơn PENDING, khóa/ban theo backend enforce, frontend chỉ hiển thị.
- Người dùng có kết nối mạng ổn định; trình duyệt cho phép cookie cùng-domain (refresh HttpOnly).
