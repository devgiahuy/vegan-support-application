# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
## Ứng dụng hỗ trợ người ăn chay — VeggieConnect
**Chuẩn tham chiếu:** IEEE Std 830-1998 | **Phiên bản:** 1.0 | **Ngày:** 2026-09-12

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
| Thuật ngữ | Giải thích |
|---|---|
| BMI | Body Mass Index — chỉ số khối cơ thể = cân nặng(kg) / chiều cao(m)² |
| RAG | Retrieval-Augmented Generation — kỹ thuật tăng cường LLM bằng dữ liệu truy xuất |
| LLM | Large Language Model |
| CV | Computer Vision |
| STT | Speech-to-Text |
| GenAI | Generative AI (tạo sinh nội dung mới, khác với rule-based) |
| RBAC | Role-Based Access Control |
| Guest/Unauthorized User | Người dùng chưa đăng ký/đăng nhập |
| Model Drift | Hiện tượng độ chính xác model AI suy giảm theo thời gian do dữ liệu thực tế thay đổi so với dữ liệu huấn luyện |
| Human-in-the-loop | Cơ chế yêu cầu con người (Admin) xác nhận/can thiệp vào quyết định của AI |
| Wearable | Thiết bị đeo thông minh (đồng hồ, vòng tay) đồng bộ dữ liệu sức khoẻ |

### 1.4. Tài liệu tham chiếu
- IEEE Std 830-1998, Recommended Practice for Software Requirements Specifications.
- OWASP ASVS 4.0 (Application Security Verification Standard) — dùng cho mục 5.3 Bảo mật.
- Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân (Việt Nam) — áp dụng cho dữ liệu sức khoẻ/BMI người dùng.

### 1.5. Tổng quan tài liệu
Mục 2 mô tả bối cảnh tổng thể hệ thống. Mục 3 đặc tả chi tiết từng chức năng theo Use Case. Mục 4 đặc tả giao diện ngoài. Mục 5 đặc tả yêu cầu phi chức năng. Mục 6 đặc tả vòng đời và quản trị model AI.

---

## 2. MÔ TẢ TỔNG QUAN (OVERALL DESCRIPTION)

### 2.1. Bối cảnh sản phẩm (Product Perspective)
VeggieConnect là hệ thống độc lập (không phụ thuộc hệ thống legacy nào), nhưng tích hợp với các dịch vụ bên thứ ba: Google/Apple OAuth, Google Places API (đối chiếu dữ liệu quán ăn), Apple HealthKit/Google Fit (đồng bộ sức khoẻ), và các nhà cung cấp AI (Anthropic/OpenAI cho LLM, dịch vụ STT).

### 2.2. Chức năng sản phẩm (tóm tắt)
- Quản lý người dùng & nội dung (CRUD, RBAC).
- Tìm kiếm & khám phá (blog, video, quán ăn) có gợi ý thông minh.
- Công cụ dinh dưỡng: tính BMI, sinh thực đơn tuần, AI Meal Planner.
- Hệ sinh thái AI: Chatbot RAG, Computer Vision nhận diện nguyên liệu, Video Summarization, Content Moderation tự động.
- Quản trị nội dung & giám sát AI cho Admin.

### 2.3. Đặc điểm người dùng (User Characteristics)
| Nhóm | Đặc điểm | Hàm ý thiết kế |
|---|---|---|
| Administrator | Nhân sự nội bộ, am hiểu vận hành nền tảng, cần xem dữ liệu AI ở mức kỹ thuật vừa phải (không cần là Data Scientist) | Dashboard cần trực quan hoá metric AI (biểu đồ, không yêu cầu đọc log thô) |
| Authorized User | Người quan tâm ăn chay/dinh dưỡng, đa dạng độ tuổi (18-55+), có thể không rành công nghệ | UI đơn giản, AI feature có hướng dẫn onboarding, không yêu cầu hiểu thuật ngữ AI |
| Unauthorized User (Guest) | Khách vãng lai, mục tiêu trải nghiệm nhanh trước khi quyết định đăng ký | Trial phải mượt, giới hạn rõ ràng, CTA đăng ký không gây khó chịu |

