# Vegan Support Application — Business Rules Specification

**Phiên bản:** 1.0  
**Ngày cập nhật:** 2026-09-21  
**Phạm vi:** Backend Domain & System Contracts  
**Nguyên tắc cốt lõi:** Backend-Authoritative (Mọi quy tắc nghiệp vụ, ràng buộc dữ liệu, phân quyền và an toàn sức khỏe đều do Backend kiểm soát và thực thi tuyệt đối; Frontend chỉ đảm nhận hiển thị và UX).

---

## 1. NGUYÊN TẮC AN TOÀN HỆ THỐNG CỐT LÕI (CORE SAFETY INVARIANTS)

1. **Ràng buộc an toàn sức khỏe là tối thượng (Hard-Constraint Dominance):**
   - Dị ứng (`Allergies`), nguyên liệu bài trừ tường minh (`Ingredient Exclusions`), trường phái ăn chay (`Diet Pattern`) và các ngày ăn chay theo truyền thống/tôn giáo (`Traditions`) là các bộ lọc cứng bắt buộc ở tầng Backend.
   - Mọi thuật toán gợi ý (recommendations), AI chat hay xếp hạng hành vi **tuyệt đối không bao giờ được phép** đưa món ăn vi phạm vào kết quả.
2. **Quyền hạn thống nhất của Contributor (Unified Contributor Trust):**
   - Mọi Contributor được phê duyệt đều có quyền hạn ngang nhau.
   - Các giá trị căn cứ phê duyệt (`ORGANIZATION_AFFILIATION`, `PLATFORM_TRACK_RECORD`, `ADMIN_INVITED`) chỉ dùng cho mục đích đối soát và lưu vết kiểm toán (audit trail), **tuyệt đối không được dùng làm phân cấp quyền (không có RBAC đa tầng cho Contributor)**.
3. **Cảnh báo AI và Báo cáo người dùng chỉ là tín hiệu (Signals, Not Final Verdicts):**
   - Các cảnh báo vi phạm tự động từ AI hoặc báo cáo (`reports`) của người dùng chỉ là tín hiệu trung gian để cách ly rà soát (`QUARANTINED`), **không được tự động xóa cứng (`hard-delete`)** dữ liệu. Quyết định xử lý cuối cùng thuộc về Admin.
4. **Quyền quyết định thuộc về Người dùng (User Confirmation for Automated Ingestion):**
   - Dữ liệu phân tích từ ảnh chụp tủ lạnh (Fridge Vision) hay hóa đơn (Receipt Extraction) chỉ là dữ liệu đề xuất (`candidates`).
   - Tuyệt đối không tự động ghi/sửa kho đồ ăn (Pantry) hay Kế hoạch ăn nếu người dùng chưa bấm xác nhận tường minh.
5. **Truy xuất nguồn gốc dữ liệu dinh dưỡng (Nutrition Provenance & Precision):**
   - Mọi số liệu dinh dưỡng, hệ số chế biến và giới hạn tiêu thụ phải gắn kèm nguồn (`source`), giấy phép (`license`) và phiên bản (`version`).
   - Dữ liệu do AI ước lượng phải được phân loại nhãn rõ ràng (`AI_ESTIMATED`), không được âm thầm ghi đè lên dữ liệu quy chuẩn (`CANONICAL_CALCULATED`).
6. **Ranh giới tuyên bố y tế và pháp lý (Legal & Clinical Safety Boundary):**
   - Hệ thống không tuyên bố thẩm định chứng chỉ chuyên môn, không đưa ra chẩn đoán lâm sàng hay cam kết mức độ an toàn vệ sinh thực phẩm trong phạm vi MVP.

---

## 2. CHI TIẾT CÁC QUY TẮC NGHIỆP VỤ (BL-01 ĐẾN BL-18)

### BL-01: Định danh, Vai trò & Mô hình Contributor thống nhất (Unified Contributor Trust)
- **Các vai trò người dùng:** `MEMBER`, `CONTRIBUTOR`, `ADMIN`.
- **Đăng ký & Ứng tuyển:**
  - Người dùng đăng ký tài khoản mặc định có vai trò `MEMBER`.
  - Nộp đơn ứng tuyển Contributor (khi đăng ký hoặc từ profile) chỉ tạo một đơn ở trạng thái `PENDING`, không cấp quyền Contributor trước.
  - Mỗi người dùng chỉ có tối đa 1 đơn `PENDING`. Nếu bị từ chối (`REJECTED`), áp dụng thời gian giãn cách 30 ngày (`cooldown`) trước khi được nộp lại.
