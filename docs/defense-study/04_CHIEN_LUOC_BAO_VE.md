# 4. Chiến lược học và demo trước hai giảng viên

## Định vị project trong 20 giây

“Đây là hệ thống hỗ trợ ăn chay gồm web, mobile và backend. Điểm cốt lõi là các ràng buộc ăn kiêng được kiểm tra ở backend; nội dung công khai cần Admin duyệt; AI chỉ đề xuất, người dùng xác nhận mới ghi Pantry. Em sẽ demo một luồng xuyên suốt từ hồ sơ ăn kiêng đến món ăn và thực đơn, sau đó cho thấy một quyết định review và một trường hợp lỗi.”

**Không học theo danh sách màn hình.** Học theo quyết định nghiệp vụ: ai được làm, dữ liệu vào, backend chặn gì, dữ liệu sau thao tác, cách xử lý lỗi. Có hai người hỏi, nên chuẩn bị cả câu về sản phẩm/nghiệp vụ và câu về source/transaction/API.

## Chọn ba mức demo

| Mức | Luồng | Vì sao chọn |
|---|---|---|
| Bắt buộc | Đăng nhập Member → hồ sơ/diet → tìm recipe phù hợp → tạo/xem meal plan → thêm/sửa Pantry | Liên kết nhiều domain `READY`, cho thấy backend lọc an toàn. |
| Chứng minh quyền | Member tạo draft và submit → Admin khác duyệt → public view; hoặc Member nộp đơn Contributor → Admin duyệt | Hội đồng thấy RBAC, version, audit và giới hạn quyền. |
| Nâng cao có điều kiện | Quét ảnh/hóa đơn trong dev runtime; AI chat/artifact; payOS order history | Demo khi provider/config/data đã kiểm tra trước; nói trạng thái `IN_PROGRESS` của scan và không chuyển tiền thật. |

Nếu thời gian chỉ 8 phút, hoàn thành hai mức đầu. Nếu được 12–15 phút, thêm scan nhưng phải công bố ngay giới hạn provider thật. Nếu giảng viên chọn một luồng khác, dùng [bản luồng](02_LUONG_NGHIEP_VU.md) để điều hướng theo actor và state, không lướt qua mọi tab.

## Kịch bản demo 10–12 phút

| Mốc | Thao tác trên máy | Câu cần nói | Bằng chứng nên mở khi bị hỏi |
|---|---|---|---|
| 0:00–1:00 | Mở trang chủ, nêu 4 role và sơ đồ | “Backend giữ quyền, hard constraints và transaction; UI chỉ thu nhận ý định.” | [SRS](../SRS.md), [backend app](../../backend/src/app.ts) |
| 1:00–3:00 | Đăng nhập Member, mở hồ sơ/diet, chỉ allergy/exclusion | “Lưu xong backend áp constraints cho tìm món và plan.” | [search constraints](../../backend/src/modules/content/search-constraints.ts) |
| 3:00–5:00 | Tìm recipe phù hợp và một món bị loại; mở nguồn dinh dưỡng | “Lọc trước ranking; thiếu nutrient là chưa biết.” | [RecommendationService](../../backend/src/modules/recommendations/recommendation.service.ts) |
| 5:00–7:00 | Generate meal plan, xem 21 slot; swap hoặc manual add | “Slot có thể UNFILLED khi không có món hợp lệ; target/macro đến từ backend.” | [MealPlanService](../../backend/src/modules/meal-plans/meal-plan.service.ts) |
| 7:00–9:00 | Tạo/adjust Pantry rồi xem shopping gap | “Chỉ tồn kho đã xác nhận và đơn vị quy đổi được mới được trừ.” | [PantryService](../../backend/src/modules/pantry/pantry.service.ts), [ReceiptService](../../backend/src/modules/receipts/receipt.service.ts) |
| 9:00–11:00 | Member submit draft; đổi sang Admin khác approve | “Revision mới vào hàng duyệt; self-review bị chặn.” | [publication policy](../../backend/src/modules/content/content-publication.policy.ts), [moderation repository](../../backend/src/modules/moderation/moderation.repository.ts) |
| 11:00–12:00 | Kết luận và giới hạn | “Scan còn kiểm chứng ảnh thật; payOS cần settlement server; mock/fixture không là thành công backend.” | [phase status](../../backend/docs/IMPLEMENTATION_PHASES.md) |

Lượt demo có thể bị vướng UI/cache hoặc dữ liệu seed. Chuẩn bị một tab OpenAPI/HTTP response để chỉ ra request, `error.code`, state và `requestId`. Khi UI hiển thị trái backend, nói rõ đó là gap frontend và dùng response backend để chứng minh rule server.

## Phương án ưu tiên Pantry, quét tủ lạnh và hóa đơn (cập nhật 25/10/2026)