### 2.4. Ràng buộc chung (General Constraints)
- Phải hỗ trợ tiếng Việt làm ngôn ngữ chính (bao gồm search full-text tiếng Việt có dấu).
- Dữ liệu sức khoẻ (BMI, chiều cao/cân nặng, dữ liệu Wearable) phải tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
- Chi phí vận hành AI (LLM/CV/STT API) phải có cơ chế kiểm soát ngân sách (không được để một user/bot spam làm vỡ chi phí vận hành).
- Phải hoạt động ổn định trên kết nối mạng di động 3G/4G phổ biến tại Việt Nam (tối ưu payload, ảnh nén).

### 2.5. Giả định và phụ thuộc (Assumptions and Dependencies)
- Giả định nhà cung cấp LLM (Anthropic/OpenAI) duy trì SLA uptime ≥ 99.9%; nếu không, hệ thống phụ thuộc vào cơ chế fallback nội bộ (mục 4.1.4 Tài liệu 1).
- Giả định người dùng cung cấp thông tin chiều cao/cân nặng trung thực (hệ thống không thể xác minh, chỉ đưa ra khuyến nghị mang tính tham khảo, không thay thế tư vấn y khoa).
- Phụ thuộc Google Places API cho việc đối chiếu/làm giàu dữ liệu quán ăn chay (Nice-to-Have).

---

## 3. SYSTEM FEATURES & FUNCTIONAL REQUIREMENTS

> Ký hiệu: **[MH]** = Must-Have, **[NTH]** = Nice-to-Have

### 3.1. UC-01: Đăng ký / Đăng nhập tài khoản [MH]
- **Actor:** Unauthorized User (trở thành Authorized User)
- **Pre-condition:** Chưa có tài khoản hoặc chưa đăng nhập.
- **Main Flow:**
  1. User chọn "Đăng ký", nhập email/mật khẩu hoặc chọn OAuth (Google/Apple).
  2. Hệ thống validate định dạng email, độ mạnh mật khẩu (≥8 ký tự, có số/chữ hoa).
  3. Hệ thống gửi email xác thực (OTP hoặc link).
  4. User xác thực → tài khoản chuyển `ACTIVE`, gán role `AUTHORIZED_USER`.
- **Alternative Flow:** Email đã tồn tại → hệ thống trả lỗi 409, gợi ý "Đăng nhập hoặc quên mật khẩu".
- **Exception Flow:** Dịch vụ gửi email lỗi → cho phép resend tối đa 3 lần/giờ, hiển thị thông báo rõ ràng.
- **Post-condition:** User có tài khoản `ACTIVE`, nhận JWT access + refresh token.

### 3.2. UC-02: Quản lý bài đăng cá nhân (CRUD Post) [MH]
- **Actor:** Authorized User
- **Pre-condition:** Đã đăng nhập.
- **Main Flow:**
  1. User tạo bài viết (tiêu đề, nội dung markdown, ảnh bìa, chọn danh mục).
  2. Hệ thống chạy Content Moderation tự động (xem UC-11) trước khi publish.
  3. Nếu không bị flag → bài viết `PUBLISHED` ngay; nếu bị flag → `FLAGGED`, chờ Admin duyệt.
- **Alternative Flow:** User sửa/xoá bài viết của chính mình — hệ thống kiểm tra `authorId == currentUser.id` hoặc role Admin.
- **Exception Flow:** Người dùng cố sửa bài của người khác → trả 403 Forbidden.
- **Post-condition:** Bài viết được lưu với trạng thái tương ứng.

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
- **Actor:** Authorized User
- **Pre-condition:** Đã đăng nhập, video ≤ giới hạn dung lượng/thời lượng cấu hình (vd 500MB / 60 phút).
- **Main Flow:**
  1. Client lấy pre-signed URL, upload trực tiếp lên S3.
  2. Tạo record `Video` với `processingStatus=UPLOADED`.
  3. Hệ thống queue job transcode (HLS) chạy song song với pipeline STT/Summarization (Nice-to-Have, xem UC-09).
