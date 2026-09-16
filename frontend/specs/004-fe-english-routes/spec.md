# Feature Specification: FE English Routes Rename

**Feature Branch**: `004-fe-english-routes`

**Created**: 2026-09-16

**Status**: Draft

**Input**: User description: "lên plan điều chỉnh lại name các trang cũng như rout hiện tại của FE từ tiếng việt sang tiếng anh để đồng bộ được chức năng của BE code dễ dàng làm và truy xuất"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Truy cập trang bằng URL tiếng Anh (Priority: P1)

Người dùng cuối (khách, member, admin) truy cập mọi trang chính của ứng dụng bằng URL tiếng Anh ngắn gọn, dễ đoán và nhất quán với tên chức năng backend (recipes, articles, videos, categories, restaurants, meal-plans, assistant, search, profile).

**Why this priority**: Đây là giá trị cốt lõi của yêu cầu — đồng bộ ngôn ngữ route FE/BE để dev dễ làm, dễ truy xuất, giảm nhầm lẫn khi đối chiếu OpenAPI (`/posts`, `/restaurants`, `/meal-plans`, `/chat/sessions`) với route FE. Không có story này thì feature không có ý nghĩa.

**Independent Test**: Có thể kiểm thử độc lập bằng cách mở từng URL tiếng Anh mới trên trình duyệt (guest và logged-in) và xác nhận trang hiển thị đúng nội dung như URL tiếng Việt cũ.

**Acceptance Scenarios**:

1. **Given** người dùng chưa đăng nhập, **When** mở `/recipes`, `/articles`, `/videos`, `/categories`, `/restaurants`, `/search`, **Then** trang tương ứng hiển thị đúng nội dung như trước đây ở `/cong-thuc`, `/bai-viet`, `/video`, `/danh-muc`, `/ban-do`, `/tim-kiem`.
2. **Given** member đã đăng nhập, **When** mở `/profile`, `/meal-plans`, `/meal-plans/saved`, `/assistant`, **Then** trang hồ sơ, kế hoạch bữa ăn, kế hoạch đã lưu và trợ lý AI hiển thị đúng dữ liệu của user như ở `/ho-so`, `/ke-hoach-bua-an`, `/ke-hoach-bua-an/da-luu`, `/tro-ly-ai`.
3. **Given** user ở trang chủ hoặc bất kỳ trang nào, **When** bấm các link điều hướng (header, footer, breadcrumb, link ngữ cảnh "Xem tất cả"), **Then** mọi link đều dẫn tới URL tiếng Anh mới, không còn link nào trỏ tới URL tiếng Việt cũ.

---

### User Story 2 - URL tiếng Việt cũ không gây lỗi (Priority: P1)

Người dùng đã lưu bookmark, nhận link chia sẻ cũ, hoặcbot tìm kiếm còn index URL tiếng Việt vẫn vào được nội dung đúng thông qua chuyển hướng tự động.

**Why this priority**: Tránh gãy trải nghiệm, gãy chia sẻ mạng xã hội và mất SEO khi đổi URL hàng loạt. Đây là điều kiện bắt buộc để rename an toàn.

**Independent Test**: Có thể kiểm thử độc lập bằng cách mở từng URL tiếng Việt cũ và xác nhận trình duyệt tự chuyển tới URL tiếng Anh tương ứng mà vẫn giữ nội dung, query param và không báo lỗi 404.

**Acceptance Scenarios**:

1. **Given** người dùng mở URL cũ `/cong-thuc/123`, **When** trang tải, **Then** trình duyệt tự chuyển tới `/recipes/123` và hiển thị đúng bài viết.
2. **Given** người dùng mở URL cũ có query `/danh-muc?type=RECIPE_GROUP` hoặc `/tim-kiem?q=chay`, **When** trang tải, **Then** query param được giữ nguyên trên URL mới (`/categories?type=RECIPE_GROUP`, `/search?q=chay`) và filter/search áp dụng đúng.
3. **Given** người dùng mở URL cũ không còn tồn tại, **When** chuyển hướng thất bại, **Then** trang 404 thân thiện hiển thị bằng tiếng Việt với link về trang chủ tiếng Anh.

---

### User Story 3 - Developer tra cứu FE/BE nhanh (Priority: P2)

Developer frontend/backend khi đọc code, đối chiếu OpenAPI và tìm file trang FE có thể suy ra ngay vị trí file từ tên chức năng backend mà không cần bảng dịch Việt–Anh trong đầu.

**Why this priority**: Đây là động lực gốc của yêu cầu ("đồng bộ chức năng BE, code dễ làm và truy xuất"). Ưu tiên P2 vì giá trị hướng tới dev, thực hiện sau khi người dùng cuối không bị ảnh hưởng.

**Independent Test**: Có thể kiểm thử độc lập bằng cách đưa cho dev mới một endpoint backend (ví dụ `GET /restaurants/nearby`) và yêu cầu tìm trang FE tương ứng trong dưới 2 phút mà không cần hỏi người cũ.

