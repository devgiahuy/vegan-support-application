# Toàn bộ tính năng và cách hoạt động của Backend

**Phiên bản tài liệu:** 1.0  
**Cập nhật:** 2026-10-08  
**Phạm vi:** Backend hiện có trong source, Prisma migrations và OpenAPI của Vegan Support Application  
**API prefix:** `/api/v1`  
**OpenAPI hiện tại:** 141 path, 168 operation

## 1. Mục đích và cách đọc trạng thái

Tài liệu này là bản mô tả tổng thể bằng tiếng Việt về các chức năng backend (BE), cách các phân hệ phối hợp, quy tắc nghiệp vụ quan trọng và danh mục API đang được phục vụ.

Nguồn được đối chiếu khi lập tài liệu:

1. `docs/SRS.md` và `docs/IMPLEMENTATION_PLAN.md` cho yêu cầu và quy tắc chuẩn.
2. `backend/src`, `backend/prisma/schema.prisma` và migrations cho hành vi thực tế.
3. `backend/openapi.json` và `/api-docs.json` cho contract kỹ thuật đang phục vụ.
4. `frontend/docs/BACKEND_INTEGRATION.md` cho trạng thái tích hợp sống.
5. `backend/docs/IMPLEMENTATION_PHASES.md` và `backend/docs/RELEASE_CHECKLIST.md` cho trạng thái phase và release gate.

Ý nghĩa trạng thái trong tài liệu:

| Trạng thái    | Ý nghĩa                                                                                               |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| `READY`       | Contract, migration/seed, phân quyền và các gate backend liên quan đã hoàn thành; được phép tích hợp. |
| `IN_PROGRESS` | Đã có route/source/OpenAPI nhưng còn gate chưa đạt; không nên xem là production-ready.                |
| `PLANNED`     | Chỉ thuộc kế hoạch, chưa phải capability runtime.                                                     |

Trạng thái tổng thể hiện tại là `IN_PROGRESS`: phần lớn Phase 00–26 đã có trong source; Phase 27 vẫn chưa đóng release gate. Hai nhóm nhận diện ảnh tủ lạnh và bóc tách hóa đơn vẫn `IN_PROGRESS` vì chưa đánh giá thành công trên bộ ảnh thật đại diện bằng provider OpenAI. Shopping-gap độc lập trong Phase 22 đã `READY`.

## 2. Backend làm gì ở mức tổng quan

BE cung cấp một REST API cho ứng dụng hỗ trợ ăn chay, gồm:

- Tài khoản, phiên đăng nhập, hồ sơ sức khỏe và cấu hình ăn chay.
- Danh mục, nguyên liệu chuẩn, bài viết, công thức, video và media.
- Quy trình gửi duyệt, kiểm duyệt, báo cáo vi phạm và quản trị người dùng.
- Bình luận, vote, rating, bookmark và cá nhân hóa có consent.
- Dữ liệu dinh dưỡng có nguồn gốc, tính dinh dưỡng theo cách chế biến.
- Kế hoạch ăn tuần, phân tích khẩu phần/tương tác và chương trình nhiều tuần.
- Món ăn riêng, kho nguyên liệu, ảnh tủ lạnh, hóa đơn và shopping gap.
- AI chat, lưu/chia sẻ tạo tác AI, Contributor verification và quản trị AI.
- Nhà hàng/bản đồ, thông báo trong ứng dụng và quota lưu trữ.

Những nguyên tắc xuyên suốt:

- Dị ứng, nguyên liệu loại trừ, diet pattern và tradition rule đang bật là ràng buộc cứng do BE thực thi.
- Xếp hạng hành vi hoặc AI không được đưa lại món đã bị ràng buộc cứng loại bỏ.
- AI, ảnh tủ lạnh và hóa đơn chỉ tạo đề xuất; chỉ xác nhận tường minh mới được thay đổi Pantry.
- AI flag và report là tín hiệu để con người review, không phải phán quyết xóa tự động.
- Dữ liệu dinh dưỡng chuẩn giữ `source`, `license`, `version`; giá trị AI không âm thầm ghi đè dữ liệu chuẩn.
- Mọi Contributor được duyệt có cùng quyền; approval basis chỉ phục vụ audit/presentation.

## 3. Kiến trúc và vòng đời một request

### 3.1 Công nghệ chính

| Thành phần     | Công nghệ/cách dùng                                   |
| -------------- | ----------------------------------------------------- |
| Runtime        | Node.js 22+                                           |
| HTTP API       | Express 5 + TypeScript                                |
| Database       | PostgreSQL 14+                                        |
| ORM/migration  | Prisma 6                                              |
| Validation     | Zod                                                   |
| API contract   | OpenAPI 3.1, Swagger UI                               |
| Authentication | JWT access token + refresh session rotation           |
| Log            | Pino/Pino HTTP, che authorization/cookie/set-cookie   |
| Media          | Cloudinary qua provider adapter                       |
| AI             | OpenAI hoặc fake/local adapter, có governance wrapper |
| Maps           | fake, Google Maps hoặc SerpApi qua adapter            |

BE không phụ thuộc Redis. Trạng thái quota, rate-limit, phiên, job và audit hiện được lưu trong PostgreSQL.

### 3.2 Phân lớp

Luồng phổ biến:

```text
HTTP request
  -> middleware bảo mật/CORS/request ID/log/body parser
  -> router + Zod validation
  -> controller
  -> service (nghiệp vụ, quyền sở hữu, state transition)
  -> repository/provider
  -> PostgreSQL hoặc dịch vụ ngoài
  -> success/error envelope chuẩn
```

- **Router** gắn route, authentication, role/permission guard và schema validation.
- **Controller** chuyển HTTP input/output sang lời gọi service.
- **Service** giữ logic nghiệp vụ, transaction, idempotency, optimistic locking và state machine.
- **Repository** thao tác Prisma/PostgreSQL.
- **Provider adapter** cô lập Cloudinary, OpenAI, Google Maps/SerpApi khỏi domain contract.

### 3.3 Middleware và an toàn HTTP

- `helmet()` thêm security headers.
- CORS chỉ chấp nhận origin trong `FRONTEND_ORIGIN`, có credentials.
- Mỗi request có `requestId`; lỗi trả lại ID này để truy vết.
- JSON/form body bị giới hạn bởi `JSON_BODY_LIMIT`.
- API tắt `x-powered-by`.
- Lỗi 500 chỉ log tên lỗi và request ID; nội dung nội bộ không trả cho client.
- Server đóng kết nối graceful khi nhận `SIGINT`/`SIGTERM`, sau đó disconnect Prisma.