- **Exception Flow:** Upload thất bại giữa chừng → cho phép resume upload (multipart) hoặc yêu cầu upload lại; video không tạo record rác trong DB nếu chưa hoàn tất.
- **Post-condition:** Video ở trạng thái `READY` sau khi transcode xong, hiển thị công khai theo `status=PUBLISHED`.

### 3.6. UC-06: Tạo thực đơn tuần theo BMI (rule-based) [MH]
- **Actor:** Authorized User
- **Pre-condition:** Đã nhập chiều cao, cân nặng, mức độ vận động.
- **Main Flow:**
  1. Hệ thống tính BMI = weight/(height/100)².
  2. Phân loại: <18.5 thiếu cân, 18.5-22.9 bình thường (chuẩn châu Á), 23-24.9 thừa cân, ≥25 béo phì.
  3. Tính calo mục tiêu theo công thức Mifflin-St Jeor + hệ số hoạt động.
  4. Hệ thống chọn công thức từ DB theo rule (calo/bữa, loại chế độ ăn) sinh thực đơn 7 ngày x 3-4 bữa.
- **Alternative Flow:** Thiếu dữ liệu (chưa nhập cân nặng) → yêu cầu hoàn thiện hồ sơ trước khi tạo thực đơn.
- **Exception Flow:** Không đủ công thức trong DB thoả điều kiện calo → hệ thống nới lỏng ngưỡng ±10% và cảnh báo "thực đơn có thể chưa tối ưu hoàn toàn".
- **Post-condition:** `WeeklyMenu` được tạo với `generatedBy="system_rule"`.

### 3.7. UC-07: AI Nutrition Chatbot (LLM) [MH]
- **Actor:** Authorized User, Unauthorized User (giới hạn trial)
- **Pre-condition:** Không bắt buộc đăng nhập (Guest được trial giới hạn).
- **Main Flow:**
  1. User nhập câu hỏi (vd: "Tôi ăn chay trường thì bổ sung protein từ đâu?").
  2. Hệ thống kiểm tra rate limit theo role.
  3. Truy xuất RAG context từ kho công thức/kiến thức dinh dưỡng.
  4. Gọi LLM sinh câu trả lời, kiểm duyệt output, trả về kèm trích dẫn công thức liên quan.
- **Alternative Flow:** Câu hỏi ngoài phạm vi dinh dưỡng chay (vd hỏi về chính trị) → chatbot lịch sự từ chối, hướng lại chủ đề.
- **Exception Flow:**
  - Guest hết quota trial → trả 429 kèm CTA đăng ký.
  - LLM provider lỗi → fallback provider dự phòng; nếu tất cả lỗi → trả câu trả lời tĩnh xin lỗi + gợi ý câu hỏi thường gặp.
- **Post-condition:** Hội thoại được lưu vào `ChatSession`/`ChatMessage` (nếu là Authorized User; Guest lưu tạm 7 ngày).

### 3.8. UC-08: AI Personalized Meal Planner (GenAI) [NTH]
- **Actor:** Authorized User
- **Pre-condition:** Đã có hồ sơ dinh dưỡng đầy đủ (BMI, dị ứng, sở thích món ăn).
- **Main Flow:** Thay vì chọn công thức theo rule cứng, hệ thống dùng LLM sinh thực đơn có tính sáng tạo (đa dạng món, tránh lặp lại, cân bằng dinh dưỡng) dựa trên ràng buộc calo + sở thích.
- **Alternative Flow:** User không hài lòng thực đơn gợi ý → nút "Tạo lại" (regenerate) với feedback ("ít cay hơn", "nhiều đạm hơn").
- **Exception Flow:** LLM sinh món ăn không tồn tại trong DB công thức (hallucination) → hệ thống validate: nếu tên món không match DB, chỉ hiển thị như "gợi ý tham khảo" không link được vào chi tiết công thức, đồng thời log để rà soát.
- **Post-condition:** `WeeklyMenu` với `generatedBy="ai_genai"`.

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