**Acceptance Scenarios**:

1. **Given** dev cần tìm trang bản đồ quán chay, **When** tìm kiếm tên thư mục/tài liệu theo từ khóa `restaurant`, **Then** thấy ngay route `/restaurants` và file trang tương ứng, không phải đoán từ `ban-do`.
2. **Given** dev đọc tài liệu tích hợp, **When** tra cứu bảng mapping module frontend (mục 5 BACKEND_INTEGRATION.md), **Then** tên feature và route đều dùng tiếng Anh khớp với backend tag (`Auth`, `Users/Profile`, `Categories`, `Restaurants`).

---

### Edge Cases

- URL cũ có dấu hoặc mã hóa percent (ví dụ `/cong-thuc` gõ tay sai chính tả, `/bai-viet/%5Bid%5D`) — hệ thống trả 404 thân thiện, không redirect vòng lặp.
- Deep link có query + hash (`/ban-do?type=X#section`) — redirect giữ nguyên query và hash.
- Route động `/video/upload` hiện redirect nội bộ tới `/dang-video` — sau rename chỉ còn một route chuẩn `/videos/new`, không để hai URL cùng tạo video gây nhầm lẫn.
- Middleware bảo vệ `/profile`, `/admin`, `/login` — sau rename matcher và redirect `?from=` phải dùng URL mới, không đá user về URL cũ.
- Trang `/xac-thuc-otp` (OTP) đang nằm trong group `(auth)` — rename thành `/verify-otp` phải giữ layout auth và không vỡ flow đăng nhập/onboarding.
- SEO: sitemap, canonical, Open Graph dùng URL mới; URL cũ chỉ redirect, không render nội dung trùng lặp.
- Ngôn ngữ hiển thị UI vẫn là tiếng Việt (theo ARCHITECTURE.md) — chỉ đổi slug URL, không đổi nhãn hiển thị.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống PHẢI cung cấp toàn bộ trang nội dung chính dưới URL tiếng Anh: `/recipes`, `/recipes/[id]`, `/recipes/new`, `/articles`, `/articles/[id]`, `/articles/new`, `/articles/[id]/edit`, `/videos`, `/videos/[id]`, `/videos/new`, `/categories`, `/restaurants`, `/restaurants/[id]`, `/search`, `/profile`, `/meal-plans`, `/meal-plans/saved`, `/assistant`, `/verify-otp`.
- **FR-002**: Hệ thống PHẢI chuyển hướng mọi URL tiếng Việt cũ sang URL tiếng Anh tương ứng theo bảng mapping chuẩn (xem Key Entities), giữ nguyên path param, query string và hash, dùng chuyển hướng vĩnh viễn phía server khi truy cập trực tiếp.
- **FR-003**: Mọi điểm vào điều hướng (header desktop/mobile, footer, breadcrumb, link ngữ cảnh, nút CTA, form tìm kiếm, dialog gợi ý) PHẢI trỏ tới URL tiếng Anh mới; không còn hard-code URL tiếng Việt trong giao diện.
- **FR-004**: Luồng tạo/sửa nội dung PHẢI dùng URL mới: mở `/articles/new` thay cho `/bai-viet/tao-moi`, `/articles/[id]/edit` thay cho `/bai-viet/[id]/chinh-sua`, `/recipes/new` thay cho `/dang-cong-thuc`, `/videos/new` thay cho `/dang-video`; sau khi lưu thành công hệ thống điều hướng tới URL chi tiết tiếng Anh.
- **FR-005**: Route `/video/upload` cũ PHẢI bị loại bỏ khỏi điều hướng và chuyển hướng tới `/videos/new`; không duy trì hai URL tạo video song song.
- **FR-006**: Cơ chế bảo vệ truy cập (chuyển về đăng nhập khi chưa xác thực, chặn `/admin` khi thiếu quyền, chặn `/login` khi đã đăng nhập) PHẢI hoạt động trên URL tiếng Anh mới và tham số `from` PHẢI chứa URL tiếng Anh.
- **FR-007**: Người dùng PHẢI vẫn thấy giao diện tiếng Việt (nhãn menu, tiêu đề, thông báo) sau khi đổi slug; thay đổi chỉ áp dụng cho đường dẫn URL, không đổi ngôn ngữ hiển thị.
- **FR-008**: Tài liệu tích hợp và tài liệu kiến trúc liên quan đến route PHẢI được cập nhật trong cùng thay đổi (bảng mapping module, ví dụ URL, checklist orphan-page), để developer mới không phải đoán tên cũ.
- **FR-009**: Hệ thống PHẢI không để trang mồ côi: mọi route mới PHẢI có ít nhất một đường dẫn vào từ UI (nav/header/footer/link ngữ cảnh theo chuẩn orphan-page hiện hành).
- **FR-010**: Sitemap và thẻ canonical/metadata chia sẻ (Open Graph URL, copy-link bài viết) PHẢI dùng URL tiếng Anh mới.

