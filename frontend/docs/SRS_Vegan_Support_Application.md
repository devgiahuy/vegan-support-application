# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

## Ứng dụng hỗ trợ người ăn chay — VeggieConnect

**Chuẩn tham chiếu:** IEEE Std 830-1998 | **Phiên bản:** 1.5 (MVP Demo) | **Ngày:** 2026-09-16

> **Changelog v1.4 → v1.5 (ngày 2026-09-16):**
>
> - Chốt OpenAI là live LLM provider của MVP: Responses API, `gpt-5.6-terra` cho chatbot và
>   `omni-moderation-latest` cho moderation. Backend giữ adapter fake/local cho development và fallback.

> **Changelog v1.3 → v1.4 MVP (ngày 2026-09-15 — chỉ phục vụ demo chấm điểm):**
>
> - Đóng băng phạm vi MVP ở **PHỤ LỤC B** cuối file: Web-only, media qua **Cloudinary free** (thay S3+transcode), search Postgres thay Elasticsearch, AI stub/mock, sức khoẻ nhập tay. Các UC đầy đủ ở mục 3 vẫn giữ làm bản full, khi demo chỉ cần đạt cột MVP.
>
> **Changelog v1.2 → v1.3 (ngày 2026-09-15):**
>
> - Bổ sung đặc tả communication cho upload Video/Blog (UC-02/UC-05, §4.3/§4.4/§5.1): flow pre-signed chung cho ảnh bìa + video, tham số expiry/validate, nén/chunk/progress cho mạng 3G/4G, chốt SSE cho trạng thái transcode, webhook retry/idempotency, phát lại qua CDN.
>
> **Changelog v1.1 → v1.2 (ngày 2026-09-15):**
>
> - Gộp 2 role **NUTRITION_EXPERT** + **EXPERIENCED_COOK** thành 1 role duy nhất **CONTRIBUTOR** (Người đóng góp). RBAC giảm từ 5 role còn 4 role: `ADMIN`, `CONTRIBUTOR`, `AUTHORIZED_USER`, Guest.
>
> **Changelog v1.0 → v1.1 (theo note review SRS ngày 2026-09-14):**
>
> 1. Tách role người dùng thành **Chuyên gia dinh dưỡng** và **Người có kinh nghiệm** — bổ sung UC-16 (tạo món/thực đơn có kiểm chứng) và UC-17 (kiểm chứng lại content của AI).
> 2. UC-13 mở rộng: ưu tiên lấy dữ liệu sức khoẻ từ HealthKit/Google Fit (Health Connect); nếu không khả dụng thì fallback lấy trực tiếp từ **cảm biến điện thoại** + nhập thủ công để tính BMI và các chỉ số liên quan (BMR/TDEE/WHtR).
> 3. UC-12 làm rõ: dùng **Google Maps Platform** (Maps SDK + Places API + Geocoding + Directions) để định vị/hiển thị/dẫn đường quán chay.
> 4. UC-08 nâng cấp theo góp ý của thầy: gợi ý chủ động theo ý muốn người dùng bằng AI phân tích **hành vi** (lịch sử chat, lịch sử món ăn, favourite, tìm kiếm).
> 5. Bổ sung khái niệm **trường phái ăn chay tại Việt Nam: Phật giáo vs. Đạo giáo (Cao Đài/Đạo giáo)** làm thuộc tính chuẩn cho User profile, Recipe và Meal Planner.

---

## 1. GIỚI THIỆU (INTRODUCTION)

### 1.1. Mục đích (Purpose)

Tài liệu này đặc tả đầy đủ yêu cầu chức năng và phi chức năng của hệ thống VeggieConnect — nền tảng kết hợp mạng xã hội chia sẻ công thức ăn chay, gợi ý địa điểm quán ăn, và hệ sinh thái AI (Chatbot dinh dưỡng, Computer Vision nhận diện nguyên liệu, STT/Video Summarization, Smart Recommendation). Tài liệu phục vụ làm cơ sở thống nhất giữa Product Owner, đội phát triển, đội QA và các bên liên quan để thiết kế, triển khai, kiểm thử và nghiệm thu hệ thống.

### 1.2. Phạm vi (Scope)

Hệ thống bao gồm: Web App, Mobile App (iOS/Android), Admin CMS, và tập hợp AI Microservices. Phạm vi tài liệu này KHÔNG bao gồm chi tiết thiết kế UI/UX (được quản lý ở tài liệu Design riêng) và không bao gồm chiến lược kinh doanh/monetization.

Hệ thống nhằm giải quyết 3 nhóm bài toán:

1. Cộng đồng chia sẻ nội dung ăn chay (blog, video, công thức).
2. Công cụ hỗ trợ dinh dưỡng cá nhân hoá (thực đơn theo BMI, chatbot tư vấn).
3. Kết nối người dùng với địa điểm/dịch vụ ăn chay thực tế (bản đồ quán ăn).

### 1.3. Định nghĩa, từ viết tắt (Definitions, Acronyms)

| Thuật ngữ                               | Giải thích                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BMI                                     | Body Mass Index — chỉ số khối cơ thể = cân nặng(kg) / chiều cao(m)²                                                                                                                                                                                                                                                                                                                                                                                                     |
| BMR / TDEE / WHtR                       | Basal Metabolic Rate (Mifflin-St Jeor) / Total Daily Energy Expenditure (BMR × hệ số vận động) / Waist-to-Height Ratio (vòng eo / chiều cao) — các chỉ số liên quan dùng trong UC-06/UC-13                                                                                                                                                                                                                                                                              |
| RAG                                     | Retrieval-Augmented Generation — kỹ thuật tăng cường LLM bằng dữ liệu truy xuất                                                                                                                                                                                                                                                                                                                                                                                         |
| LLM                                     | Large Language Model                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| CV                                      | Computer Vision                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| STT                                     | Speech-to-Text                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| GenAI                                   | Generative AI (tạo sinh nội dung mới, khác với rule-based)                                                                                                                                                                                                                                                                                                                                                                                                              |
| RBAC                                    | Role-Based Access Control — hệ thống hiện có 4 role: `ADMIN`, `CONTRIBUTOR`, `AUTHORIZED_USER`, Guest                                                                                                                                                                                                                                                                                                                                                                   |
| Người đóng góp (Contributor)            | Người ăn chay lâu năm / đầu bếp chay / food blogger chay HOẶC người có bằng cấp/chứng chỉ dinh dưỡng-y tế được xác minh; được xét duyệt dựa trên hồ sơ + đóng góp; được phép tạo món/thực đơn cộng đồng gắn nhãn `CONTRIBUTOR` hoặc `EXPERT_VERIFIED` (nếu có bằng cấp hoặc đã qua kiểm chứng) và kiểm chứng (approve/correct) content do AI sinh ra                                                                                                                    |
| Trường phái chay VN                     | Phân loại theo tôn giáo/văn hoá Việt Nam: **Chay Phật giáo** (phổ biến: chay trường/chay kỳ, kiêng thịt cá + kiêng Ngũ vị tân gồm hành, hẹ, tỏi, kiệu, hưng cừ đối với người tu/một số Phật tử) và **Chay Đạo giáo/Cao Đài** (kiêng thịt cá + kiêng các thực phẩm có tính kích thích/mùi nồng theo giới luật riêng, có lịch ăn chay kỳ khác — vd mùng 1, rằm, v.v.). Thuộc tính chuẩn `dietSchool ∈ {PHAT_GIAO, DAO_GIAO, KHONG_TON_GIAO}` áp dụng cho User/Recipe/Menu |
| Guest/Unauthorized User                 | Người dùng chưa đăng ký/đăng nhập                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Model Drift                             | Hiện tượng độ chính xác model AI suy giảm theo thời gian do dữ liệu thực tế thay đổi so với dữ liệu huấn luyện                                                                                                                                                                                                                                                                                                                                                          |
| Human-in-the-loop                       | Cơ chế yêu cầu con người (Admin **hoặc Contributor**) xác nhận/can thiệp vào quyết định của AI                                                                                                                                                                                                                                                                                                                                                                          |
| Wearable                                | Thiết bị đeo thông minh (đồng hồ, vòng tay) đồng bộ dữ liệu sức khoẻ                                                                                                                                                                                                                                                                                                                                                                                                    |
| Health Connect                          | API hợp nhất của Google (Android 14+) thay thế dần Google Fit, dùng để đọc bước chân, nhịp tim, cân nặng, giấc ngủ                                                                                                                                                                                                                                                                                                                                                      |
| Google Maps Platform                    | Bộ dịch vụ bản đồ của Google: Maps SDK (hiển thị bản đồ), Places API (tìm/đối chiếu quán ăn), Geocoding API (địa chỉ ↔ toạ độ), Directions API (dẫn đường)                                                                                                                                                                                                                                                                                                              |
| Cảm biến điện thoại (On-device sensors) | Cảm biến vật lý trên smartphone dùng khi không lấy được HealthKit/Fit: accelerometer, gyroscope, pedometer/step-counter, GPS, PPG/nhịp tim (nếu máy hỗ trợ), camera/AR (ước lượng chiều cao hỗ trợ nhập liệu)                                                                                                                                                                                                                                                           |

