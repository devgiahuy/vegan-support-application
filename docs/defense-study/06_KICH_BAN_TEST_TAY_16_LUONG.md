# Bộ chạy test tay 16 luồng nghiệp vụ

**Ngày đối chiếu source/registry:** 24/10/2026; bổ sung luồng hóa đơn 25/10/2026. Đây là **kịch bản để tự chạy**, chưa phải biên bản PASS. Luồng L01–L16 khớp [danh mục nghiệp vụ](02_LUONG_NGHIEP_VU.md). Sau mỗi lần checkout/seed lại, kiểm tra [registry](../../frontend/docs/BACKEND_INTEGRATION.md) và [phase gate](../../backend/docs/IMPLEMENTATION_PHASES.md).

## 1. Chuẩn bị môi trường và cách ghi kết quả

Chạy trên **database demo riêng**, chụp snapshot trước khi thử các ca sửa/xóa/duyệt. `npm run seed` là idempotent nhưng cập nhật fixture đã biết; không chạy lại giữa chừng nếu đang đo trước/sau. Không đưa mật khẩu, token, khóa provider hay ảnh hóa đơn thật vào tài liệu/ảnh chụp.

1. Yêu cầu Node.js ≥22, npm ≥10, MongoDB 7 replica set. Từ `backend/`, tạo `.env` theo `.env.example`, đặt `SEED_MEMBER_PASSWORD` và `SEED_ADMIN_PASSWORD` **khác nhau**. Cách gọn nhất cho demo: `docker compose -f docker-compose.yml up --build` (API và MongoDB được khởi tạo/seed). Nếu chạy backend trên máy, làm đúng phần *Local setup* trong [backend README](../../backend/README.md), gồm `prisma:generate`, `prisma:push`, `seed`, rồi `npm run dev`.
2. Mở `http://localhost:4000/api/v1/health` (phải khỏe) và `http://localhost:4000/api-docs` (Swagger). Từ `frontend/`, đặt `.env.local` theo `.env.example` (`NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1`), `npm ci`, `npm run dev`; mở `http://localhost:3000`. Giữ cùng hostname `localhost` cho web/API để tránh lỗi cookie. Nếu môi trường đã chạy, bỏ qua cài đặt/seed.
3. Mở DevTools → **Network**, bật *Preserve log*. Với mỗi bước ghi: status HTTP, `code` lỗi nếu có, ID/version trả về, và ảnh UI trước/sau reload. Toast thành công một mình **không** chứng minh DB đã đổi. Với thao tác chưa có màn hình web, dùng Swagger `/api-docs`: đăng nhập để lấy access token theo contract, bấm **Authorize**, mở đúng operation và dùng schema/request example hiện tại. Không đoán tên field JSON.
4. Đặt nhãn mỗi ca: `PASS` = UI/API và trạng thái sau reload đều đúng; `FAIL` = lệch kỳ vọng; `BLOCKED` = thiếu provider/credential/quyền/ảnh phù hợp; `NOT_RUN` = chưa chạy. Ghi lý do và bằng chứng, không biến `BLOCKED` thành `PASS`.

### Bộ dữ liệu dùng chung

Thay `R` bằng mã riêng mỗi lần chạy, ví dụ `MT2410A`. Tạo hai tài khoản mới qua UI; mật khẩu tự đặt và giữ riêng. Tài khoản seed lấy mật khẩu từ `.env`, **không phải** giá trị mẫu của `.env.example`.

| Ký hiệu | Dữ liệu | Vai trò / mục đích |
|---|---|---|
| A | `test.R.a@example.com` | Member mới, chủ dữ liệu; nên bắt đầu với hồ sơ trống. |
| B | `test.R.b@example.com` | Member khác, kiểm tra owner và bình luận/report. |
| ADM | `SEED_ADMIN_EMAIL` (mặc định `admin@example.com`) | Admin duyệt; mật khẩu `SEED_ADMIN_PASSWORD`. Không dùng để tự duyệt nội dung của ADM. |
| C | `SEED_PLATFORM_CONTRIBUTOR_EMAIL` (xem `.env`) | Contributor đã duyệt; dùng kiểm tra quyền/thẩm định người khác. |
| S | `SEED_MEMBER_EMAIL` (mặc định `member@example.com`) | Fixture có sẵn health, diet `VEGAN`, dị ứng `PEANUT`, Pantry và meal plan 21 slot; tránh sửa dữ liệu này khi muốn demo seed nguyên vẹn. |

