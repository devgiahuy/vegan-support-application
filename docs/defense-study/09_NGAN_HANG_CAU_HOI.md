# 9. Ngân hàng câu hỏi hội đồng & đáp án mẫu

**Cập nhật:** 2026-11-16 · **Đối chiếu:** `dev` @ `3c6c59c`, SRS 1.8, BACKEND_INTEGRATION 4.78.
Cách dùng: che đáp án, tự trả lời 45 giây, rồi so. Đánh dấu `⚠` cho câu chưa chắc.
Ký hiệu **[N]** = câu nghiệp vụ, **[K]** = câu kỹ thuật, **[B]** = câu bẫy.

---

## A. Tổng quan & phạm vi

**A1 [N]. Vì sao chọn đề tài này?**
> Người ăn chay ở Việt Nam thiếu công cụ vừa tìm món/quán, vừa hiểu dinh dưỡng, vừa an toàn với dị ứng. Các app hiện có hoặc chỉ là công thức, hoặc chỉ là bản đồ, và hầu như không kiểm soát ràng buộc ăn uống. Nhóm em chọn hướng "an toàn dữ liệu trước, AI sau".
> *Mở:* `docs/SRS.md` mục 2.

**A2 [N]. Điểm khác biệt lớn nhất?**
> Ràng buộc dị ứng/chế độ ăn/truyền thống do **backend** thực thi trước mọi xếp hạng; AI chỉ đề xuất và người dùng phải confirm trước khi dữ liệu tủ bếp/kế hoạch thay đổi. Đây là khác biệt về kiến trúc, không phải về số màn hình.

**A3 [N]. Phạm vi MVP gồm gì?**
> Backend Phase 00–27: tài khoản, hồ sơ/diet, nội dung & kiểm duyệt, tìm kiếm/gợi ý, meal plan/program, pantry, scan ảnh/hóa đơn, AI chat, restaurant, notification, AI governance, billing extension. Phase 2 (wearable, DMCA, AI ranking nâng cao…) không nằm trong MVP.

**A4 [N]. Vì sao có cả web và mobile?**
> Web cho quản trị/duyệt nội dung và soạn thảo dài; mobile cho tác vụ tại chỗ: chụp tủ lạnh/hóa đơn, xem thực đơn, tìm quán. Backend dùng chung contract `/api/v1`.

**A5 [N]. Ai là người dùng chính?**
> Guest đọc nội dung và thử chat giới hạn; Member quản lý hồ sơ, pantry, kế hoạch; Contributor duyệt nội dung Member đủ điều kiện và xác thực AI artifact; Admin quyết định cuối, quản trị catalog/dữ liệu/AI.

**A6 [N]. Chức năng nào thật sự chạy?**
> Các luồng `READY`: auth/profile/diet, content & review, search, meal plan/program, pantry, shopping gap, chat, restaurant, notification, billing (dev). Scan ảnh là `IN_PROGRESS` vì chưa đánh giá ảnh Việt Nam thật; em nói rõ thay vì claim READY.

**A7 [K]. Vì sao MongoDB thay vì PostgreSQL?**
> Quyết định 2026-10-07: cần replica set cho transaction, schema linh hoạt cho dữ liệu dinh dưỡng/audit lồng nhau, và đơn giản hoá demo. UUID API giữ nguyên; `prisma:push` sinh native validator/index thay vì migrate SQL.

**A8 [N]. Điểm yếu lớn nhất của đồ án?**
> Ba điểm: (1) scan chưa validate ảnh thật; (2) chưa có test tự động backend theo policy repo; (3) parity mobile chưa đầy đủ. Em ghi rõ trong `RELEASE_CHECKLIST.md` thay vì che.

---

## B. Auth & phân quyền

**B1 [K]. Access/refresh token hoạt động thế nào?**
> Access JWT 900s giữ in-memory; refresh 30 ngày hash trong DB, thuộc family. Refresh xoay token; dùng lại token cũ → revoke cả family (`REFRESH_TOKEN_REUSED`).
> *Mở:* `auth.service.ts#refresh`, `token.service.ts`.