### 1.4. Tài liệu tham chiếu

- IEEE Std 830-1998, Recommended Practice for Software Requirements Specifications.
- OWASP ASVS 4.0 (Application Security Verification Standard) — dùng cho mục 5.3 Bảo mật.
- Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân (Việt Nam) — áp dụng cho dữ liệu sức khoẻ/BMI người dùng.

### 1.5. Tổng quan tài liệu

Mục 2 mô tả bối cảnh tổng thể hệ thống. Mục 3 đặc tả chi tiết từng chức năng theo Use Case. Mục 4 đặc tả giao diện ngoài. Mục 5 đặc tả yêu cầu phi chức năng. Mục 6 đặc tả vòng đời và quản trị model AI.

---

## 2. MÔ TẢ TỔNG QUAN (OVERALL DESCRIPTION)

### 2.1. Bối cảnh sản phẩm (Product Perspective)

VeggieConnect là hệ thống độc lập (không phụ thuộc hệ thống legacy nào), nhưng tích hợp với các dịch vụ bên thứ ba: Google/Apple OAuth, **Google Maps Platform (Maps SDK, Places API, Geocoding API, Directions API)** cho toàn bộ tính năng bản đồ/quán ăn, Apple HealthKit / Google Fit / **Health Connect** (kênh ưu tiên) **+ cảm biến on-device của điện thoại** (kênh fallback) cho dữ liệu sức khoẻ, và **OpenAI API** cho LLM/moderation cùng dịch vụ STT.

### 2.2. Chức năng sản phẩm (tóm tắt)

- Quản lý người dùng & nội dung (CRUD, RBAC 4 role).
- Tìm kiếm & khám phá (blog, video, quán ăn) có gợi ý thông minh.
- Công cụ dinh dưỡng: tính BMI + BMR/TDEE/WHtR, sinh thực đơn tuần (rule-based + GenAI), có phân biệt **trường phái Phật giáo / Đạo giáo**.
- Cộng đồng đóng góp 1 tầng duy nhất: **Contributor** (chia sẻ/tạo món, tạo thực đơn cộng đồng, tạo nội dung gắn nhãn kiểm chứng + kiểm chứng lại content của AI).
- Hệ sinh thái AI: Chatbot RAG, Computer Vision nhận diện nguyên liệu, Video Summarization, Smart Recommendation dựa trên hành vi, Content Moderation tự động.
- Quản trị nội dung & giám sát AI cho Admin.

### 2.3. Đặc điểm người dùng (User Characteristics)

| Nhóm                         | Đặc điểm                                                                                                                                                                                                              | Hàm ý thiết kế                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Administrator                | Nhân sự nội bộ, am hiểu vận hành nền tảng, cần xem dữ liệu AI ở mức kỹ thuật vừa phải (không cần là Data Scientist)                                                                                                   | Dashboard cần trực quan hoá metric AI (biểu đồ, không yêu cầu đọc log thô)                                                                                                                                                                                                                                                                                                    |
| Người đóng góp (Contributor) | Người ăn chay lâu năm / đầu bếp chay / food blogger chay HOẶC người có bằng cấp/chứng chỉ (dinh dưỡng, y tế, thực phẩm) đã qua xác minh; có thẩm quyền chuyên môn + đóng góp thực tế                                  | Cần flow đăng ký/xét duyệt (mô tả kinh nghiệm/link món đã làm, kèm upload chứng chỉ nếu có + Admin duyệt); UI có huy hiệu `CONTRIBUTOR` (mặc định) và `EXPERT_VERIFIED` (nếu có bằng cấp/đã qua kiểm chứng), công cụ kiểm chứng AI (approve/correct/request-changes), chịu trách nhiệm cho nội dung đã ký duyệt; có cơ chế lên hạng/xuống hạng theo rating và báo cáo vi phạm |
| Authorized User              | Người quan tâm ăn chay/dinh dưỡng, đa dạng độ tuổi (18-55+), có thể không rành công nghệ; có thuộc tính `dietSchool` (Phật giáo / Đạo giáo / Không theo tôn giáo) và `vegetarianMode` (chay trường/chay kỳ/vegan/...) | UI đơn giản, AI feature có hướng dẫn onboarding, không yêu cầu hiểu thuật ngữ AI; form hồ sơ phải cho chọn trường phái chay để cá nhân hoá gợi ý                                                                                                                                                                                                                              |
| Unauthorized User (Guest)    | Khách vãng lai, mục tiêu trải nghiệm nhanh trước khi quyết định đăng ký                                                                                                                                               | Trial phải mượt, giới hạn rõ ràng, CTA đăng ký không gây khó chịu                                                                                                                                                                                                                                                                                                             |

### 2.4. Ràng buộc chung (General Constraints)

- Phải hỗ trợ tiếng Việt làm ngôn ngữ chính (bao gồm search full-text tiếng Việt có dấu).
- Dữ liệu sức khoẻ (BMI, chiều cao/cân nặng, vòng eo, dữ liệu Wearable/cảm biến, **lịch sử hành vi dùng cho gợi ý**) phải tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân: thu thập có consent riêng cho từng mục đích (đồng bộ sức khoẻ, cá nhân hoá hành vi), cho phép tắt cá nhân hoá mà vẫn dùng chức năng cơ bản.
- Mọi công thức/thực đơn/AI output liên quan dinh dưỡng phải gắn nhãn nguồn gốc: `system_rule` / `ai_genai` / `contributor` / `expert_verified`; nội dung AI chưa qua kiểm chứng bắt buộc kèm disclaimer y tế.
- Chi phí vận hành AI (LLM/CV/STT API) phải có cơ chế kiểm soát ngân sách (không được để một user/bot spam làm vỡ chi phí vận hành).
- Phải hoạt động ổn định trên kết nối mạng di động 3G/4G phổ biến tại Việt Nam (tối ưu payload, ảnh nén).
- Tính năng bản đồ bắt buộc dùng Google Maps Platform; phải hiển thị attribution của Google và xử lý khi user từ chối quyền vị trí (fallback nhập địa chỉ thủ công + Geocoding).

### 2.5. Giả định và phụ thuộc (Assumptions and Dependencies)

- Giả định OpenAI API duy trì SLA uptime ≥ 99.9%; nếu không, hệ thống phụ thuộc vào fake/local adapter và cơ chế fallback nội bộ (mục 4.1.4 Tài liệu 1).
- Giả định người dùng cung cấp thông tin chiều cao/cân nặng/vòng eo trung thực; cảm biến điện thoại chỉ hỗ trợ đo gián tiếp (đếm bước, ước lượng vận động, nhịp tim) — **không thể tự đo chính xác chiều cao/cân nặng**, nên BMI/BMR vẫn cần ít nhất một đầu vào thủ công hoặc từ HealthKit/Fit. Mọi khuyến nghị chỉ mang tính tham khảo, không thay thế tư vấn y khoa.
- Phụ thuộc Google Maps Platform (Places/Geocoding/Directions) cho việc tìm/định vị/dẫn đường quán chay — cần API key, quota và tuân thủ điều khoản hiển thị bản đồ của Google.
- Phụ thuộc Apple HealthKit / Google Fit / Health Connect cho kênh sức khoẻ ưu tiên; khi kênh này không khả dụng (không có thiết bị, từ chối quyền, lỗi token) hệ thống fallback sang cảm biến on-device + nhập thủ công (chi tiết UC-13).

---

## 3. SYSTEM FEATURES & FUNCTIONAL REQUIREMENTS

> Ký hiệu: **[MH]** = Must-Have, **[NTH]** = Nice-to-Have

### 3.1. UC-01: Đăng ký / Đăng nhập tài khoản [MH]

- **Actor:** Unauthorized User (trở thành Authorized User / Contributor)
- **Pre-condition:** Chưa có tài khoản hoặc chưa đăng nhập.
- **Main Flow:**
  1. User chọn "Đăng ký", nhập email/mật khẩu hoặc chọn OAuth (Google/Apple).
  2. Hệ thống validate định dạng email, độ mạnh mật khẩu (≥8 ký tự, có số/chữ hoa).
  3. Hệ thống gửi email xác thực (OTP hoặc link).
  4. User xác thực → tài khoản chuyển `ACTIVE`, gán role mặc định `AUTHORIZED_USER`; đồng thời khai báo hồ sơ chay cơ bản: `dietSchool` (PHAT_GIAO / DAO_GIAO / KHONG_TON_GIAO), `vegetarianMode` (chay trường/chay kỳ/vegan/lacto-ovo...).
  5. Nếu user muốn nâng cấp lên **Contributor** → rẽ sang UC-17 (xét duyệt hồ sơ).