**Input cố định cho A:** cao 170 cm, nặng 68 kg, tuổi 27, giới tính nam, vận động `MODERATELY_ACTIVE`; diet `VEGAN`, lịch `PERMANENT`, tradition `NONE`, dị ứng `PEANUT`, loại trừ `Đậu phộng rang`; mục tiêu plan `MAINTAIN`, tuần bắt đầu **thứ Hai 26/10/2026**. Nếu UI đòi ngày sinh thay tuổi, chọn ngày cho ra tuổi phù hợp rồi ghi tuổi backend thực tế. Những giá trị này là dữ liệu test, không là khuyến nghị sức khỏe.

**Catalog seed để đối chứng:** `goi-cuon-chay-ngu-sac` và `yen-mach-qua-dem-chuoi-chia` có `PEANUT`; `sup-bi-do-kem-dua`, `salad-bo-dau-ga`, `chao-quinoa-bi-do-hat-bi` không khai báo allergen. Chọn theo **slug/tên và response hiện có**; seed có thể đổi. Nguyên liệu seed: `Gạo lứt huyết rồng`, `Đậu hũ trắng`, `Nấm bào ngư xám`, `Đậu phộng rang`. Gạo lứt của S có sẵn 2.000 g, nên bài toán số lượng độc lập hãy dùng A.

**Ảnh test:** chuẩn bị `fridge-1.jpg` (chỉ một quả cà rốt và một bông cải trên nền rõ), `fridge-2.jpg` (cùng rau, góc chụp khác), `receipt-1.jpg` (hóa đơn giả in rõ `Cà rốt 2 kg`, `Gạo lứt 1 kg`, `Nước rửa chén 1 chai`) và `receipt-2.jpg` (chụp lại **cùng** hóa đơn), mỗi file JPEG hợp lệ dưới giới hạn upload cấu hình; thêm một `.txt` đổi đuôi `.jpg` để thử MIME. Dùng hóa đơn tự tạo, không chứa tên/số điện thoại/thẻ thật. Kết quả AI thật có thể khác chữ mong đợi; điều cần chứng minh là **user được sửa/xác nhận** và Pantry không đổi trước confirm.

**Thứ tự chạy khuyên dùng:** L01 → L02 → L05 → L03 → L04 → L06 → L07 → L09 → L08 → L11 → L10 → L12 → L13 → L14 → L15 → L16. L09 trước L08 để có món cá nhân. Giữ một bài đã public cho L04/L06 và một tài khoản B chưa có quyền để thử owner.

## 2. Kịch bản chi tiết

### L01 — Đăng ký, đăng nhập, refresh, đăng xuất

- **Dữ liệu:** A, B; email A viết hoa một lần để kiểm tra chuẩn hóa; mật khẩu sai tùy ý.
- **Chạy:** (1) Ở `/login` mở đăng ký và tạo A/B, đăng nhập A. (2) Reload, mở `/profile`, ghi `role` từ `GET /users/me`. (3) Đăng xuất rồi quay lại `/profile`. (4) Đăng nhập lại. Trong Network quan sát `POST /auth/login`, `POST /auth/refresh` khi phiên cần làm mới, `POST /auth/logout`.
- **Đạt:** A/B là `MEMBER`; trang riêng chỉ vào được khi đã login; logout làm phiên hiện tại mất quyền. Không cần chờ 15 phút chỉ để chứng minh refresh: nếu không tự phát sinh, ghi `NOT_RUN` cho nhánh rotation hoặc dùng Swagger/cookie trong môi trường demo theo contract. Không copy refresh token ra tài liệu.
- **Ca lỗi:** đăng nhập mật khẩu sai trả `INVALID_CREDENTIALS`; đăng ký lại cùng email trả `EMAIL_ALREADY_EXISTS`. Kiểm tra UI không hiện “thành công” khi response lỗi.