**B2 [K]. Vì sao phải chống 2 refresh đồng thời?**
> Vì backend revoke family khi reuse. Nếu 2 tab refresh cùng lúc, tab sau mang token cũ → cả phiên bị đăng xuất. FE dùng singleton promise + Web Locks cross-tab.
> *Mở:* `frontend/src/lib/auth-refresh.ts`.

**B3 [K]. Nếu role thay đổi giữa phiên?**
> Token cũ mang role cũ; middleware so `claims.role` với DB → `STALE_ACCESS_TOKEN`, buộc đăng nhập lại. Khi duyệt/thu hồi Contributor, backend còn revoke session.

**B4 [N]. Contributor khác Member ở đâu?**
> Contributor được duyệt có thể duyệt nội dung Member đủ điều kiện, xác thực AI artifact, và (theo rule đã duyệt) tự publish nội dung của chính mình nếu sạch. **Không** có phân hạng theo căn cứ duyệt.

**B5 [N]. Làm sao chặn tự duyệt?**
> `canDecide` yêu cầu người duyệt không phải tác giả; recipe nutrition override cũng chặn `SELF_APPROVAL_FORBIDDEN`. Admin vẫn có quyền cao hơn nhưng vẫn bị audit.
> *Mở:* `moderation.service.ts`.

**B6 [N]. Tài khoản bị ban thì sao?**
> Mọi request xác thực trả `ACCOUNT_BANNED`; nội dung bị ẩn với lý do `USER_BANNED`. Unban chỉ khôi phục nội dung bị ẩn thuần do ban, không khôi phục nội dung vi phạm khác.

**B7 [K]. Guest chat chống lạm dụng thế nào?**
> Cookie guest ký + rate limit theo phút + quota ngày; purge lịch sử guest hết hạn. Guest quota mặc định 3/ngày, rate 10/phút.

**B8 [K]. Vì sao token không lưu localStorage?**
> Giảm rủi ro XSS đọc token. Refresh token HttpOnly + SameSite; access token memory. Đánh đổi: F5 phải silent-refresh, và cần xử lý race như B2.

---

## C. Diet, dị ứng & dinh dưỡng

**C1 [N]. Ràng buộc cứng gồm những gì?**
> Dị ứng, nguyên liệu loại trừ tường minh, `dietPattern`, luật truyền thống đang bật (theo lịch). Cộng thêm dữ liệu composition chưa đủ tin cậy cũng bị loại.

**C2 [N]. Thứ tự ưu tiên?**
> Allergy/Exclusion > DietPattern > Tradition > Health/nutrition limits > Preference/ranking. Ranking không bao giờ khôi phục món đã bị loại.

**C3 [N]. Nguyên liệu chưa xác định thì sao?**
> Không coi là 0 dinh dưỡng và không coi là an toàn. Với constraint cứng đang bật, dữ liệu UNKNOWN/PARTIAL bị loại; nutrition hiển thị `uncovered` + confidence thấp.

**C4 [N]. Composition là gì và vì sao cần?**
> Một nguyên liệu có thể là hợp chất (sốt, bột nêm). Composition lưu cạnh thành phần có nguồn/version/scope để kiểm tra dị ứng **xuyên** nhiều cấp; thiếu dữ liệu thì không pass constraint cứng.

**C5 [N]. AI có được tạo luật dinh dưỡng không?**
> Không. AI có thể đề xuất mapping/estimate nhưng phải qua review của Admin/Contributor mới thành dữ liệu chuẩn; AI không tự ghi `IngredientFoodProfile` hay interaction rule.

**C6 [K]. Provenance của nutrition gồm gì?**
> `CANONICAL_CALCULATED`, `AI_ESTIMATED`, `USER_PROVIDED`, `VERIFIED_OVERRIDE` + confidence, assumptions, uncovered ingredients, source version, calculation version.

**C7 [N]. Thiếu một chỉ số thì sao?**
> Không cộng phần đã có rồi gọi là tổng. Metric thiếu ở bất kỳ dòng nào → metric đó thiếu; duyệt recipe bị chặn tới khi đủ 5 chỉ số.

**C8 [N]. Vì sao B12 không bắt buộc?**
> B12 quan trọng với người ăn chay nhưng dữ liệu canonical/estimate không đủ tin cậy; nhóm chọn lưu nếu tác giả nhập, không để AI ước lượng và không dùng làm điều kiện publish.