### 3.11. UC-11: Content Moderation tự động + Admin duyệt [NTH nâng cao / MH ở mức cơ bản]
- **Actor:** Hệ thống AI (tự động), Administrator (xác nhận)
- **Pre-condition:** Có nội dung mới được đăng (post/comment/video).
- **Main Flow:** Xem pipeline chi tiết Tài liệu 1 mục 4.4. Nội dung điểm rủi ro trung bình được đưa vào hàng chờ (`FLAGGED`), Admin xem lý do AI đưa ra, quyết định Approve/Reject.
- **Alternative Flow:** Admin không đồng ý với đánh giá AI (false positive) → Approve thủ công, hệ thống ghi nhận để cải thiện classifier.
- **Exception Flow:** Nội dung vi phạm nghiêm trọng rõ ràng (điểm > 0.8) → tự động `REJECTED` ngay, không cần chờ Admin, nhưng vẫn lưu log để Admin audit sau (tránh false positive gây mất nội dung hợp lệ oan mà không ai biết).
- **Post-condition:** Nội dung ở trạng thái cuối cùng (`PUBLISHED`/`REJECTED`), ghi vào `ModerationAction`.

### 3.12. UC-12: Xem quán ăn chay gần nhất & gợi ý theo món [MH]
- **Actor:** Tất cả
- **Pre-condition:** Đã cấp quyền vị trí (hoặc nhập địa chỉ thủ công).
- **Main Flow:** Hệ thống query `VegRestaurant` trong bán kính (mặc định 5km), sắp xếp theo khoảng cách; nếu user tìm theo tên món cụ thể → ưu tiên quán có `cuisineTags` khớp.
- **Alternative Flow:** Không có quán trong bán kính → tự động mở rộng bán kính (5km→10km→20km) và thông báo cho user.
- **Post-condition:** Danh sách quán hiển thị trên bản đồ + list view.

### 3.13. UC-13: Đồng bộ Apple Health/Google Fit [NTH]
- **Actor:** Authorized User
- **Pre-condition:** Có thiết bị/app hỗ trợ, đồng ý cấp quyền OAuth.
- **Main Flow:** User kết nối tài khoản Wearable → hệ thống lấy dữ liệu (bước chân, calo tiêu thụ, cân nặng nếu có) → dùng để tinh chỉnh tính toán calo mục tiêu trong Meal Planner.
- **Exception Flow:** Token hết hạn/thu hồi quyền → hệ thống phát hiện lỗi 401 từ API bên thứ 3, đánh dấu `WearableConnection` là "cần kết nối lại", không làm gián đoạn các tính năng khác.
- **Post-condition:** Dữ liệu sức khoẻ được đồng bộ định kỳ (vd mỗi 6 giờ), lưu có mã hoá.

### 3.14. UC-14: Gợi ý món ăn theo mùa/vùng miền [NTH]
- **Actor:** Authorized User, Unauthorized User
- **Pre-condition:** Hệ thống xác định được mùa hiện tại (theo tháng) và vùng miền (theo profile hoặc GPS).
- **Main Flow:** Hệ thống filter/rank công thức theo `Recipe.season` và `Recipe.region` phù hợp, hiển thị ở trang chủ dạng "Gợi ý cho bạn hôm nay".
- **Post-condition:** Danh sách gợi ý cá nhân hoá hiển thị.

### 3.15. UC-15: Admin giám sát AI Models [NTH nâng cao]
- **Actor:** Administrator
- **Pre-condition:** Đã đăng nhập với role ADMIN.
- **Main Flow:** Admin xem dashboard: số lượng request/feature, chi phí, latency, tỷ lệ lỗi, tỷ lệ fallback được kích hoạt, biểu đồ accuracy CV model theo thời gian (dựa trên feedback thumbs up/down).
- **Alternative Flow:** Phát hiện model drift (accuracy giảm liên tục) → Admin có thể "đóng băng" (disable) tạm thời 1 tính năng AI cụ thể mà không ảnh hưởng toàn hệ thống.
- **Post-condition:** Quyết định can thiệp của Admin được ghi log, phục vụ audit và cải tiến model (chi tiết mục 6).

---

## 4. YÊU CẦU GIAO DIỆN NGOÀI (EXTERNAL INTERFACE REQUIREMENTS)