### 3.4 Response và lỗi chuẩn

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "fields": {},
    "requestId": "..."
  }
}
```

Client phải xử lý theo `error.code`, không phụ thuộc câu chữ `message`. ID dùng UUID; timestamp dùng ISO 8601 UTC; giá trị date-only giữ dạng `YYYY-MM-DD`.

## 4. Xác thực, phiên và phân quyền

### 4.1 Đăng ký và đăng nhập

- Đăng ký luôn tạo tài khoản `MEMBER`.
- Người dùng có thể gửi ý định Contributor khi đăng ký, nhưng điều đó chỉ tạo hồ sơ/đơn chờ duyệt, không cấp quyền.
- Mật khẩu được hash bằng cơ chế scrypt có salt và tham số được lưu kèm hash.
- Đăng nhập sai bị đếm; vượt ngưỡng cấu hình thì khóa đăng nhập tạm thời.
- Access token là JWT HS256, có issuer, audience, subject, role, JTI và thời gian hết hạn.
- Refresh token là chuỗi ngẫu nhiên 48 byte; database chỉ lưu SHA-256 hash.
- Refresh thực hiện rotation. Phát hiện token cũ bị reuse sẽ thu hồi cả token family để giảm rủi ro chiếm phiên.
- Logout có thể thu hồi phiên hiện tại hoặc toàn bộ thiết bị.

### 4.2 Cách BE nhận token

BE nhận access token từ:

1. `Authorization: Bearer <token>`; hoặc
2. cookie `accessToken`.

Refresh token được giữ bằng cookie HTTP-only theo controller contract. Chat hỗ trợ guest identity bằng cookie ký riêng khi route dùng optional authentication.

### 4.3 Trạng thái tài khoản

- `ACTIVE`: dùng bình thường.
- `LOCKED`: vẫn có thể đọc nhưng mutation `POST/PUT/PATCH/DELETE` bị trả `423 ACCOUNT_LOCKED`.
- `BANNED`: mọi request cần authentication bị từ chối với `403 ACCOUNT_BANNED`.
- `DELETED`: token bị xem là không hợp lệ.
- Nếu role trong JWT khác role hiện tại trong DB, BE trả `STALE_ACCESS_TOKEN` để bắt đăng nhập lại.

### 4.4 Vai trò

| Vai trò     | Quyền chính                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------- |
| Guest       | Xem dữ liệu public, tìm content/restaurant, dùng chat guest có giới hạn.                                 |
| Member      | Hồ sơ, content riêng, community, meal plan, pantry, storage, AI workflow và các tài nguyên owner-scoped. |
| Contributor | Tất cả quyền Member; có thể chia sẻ draft AI đủ điều kiện và verify tạo tác AI của người khác.           |
| Admin       | Quản lý catalog, review/moderation, user, Contributor, food data, storage, restaurant, AI governance.    |

`ORGANIZATION_AFFILIATION`, `PLATFORM_TRACK_RECORD`, `ADMIN_INVITED` chỉ là căn cứ duyệt. Chúng không tạo các tầng quyền Contributor khác nhau.

## 5. Chi tiết từng phân hệ

### 5.1 Health/Foundation — `READY`

- Health endpoint kiểm tra API và thực hiện `SELECT 1` vào PostgreSQL.
- DB không sẵn sàng thì health trả 503.
- Swagger UI ở `/api-docs`; JSON contract ở `/api-docs.json`.

### 5.2 Hồ sơ sức khỏe và diet rules — `READY`

Hồ sơ lưu thông tin cơ bản, chiều cao, cân nặng, tuổi, giới tính sinh học và mức vận động. BE tính deterministic:

- BMI từ cân nặng/chiều cao.
- BMR theo Mifflin–St Jeor.
- TDEE theo hệ số hoạt động cấu hình.

Diet workflow:

1. Client chọn `dietPattern`, `tradition`, `practiceSchedule`.
2. Gọi preview để BE trả rule set/version hiện hành.
3. Người dùng xác nhận và có thể bật/tắt từng tradition rule.
4. BE lưu allergy và ingredient exclusion riêng như hard constraints.
5. Nếu `PERIODIC`, lịch được lưu dưới dạng date-only theo `Asia/Ho_Chi_Minh`.

Thứ tự ưu tiên an toàn:

```text
Allergy >= explicit ingredient exclusion > diet pattern > enabled tradition rule
```

Tradition hoặc sở thích không thể vô hiệu hóa allergy/exclusion.

### 5.3 Category và ingredient catalog — `READY`

- Category có các loại `FOOD_TYPE`, `RECIPE_GROUP`, `CONTENT_TOPIC`; cây tối đa hai tầng.
- Public chỉ thấy record active; Admin thấy cả archived.
- Archive category đang được dùng yêu cầu category thay thế thích hợp.
- Ingredient chuẩn có tên, food group, alias, allergen/diet/tradition metadata.
- Resolve ingredient chuẩn hóa chữ thường/không dấu và tìm alias.
- Nếu match mơ hồ, BE trả candidates thay vì tự chọn.
- Ingredient/category dùng archive/soft lifecycle thay vì xóa làm mất lịch sử.

### 5.4 Content, recipe, blog, video và media — `READY`

Các post type là `RECIPE`, `BLOG`, `VIDEO`. Recipe có ingredients và cooking steps có cấu trúc.

Workflow xuất bản hiện hành:

```text
DRAFT
  -> SUBMIT
  -> PENDING_REVIEW
  -> Admin/được phép review
       -> PUBLISHED/APPROVED
       -> REJECTED
```

- Tất cả submission hiện đi qua review; Contributor không tự động publish.
- Mỗi lần submit là một revision snapshot bất biến.
- Sửa post đã publish tạo revision mới; bản public cũ tiếp tục hiển thị đến khi bản mới được duyệt.
- Owner được update/soft-delete theo state rule; Admin có review history/audit.
- Rule moderation tạo flag/tín hiệu nhưng không tự xóa.
- Media Cloudinary phải là asset đã commit, đúng owner/cloud/folder/kind/MIME/size.
- Search hỗ trợ text không dấu, category/tag/recipe filter và PostgreSQL `pg_trgm` index.
- Related content được chọn deterministic sau khi áp visibility và hard diet constraints.

### 5.5 Community — `READY`

- Chỉ post `PUBLISHED` mới nhận comment.
- Reply tối đa một tầng.
- Xóa comment có reply là soft-delete/tombstone để giữ mạch hội thoại.
- Vote, bookmark là idempotent.
- Rating recipe gồm `taste` và `difficulty` từ 1–5; BE tính aggregate từ record active.
- Bookmark chỉ áp dụng cho Recipe/Video.
- Có rate-limit bucket trong DB cho mutation cộng đồng.
- Community summary trả aggregate và trạng thái của viewer.

### 5.6 Contributor application — `READY`

Workflow:

```text
Member submit / Admin invite
  -> PENDING
  -> Admin APPROVE -> role CONTRIBUTOR + active ContributorProfile
  -> Admin REJECT  -> cooldown 30 ngày trước khi nộp lại
  -> Admin REVOKE  -> mất Contributor permission