### L02 — Hồ sơ sức khỏe, diet và lịch chay

- **Dữ liệu:** hồ sơ A ở trên; B để trống làm đối chứng.
- **Chạy:** A mở `/profile`, lưu health → reload và ghi BMI/BMR/TDEE do backend trả. Chọn `VEGAN`, `PERMANENT`, `NONE`, `PEANUT`, nguyên liệu loại trừ; xem preview rule rồi xác nhận/lưu → reload. Nếu muốn thử lịch định kỳ, dùng **B**: `PERIODIC`, `BUDDHIST`, ngày thực hành cụ thể `2026-10-26`; xác nhận rule bật trước khi lưu.
- **Đạt:** số đo, dị ứng, exclusion, lịch và rule version được giữ sau reload. BMR/TDEE do server tính; đổi tradition không xóa dị ứng. Với B chưa điền health, L08 phải báo thiếu hồ sơ.
- **Ca lỗi:** trường thiếu/ngoài khoảng bị từ chối; lịch định kỳ chưa đủ ngày/rule chưa xác nhận không được suy đoán tự động.

### L03 — Tạo nội dung, revision, kiểm duyệt

- **Dữ liệu:** A tạo recipe `R - Cơm gạo lứt bí đỏ`, mô tả `Bài test duyệt`, 2 servings, nguyên liệu seed `Gạo lứt huyết rồng 200 g`, `Bí đỏ hồ lô 150 g`; ảnh chỉ thêm nếu upload hoạt động. Bài blog/video có thể làm vòng lặp riêng nếu đủ thời gian.
- **Chạy:** `/recipes/new` → lưu nháp → ghi post ID/revision/version → submit. ADM mở `/admin` hoặc queue review (Swagger `GET /admin/content-review` nếu UI không lộ) → mở đúng revision, approve kèm lý do `Đã xem dữ liệu test R`. Guest mở `/recipes/[id]`. A sửa tiêu đề thành `R - Cơm gạo lứt bí đỏ bản 2`, lưu/submit revision mới; guest xem trước và sau khi ADM duyệt lần hai.
- **Đạt:** draft/pending không công khai; sau approve bản 1 public; lúc bản 2 chờ, guest vẫn thấy bản 1; sau approve mới thấy bản 2. Contributor C submit cũng đi `PENDING_REVIEW`, không auto publish.
- **Ca lỗi:** A dùng version cũ → `CONTENT_VERSION_CONFLICT`; A/ADM tự duyệt bài của chính mình phải bị chặn. AI flag chỉ là tín hiệu, không tự xóa bài.

### L04 — Bình luận, vote/rating/bookmark, report

- **Dữ liệu:** recipe public của L03; A chủ bài, B người tương tác.
- **Chạy:** B mở recipe → thêm comment `R - món dễ nấu`; vote; rating taste/difficulty; bookmark. Reload, đối chiếu summary và bookmark của B. B report bài với lý do test. ADM xem report/moderation queue và quyết định có lý do; lưu ID decision.
- **Đạt:** chỉ bài public nhận tương tác; một user không tăng vote vô hạn khi bấm lặp; bookmark/rating gắn đúng user; report tạo tín hiệu, bài vẫn có audit và không hard delete ngay. Comment của B chỉ B được sửa/xóa.
- **Ca lỗi:** A thử sửa comment B → 403; B report trùng hoặc spam → backend trả lỗi/dedupe theo contract; thao tác lên draft của L03 bị từ chối.

### L05 — Ứng tuyển Contributor