**C9 [N]. Test dị ứng thế nào?**
> Dùng tài khoản có allergy (ví dụ đậu phộng/sesame), tìm recipe có thành phần đó → không xuất hiện; thêm vào plan → bị chặn; kiểm tra cả thành phần lồng trong hợp chất.

**C10 [N]. Vì sao restaurant không áp hồ sơ?**
> Quyết định 2026-10-25: dữ liệu quán từ provider không đủ để kết luận hợp dị ứng; áp hồ sơ sẽ tạo cảm giác an toàn giả. Chỉ áp filter người dùng chọn, và nhãn vẫn "chưa kiểm chứng".

**C11 [K]. Hard filter chạy ở đâu?**
> `buildAuthenticatedSearchConstraints` tạo context (allergen codes, ingredient ids, diet, tradition theo ngày) → repository query lọc trước khi rank/paginate. Không lọc ở client.
> *Mở:* `content/search-constraints.ts`.

---

## D. Nội dung & kiểm duyệt

**D1 [N]. State machine nội dung?**
> `DRAFT → PENDING_REVIEW → PUBLISHED/REJECTED`; sửa bài đã publish tạo revision mới, bản cũ vẫn public tới khi bản mới được duyệt. Admin có thể HIDDEN/REMOVED.

**D2 [K]. Vì sao revision bất biến?**
> Để audit và tránh "sửa lén" nội dung đã duyệt. Mỗi lần sửa là snapshot mới; reviewer duyệt đúng revision id + version.

**D3 [N]. Ai được auto-publish?**
> Contributor đang hoạt động (role + profile chưa revoke) với nội dung của chính họ, nếu không có moderation flag. Admin vẫn vào queue theo rule hiện tại. Member luôn qua review.

**D4 [N]. Khi nào nội dung vào Admin queue dù là Contributor?**
> Khi có AI moderation flag, report đủ ngưỡng, hoặc nội dung không thuộc quyền Contributor (bài của Admin/non-Member, report, user, comment).

**D5 [N]. Contributor được duyệt bài của ai?**
> Bài Member đang `PENDING_REVIEW`, không có AI flag OPEN, dưới 5 reporter, và không phải bài của chính mình.

**D6 [N]. Report/AI flag có xoá bài không?**
> Không. Chỉ tạo signal/priority/quarantine; Admin quyết định và ghi lý do. Không có hard-delete tự động.

**D7 [N]. Duyệt recipe cần điều kiện gì?**
> Đủ 5 chỉ số cuối (calories, protein, carbs, fat, fiber); nếu thiếu → `RECIPE_NUTRITION_INCOMPLETE`, nút duyệt bị khoá trên UI và backend chặn.

**D8 [K]. Slug trùng tiêu đề xử lý sao?**
> Tiêu đề không cần unique; slug tự sinh unique, có collision-safe. Chỉ slug do người dùng yêu cầu mới phải unique; sửa bài không đổi URL trừ khi yêu cầu.

---

## E. Meal plan & program

**E1 [N]. Vì sao 21 slot?**
> 7 ngày × 3 bữa chính. Bữa phụ có thể thêm nhưng không phải điều kiện hoàn tất. Slot thiếu ứng viên để `UNFILLED` kèm lý do.

**E2 [K]. Target calories tính thế nào?**
> TDEE lưu trong hồ sơ × hệ số mục tiêu (goal factor), làm tròn; macro theo cấu hình. Response nói rõ nguồn và đây là ước tính.

**E3 [N]. Vì sao có slot UNFILLED?**
> Vì không có món hard-compatible. Che bằng món vi phạm dị ứng là sai; UNFILLED là trạng thái trung thực.

**E4 [N]. Swap có phá ràng buộc không?**
> Không. Swap/manual add kiểm tra constraint cứng trước; vi phạm thì chặn. Sau đó mới cảnh báo mềm (vượt calo/macro).

**E5 [K]. Analysis stale là gì?**
> Kết quả phân tích gắn fingerprint (thuật toán + constraint + item). Plan đổi hoặc dữ liệu đổi → fingerprint lệch → trả `MEAL_ANALYSIS_STALE` và tính lại khi mở detail.