```

- Một người chỉ có tối đa một đơn `PENDING`.
- Public application không được tự chọn `ADMIN_INVITED`.
- Cấm self-approval.
- Approve/revoke ghi decision/audit và thu hồi các refresh session để token role cũ không tiếp tục dùng.

### 5.7 Moderation, report và quản trị user — `READY`

- Review queue cho revision đang chờ.
- Chỉ Admin xem immutable evidence và approve/reject content revision trên các review route hiện hành.
- Người dùng report post/comment đang thấy; một reporter chỉ có một active report trên một target.
- Từ 5 reporter phân biệt trở lên sẽ nâng priority nhưng không tự kết luận vi phạm.
- Admin resolve nhóm report cùng target và ghi moderation action.
- Admin có thể lock/unlock/ban/unban/delete user, hide/restore comment.
- AI flag và report chỉ tạo tín hiệu; quyết định cuối cùng là thao tác có audit của người review.

### 5.8 Personalization và recommendation — `READY`

- Chỉ ingest behavior event khi user đã bật consent.
- Event hỗ trợ: search, xem recipe, bookmark, rate, chat topic, accept/swap/reject meal.
- Không đưa raw chat prompt vào behavior history; chỉ lưu topic code chuẩn hóa.
- User có thể tắt personalization và xóa toàn bộ behavior history.
- Recommendation lọc allergy/exclusion/diet/tradition trước, sau đó mới xếp hạng theo tín hiệu hành vi, độ liên quan, chất lượng/popularity và độ mới.
- Kết quả có reason codes/giải thích; cold-start vẫn có xếp hạng deterministic.

### 5.9 Food & nutrient knowledge base — `READY`

Knowledge base lưu:

- Food-data source/provider, license, version và quality.
- Nutrient và giá trị theo 100 g của ingredient.
- Edible portion/household conversion.
- Reference intake và upper limit theo population.
- Ingredient intake guideline riêng với nutrient RDA/UL.
- Cooking method, retention factor và yield factor.
- Ingredient interaction rule theo `SAME_DISH`, `SAME_MEAL`, `SAME_DAY`.
- AI suggestion ở trạng thái riêng, không tự thành canonical rule.

Public chỉ đọc dữ liệu đã review/active. Admin tạo, thay thế, supersede/archive record; import dùng hai bước preview/stage rồi commit idempotent qua provider adapter.

### 5.10 Cooking-aware recipe nutrition — `READY`

Luồng tính:

```text
recipe ingredient quantity
  -> đổi về khối lượng chuẩn/edible mass
  -> lấy nutrient canonical theo 100 g
  -> áp retention/yield theo cooking step
  -> cộng tổng và chia theo servings
  -> ghi provenance, coverage, assumptions, confidence, uncertainty
```

- `preview` tính nhưng không lưu.
- `recalculate` lưu một estimate version mới và đặt làm current.
- Có current/history/status và trạng thái AI fallback job.
- Origin phân biệt `CANONICAL_CALCULATED`, `AI_ESTIMATED`, `USER_PROVIDED`, `VERIFIED_OVERRIDE`.
- Dữ liệu thiếu không được biến thành 0; response thể hiện partial coverage.
- AI chỉ match/infer phần thiếu, không ghi đè canonical record.

### 5.11 Storage quota và upload — `READY`

Upload là quy trình hai pha:

```text
reserve quota atomically
  -> nhận cấu hình signed Cloudinary upload
  -> client upload trực tiếp Cloudinary
  -> commit reservation
  -> BE kiểm tra provider metadata và chuyển reservedBytes thành usedBytes
```

- Reservation có TTL; release/failure/cleanup giải phóng reserved bytes.
- Commit kiểm tra owner, kind, provider asset, MIME và actual bytes.
- Xóa asset chỉ giảm usage sau khi provider xóa thành công.
- Mutation dùng idempotency/optimistic version ở các điểm cần retry/concurrency.
- Admin quản lý policy, account quota adjustment và audit bất biến.
- Không có mua quota/thanh toán trong MVP.

### 5.12 Custom meals — `READY`

- Món do user tạo luôn private, owner-scoped, không vào public catalog.
- Có ingredients, nutrition coverage, ảnh đã commit và tag tự do.
- Tag như `shopee` chỉ là metadata, không gọi dịch vụ thương mại.
- Tối đa 10 ảnh/món; có attach, detach, reorder.
- Update danh sách ingredients/tags theo replacement semantics khi field được gửi.
- Xóa mềm; policy mặc định chặn xóa nếu đang được meal plan tham chiếu (`CUSTOM_MEAL_IN_USE`) để không làm hỏng lịch sử.

### 5.13 Weekly meal plans — `READY`

Generator dùng health target, meal goal, hard diet constraints, recipe eligibility và ranking. Một tuần có 21 slot (3 bữa/ngày).

Luồng chính:

1. Tính calorie/macro target từ TDEE và goal factor.
2. Lọc recipe vi phạm allergy/exclusion/diet/tradition hoặc ingredient chưa resolve.
3. Chấm một tập ứng viên giới hạn và các serving options.
4. Tối ưu bounded theo tổ hợp đủ ba bữa/ngày cho protein, fiber, fat và carbohydrate; calories là tie-breaker/context.
5. Áp penalty mềm cho lặp món, uncertainty và behavior rank.
6. Lưu plan version, constraint snapshot, recipe snapshot, warning và shopping items.

User có thể list/get/delete plan, swap một slot hoặc manual-add recipe/custom meal. Mutation dùng expected version để chống ghi đè đồng thời. Hard constraint bị kiểm tra lại ở swap/manual-add; không thể lách bằng UI.

### 5.14 Meal analysis — `READY`

Phân tích plan theo:

- Portion và macro target.
- Nutrient reference intake/upper limit.
- Ingredient amount/frequency guideline.
- Interaction trong dish, meal và day.

Hard allergy/diet violation bị chặn. Các giới hạn dinh dưỡng hoặc evidence-grade interaction thường trả cảnh báo giải thích, không tự nhận là chẩn đoán. Warning có code, severity, scope, source/evidence, items/ingredients liên quan, measured/limit, confidence và suggested adjustment.

Kết quả có fingerprint/version. Nếu recipe, ingredient hoặc plan input thay đổi, GET current trả `MEAL_ANALYSIS_STALE` để buộc phân tích lại.

### 5.15 Multi-week meal programs — `READY`

- Horizon từ 2 đến 12 tuần.
- Mỗi tuần có 1–3 alternatives và snapshot bất biến của base plan.
- Có generate phần thiếu, retry/regenerate từng tuần, chọn alternative, reanalyze và confirm.
- Thay alternative làm invalid downstream analysis phù hợp.
- Phân tích tổng hợp dinh dưỡng và pattern lặp qua nhiều tuần.
- Khi program đã `CONFIRMED`, cấu trúc bị khóa khỏi generation edit.
- Optimistic `expectedVersion` chống concurrent update.

### 5.16 Pantry — `READY`

- Item thuộc riêng owner, dùng canonical `ingredientId` hoặc `unmatchedText`.
- Lưu quantity, unit, source, confirmation status, confidence, observed expiry/freshness và conversion status.
- Số lượng chỉ thay đổi qua immutable adjustment ledger: consume, restore, adjust.
- Không cho balance âm.
- Update/delete/merge dùng optimistic version.
- Expiring-soon dùng cửa sổ date inclusive; đây là quan sát của user, không phải chứng nhận an toàn thực phẩm.
- Merge có preview, kiểm tra cùng ingredient identity và unit có thể quy đổi, rồi transactionally gộp balance và soft-delete items phụ.

### 5.17 Multi-image fridge recognition — `IN_PROGRESS`

Đã có đầy đủ source/route/OpenAPI và fake-provider acceptance, nhưng chưa production-ready do chưa đánh giá ảnh tủ lạnh thật đại diện bằng OpenAI.

Luồng:

```text
commit 1–6 FRIDGE_IMAGE assets
  -> create async recognition job
  -> provider phân tích từng ảnh
  -> BE deduplicate nhưng giữ evidence theo ảnh
  -> READY_FOR_REVIEW/PARTIAL_FAILED/FAILED
  -> user sửa/reject candidates với expectedVersion
  -> user confirm selection
  -> transaction duy nhất cập nhật Pantry
