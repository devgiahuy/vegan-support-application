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