- **Phê duyệt của Admin:**
  - Chỉ Admin mới có quyền phê duyệt/từ chối/thu hồi quyền Contributor kèm lý do và ghi nhận `ContributorApprovalBasis`.
  - Nghiêm cấm hành vi tự phê duyệt (`Self-approval`).
  - Khi được duyệt hoặc thu hồi quyền, hệ thống phải thực hiện hủy/xoay phiên đăng nhập (token revocation/rotation) để ngăn việc sử dụng token cũ mang sai quyền hạn.

### BL-02: Trường phái ăn chay & Ràng buộc loại trừ (Diet Patterns & Exclusions)
- **Trường phái ăn chay (Diet Pattern):** `VEGAN` (thuần chay), `LACTO_OVO` (chay có trứng, sữa).
- **Truyền thống / Tôn giáo (Tradition):** `NONE`, `BUDDHIST` (Phật giáo), `CHRISTIAN` (Công giáo).
- **Thứ tự ưu tiên ràng buộc (Constraint Precedence):**
  $$\text{Dị ứng (Allergies)} \ge \text{Loại trừ nguyên liệu (Exclusions)} > \text{Trường phái (Diet Pattern)} > \text{Truyền thống (Traditions)}$$
- **Quy tắc an toàn:**
  - Việc bật/tắt hoặc thay đổi quy tắc truyền thống tôn giáo **không bao giờ** làm suy giảm hay vô hiệu hóa danh sách dị ứng và nguyên liệu loại trừ của người dùng.

### BL-03: Hồ sơ sức khỏe & Tính toán chỉ số thể chất (Health Profile & Metrics)
- **Thuộc tính đầu vào:** Tuổi, Giới tính sinh học (`MALE`, `FEMALE`), Chiều cao (cm), Cân nặng (kg), Mức độ vận động (`ActivityLevel`).
- **Chỉ số tính toán:** BMI, BMR, TDEE được tính theo công thức chuẩn khoa học (Mifflin-St Jeor / Harris-Benedict) và đảm bảo tính tất định (`deterministic`).
- **Bảo mật:** Tuyệt đối không đưa dữ liệu sức khỏe cá nhân nhạy cảm vào log ứng dụng.

### BL-04: Danh mục chuẩn & Phân loại nguyên liệu (Ingredient Catalog & Normalization)
- **Cây danh mục (Category Tree):**
  - Gồm 3 loại: `FOOD_TYPE`, `RECIPE_GROUP`, `CONTENT_TOPIC`. Giới hạn độ sâu tối đa 2 cấp.
  - Khi xóa danh mục đang có nội dung liên kết, bắt buộc phải chọn danh mục thay thế (`replacementCategoryId`) trong cùng giao dịch.
- **Chuẩn hóa nguyên liệu (Ingredient Normalization):**
  - Khử dấu tiếng Việt, chuyển chữ thường, đối chiếu qua danh sách bí danh (`alias lookup`).
  - Nếu kết quả tìm kiếm mơ hồ (`ambiguous match`), trả về danh sách ứng viên gợi ý, không tự động chọn.
  - Món ăn có chứa nguyên liệu chưa được chuẩn hóa (`unknown ingredient`) sẽ bị đánh dấu `mealPlannerEligible = false` và không được đưa vào gợi ý thực đơn tuần.

### BL-05: Quản lý Công thức & Dinh dưỡng chế biến (Recipe Content & Cooking Nutrition)
- **Vòng đời nội dung (Content Lifecycle):**
  - Các loại bài viết: `RECIPE`, `BLOG`, `VIDEO`.
  - Bài viết của Member phải qua hàng đợi duyệt (`PENDING_REVIEW`). Bài viết của Contributor được xuất bản tự động (`PUBLISHED`) nếu bộ lọc an toàn không cảnh báo.
  - Khi sửa bài viết đã `PUBLISHED`, hệ thống tạo phiên bản sửa đổi mới (`Post Revision`); bản cũ vẫn hiển thị công khai cho đến khi bản mới được duyệt.
