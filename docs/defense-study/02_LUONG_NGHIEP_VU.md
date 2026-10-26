# 2. Các luồng nghiệp vụ phải trình bày được

Đọc mỗi luồng theo **tác nhân → thao tác → quy tắc backend → kết quả → lỗi**. `READY` dưới đây phản ánh registry tại snapshot 21/10; trạng thái tích hợp web/mobile không phải lúc nào cũng giống nhau. Kiểm tra [Backend Integration](../../frontend/docs/BACKEND_INTEGRATION.md) trước ngày chấm.

## A. Định danh, quyền và nội dung

### L01. Đăng ký, đăng nhập, refresh, đăng xuất — `READY`

- **Ai:** Guest đăng ký/đăng nhập; user đăng xuất.
- **Luồng:** đăng ký tạo `MEMBER`; đăng nhập nhận access token và refresh session; access token hết hạn thì dùng refresh token rotation; logout thu hồi phiên hiện tại hoặc toàn bộ thiết bị.
- **Quy tắc:** refresh token cũ bị dùng lại có thể thu hồi cả token family; role trong token phải khớp DB. Ý định Contributor khi đăng ký chỉ tạo hồ sơ/đơn chờ.
- **Khi lỗi:** `INVALID_CREDENTIALS`, `EMAIL_ALREADY_EXISTS`, `INVALID_REFRESH_TOKEN`, `STALE_ACCESS_TOKEN`; client đưa user về đăng nhập, không tự gán quyền.
- **Mở code:** [AuthService](../../backend/src/modules/auth/auth.service.ts), [authentication middleware](../../backend/src/modules/auth/authentication.middleware.ts), [web auth refresh](../../frontend/src/lib/auth-refresh.ts).

### L02. Hồ sơ sức khỏe, chế độ ăn và lịch chay — `READY`

- **Ai:** Member/Contributor/Admin quản lý hồ sơ của mình.
- **Luồng:** nhập số đo/mục tiêu → chọn diet pattern/tradition → xem rule mặc định → xác nhận rule bật → lưu dị ứng, nguyên liệu loại trừ, lịch thực hành.
- **Quy tắc:** backend lưu rule/version và tạo constraints cho ngày cần xét. Dị ứng và loại trừ không bị tradition toggle làm yếu đi. Số đo dùng để tính mục tiêu; đây là hướng dẫn dinh dưỡng, không phải chẩn đoán.
- **Khi lỗi:** thiếu dữ liệu cần yêu cầu bổ sung; lịch định kỳ không rõ phải xác nhận, không tự suy đoán ngày ăn chay.
- **Mở code:** [ProfileService](../../backend/src/modules/profile/profile.service.ts), [search constraints](../../backend/src/modules/content/search-constraints.ts), [diet query web](../../frontend/src/features/diet-preferences/queries/diet.queries.ts).

### L03. Tạo công thức/bài viết/video và duyệt xuất bản — `READY` backend

- **Ai:** Member/Contributor/Admin tạo nội dung; Admin duyệt revision.
- **Luồng:** tạo `DRAFT` → chỉnh nội dung/ ảnh/video → submit đúng revision → backend gắn moderation signals → Admin approve/reject có lý do → revision được duyệt mới public. Sửa bài đã public sinh draft revision mới; bản duyệt trước còn hiển thị đến lúc bản mới được duyệt.
- **Quy tắc:** `ModeratedPublicationPolicy` hiện đưa mọi submit vào `PENDING_REVIEW`, kể cả Contributor. AI flag không tự publish/reject/xóa. Video cần media hợp lệ trước submit.
- **Khi lỗi:** `CONTENT_STATE_CONFLICT`, `CONTENT_VERSION_CONFLICT`, `INVALID_MEDIA_REFERENCE`, không cho tự duyệt theo quy tắc review.
- **Mở code:** [publication policy](../../backend/src/modules/content/content-publication.policy.ts), [ContentService](../../backend/src/modules/content/content.service.ts), [ModerationService](../../backend/src/modules/moderation/moderation.service.ts).

### L04. Bình luận, vote/rating/bookmark và báo cáo — `READY`

- **Ai:** user đã đăng nhập tương tác với nội dung đủ điều kiện; Admin xử lý report.
- **Luồng:** chỉ bài public mới nhận tương tác phù hợp → ghi comment/vote/rating/bookmark theo quyền → report hoặc AI flag thành tín hiệu → Admin xem bằng chứng, quyết định có lý do/audit.
- **Quy tắc:** chống bình chọn trùng/rate limit ở backend; report không xóa cứng nội dung. Rating chỉ cho recipe, bookmark cho loại nội dung backend cho phép.
- **Khi lỗi:** bài không public, user không sở hữu comment, spam/rate limit hoặc báo cáo trùng thì backend từ chối; UI không tuyên bố đã ghi thành công khi request lỗi.
- **Mở code:** [CommunityService](../../backend/src/modules/community/community.service.ts), [ModerationService](../../backend/src/modules/moderation/moderation.service.ts).