### Key Entities

- **Route Mapping (chuẩn áp dụng)**: bảng duy nhất chốt rename, dùng làm căn cứ kiểm thử và redirect:
  - `/cong-thuc` → `/recipes`; `/cong-thuc/[id]` → `/recipes/[id]`; `/dang-cong-thuc` → `/recipes/new`
  - `/bai-viet` → `/articles`; `/bai-viet/tao-moi` → `/articles/new`; `/bai-viet/[id]` → `/articles/[id]`; `/bai-viet/[id]/chinh-sua` → `/articles/[id]/edit`
  - `/video` → `/videos`; `/video/[id]` → `/videos/[id]`; `/dang-video` → `/videos/new`; `/video/upload` → redirect `/videos/new` rồi loại bỏ
  - `/danh-muc` → `/categories`
  - `/ban-do` → `/restaurants`; `/ban-do/[id]` → `/restaurants/[id]`
  - `/tim-kiem` → `/search`
  - `/ho-so` → `/profile`
  - `/ke-hoach-bua-an` → `/meal-plans`; `/ke-hoach-bua-an/da-luu` → `/meal-plans/saved`
  - `/tro-ly-ai` → `/assistant`
  - `/xac-thuc-otp` → `/verify-otp`
  - Giữ nguyên: `/`, `/login`, `/onboarding`, `/admin`, `/products` (demo, xử lý riêng ngoài phạm vi rename).
- **Redirect Rule**: cặp (old URL → new URL) kèm loại chuyển hướng, bảo toàn query/hash; là dữ liệu kiểm thử hồi quy cho mọi bookmark/link chia sẻ cũ.
- **Navigation Entry Point**: mỗi route mới gắn với ít nhất một điểm vào (header/footer/breadcrumb/CTA) để chứng minh không có trang mồ côi.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% trang trong bảng mapping mở được bằng URL tiếng Anh mới và hiển thị đúng nội dung như URL cũ trong kiểm thử tay trên desktop và mobile.
- **SC-002**: 100% URL tiếng Việt cũ khi mở sẽ tự chuyển tới URL tiếng Anh tương ứng trong dưới 3 giây mà không báo lỗi, bao gồm cả URL có query tìm kiếm/lọc.
- **SC-003**: Không còn liên kết nội bộ nào trỏ tới URL tiếng Việt cũ khi quét toàn bộ giao diện (header, footer, trang chủ, chi tiết, form) — tỉ lệ link cũ bằng 0%.
- **SC-004**: Người dùng hoàn thành các tác vụ chính (tìm công thức, mở bài viết, tạo bài, mở bản đồ quán, mở kế hoạch bữa ăn) qua URL mới với tỉ lệ thành công lần đầu đạt ít nhất 95% trong kiểm thử chấp nhận.
- **SC-005**: Developer mới tìm được file trang FE từ tên chức năng backend (ví dụ "restaurant", "meal plan", "assistant") trong dưới 2 phút mà không cần bảng dịch, xác nhận qua thử nghiệm tìm kiếm 5 chức năng mẫu.

## Assumptions

- Giữ ngôn ngữ hiển thị UI là tiếng Việt; phạm vi chỉ đổi slug/route, không dịch nội dung, không đổi backend API prefix `/api/v1`.
- Chọn `/articles` cho `/bai-viet` (thay vì `/posts` hay `/blog`) để tránh nhầm với API generic `/posts` của backend vốn gộp recipes/blogs/videos; FE vẫn phân biệt articles (cẩm nang) và recipes/videos theo điều hướng hiện tại.
- Chọn `/restaurants` cho `/ban-do` (thay vì `/map`) để đồng bộ trực tiếp với backend module Restaurants (`/restaurants/nearby`, `/restaurants/search`); giao diện map+list giữ nguyên, chỉ đổi URL.
- Chọn `/assistant` cho `/tro-ly-ai` (thay vì `/chat` hay `/ai`) để tên ngắn, thân thiện người dùng; backend vẫn dùng `/chat/sessions` cho API.
- Loại bỏ `/video/upload` sau khi redirect vì hiện tại nó chỉ redirect nội bộ tới `/dang-video`; giữ lại sẽ tạo 2 URL cùng chức năng.
- Redirect dùng chuyển hướng vĩnh viễn phía server cho truy cập trực tiếp/bookmark/SEO; điều hướng nội bộ dùng link trực tiếp tới URL mới, không đi vòng qua URL cũ.
- Phạm vi không bao gồm đổi tên thư mục feature (`features/post`, `features/recipe`) hay đổi API endpoint backend; chỉ đổi route trang App Router, link nội bộ, middleware matcher, sitemap/canonical và tài liệu route liên quan.
- Kiểm thử chấp nhận thực hiện thủ công trên môi trường local với backend chạy ở `:4000` khi cần dữ liệu động; các trang mock vẫn kiểm thử được mà không cần backend.