**E6 [N]. Multi-week program khác gì?**
> Lưu snapshot từng tuần, phân tích tích lũy/lặp món; sửa một tuần làm invalid các tuần sau; generate là draft tới khi user confirm.

**E7 [N]. Vì sao chỉ 4 chiều macro?**
> Protein, fiber, fat, carbs là dữ liệu đủ tin cậy để so sánh; micronutrient không dùng làm blocker vì coverage chưa đầy đủ.

**E8 [K]. Generate bị timeout thì sao?**
> Frontend đặt timeout riêng 180s cho program; idempotency key cho phép gửi lại an toàn. Backend vẫn là nơi quyết định trạng thái.

---

## F. Pantry, scan & shopping

**F1 [N]. Ranh giới duy nhất ghi Pantry?**
> Confirm. Trước đó chỉ là candidate; user sửa/từ chối. Scan không bao giờ tự động cộng kho.

**F2 [K]. Vì sao không cộng số lượng giữa các ảnh?**
> Cùng một vật thể có thể xuất hiện nhiều ảnh; cộng sẽ sai. Hệ thống giữ estimate tin cậy hơn, ghi evidence, và bắt user xác nhận.

**F3 [N]. Hai ảnh cùng hóa đơn?**
> So identity: khác số hóa đơn → hai lần mua; không số → cần merchant/date/total/currency + toàn bộ multiset dòng. Trùng một phần → user chọn cùng/khác hóa đơn trước confirm.

**F4 [N]. Hàng phi thực phẩm?**
> AI có thể loại ban đầu, lưu lý do + notice; user restore được. Dòng bị loại không vào Pantry trừ khi restore + confirm.

**F5 [K]. Shopping gap tính sao?**
> `required` từ recipe/custom meal + servings; `available` chỉ từ Pantry confirmed, còn hạn, quy đổi được; `missing = max(0, required - available)`. Phần không quy đổi tách `unresolvedItems`.

**F6 [N]. Free-text pantry có được tính?**
> Chỉ khi normalize trùng **chính xác** canonical name hoặc alias đã duyệt; không fuzzy. Item hết hạn không tính.

**F7 [K]. Capacity Pantry?**
> Đếm mọi item chưa xoá (kể cả quantity 0), kiểm tra trong transaction ở 3 đường ghi; item vượt hạn mức cũ vẫn đọc/sửa/xoá được.

**F8 [K]. Job scan fail/retry?**
> `FAILED`/`PARTIAL_FAILED` retry chỉ ảnh lỗi, idempotent; ảnh đã commit vẫn tính dung lượng; provider/model đổi giữa job → fail có lý do thay vì trộn kết quả.

**F9 [N]. Vì sao scan vẫn IN_PROGRESS?**
> Source + UI + fake provider chạy, nhưng chưa đánh giá ảnh tủ lạnh/hóa đơn Việt Nam thật (P0). Không claim production READY khi chưa có bằng chứng.

**F10 [K]. Nếu user confirm 2 lần?**
> Idempotency + transaction + trạng thái job `CONFIRMED`; lần sau replay/không cộng đôi.

---

## G. Chat & AI

**G1 [K]. Vì sao SSE thay vì WebSocket?**
> Nhu cầu một chiều server→client cho từng câu trả lời; SSE nhẹ, đi qua HTTP, dễ debug. Vẫn dùng POST + fetch vì cần body + Authorization.

**G2 [K]. Các event?**
> `message_start`, `content_delta`, `quota`, `message_complete`, `error`. FE chỉ commit khi `message_complete`.

**G3 [K]. Quota trừ lúc nào?**
> Reserve **trước** khi gọi provider; thành công thì commit; lỗi/fallback/abort thì release. Vì vậy không mất lượt khi provider sập.

**G4 [N]. Vì sao có fallback tĩnh?**
> Khi provider/key/moderation không khả dụng, trả lời an toàn thay vì lỗi trắng; không trừ quota và ghi governance. Không giả vờ đó là AI thật.

**G5 [K]. Moderation thế nào?**
> Kiểm tra trước khi generate. Nếu gateway không hỗ trợ model moderation, dùng classifier cấu hình (strict JSON `{flagged}`); invalid/unavailable → fail-closed (giữ fallback tĩnh).