- **Alternative Flow:** Email đã tồn tại → hệ thống trả lỗi 409, gợi ý "Đăng nhập hoặc quên mật khẩu".
- **Exception Flow:** Dịch vụ gửi email lỗi → cho phép resend tối đa 3 lần/giờ, hiển thị thông báo rõ ràng.
- **Post-condition:** User có tài khoản `ACTIVE`, nhận JWT access + refresh token (JWT claim chứa `role` và `dietSchool`).

### 3.2. UC-02: Quản lý bài đăng cá nhân (CRUD Post) [MH]

> **Bản full (S3). MVP demo: thay bằng Cloudinary — xem PHỤ LỤC B.1/B.2 (upload qua `upload_preset`, ảnh ≤10MB, không dùng `/uploads/presigned`).**

- **Actor:** Authorized User, Contributor (phân quyền tạo nội dung theo role, xem UC-16)
- **Pre-condition:** Đã đăng nhập.
- **Main Flow:**
  1. User tạo bài viết (tiêu đề, nội dung markdown, ảnh bìa, chọn danh mục, gắn nhãn `dietSchool` áp dụng nếu là công thức món chay).
  2. Ảnh bìa upload dùng chung flow pre-signed như UC-05: client xin `POST /uploads/presigned` (auth bắt buộc, khai báo `contentType`, `contentLength`) → nhận URL hết hạn 5 phút, giới hạn `image/jpeg|png|webp ≤ 5MB` → upload trực tiếp lên S3 → gửi `objectKey` kèm request tạo post. BE validate lại MIME + dung lượng trước khi lưu.
  3. Hệ thống chạy Content Moderation tự động (xem UC-11) trước khi publish.
  4. Nếu không bị flag → bài viết `PUBLISHED` ngay; nếu bị flag → `FLAGGED`, chờ Admin duyệt (nội dung dinh dưỡng có thể được chuyển thêm cho Contributor kiểm chứng — xem UC-17).
- **Alternative Flow:** User sửa/xoá bài viết của chính mình — hệ thống kiểm tra `authorId == currentUser.id` hoặc role Admin.
- **Exception Flow:** Người dùng cố sửa bài của người khác → trả 403 Forbidden.
- **Post-condition:** Bài viết được lưu với trạng thái tương ứng, ghi rõ `authorRole` tại thời điểm đăng.

### 3.3. UC-03: Comment & Vote bài viết [MH]

- **Actor:** Authorized User
- **Pre-condition:** Đã đăng nhập, bài viết ở trạng thái `PUBLISHED`.
- **Main Flow:** User bình luận hoặc vote (up/down); hệ thống cập nhật đếm vote real-time, chạy moderation nhẹ cho comment.
- **Alternative Flow:** User đổi vote (từ up sang down) → hệ thống update thay vì tạo record mới (unique constraint).
- **Exception Flow:** Spam comment liên tục (>10 comment/phút) → tạm khoá chức năng comment của user 15 phút (rate-limit chống spam).
- **Post-condition:** Comment/vote được ghi nhận, hiển thị cập nhật cho tất cả người xem.

### 3.4. UC-04: Tìm kiếm & xem Video/Blog [MH]

- **Actor:** Tất cả (Admin, Authorized User, Unauthorized User)
- **Pre-condition:** Không yêu cầu đăng nhập.
- **Main Flow:** User nhập từ khoá → hệ thống search full-text (Elasticsearch) trên tiêu đề/nội dung/transcript video → trả kết quả phân trang, sắp xếp theo độ liên quan/mới nhất.
- **Alternative Flow:** Không có kết quả → hệ thống gợi ý từ khoá liên quan hoặc danh mục phổ biến.
- **Post-condition:** Danh sách kết quả hiển thị; lượt xem (`viewCount`) tăng khi user mở chi tiết.

### 3.5. UC-05: Upload Video dạy nấu ăn [MH]

> **Bản full (S3 multipart + SSE + DLQ). MVP demo: thay bằng Cloudinary — xem PHỤ LỤC B.1/B.2 (video ≤100MB, `upload_preset` signed, progress đơn giản, không `/complete`/SSE/resume 24h/webhook).**

- **Actor:** Authorized User
- **Pre-condition:** Đã đăng nhập, video ≤ giới hạn dung lượng/thời lượng cấu hình (vd 500MB / 60 phút, định dạng MP4/MOV).
- **Main Flow:**
  1. Client nén sơ bộ + chia chunk (khuyến nghị 5-10MB/chunk) → xin `POST /uploads/presigned` (auth bắt buộc, khai báo `contentType=video/mp4|quicktime`, `contentLength`, số part multipart) → nhận pre-signed URL(s) hết hạn 15 phút, ràng buộc đúng MIME + size.
  2. Client upload trực tiếp lên S3 (multipart, hiển thị progress % + nút huỷ/thử lại từng part, timeout 30s/part, retry tối đa 3 lần).
  3. Client gọi `POST /videos/complete` với `objectKey` + metadata (duration, size, checksum) → BE verify object tồn tại + validate MIME/size → tạo record `Video` với `processingStatus=UPLOADED`.
  4. Hệ thống queue job transcode (HLS) chạy song song với pipeline STT/Summarization (Nice-to-Have, xem UC-09); trạng thái đẩy về client qua **SSE `GET /videos/:id/events`** (`UPLOADED → TRANSCODING → READY/FAILED`), fallback polling 5s nếu mất SSE.
- **Alternative Flow:** Mạng yếu (3G) → client giảm chunk còn 2MB, tạm dừng/tiếp tục thủ công; user offline quá 24h → part hết hạn, phải xin URL mới.
- **Exception Flow:** Upload thất bại giữa chừng → cho phép resume upload (multipart, giữ `uploadId` 24h) hoặc yêu cầu upload lại; video không tạo record rác trong DB nếu chưa gọi `/complete`. Job transcode/STT treo quá SLA (§5.1) → đánh `FAILED` + DLQ + cho phép retry thủ công; webhook Media→Core retry 5 lần (backoff) với `eventId` idempotency.
- **Post-condition:** Video ở trạng thái `READY` sau khi transcode xong (file HLS phát qua CDN), hiển thị công khai theo `status=PUBLISHED`.

### 3.6. UC-06: Tạo thực đơn tuần theo BMI (rule-based) [MH]

- **Actor:** Authorized User (bao gồm Contributor khi dùng cho bản thân)
- **Pre-condition:** Đã nhập chiều cao, cân nặng (từ UC-13: HealthKit/Fit hoặc cảm biến + thủ công), mức độ vận động, và **trường phái chay `dietSchool` + `vegetarianMode`**.
- **Main Flow:**
  1. Hệ thống tính BMI = weight/(height/100)² + các chỉ số liên quan: BMR (Mifflin-St Jeor theo giới tính/tuổi), TDEE (BMR × hệ số vận động, hiệu chỉnh bằng dữ liệu bước chân/cảm biến nếu có), WHtR (nếu có vòng eo).
  2. Phân loại BMI chuẩn châu Á: <18.5 thiếu cân, 18.5-22.9 bình thường, 23-24.9 thừa cân, ≥25 béo phì.
  3. Tính calo mục tiêu theo BMR/TDEE + mục tiêu (giữ/tăng/giảm cân).
  4. Hệ thống **lọc công thức theo `dietSchool`**: vd `PHAT_GIAO` → loại món chứa Ngũ vị tân (hành/hẹ/tỏi/kiệu/hưng cừ) nếu user chọn kiêng; `DAO_GIAO` → áp dụng bộ lọc kiêng tương ứng + ưu tiên món chay kỳ (mùng 1/rằm); sau đó chọn công thức theo rule (calo/bữa, dị ứng) sinh thực đơn 7 ngày x 3-4 bữa.
- **Alternative Flow:** Thiếu dữ liệu (chưa nhập cân nặng) → yêu cầu hoàn thiện hồ sơ trước khi tạo thực đơn (đề xuất kết nối UC-13).
- **Exception Flow:** Không đủ công thức trong DB thoả điều kiện calo + `dietSchool` → hệ thống nới lỏng ngưỡng ±10% và cảnh báo "thực đơn có thể chưa tối ưu hoàn toàn / đã nới bộ lọc trường phái".
- **Post-condition:** `WeeklyMenu` được tạo với `generatedBy="system_rule"` + `dietSchool` tương ứng.