Nếu ba chức năng này **bắt buộc phải show**, đổi trọng tâm từ meal plan/kiểm duyệt sang một câu chuyện: **nguyên liệu nhập tay + ảnh tủ lạnh + hàng vừa mua trên hóa đơn → người dùng rà soát → xác nhận → Pantry mới thay đổi → tính lại món còn thiếu**. Đăng nhập và chọn một recipe là bối cảnh ngắn; meal plan, Contributor, moderation và payOS chuyển sang phần hỏi đáp/dự phòng.

| Mốc (10–12 phút) | Thao tác trực tiếp | Điều cần chứng minh |
|---|---|---|
| 0:00–1:30 | Đăng nhập Member, mở `/pantry`, ghi số lượng ban đầu của 1–2 nguyên liệu và ledger. | Pantry là dữ liệu của owner; chỉnh tay có lịch sử/version. |
| 1:30–4:00 | `/pantry/scan`: upload 1 ảnh tủ lạnh, mở job đã xử lý nếu AI còn chạy; chỉ candidate, sửa một lượng/tên, bỏ một nhận dạng sai. Ghi Pantry **chưa đổi**; bấm xác nhận và reload Pantry. | AI tạo gợi ý có uncertainty; **confirm** là ranh giới ghi kho. |
| 4:00–7:00 | `/receipts/scan`: quét hóa đơn test có 2 thực phẩm và 1 món phi thực phẩm, đọc notice/excluded item; sửa một dòng, confirm các dòng được chọn; reload Pantry và xem diff. | Hóa đơn không tự cộng kho; sản phẩm phi thực phẩm bị loại nhưng user có quyền sửa phân loại trước confirm. |
| 7:00–9:00 | Mở shopping preview cho recipe đã chọn; so `required/available/missing` trước và sau khi xác nhận scan. | Chỉ lượng Pantry **confirmed**, quy đổi được mới giảm `missing`; `unresolvedItems` vẫn tách riêng. |
| 9:00–10:30 | Show một tình huống lỗi đã chuẩn bị: ảnh trùng/receipt trùng, ảnh provider lỗi, hoặc version conflict; nêu cách retry/refetch. | Không cộng đôi, không ghi âm thầm; lỗi có state và cách phục hồi. |
| 10:30–12:00 | Tóm tắt bằng sơ đồ `upload → job → review → confirm → Pantry → shopping`. | Phân biệt phần `READY` của Pantry/shopping với job scan `IN_PROGRESS`. |

**Chuẩn bị trước buổi chấm:** dùng database demo riêng và một Member riêng; ghi Pantry ban đầu, asset ID, job ID/URL, provider đang chạy, HTTP response và ảnh chụp cho từng mốc. Cloudinary cần credential upload thật; Compose mặc định tắt `VISION_ENABLED` và `RECEIPT_ENABLED`. Muốn minh họa AI trên ảnh thật phải bật provider OpenAI hợp lệ và kiểm tra trước bằng chính ảnh Việt Nam sẽ dùng. Nếu chỉ có fake provider, công bố đó là bài test state machine/confirm, không gọi là nhận dạng ảnh thật. Chuẩn bị một job `READY` chưa confirm cho mỗi loại để mở ngay khi live job chậm; nói rõ đó là job chuẩn bị trước. Không confirm các job dự phòng vào cùng Pantry sau khi đã confirm luồng live, tránh cộng trùng.

**Hóa đơn test nên có:** `Cà rốt 2 kg`, `Gạo lứt 1 kg`, `Nước rửa chén 1 chai` trên hóa đơn giả rõ chữ. `Nước rửa chén` dự kiến ở `excludedItems`; nếu AI phân loại sai, đó là cơ hội show bước sửa tay. Với hóa đơn trùng, tách **cùng ảnh/cùng hóa đơn** khỏi **một lần mua khác cùng tên sản phẩm**. Contract 25/10 có `reviewRequired`, `identityDecisionRequired`, `receiptReviewDecision` để user quyết định khi hai ảnh/đơn chỉ trùng một phần; không nói mọi hàng cùng tên đều bị gộp. Ghi nhận kết quả thực tế thay vì hứa AI đọc chính xác từng dòng.

**Đường lui khi provider lỗi:** mở job `FAILED`/`PARTIAL_FAILED`, trình bày retry ảnh lỗi và khả năng nhập Pantry thủ công; sau đó vẫn demo shopping preview `READY` bằng item đã xác nhận. Nếu upload Cloudinary hoặc provider không hoạt động, không giả lập thao tác thành công trên giao diện. Dùng ảnh/Network log của lần chạy trước và phân loại ca trực tiếp là `BLOCKED`. Checklist chi tiết cho ba chức năng nằm ở [L10–L13 của bộ test tay](06_KICH_BAN_TEST_TAY_16_LUONG.md).

## Chuẩn bị dữ liệu trước buổi chấm