**G6 [K]. Chống gửi trùng?**
> Idempotency key + payload hash; đang xử lý → `CHAT_REQUEST_IN_PROGRESS`; đã xong → replay.

**G7 [K]. Client đóng tab giữa stream?**
> Abort signal huỷ provider, release quota, message failed. Nếu đang stream dở, FE không commit vào cache.

**G8 [N]. Lịch sử chat lưu gì?**
> Session/message + metadata redacted (prompt hash, topic codes, provider/model, latency, token). Không lưu prompt thô vào governance log.

**G9 [N]. AI artifact & verification?**
> Output chia sẻ thành artifact bất biến; Contributor khác xác thực kèm evidence, không được tự xác thực; verification không biến thành canonical data.

**G10 [K]. Admin tắt AI thì sao?**
> `AiCapabilityControl` + audit; capability trả fallback/503 theo thiết kế. Không có route nào bypass.

---

## H. Billing

**H1 [N]. Vì sao payOS?**
> Quyết định 2026-10-14: payOS là provider duy nhất cho giao dịch mới; VNPAY/local simulation bị bỏ. payOS không có sandbox nên phải cảnh báo tiền thật.

**H2 [K]. Return URL có grant không?**
> Không. Return chỉ hiển thị/điều hướng; grant chỉ từ webhook đã verify + query lại provider.

**H3 [K]. Chống grant trùng?**
> `PaymentEvent.transactionKey` unique + transaction; order PAID thì bỏ qua; callback trùng không cộng lần hai.

**H4 [N]. Trả thiếu/thừa?**
> Thiếu → PENDING, không cộng quyền lợi. Thừa → không thêm benefit, không auto-refund; cần xử lý merchant thủ công.

**H5 [K]. Order hết hạn?**
> TTL 15 phút; hết hạn ẩn checkout URL (`410`), không grant. Order mới/idempotent retry vẫn recover được.

**H6 [N]. Gói thời hạn hoạt động sao?**
> Combo 1/3/12 tháng, cấp credit theo từng chu kỳ 30 ngày, credit chưa dùng hết hạn cuối chu kỳ, không auto-renew; mua khi đang active thì nối tiếp.

**H7 [K]. Pantry slot của gói?**
> +50 slot khi subscription active; hết hạn không xoá item, chỉ chặn thêm mới; item vượt hạn mức vẫn đọc/sửa/xoá.

**H8 [B]. Nếu hội đồng hỏi "chuyển tiền thật à?"**
> "Billing chỉ bật ở development/test, payOS không có sandbox nên em không demo thanh toán thật; em chỉ mở order history/catalog và giải thích webhook. Thiếu credential thì checkout tắt, không có mock fallback."

---

## I. Restaurant & notification

**I1 [N]. Vì sao bỏ lọc diet mặc định?**
> Vì dữ liệu quán không đủ xác thực hợp dị ứng; lọc theo hồ sơ tạo an toàn giả. Filter tường minh vẫn còn, nhãn "chưa kiểm chứng" vẫn hiển thị.

**I2 [K]. SerpApi radius 1/3/5km?**
> Dùng snapshot bounded cho cùng center/phrase/filter, lấy first page của 3 viewport, lọc khoảng cách thật; partial giữ kết quả đã có, retry sau 15s, báo degradation.

**I3 [N]. Có lưu vị trí user không?**
> Không lưu lịch sử vị trí; chỉ dùng cho request hiện tại. Provider content không cache vĩnh viễn.

**I4 [K]. Notification idempotent thế nào?**
> `dedupeKey` unique + dispatcher transaction; cùng event không tạo hai thông báo; payload allowlist, không PII.

---

## J. Frontend architecture

**J1 [K]. Gọi endpoint như thế nào?**
> Component → query hook → `api/*.api.ts` → axios (`baseURL`, Bearer, với credentials). API đọc `res.data.data` một lần, đưa DTO qua mapper, trả Model. Component không thấy DTO.

**J2 [K]. Vì sao cần Mapper?**
> Cô lập thay đổi contract: đổi tên field, null, số dạng chuỗi. `pickField` + `safe*` đảm bảo UI không crash; format tiền/ngày ở mapper.