### 3.7. UC-07: AI Nutrition Chatbot (LLM) [MH]

- **Actor:** Authorized User (mọi role), Unauthorized User (giới hạn trial)
- **Pre-condition:** Không bắt buộc đăng nhập (Guest được trial giới hạn). Với Authorized User đã bật consent cá nhân hoá, lịch sử chat được phép tái sử dụng cho UC-08.
- **Main Flow:**
  1. User nhập câu hỏi (vd: "Tôi ăn chay trường theo Phật giáo thì bổ sung protein từ đâu, có cần kiêng ngũ vị tân không?").
  2. Hệ thống kiểm tra rate limit theo role.
  3. Truy xuất RAG context từ kho công thức/kiến thức dinh dưỡng **có lọc theo `dietSchool` của user** (vd không gợi ý món có hành/tỏi cho user Phật giáo chọn kiêng).
  4. Gọi LLM sinh câu trả lời, kiểm duyệt output, trả về kèm trích dẫn công thức liên quan + disclaimer y tế. Nếu nội dung dinh dưỡng quan trọng, hệ thống gắn cờ để Contributor kiểm chứng sau (xem UC-17).
- **Alternative Flow:** Câu hỏi ngoài phạm vi dinh dưỡng chay (vd hỏi về chính trị) → chatbot lịch sự từ chối, hướng lại chủ đề.
- **Exception Flow:**
  - Guest hết quota trial → trả 429 kèm CTA đăng ký.
  - LLM provider lỗi → fallback provider dự phòng; nếu tất cả lỗi → trả câu trả lời tĩnh xin lỗi + gợi ý câu hỏi thường gặp.
- **Post-condition:** Hội thoại được lưu vào `ChatSession`/`ChatMessage` (nếu là Authorized User; Guest lưu tạm 7 ngày). Với user đã consent, message được gắn tag chủ đề/dị ứng/món đã nhắc tới để phục vụ UC-08; user có quyền xoá lịch sử và tắt cá nhân hoá.

### 3.8. UC-08: AI Personalized Meal Planner — gợi ý chủ động theo hành vi (GenAI + Behavioral Analysis) [MH — nâng từ NTH theo góp ý GV]

- **Actor:** Authorized User (mọi role đã đăng nhập)
- **Mục tiêu (theo gợi ý của thầy):** hệ thống **tự động gợi ý theo ý muốn của người dùng** — dùng AI phân tích dữ liệu/hành vi như **lịch sử chat (UC-07), lịch sử món ăn đã xem/lưu/đánh giá, favourite, tìm kiếm, thực đơn cũ và phản hồi 👍/👎** — thay vì chỉ sinh thực đơn một lần theo rule/calо cứng.
- **Pre-condition:** Đã có hồ sơ dinh dưỡng cơ bản (BMI/BMR/TDEE từ UC-06/UC-13, dị ứng, `dietSchool`); có ít nhất một nguồn hành vi (nếu chưa có → chạy ở chế độ cold-start, xem Alternative Flow). User đã bật consent "cá nhân hoá theo hành vi" (có thể tắt — khi tắt chỉ dùng rule cơ bản như UC-06).
- **Main Flow:**
  1. Hệ thống thu thập tín hiệu hành vi đã consent: topic chat gần đây (vd hay hỏi món nhiều đạm), món đã xem/lưu/bỏ qua, rating, tần suất món lặp, thời gian chay kỳ (mùng 1/rằm đối với Đạo giáo/Phật giáo).
  2. Engine gợi ý kết hợp: (a) ràng buộc cứng — calo mục tiêu, dị ứng, `dietSchool` (loại Ngũ vị tân / món kiêng Đạo giáo); (b) mô hình hành vi — xếp hạng món theo sở thích suy luận + đa dạng hoá (tránh lặp >2 lần/tuần, cân bằng đạm/xơ).
  3. LLM sinh thực đơn kèm **lý giải cá nhân hoá** ("Vì bạn hay hỏi món đậu hũ và đã lưu 3 món nấm, tuần này gợi ý...") + gắn nhãn nguồn gốc `ai_genai_behavioral` và disclaimer.
  4. Hệ thống chủ động đề xuất (push/in-app "Gợi ý hôm nay cho bạn") khi phát hiện ngữ cảnh: gần giờ ăn, đến ngày chay kỳ, hoặc user vừa chat về một nhu cầu (vd hỏi "tăng cân") — user có thể chấp nhận/lưu/đổi món.
  5. Mọi tương tác (chấp nhận/bỏ qua/regenerate với feedback "ít cay hơn", "nhiều đạm hơn", "hợp chay Phật giáo hơn") được ghi lại làm tín hiệu vòng lặp cho lần gợi ý sau.
- **Alternative Flow:**
  - Cold-start (user mới, chưa có hành vi) → dùng gợi ý theo mùa/vùng miền (UC-14) + món phổ biến cùng `dietSchool`, đồng thời giải thích "đang gợi ý chung vì chưa có lịch sử của bạn".
  - User không hài lòng → nút "Tạo lại" (regenerate) với feedback tự nhiên.
  - User tắt cá nhân hoá → hệ thống chỉ dùng UC-06 rule-based, xoá/không dùng vector hành vi.
- **Exception Flow:** LLM sinh món ăn không tồn tại trong DB công thức (hallucination) → hệ thống validate: nếu tên món không match DB, chỉ hiển thị như "gợi ý tham khảo" không link được vào chi tiết công thức, đồng thời log để rà soát và chuyển cho Contributor kiểm chứng (UC-17) nếu món được nhiều user quan tâm.
- **Post-condition:** `WeeklyMenu`/`DailySuggestion` với `generatedBy="ai_genai_behavioral"` + `explanation` + log tín hiệu hành vi đã dùng (phục vụ giải trình và quyền xoá dữ liệu của user).

### 3.9. UC-09: Nhận diện nguyên liệu qua ảnh tủ lạnh (CV) [NTH]

- **Actor:** Authorized User
- **Pre-condition:** Đã đăng nhập, cấp quyền camera/thư viện ảnh.
- **Main Flow:** User chụp/upload ảnh tủ lạnh → hệ thống detect nguyên liệu + đánh giá độ tươi → gợi ý công thức phù hợp với nguyên liệu sẵn có.
- **Alternative Flow:** Phát hiện nguyên liệu độ tin cậy thấp → hiển thị kèm cảnh báo "độ chính xác chưa cao, vui lòng xác nhận lại".
- **Exception Flow:** Ảnh không chứa thực phẩm nhận diện được → thông báo hướng dẫn chụp lại, không trừ quota.
- **Post-condition:** Danh sách nguyên liệu + gợi ý công thức hiển thị cho user.

### 3.10. UC-10: Tóm tắt công thức từ video (STT + LLM) [NTH]

- **Actor:** Authorized User (là consumer của tính năng, trigger tự động khi video khác được upload)
- **Pre-condition:** Video đã upload xong, ở trạng thái `TRANSCODING` hoặc sau đó.
- **Main Flow:** Xem chi tiết pipeline STT→Chunking→Summarize ở Tài liệu 1 mục 4.3. Kết quả: tóm tắt công thức có cấu trúc (tên món, nguyên liệu ước tính, các bước chính) hiển thị kèm video.
- **Alternative Flow:** Video không có giọng nói rõ ràng → hệ thống không tạo summary, hiển thị "Video này chưa hỗ trợ tóm tắt tự động".
- **Post-condition:** `Video.summary` được cập nhật, hiển thị công khai cùng video.

### 3.11. UC-11: Content Moderation tự động + Admin/Contributor duyệt [MH ở mức cơ bản, NTH ở mức nâng cao]

- **Actor:** Hệ thống AI (tự động), Administrator (xác nhận), **Contributor (kiểm chứng chuyên môn dinh dưỡng)**
- **Pre-condition:** Có nội dung mới được đăng (post/comment/video) hoặc AI output dinh dưỡng cần kiểm chứng (từ UC-07/UC-08/UC-10).
- **Main Flow:** Xem pipeline chi tiết Tài liệu 1 mục 4.4. Nội dung điểm rủi ro trung bình được đưa vào hàng chờ (`FLAGGED`): (a) vi phạm cộng đồng → Admin duyệt; (b) **kiến thức dinh dưỡng/sức khoẻ → chuyển thêm cho Contributor kiểm chứng** (approve/correct/request-changes kèm ghi chú chuyên môn). Admin xem lý do AI đưa ra, quyết định Approve/Reject cuối cùng.
- **Alternative Flow:** Admin/Contributor không đồng ý với đánh giá AI (false positive) → Approve thủ công, hệ thống ghi nhận để cải thiện classifier; nội dung do Contributor duyệt được gắn nhãn `EXPERT_VERIFIED` + `expertId` + thời điểm.
- **Exception Flow:** Nội dung vi phạm nghiêm trọng rõ ràng (điểm > 0.8) → tự động `REJECTED` ngay, không cần chờ Admin, nhưng vẫn lưu log để Admin audit sau (tránh false positive gây mất nội dung hợp lệ oan mà không ai biết).
- **Post-condition:** Nội dung ở trạng thái cuối cùng (`PUBLISHED`/`REJECTED`/`EXPERT_VERIFIED`), ghi vào `ModerationAction` (mở rộng thêm `reviewerRole`, `expertNote`).