```

- Create/process/edit/cancel/retry không thay đổi Pantry.
- Chỉ `/confirm` là Pantry mutation boundary.
- Confirm/cancel/retry có tính idempotent.
- Freshness chỉ là quan sát hình ảnh và phải kèm disclaimer; không chứng nhận thực phẩm an toàn.
- Provider có fake deterministic và OpenAI adapter. Fake không được bật ở production.
- Shared/production nên để capability tắt cho đến khi P0 real-image gate đạt.

### 5.18 Receipt extraction — job `IN_PROGRESS`, shopping gap `READY`

Receipt job tương tự vision:

```text
commit 1–4 RECEIPT_IMAGE assets
  -> create OCR/extraction job
  -> provider trả candidate lines + receipt metadata
  -> user sửa canonical ingredient/quantity/unit/price hoặc reject
  -> confirm explicit candidate versions
  -> transaction cập nhật Pantry
```

- Chỉ confirm mới thay đổi Pantry.
- Raw merchant/line text được giữ nguyên; phần giải thích/uncertainty có localized presentation.
- Job có partial failure, retry, cancel và optimistic concurrency.
- Provider OpenAI chưa vượt qua đánh giá hóa đơn Việt Nam thật, nên sáu receipt-job API vẫn `IN_PROGRESS`.

Shopping-gap preview đã `READY`:

```text
required recipe/custom-meal quantities × servings
  - confirmed positive Pantry balances đã quy đổi được
  = quantity còn cần mua (tối thiểu 0)
```

Item không resolve/không đổi đơn vị được được trả trong `unresolvedItems`, không bị trừ đoán.

### 5.19 AI nutrition chat — `READY` với fallback

- Member và guest tạo private chat session.
- Answer stream bằng SSE với các event như `message_start`, `content_delta`, `message_complete`, `quota`, `error`.
- Signed-in user có thể dùng permitted profile/diet context; guest có daily quota và per-minute rate limit riêng.
- Quota chỉ bị trừ sau khi response hoàn tất; provider error/retry nội bộ không làm mất lượt thành công.
- Topic boundary và medical disclaimer được áp dụng.
- Feedback upsert trên assistant message thuộc owner.
- Provider/model/quota nằm trong config, không hard-code trong domain.
- Nếu OpenAI tắt/không sẵn sàng, BE trả static advisory an toàn và không tính successful-call quota.
- Chat không được tự sửa health profile, diet constraint hoặc canonical food rule.

### 5.20 AI artifacts và Contributor verification — `READY`

- User có thể lưu output đủ điều kiện thành immutable private draft artifact.
- Có thể share/unshare bằng public allowlist nghiêm ngặt; public DTO không lộ prompt, private session, receipt hay fridge image context.
- Owner submit artifact để Contributor/Admin review.
- Contributor đã duyệt và Admin có quyền verification như nhau; cấm tác giả tự verify.
- Verification ghi conclusion, evidence note, scope và version; không biến output thành scientific canonical truth.
- Admin override/revoke yêu cầu reason và giữ audit; verification cũ chuyển `SUPERSEDED`/`REVOKED` thay vì bị xóa.

### 5.21 Restaurants và maps — `READY`

- Public tìm nearby/search theo tọa độ/radius/bounds hoặc geocode địa chỉ nhập tường minh.
- BE kết hợp internal reviewed places với provider places và de-duplicate.
- Lọc hard diet compatibility trước khi xếp hạng khoảng cách.
- User submission là untrusted `PENDING`; Admin review approve/reject và có immutable audit history.
- Provider adapter hỗ trợ fake, Google và SerpApi; API key chỉ ở server.
- Không lưu lịch sử vị trí liên tục. Geocode address không được giữ như user location history.
- Google provider content chỉ cache trong giới hạn cho phép; internal record là nguồn durable được review.

### 5.22 Notifications — `READY`

- Thông báo in-app theo event: content/contributor/report decision, quota warning, verification và các domain event được duyệt.
- Dispatcher ghi notification transactionally/idempotently bằng `dedupeKey`.
- Payload theo allowlist, không lộ PII/health/receipt của người khác.
- User list phân trang, xem unread count, mark-one-read và mark-all-read.
- Chỉ trả notification owner-scoped, chưa hết hạn.
- Cleanup mặc định xóa notification hết hạn/qua retention; không có email/push/SMS trong MVP.

### 5.23 Admin AI governance — `READY`

Admin-only API cho:

- Request/event logs đã redacted.
- Metrics theo capability/provider/status, latency, token/cost nếu provider có trả.
- Correction rate cho vision/receipt, nutrition coverage/confidence, moderation/verification signals.
- AI flags không kèm source content nhạy cảm.
- Feature/provider controls có version, reason allowlist và immutable audit.
- Health 24 giờ cho failure/fallback/provider unavailable.

Environment flag là upper bound; Admin không thể bật capability đã bị deployment config tắt hoặc chọn provider chưa cấu hình. Nếu DB control không đọc được, provider call bị chặn theo fail-closed.

Fallback:

| Capability | Khi tắt/không sẵn sàng                                                |
| ---------- | --------------------------------------------------------------------- |
| Chat       | Static advisory, không trừ successful quota.                          |
| Moderation | Không sinh answer nguy hiểm; không tự sanction.                       |
| Nutrition  | Giữ deterministic/partial calculation, đánh dấu provider unavailable. |
| Vision     | Job fail rõ ràng; user nhập Pantry thủ công.                          |
| Receipt    | Job fail rõ ràng; user nhập Pantry thủ công.                          |

Governance event giữ tối đa 90 ngày; control audit được giữ để chịu trách nhiệm. Không lưu prompt, user ID, image/receipt ID hay arbitrary JSON trong governance event store.

## 6. Các state machine quan trọng

### 6.1 Content revision

```text
DRAFT -> PENDING_REVIEW -> APPROVED/PUBLISHED
                        -> REJECTED
PUBLISHED --edit--> revision DRAFT/PENDING_REVIEW
PUBLISHED/other --moderation--> QUARANTINED/HIDDEN theo quyết định có audit
```

### 6.2 Contributor

```text
PENDING -> APPROVED -> ContributorProfile active
        -> REJECTED -> 30-day cooldown
APPROVED -> REVOKED -> role/permission bị thu hồi + session rotation/revocation
```

### 6.3 Upload reservation

```text
RESERVED -> COMMITTED
         -> RELEASED
         -> EXPIRED/FAILED -> quota được giải phóng
COMMITTED asset -> delete provider success -> usage được giảm
```

### 6.4 Vision/receipt job

```text
PENDING/PROCESSING
  -> READY_FOR_REVIEW hoặc COMPLETED
  -> PARTIAL_FAILED
  -> FAILED