**J3 [K]. Render trạng thái?**
> Mỗi màn xử lý loading (skeleton), error (retry), empty, success; một số màn có partial/disabled theo quyền/quota. Ví dụ `/pantry` dùng Suspense skeleton + `isLoading/isError` + empty state.

**J4 [K]. Query invalidation?**
> Query Key Factory theo domain; mutation xong invalidate đúng key (ví dụ chat complete → messages + billing). Zusta chỉ giữ client-state (auth memory/theme), không cache server-state.

**J5 [K]. SSE khác axios ở đâu?**
> Dùng `fetch` + `ReadableStream` để không bị interceptor toast/refresh can thiệp; tự xử lý 401 một lần, buffer `\n\n`, abort.

**J6 [K]. Server Component lấy dữ liệu?**
> `lib/server-fetch.ts` đọc cookie HttpOnly, gắn Bearer, hỗ trợ `revalidate/tags`; lỗi trả null để page quyết định `notFound()`. Không gọi axios trong RSC.

**J7 [K]. Bảo vệ route?**
> Middleware Edge đọc cookie + `exp`; `AuthGuard` cho admin/contributor; API vẫn là nơi quyết định quyền cuối cùng.

**J8 [K]. Form validation?**
> Zod + react-hook-form; schema FE phản ánh contract nhưng backend vẫn validate lại. Lỗi field từ backend được map về form.

**J9 [K]. Vì sao cấm `any`?**
> Vì `any` làm mất giá trị của DTO/Mapper và che lỗi contract. Repo dùng `unknown` + type guard; ESLint/tsc strict.

**J10 [K]. Test frontend?**
> Vitest cho mapper/helper/component logic, chạy `npm test`; con số chốt theo lần chạy gần nhất trong `WORK-LOG` (hơn 800 test). Không nói "đã test toàn bộ" nếu chưa chạy lại.

---

## K. Backend, transaction & bảo mật

**K1 [K]. Validate ở đâu?**
> Zod ở router (`validateBody/Query/Params`), sau đó service kiểm tra luật nghiệp vụ. Controller không đọc `req.body` thô.

**K2 [K]. Hai request đồng thời?**
> Tuỳ luồng: optimistic version (`expectedVersion`), idempotency key, transaction + unique index, hoặc document lock. Confirm scan/grant/quota đều nằm trong transaction.

**K3 [K]. Idempotency hoạt động sao?**
> Lưu key + hash payload. Cùng key + cùng payload → replay; cùng key + khác payload → 409. Vậy retry mạng không tạo bản ghi thứ hai.

**K4 [K]. Vì sao dùng transaction?**
> Vì một thao tác có thể đụng nhiều bảng: job + candidate + pantry + ledger + notification. Transaction đảm bảo all-or-nothing.

**K5 [K]. Chống vượt quota upload?**
> Reserve trước khi upload (atomic), commit sau khi Cloudinary trả bytes; reservation hết hạn được release. Hai upload đồng thời không vượt hạn mức.

**K6 [K]. Log có lộ dữ liệu sức khỏe?**
> Không log prompt/ảnh/hóa đơn; AI governance lưu metadata redacted (hash, topic, model, latency). Request route nhạy cảm được giảm log.

**K7 [K]. OpenAPI sinh thế nào?**
> Từ Zod schema qua `zod-to-openapi`, phục vụ `/api-docs.json`. Khi contract đổi phải regenerate và sync sang `frontend/docs/api/*`.

**K8 [K]. Migration Mongo?**
> `npm run prisma:push` chạy `scripts/mongo-schema.mjs`: tạo collection, validator, index; không dùng `prisma migrate`. Seed idempotent.

**K9 [K]. Vì sao không có unit test backend?**
> Policy repo hiện tại: phase gate là lint/typecheck/build + OpenAPI + acceptance script; không thêm test framework trừ khi policy đổi. Em nói đúng, không gọi acceptance là unit test.

**K10 [K]. Nếu provider AI đổi model?**
> Model/provider là config + governance; job ghi lại provider/model/template version. Nếu khác lúc tạo, job fail có lý do thay vì trộn kết quả.

---

## L. Câu bẫy & tình huống