- Một Guest session và ba tài khoản **riêng**: Member, Contributor đã duyệt, Admin. Nội dung do Admin tạo phải được một Admin khác duyệt nếu rule self-review áp dụng.
- Member có profile sức khỏe đủ trường, một diet pattern, ít nhất một allergy/exclusion và một lịch được xác nhận. Có món hợp lệ và món cố ý không phù hợp để chứng minh lọc.
- Ít nhất một recipe đã public với ingredient/macro/ảnh rõ, một draft mới để submit, một revision được duyệt cũ để giải thích sửa bản public.
- Pantry có item confirmed và adjustment history; meal plan cùng tuần, có số liệu slot và shopping preview dùng đơn vị quy đổi được. Có thêm một ca thiếu conversion để trả lời lỗi.
- Nếu demo scan: tách database development, asset đã commit, job trạng thái có thể xem, biết provider thực tế đang cấu hình. Giữ sẵn một ca `PARTIAL_FAILED` hoặc candidate cần sửa; không dùng dữ liệu fake như bằng chứng AI thật.
- Nếu mở trang billing: dùng catalog/order history hoặc checkout disabled; không bấm thanh toán thật trong buổi chấm nếu chưa chủ động chuẩn bị giao dịch.
- Ghi vào một tờ giấy các ID/URL cần mở, thứ tự tài khoản, đường dẫn demo và bản ghi backup. Không chép token, secret hay thông tin thanh toán lên slide.

## Lịch học 5 buổi, mỗi buổi 90–120 phút

| Buổi | Học gì | Bài luyện bắt buộc | Điều kiện qua buổi |
|---:|---|---|---|
| 1 | Sơ đồ, role, auth, Contributor, content/review | Vẽ 3 state machine; trả lời câu 1–7 và chỉ policy source | Giải thích được vì sao Contributor không tự publish/tự duyệt. |
| 2 | Diet, hard constraints, food data, recommendation | Chỉ code lọc trước ranking; kể 2 ca null vs zero; câu 8–17 | Giải thích được 21 slot, UNFILLED và analysis stale. |
| 3 | Storage, Pantry, scan, receipt, shopping gap | Vẽ reserve/commit và confirm; giả lập 3 lỗi ảnh; câu 18–28 | Nói đúng ranh giới duy nhất cập nhật Pantry và `IN_PROGRESS`. |
| 4 | Chat/AI artifact, restaurant, notifications, billing | Tập câu 29–38; diễn giải webhook idempotent và provider limit | Không nhầm payOS return với settlement, verification với canonical truth. |
| 5 | Chạy demo nguyên vẹn và phản biện | Hai lượt 10–12 phút, mỗi lượt 15 phút Q&A; một người hỏi nghiệp vụ, một người hỏi lỗi/source | Giữ demo trong thời gian, mỗi câu trả lời ≤60 giây rồi chỉ được file bằng chứng. |

Sau mỗi buổi, ghi 3 cột: “đã nói đúng”, “nói thiếu”, “source cần mở”. Ngày hôm sau chỉ ôn lại cột thiếu trước khi học mới. Đừng học thuộc 38 câu theo chữ; luyện chuyển một quy tắc sang tình huống khác.

## Chia vai hai giảng viên khi luyện phản biện

- **Giảng viên nghiệp vụ:** “vì sao cần chức năng?”, “user nào được phép?”, “AI có được quyết định không?”, “mua gói có tác dụng gì?”. Trả lời bằng tác nhân, rule, state và ranh giới an toàn.
- **Giảng viên kỹ thuật:** “code nằm đâu?”, “API lỗi nào?”, “nếu hai request đồng thời?”, “làm sao chống ghi trùng?”. Trả lời bằng service/repository, expectedVersion, idempotency, transaction, error envelope; mở đúng file sau câu tóm tắt.

Khi chưa chắc một con số hoặc enum, nói “em kiểm tra đúng contract hiện tại” rồi mở OpenAPI/source. Đừng suy đoán từ UI. Nếu source và tài liệu cũ xung đột, chỉ ra phiên bản và thứ tự nguồn trong [README](README.md).

## Khung xử lý lỗi trong 45 giây

1. **Xác định:** thao tác, actor, URL/HTTP status, `error.code`, `requestId`.
2. **Khoanh vùng:** UI/Query/Mapper → API contract → backend guard/state → DB/provider. Không sửa dữ liệu bằng tay khi chưa biết transaction đã commit hay chưa.
3. **Bảo toàn:** với mutation có idempotency key hoặc expectedVersion, tải trạng thái mới và dùng đúng retry semantics; tránh tạo đơn/asset/job trùng.
4. **Giải thích:** lỗi được chặn để bảo vệ quyền, quota hay dữ liệu, hoặc là gap cần sửa; trình bày giới hạn thật của provider.

Ví dụ: confirm Pantry bị `PANTRY_VERSION_CONFLICT` → lấy detail hiện tại → xem ai đã sửa và số lượng mới → tính lại ý định → gửi expectedVersion mới. Một lần retry y nguyên payload cũ có thể vẫn sai.