### L05. Ứng tuyển Contributor và thẩm quyền — `READY`

- **Ai:** Member nộp đơn; Admin duyệt/từ chối/thu hồi.
- **Luồng:** đăng ký có intent hoặc nộp ở hồ sơ → đơn `PENDING` → Admin xem claim/evidence → duyệt với `approvalBasis` hoặc từ chối kèm lý do → role backend đổi thành `CONTRIBUTOR` khi được duyệt.
- **Quy tắc:** một đơn pending; `ADMIN_INVITED` chỉ qua đường Admin; từ chối có thời gian nộp lại 30 ngày; . `approvalBasis` mô tả căn cứ xét duyệt, không chia cấp quyền.
- **Khi lỗi:** `CONTRIBUTOR_APPLICATION_PENDING`, `CONTRIBUTOR_REAPPLY_NOT_ALLOWED`, `SELF_APPROVAL_FORBIDDEN`, `CONTRIBUTOR_APPROVAL_BASIS_INVALID`.
- **Mở code:** [state machine](../../backend/src/modules/contributors/contributor-application.state-machine.ts), [ContributorService](../../backend/src/modules/contributors/contributor.service.ts).

## B. Tìm món, dinh dưỡng và kế hoạch ăn

### L06. Tìm kiếm, gợi ý cá nhân và lọc an toàn — `READY`

- **Ai:** Guest xem nội dung public; user có hồ sơ nhận kết quả phù hợp và recommendation khi đã consent.
- **Luồng:** query + profile/date → backend tạo hard constraints → loại món không hợp lệ → xếp hạng các món còn lại bằng relevance/behavior → trả lý do gợi ý.
- **Quy tắc:** dữ liệu hành vi chỉ ghi khi có personalization consent; ranking không được đưa món có allergen hoặc vi phạm diet quay lại. Guest không được cá nhân hóa bằng lịch sử của người khác.
- **Khi lỗi:** hết consent thì không ghi sự kiện; không đủ món phù hợp thì hiển thị rỗng/giải thích, không nới ràng buộc cứng để lấp trang.
- **Mở code:** [search constraints](../../backend/src/modules/content/search-constraints.ts), [RecommendationService](../../backend/src/modules/recommendations/recommendation.service.ts).

### L07. Dữ liệu thực phẩm và tính dinh dưỡng công thức — `READY` backend

- **Ai:** Admin quản lý dữ liệu tham chiếu; user xem nutrition estimate.
- **Luồng:** nguyên liệu/alias chuẩn → quy đổi đơn vị và khối lượng ăn được → nutrient basis → retention/yield theo bước nấu → chia servings → trả giá trị, độ phủ, assumptions, confidence, source/version.
- **Quy tắc:** dữ liệu canonical giữ provenance; AI chỉ đề xuất/ước lượng có nhãn, không ghi đè tự động. Missing nutrient khác 0. Ingredient guideline và nutrient intake limit là hai loại quy tắc khác nhau.
- **Khi lỗi:** thiếu conversion/ingredient thì đánh dấu chưa rõ hoặc giảm confidence; không bịa giá trị đủ để kết luận an toàn.
- **Mở code:** [FoodDataService](../../backend/src/modules/food-data/food-data.service.ts), [RecipeNutritionService](../../backend/src/modules/recipe-nutrition/recipe-nutrition.service.ts), [nguồn dữ liệu](../FOOD_DATA_SOURCES.md).

### L08. Thực đơn tuần và phân tích bữa ăn — `READY`

- **Ai:** user có hồ sơ sức khỏe/diet.
- **Luồng:** nhập tuần/mục tiêu → backend tính target từ TDEE và goal factor → tạo blueprint 7 ngày × 3 bữa → lọc hard constraints cho từng ngày → chọn/xếp hạng món → lưu plan snapshot → user đổi món/thêm món cá nhân → analysis trả cảnh báo có provenance.
- **Quy tắc:** 21 **slot** được tạo/đánh dấu; khi không có candidate hợp lệ, slot là `UNFILLED` kèm reason, không hứa luôn có 21 món. Macro ước tính gồm protein, fiber, fat và carbs; số liệu theo servings. Dị ứng/diet chặn, cảnh báo dinh dưỡng có thể là advisory.
- **Khi lỗi:** `HEALTH_PROFILE_INCOMPLETE`, `MEAL_PLAN_VERSION_CONFLICT`, `MEAL_PLAN_IDEMPOTENCY_CONFLICT`, `MEAL_ANALYSIS_STALE`; phải tải/đánh giá lại plan mới, không hiển thị analysis cũ như hiện hành.
- **Mở code:** [MealPlanService](../../backend/src/modules/meal-plans/meal-plan.service.ts), [MealAnalysisService](../../backend/src/modules/meal-analysis/meal-analysis.service.ts), [day grid web](../../frontend/src/features/meal-plan/components/day-grid.tsx).