- **Dữ liệu:** B là Member; claim `PLATFORM_TRACK_RECORD`, kinh nghiệm `Đăng 5 món chay tại cộng đồng test R`, link `https://example.com/portfolio-R`. Dùng A làm người nộp nếu B đang dùng trong L04; phải giữ một Member chưa được duyệt cho ca âm.
- **Chạy:** B nộp tại hồ sơ/Contributor; xem `GET /contributor-applications/me`. ADM mở danh sách ứng tuyển, review và **approve** với basis/lý do; B đăng xuất/đăng nhập lại, xem role từ `/users/me` rồi mở `/contributor/dashboard`.
- **Đạt:** lúc `PENDING`, B vẫn `MEMBER`; sau quyết định backend mới trả `CONTRIBUTOR`; basis chỉ là căn cứ xét, không chia quyền. Ghi notification quyết định nếu có.
- **Ca lỗi:** gửi đơn thứ hai khi đang pending → `CONTRIBUTOR_APPLICATION_PENDING`. Nếu muốn thử reject và cooldown 30 ngày, dùng **tài khoản mới C2**, không reject B sau khi đã approve. Member không được tự tạo `ADMIN_INVITED`; cùng người không tự approve.

### L06 — Tìm kiếm và gợi ý có ràng buộc

- **Dữ liệu:** A `VEGAN` + `PEANUT`; recipe seed có/không `PEANUT` ở bảng trên.
- **Chạy:** Guest `/search` tìm `gỏi cuốn`; ghi kết quả public. A đăng nhập, cùng truy vấn rồi mở `/recipes`/gợi ý. Bật personalization consent, tạo vài hành vi xem/bấm, reload recommendations. Tắt consent và thử lại. So sánh ID/slug trả về, không chỉ thẻ UI.
- **Đạt:** món `goi-cuon-chay-ngu-sac` có `PEANUT` không lọt vào kết quả **cá nhân hóa có áp dụng constraints của A**; món an toàn có thể xuất hiện. Ranking không tái đưa món bị loại. Tắt consent không tạo behavior event mới; guest không dùng lịch sử A. Truy vấn quá hẹp có thể rỗng, không tự nới dị ứng.
- **Ca lỗi:** kiểm tra `GET /recommendations/home`/search khi A không đủ profile hoặc consent; ghi nguyên `reasonCode`/empty state. Nếu UI public search cho Guest vẫn hiển thị gỏi cuốn, đó không chứng minh vi phạm filter của A.

### L07 — Catalog thực phẩm và dinh dưỡng recipe

- **Dữ liệu:** `Gạo lứt huyết rồng`, recipe L03 và recipe seed `sup-bi-do-kem-dua`.
- **Chạy:** xem `/recipes/[id]` và chi tiết nguyên liệu; trong Swagger gọi `GET /food-data/ingredients/{ingredientId}/nutrients`, `GET /food-data/cooking-methods` (lấy ID ingredient từ catalog), rồi `GET /posts/{id}/nutrition/current` và `POST /posts/{id}/nutrition/preview`. Ghi `source`, `version`, `confidence`, `coverage`, `assumptions`, calories/macro và servings trước/sau đổi lượng/phương pháp nếu UI hỗ trợ. ADM xem record staging/canonical tại `/admin`.
- **Đạt:** các endpoint này đang `READY` trong registry; số liệu có provenance và độ phủ; thiếu nutrient/conversion hiện là thiếu/chưa rõ, không được đổi thành số 0 chắc chắn. Dữ liệu AI đề xuất không tự biến thành canonical.
- **Ca lỗi:** dùng ingredient không có quy đổi hoặc một đơn vị không hỗ trợ; ghi `uncovered`/confidence hoặc error thay vì khẳng định chính xác.

### L08 — Kế hoạch tuần và phân tích bữa ăn