### 4.1. Giao diện người dùng (User Interfaces)
- Responsive Web (desktop ≥1280px, tablet, mobile web) + Native Mobile App (iOS 15+, Android 10+).
- Nguyên tắc: mọi tính năng AI phải có trạng thái loading rõ ràng (do latency LLM/CV có thể 2-8s), có nút "Thử lại" khi lỗi, không để màn hình "đứng hình" không phản hồi.
- Accessibility: hỗ trợ tối thiểu WCAG 2.1 AA cho các màn hình chính (contrast, font-size điều chỉnh được).

### 4.2. Giao diện phần cứng (Hardware Interfaces)
- Camera thiết bị di động (chụp ảnh tủ lạnh cho tính năng CV, quay/chọn video).
- GPS/Location services (gợi ý quán ăn gần nhất).
- Microphone (gián tiếp, thông qua video upload có âm thanh cho STT).

### 4.3. Giao diện phần mềm (Software Interfaces)
| Hệ thống ngoài | Giao thức | Mục đích |
|---|---|---|
| Anthropic Claude API / OpenAI API | HTTPS/REST, streaming SSE | LLM cho Chatbot, Meal Planner, Video Summarizer |
| Google Places API | HTTPS/REST | Làm giàu/đối chiếu dữ liệu quán ăn |
| Apple HealthKit | Native SDK (iOS) | Đồng bộ dữ liệu sức khoẻ |
| Google Fit REST API | HTTPS/REST + OAuth2 | Đồng bộ dữ liệu sức khoẻ (Android) |
| AWS S3 / MinIO | HTTPS, pre-signed URL | Lưu trữ media |
| Payment Gateway (tương lai, ngoài phạm vi hiện tại) | — | Không thuộc phạm vi tài liệu này |

### 4.4. Giao thức truyền thông (Communications Protocols)
- REST/HTTPS (TLS 1.2+) cho toàn bộ API.
- WebSocket/SSE cho streaming câu trả lời chatbot theo thời gian thực và thông báo trạng thái xử lý video (processing → ready).
- Webhook nội bộ giữa Media Service và Core Monolith khi transcode/STT hoàn tất.

---

## 5. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

### 5.1. Hiệu năng (Performance)
| Chỉ số | Mục tiêu |
|---|---|
| Thời gian phản hồi API CRUD thông thường (p95) | < 300ms |
| Thời gian phản hồi đầu tiên (TTFT) của Chatbot streaming | < 2s |
| Thời gian hoàn tất nhận diện ảnh CV (p95) | < 4s |
| Thời gian xử lý tóm tắt video (video ≤10 phút) | < 3 phút (bất đồng bộ, không block UI) |
| Throughput tìm kiếm (Elasticsearch) | ≥ 200 QPS ở giai đoạn đầu, scale ngang khi cần |

### 5.2. Tính khả dụng (Availability)
- Uptime mục tiêu Core System: 99.5% (giai đoạn đầu), nâng lên 99.9% khi scale.
- AI Services được thiết kế **decoupled**: khi AI Gateway down hoàn toàn, các chức năng Core (đăng bài, xem video, tìm quán ăn) vẫn hoạt động bình thường (Graceful Degradation — xem Circuit Breaker Tài liệu 1 mục 4.1.4).
- RTO (Recovery Time Objective) cho Core DB: ≤ 1 giờ; RPO (Recovery Point Objective): ≤ 15 phút (dùng Point-in-time Recovery của PostgreSQL).

### 5.3. Bảo mật & Bảo vệ dữ liệu (Security & Data Privacy)
- **Xác thực/Phân quyền**: JWT + RBAC theo 3 role, kiểm tra ownership ở mọi thao tác sửa/xoá.
- **Mã hoá dữ liệu nhạy cảm**: `height_cm`, `weight_kg`, `dateOfBirth`, token Wearable phải mã hoá tại tầng ứng dụng (AES-256-GCM) trước khi lưu DB, không log các trường này ra plaintext trong application log.
- **Tuân thủ Nghị định 13/2023/NĐ-CP**: người dùng phải được thông báo rõ mục đích thu thập dữ liệu sức khoẻ, có quyền yêu cầu xoá dữ liệu ("right to erasure") — implement API `DELETE /users/me/data`.
- **Bảo mật AI-specific**:
  - Chống Prompt Injection: input filter trước khi đưa vào LLM context.
  - Chống Data Leakage: không đưa dữ liệu cá nhân của user khác vào context RAG (đảm bảo RAG chỉ truy xuất trên kho công thức công khai, không truy xuất chat history của user khác).
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
- Mọi kết quả AI hiển thị cho user đều có cơ chế feedback nhanh (👍/👎) lưu vào bảng phụ `AiFeedback` (liên kết `AiRequestLog.id`, `rating`, `comment optional`).
- Dữ liệu feedback được xuất định kỳ (hàng tuần) thành báo cáo cho team AI/Data để quyết định retrain hay điều chỉnh prompt.