### 3.12. UC-12: Xem quán ăn chay gần nhất & gợi ý theo món — tích hợp Google Maps Platform [MH]

- **Actor:** Tất cả
- **Pre-condition:** App đã cấu hình Google Maps API key; user cấp quyền vị trí **hoặc** nhập địa chỉ thủ công.
- **Main Flow:**
  1. Client lấy vị trí hiện tại bằng GPS/Fused Location (mobile) hoặc Geolocation API (web); hiển thị bản đồ nền bằng **Maps SDK (Android/iOS/Web)** kèm attribution Google.
  2. Hệ thống chuẩn hoá vị trí: nếu có toạ độ → **Geocoding API** suy ra địa chỉ; nếu user nhập địa chỉ text → Geocoding chuyển thành toạ độ.
  3. Hệ thống query `VegRestaurant` nội bộ trong bán kính (mặc định 5km) + gọi **Places API (Nearby Search/Text Search)** để đối chiếu/làm giàu (giờ mở cửa, rating, ảnh) — kết quả hợp nhất, khử trùng theo `placeId`, ưu tiên dữ liệu nội bộ đã xác minh.
  4. Nếu user tìm theo tên món cụ thể → ưu tiên quán có `cuisineTags` khớp + lọc theo `dietSchool` (vd quán ghi rõ "chay Phật giáo, không ngũ vị tân").
  5. User chọn quán → xem chi tiết trên bản đồ + list view; nút "Chỉ đường" gọi **Directions API / Universal Link sang Google Maps** để dẫn đường.
- **Alternative Flow:** Không có quán trong bán kính → tự động mở rộng bán kính (5km→10km→20km) và thông báo cho user. User từ chối quyền vị trí → dùng địa chỉ nhập tay + Geocoding, vẫn xem được danh sách (không có khoảng cách chính xác).
- **Exception Flow:** Hết quota/lỗi Google API → fallback hiển thị dữ liệu nội bộ thuần tuý + thông báo "chế độ offline bản đồ, thiếu thông tin giờ mở cửa/rating"; không block toàn màn hình.
- **Post-condition:** Danh sách quán hiển thị trên bản đồ + list view; lượt xem/click quán được log (phục vụ gợi ý hành vi UC-08 khi user consent).

### 3.13. UC-13: Thu thập dữ liệu sức khoẻ — HealthKit/Fit ưu tiên + fallback cảm biến điện thoại [MH — nâng từ NTH]

- **Actor:** Authorized User (mọi role đã đăng nhập)
- **Pre-condition:** User mở màn hình "Hồ sơ sức khoẻ"; app khai báo quyền sức khoẻ/vận động/vị trí theo OS.
- **Main Flow (2 tầng ưu tiên):**
  1. **Tầng 1 — Kênh ưu tiên (Health platform):** User kết nối Apple HealthKit (iOS) / Google Fit + Health Connect (Android) qua OAuth → hệ thống lấy bước chân, calo tiêu thụ, cân nặng, nhịp tim, giấc ngủ (nếu có) → dùng để tính/tinh chỉnh BMR/TDEE/WHtR/BMI trong UC-06/UC-08. Đồng bộ định kỳ (vd mỗi 6 giờ), lưu mã hoá.
  2. **Tầng 2 — Fallback khi không lấy được Tầng 1 (tìm hiểu theo note review):** nếu thiết bị không hỗ trợ / user từ chối quyền / token lỗi / không có wearable → app **lấy trực tiếp từ cảm biến điện thoại**: pedometer/step-counter + accelerometer + gyroscope (đếm bước, ước lượng mức vận động), GPS (quãng đường di chuyển), PPG/nhịp tim (nếu máy hỗ trợ), kết hợp **nhập thủ công chiều cao/cân nặng/vòng eo** (bắt buộc vì cảm biến không đo được các số này chính xác; camera/AR chỉ hỗ trợ ước lượng chiều cao tham khảo). Từ đó vẫn tính được BMI (= kg/m²), BMR (Mifflin-St Jeor), TDEE (BMR × hệ số vận động từ cảm biến), WHtR (nếu có vòng eo).
  3. Hệ thống hiển thị rõ nguồn dữ liệu (`healthkit` / `health_connect` / `on_device_sensor` / `manual`) và độ tin cậy (vd "TDEE ước tính từ cảm biến — độ chính xác thấp hơn HealthKit").
- **Alternative Flow:** User chỉ muốn nhập tay, không cấp bất kỳ quyền nào → vẫn dùng được UC-06 với dữ liệu `manual` thuần tuý.
- **Exception Flow:** Token hết hạn/thu hồi quyền (lỗi 401 từ API bên thứ 3) → đánh dấu `WearableConnection` là "cần kết nối lại", tự chuyển sang chế độ `on_device_sensor`/`manual`, không làm gián đoạn các tính năng khác. Cảm biến không khả dụng (máy cũ, tắt sensor) → yêu cầu nhập thủ công toàn phần.
- **Post-condition:** Hồ sơ `HealthProfile` (height/weight/waist/age/sex/activityLevel + `dataSource`) được lưu mã hoá; là đầu vào chuẩn cho UC-06/UC-08.

### 3.14. UC-14: Gợi ý món ăn theo mùa/vùng miền + trường phái chay [NTH]

- **Actor:** Authorized User, Unauthorized User
- **Pre-condition:** Hệ thống xác định được mùa hiện tại (theo tháng) và vùng miền (theo profile hoặc GPS), cùng `dietSchool` của user (nếu đã khai báo).
- **Main Flow:** Hệ thống filter/rank công thức theo `Recipe.season` và `Recipe.region` **và `Recipe.dietSchool`** (vd món chay Phật giáo không ngũ vị tân được ưu tiên cho user `PHAT_GIAO`; món chay kỳ mùng 1/rằm được đẩy mạnh đúng lịch cho cả 2 trường phái), hiển thị ở trang chủ dạng "Gợi ý cho bạn hôm nay". Đây cũng là nguồn cold-start cho UC-08.
- **Post-condition:** Danh sách gợi ý cá nhân hoá hiển thị.

### 3.15. UC-15: Admin giám sát AI Models [NTH nâng cao]

- **Actor:** Administrator
- **Pre-condition:** Đã đăng nhập với role ADMIN.
- **Main Flow:** Admin xem dashboard: số lượng request/feature, chi phí, latency, tỷ lệ lỗi, tỷ lệ fallback được kích hoạt, biểu đồ accuracy CV model theo thời gian (dựa trên feedback thumbs up/down), **tỷ lệ AI output đã được Contributor kiểm chứng (UC-17)** và tỷ lệ Admin override.
- **Alternative Flow:** Phát hiện model drift (accuracy giảm liên tục) → Admin có thể "đóng băng" (disable) tạm thời 1 tính năng AI cụ thể mà không ảnh hưởng toàn hệ thống.
- **Post-condition:** Quyết định can thiệp của Admin được ghi log, phục vụ audit và cải tiến model (chi tiết mục 6).

### 3.16. UC-16: Contributor chia sẻ/tạo món ăn & thực đơn cộng đồng [MH]

- **Actor:** Contributor (Người đóng góp)
- **Pre-condition:** Tài khoản đã được duyệt role `CONTRIBUTOR` (xem UC-17).
- **Main Flow:**
  1. User tạo **Món ăn** (tên, mô tả, nguyên liệu định lượng, các bước, ảnh/video, thời gian nấu, độ khó, calo ước tính, gắn nhãn `dietSchool`: PHAT_GIAO / DAO_GIAO / chung, `vegetarianMode`, mùa/vùng miền).
  2. User tạo **Thực đơn cộng đồng** (ghép nhiều món có sẵn + món tự tạo thành menu ngày/tuần/chay kỳ, ghi chú đối tượng phù hợp).
  3. Hệ thống chạy moderation (UC-11); nội dung đạt → `PUBLISHED` với nhãn `CONTRIBUTOR` mặc định hoặc `EXPERT_VERIFIED` (nếu tác giả có bằng cấp hoặc đã qua kiểm chứng UC-17).
  4. Cộng đồng đánh giá (rating/bình luận/lưu); món điểm cao được ưu tiên vào pool của UC-06/UC-08/UC-14.