- **Dữ liệu:** A đã hoàn thành L02; tuần `2026-10-26`, goal `MAINTAIN`; B chưa có health làm ca âm.
- **Chạy:** `/meal-plans` tạo tuần. Mở detail, đếm **7 ngày × 3 slot**, chụp target và 4 macro ở slot/ngày; ghi plan ID/version. Swap một món trong ngày, thêm recipe/món cá nhân từ L09 nếu UI cho phép; phân tích lại và xem shopping list. Sau khi sửa plan, thử mở analysis cũ trước khi tính lại.
- **Đạt:** có 21 slot; slot có thể `UNFILLED` kèm reason nếu thiếu candidate an toàn. Không có recipe PEANUT cho A; target có liên hệ TDEE × goal factor, macro theo servings. Sửa plan tăng version; analysis cũ báo stale hoặc cần tính lại, không âm thầm dùng tiếp.
- **Ca lỗi:** B generate thiếu health → `HEALTH_PROFILE_INCOMPLETE`; dùng version cũ để swap → `MEAL_PLAN_VERSION_CONFLICT`; chọn món vi phạm PEANUT bị chặn. Không coi `UNFILLED` là lỗi hệ thống nếu đã có reason rõ.

### L09 — Món cá nhân và chương trình nhiều tuần

- **Dữ liệu:** A tạo `R - Cháo bí đỏ cá nhân`, nguyên liệu `Gạo lứt huyết rồng 100 g`, `Bí đỏ hồ lô 200 g`, 2 servings, tag `shopee` chỉ là nhãn. Chương trình tên `R - Hai tuần thử nghiệm`, tuần bắt đầu `2026-10-26` và `2026-11-02`.
- **Chạy:** `/custom-meals/new` → lưu, reload detail, sửa servings/tag, kiểm tra private bằng B. Thêm món vào plan của A. Tạo chương trình 2 tuần tại `/meal-programs/new` **nếu UI/contract hiện hỗ trợ**; nếu trang không có thao tác đầy đủ, chạy `POST /meal-programs` qua Swagger theo schema đang phục vụ; chọn phương án, xác nhận, reload.
- **Đạt:** custom meal chỉ owner thấy/sửa; tag `shopee` không tạo đơn mua hay gọi Shopee. Program 2–12 tuần lưu snapshot/version; sau confirm, hành động không hợp lệ bị chặn. Ghi `FE integrated = No` cho program nếu registry vẫn vậy: API PASS không đồng nghĩa web PASS.
- **Ca lỗi:** B mở/sửa món của A → 403/404 theo contract; thử xóa món đang được plan dùng để xem policy bảo toàn; version cũ của program → conflict.

### L10 — Upload media và quota

- **Dữ liệu:** `fridge-1.jpg` và file giả `.jpg`; tài khoản A.
- **Chạy:** mở trang tạo recipe hoặc `/pantry/scan`, ghi `GET /storage/me` (used/reserved/limit). Upload ảnh hợp lệ và quan sát 3 bước `POST /uploads/reservations` → Cloudinary → `POST .../commit`; reload storage usage. Tạo một reservation rồi **hủy trước upload** nếu UI/Swagger hỗ trợ. Dùng file sai MIME và file vượt ngưỡng cấu hình để kiểm tra từ chối.
- **Đạt:** asset committed có owner và used bytes tăng; reservation hủy/expire giải phóng reserved bytes; file sai MIME/quota trả lỗi, không có asset mới. Một ảnh đã được scan job tham chiếu có thể bị chặn xóa. Cần Cloudinary credential hoạt động; thiếu thì ghi `BLOCKED` cho upload thật, vẫn kiểm tra metadata/quota read.
- **Ca lỗi:** cố commit hai lần cùng key hoặc commit sai bytes/provider; ghi `UPLOAD_*`/`STORAGE_*` code từ response. Không upload lại liên tục khi request timeout trước khi kiểm tra reservation/asset.

### L11 — Pantry, adjustment ledger và merge