- **Tính toán dinh dưỡng theo cách chế biến (Cooking-Aware Nutrition):**
  - Công thức tính: Đổi đơn vị $\to$ Định lượng phần ăn được $\to$ Áp dinh dưỡng gốc $\to$ Áp hệ số giữ lại/nở/hao hụt nhiệt (retention/yield factors) $\to$ Dinh dưỡng tổng và phân bổ theo khẩu phần (`servings`).
  - Minh bạch nhãn nguồn gốc: `CANONICAL_CALCULATED`, `AI_ESTIMATED`, `USER_PROVIDED`, hoặc `VERIFIED_OVERRIDE`.
  - Giá trị dinh dưỡng khuyết thiếu không được tự ý gán bằng 0 mà phải giữ cờ chưa rõ dữ liệu (`incomplete data coverage`).

### BL-06: Quy trình kiểm duyệt & Báo cáo vi phạm (Moderation & Reporting Lifecycle)
- **Phân loại rủi ro (Risk Tiering):**
  - Cờ cảnh báo nguy cơ thấp/trung bình: Giữ nguyên bài viết công khai, chuyển hàng đợi hậu kiểm.
  - Cờ cảnh báo nguy cơ cao (spam nặng, nội dung y tế gây hại): Lập tức chuyển trạng thái `QUARANTINED`, ẩn khỏi toàn bộ tìm kiếm công khai, chờ Admin xử lý.
- **Báo cáo từ cộng đồng (User Reports):**
  - 1 người dùng chỉ có 1 báo cáo active trên 1 đối tượng.
  - Chỉ tính số người báo cáo phân biệt (`distinct reporters`). Khi có $\ge 5$ người báo cáo khác nhau, đối tượng được ưu tiên cao (`HIGH`), nhưng không tự động kết luận vi phạm nếu chưa có quyết định của Admin.
- **Khóa tài khoản (Ban/Unban):**
  - Khi tài khoản bị `BAN`, mọi bài viết và bình luận bị ẩn với lý do `USER_BANNED`.
  - Khi `UNBAN`, hệ thống chỉ khôi phục các nội dung bị ẩn thuần túy do `USER_BANNED`; nội dung bị ẩn vì lý do vi phạm trước đó vẫn giữ nguyên trạng thái ẩn.

### BL-07: Lịch thực hành ăn chay định kỳ (Periodic Diet Schedules)
- **Chế độ thực hành:** `PERMANENT` (trường chay) hoặc `PERIODIC` (chay kỳ).
- **Quy tắc ngày:** Danh sách ngày ăn chay định kỳ được lưu trữ định dạng `date-only` theo múi giờ `Asia/Ho_Chi_Minh`.
- **Tương thích kế hoạch ăn:** Vào những ngày ăn chay định kỳ, toàn bộ quy tắc ăn chay cứng sẽ được kích hoạt áp dụng cho Meal Planner và Recommendation.

### BL-08: Hạn mức lưu trữ & Thu thập sự kiện hành vi (Storage Quotas & Ingestion)
- **Hạn mức lưu trữ (Media Storage Quota):**
  - Thực hiện cấp phát 2 bước: Giữ chỗ dung lượng (`Atomic Reservation`) trước khi upload $\to$ Cam kết dung lượng thực tế (`Commit`) sau khi tải lên Cloudinary thành công.
  - Hủy bỏ, thất bại hoặc hết hạn sẽ tự động giải phóng dung lượng dự phòng. Dung lượng người dùng chỉ giảm sau khi xóa file thành công.
- **Sự kiện hành vi (Behavior Events):**
  - Chỉ thu thập sự kiện khi người dùng bật đồng thuận (`personalization consent = true`).
  - Danh mục sự kiện: `SEARCH`, `VIEW_RECIPE`, `BOOKMARK`, `RATE`, `CHAT_TOPIC`, `ACCEPT_MEAL`, `SWAP_MEAL`, `REJECT_MEAL`.
  - Không lưu prompt chat thô vào sự kiện, chỉ lưu mã chủ đề chuẩn hóa (`CHAT_TOPIC` code).
  - Dữ liệu Guest không được dùng để cá nhân hóa cho người khác. Người dùng có quyền tắt và xóa toàn bộ lịch sử hành vi.