- **Alternative Flow:** Món gắn nhãn `CONTRIBUTOR` muốn nâng lên `EXPERT_VERIFIED` → gửi yêu cầu kiểm chứng sang hàng chờ UC-17.
- **Exception Flow:** Món vi phạm (chứa nguyên liệu mặn, thông tin dinh dưỡng sai lệch nghiêm trọng, ảnh đạo nhái) → `REJECTED` + trừ uy tín; tái phạm nhiều lần → thu hồi role về `AUTHORIZED_USER`.
- **Post-condition:** `Recipe`/`CommunityMenu` được lưu với `createdBy`, `authorRole=CONTRIBUTOR`, `verificationStatus ∈ {UNVERIFIED, PENDING_EXPERT, EXPERT_VERIFIED, REJECTED}`.

### 3.17. UC-17: Contributor kiểm chứng lại content của AI + xét duyệt vai trò [MH]

- **Actor:** Contributor (kiểm chứng), Administrator (duyệt role, quyết định cuối), Hệ thống AI (đề xuất nội dung cần kiểm chứng)
- **Pre-condition:** (a) Có AI output/công thức cần kiểm chứng (`verificationStatus=PENDING_EXPERT` hoặc AI confidence thấp/nhiều báo cáo sai); (b) Đối với xét duyệt role: có hồ sơ đăng ký Contributor đang chờ.
- **Main Flow — (A) Kiểm chứng content AI:**
  1. Hệ thống gom hàng chờ: AI chatbot answer/món GenAI (UC-07/UC-08) bị user báo sai, món hallucination được quan tâm, video summary dinh dưỡng (UC-10), món gắn nhãn `CONTRIBUTOR` xin nâng lên `EXPERT_VERIFIED`.
  2. Contributor mở hàng chờ, xem kèm nguồn RAG + công thức gốc + lý do AI bị nghi ngờ.
  3. Contributor thực hiện một trong: `APPROVE` (giữ nguyên, gắn `EXPERT_VERIFIED`), `CORRECT` (sửa trực tiếp nguyên liệu/liều lượng/calo/khuyến nghị + ghi `expertNote`), hoặc `REJECT` (gỡ/không cho hiển thị, ghi lý do).
  4. Hệ thống cập nhật nhãn hiển thị cho end-user ("Đã được kiểm chứng bởi [Tên contributor]"), lưu `ExpertReview {reviewerId, targetType, targetId, decision, note, timestamp}`, đồng thời đẩy feedback về pipeline retrain/prompt-tuning (mục 6).
- **Main Flow — (B) Xét duyệt vai trò:**
  1. User nộp hồ sơ Contributor: mô tả kinh nghiệm + món đã làm/link, kèm bằng cấp/chứng chỉ-giấy hành nghề nếu có (upload ảnh/PDF).
  2. Admin (có thể tham khảo ý kiến Contributor hiện hữu) duyệt/từ chối trong SLA 3 ngày làm việc; Contributor được cấp huy hiệu + quyền vào hàng chờ kiểm chứng.
- **Alternative Flow:** Contributor không chắc chắn → chuyển trạng thái `NEED_SECOND_OPINION`, mời contributor thứ hai hoặc Admin quyết định.
- **Exception Flow:** Phát hiện chứng chỉ giả / cố tình xác nhận sai lệch → thu hồi role, gỡ nhãn `EXPERT_VERIFIED` khỏi các nội dung đã duyệt, log audit; nội dung sức khoẻ nguy hiểm (vd khuyên nhịn ăn cực đoan) → Admin ẩn khẩn cấp + cảnh báo người dùng đã xem.
- **Post-condition:** Nội dung có `verificationStatus` cuối cùng + audit trail đầy đủ; role của user được cập nhật trong RBAC/JWT.

---

## 4. YÊU CẦU GIAO DIỆN NGOÀI (EXTERNAL INTERFACE REQUIREMENTS)

### 4.1. Giao diện người dùng (User Interfaces)

- Responsive Web (desktop ≥1280px, tablet, mobile web) + Native Mobile App (iOS 15+, Android 10+).
- Nguyên tắc: mọi tính năng AI phải có trạng thái loading rõ ràng (do latency LLM/CV có thể 2-8s), có nút "Thử lại" khi lỗi, không để màn hình "đứng hình" không phản hồi.
- Accessibility: hỗ trợ tối thiểu WCAG 2.1 AA cho các màn hình chính (contrast, font-size điều chỉnh được).

### 4.2. Giao diện phần cứng (Hardware Interfaces)

- Camera thiết bị di động (chụp ảnh tủ lạnh cho tính năng CV, quay/chọn video; hỗ trợ ước lượng chiều cao tham khảo cho UC-13).
- GPS/Location services + Fused Location Provider (định vị quán ăn UC-12, xác định vùng miền UC-14).
- Cảm biến on-device cho UC-13 fallback: accelerometer, gyroscope, pedometer/step-counter, PPG/nhịp tim (nếu có) — truy xuất qua HealthKit/Health Connect khi được, hoặc qua native Sensor API khi Health platform không khả dụng (phải xin quyền riêng, ghi rõ mục đích).
- Microphone (gián tiếp, thông qua video upload có âm thanh cho STT).

### 4.3. Giao diện phần mềm (Software Interfaces)

> **MVP demo: hàng S3/CDN dưới là bản full. Khi demo dùng Cloudinary (upload API + CDN + transcode sẵn) — xem PHỤ LỤC B.1.**
> | Hệ thống ngoài | Giao thức | Mục đích |
> |---|---|---|
> | OpenAI Responses API (`gpt-5.6-terra`) / Moderations API (`omni-moderation-latest`) | HTTPS/REST, streaming | LLM cho Chatbot; moderation; roadmap Meal Planner hành vi và Video Summarizer |
> | Google Maps Platform: Maps SDK / Places API / Geocoding API / Directions API | Native SDK + HTTPS/REST | Hiển thị bản đồ, tìm/đối chiếu quán chay, địa chỉ ↔ toạ độ, dẫn đường (UC-12 bắt buộc) |
> | Apple HealthKit | Native SDK (iOS) | Kênh ưu tiên đồng bộ sức khoẻ iOS (UC-13 Tầng 1) |
> | Google Fit REST API + Health Connect API | HTTPS/REST + OAuth2 / Native SDK (Android 14+) | Kênh ưu tiên đồng bộ sức khoẻ Android (UC-13 Tầng 1) |
> | Native Sensor API (Android SensorManager / iOS CoreMotion) | Native SDK | Kênh fallback UC-13 Tầng 2 khi Health platform không khả dụng |
> | AWS S3 / MinIO | HTTPS, pre-signed URL (single + multipart) | Lưu trữ media + hồ sơ Contributor (chứng chỉ nếu có, riêng bucket giới hạn truy cập). Pre-signed: auth bắt buộc, expiry 5 phút (ảnh) / 15 phút (video part), ràng buộc MIME + `contentLength`, BE verify lại trước khi tạo record |
> | CDN (CloudFront/Cloudflare) | HTTPS, HLS (.m3u8 + .ts) | Phân phối video HLS + ảnh bìa đã nén; S3 origin private, chỉ phát qua signed URL/origin-access |
> | Payment Gateway (tương lai, ngoài phạm vi hiện tại) | — | Không thuộc phạm vi tài liệu này |

### 4.4. Giao thức truyền thông (Communications Protocols)

> **MVP demo: đoạn presigned/multipart/SSE/DLQ dưới là bản full. Khi demo chỉ cần REST + upload Cloudinary + polling đơn giản — xem PHỤ LỤC B.1.**

- REST/HTTPS (TLS 1.2+) cho toàn bộ API.
- Upload: `POST /uploads/presigned` → S3 trực tiếp (single cho ảnh ≤5MB, multipart cho video) → `POST /videos/complete` (kèm checksum). Chunk 5-10MB (mạng yếu 2MB), timeout 30s/part, retry 3 lần, progress % ở client.
- WebSocket/SSE cho streaming câu trả lời chatbot theo thời gian thực và thông báo trạng thái xử lý video: **SSE `GET /videos/:id/events`** là kênh chính (`UPLOADED → TRANSCODING → READY/FAILED`), polling 5s là fallback.
- Webhook nội bộ giữa Media Service và Core Monolith khi transcode/STT hoàn tất: retry 5 lần (exponential backoff), bắt buộc `eventId` idempotency, quá SLA → DLQ + đánh `FAILED` cho phép retry thủ công.

---

## 5. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

### 5.1. Hiệu năng (Performance)