FAILED/PARTIAL_FAILED -> RETRY -> PROCESSING
unconfirmed -> CANCELLED
reviewable -> CONFIRM -> Pantry diff đã áp dụng
```

### 6.5 Meal program

```text
GENERATING/PARTIAL -> READY/ACTIVE -> CONFIRMED
CONFIRMED: khóa generation structure
```

### 6.6 AI artifact/verification

```text
artifact DRAFT + PRIVATE
  -> visibility PUBLIC/PRIVATE
  -> SUBMITTED
  -> active verification
verification -> SUPERSEDED/REVOKED bởi Admin action có audit
```

## 7. Tích hợp dịch vụ ngoài và cấu hình

### 7.1 Cloudinary

- Client không gửi file qua body BE; BE cấp signed upload parameters sau khi reserve quota.
- Commit gọi provider để xác minh asset thực sự tồn tại và đúng metadata.
- Các loại ảnh/video có size/MIME limit riêng.

### 7.2 OpenAI

- Chat, nutrition fallback, fridge vision và receipt extraction đi qua interface/provider adapter.
- Model ID, base URL, timeout, token limit và template version là environment config.
- Governance wrapper kiểm tra feature control trước invocation và ghi event redacted.
- Vision/receipt yêu cầu model endpoint hỗ trợ Responses image input và strict JSON schema output.

### 7.3 Maps

- `MAPS_PROVIDER=fake|google|serpapi`.
- Google/SerpApi key chỉ tồn tại phía server.
- Provider failure được ánh xạ về lỗi domain, không làm lộ provider payload thô.

### 7.4 Cấu hình đáng chú ý

- JWT TTL/issuer/audience, login attempt/lock duration.
- Cloudinary folder, image/video size, default account quota, reservation TTL.
- Meal goal factor và macro targets/tolerance.
- AI provider/model/quota/rate-limit/fallback/template version.
- Vision/receipt enabled/provider/model/max images/max bytes.
- Maps provider/key/timeout.

Production config từ chối fake vision/receipt provider khi capability đang bật.

## 8. Database, transaction, concurrency và audit

- Prisma schema chứa các nhóm model cho identity/session, profile/diet, catalog/content/community, moderation, recommendation, meal planning, food data/nutrition, storage, pantry/jobs, AI review/governance, restaurant và notification.
- Các mutation nhạy cảm dùng transaction: quota reserve/commit, confirmation-to-Pantry, merge Pantry, review state transition, notification dispatch và audit/control update.
- Optimistic locking dùng `expectedVersion`/`expectedLifecycleVersion` để trả 409 khi client ghi trên dữ liệu cũ.
- Idempotency key được dùng ở các mutation dễ retry như confirm, adjustment, merge, upload/delete và event dispatch.
- Soft delete/archive/supersede được ưu tiên để không phá audit và reference lịch sử.
- Immutable snapshots/ledgers/audits được dùng cho content revision, meal plans/programs, Pantry adjustments, Contributor decisions, moderation, storage adjustments, restaurant review và AI verification/control.

## 9. Tác vụ vận hành

Chạy từ `backend/`:

```bash
npm run lint
npm run typecheck
npm run build
npm run openapi:generate
```

Maintenance nên được schedule hằng ngày:

```bash
npm run storage:cleanup
npm run notifications:cleanup
npm run ai-governance:cleanup
```

Kiểm tra drift storage:

```bash
npm run storage:reconcile
```

Chỉ dùng `-- --apply` sau khi đọc report; provider reconciliation cần credentials Cloudinary hoạt động.

Local startup điển hình:

```bash
npm ci
npm run prisma:migrate:deploy
npm run seed
npm run dev
```

`npm run seed` idempotent và tạo dữ liệu demo cho nhiều trạng thái workflow; session/chat quota/rate-limit runtime không được seed.

## 10. Danh mục API đầy đủ theo phân hệ

Ký hiệu quyền:

- **Public:** không bắt buộc access token.
- **Optional:** guest hoặc authenticated tùy request.
- **Auth:** tài khoản đăng nhập; service tiếp tục kiểm tra ownership/status.
- **Contributor/Admin:** ngoài Auth còn kiểm tra role/permission.

### 10.1 Foundation và Auth

| Method | Path                    | Quyền  | Chức năng                                      |
| ------ | ----------------------- | ------ | ---------------------------------------------- |
| GET    | `/api/v1/health`        | Public | Kiểm tra API/PostgreSQL.                       |
| POST   | `/api/v1/auth/register` | Public | Đăng ký Member, có thể kèm Contributor intent. |
| POST   | `/api/v1/auth/login`    | Public | Đăng nhập và tạo session.                      |
| POST   | `/api/v1/auth/refresh`  | Cookie | Rotate refresh token/access token.             |
| POST   | `/api/v1/auth/logout`   | Cookie | Logout phiên hiện tại hoặc mọi thiết bị.       |

### 10.2 User, health và diet

| Method | Path                                | Quyền | Chức năng                              |
| ------ | ----------------------------------- | ----- | -------------------------------------- |
| GET    | `/api/v1/users/me`                  | Auth  | Đọc hồ sơ hiện tại.                    |
| PATCH  | `/api/v1/users/me`                  | Auth  | Cập nhật hồ sơ cơ bản.                 |
| PUT    | `/api/v1/users/me/health-profile`   | Auth  | Lưu input và tính BMI/BMR/TDEE.        |
| POST   | `/api/v1/diet-rules/preview`        | Auth  | Preview rule set theo lựa chọn.        |
| PUT    | `/api/v1/users/me/diet-preferences` | Auth  | Xác nhận diet/rules/allergy/exclusion. |
| PUT    | `/api/v1/users/me/diet-schedule`    | Auth  | Thay lịch PERIODIC date-only.          |

### 10.3 Catalog và food data

| Method | Path                                                     | Quyền  | Chức năng                            |
| ------ | -------------------------------------------------------- | ------ | ------------------------------------ |
| GET    | `/api/v1/categories`                                     | Public | Cây category active.                 |
| GET    | `/api/v1/ingredients`                                    | Public | Danh sách ingredient active.         |
| GET    | `/api/v1/ingredients/resolve`                            | Public | Resolve tên/alias không dấu.         |
| GET    | `/api/v1/admin/categories`                               | Admin  | Danh sách kể cả archived.            |
| POST   | `/api/v1/admin/categories`                               | Admin  | Tạo category.                        |
| PATCH  | `/api/v1/admin/categories/{id}`                          | Admin  | Sửa category.                        |
| DELETE | `/api/v1/admin/categories/{id}`                          | Admin  | Archive category.                    |
| GET    | `/api/v1/admin/ingredients`                              | Admin  | Danh sách kể cả archived.            |
| POST   | `/api/v1/admin/ingredients`                              | Admin  | Tạo canonical ingredient.            |
| PATCH  | `/api/v1/admin/ingredients/{id}`                         | Admin  | Sửa ingredient/metadata snapshot.    |
| DELETE | `/api/v1/admin/ingredients/{id}`                         | Admin  | Archive ingredient.                  |
| POST   | `/api/v1/admin/ingredients/{id}/aliases`                 | Admin  | Thêm alias.                          |
| DELETE | `/api/v1/admin/ingredients/{id}/aliases/{aliasId}`       | Admin  | Xóa alias.                           |
| GET    | `/api/v1/food-data/ingredients/{ingredientId}/nutrients` | Public | Nutrient/100 g và provenance.        |
| GET    | `/api/v1/food-data/reference-intakes`                    | Public | RDA/UL theo population.              |
| GET    | `/api/v1/food-data/ingredient-guidelines`                | Public | Guideline lượng/tần suất ingredient. |
| GET    | `/api/v1/food-data/cooking-methods`                      | Public | Cooking methods + retention/yield.   |
| GET    | `/api/v1/food-data/interaction-rules`                    | Public | Interaction rules theo scope.        |
| GET    | `/api/v1/admin/food-data/records`                        | Admin  | List mọi loại food-data record.      |
| POST   | `/api/v1/admin/food-data/records`                        | Admin  | Tạo food-data record/suggestion.     |
| PUT    | `/api/v1/admin/food-data/records/{id}`                   | Admin  | Thay thế version record.             |
| DELETE | `/api/v1/admin/food-data/records/{id}`                   | Admin  | Archive/supersede record.            |
| POST   | `/api/v1/admin/food-data/imports/preview`                | Admin  | Validate/stage import.               |
| POST   | `/api/v1/admin/food-data/imports`                        | Admin  | Commit import idempotent.            |

### 10.4 Content, review và nutrition

| Method | Path                                       | Quyền                               | Chức năng                         |
| ------ | ------------------------------------------ | ----------------------------------- | --------------------------------- |
| GET    | `/api/v1/posts`                            | Optional/Auth theo OpenAPI consumer | Search/list published content.    |
| POST   | `/api/v1/posts`                            | Auth                                | Tạo Recipe/Blog/Video draft.      |
| GET    | `/api/v1/posts/{idOrSlug}`                 | Public                              | Xem detail theo UUID/slug.        |
| GET    | `/api/v1/posts/{id}/related`               | Optional/Auth                       | Related content sau hard filters. |
| PATCH  | `/api/v1/posts/{id}`                       | Owner                               | Tạo/sửa revision.                 |
| DELETE | `/api/v1/posts/{id}`                       | Owner                               | Soft-delete content.              |
| POST   | `/api/v1/posts/{id}/submit`                | Owner                               | Submit immutable revision.        |
| GET    | `/api/v1/posts/{id}/review-history`        | Owner/Admin                         | Xem lịch sử review.               |
| GET    | `/api/v1/review-queue/posts`               | Admin                               | List revision chờ review.         |
| PATCH  | `/api/v1/review-queue/posts/{id}/approve`  | Admin                               | Approve revision đủ điều kiện.    |
| PATCH  | `/api/v1/review-queue/posts/{id}/reject`   | Admin                               | Reject revision.                  |
| GET    | `/api/v1/admin/content-review`             | Admin                               | List submitted revisions.         |
| GET    | `/api/v1/admin/content-review/{id}`        | Admin                               | Xem immutable revision/evidence.  |
| PATCH  | `/api/v1/admin/content-review/{id}`        | Admin                               | Approve/reject với audit.         |
| POST   | `/api/v1/posts/{id}/nutrition/preview`     | Auth/đủ quyền                       | Preview nutrition không lưu.      |
| POST   | `/api/v1/posts/{id}/nutrition/recalculate` | Auth/đủ quyền                       | Tính và lưu estimate version mới. |
| GET    | `/api/v1/posts/{id}/nutrition/current`     | Auth/visibility                     | Current estimate.                 |
| GET    | `/api/v1/posts/{id}/nutrition/history`     | Auth/visibility                     | Estimate history.                 |
| GET    | `/api/v1/posts/{id}/nutrition/status`      | Auth/visibility                     | Freshness/AI-job status.          |

### 10.5 Community và moderation

| Method | Path                                   | Quyền  | Chức năng                     |
| ------ | -------------------------------------- | ------ | ----------------------------- |
| GET    | `/api/v1/posts/{id}/comments`          | Public | List comment threads.         |
| POST   | `/api/v1/posts/{id}/comments`          | Auth   | Tạo comment/reply.            |
| PATCH  | `/api/v1/comments/{id}`                | Owner  | Sửa comment.                  |
| DELETE | `/api/v1/comments/{id}`                | Owner  | Soft-delete comment.          |
| GET    | `/api/v1/posts/{id}/community-summary` | Auth   | Aggregate + viewer state.     |
| PUT    | `/api/v1/posts/{id}/vote`              | Auth   | Upvote idempotent.            |
| DELETE | `/api/v1/posts/{id}/vote`              | Auth   | Gỡ vote idempotent.           |
| PUT    | `/api/v1/posts/{id}/rating`            | Auth   | Upsert recipe rating.         |
| PUT    | `/api/v1/posts/{id}/bookmark`          | Auth   | Bookmark Recipe/Video.        |
| DELETE | `/api/v1/posts/{id}/bookmark`          | Auth   | Gỡ bookmark.                  |
| GET    | `/api/v1/users/me/bookmarks`           | Auth   | List bookmark của mình.       |
| POST   | `/api/v1/reports`                      | Auth   | Report post/comment.          |
| GET    | `/api/v1/admin/reports`                | Admin  | List/filter reports.          |
| PATCH  | `/api/v1/admin/reports/{id}/resolve`   | Admin  | Resolve report group/target.  |
| GET    | `/api/v1/admin/users`                  | Admin  | Search/filter users.          |
| PATCH  | `/api/v1/admin/users/{id}/status`      | Admin  | Lock/unlock/ban/unban/delete. |
| GET    | `/api/v1/admin/comments`               | Admin  | List comments moderation.     |
| PATCH  | `/api/v1/admin/comments/{id}/status`   | Admin  | Hide/restore comment.         |

### 10.6 Contributor

| Method | Path                                                 | Quyền | Chức năng                 |
| ------ | ---------------------------------------------------- | ----- | ------------------------- |
| POST   | `/api/v1/contributor-applications`                   | Auth  | Nộp đơn Contributor.      |
| GET    | `/api/v1/contributor-applications/me`                | Auth  | Lịch sử đơn của mình.     |
| GET    | `/api/v1/admin/contributor-applications`             | Admin | List/filter applications. |
| POST   | `/api/v1/admin/contributor-invitations`              | Admin | Tạo invitation PENDING.   |
| PATCH  | `/api/v1/admin/contributor-applications/{id}/review` | Admin | Approve/reject.           |
| PATCH  | `/api/v1/admin/contributors/{userId}/revoke`         | Admin | Thu hồi Contributor.      |

### 10.7 Recommendation và behavior

| Method | Path                                | Quyền          | Chức năng                            |
| ------ | ----------------------------------- | -------------- | ------------------------------------ |
| POST   | `/api/v1/behavior-events`           | Auth + consent | Ingest normalized event.             |
| GET    | `/api/v1/users/me/personalization`  | Auth           | Đọc consent.                         |
| PUT    | `/api/v1/users/me/personalization`  | Auth           | Bật/tắt consent.                     |
| DELETE | `/api/v1/users/me/behavior-history` | Auth           | Xóa lịch sử hành vi.                 |
| GET    | `/api/v1/recommendations/home`      | Auth           | Home recommendations đã hard-filter. |

### 10.8 Meal plans, analysis và programs

| Method | Path                                                | Quyền | Chức năng                          |
| ------ | --------------------------------------------------- | ----- | ---------------------------------- |
| POST   | `/api/v1/meal-plans/generate`                       | Auth  | Generate/regenerate weekly plan.   |
| GET    | `/api/v1/meal-plans`                                | Auth  | List plan versions của mình.       |
| GET    | `/api/v1/meal-plans/{id}`                           | Owner | Đọc plan.                          |
| DELETE | `/api/v1/meal-plans/{id}`                           | Owner | Soft-delete plan.                  |
| PATCH  | `/api/v1/meal-plans/{id}/items/{itemId}/swap`       | Owner | Swap slot an toàn.                 |
| PATCH  | `/api/v1/meal-plans/{id}/items/{itemId}/manual-add` | Owner | Add recipe/custom meal.            |
| POST   | `/api/v1/meal-plans/{id}/analyze`                   | Owner | Tạo analysis versioned.            |
| GET    | `/api/v1/meal-plans/{id}/analysis`                  | Owner | Đọc current analysis.              |
| POST   | `/api/v1/meal-programs`                             | Auth  | Tạo program 2–12 tuần.             |
| GET    | `/api/v1/meal-programs`                             | Auth  | List programs của mình.            |
| GET    | `/api/v1/meal-programs/{id}`                        | Owner | Detail/snapshots/analysis.         |
| PATCH  | `/api/v1/meal-programs/{id}`                        | Owner | Edit/regenerate/reanalyze/confirm. |

### 10.9 Storage và custom meals

| Method | Path                                                  | Quyền | Chức năng                      |
| ------ | ----------------------------------------------------- | ----- | ------------------------------ |
| GET    | `/api/v1/storage/me`                                  | Auth  | Usage/quota hiện tại.          |
| POST   | `/api/v1/uploads/reservations`                        | Auth  | Reserve quota + signed upload. |
| POST   | `/api/v1/uploads/reservations/{id}/commit`            | Owner | Verify và commit upload.       |
| DELETE | `/api/v1/uploads/reservations/{id}`                   | Owner | Release reservation.           |
| DELETE | `/api/v1/storage/assets/{id}`                         | Owner | Xóa durable provider asset.    |
| GET    | `/api/v1/admin/storage/accounts`                      | Admin | List usage/effective limit.    |
| GET    | `/api/v1/admin/storage/policies`                      | Admin | List policies.                 |
| PATCH  | `/api/v1/admin/storage/policies/{id}`                 | Admin | Sửa policy versioned.          |
| POST   | `/api/v1/admin/storage/accounts/{userId}/adjustments` | Admin | Điều chỉnh quota có audit.     |
| GET    | `/api/v1/admin/storage/adjustments`                   | Admin | List immutable adjustments.    |
| GET    | `/api/v1/custom-meals`                                | Auth  | List/filter món riêng.         |
| POST   | `/api/v1/custom-meals`                                | Auth  | Tạo món riêng.                 |
| GET    | `/api/v1/custom-meals/{id}`                           | Owner | Detail món.                    |
| PATCH  | `/api/v1/custom-meals/{id}`                           | Owner | Sửa món.                       |
| DELETE | `/api/v1/custom-meals/{id}`                           | Owner | Soft-delete theo policy.       |
| POST   | `/api/v1/custom-meals/{id}/photos`                    | Owner | Attach committed asset.        |
| DELETE | `/api/v1/custom-meals/{id}/photos/{assetId}`          | Owner | Detach ảnh.                    |
| PUT    | `/api/v1/custom-meals/{id}/photos/order`              | Owner | Reorder ảnh.                   |

### 10.10 Pantry, fridge, receipt và shopping gap

| Method | Path                                                                | Quyền | Trạng thái    | Chức năng                      |
| ------ | ------------------------------------------------------------------- | ----- | ------------- | ------------------------------ |
| GET    | `/api/v1/pantry/items`                                              | Auth  | `READY`       | List/filter Pantry.            |
| POST   | `/api/v1/pantry/items`                                              | Auth  | `READY`       | Tạo manual confirmed item.     |
| GET    | `/api/v1/pantry/items/expiring-soon`                                | Auth  | `READY`       | List sắp hết hạn quan sát.     |
| GET    | `/api/v1/pantry/items/{id}`                                         | Owner | `READY`       | Detail item.                   |
| PATCH  | `/api/v1/pantry/items/{id}`                                         | Owner | `READY`       | Update observations/versioned. |
| DELETE | `/api/v1/pantry/items/{id}`                                         | Owner | `READY`       | Soft-delete/versioned.         |
| GET    | `/api/v1/pantry/items/{id}/adjustments`                             | Owner | `READY`       | Immutable ledger.              |
| POST   | `/api/v1/pantry/items/{id}/adjustments`                             | Owner | `READY`       | Consume/restore/adjust.        |
| POST   | `/api/v1/pantry/merge-preview`                                      | Owner | `READY`       | Preview merge.                 |
| POST   | `/api/v1/pantry/merge`                                              | Owner | `READY`       | Atomic idempotent merge.       |
| POST   | `/api/v1/ingredient-recognition/jobs`                               | Auth  | `IN_PROGRESS` | Tạo multi-image job.           |
| GET    | `/api/v1/ingredient-recognition/jobs/{id}`                          | Owner | `IN_PROGRESS` | Progress/candidates/evidence.  |
| PATCH  | `/api/v1/ingredient-recognition/jobs/{id}/candidates/{candidateId}` | Owner | `IN_PROGRESS` | Sửa/reject candidate.          |
| POST   | `/api/v1/ingredient-recognition/jobs/{id}/confirm`                  | Owner | `IN_PROGRESS` | Xác nhận và áp Pantry diff.    |
| POST   | `/api/v1/ingredient-recognition/jobs/{id}/cancel`                   | Owner | `IN_PROGRESS` | Cancel unconfirmed job.        |
| POST   | `/api/v1/ingredient-recognition/jobs/{id}/retry`                    | Owner | `IN_PROGRESS` | Retry failed/partial job.      |
| POST   | `/api/v1/receipt-jobs`                                              | Auth  | `IN_PROGRESS` | Tạo receipt extraction job.    |
| GET    | `/api/v1/receipt-jobs/{id}`                                         | Owner | `IN_PROGRESS` | Progress/metadata/candidates.  |
| PATCH  | `/api/v1/receipt-jobs/{id}/candidates/{candidateId}`                | Owner | `IN_PROGRESS` | Sửa/reject line.               |
| POST   | `/api/v1/receipt-jobs/{id}/confirm`                                 | Owner | `IN_PROGRESS` | Xác nhận và áp Pantry diff.    |
| POST   | `/api/v1/receipt-jobs/{id}/cancel`                                  | Owner | `IN_PROGRESS` | Cancel job.                    |
| POST   | `/api/v1/receipt-jobs/{id}/retry`                                   | Owner | `IN_PROGRESS` | Retry failed/partial job.      |
| POST   | `/api/v1/shopping-lists/preview`                                    | Auth  | `READY`       | Pantry-aware shopping gaps.    |

### 10.11 Chat và AI review

| Method | Path                                      | Quyền             | Chức năng                           |
| ------ | ----------------------------------------- | ----------------- | ----------------------------------- |
| POST   | `/api/v1/chat/sessions`                   | Optional          | Tạo private session guest/member.   |
| GET    | `/api/v1/chat/sessions`                   | Optional/identity | List sessions của identity.         |
| GET    | `/api/v1/chat/sessions/{id}/messages`     | Optional/owner    | Message history.                    |
| POST   | `/api/v1/chat/sessions/{id}/messages`     | Optional/owner    | Stream SSE answer.                  |
| POST   | `/api/v1/chat/messages/{id}/feedback`     | Optional/owner    | Upsert feedback.                    |
| POST   | `/api/v1/ai-artifacts`                    | Auth              | Lưu immutable private artifact.     |
| PATCH  | `/api/v1/ai-artifacts/{id}/visibility`    | Owner             | Share/unshare.                      |
| POST   | `/api/v1/ai-artifacts/{id}/submit`        | Owner             | Submit verification.                |
| GET    | `/api/v1/ai-artifacts/public`             | Public            | List privacy-safe public artifacts. |
| POST   | `/api/v1/ai-artifacts/{id}/verifications` | Contributor/Admin | Verify; cấm self-review.            |
| PATCH  | `/api/v1/admin/ai-verifications/{id}`     | Admin             | Override/revoke có audit.           |

### 10.12 Restaurants và location

| Method | Path                                     | Quyền                        | Chức năng                                |
| ------ | ---------------------------------------- | ---------------------------- | ---------------------------------------- |
| GET    | `/api/v1/restaurants/nearby`             | Public/optional user context | Nearby internal/provider places.         |
| GET    | `/api/v1/restaurants/search`             | Public/optional user context | Search theo query/location.              |
| GET    | `/api/v1/restaurants/mine`               | Auth                         | Submission/history của mình.             |
| GET    | `/api/v1/restaurants/{id}`               | Public                       | Detail approved/internal/external place. |
| POST   | `/api/v1/restaurants`                    | Auth                         | Submit untrusted place.                  |
| GET    | `/api/v1/location/geocode`               | Public                       | Geocode địa chỉ nhập tường minh.         |
| GET    | `/api/v1/admin/restaurants`              | Admin                        | Review queue.                            |
| GET    | `/api/v1/admin/restaurants/{id}/history` | Admin                        | Immutable audit history.                 |
| PATCH  | `/api/v1/admin/restaurants/{id}/review`  | Admin                        | Approve/reject.                          |
| PATCH  | `/api/v1/admin/restaurants/{id}`         | Admin                        | Sửa internal reviewed data.              |

### 10.13 Notifications và AI governance

| Method | Path                                  | Quyền | Chức năng                              |
| ------ | ------------------------------------- | ----- | -------------------------------------- |
| GET    | `/api/v1/notifications`               | Auth  | List own active notifications.         |
| GET    | `/api/v1/notifications/unread-count`  | Auth  | Đếm unread.                            |
| PATCH  | `/api/v1/notifications/read-all`      | Auth  | Mark all visible as read.              |
| PATCH  | `/api/v1/notifications/{id}/read`     | Owner | Mark one as read.                      |
| GET    | `/api/v1/admin/ai/requests`           | Admin | Redacted request/event logs.           |
| GET    | `/api/v1/admin/ai/metrics`            | Admin | Aggregated quality/usage metrics.      |
| GET    | `/api/v1/admin/ai/flags`              | Admin | AI moderation signals.                 |
| GET    | `/api/v1/admin/ai/features`           | Admin | Effective provider controls/fallbacks. |
| GET    | `/api/v1/admin/ai/features/audit`     | Admin | Control audit history.                 |
| PATCH  | `/api/v1/admin/ai/features/{feature}` | Admin | Versioned toggle có reason.            |
| GET    | `/api/v1/admin/ai/health`             | Admin | 24-hour AI health summary.             |

Ngoài `/api/v1`, BE còn phục vụ:

| Method | Path             | Chức năng         |
| ------ | ---------------- | ----------------- |
| GET    | `/api-docs`      | Swagger UI.       |
| GET    | `/api-docs.json` | OpenAPI 3.1 JSON. |

## 11. Những gì chưa có hoặc chưa được phép tuyên bố

Các mục sau không phải capability MVP production-ready:

- Fridge vision và receipt OCR trên ảnh thật: route có nhưng vẫn `IN_PROGRESS` cho đến khi real-image evaluation đạt.
- Wearable/HealthKit/Health Connect và tự thu thập dữ liệu sức khỏe.
- Thanh toán hoặc mua thêm storage quota.
- Tích hợp Shopee; tag `shopee` chỉ là metadata.
- Tự động tóm tắt video, fingerprint bản quyền, formal DMCA workflow, frame/audio moderation nâng cao.
- Xác minh certificate/chuyên môn Contributor.
- Clinical diagnosis, đảm bảo an toàn thực phẩm hoặc canonical hóa tự động từ AI.
- Email, push hoặc SMS notification.
- AI tự publish, tự ban, tự hard-delete hoặc tự tạo hard health rule.
- Advanced embeddings/GenAI ranking và mature AI evaluation platform thuộc roadmap sau MVP.

## 12. Rủi ro/release gate còn mở

Theo release checklist hiện hành:

1. **P0:** Chưa đánh giá OpenAI vision/receipt với bộ ảnh tủ lạnh và hóa đơn Việt Nam đại diện; giữ hai capability tắt ở shared/production cho đến khi đạt.
2. **P1:** Cần rehearsal migration Contributor trên snapshot legacy đã scrub để kiểm tra rejected application cũ có reviewer null.
3. **P1:** OpenAPI đã kiểm tra cấu trúc nhưng chưa semantic-validate toàn bộ examples/error responses.
4. **P2:** Chưa có load/query-plan/retention/backup-restore test với dữ liệu quy mô production.

Vì các mục này, tài liệu không gọi Phase 27 là hoàn tất và không nâng fridge/receipt jobs lên `READY`.

## 13. Tài liệu liên quan

- `../../docs/SRS.md` — yêu cầu sản phẩm chuẩn.
- `../../docs/IMPLEMENTATION_PLAN.md` — business rules, state machine và Definition of Done.
- `IMPLEMENTATION_PHASES.md` — phase map và completion record.
- `../../frontend/docs/BACKEND_INTEGRATION.md` — endpoint readiness và contract notes sống.
- `RELEASE_CHECKLIST.md` — release gate/rủi ro còn mở.
- `BUSINESS_RULES.md` — đặc tả business rule chi tiết; nếu có điểm legacy mâu thuẫn, ưu tiên SRS/Implementation Plan và hành vi source hiện hành.
- `AI_GOVERNANCE.md` — vận hành, retention và fallback AI.
- `SEARCH_PERFORMANCE.md` — search indexes/query-plan evidence.
- `../openapi.json` — contract OpenAPI generated hiện tại.