### BL-09: Cổng trợ lý AI Dinh dưỡng & Món ăn tùy chỉnh (AI Chat & Custom Meals)
- **Cổng trợ lý AI (AI Chat Gateway):**
  - Tích hợp qua lớp trừu tượng `AiProvider` với cơ chế dự phòng an toàn (Fake/Local provider) khi mất kết nối.
  - Giao tiếp streaming SSE (`message_start`, `content_delta`, `message_complete`, `quota`, `error`).
  - **Trừ hạn ngạch (Quota Deduction):** Chỉ trừ lượt hỏi khi phản hồi hoàn thành trọn vẹn (`message_complete`). Không trừ lượt khi lỗi kết nối hoặc retry nội bộ.
  - Mọi phản hồi AI bắt buộc đi kèm Tuyên bố miễn trừ trách nhiệm y tế (`Medical Disclaimer`).
- **Món ăn tùy chỉnh (Custom Meals):**
  - Món do người dùng tự tạo là hoàn toàn riêng tư (`PRIVATE`), không xuất hiện trên feed công khai.
  - Thẻ người dùng tạo (ví dụ `shopee`) chỉ là trường văn bản (`metadata`), không cấu thành tích hợp với nền tảng mua sắm bên thứ ba.
  - Xóa món ăn tùy chỉnh đang có trong kế hoạch ăn phải áp dụng cơ chế bảo toàn (chặn xóa hoặc giữ bản chụp snapshot), không làm lỗi kế hoạch ăn đã tạo.

### BL-10: Cảnh báo tương thích & Giới hạn khẩu phần (Meal Portion & Compatibility Rules)
- **Phạm vi phân tích (Analysis Scopes):** Trong cùng món (`SAME_DISH`), Trong cùng bữa (`SAME_MEAL`), và Trong cùng ngày (`SAME_DAY`).
- **Phân loại xử lý:**
  - **Ràng buộc cứng:** Chặn ngay nếu vi phạm tiêu chí dị ứng hoặc trường phái ăn chay.
  - **Cảnh báo khoa học:** Tương tác kỵ nhau theo kinh nghiệm dân gian hoặc vượt ngưỡng khuyến nghị vi chất (RDA/UL) sẽ hiển thị dưới dạng cảnh báo mềm có trích dẫn khoa học để người dùng cân nhắc, không chặn cứng thao tác.

### BL-11: Tương tác cộng đồng & Chương trình ăn nhiều tuần (Community & Multi-week Plans)
- **Tương tác cộng đồng (Interactions):**
  - Bình luận chỉ trên bài viết `PUBLISHED`, phân cấp tối đa 1 cấp reply. Xóa bình luận có reply sẽ hiển thị thông báo thay thế, không xóa đứt mạch hội thoại.
  - Đánh giá sao (`Rating`) từ 1 đến 5 sao theo 2 tiêu chí `taste` và `difficulty` chỉ áp dụng cho `RECIPE`. Server tính toán điểm trung bình từ các bản ghi active.
  - `Bookmark` chỉ áp dụng cho `RECIPE` và `VIDEO`.
- **Chương trình ăn nhiều tuần (Multi-week Programs):**
  - Mở rộng từ Kế hoạch tuần, lưu bản chụp ổn định (`snapshots`) theo từng tuần để việc chỉnh sửa công thức sau này không làm biến đổi lịch sử ăn uống đã xác nhận.

### BL-12: Quản lý Kho nguyên liệu, Nhận diện Tủ lạnh & Hóa đơn (Pantry, Vision & Receipts)
- **Kho nguyên liệu (Pantry):**
  - Quản lý số lượng, đơn vị, hạn sử dụng quan sát được và cập nhật qua sổ cái điều chỉnh (`ledger`), chống trừ âm.
  - Ngày hết hạn là quan sát của người dùng, hệ thống không xác thực an toàn vệ sinh thực phẩm.
- **Nhận diện Tủ lạnh (Multi-image Fridge Vision):**
  - Tiếp nhận nhiều ảnh chụp tủ lạnh, khử trùng lặp nguyên liệu giữa các góc chụp nhưng vẫn giữ tham chiếu ảnh gốc.
  - Trả về danh sách ứng viên đề xuất (tên, số lượng ước tính, độ tươi quan sát, độ tin cậy).
  - **Quy tắc an toàn:** Kết quả chỉ là đề xuất; chỉ cập nhật kho đồ ăn sau khi người dùng bấm xác nhận (`User Confirmation Required`).