**L1 [B]. "Em dùng AI để code à?"**
> "Em dùng AI như công cụ hỗ trợ tra cứu/soạn, nhưng mọi thay đổi đều qua đọc source, chạy gate và tự kiểm tra luồng. Em có thể giải thích từng quyết định và mở file tương ứng."

**L2 [B]. "Con số 800 test này thật không?"**
> "Đó là con số lần chạy gần nhất ghi trong WORK-LOG. Nếu thầy/cô muốn, em chạy lại `npm test` và báo kết quả hiện tại." (Không đọc thuộc số nếu chưa chạy.)

**L3 [B]. "Mất mạng đúng lúc confirm thì sao?"**
> "Request có idempotency key; nếu backend đã commit, retry trả replay/không cộng đôi. Nếu chưa commit, user thấy lỗi và thử lại; version conflict thì refetch rồi tính lại."

**L4 [B]. "Nếu user cố tình sửa request?"**
> "Backend không tin client: ownership, role, constraint, quantity/unit, capacity đều kiểm tra lại trong service/transaction."

**L5 [B]. "Vì sao scan chưa xong mà vẫn demo?"**
> "Em demo phần state machine/confirm đã chạy và nói rõ provider thật chưa được đánh giá. Nếu thầy/cô muốn, em chỉ mở job đã chuẩn bị trước và không confirm vào Pantry thật."

**L6 [B]. "Nếu bỏ AI đi thì sản phẩm còn gì?"**
> "Vẫn còn toàn bộ giá trị cốt lõi: hồ sơ/diet, tìm món an toàn, meal plan, pantry, shopping gap, review nội dung. AI là lớp hỗ trợ, không phải nền tảng."

**L7 [B]. "Hệ thống có chứng nhận chuyên gia không?"**
> "Không. MVP không xác thực chứng chỉ; approval basis chỉ là dữ liệu audit. Em không claim điều mình không làm."

**L8 [B]. "Nếu làm lại, em đổi gì?"**
> "Ưu tiên test tự động cho các luồng transaction, và validate provider ảnh sớm hơn. Về kiến trúc, em vẫn giữ backend-authoritative và confirm boundary."

**L9 [B]. "Tại sao không dùng microservice?"**
> "Quy mô đồ án và team nhỏ; monolith module hoá giúp transaction đơn giản và demo ổn định. Tách service chỉ có lợi khi có nhu cầu scale/deploy riêng."

**L10 [B]. "Điểm này tài liệu ghi khác code?"**
> "Đó là changelog lịch sử. Trạng thái hiện tại em đọc ở bảng registry + source. Em ưu tiên source/OpenAPI khi trình bày."

---

## M. Câu hỏi mở — chuẩn bị sẵn 3 câu trả lời

**M1. "Đóng góp kỹ thuật em tự hào nhất?"**
> Confirm boundary + idempotency/version cho scan: một pipeline bất đồng bộ nhưng không thể ghi sai kho, retry không cộng đôi. Kèm SSE quota reserve/release.

**M2. "Phần nào khó nhất?"**
> Chat SSE vì phải phối hợp abort, quota, replay, moderation và stream parser; và nutrition vì provenance/coverage phức tạp hơn tính toán.

**M3. "Bài học lớn nhất?"**
> "Không được để UI hoặc AI quyết định dữ liệu an toàn. Mọi thứ quan trọng phải nằm ở backend, có transaction và audit."

---

## N. Checklist trả lời nhanh (in 1 trang)

- [ ] 4 role + 1 câu mỗi role.
- [ ] 3 state machine: content, contributor, scan.
- [ ] 5 ràng buộc cứng + thứ tự ưu tiên.
- [ ] 4 provenance dinh dưỡng.
- [ ] 5 event SSE + quota reserve/release.
- [ ] 3 điều kiện confirm scan (owner, version, transaction).
- [ ] 3 lớp chống trùng: idempotency, expectedVersion, unique index.
- [ ] 2 điều kiện auto-publish (Contributor active + không flag).
- [ ] 2 điều kiện grant billing (webhook verify + query provider).
- [ ] 3 giới hạn phải nói: scan IN_PROGRESS, payOS real money, backend không unit test.