### L09. Món cá nhân và chương trình nhiều tuần — `READY` backend

- **Ai:** user tạo món riêng, lên chương trình nhiều tuần.
- **Luồng:** tạo custom meal private có ingredient/photo/tag → dùng nó hoặc recipe trong plan → tạo chương trình gồm các tuần/snapshot → chọn phương án và xác nhận theo state.
- **Quy tắc:** tag `shopee` chỉ là metadata. Xóa món đang được plan tham chiếu phải theo chính sách bảo toàn. Chương trình đã xác nhận không được sửa tùy tiện; sửa tuần có thể làm analysis về sau stale.
- **Khi lỗi:** thiếu ingredient/không quy đổi được làm estimate thiếu coverage; version/state conflict yêu cầu tải lại.
- **Mở code:** [CustomMealService](../../backend/src/modules/custom-meals/custom-meal.service.ts), [MealProgramService](../../backend/src/modules/meal-programs/meal-program.service.ts).

## C. Kho, hình ảnh và mua sắm

### L10. Upload media và quota — `READY`

- **Ai:** user upload ảnh/video cho nội dung, Pantry, quét ảnh.
- **Luồng:** validate file → reserve bytes → upload tới Cloudinary qua thông tin ký → commit actual asset/bytes; lỗi/hủy thì release hoặc reservation hết hạn.
- **Quy tắc:** ownership, MIME, size, account quota được backend kiểm tra; asset đã commit vẫn tính dung lượng dù một job bị cancel. Xóa asset còn được dùng có thể bị chặn.
- **Khi lỗi:** quota hết, file không hợp lệ, mất phản hồi commit hoặc asset đang được tham chiếu; kiểm tra reservation trước khi upload lại để tránh bản trùng/quota rò rỉ.
- **Mở code:** [StorageService](../../backend/src/modules/storage/storage.service.ts), [web upload workflow](../../frontend/src/features/storage/api/storage-upload.ts), [mobile upload workflow](../../mobile/src/features/storage/api/upload-workflow.ts).

### L11. Pantry và sổ cái điều chỉnh — `READY`

- **Ai:** owner tạo/xem/sửa nguyên liệu, consume/restore/adjust, merge bản ghi trùng.
- **Luồng:** tạo item confirmed hoặc nhận từ scan confirm → mọi thay đổi số lượng đi qua adjustment ledger → merge phải preview tương thích và xác nhận → shopping/plan đọc tồn kho hợp lệ.
- **Quy tắc:** owner-only; version/idempotency cho mutation; không trừ âm; ngày hết hạn là quan sát của user. Capacity đếm mọi item chưa xóa, kể cả lượng 0.
- **Khi lỗi:** `PANTRY_VERSION_CONFLICT`, `PANTRY_UNIT_CONVERSION_UNAVAILABLE`, `PANTRY_MERGE_CONFLICT`; giải thích item/đơn vị gây lỗi, không âm thầm quy đổi đoán.
- **Mở code:** [PantryService](../../backend/src/modules/pantry/pantry.service.ts), [EntitlementService](../../backend/src/modules/entitlements/entitlement.service.ts).

### L12. Quét tủ lạnh nhiều ảnh — `IN_PROGRESS`

- **Ai:** user đã đăng nhập và dùng capability được bật trong môi trường phù hợp.
- **Luồng:** commit tối đa 6 `FRIDGE_IMAGE` → tạo job async → provider xử lý từng ảnh → dedupe ảnh theo ETag nếu có và gộp ingredient candidate kèm evidence/uncertainty → user sửa/reject/chọn → confirm một diff vào Pantry.
- **Quy tắc:** create/get/retry/add-images/edit/cancel không cập nhật Pantry. Retry chỉ ảnh lỗi; thêm ảnh mới không được ghi đè candidate đã user sửa hoặc từ chối. Không khẳng định ảnh chứng minh thực phẩm an toàn.
- **Khi lỗi:** `RECOGNITION_IMAGE_LIMIT_EXCEEDED`, `RECOGNITION_STATE_CONFLICT`, `RECOGNITION_VERSION_CONFLICT`, provider unavailable; giữ job để xem/tải lại và giải thích partial failure.
- **Mở code:** [RecognitionService](../../backend/src/modules/ingredient-recognition/ingredient-recognition.service.ts), [merge policy](../../backend/src/modules/ingredient-recognition/ingredient-recognition.merge.ts), [phase status](../../backend/docs/IMPLEMENTATION_PHASES.md).