- **Bóc tách Hóa đơn & Bù đắp mua sắm (Receipts & Shopping Gaps):**
  - Trích xuất ứng viên hàng hóa từ hóa đơn; chỉ cộng vào Pantry sau khi người dùng duyệt.
  - Danh sách mua sắm (`Shopping List`) tự động bù trừ:
    $$\text{Cần mua} = \max\left(0, \text{Định lượng công thức yêu cầu} - \text{Tồn kho trong Pantry}\right)$$

### BL-13: Quy tắc ưu tiên ràng buộc & Lưu vết hệ thống (Precedence & Audit Trail)
- **Tính ưu tiên:** Quy chuẩn an toàn sinh mạng (dị ứng, ngộ độc, bài trừ nguyên liệu) luôn đè bẹp mọi yếu tố hành vi, sở thích hay thuật toán xếp hạng.
- **Lưu vết kiểm toán:** Mọi thao tác quản trị, phê duyệt/thu hồi quyền Contributor, quyết định kiểm duyệt, và điều chỉnh hạn ngạch đều phải lưu nhật ký kiểm toán không thể sửa đổi (`immutable audit log`).

### BL-14: Thẩm định Tạo tác AI bởi Contributor (AI Verification)
- **Quy trình thẩm định:**
  - Kết quả tư vấn AI, tính dinh dưỡng công thức, nhận diện tủ lạnh hay hóa đơn khi chia sẻ sẽ tạo thành Tạo tác AI bất biến (`Immutable AI Artifact`).
  - Bất kỳ Contributor nào đã được duyệt (không phân biệt căn cứ duyệt) đều có quyền đánh giá, thẩm định tạo tác này.
  - Nghiêm cấm hành vi tự thẩm định (`Self-verification`): Người tạo/chia sẻ tạo tác không được tự thẩm định sản phẩm của chính mình.
  - Thẩm định của Contributor mang tính xác thực nội dung, **tuyệt đối không tự động đưa dữ liệu này thành tri thức thực phẩm chuẩn trong cơ sở dữ liệu**.

### BL-15: Tính bất biến của Tạo tác AI & Ranh giới nhà cung cấp (AI Immutability & Provider Boundaries)
- Bản ghi phản hồi gốc của AI là bất biến (`immutable`). Mọi chỉnh sửa của Contributor hoặc Admin được ghi nhận dưới dạng lớp bổ sung/phiên bản sửa đổi (`correction version`), không xóa đè bản gốc.
- Độc lập nhà cung cấp: Hệ thống không để cấu trúc dữ liệu thô của bên thứ ba (OpenAI SDK/Responses API) lộ ra ngoài tầng Domain hoặc API Contract nội bộ.

### BL-16: Địa điểm & Nhà hàng chay lân cận (Restaurants & Maps Integration)
- Tích hợp thông qua bộ chuyển đổi `MapsProvider`.
- Tìm kiếm dựa trên tọa độ vị trí được người dùng cho phép, giới hạn theo bán kính.
- Bắt buộc áp dụng bộ lọc trường phái ăn chay trước khi sắp xếp theo khoảng cách.
- Không lưu trữ lịch sử vị trí địa lý liên tục của người dùng nhằm đảm bảo quyền riêng tư. Địa điểm do thành viên đóng góp phải qua Admin phê duyệt.

### BL-17: Thông báo sự kiện trong ứng dụng (In-app Event Notifications)
- Tạo thông báo có tính chất lặp lại an toàn (`idempotent notifications`) dựa trên mã chống trùng lặp (`dedupe_key`).
- Danh mục sự kiện: Kết quả duyệt bài/video, kết quả duyệt đơn Contributor, cảnh báo dung lượng lưu trữ, kết quả xử lý báo cáo vi phạm.
- Nội dung thông báo chỉ chứa dữ liệu tóm tắt an toàn (`allowlist payload`), tuyệt đối không làm lộ dữ liệu PII, bệnh án hay hóa đơn cá nhân của người khác.