- **Dữ liệu:** A tạo `Gạo lứt huyết rồng` **1.000 g** (item P1); tạo bản ghi thứ hai cùng ingredient **250 g** (P2), nếu UI gộp tự động thì dùng Swagger theo contract để tạo item riêng.
- **Chạy:** `/pantry` ghi ban đầu; với P1 consume **200 g** rồi restore **50 g**; mở ledger. Gọi merge preview P1+P2, chụp projected quantity, rồi confirm merge đúng version. Reload danh sách.
- **Đạt:** P1 trước merge = **850 g**; merge hợp lệ với P2 = **1.100 g** ở item đích (nếu không có adjustment khác); ledger ghi từng lần; preview chưa sửa DB; item nguồn sau merge không còn active. Owner B không xem/sửa item A.
- **Ca lỗi:** consume 2.000 g từ P1 bị chặn, không âm; unit không quy đổi được thì merge/preview báo `PANTRY_UNIT_CONVERSION_UNAVAILABLE`; version cũ trả `PANTRY_VERSION_CONFLICT`. Không dùng ngày hết hạn như chứng cứ an toàn thực phẩm.

### L12 — Quét tủ lạnh nhiều ảnh (`IN_PROGRESS`)

- **Điều kiện:** `VISION_ENABLED` bật, provider fake để test state machine hoặc OpenAI + Cloudinary HTTPS hợp lệ để kiểm tra ảnh thật. Docker Compose mặc định **tắt** vision; mobile còn guard development. Nếu thiếu điều kiện, đánh `BLOCKED`, không gọi là lỗi nghiệp vụ.
- **Dữ liệu:** `fridge-1.jpg`, `fridge-2.jpg`, cùng một file lặp, 7 ảnh để thử giới hạn.
- **Chạy:** từ `/pantry/scan`, upload/commit ảnh theo L10 → tạo job với ảnh 1, ghi Pantry trước và job ID/version. Đợi terminal `READY`/`PARTIAL_FAILED`/`FAILED`; kiểm tra candidate và evidence, sửa tên/quantity hoặc reject một candidate. Thêm ảnh 2 vào **job chưa confirm** nếu UI có nút, nếu không thì operation `POST /ingredient-recognition/jobs/{id}/images` qua Swagger; reload. Cuối cùng chọn candidate hợp lệ và **confirm**; kiểm tra Pantry diff và số item sau reload.
- **Đạt:** tạo/xem/retry/thêm ảnh/sửa **chưa** đổi Pantry; confirm một lần mới đổi. Ảnh trùng ETag không nhân đôi; edit/reject đã làm không bị ảnh mới ghi đè; quá 6 ảnh bị chặn. Job partial failure vẫn có thể xem phần thành công; retry chỉ ảnh lỗi.
- **Ca lỗi:** thử confirm lại, thêm ảnh sau confirm, dùng version cũ hoặc job của B; ghi state/version/owner error. Provider fail không được mô tả là “AI đã nhận dạng chính xác”.

### L13 — Quét hóa đơn (`IN_PROGRESS`) và danh sách thiếu mua (`READY`)

- **Điều kiện:** receipt provider bật và upload thật như L12; Compose mặc định **tắt** receipt. Không cần provider để test shopping preview.
- **Dữ liệu:** `receipt-1.jpg`, `receipt-2.jpg` là cùng hóa đơn; A có Pantry P1 sau L11; chọn recipe `sup-bi-do-kem-dua` và servings 2.
- **Chạy hóa đơn:** `/receipts/scan` upload/commit ảnh 1 → tạo job → ghi Pantry trước. Xem `notices[]`/`excludedItems[]` cho `Nước rửa chén`; nếu AI loại nhầm một thực phẩm, sửa decision thành `KEEP` rồi review lại. Sửa một line/quantity/giá, reject một line sai, thêm ảnh 2 vào job chưa confirm qua UI hoặc Swagger, xem line đã gộp. Confirm phần đã chọn → so Pantry sau reload. Với provider fake, dùng kết quả fixture làm bài test state/confirm, **không** coi là OCR ảnh thật.
- **Đạt:** chưa confirm Pantry không đổi; hàng phi thực phẩm bị loại khỏi candidates nhưng owner có thể khôi phục khi AI sai; dòng giống nhau giữa hai ảnh của **cùng hóa đơn** không cộng đôi; dòng lặp thật trong **cùng** ảnh có thể vẫn là hai dòng; confirm chỉ cộng line được chọn. Một job/hóa đơn lặp lại chính xác không tăng Pantry lần nữa; nếu hai lần mua chỉ trùng một phần, backend yêu cầu `identityDecisionRequired` và quyết định `SAME_RECEIPT` hoặc `SEPARATE_RECEIPTS` trước confirm. Cùng tên sản phẩm ở hai ngày mua khác nhau vẫn có thể là hai lần mua thật. Quá 4 ảnh, version cũ, owner khác hoặc add sau confirm phải bị chặn.
- **Chạy shopping:** ở `/receipts` hoặc meal plan shopping, chọn recipe + servings, gọi `POST /shopping-lists/preview` nếu cần; ghi `required`, `available`, `missing`, `unresolvedItems`. Tăng Pantry một nguyên liệu rồi preview lại.
- **Đạt shopping:** missing giảm tương ứng với tồn kho **confirmed và quy đổi được**; unresolved tách riêng, không giả định hóa đơn cũ vẫn còn trong kho.