### 6.4. Cơ chế Admin can thiệp thủ công
- **Cấp độ 1 — Content**: Admin duyệt/từ chối nội dung bị flag (UC-11), có thể override quyết định AI.
- **Cấp độ 2 — Feature toggle**: Admin có quyền tắt tạm thời 1 tính năng AI cụ thể (feature flag) nếu phát hiện sự cố nghiêm trọng (vd chatbot đưa thông tin y tế sai lệch hàng loạt) mà không cần deploy lại code — dùng LaunchDarkly hoặc feature flag tự xây trên Redis.
- **Cấp độ 3 — Model rollback**: Admin/Team kỹ thuật có thể rollback về `modelVersion` trước đó qua config (không cần retrain), áp dụng khi version mới gây regression rõ ràng.
- **Audit trail**: mọi hành động can thiệp của Admin vào hệ thống AI đều ghi vào `ModerationAction`/action log riêng cho AI governance, có `adminId`, `timestamp`, `reason` bắt buộc — phục vụ trách nhiệm giải trình (accountability), đặc biệt quan trọng với các quyết định liên quan tới nội dung sức khoẻ/dinh dưỡng.

### 6.5. Giới hạn trách nhiệm & Cảnh báo cho người dùng (Responsible AI Disclosure)
- Mọi output từ AI Nutrition Chatbot và Meal Planner phải kèm disclaimer: "Thông tin mang tính tham khảo, không thay thế tư vấn từ chuyên gia dinh dưỡng/bác sĩ." — hiển thị cố định ở UI, không phụ thuộc vào việc LLM có tự sinh ra disclaimer hay không.
- Đây là yêu cầu bắt buộc (Must-Have) độc lập với việc tính năng AI đó là Must-Have hay Nice-to-Have, vì liên quan trực tiếp đến rủi ro sức khoẻ người dùng.

---

## PHỤ LỤC: BẢNG TRUY VẾT YÊU CẦU (TRACEABILITY MATRIX — tóm tắt)

| Use Case | Phân loại | Module liên quan (Tài liệu 1) |
|---|---|---|
| UC-01 Đăng ký/Đăng nhập | MH | Core Monolith - Identity |
| UC-02 CRUD Post | MH | Core Monolith - Content |
| UC-03 Comment/Vote | MH | Core Monolith - Content |
| UC-04 Tìm kiếm Video/Blog | MH | Elasticsearch + Core |
| UC-05 Upload Video | MH | Media Service |
| UC-06 Menu tuần rule-based | MH | Core Monolith - Nutrition |
| UC-07 AI Chatbot | MH | AI Gateway - RAG Pipeline (mục 4.1) |
| UC-08 AI Meal Planner GenAI | NTH | AI Gateway - GenAI |
| UC-09 CV nhận diện nguyên liệu | NTH | AI Gateway - CV Pipeline (mục 4.2) |
| UC-10 Video Summarizer | NTH | AI Gateway - STT Pipeline (mục 4.3) |
| UC-11 Content Moderation | NTH nâng cao / MH cơ bản | AI Gateway - Moderation (mục 4.4) |
| UC-12 Quán ăn gần nhất | MH | Core Monolith - Location |
| UC-13 Đồng bộ Wearable | NTH | Core Monolith - Identity extension |
| UC-14 Gợi ý theo mùa/vùng | NTH | Core Monolith - Recommendation |
| UC-15 Admin giám sát AI | NTH nâng cao | Admin CMS + Observability stack (mục 6) |