### BL-18: Quản trị & Giám sát AI của Quản trị viên (Admin AI Governance)
- Chuẩn hóa nhật ký AI: Provider/Model, Template version, Mã tương quan (Correlation ID), Độ trễ (latency), Token/Chi phí ước tính, Trạng thái lỗi và Kết quả kiểm duyệt an toàn.
- Làm mờ/lọc bỏ (`redacted`) toàn bộ thông tin định danh cá nhân (PII), mật khẩu, hình ảnh hóa đơn trước khi đưa vào bảng theo dõi của Admin.
- Cung cấp công tắc ngắt khẩn cấp (`Feature Toggles`) cho từng năng lực AI với lý do kiểm toán, đảm bảo chuyển về cơ chế Fallback tất định khi dịch vụ bên thứ ba gặp sự cố.

---

## 3. BẢNG MA TRẬN RÀNG BUỘC THEO PHÂN HỆ (SUMMARY MATRIX)

| Mã BL | Phân hệ | Mức độ ràng buộc | Cơ chế thực thi chính |
|:---|:---|:---|:---|
| **BL-01** | Xác thực & Quyền hạn | Bắt buộc (Hard) | Quyền Contributor bình đẳng, Admin phê duyệt thủ công, Token Rotation |
| **BL-02** | Chế độ ăn & Loại trừ | Bắt buộc (Hard) | Dị ứng & Loại trừ nguyên liệu đè bẹp mọi quy tắc tôn giáo và hành vi |
| **BL-03** | Hồ sơ thể chất | Bắt buộc (Hard) | Công thức tất định, không ghi nhận thông tin PII nhạy cảm vào log |
| **BL-04** | Danh mục & Nguyên liệu | Bắt buộc (Hard) | Chuẩn hóa không dấu, món có nguyên liệu lạ bị loại khỏi Meal Planner |
| **BL-05** | Công thức & Dinh dưỡng | Bắt buộc (Hard) | Bản sửa đổi (Revision) kiểm duyệt; dinh dưỡng nấu nướng gắn nhãn xuất xứ |
| **BL-06** | Kiểm duyệt & Báo cáo | Bắt buộc (Hard) | Nguy cơ cao vào Quarantine; $\ge 5$ báo cáo nâng priority; không xóa cứng |
| **BL-07** | Lịch ăn chay định kỳ | Bắt buộc (Hard) | Lưu `date-only` theo Asia/Ho_Chi_Minh; tự động kích hoạt lọc ngày chay |
| **BL-08** | Dung lượng & Hành vi | Bắt buộc (Hard) | Cấp phát quota 2 bước; sự kiện hành vi yêu cầu consent và xóa được |
| **BL-09** | Chatbot & Món cá nhân | Bắt buộc (Hard) | Chỉ trừ quota khi hoàn tất; món cá nhân hoàn toàn private; tag là metadata |
| **BL-10** | Phân tích bữa ăn | Hỗn hợp (Hard/Soft) | Chặn nếu phạm dị ứng; cảnh báo mềm nếu vượt RDA/UL kèm trích dẫn khoa học |
| **BL-11** | Cộng đồng & Lộ trình | Bắt buộc (Hard) | Điểm đánh giá tính từ server; snapshot lộ trình ăn nhiều tuần |
| **BL-12** | Tủ lạnh, Hóa đơn, Kho | Bắt buộc (Hard) | AI chỉ đề xuất ứng viên; bắt buộc người dùng xác nhận mới vào Pantry |
| **BL-13** | Thứ tự ưu tiên & Audit | Bắt buộc (Hard) | An toàn tính mạng là ưu tiên số 1; nhật ký thao tác bất biến |
| **BL-14** | Thẩm định tạo tác AI | Bắt buộc (Hard) | Mọi Contributor được duyệt đều có quyền; cấm tự thẩm định tạo tác của mình |
| **BL-15** | Bất biến & Adapter AI | Bắt buộc (Hard) | Phản hồi AI bất biến; che giấu cấu trúc dữ liệu nhà cung cấp bên ngoài |
| **BL-16** | Nhà hàng & Bản đồ | Bắt buộc (Hard) | Lọc trường phái ăn trước khi sắp xếp khoảng cách; không lưu vị trí liên tục |
| **BL-17** | Thông báo nội bộ | Bắt buộc (Hard) | Chống lặp thông báo bằng `dedupe_key`; bảo vệ dữ liệu nhạy cảm trong payload |
| **BL-18** | Quản trị & Giám sát AI | Bắt buộc (Hard) | Che giấu PII trong log; công tắc ngắt khẩn cấp chuyển sang Fallback tất định |