### L14 — Chat AI, lưu/chia sẻ artifact và thẩm định

- **Dữ liệu:** A hỏi `Với dị ứng đậu phộng, tôi nên kiểm tra thành phần món gỏi cuốn thế nào?`; C là Contributor đã duyệt. Không nhập dữ liệu bệnh án thật.
- **Chạy:** Guest thử chat tại `/assistant`, rồi A tạo session và gửi câu hỏi, quan sát SSE/final state. Ghi quota trước/sau từ entitlement/chat response. Nếu UI hỗ trợ, lưu **output đủ điều kiện** thành AI artifact, chuyển visibility, submit verification; C (khác owner) đánh giá với evidence; ADM kiểm tra override/revoke. Dùng `/assistant/public` hoặc Swagger các operation `/ai-artifacts/*` để đối chứng.
- **Đạt:** câu trả lời là tư vấn, không sửa diet/Pantry/canonical data; session A chỉ A xem. Chỉ phản hồi hoàn tất thành công mới tính lượt; provider fallback/fail phải ghi trạng thái thực, không gọi là live AI. Artifact chỉ chia sẻ field theo allowlist; verification có reviewer/version/evidence nhưng không thành chứng nhận khoa học. Lưu ý `PATCH /chat/messages/{id}/share` riêng còn `PLANNED`; dùng luồng `/ai-artifacts/*` `READY`.
- **Ca lỗi:** A tự verify artifact của A → `SELF_VERIFICATION_FORBIDDEN`; B chưa là Contributor thử verify → 403; artifact không đủ điều kiện bị từ chối.

### L15 — Nhà hàng và thông báo

- **Dữ liệu:** địa chỉ thử `Quận 1, Thành phố Hồ Chí Minh` hoặc tọa độ do người dùng nhập; submission `R - Quán chay kiểm thử`, địa chỉ giả rõ ràng, không đưa số điện thoại thật.
- **Chạy nhà hàng:** `/restaurants` tìm bằng địa chỉ nhập tay trước, sau đó thử cấp/từ chối vị trí trình duyệt; ghi provider label/source. A đề xuất quán; ADM duyệt có lý do; B kiểm tra chỉ bản approved public. Nếu provider fake, đánh giá luồng truy vấn/UI, không khẳng định địa điểm ngoài đời có thật.
- **Đạt:** từ chối vị trí vẫn có thể nhập địa chỉ; submission chờ duyệt, không tự public; nhãn provider/diet không được diễn giải thành đảm bảo an toàn dị ứng.
- **Chạy thông báo:** sau L03/L05/L15 mở chuông hoặc `GET /notifications`, ghi unread count; mark một item read, reload; `read-all`, reload. Đối chiếu owner A/B và payload.
- **Đạt thông báo:** chỉ owner thấy; unread count đổi đúng; payload không chứa nội dung health/receipt/prompt; đây là **in-app**, không kỳ vọng email/push. Nếu chuông web còn fixture theo registry, dùng Swagger để xác nhận backend và đánh web `BLOCKED`/`FAIL` riêng.