### L13. Quét hóa đơn và danh sách thiếu mua — job `IN_PROGRESS`, shopping preview `READY`

- **Ai:** user đã đăng nhập.
- **Luồng hóa đơn:** commit tối đa 4 `RECEIPT_IMAGE` → job tách metadata/dòng hàng → gộp dòng giống nhau **giữa các ảnh** mà không cộng đôi; dòng lặp trong **cùng ảnh** có thể là hai dòng mua thật → user sửa quantity/unit/giá hoặc reject → confirm mới cộng Pantry.
- **Luồng shopping:** user chọn recipe/custom meal và servings → backend quy đổi tổng cần dùng → trừ tồn kho đã xác nhận/quy đổi được → trả required/available/missing và `unresolvedItems` riêng.
- **Khi lỗi:** `RECEIPT_IMAGE_LIMIT_EXCEEDED`, `RECEIPT_STATE_CONFLICT`, `RECEIPT_VERSION_CONFLICT`, conversion chưa có; không đoán rằng hóa đơn cũ đồng nghĩa nguyên liệu vẫn còn trong kho.
- **Mở code:** [ReceiptService](../../backend/src/modules/receipts/receipt.service.ts), [receipt dedupe](../../backend/src/modules/receipts/receipt.dedup.ts), [Integration registry](../../frontend/docs/BACKEND_INTEGRATION.md).

## D. AI, địa điểm, thông báo và quyền sử dụng

### L14. Chat AI, chia sẻ tạo tác và thẩm định — `READY` với giới hạn provider

- **Ai:** Guest chat hạn chế; user có phiên riêng; Contributor đã duyệt hoặc Admin thẩm định tạo tác đủ điều kiện.
- **Luồng:** gửi câu hỏi → backend kiểm tra identity/quota/context → stream SSE → chỉ phản hồi hoàn tất thành công mới tính lượt tương ứng → user có thể lưu/chia sẻ tạo tác theo allowlist → Contributor khác tạo verification có evidence/version → Admin có thể override/revoke kèm audit.
- **Quy tắc:** câu trả lời AI là tư vấn, không sửa health/diet/canonical facts; cấm self-verification. Verification là ý kiến có vết, không biến estimate thành sự thật khoa học.
- **Khi lỗi:** provider fail/fallback không được tính như một trả lời thành công để trừ quota; artifact không đủ điều kiện hoặc owner tự verify bị từ chối (`SELF_VERIFICATION_FORBIDDEN`).
- **Mở code:** [ChatService](../../backend/src/modules/chat/chat.service.ts), [AiReviewService](../../backend/src/modules/ai-review/ai-review.service.ts).

### L15. Nhà hàng và thông báo — `READY`

- **Nhà hàng:** location do user nhập hoặc cấp consent → provider adapter/internal records → lọc diet/allergy theo dữ liệu đã được rà soát → xếp hạng khoảng cách/relevance. Nhãn provider bên ngoài tự nó không chứng minh an toàn dị ứng; địa điểm do user đóng góp cần Admin duyệt.
- **Thông báo:** domain event → idempotent database dispatch → owner xem danh sách/unread/mark read. Payload chỉ có thông tin an toàn; hiện là in-app, không hứa push/realtime/email.
- **Mở code:** [RestaurantService](../../backend/src/modules/restaurants/restaurant.service.ts), [NotificationService](../../backend/src/modules/notifications/notification.service.ts).

### L16. Mua gói payOS và quyền sử dụng — backend contract `READY`, rollout có giới hạn

- **Ai:** user đã đăng nhập chọn gói một lần cho chat credit, lượt scan hoặc sức chứa Pantry.
- **Luồng:** backend chụp giá/quyền lợi + tạo order idempotent → payOS checkout → webhook/query ký hợp lệ và đúng số tiền → transaction chỉ grant một lần → owner xem order/balance. Return URL chỉ để hiển thị; reconcile có cooldown.
- **Quy tắc:** gói không tăng media storage, không cấp role và không bỏ qua diet/confirmation. Free daily chat dùng trước; job scan có kết quả một phần thành công có thể tính một lượt, total failure release theo policy.
- **Khi lỗi:** thiếu merchant credentials thì checkout tắt; underpaid còn pending; duplicate callback không cộng hai lần; payOS development vẫn chuyển tiền thật.
- **Mở code:** [BillingService](../../backend/src/modules/billing/billing.service.ts), [EntitlementService](../../backend/src/modules/entitlements/entitlement.service.ts), [SRS FR-17](../SRS.md).