> **MVP demo: bỏ các SLA upload/transcode/CDN dưới, chỉ cần build + demo mượt — xem PHỤ LỤC B.3.**
> | Chỉ số | Mục tiêu |
> |---|---|
> | Thời gian phản hồi API CRUD thông thường (p95) | < 300ms |
> | Thời gian phản hồi đầu tiên (TTFT) của Chatbot streaming | < 2s |
> | Thời gian hoàn tất nhận diện ảnh CV (p95) | < 4s |
> | Thời gian xử lý tóm tắt video (video ≤10 phút) | < 3 phút (bất đồng bộ, không block UI) |
> | Upload ảnh bìa blog (≤5MB, mạng 4G) | p95 < 10s, hiển thị progress, retry từng part ≤ 3 lần |
> | Upload video (≤500MB multipart, mạng 4G) | Hỗ trợ resume trong 24h; `UPLOADED` ghi nhận < 2s sau `/complete` |
> | Transcode HLS (video ≤10 phút) → `READY` + phát qua CDN | < 5 phút (bất đồng bộ, SSE báo trạng thái, timeout → `FAILED` + DLQ) |
> | Throughput tìm kiếm (Elasticsearch) | ≥ 200 QPS ở giai đoạn đầu, scale ngang khi cần |

### 5.2. Tính khả dụng (Availability)

- Uptime mục tiêu Core System: 99.5% (giai đoạn đầu), nâng lên 99.9% khi scale.
- AI Services được thiết kế **decoupled**: khi AI Gateway down hoàn toàn, các chức năng Core (đăng bài, xem video, tìm quán ăn) vẫn hoạt động bình thường (Graceful Degradation — xem Circuit Breaker Tài liệu 1 mục 4.1.4).
- RTO (Recovery Time Objective) cho Core DB: ≤ 1 giờ; RPO (Recovery Point Objective): ≤ 15 phút (dùng Point-in-time Recovery của PostgreSQL).

### 5.3. Bảo mật & Bảo vệ dữ liệu (Security & Data Privacy)

- **Xác thực/Phân quyền**: JWT + RBAC theo 4 role (`ADMIN`, `CONTRIBUTOR`, `AUTHORIZED_USER`, Guest), kiểm tra ownership ở mọi thao tác sửa/xoá; endpoint Contributor-only (`/contributor/reviews`, `/recipes/verify`) và Admin-only phải test broken-access-control riêng. Hồ sơ Contributor (chứng chỉ nếu có) chỉ Admin và chủ sở hữu được xem.
- **Mã hoá dữ liệu nhạy cảm**: `height_cm`, `weight_kg`, `waist_cm`, `dateOfBirth`, token Wearable phải mã hoá tại tầng ứng dụng (AES-256-GCM) trước khi lưu DB, không log các trường này ra plaintext trong application log.
- **Tuân thủ Nghị định 13/2023/NĐ-CP**: người dùng phải được thông báo rõ mục đích thu thập dữ liệu sức khoẻ **và dữ liệu hành vi (lịch sử chat/món ăn/favourite dùng cho UC-08)**, consent riêng từng mục đích, có quyền từ chối cá nhân hoá hành vi mà vẫn dùng chức năng cơ bản, có quyền yêu cầu xoá dữ liệu ("right to erasure") — implement API `DELETE /users/me/data` (xoá cả vector hành vi + ChatSession khi user yêu cầu).
- **Bảo mật AI-specific**:
  - Chống Prompt Injection: input filter trước khi đưa vào LLM context.
  - Chống Data Leakage: không đưa dữ liệu cá nhân của user khác vào context RAG/behavioral (RAG chỉ truy xuất kho công thức công khai; tín hiệu hành vi của UC-08 **chỉ dùng dữ liệu của chính user đó**, không dùng chéo; không truy xuất chat history của user khác).
  - PII Redaction trong `AiRequestLog`: redact email/số điện thoại nếu vô tình xuất hiện trong request payload trước khi lưu log.
- **OWASP Top 10**: áp dụng kiểm thử SAST/DAST định kỳ, đặc biệt chú ý injection (SQL/NoSQL), broken access control (kiểm tra kỹ RBAC cho endpoint Admin).
- **Rate limiting chống lạm dụng AI**: xem bảng chi tiết Tài liệu 1 mục 6.2 — đây vừa là yêu cầu hiệu năng vừa là yêu cầu bảo mật (chống DoS chi phí).

### 5.4. Tính tương thích (Compatibility)

- Trình duyệt: 2 phiên bản gần nhất của Chrome, Safari, Firefox, Edge.
- Mobile OS: iOS 15+, Android 10+ (API level 29+).
- Định dạng video hỗ trợ upload: MP4, MOV; tự động transcode sang HLS (H.264) để đảm bảo tương thích phát trên mọi thiết bị.
- Đa ngôn ngữ: tiếng Việt (mặc định), kiến trúc i18n sẵn sàng mở rộng tiếng Anh (Nice-to-Have tương lai, không thuộc scope hiện tại).

### 5.5. Khả năng bảo trì & mở rộng (Maintainability & Scalability)

- Kiến trúc modular monolith cho phép tách microservice từng module khi tải tăng (đặc biệt module AI Gateway đã tách sẵn từ đầu).
- Horizontal scaling cho AI Gateway và Media Worker (stateless, scale theo queue length).
- Database: dùng read-replica cho các truy vấn nặng (search, dashboard Admin) để không ảnh hưởng transaction ghi chính.

---

## 6. VÒNG ĐỜI & QUẢN TRỊ MODEL AI (AI MODEL LIFECYCLE & GOVERNANCE)

### 6.1. Vòng đời model (Model Lifecycle)

```
[Thu thập dữ liệu huấn luyện] → [Huấn luyện/Fine-tune] → [Đánh giá offline (test set)]
   → [Staging deployment (A/B test nội bộ)] → [Production deployment (versioned)]
   → [Giám sát liên tục (drift, feedback)] → [Retrain định kỳ hoặc khi drift vượt ngưỡng]
```

- Mỗi model (CV, prompt template LLM, classifier moderation) đều có `modelVersion` rõ ràng, lưu trong `AiRequestLog` để truy vết chính xác request nào dùng version nào — bắt buộc cho việc rollback khi phát hiện version mới kém hơn.

### 6.2. Giám sát Model Drift

- **CV Model (nhận diện nguyên liệu/độ tươi)**: theo dõi tỷ lệ user feedback "sai" (qua nút thumbs down trên kết quả detect) theo tuần. Nếu tỷ lệ sai > 15% trong 2 tuần liên tiếp → cảnh báo team AI xem xét retrain.
- **LLM Chatbot**: theo dõi qua Langfuse — tỷ lệ câu trả lời bị user báo "không hữu ích", tỷ lệ câu trả lời bị content moderation tự chặn (output flagged), độ dài trung bình câu trả lời (phát hiện bất thường nếu model provider tự thay đổi hành vi ngoài kiểm soát).
- **Moderation Classifier**: theo dõi tỷ lệ Admin **override** quyết định AI (false positive/negative rate) — đây là chỉ số quan trọng nhất để đánh giá classifier có đang "quá tay" hay "bỏ sót".

### 6.3. Log Accuracy & Feedback Loop

- Mọi kết quả AI hiển thị cho user đều có cơ chế feedback nhanh (👍/👎) lưu vào bảng phụ `AiFeedback` (liên kết `AiRequestLog.id`, `rating`, `comment optional`). Feedback này **đồng thời là tín hiệu hành vi cho UC-08**.
- **Contributor review (UC-17) là vòng feedback có thẩm quyền cao nhất**: quyết định `APPROVE/CORRECT/REJECT` của Contributor được ưu tiên hơn feedback 👍/👎 thông thường khi retrain/tune prompt.
- Dữ liệu feedback được xuất định kỳ (hàng tuần) thành báo cáo cho team AI/Data để quyết định retrain hay điều chỉnh prompt.

### 6.4. Cơ chế Admin can thiệp thủ công

- **Cấp độ 1 — Content**: Admin duyệt/từ chối nội dung bị flag (UC-11), có thể override quyết định AI.
- **Cấp độ 2 — Feature toggle**: Admin có quyền tắt tạm thời 1 tính năng AI cụ thể (feature flag) nếu phát hiện sự cố nghiêm trọng (vd chatbot đưa thông tin y tế sai lệch hàng loạt) mà không cần deploy lại code — dùng LaunchDarkly hoặc feature flag tự xây trên Redis.
- **Cấp độ 3 — Model rollback**: Admin/Team kỹ thuật có thể rollback về `modelVersion` trước đó qua config (không cần retrain), áp dụng khi version mới gây regression rõ ràng.
- **Audit trail**: mọi hành động can thiệp của Admin vào hệ thống AI đều ghi vào `ModerationAction`/action log riêng cho AI governance, có `adminId`, `timestamp`, `reason` bắt buộc — phục vụ trách nhiệm giải trình (accountability), đặc biệt quan trọng với các quyết định liên quan tới nội dung sức khoẻ/dinh dưỡng.