### L16 — Gói payOS và entitlement

- **Dữ liệu:** A; ghi `GET /billing/products`, `GET /entitlements/me`, `GET /billing/orders` trước thử. Chọn một gói nhỏ **chỉ khi** môi trường merchant được cấu hình và bạn chủ động chấp nhận giao dịch tiền thật.
- **Chạy an toàn trước:** `/billing` xem catalog, số dư, lịch sử. Khi `BILLING_ENABLED=false`/thiếu khóa, thử tạo order theo UI và ghi trạng thái purchase disabled. Nếu có merchant hợp lệ, tạo **một** order với idempotency key, ghi order ID/amount/benefit snapshot; mở checkout rồi quay về không trả tiền, reload entitlement. Chỉ trong buổi test thanh toán có chủ đích mới chuyển khoản đủ tiền; sau đó chờ webhook/query xác thực, reload order và balance.
- **Đạt:** return URL/hình QR không tự cộng quyền; chỉ settlement ký hợp lệ, đúng tiền mới grant một lần. Retry cùng key không tạo quyền hai lần. Underpaid/pending vẫn chưa grant. Gói không tăng storage quota, không cấp Contributor/Admin, không bỏ xác nhận scan hay hard diet rule.
- **Ca lỗi và giới hạn:** payOS **không có sandbox**, kể cả app development có thể chuyển tiền thật. Không tự bắn webhook giả để gọi là đã test provider; thiếu merchant credentials thì đánh full settlement `BLOCKED`. Nếu thử reconcile, tôn trọng cooldown 30 giây và kiểm tra balance trước/sau.

## 3. Mẫu biên bản có thể copy cho từng ca

```text
Run ID: R=________  Ngày/giờ: ________  Git commit: ________
Môi trường: backend ________  frontend ________  Mongo demo ________
Provider: Cloudinary ________  vision ________  receipt ________  AI ________  maps ________  payOS ________
Luồng/case: L__ / happy|negative|owner|retry|provider
Tài khoản: ________  Dữ liệu/ID: ________  Version trước → sau: ________
Bước cuối và HTTP/status/code: ________
DB/API/UI sau reload (chỉ ghi dữ liệu không nhạy cảm): ________
Kết quả: PASS | FAIL | BLOCKED | NOT_RUN
Ảnh/Network log: ________  Lý do block hoặc lỗi cần sửa: ________
```

**Checklist kết thúc:** ghi đủ L01–L16 vào bảng tổng hợp; L12/L13 tách `fake-provider flow` và `real-image accuracy`; L16 tách `catalog/disabled checkout` và `real settlement`; L07/L09/L15 tách backend API với UI nếu registry ghi FE `No` hoặc fixture. Trước buổi chấm, chọn khoảng 5–7 luồng đã **PASS thực sự** để demo trực tiếp, còn các ca phụ đưa ảnh/Network log và giải thích giới hạn.

## 4. Nguồn kiểm chứng

- [Yêu cầu sản phẩm](../SRS.md), [luật và state machine](../IMPLEMENTATION_PLAN.md), [backlog ngoài MVP](../ROADMAP_PHASE_2.md).
- [Backend phase gate](../../backend/docs/IMPLEMENTATION_PHASES.md), [trạng thái từng endpoint](../../frontend/docs/BACKEND_INTEGRATION.md), [hướng dẫn backend](../../backend/README.md).
- Seed: [user](../../backend/prisma/seed-data/users.data.ts), [recipe](../../backend/prisma/seed-data/recipes.data.ts), [ingredient](../../backend/prisma/seed-data/ingredients.data.ts), [Pantry](../../backend/prisma/seed-data/pantry.data.ts); [16 luồng nghiệp vụ](02_LUONG_NGHIEP_VU.md).