### 6.5. Giới hạn trách nhiệm & Cảnh báo cho người dùng (Responsible AI Disclosure)

- Mọi output từ AI Nutrition Chatbot và Meal Planner phải kèm disclaimer: "Thông tin mang tính tham khảo, không thay thế tư vấn từ chuyên gia dinh dưỡng/bác sĩ." — hiển thị cố định ở UI, không phụ thuộc vào việc LLM có tự sinh ra disclaimer hay không.
- Nội dung đã qua kiểm chứng phải hiển thị nhãn phân biệt rõ: **"Đã được kiểm chứng bởi Contributor [tên] — [thời điểm]"** vs. **"AI gợi ý — chưa qua kiểm chứng"**; không được hiển thị nhãn expert cho nội dung chưa qua UC-17.
- Đây là yêu cầu bắt buộc (Must-Have) độc lập với việc tính năng AI đó là Must-Have hay Nice-to-Have, vì liên quan trực tiếp đến rủi ro sức khoẻ người dùng.

---

## PHỤ LỤC: BẢNG TRUY VẾT YÊU CẦU (TRACEABILITY MATRIX — tóm tắt)

| Use Case                                                                             | Phân loại                | Module liên quan (Tài liệu 1)                             |
| ------------------------------------------------------------------------------------ | ------------------------ | --------------------------------------------------------- |
| UC-01 Đăng ký/Đăng nhập (+ khai báo dietSchool)                                      | MH                       | Core Monolith - Identity                                  |
| UC-02 CRUD Post                                                                      | MH                       | Core Monolith - Content                                   |
| UC-03 Comment/Vote                                                                   | MH                       | Core Monolith - Content                                   |
| UC-04 Tìm kiếm Video/Blog                                                            | MH                       | Elasticsearch + Core                                      |
| UC-05 Upload Video                                                                   | MH                       | Media Service                                             |
| UC-06 Menu tuần rule-based (có lọc Phật giáo/Đạo giáo, BMI/BMR/TDEE/WHtR)            | MH                       | Core Monolith - Nutrition                                 |
| UC-07 AI Chatbot (RAG có lọc dietSchool, lịch sử dùng cho UC-08)                     | MH                       | AI Gateway - RAG Pipeline (mục 4.1)                       |
| UC-08 AI Meal Planner hành vi GenAI (lịch sử chat/món ăn, gợi ý chủ động)            | MH (nâng từ NTH theo GV) | AI Gateway - GenAI + Behavioral engine                    |
| UC-09 CV nhận diện nguyên liệu                                                       | NTH                      | AI Gateway - CV Pipeline (mục 4.2)                        |
| UC-10 Video Summarizer                                                               | NTH                      | AI Gateway - STT Pipeline (mục 4.3)                       |
| UC-11 Moderation (Admin + Contributor)                                               | MH cơ bản / NTH nâng cao | AI Gateway - Moderation (mục 4.4)                         |
| UC-12 Quán ăn (Google Maps Platform: Maps/Places/Geocoding/Directions)               | MH                       | Core Monolith - Location + Google Maps Platform           |
| UC-13 Sức khoẻ (HealthKit/Fit/Health Connect + fallback cảm biến, BMI/BMR/TDEE/WHtR) | MH (nâng từ NTH)         | Core Monolith - Health + Mobile sensors                   |
| UC-14 Gợi ý mùa/vùng + trường phái chay                                              | NTH                      | Core Monolith - Recommendation                            |
| UC-15 Admin giám sát AI                                                              | NTH nâng cao             | Admin CMS + Observability stack (mục 6)                   |
| UC-16 Món/thực đơn cộng đồng (Contributor)                                           | MH                       | Core Monolith - Content/Recipe                            |
| UC-17 Kiểm chứng AI + xét duyệt Contributor                                          | MH                       | Admin CMS + Contributor portal + AI Gateway feedback loop |

---

## PHỤ LỤC B: PHẠM VI MVP DEMO CHẤM ĐIỂM (Web-only, Cloudinary, AI stub)

> Nguyên tắc: bản full ở mục 3-6 giữ nguyên làm roadmap. **Khi demo chỉ cần đạt cột MVP.**
> Nền tảng: chỉ Web Next.js (bỏ app mobile native). Auth: email/password + Google OAuth (bỏ Apple).

### B.1. Quyết định kỹ thuật MVP (ghi đè bản full khi demo)

| Hạng mục (bản full)                                         | MVP demo dùng gì                                                                                                                                                                                                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| S3 pre-signed + transcode HLS + CDN riêng (§4.3/§4.4/UC-05) | **Cloudinary free** (25 credits/tháng): upload qua `upload_preset` (signed cho video, unsigned cho ảnh), transcode + CDN của Cloudinary. Giới hạn demo: video ≤100MB, ảnh ≤10MB. Bỏ `/uploads/presigned`, `/videos/complete`, SSE transcode, DLQ |
| Elasticsearch (UC-04)                                       | Postgres full-text (`to_tsvector` tiếng Việt cơ bản) hoặc `ILIKE` + phân trang. Không yêu cầu 200 QPS                                                                                                                                            |
| HealthKit/Fit/Health Connect + cảm biến (UC-13)             | Chỉ **nhập tay** chiều cao/cân nặng/vòng eo → tính BMI/BMR/TDEE/WHtR. Bỏ OAuth sức khoẻ, bỏ sync 6h                                                                                                                                              |
| LLM RAG + Behavioral engine (UC-07/08)                      | UC-07: gọi LLM trực tiếp (không RAG) + disclaimer cố định. UC-08: rule UC-06 + gợi ý tĩnh theo `dietSchool`/mùa (bỏ vector hành vi, bỏ push chủ động)                                                                                            |
| CV/STT (UC-09/10)                                           | Stub: nút "Nhận diện"/"Tóm tắt" trả mock có gắn nhãn `demo_mock`. Không chấm điểm accuracy                                                                                                                                                       |
| Moderation AI + Admin CMS full (UC-11/15)                   | UC-11 cơ bản: flag theo từ khoá + Admin/Contributor duyệt tay. Bỏ classifier, bỏ dashboard drift/cost, bỏ feature-flag/rollback                                                                                                                  |
| Google Maps Platform full (UC-12)                           | Giữ **Maps JS + Geocoding + Places** cho web; Directions dùng Universal Link. Dữ liệu quán seed tay 20-30 quán; hết quota → fallback list nội bộ                                                                                                 |

### B.2. Phạm vi UC cho demo (IN / DEFER)

| UC                               | MVP                                                                    |
| -------------------------------- | ---------------------------------------------------------------------- |
| UC-01 Auth (+ `dietSchool`)      | IN — đủ đăng ký/đăng nhập, phân 4 role                                 |
| UC-02 CRUD Post + ảnh Cloudinary | IN                                                                     |
| UC-03 Comment/Vote               | IN (rate-limit cơ bản)                                                 |
| UC-04 Tìm kiếm                   | IN — bản Postgres, không cần ES                                        |
| UC-05 Upload video               | IN — bản Cloudinary ≤100MB, progress + retry đơn giản                  |
| UC-06 Menu rule-based            | IN — bản nhập tay                                                      |
| UC-07 Chatbot                    | IN — bản LLM trực tiếp + disclaimer                                    |
| UC-08 Meal Planner hành vi       | DEFER — demo bằng UC-06 + gợi ý tĩnh là đủ                             |
| UC-09/10/14/15                   | DEFER — mock/tắt, không chấm                                           |
| UC-11 Moderation                 | IN bản tay (flag từ khoá + duyệt)                                      |
| UC-12 Quán ăn                    | IN bản web rút gọn như B.1                                             |
| UC-13 Sức khoẻ                   | IN bản nhập tay                                                        |
| UC-16/17 Contributor             | IN bản gọn: tạo món + `APPROVE/CORRECT/REJECT` tay, xét duyệt role tay |

### B.3. NFR cho demo

- Bỏ SLA p95/200 QPS/uptime 99.5%; chỉ cần `build` + demo mượt trên laptop + mạng lớp học.
- Bảo mật tối thiểu: JWT + RBAC 4 role + ownership check; bỏ SAST/DAST, mã hoá AES chỉ cần ghi nhận design.
- Dữ liệu demo: seed sẵn user 4 role, 20 post, 10 video Cloudinary, 30 quán, 30 công thức có `dietSchool`.
