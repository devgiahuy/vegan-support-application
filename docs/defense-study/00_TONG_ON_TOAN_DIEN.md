# 00 — TỔNG ÔN TOÀN DIỆN & CHIẾN LƯỢC BẢO VỆ

**Dự án:** Vegan Support Application (VeggieConnect)
**Snapshot đối chiếu:** nhánh `dev`, `HEAD bd83d2d` (merge PR #67 — direct food preferences), ngày **19/11/2026**
**Nguồn chuẩn:** `docs/SRS.md` v1.10 → `docs/IMPLEMENTATION_PLAN.md` v4.25 → `backend/docs/IMPLEMENTATION_PHASES.md` v3.28 → `frontend/docs/BACKEND_INTEGRATION.md` v4.81 → source code
**Phương pháp:** đọc tĩnh toàn bộ tài liệu canonical, OpenAPI, Prisma schema, `env.ts`, các service/repository trọng yếu (profile, dietary-impact, content, moderation, entitlement, chat, meal-plan, allergy warnings, error handler), frontend mapper/auth/session. **Không chạy lại** test/build/acceptance/live-provider trong lượt này.

> ⚠️ **Cảnh báo quan trọng trước khi đọc:** bộ tài liệu `docs/defense-study/01,02,13,14` được viết trước **18/11/2026** nên vẫn mô tả mô hình `dietPattern` / `tradition` / lịch ăn chay định kỳ. Mô hình đó **đã bị thay thế** bởi 4 quyền ăn hằng ngày (`allowEggs`, `allowDairy`, `allowHoney`, `allowFivePungent`). Khi bảo vệ, **chỉ dùng tài liệu này và SRS 1.10** cho phần chế độ ăn. Chi tiết lệch tài liệu ở mục 6.4.

---

## 0. CÁCH DÙNG TÀI LIỆU NÀY

| Bạn có bao nhiêu thời gian | Đọc mục |
|---|---|
| 15 phút trước khi vào phòng | 1 (10 điều phải thuộc) + 7.2 (định vị 20 giây) + 7.8 (nói về giới hạn) |
| 1 buổi | 1 → 2 → 3 → 6 → 7 |
| Chuẩn bị kỹ 3 ngày | Toàn bộ, tự trả lời mục 7.6 trước khi xem đáp án |
| Bị hỏi config/exception | 5 và 6 |

**Quy ước trạng thái** (dùng đúng từ, không nói "xong" chung chung):

| Nhãn | Nghĩa | Cách nói |
|---|---|---|
| `READY` | Contract + migration/seed + quyền + gate backend đã ghi nhận | "Đã sẵn sàng tích hợp, có registry ghi ngày." |
| `IN_PROGRESS` | Có route/source/UI nhưng còn gate mở | "Có luồng chạy development, chưa đạt gate production." |
| `CHANGING` | Breaking change đang phối hợp client | "Contract đang đổi, chưa nên deploy tuần tự." |
| `PLANNED` | Chỉ trong kế hoạch | "Thuộc Roadmap Phase 2 / chưa làm." |
| `REMOVED` | Đã bỏ route/consumer | "Đã xóa, không còn hỗ trợ." |
| Mock/fixture | UI hoặc dữ liệu mẫu | "Đây là mock, không phải bằng chứng backend." |

---

## 1. MƯỜI ĐIỀU PHẢI THUỘC

1. **Backend là nơi giữ luật.** Dị ứng, nguyên liệu loại trừ, nhóm ăn bị tắt và dữ liệu thành phần không chắc chắn đều bị lọc **trước** khi xếp hạng/gợi ý. Client chỉ gửi ý định.
2. **Mô hình ăn uống hiện hành (18/11/2026):** 4 quyền độc lập `allowEggs`, `allowDairy`, `allowHoney`, `allowFivePungent` (bật = được ăn hằng ngày). Thịt/cá/hải sản và thành phần động vật khác **luôn bị loại**. Dị ứng và loại trừ tường minh **đè** quyền ăn. Không còn `dietPattern`/`tradition`/lịch ăn trong hồ sơ.
3. **Năm vị tân canonical:** hành, hẹ, tỏi, kiệu, hưng cừ. Không tự suy từ tên/allergen; phân loại phải được review có nguồn/license/version.
4. **Không chắc chắn = không cho qua.** Thành phần `UNKNOWN`/`PARTIAL`, thiếu dữ liệu, hoặc lỗi đọc profile đều bị coi là **không thỏa** ràng buộc cứng (fail-closed), không phải "mặc định an toàn".
5. **AI chỉ đề xuất.** AI không tự publish, không tự xóa, không tự tạo luật cứng, không ghi đè dữ liệu dinh dưỡng chuẩn. Mọi giá trị AI phải có nhãn `AI_ESTIMATED` + confidence/assumption.
6. **Xác nhận của người dùng là ranh giới dữ liệu.** Ảnh tủ lạnh/hóa đơn chỉ tạo candidate; **chỉ endpoint confirm** mới thay đổi Pantry.
7. **Contributor bình đẳng.** Mọi Contributor được duyệt có cùng quyền; `ORGANIZATION_AFFILIATION` / `PLATFORM_TRACK_RECORD` / `ADMIN_INVITED` chỉ là dữ liệu kiểm toán, **không phải phân tầng RBAC**.
8. **Chống tự duyệt/tự thẩm định.** Không tự duyệt nội dung mình tạo; không tự verify artifact AI của mình. Admin xử lý ca leo thang.
9. **Mọi thứ quan trọng có audit + idempotency.** Revision bất biến, quota reserve/commit/release, `expectedVersion`, `idempotencyKey`, audit bất biến cho duyệt/verify/quota.
10. **Trung thực giới hạn.** Phase 21/22/27 còn `IN_PROGRESS`; scan thật, native parity, provider thật, load/backup chưa chứng minh. Nói rõ thay vì tô hồng.

---

## 2. SẢN PHẨM, TÁC NHÂN, PHẠM VI

### 2.1 Bài toán & giá trị

Người ăn chay ở Việt Nam thiếu một nơi **đáng tin** để: tìm công thức/video/sổ tay, hiểu dinh dưỡng, lên thực đơn tuần, quản lý nguyên liệu, tìm quán chay. Vấn đề không chỉ là "nhiều công thức" mà là **an toàn và niềm tin**:

- dị ứng/kiêng ăn phải được chặn **trước** khi gợi ý;
- nội dung phải qua kiểm duyệt;
- số liệu dinh dưỡng phải nói rõ nguồn và độ bất định;
- AI không được âm thầm quyết định thay người dùng.

### 2.2 Tác nhân & quyền

| Vai trò | Quyền chính | Giới hạn |
|---|---|---|
| **Guest** | Xem/tìm nội dung published, chat giới hạn, đăng ký | Không sở hữu dữ liệu, quota thấp + rate limit |
| **Member** | Hồ sơ, nội dung riêng, comment/vote/rating/bookmark, meal plan, pantry, storage, AI, chat | Nội dung phải qua duyệt |
| **Contributor** | Tất cả quyền Member + chia sẻ draft AI đủ điều kiện + verify artifact AI của người khác + duyệt nội dung Member đủ điều kiện + tự xuất bản nội dung của mình | Không tự duyệt/tự verify; basis không đổi quyền |
| **Admin** | Quyết định xuất bản/kiểm duyệt cuối, duyệt/thu hồi Contributor, catalog/food-data/storage policy, AI governance, restaurant, billing catalog/insights | Không bỏ qua ràng buộc an toàn; thao tác có audit |

**Điểm dễ bị hỏi:** Contributor **không phải** "chuyên gia dinh dưỡng" và **không** có quyền cao hơn Contributor khác. Chứng chỉ không được xác thực trong MVP.

### 2.3 Phạm vi MVP & trạng thái thật (19/11/2026)

| Nhóm | Trạng thái |
|---|---|
| Phase 00–20, 23–26 | `COMPLETED` |
| Phase 21 — nhận diện tủ lạnh | `IN_PROGRESS`: adapter OpenAI + fake flow chạy; **chưa đánh giá ảnh Việt Nam thật** |
| Phase 22 — hóa đơn & shopping gap | Job hóa đơn `IN_PROGRESS`; shopping-gap `READY` |
| Phase 27 — hardening/release | `IN_PROGRESS`: còn P0 ảnh thật + load/backup |
| Direct food preferences (18–19/11) | `READY` cho contract/backend/web; native authenticated E2E còn mở |
| `POST /posts/{id}/submit` | `CHANGING` (chờ kiểm chứng thiết bị mobile) |
| `POST /billing/orders` | `CHANGING` (yêu cầu `expectedProductVersion`, client migration) |
| `GET /posts/mine` | `IN_PROGRESS` |
| `POST /recipe-drafts/generate` | Bảng trạng thái ghi `READY` (07/11); một mục cũ vẫn ghi `IN_PROGRESS` → **registry tự mâu thuẫn**, dùng `READY` + nói phụ thuộc provider |

### 2.4 Ngoài phạm vi (Roadmap Phase 2 — không được nhận là đã làm)

Wearable/HealthKit/Health Connect, video transcription/summarization, xác thực chứng chỉ, thanh toán production/recurring/refund tự động, DMCA chính thức, fingerprint bản quyền, moderation nâng cao, ranking bằng embedding/GenAI, mùa vụ/khu vực, app store distribution, email/push/SMS.

---

## 3. MÔ HÌNH NGHIỆP VỤ HIỆN HÀNH

### 3.1 Chế độ ăn & thứ tự ưu tiên

**Nguồn:** `backend/src/modules/profile/profile.service.ts` (FOOD_OPTIONS 21–31; effectiveConstraints 93–130), `backend/src/modules/content/search-constraints.ts` (64–78, 111–123), `DietPreference` trong `backend/prisma/schema.prisma`.

**Dữ liệu lưu:** `allowEggs`, `allowDairy`, `allowHoney`, `allowFivePungent`, `policyVersion=1`, `dietaryRevision`, `confirmedAt`. Mỗi lần lưu phải gửi `expectedDietaryRevision`; lệch → `409 DIET_PREFERENCES_CONFLICT` (kèm `currentRevision`).

**Thứ tự ưu tiên thực thi:**

```text
1. Dị ứng (allergen code + ingredient allergy)  ─┐
2. Nguyên liệu loại trừ tường minh               ─┤ luôn thắng
3. Nhóm động vật bị cấm (MEAT, FISH_SEAFOOD,     ─┤
   OTHER_ANIMAL) + nhóm bị tắt (EGG/DAIRY/       ─┤
   HONEY/FIVE_PUNGENT)                           ─┘
4. Giới hạn sức khỏe/dinh dưỡng (mềm hoặc chặn theo luật)
5. Sở thích, hành vi, xếp hạng
```

**Quy tắc quan trọng:**

- Bật quyền = **được phép mỗi ngày**, không có lịch/tuần.
- Nội dung vẫn có nhãn `VEGAN`/`LACTO_OVO` riêng và bộ lọc tìm kiếm tường minh riêng — **không** biến nhãn thành hồ sơ cá nhân.
- Gói ăn chay (composition) có trạng thái `UNKNOWN/PARTIAL/COMPLETE`, kind `SIMPLE/COMPOUND/UNSPECIFIED`, cạnh thành phần có hướng; kiểm tra **toàn bộ descendants**. Chu trình/độ sâu quá mức bị chặn; sửa metadata invalidate đánh giá.
- **Không có "an toàn mặc định":** thiếu dữ liệu thành phần → không đạt ràng buộc cứng.
- **Banner dị ứng ở chi tiết công thức** chỉ hiện khi có **khớp dương** với dị ứng đang lưu của viewer (allergen code hoặc ingredient ID, gồm thành phần transitive). Không có match → `[]`; **mảng rỗng không phải chứng nhận an toàn** (`backend/src/modules/content/recipe-allergy-warnings.ts:18–72`).

**Ca biên cần biết:**

- Người đã đăng nhập nhưng **chưa xác nhận** diet preference: `dietPreference = null` → `buildAuthenticatedSearchConstraints` chỉ áp dị ứng/loại trừ, **không tự áp baseline thịt/cá** (`search-constraints.ts:111–123`). Đây là hành vi hợp lý ("chưa có hồ sơ thì chưa có ràng buộc hồ sơ") nhưng **phải nói rõ**, đừng nói "mọi user luôn bị chặn thịt".
- Guest tìm kiếm không có ràng buộc cá nhân (trừ filter `dietPattern` do guest chọn).

### 3.2 Đổi hồ sơ ăn khi đã có kế hoạch (mới, 18/11)

**Nguồn:** `backend/src/modules/dietary-impact/*`, `docs/DIET_PROFILE_MEAL_PLAN_IMPACT.md`.

Luồng chuẩn:

```text
POST /users/me/diet-preferences/impact-preview   (read-only)
   → trả plan/item bị ảnh hưởng, lý do, nutrition/shopping trước–sau
PUT  /users/me/diet-preferences                  (lưu thật, có expectedDietaryRevision)
   → lưu thành công ĐỘC LẬP với việc sửa kế hoạch
POST /meal-plans/diet-repair/preview             (proposalId, TTL 15 phút)
POST /meal-plans/diet-repair/apply               (idempotencyKey, từng plan một kết quả)
POST /meal-programs/{id}/diet-revision           (program đã CONFIRMED → DRAFT liên kết)
```

Quy tắc bắt buộc:

- Chỉ sửa món bị ảnh hưởng **từ hôm nay (Asia/Ho_Chi_Minh) trở đi**; giữ món tương thích và ngày lịch sử.
- Không có ứng viên thay thế → **giữ nguyên plan + cảnh báo tồn tại**, không âm thầm xóa.
- "Giữ nội dung" không có nghĩa là "đã tương thích"; backend vẫn chặn khi confirm.
- Lưu profile không rollback nếu repair lỗi/hủy.
- No-op save **không** tăng `dietaryRevision` (so sánh semantic key trong `profile.repository.ts:129–162`).
- Program đã xác nhận là bất biến; sửa bằng revision DRAFT có lineage.
- Giới hạn: tối đa 20 plan/lần, proposal hết hạn 15 phút, cache client không đủ — backend đọc lại constraint hiện tại.

### 3.3 Nội dung, xuất bản, dinh dưỡng công thức

**Vòng đời cơ bản:**

```text
DRAFT → SUBMITTED/PENDING_REVIEW → PUBLISHED (APPROVED) | REJECTED
PUBLISHED --edit--> revision mới (DRAFT); bản cũ vẫn public đến khi bản mới được duyệt
```

**Quy tắc tự xuất bản (BL-06, đã duyệt 10/11/2026, code đã có):**

- **Contributor đang hoạt động** (role `CONTRIBUTOR` + profile chưa revoke, kiểm tra lại từ DB tại thời điểm submit): recipe/handbook/video của chính họ **tự publish**.
- **Admin**: recipe tự publish **chỉ khi không có moderation flag**; handbook/video vẫn qua duyệt.
- **Member**: luôn qua duyệt.
- AI/moderation flag **vẫn được ghi** cho Contributor; theo luật đã duyệt, flag không chặn tự xuất bản của Contributor nhưng Admin giữ quyền ẩn/gỡ sau đó.
- Recipe của Contributor/Admin **bắt buộc khai đủ 6 chỉ số** trước khi submit, thiếu → `422 RECIPE_NUTRITION_REQUIRED` + `fields.missingMetrics`.

**Dinh dưỡng công thức:**

- 6 chỉ số/khẩu phần: calories, protein, carbohydrate, fat, fiber, **vitamin B12 (tùy chọn, không AI ước lượng)**.
- 5 chỉ số bắt buộc để duyệt; thiếu bất kỳ dòng nào = thiếu, **không cộng partial thành tổng**.
- Nguồn giá trị: `CANONICAL_CALCULATED` < `AI_ESTIMATED` < `USER_PROVIDED` < `VERIFIED_OVERRIDE` (theo ngữ cảnh ưu tiên reviewer > author > hệ thống).
- AI chỉ điền phần thiếu, gắn nhãn + confidence + assumption; **không ghi vào canonical food data**.
- Job AI khi thiếu dữ liệu: 1 lần + 3 retry (1/5/15 phút), system-paid, có sweep khởi động lại; revision đã quyết định thì job bị bỏ.
- Sửa công thức đã publish → revision mới, tính lại từ đầu, **không carry over** giá trị cũ.

### 3.4 Cộng đồng & kiểm duyệt

- Chỉ user đăng nhập mới comment/vote/bookmark; vote/bookmark idempotent; rating 1–5 theo `taste`/`difficulty` chỉ cho recipe; bookmark chỉ recipe/video.
- Comment reply tối đa 1 cấp; xóa comment có reply = tombstone, không đứt mạch.
- Report: 1 user / 1 target active; ≥5 reporter phân biệt → ưu tiên cao nhưng **không tự kết luận vi phạm**.
- AI flag/report chỉ tạo tín hiệu; **xóa/hide phải có quyết định Admin + lý do + audit**.
- Ban user → ẩn nội dung với lý do `USER_BANNED`; unban chỉ khôi phục nội dung bị ẩn **thuần túy** vì ban.
- Chống tự duyệt: `record.createdById !== actor.userId && record.post.authorId !== actor.userId`.
- **Điểm lệch cần biết:** điều kiện Contributor duyệt hiện chỉ loại tác giả `ADMIN`, **không yêu cầu tác giả là `MEMBER`** (`backend/src/modules/moderation/moderation.service.ts:196–202`). SRS nói nội dung "non-Member" thuộc Admin. Đây là **khoảng trống nghiệp vụ P1** (mục 6.2), cần trả lời trung thực nếu bị hỏi.

### 3.5 Kế hoạch ăn, phân tích, chương trình

- Một tuần = **21 slot** (7 ngày × 3 bữa). Generator cố lấp đủ; slot không có ứng viên hợp lệ → **giữ trống kèm lý do**, không hạ chuẩn.
- Mục tiêu: TDEE × goal factor (maintain/lose/gain), rồi chia protein/fat/carb theo % năng lượng (tổng phải = 100) + fiber/1000 kcal; có tolerance và ghi rõ nguồn/ước tính.
- Chỉ 4 chiều macro được dùng cho so sánh tuần: protein, fiber, fat, carbohydrate; micronutrient không phải blocker.
- Hard constraints kiểm tra lại ở swap/manual-add; không lách được bằng UI.
- Phân tích có **fingerprint/version**; input đổi → `MEAL_ANALYSIS_STALE`.
- Manual insertion: giữ lựa chọn hard-compatible, cảnh báo mềm khi vượt target; vi phạm dị ứng/loại trừ/nhóm bị tắt **vẫn chặn**.
- Program 2–12 tuần, 1–3 alternative/tuần, snapshot bất biến; program `CONFIRMED` khóa cấu trúc; sửa bằng revision DRAFT liên kết (mục 3.2).

### 3.6 Pantry, scan, hóa đơn, shopping gap

**Ranh giới vàng:** create/edit/cancel/retry **không** đổi Pantry; **chỉ confirm** đổi Pantry, trong một transaction, có idempotency + `expectedVersion`.

- Pantry: quantity/unit/source/confidence/expiry quan sát; balance chỉ đổi qua ledger bất biến (consume/restore/adjust), không âm; update/delete/merge có version.
- Fridge: 1–6 ảnh `FRIDGE_IMAGE` đã commit; dedupe candidate nhưng giữ evidence theo ảnh; freshness chỉ là quan sát, **không kết luận an toàn thực phẩm**.
- Receipt: 1–4 ảnh; metadata receipt number/merchant/date/total/currency.
  - Khác số hóa đơn → **khoản mua khác**, kể cả trùng tên món.
  - Không có số: khớp chính xác cần merchant + date + total + currency + **toàn bộ multiset dòng**; khớp một phần → **buộc người dùng chọn** cùng/khác hóa đơn (`409 RECEIPT_REVIEW_DECISION_REQUIRED`).
  - Hóa đơn lặp chính xác **không cộng Pantry lần hai**, kể cả qua job khác.
  - Dòng phi thực phẩm bị loại phải **lưu lý do + cho restore** trước confirm.
- Shopping gap = nhu cầu công thức × servings − tồn kho confirmed đã quy đổi (min 0); item không resolve/không đổi đơn vị → `unresolvedItems`, không trừ đoán.
- Free-text pantry chỉ khớp **chính xác** canonical name hoặc alias đã duyệt (canonical thắng), không fuzzy; item hết hạn **trước hôm nay** không được tính là có sẵn.

### 3.7 Chat AI, quota & governance

- Chat stream SSE: `message_start`, `content_delta`, `message_complete`, `quota`, `error`.
- Thứ tự: reserve quota → moderation tiền sinh → provider stream → complete → commit. Lỗi/fallback **không trừ lượt**.
- Quota ngày reset 00:00 Asia/Ho_Chi_Minh; free trước, rồi credit gói; guest thấp hơn + rate limit.
- Moderation fail-closed: classifier lỗi/không hợp lệ/Admin tắt → **không sinh câu trả lời nguy hiểm**, trả static advisory, không trừ quota.
- Gateway không có model moderation → classifier Responses thay thế (`AI_MODERATION_FALLBACK_MODEL`), không tuyên bố tương đương.
- AI không được sửa hồ sơ sức khỏe/luật ăn/dữ liệu chuẩn.
- Idempotent replay: request trùng không trừ 2 lần; worker cũ không ghi đè attempt mới.
- Governance log: capability, provider/model, template version, latency, token/cost, status, safety outcome, correlation ID; **redacted**, retention 90 ngày, không lưu prompt/ảnh/hóa đơn.

### 3.8 AI artifact & Contributor verification

- Lưu output đủ điều kiện thành artifact bất biến (private mặc định), share qua allowlist công khai nghiêm ngặt.
- Contributor/Admin verify: ghi conclusion, evidence note, scope, actor, time, version; verify cũ chuyển `SUPERSEDED`/`REVOKED`, không xóa.
- **Cấm tự verify** artifact của mình.
- Verification là **ý kiến người**, không biến thành canonical truth; promote canonical là thao tác Admin riêng.

### 3.9 Storage quota

- Reserve trước upload (transaction) → client upload Cloudinary → commit kiểm tra owner/kind/MIME/bytes thực → mới tăng `usedBytes`.
- Reservation hết hạn/fail → release; xóa asset chỉ giảm usage **sau khi provider xóa thành công**.
- Upload đồng thời không vượt quota; trả `used/reserved/limit/remaining` + lỗi typed.
- Mặc định 1 GiB/account; ảnh ≤10 MB, video ≤100 MB (trần cấu hình cao hơn).

### 3.10 Billing & entitlement (payOS)

- Chỉ payOS cho đơn mới; **không có sandbox**, chuyển tiền thật; thiếu key → tắt checkout, **không có mock fallback**; `BILLING_ENABLED` bị từ chối ở `NODE_ENV=production`.
- Grant chỉ khi webhook ký hợp lệ → query xác thực PAID đủ tiền; browser return URL **không** grant; grant đúng 1 lần; PAID không bị hạ cấp.
- Gói một lần: chat/fridge/receipt/Pantry slot, cộng dồn, không hết hạn (demo).
- Combo 1/3/12 tháng: 69.000 / 176.000 / 580.000 VND; **mỗi chu kỳ 30 ngày cấp 300 chat + 30 fridge + 30 receipt**, +50 Pantry slot trong thời gian active; credit hết hạn cuối chu kỳ, không tự gia hạn (`backend/src/modules/billing/billing.catalog.ts`). Gói lẻ: 100 chat 29.000đ; 10 fridge / 10 receipt / 50 slot mỗi gói 19.000đ.
- Thứ tự tiêu: free ngày → credit chu kỳ hiện tại → credit vĩnh viễn. Release sau khi chu kỳ hết hạn **không hoàn** (`USAGE_RELEASED_PERIOD_EXPIRED`).
- Scan: 1 credit sau khi **ít nhất một ảnh thành công** (kể cả phân tích rỗng hợp lệ); fail toàn bộ → release; retry job đã charge **miễn phí**, tối đa 3 attempt.
- Pantry: đếm **mọi item chưa xóa**, kể cả số lượng 0; vượt hạn vẫn đọc/sửa/xóa được, không tự xóa.
- Admin catalog: tạo/sửa/ngừng bán; đơn mới cần `expectedProductVersion`; đơn cũ giữ snapshot.

### 3.11 Nhà hàng (ngoại lệ đã duyệt 25/10/2026)

- Discovery/detail **không** tự áp hồ sơ ăn/uống/dị ứng/truyền thống. Chỉ áp filter người dùng chọn.
- `dietPattern` tường minh (nếu có) chỉ lọc **claim nội bộ đã review** và loại kết quả provider chưa xác minh.
- Nhãn provider **không** chứng minh an toàn dị ứng/chay.
- Web: bản đồ MapLibre/OpenFreeMap key-free, mặc định 3 km, tối đa 5 km, không phân trang; mobile giữ phân trang.
- Provider có cap/coverage hữu hạn; phải hiển thị `partial/truncated/externalDataUnavailable`, không nói "không có quán nào" khi thực ra lỗi.

### 3.12 Thông báo

- In-app, idempotent theo `dedupeKey`; list phân trang, unread count, mark read.
- Sự kiện: kết quả duyệt nội dung/Contributor, report, quota, verification.
- Payload allowlist — không lộ PII/sức khỏe/hóa đơn người khác. Không email/push/SMS trong MVP.

### 3.13 Vòng đời tài khoản

- Soft-delete/anonymize theo retention; job xóa bao phủ profile/health/behavior/AI/pantry/receipt/recognition/media/location.
- Nội dung công khai sau khi xóa tài khoản theo policy + audit (chưa triển khai sâu trong MVP — nói đúng).

---

## 4. KIẾN TRÚC KỸ THUẬT

### 4.1 Ba client + backend

| Thành phần | Stack |
|---|---|
| Backend | Node 22+, Express 5, TypeScript, MongoDB replica set + Prisma 6.12, Zod, OpenAPI 3.1, Pino |
| Web | Next.js 16.2 (App Router), React 19.2, Tailwind v4, shadcn/ui (new-york/radix), TanStack Query v5, Zustand, Axios |
| Mobile | Expo 57, React Native 0.86, expo-router, NativeWind, TanStack Query |
| Ngoài | Cloudinary, OpenAI (chat/nutrition/vision/receipt/draft), SerpApi/Google Maps, payOS |

Không dùng Redis: session/rate-limit/quota/job/audit đều lưu Mongo.

### 4.2 Luồng request backend

```text
HTTP → security/CORS/requestId/log/body parser
     → router + auth/role guard + Zod validation
     → controller
     → service (nghiệp vụ, ownership, state, transaction, idempotency)
     → repository → MongoDB
     → provider adapter (Cloudinary/OpenAI/Maps/payOS)
     → envelope success/error chuẩn
```

- Thành công: `{ success: true, data, meta? }`.
- Lỗi: `{ success: false, error: { code, message, fields?, requestId } }`.
- Client xử lý theo `error.code`, **không** theo message.
- 500 chỉ trả message chung + `requestId`; chi tiết ở log server.

### 4.3 Auth & session

- Đăng ký luôn tạo `MEMBER`; Contributor intent chỉ tạo đơn `PENDING`.
- Mật khẩu hash scrypt có salt/tham số; login sai bị đếm, quá ngưỡng khóa tạm.
- Access token JWT HS256 (issuer/audience/subject/role/JTI/exp), mặc định 15 phút.
- Refresh token 48 byte ngẫu nhiên, DB chỉ lưu SHA-256; **rotation**; reuse → thu hồi cả family.
- Access token nhận từ `Authorization: Bearer` **hoặc** cookie `accessToken`; refresh cookie HttpOnly.
- Trạng thái: `ACTIVE`, `LOCKED` (mutation → 423), `BANNED` (auth → 403), `DELETED` (token invalid).
- JWT role khác role DB → `STALE_ACCESS_TOKEN` (buộc đăng nhập lại).
- Duyệt/revoke Contributor → thu hồi refresh session.

### 4.4 Persistence, transaction, concurrency

- **MongoDB replica set bắt buộc** (transaction). Dev dùng single-node replica set trong Docker.
- Provisioning bằng `npm run prisma:push` (`scripts/mongo-schema.mjs`), **không phải Prisma Migrate**; có native validators/indexes + backfill.
- Optimistic lock: `expectedVersion` / `expectedLifecycleVersion` → 409.
- Idempotency key cho confirm/adjust/merge/upload/delete/notification.
- `lockDocument` cho user/catalog/graph khi cần serialize.
- Soft delete/archive/supersede ưu tiên hơn xóa cứng; ledger/snapshot/audit bất biến.
- Snake_case ở DB, UUID ở API, timestamp ISO UTC, date-only `YYYY-MM-DD`.

### 4.5 Frontend architecture (luật cứng)

7 tầng: `endpoints → DTO → Model → Mapper → API → Query → Component`.

- Component **chỉ** nhận Model; cấm đọc DTO; cấm `any`/`as any`/`@ts-ignore`.
- Endpoint khai báo trong `features/<domain>/constants/*.endpoints.ts` hoặc `common/constants/endpoints/`; cấm hard-code path.
- TanStack Query cho server-state; Zustand chỉ client-state (token memory, theme).
- Bắt buộc xử lý Loading/Error/Empty/Success; invalidate cache sau mutation.
- `middleware.ts` bảo vệ `/dashboard/*`, `/profile/*`; token trong memory + silent refresh bằng cookie.
- UI tiếng Việt; trang admin phải có entry point theo role, không "trang mồ côi".

### 4.6 Contract & OpenAPI

- Backend sinh `backend/openapi.json` (`npm run openapi:generate`), phục vụ `/api-docs.json`, Swagger UI `/api-docs`.
- Frontend **chỉ** đồng bộ và đọc catalog: `npm run sync:swagger` → `frontend/docs/API-CATALOG.md`, `docs/api-catalog.json`, `docs/api/<tag>.md`.
- **Không đọc swagger gốc khi code feature.**
- Mọi thay đổi route/schema/enum/error/quyền/state phải cập nhật OpenAPI + `BACKEND_INTEGRATION.md` trong cùng change.
- Hiện tại: **198 operation**, 43 nhóm, 164 schema (theo registry 19/11). `openapi.info.version = 0.1.0`.

---

## 5. CẤU HÌNH TOÀN TẬP

### 5.1 Biến môi trường backend (`backend/src/config/env.ts`)

Mọi biến được Zod validate; sai → `ConfigurationError` lúc khởi động (không chạy nửa vời).

**Runtime & DB**

| Biến | Mặc định | Ràng buộc / ghi chú |
|---|---|---|
| `NODE_ENV` | `development` | `development/test/production` |
| `PORT` | `4000` | 1–65535 |
| `DATABASE_URL` | — | **Bắt buộc**, phải `mongodb://` hoặc `mongodb+srv://`; phải là replica set để có transaction |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | Có thể nhiều origin, phân tách dấu phẩy; CORS credentials |
| `JSON_BODY_LIMIT` | `1mb` | Hậu tố `b/kb/mb` |
| `SHUTDOWN_TIMEOUT_MS` | `10000` | 1–60 s; graceful shutdown |
| `LOG_LEVEL` | `info` | `fatal…silent` |

**Auth & session**

| Biến | Mặc định | Ràng buộc |
|---|---|---|
| `JWT_ACCESS_SECRET` | — | **Bắt buộc ≥32 ký tự** |
| `JWT_ISSUER` / `JWT_AUDIENCE` | `vegan-support-api` / `vegan-support-web` | — |
| `ACCESS_TOKEN_TTL_SECONDS` | `900` | 60–3600 |
| `REFRESH_TOKEN_TTL_DAYS` | `30` | 1–90 |
| `LOGIN_MAX_ATTEMPTS` | `5` | 3–20 |
| `LOGIN_LOCK_MINUTES` | `15` | 1–1440 |

**Storage/upload**

| Biến | Mặc định | Ràng buộc |
|---|---|---|
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | — | **Bắt buộc** |
| `CLOUDINARY_UPLOAD_FOLDER` | `vegan-support/posts` | Regex an toàn |
| `MAX_UPLOAD_IMAGE_BYTES` | `10_000_000` | ≤25 MB |
| `MAX_UPLOAD_VIDEO_BYTES` | `100_000_000` | ≤250 MB |
| `STORAGE_DEFAULT_QUOTA_BYTES` | `1_073_741_824` (1 GiB) | ≤10 TB |
| `UPLOAD_RESERVATION_TTL_SECONDS` | `900` | 60–86 400 |
| `CLOUDINARY_API_TIMEOUT_MS` | `10_000` | 1–60 s |

**Meal plan / program**

| Biến | Mặc định | Ràng buộc |
|---|---|---|
| `MEAL_PLAN_MAINTAIN/LOSE/GAIN_FACTOR` | `1 / 0.9 / 1.1` | 0.8–1.2; lose ≤1; gain ≥1 |
| `MEAL_PLAN_PROTEIN/FAT/CARB_ENERGY_PERCENT` | `20 / 30 / 50` | **Tổng phải = 100**, nếu không → lỗi khởi động |
| `MEAL_PLAN_FIBER_GRAMS_PER_1000_KCAL` | `14` | 5–30 |
| `MEAL_PLAN_MACRO_TOLERANCE_PERCENT` | `15` | 1–50 |
| `MEAL_PROGRAM_MAX_WEEKS` | `12` | 2–12 |
| `MEAL_PROGRAM_MAX_ALTERNATIVES_PER_WEEK` | `3` | 1–3 |
| `MEAL_PROGRAM_MAX_REGENERATIONS_PER_WEEK` | `2` | 1–4 |

**AI / chat**

| Biến | Mặc định | Ghi chú |
|---|---|---|
| `AI_CHAT_ENABLED` | `true` | Công tắc deployment |
| `AI_PROVIDER` | `openai` | `openai/fake` |
| `OPENAI_API_KEY` | rỗng | Optional cho chat (fallback nếu thiếu), **bắt buộc** nếu bật vision/receipt OpenAI |
| `OPENAI_BASE_URL` | `https://api.openai.com/v1` | Có thể đổi gateway/proxy |
| `AI_MODEL_CHAT` | `gpt-5.6-terra` | **Chuỗi mặc định cần kiểm tra với provider thật** (xem 6.2) |
| `AI_MODEL_MODERATION` | `omni-moderation-latest` | — |
| `AI_MODERATION_FALLBACK_MODEL` | rỗng → chat model | Chỉ dùng khi gateway báo unsupported |
| `AI_FALLBACK_MODEL` | `static-fallback-v1` | Nhãn nội bộ |
| `AI_TIMEOUT_MS` | `60_000` | 1–120 s; **file `.env.example` ghi 30 000** |
| `AI_MAX_OUTPUT_TOKENS` | `800` | 64–4096 |
| `AI_GUEST/MEMBER/PRIVILEGED_DAILY_QUOTA` | `3 / 3 / 3` | Guest **không nhỏ hơn** Member theo số (xem 6.3) |
| `AI_GUEST_RATE_LIMIT_PER_MINUTE` | `10` | 1–60 |
| `CHAT_GUEST_COOKIE_SECRET` | rỗng → **dùng JWT secret** | ≥32 ký tự nếu đặt |
| `CHAT_GUEST_COOKIE_TTL_DAYS` | `7` | 1–30 |

**Vision / receipt**

| Biến | Mặc định | Ghi chú |
|---|---|---|
| `VISION_ENABLED` | `true` | — |
| `VISION_PROVIDER` | `openai` | `fake/openai`; fake bị **từ chối ở production** |
| `VISION_MODEL` | rỗng → `gpt-5.6-terra` | Phải hỗ trợ image input + strict JSON |
| `VISION_TEMPLATE_VERSION` | `fridge-v1` | — |
| `VISION_MAX_IMAGES` | `6` | 2–12 |
| `VISION_MAX_IMAGE_BYTES` | `10 MB` | ≤25 MB |
| `RECEIPT_ENABLED` | `true` | — |
| `RECEIPT_PROVIDER` | `openai` | fake bị từ chối ở production |
| `RECEIPT_TEMPLATE_VERSION` | `receipt-v3` | — |
| `RECEIPT_MAX_IMAGES` | `4` | 1–8 |
| `RECEIPT_MAX_IMAGE_BYTES` | `10 MB` | ≤25 MB |

**Maps**

| Biến | Mặc định | Ghi chú |
|---|---|---|
| `MAPS_PROVIDER` | `fake` | `fake/google/serpapi` |
| `GOOGLE_MAPS_API_KEY` | rỗng | Bắt buộc nếu provider `google` |
| `SERPAPI_API_KEY` | rỗng | Bắt buộc nếu provider `serpapi` |
| `SERPAPI_BASE_URL` | `https://serpapi.com/search.json` | — |
| `MAPS_TIMEOUT_MS` | `5000` | 1–30 s; dùng chung deadline mỗi phrase |

**Billing (payOS)**

| Biến | Mặc định | Ghi chú |
|---|---|---|
| `BILLING_ENABLED` | `false` | **Bị từ chối ở production** |
| `BILLING_PROVIDER` | `payos` | Cố định |
| `PAYOS_CLIENT_ID/API_KEY/CHECKSUM_KEY` | rỗng | Thiếu → tắt checkout, không fallback |
| `BILLING_PUBLIC_URL` / `BILLING_RETURN_URL` | localhost | URL công khai/return |
| `BILLING_ORDER_TTL_MINUTES` | `15` | 5–60 |
| `BILLING_PANTRY_BASE_LIMIT` | `10` | — |
| `BILLING_FRIDGE/RECEIPT_TRIAL_JOBS` | `0 / 0` | Không còn trial cho tài khoản mới |
| `BILLING_SCAN_MAX_ATTEMPTS` | `3` | 1–5 |
| `BILLING_USAGE_LEASE_SECONDS` | `1800` | 300–7200 |

**Seed**

`SEED_MEMBER_EMAIL/PASSWORD`, `SEED_PLATFORM_CONTRIBUTOR_EMAIL`, `SEED_ORGANIZATION_CONTRIBUTOR_EMAIL`, `SEED_INVITED_CONTRIBUTOR_EMAIL`, `SEED_ADMIN_EMAIL/PASSWORD`. Password **bắt buộc** khi `RUN_SEED=true`.

### 5.2 Guard production trong `env.ts`

Khởi động sẽ **fail** nếu:

- `BILLING_ENABLED=true` khi `NODE_ENV=production`.
- Tổng % protein/fat/carb ≠ 100.
- `VISION_ENABLED=true` + `VISION_PROVIDER=fake` ở production.
- `RECEIPT_ENABLED=true` + `RECEIPT_PROVIDER=fake` ở production.
- `MAPS_PROVIDER=google` thiếu key; `serpapi` thiếu key.
- `VISION_ENABLED=true` + provider `openai` thiếu `OPENAI_API_KEY`.
- `RECEIPT_ENABLED=true` + provider `openai` thiếu `OPENAI_API_KEY`.

### 5.3 Bẫy cấu hình phải biết (rất dễ bị hỏi hoặc demo lỗi)

1. **`.env.example` không boot được nếu copy nguyên bản:** `VISION_ENABLED=true`, `RECEIPT_ENABLED=true`, provider `openai`, nhưng `OPENAI_API_KEY` để trống → `ConfigurationError`. Phải điền key hoặc tắt 2 capability.
2. **`AI_TIMEOUT_MS` lệch:** env mẫu 30 000, schema mặc định 60 000. Timeout thực tế phụ thuộc env, không phải default code.
3. **Model mặc định `gpt-5.6-terra`:** nếu tài khoản provider không có model này, chat sẽ rơi vào **static fallback** (câu trả lời an toàn thay thế, không phải AI thật). Trước demo phải gọi thử và kiểm tra `provider/model` trong log/governance.
4. **`MAPS_PROVIDER=fake` mặc định:** demo sẽ ra quán giả. Muốn dữ liệu thật phải đặt `serpapi` + key server-side.
5. **`BILLING_ENABLED=false`:** checkout tắt; đồng thời `EntitlementService.reserve` **return sớm**, nên scan không bị chặn quota. Chat vẫn bị chặn bởi `AiQuotaBucket` (free 3/ngày). Đây là **khác biệt hành vi dev vs bật billing**, phải nói rõ.
6. **`CHAT_GUEST_COOKIE_SECRET` không đặt** → dùng chung `JWT_ACCESS_SECRET`. Tiện cho dev, nhưng là coupling cần biết.
7. **Cookie `Secure` chỉ bật ở production**; dev chạy HTTP vẫn được.
8. **Mongo phải là replica set**; `prisma:push` chứ không phải `migrate deploy`; seed idempotent.
9. **Ảnh seed là URL tương đối**, trong khi OpenAI adapter yêu cầu **HTTPS Cloudinary** → job thật sẽ fail nếu dùng ảnh seed. Phải upload ảnh thật đã commit.
10. **Quota AI guest = member = 3** (chỉ khác rate limit). SRS nói "guest nhỏ hơn" — xem mục 6.3.

### 5.4 Frontend & mobile env

| Biến | Ý nghĩa |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL backend cho axios + rewrite |
| `NEXT_PUBLIC_APP_URL` | Base URL web |
| `NEXT_PUBLIC_RESTAURANT_MAP_STYLE_URL` | Style MapLibre/OpenFreeMap (mặc định Liberty) |
| `BACKEND_API_URL` | **Server-only**, ưu tiên cho `serverFetch`/rewrite |
| `EXPO_PUBLIC_ENABLE_DEV_SCANS` | Mobile: chỉ bật scan trong dev runtime |
| `EXPO_PUBLIC_SCAN_PROVIDER` | Chỉ đổi **nhãn hiển thị**, không đổi backend |

---

## 6. NGOẠI LỆ & KHOẢNG TRỐNG CHƯA XỬ LÝ

> Cách đọc bảng: **Bằng chứng** = file/dòng hoặc registry. **Ảnh hưởng** = điều gì có thể sai khi demo/bị hỏi. **Nói thế nào** = câu trả lời trung thực, không bịa.

### 6.1 Ưu tiên 0 — không được trình bày sai trạng thái

| # | Vấn đề | Bằng chứng | Ảnh hưởng | Nói thế nào / việc cần làm |
|---|---|---|---|---|
| P0-1 | Scan tủ lạnh/hóa đơn chưa `READY` | `backend/docs/IMPLEMENTATION_PHASES.md` (21/22 `IN_PROGRESS`), `frontend/docs/BACKEND_INTEGRATION.md` | Không thể nhận "đã production-ready" | "Luồng job/confirm chạy development; accuracy ảnh Việt Nam thật và native chưa đạt gate." |
| P0-2 | Phase 27 chưa đóng; release checklist còn P0 ảnh thật | `backend/docs/RELEASE_CHECKLIST.md` | Release gate mở | "Release checklist ghi rõ P0 còn mở; em không tuyên bố READY." |
| P0-3 | Working tree chưa sạch | `git status`: 35 file M (API catalog + vài file frontend/test) | Demo có thể lệch commit | Trước khi in slide: commit/stash, ghi `HEAD` thật, không demo file chưa commit như "đã có trong Git". |
| P0-4 | Không có test backend tự động (theo policy) | `AGENTS.md`, `IMPLEMENTATION_PHASES.md §1` | Câu hỏi "test đâu?" | "Policy repo không thêm test infra backend; bằng chứng là acceptance scripts + HTTP checks + gate lint/typecheck/build, không phải unit test." |

### 6.2 Ưu tiên 1 — sai lệch nghiệp vụ/tài liệu có thể bị hỏi sâu

| # | Vấn đề | Bằng chứng | Ảnh hưởng | Nói thế nào / hướng sửa |
|---|---|---|---|---|
| P1-0 | **Runbook demo đang dùng contract đã bị xóa** | `docs/DEMO_FLOW_PROFILE_RECIPE_MEALPLAN.md` (18/11) còn `dietPattern`, `practiceSchedule`, `tradition`, `ruleSetVersion`, `PUT /users/me/diet-schedule` | Chạy nguyên script sẽ lỗi 400/404 vì 19/11 đã thay bằng 4 quyền + `expectedDietaryRevision` | **Không chạy nguyên văn.** Dùng payload đã sửa ở Phụ lục 8.5; tập lại luồng trước ngày bảo vệ. |
| P1-1 | **Tài liệu cũ vẫn mô tả dietPattern/tradition/lịch ăn** | `backend/docs/BUSINESS_RULES.md` v1.0 (21/09); `docs/defense-study/01,02,13,14` | Nếu trích sẽ nói sai mô hình hiện hành | "Tài liệu đó là snapshot trước 18/11; mô hình hiện tại là 4 quyền ăn hằng ngày, xem SRS 1.10 + `profile.service.ts`." |
| P1-2 | **Tài liệu backend tổng quan còn PostgreSQL/số cũ** | `backend/docs/BACKEND_FEATURES_AND_WORKFLOWS.md` (08/10: PostgreSQL 14, 141 path/168 op) | Hỏi kiến trúc sẽ lệch | "DB hiện tại là MongoDB replica set + Prisma; tài liệu đó là historical snapshot." |
| P1-3 | **Registry tự mâu thuẫn về recipe-drafts** | `BACKEND_INTEGRATION.md:154` (`IN_PROGRESS`) vs `:370` (`READY` 07/11) | Không biết tin dòng nào | Dùng bảng trạng thái `:370` (`READY`), nói phụ thuộc provider thật. |
| P1-4 | **SRS FR-04 ghi "implementation pending"** trong khi code đã có auto-publish Contributor | `docs/SRS.md:109`, `content-publication.policy.ts`, `content.repository.ts:717–784` | Nói "chưa làm" sẽ sai | "Backend đã triển khai; endpoint submit còn `CHANGING` vì chờ kiểm chứng thiết bị mobile." |
| P1-5 | **Phạm vi Contributor duyệt rộng hơn SRS** | `moderation.service.ts:196–202`: chỉ loại tác giả `ADMIN`, không yêu cầu `MEMBER` | Contributor có thể duyệt bài Contributor khác | "Theo SRS, nội dung non-Member thuộc Admin; source hiện chưa chặn rõ trường hợp Contributor→Contributor. Đây là gap em ghi nhận và sẽ siết điều kiện." |
| P1-6 | **Model AI mặc định có thể không tồn tại** | `env.ts:85`, `.env.example` | Chat fallback âm thầm, demo "AI trả lời chung chung" | Kiểm tra model thật trước demo; nếu fallback, nói "provider đang fallback an toàn", mở `FallbackNotice`. |
| P1-7 | **Frontend mapper biến `null` dinh dưỡng thành 0** | `frontend/src/features/recipe/mappers/recipe.mapper.ts:140–145` | Card hiển thị `0 kcal` cho dữ liệu chưa biết → sai provenance | "Đây là gap UI/mapper đã ghi nhận; không dùng số 0 làm bằng chứng dữ liệu." |
| P1-8 | **OTP xác thực mô phỏng bằng `setTimeout`** | `frontend/src/app/(auth)/verify-otp/page.tsx:93–98` | Dễ bị hỏi "backend OTP đâu?" | "Luồng OTP hiện là demo UI, chưa nối backend; em không trình bày như xác thực thật." |
| P1-9 | **`forceLogout` không clear QueryClient** | `frontend/src/lib/auth-refresh.ts:154–163` | Đổi tài khoản cùng tab có thể còn cache private | "Manual logout có clear; force-logout path cần bổ sung clear để tránh lộ cache chéo tài khoản — em ghi nhận." |
| P1-10 | **Endpoint còn `CHANGING`/`IN_PROGRESS`** | `/posts/{id}/submit` (`CHANGING`), `/billing/orders` (`CHANGING`), `/posts/mine` (`IN_PROGRESS`) | Demo các luồng này có thể lệch contract | Chỉ demo sau khi xác nhận client/backend cùng bản; nói rõ trạng thái. |
| P1-11 | **Contributor bị flag vẫn tự publish (theo luật đã duyệt)** | `content.repository.ts:722–727`; BL-06 | Hội đồng có thể thấy "AI flag mà vẫn đăng" | "Đúng theo quyết định 10/11: flag được lưu để Admin hậu kiểm, không chặn Contributor tự xuất bản; Admin vẫn có quyền ẩn/gỡ." |
| P1-12 | **User chưa xác nhận diet → không áp baseline thịt/cá** | `search-constraints.ts:111–123` | Nói "mọi user bị chặn thịt" là sai | "Chưa có hồ sơ thì chưa có ràng buộc hồ sơ; khi đã xác nhận, baseline thịt/cá luôn bị chặn." |
| P1-13 | **Lỗi generic thành 500 không mã nghiệp vụ** | `error-handler.ts:53–58`; các chỗ `throw new Error('USAGE_IDENTITY_MISMATCH'…)` | Khó debug/không typed error | "Các nhánh bất thường trả 500 + requestId; em không claim mọi lỗi đều typed." |

### 6.3 Ca biên nghiệp vụ phải có câu trả lời sẵn

| Tình huống | Hành vi đúng | Câu chốt |
|---|---|---|
| Dị ứng mới thêm sau khi đã có plan | Preview impact; lưu profile độc lập; repair từ hôm nay; giữ món nếu người dùng chọn | "Lưu không phụ thuộc repair; giữ nội dung không có nghĩa là hợp lệ." |
| Không có ứng viên thay thế | Giữ nguyên plan + cảnh báo tồn tại | "Thà cảnh báo còn hơn âm thầm xóa món." |
| Program đã CONFIRMED bị ảnh hưởng | Tạo DRAFT revision liên kết, không sửa bản đã xác nhận | "Lịch sử ăn uống là bất biến." |
| Recipe thiếu 1 chỉ số | Không duyệt; không cộng partial | "Không có tổng giả." |
| AI trả số dinh dưỡng | Lưu `AI_ESTIMATED`, không ghi canonical | "AI không tạo sự thật dinh dưỡng." |
| Thành phần UNKNOWN/PARTIAL | Không đạt ràng buộc cứng | "Không chắc = không cho qua." |
| Banner dị ứng rỗng | Không phải chứng nhận an toàn | "Không match không có nghĩa là an toàn." |
| Guest chat quá 3/ngày | `429 AI_QUOTA_EXCEEDED` (chat bucket) | "Guest bị chặn theo ngày + rate limit." |
| Scan khi `BILLING_ENABLED=false` | Không bị chặn bởi entitlement | "Dev không bật billing thì scan không tính quota; bật billing mới có free 1/ngày + credit." |
| Chat provider lỗi | Fallback/không trừ lượt | "Reserve trước, chỉ commit khi thành công." |
| Client hủy giữa stream | Release quota, message failed | "Hủy không bị tính lượt." |
| Hóa đơn trùng | Không cộng Pantry lần 2 | "So identity trước khi merge." |
| Hóa đơn mơ hồ | Bắt user chọn cùng/khác | "Không đoán thay người dùng." |
| Pantry vượt hạn | Vẫn đọc/sửa/xóa; chỉ chặn thêm mới | "Không tự xóa dữ liệu người dùng." |
| Free-text pantry | Chỉ khớp chính xác canonical/alias | "Không fuzzy-match nguyên liệu." |
| Pantry hết hạn hôm qua | Không tính là có sẵn | "Expiry là quan sát, nhưng không dùng để trừ nhu cầu." |
| Report ≥5 người | Ưu tiên cao, không tự kết luận | "Report là tín hiệu." |
| Contributor tự verify artifact | Bị chặn | "Không tự thẩm định." |
| payOS trả về browser | Không grant | "Chỉ webhook ký + query xác thực mới grant." |
| Thanh toán thừa | Không thêm quyền lợi, xử lý tay | "Không tự refund." |
| Đơn hết hạn | Ẩn checkout URL, không grant | "Hết TTL 15 phút." |
| Nhà hàng gần nhất | Không áp hồ sơ ăn | "Ngoại lệ đã duyệt; provider chưa xác minh." |
| Provider bản đồ lỗi | Hiện "chưa tải được", không nói "không có quán" | "Phân biệt rỗng với lỗi." |
| Guest/member quota | Cùng 3 lượt; guest thêm rate limit | "Khác biệt là rate limit + CTA đăng ký, không phải số lượt." |

### 6.4 Bảng lệch tài liệu (doc drift) — kiểm tra trước khi trích

| Tài liệu | Nội dung lỗi thời | Nguồn đúng |
|---|---|---|
| `backend/docs/BUSINESS_RULES.md` | DietPattern, Tradition, lịch PERIODIC, "mealPlannerEligible" cũ | `docs/SRS.md` §4 + `profile.service.ts` |
| `backend/docs/BACKEND_FEATURES_AND_WORKFLOWS.md` | PostgreSQL, 141 path/168 op, diet workflow cũ | Mongo + OpenAPI 198 op |
| `backend/docs/RELEASE_CHECKLIST.md` | "33 migrations PostgreSQL" | Mongo `prisma:push`; note đã ghi superseded |
| `docs/defense-study/01,02,13,14` | diet pattern/tradition/lịch | SRS 1.10 |
| `docs/defense-study/README.md` | Còn câu "AI recipe draft IN_PROGRESS" | Bảng registry `READY` 07/11 |
| `frontend/docs/SRS_Production.md`, `SRS_Vegan_Support_Application.md` | Historical | `docs/SRS.md` |
| `frontend/docs/FRONTEND_ARCHITECTURE_REVIEW_2026-10-15.md` | Số test/build cũ | WORK-LOG mới nhất |
| `docs/IMPLEMENTATION_PLAN.md` BL-20.1 | Ghi combo cấp 100 chat + 10/10 job mỗi chu kỳ | **Sai với bản hiện hành:** SRS 1.10 FR-17 và `billing.catalog.ts` là **300 chat + 30 fridge + 30 receipt** mỗi 30 ngày |

---

## 7. CHIẾN LƯỢC BẢO VỆ

### 7.1 Hội đồng thực chất kiểm tra 3 điều

1. **Hiểu bài toán:** ai dùng, vì sao, phạm vi, cái gì cố tình không làm.
2. **Có lý do thiết kế:** vì sao backend giữ luật, vì sao AI chỉ đề xuất, vì sao confirm, vì sao idempotent.
3. **Có bằng chứng:** file nào, endpoint nào, trạng thái nào, lỗi nào, giới hạn nào.

> Không cần chứng minh "hoàn hảo". Cần chứng minh **biết chỗ chưa hoàn hảo và vì sao**.

### 7.2 Định vị 20 giây

**Bản nghiệp vụ:**
> "Đây là nền tảng hỗ trợ người ăn chay tại Việt Nam, gồm web, mobile và backend. Điểm cốt lõi không phải số màn hình, mà là **an toàn ăn uống do backend thực thi**: hồ sơ dị ứng/kiêng ăn lọc cứng trước khi gợi ý; nội dung qua kiểm duyệt; AI chỉ đề xuất và người dùng phải xác nhận trước khi dữ liệu tủ bếp thay đổi."

**Bản kỹ thuật:**
> "Backend Express + TypeScript + MongoDB replica set, OpenAPI-first, mọi route qua Zod → controller → service → repository. Frontend Next.js theo 7 tầng endpoint → DTO → Model → Mapper → API → Query → Component. Ba luồng khó nhất là SSE chat có quota, pipeline scan ảnh bất đồng bộ có bước confirm, và tính dinh dưỡng công thức có provenance."

### 7.3 Storyline 3 phần + 8 slide

| # | Slide | Nội dung | Câu chốt |
|---|---|---|---|
| 1 | Bài toán | 3 nỗi đau: ăn chay đủ chất, tìm quán, nội dung thiếu kiểm chứng | "Vấn đề là niềm tin và an toàn." |
| 2 | Tác nhân & phạm vi | Guest/Member/Contributor/Admin; MVP 00–27 | "Mỗi vai trò có ranh giới rõ." |
| 3 | Kiến trúc | 3 client → REST → service/repository → Mongo; provider adapter | "Backend quyết định, client gửi ý định." |
| 4 | Xương sống an toàn | 4 quyền ăn + dị ứng/loại trừ + composition transitive | "Lọc cứng trước xếp hạng." |
| 5 | Xương sống dữ liệu | Pantry → scan → confirm → shopping gap | "Chỉ confirm mới đổi dữ liệu." |
| 6 | Tin cậy nội dung | draft → submit → review/auto-publish; audit | "AI là tín hiệu, người duyệt là quyết định." |
| 7 | AI có kiểm soát | chat quota/fallback; nutrition provenance; governance | "AI không ghi dữ liệu chuẩn." |
| 8 | Giới hạn & bài học | scan IN_PROGRESS, provider thật, native parity, doc drift | "Em biết chính xác cái gì chưa xong." |

### 7.4 Ba phương án demo

**A — "An toàn dữ liệu" (ổn định nhất, khuyên dùng)**
`login Member → bật/tắt 4 quyền ăn → thêm dị ứng → search thấy món bị loại → tạo plan 21 slot → pantry → shopping gap`
- Chứng minh: hard constraints, impact/repair, confirm boundary.
- Rủi ro thấp: chỉ phụ thuộc seed.

**B — "AI có kiểm soát" (chỉ khi provider đã test trước)**
`AI recipe draft → preview → áp form (không publish) → chat SSE + quota → scan tủ lạnh/hóa đơn → confirm`
- Chứng minh: AI không ghi dữ liệu chuẩn; SSE; job + confirm.
- Rủi ro: provider/Cloudinary; **bắt buộc** có job chuẩn bị trước + nói scan `IN_PROGRESS`.

**C — "Tin cậy & vận hành" (hội đồng thiên nghiệp vụ)**
`Member submit → Contributor khác duyệt → publish → Admin xem audit → billing history (payOS disabled)`
- Chứng minh: RBAC, revision, audit, webhook không grant qua return URL.
- Rủi ro: cần 2 tài khoản; **không bấm thanh toán thật**.

> 8 phút: A + một đoạn C. 12–15 phút: A + B, nói rõ giới hạn provider.

### 7.5 Kịch bản 12 phút (A + B)

| Phút | Thao tác | Câu nói | File mở khi bị hỏi |
|---|---|---|---|
| 0–1 | Slide 1–3 | "Backend giữ luật và transaction." | `backend/src/app.ts` |
| 1–3 | Login Member, bật/tắt quyền ăn, thêm dị ứng | "Lưu xong, mọi search/plan dùng constraint này." | `content/search-constraints.ts` |
| 3–5 | Search 1 món hợp lệ, 1 món bị loại | "Lọc cứng trước ranking; ranking không đưa lại." | `recommendation.service.ts` |
| 5–7 | Generate plan; chỉ 21 slot + 1 UNFILLED | "Thiếu ứng viên thì để trống có lý do." | `meal-plan.service.ts` |
| 7–9 | AI recipe draft → preview → áp form | "AI chỉ tạo draft; lưu vẫn qua submit/review." | `recipe-draft.service.ts` |
| 9–11 | Chat 1 câu; chỉ stream + quota | "Reserve trước, lỗi thì hoàn." | `chat.service.ts` |
| 11–12 | Tóm tắt giới hạn | "Scan còn IN_PROGRESS; payOS không sandbox." | `IMPLEMENTATION_PHASES.md` |

### 7.6 Ma trận 2 giảng viên + công thức C-A-R-E

| | Giảng viên nghiệp vụ | Giảng viên kỹ thuật |
|---|---|---|
| Câu mở | "Vì sao cần?" "Ai được làm?" | "Code đâu?" "Hai request đồng thời?" |
| Muốn nghe | actor → rule → state → rủi ro | entry → validate → transaction → error |
| Bằng chứng | SRS, plan, state machine | service/repository, OpenAPI, error code |
| Bẫy | "AI sai thì sao?" "User cố tình?" | "Provider timeout?" "Client retry?" |

**C-A-R-E (45–60 giây):**

1. **C — Context:** "Ở luồng X, actor là Y…"
2. **A — Answer:** "…backend chặn/cho phép vì Z."
3. **R — Reason:** validate/transaction/idempotency/state machine.
4. **E — Evidence:** "Nằm ở file…, trạng thái…"

### 7.7 15 câu hỏi khó + đáp án mẫu

**1. Vì sao backend phải giữ luật thay vì frontend?**
> "Vì UI có thể bị bỏ qua hoặc sửa. Dị ứng/kiêng ăn là ràng buộc an toàn, phải chạy trong search, recommendation, plan generation và manual-add. Frontend chỉ hiển thị. Bằng chứng: `search-constraints.ts` và `meal-plan.service.ts`."

**2. Mô hình ăn uống mới là gì? Vì sao bỏ diet pattern/tradition?**
> "Theo quyết định 18/11, hồ sơ dùng 4 quyền độc lập: trứng, sữa, mật ong, ngũ vị tân. Bật là được ăn hằng ngày; thịt/cá luôn bị loại; dị ứng/loại trừ đè lên. Bỏ pattern/tradition/lịch để tránh mô hình tôn giáo phức tạp và giảm rủi ro hiểu sai. Nội dung vẫn có nhãn chay riêng."

**3. Nếu AI nói món này an toàn thì sao?**
> "Không dùng. AI không tạo luật cứng và không ghi canonical. Dị ứng chỉ dựa trên catalog/recipe đã review, so khớp dương; không match thì không cảnh báo, nhưng cũng không tuyên bố an toàn. Thiếu dữ liệu thành phần thì fail-closed."

**4. Vì sao Contributor được tự xuất bản? Nếu bị AI flag?**
> "Đã duyệt 10/11: Contributor đang hoạt động (role + profile check lại từ DB) tự publish recipe/handbook/video của mình để giảm tải duyệt. Flag vẫn được lưu; theo luật, flag không chặn tự publish của Contributor, nhưng Admin giữ quyền ẩn/gỡ và mọi thao tác có audit. Recipe còn phải khai đủ 6 chỉ số."

**5. Làm sao chống tự duyệt/tự verify?**
> "Điều kiện duyệt loại `createdById` và `authorId` trùng actor; verify kiểm tra owner artifact. Admin là ca leo thang. Bằng chứng: `moderation.service.ts:190–202`, `ai-review.service.ts`."

**6. Hai request confirm cùng lúc thì sao?**
> "Confirm chạy trong transaction, có `expectedVersion`/idempotency key và khóa document khi cần. Request thua nhận 409 hoặc replay idempotent, không cộng Pantry hai lần."

**7. Quota chat trừ khi nào? Provider lỗi?**
> "Reserve trước khi gọi provider; chỉ commit khi `message_complete`. Lỗi/fallback/client abort → release. Replay không trừ lần hai. Bằng chứng: `chat.service.ts`, `entitlement.service.ts`."

**8. Vì sao scan phải confirm?**
> "AI chỉ đề xuất; ảnh có thể nhận sai. Confirm là ranh giới duy nhất thay đổi Pantry, trong transaction, có version. Freshness chỉ là quan sát, không kết luận an toàn."

**9. Hóa đơn trùng thì sao?**
> "So identity trước: khác số hóa đơn là khoản mua khác; không số thì cần khớp merchant/date/total/currency + toàn bộ dòng; mơ hồ thì bắt user chọn. Hóa đơn lặp chính xác không cộng Pantry lần hai."

**10. Đổi hồ sơ ăn giữa tuần thì sao?**
> "Preview tác động, lưu profile độc lập, repair chỉ từ hôm nay, giữ món tương thích/ngày cũ. Không có ứng viên thì giữ plan + cảnh báo. Program đã xác nhận thì tạo DRAFT revision, không sửa lịch sử."

**11. Vì sao payOS mà không sandbox?**
> "Quyết định 14/10: payOS là provider duy nhất cho đơn mới; họ không có sandbox nên phải công khai là chuyển tiền thật; thiếu key thì tắt checkout, không giả lập. Grant chỉ qua webhook ký + query xác thực."

**12. Vì sao nhà hàng không áp hồ sơ ăn?**
> "Ngoại lệ đã duyệt 25/10: dữ liệu provider không đủ để kết luận chay/dị ứng. Chỉ áp filter người dùng chọn; nhãn provider là chưa xác minh. Recipe/plan vẫn giữ ràng buộc cứng."

**13. Vì sao backend không có unit test?**
> "Policy repo hiện không thêm test infra backend. Bằng chứng là acceptance scripts (`meal-plans:acceptance`, `vision:acceptance`, `billing:acceptance`…), HTTP checks và gate lint/typecheck/build. Đây là giới hạn em ghi rõ, không phải 'đã test toàn bộ'."

**14. Vì sao MongoDB + Prisma? Transaction thế nào?**
> "Quyết định 07/10 thay PostgreSQL bằng Mongo replica set, giữ UUID API. Provisioning bằng `prisma:push`, có validator/index; transaction dùng replica set, optimistic version và khóa document cho điểm tranh chấp."

**15. Cái gì chưa xong?**
> "Phase 21/22/27; accuracy ảnh Việt Nam thật; native authenticated E2E; endpoint submit/billing còn CHANGING; tài liệu cũ chưa dọn hết; một số gap UI (null→0, force logout cache). Em ghi trong release checklist thay vì tuyên bố READY."

### 7.8 Fallback matrix khi demo lỗi

| Tình huống | Không làm | Làm |
|---|---|---|
| AI chat fallback/tĩnh | Không giả vờ AI thật | Nói "provider đang fallback an toàn", mở notice/SSE event |
| Scan chậm/lỗi | Không confirm dữ liệu chuẩn bị trước vào Pantry thật | Mở job đã chuẩn bị, nói "job tạo trước", chỉ trạng thái/candidate |
| Cloudinary lỗi | Không sửa DB tay | Mở Network/response, chuyển sang pantry thủ công |
| UI lệch backend | Không cãi UI | Mở response/`error.code`, nói "đây là gap frontend" |
| Không nhớ enum | Không đoán | "Em kiểm tra contract" → mở OpenAPI |
| Hỏi ngoài phạm vi | Không bịa | "Thuộc Roadmap Phase 2, chưa triển khai" |
| Mất mạng | Không reset DB | Dùng screenshot/backup; nói rõ môi trường |

### 7.9 Cách nói về giới hạn (script 30 giây)

> "Có ba giới hạn em muốn nói rõ. Một: nhận diện ảnh tủ lạnh/hóa đơn mới chạy development, chưa đánh giá trên bộ ảnh Việt Nam thật nên vẫn `IN_PROGRESS`. Hai: contract submit nội dung và billing đang `CHANGING` cho client mobile, nên em không tuyên bố deploy tuần tự được. Ba: backend không có unit test theo policy repo; bằng chứng là acceptance scripts và gate build, không phải test toàn bộ. Em ghi tất cả trong release checklist."

### 7.10 Lịch 7 ngày + checklist 24h

| Ngày | Việc | Đầu ra |
|---|---|---|
| D-6 | Đọc mục 1–3; vẽ tay 6 sơ đồ | Ảnh sơ đồ |
| D-5 | Trả lời 1–5 (mục 7.7) | Câu 30–60 giây |
| D-4 | Trả lời 6–10 | Câu + file mở |
| D-3 | Trả lời 11–15 + mục 6 | Biết giới hạn |
| D-2 | Chạy demo A 2 lần, B 1 lần | Fallback matrix đã điền |
| D-1 | Phản biện 45 phút với bạn | Sửa 5 câu yếu nhất |
| D-0 | Checklist 24h, không học mới | Tỉnh táo |

**Checklist 24 giờ:**

- [ ] `git status` sạch; ghi `HEAD` demo (hiện `bd83d2d`, nhưng working tree đang có 35 file M — phải xử lý).
- [ ] Backend chạy; `/api/v1/health` 200; `/api-docs.json` mở.
- [ ] Mongo replica set sống; seed chạy; 3 tài khoản Member/Contributor/Admin.
- [ ] Member có 4 quyền ăn + 1 dị ứng; có 1 recipe hợp lệ + 1 recipe bị loại.
- [ ] **Chạy lại runbook demo bằng payload mới (Phụ lục 8.5)** — không dùng nguyên văn `DEMO_FLOW_PROFILE_RECIPE_MEALPLAN.md` bản 18/11.
- [ ] Có 1 meal plan sẵn (không phụ thuộc generate live nếu máy chậm).
- [ ] Pantry 2 item confirmed + ledger; shopping preview mở.
- [ ] Nếu demo AI: provider đã test đúng câu/ảnh; có job dự phòng.
- [ ] Nếu demo billing: chỉ mở history; **không** bấm thanh toán thật.
- [ ] Mở sẵn 6 tab: SRS, OpenAPI, `app.ts`, `chat.service.ts`, `meal-plan.service.ts`, `BACKEND_INTEGRATION.md`.
- [ ] Không để token/secret/ảnh hóa đơn thật trên slide.

### 7.11 Câu tuyệt đối tránh

- "Cái này AI làm hết." → Sai bản chất.
- "Bên em test rồi" khi chưa chạy. → Chỉ nói con số đã chạy gần nhất.
- "Chắc là/em nghĩ là" cho enum/status/quota. → Mở contract.
- "Bảo mật tuyệt đối." → "Đã giảm thiểu bằng…".
- "Scan đã xong." → "Chạy development, gate production còn mở."
- "Contributor nào cũng như nhau nên không cần kiểm tra." → Có, nhưng vẫn kiểm tra role/profile từ DB tại thời điểm submit.

---

## 8. PHỤ LỤC

### 8.1 Số liệu phải nhớ

| Số | Giá trị | Nguồn |
|---|---|---|
| Operation OpenAPI | **198** | `backend/openapi.json` |
| Nhóm API / schema | 43 / 164 | `BACKEND_INTEGRATION.md` 4.81 |
| Collection Mongo | 112 | `docs/DIETARY_PREFERENCES_VERIFICATION.md` |
| Phase | 00–27; 00–20 + 23–26 done; 21/22/27 in progress | `IMPLEMENTATION_PHASES.md` |
| Slot/tuần | 21 (7×3) | `meal-plan.service.ts` |
| Chỉ số recipe | 6 (5 bắt buộc + B12 tùy chọn) | `content.service.ts` |
| Quyền ăn | 4 | SRS 1.10 |
| Free quota/ngày | Chat 3; fridge 1; receipt 1 (khi bật billing) | SRS FR-17 |
| Scan attempts | 3 | `.env` |
| Program | 2–12 tuần; 1–3 alternative/tuần | `env.ts` |
| Storage | 1 GiB; ảnh 10 MB; video 100 MB | `env.ts` |
| Token | Access 15 phút; refresh 30 ngày | `env.ts` |
| Reservation/order TTL | 15 phút | `env.ts` |
| Combo | 69k/176k/580k VND (30/90/360 ngày) | `billing.catalog.ts` |
| Quyền lợi combo | 300 chat + 30 fridge + 30 receipt mỗi 30 ngày; +50 slot | SRS FR-17 / `billing.catalog.ts` |
| Gói lẻ | Chat 100 = 29k; fridge/receipt 10 hoặc 50 slot = 19k | `billing.catalog.ts` |
| Bán kính web | mặc định 3 km, tối đa 5 km | `BACKEND_INTEGRATION.md` 4.76 |

### 8.2 Bản đồ file bằng chứng (mở đúng chỗ khi bị hỏi)

| Chủ đề | File |
|---|---|
| Yêu cầu chuẩn | `docs/SRS.md` |
| Luật nghiệp vụ | `docs/IMPLEMENTATION_PLAN.md` §5 |
| Trạng thái phase | `backend/docs/IMPLEMENTATION_PHASES.md` |
| Trạng thái endpoint | `frontend/docs/BACKEND_INTEGRATION.md` |
| Config | `backend/src/config/env.ts`, `backend/.env.example` |
| Diet & precedence | `backend/src/modules/profile/profile.service.ts`, `content/search-constraints.ts` |
| Impact/repair | `backend/src/modules/dietary-impact/dietary-impact.service.ts` |
| Allergy warnings | `backend/src/modules/content/recipe-allergy-warnings.ts` |
| Xuất bản nội dung | `content-publication.policy.ts`, `content.repository.ts:717–784` |
| Kiểm duyệt | `backend/src/modules/moderation/moderation.service.ts` |
| Meal plan | `backend/src/modules/meal-plans/meal-plan.service.ts` |
| Entitlement/quota | `backend/src/modules/entitlements/entitlement.service.ts` |
| Chat/SSE | `backend/src/modules/chat/chat.service.ts` |
| Lỗi chuẩn | `backend/src/common/middleware/error-handler.ts` |
| Frontend architecture | `frontend/docs/ARCHITECTURE.md` |
| Mapper lỗi null→0 | `frontend/src/features/recipe/mappers/recipe.mapper.ts` |
| Logout/cache | `frontend/src/lib/auth-refresh.ts` |
| OTP demo | `frontend/src/app/(auth)/verify-otp/page.tsx` |
| Release gate | `backend/docs/RELEASE_CHECKLIST.md` |

### 8.3 Sáu sơ đồ vẽ tay trong 60 giây

1. **Kiến trúc:** Web/Mobile → REST `/api/v1` → Express (router → controller → service → repository) → Mongo; adapter OpenAI/Cloudinary/SerpApi/payOS.
2. **Vòng đời nội dung:** `DRAFT → PENDING_REVIEW → PUBLISHED/REJECTED`; sửa bài publish → revision mới.
3. **Diet precedence:** Dị ứng/loại trừ > nhóm động vật bị cấm + nhóm bị tắt > giới hạn sức khỏe > xếp hạng.
4. **Scan:** upload asset → job QUEUED → PROCESSING → READY/PARTIAL → user sửa → CONFIRM (transaction) → Pantry.
5. **Chat:** reserve → moderate → stream → complete → commit; lỗi → release.
6. **Billing:** order PENDING → payOS checkout → webhook ký → verify query → settle → grant once.

### 8.4 Từ điển nhanh VI–EN

| VI | EN / code |
|---|---|
| Ràng buộc cứng | hard constraint |
| Nguyên liệu chuẩn | canonical ingredient |
| Thành phần cấu thành | ingredient composition |
| Truy xuất nguồn gốc | provenance |
| Hệ số giữ lại dinh dưỡng | nutrient retention factor |
| Hệ số hao hụt/khối lượng | cooking yield factor |
| Kho nguyên liệu | pantry |
| Hóa đơn | receipt |
| Danh sách cần mua | shopping gap/list |
| Xác nhận | confirmation |
| Thu hồi phiên | session revocation / token rotation |
| Kiểm toán | audit trail |
| Đặt trước dung lượng | reservation |
| Gói quyền lợi | entitlement |

### 8.5 Payload đúng cho luồng hồ sơ mới (thay runbook 18/11)

`docs/DEMO_FLOW_PROFILE_RECIPE_MEALPLAN.md` được viết trước thay đổi 19/11 và **sẽ fail** nếu chạy nguyên văn. Dùng chuỗi request dưới đây cho bản hiện tại.

**Bước 1 — đọc revision hiện tại**

```http
GET /api/v1/users/me
```

Lấy `data.dietPreference?.dietaryRevision` (chưa có hồ sơ → dùng `0`).

**Bước 2 — preview (không bắt buộc nhưng nên demo)**

```http
POST /api/v1/diet-rules/preview
Content-Type: application/json

{
  "allowEggs": true,
  "allowDairy": true,
  "allowHoney": true,
  "allowFivePungent": false
}
```

Response: `policyVersion`, `selection`, `constraints[{code,label,allowed}]`. Không còn `ruleSetVersion`/rule ID.

**Bước 3 — preview tác động lên kế hoạch (read-only)**

```http
POST /api/v1/users/me/diet-preferences/impact-preview
```

Body **giống hệt** body lưu ở bước 4 (kể cả `expectedDietaryRevision`).

**Bước 4 — lưu hồ sơ**

```http
PUT /api/v1/users/me/diet-preferences
Content-Type: application/json

{
  "allowEggs": true,
  "allowDairy": true,
  "allowHoney": true,
  "allowFivePungent": false,
  "policyVersion": 1,
  "expectedDietaryRevision": 0,
  "allergies": [
    { "allergenCode": "SOY", "severity": "SEVERE" }
  ],
  "ingredientExclusions": [
    {
      "ingredientId": "00000000-0000-0000-0000-000000000000",
      "ingredientName": "Nấm hương tươi",
      "reason": "Kiêng trong buổi demo"
    }
  ],
  "ingredientAllergies": []
}
```

Lưu ý hợp đồng (`profile.schemas.ts:114–144`):

- Schema `.strict()` → **không gửi field thừa** (`dietPattern`, `tradition`, `rules`… sẽ bị 400).
- `allergies` và `ingredientExclusions` **thay thế toàn bộ**; gửi `[]` = xóa hết.
- `ingredientAllergies` **không gửi** = giữ nguyên danh sách cũ; gửi `[]` = xóa hết. Đây là điểm rất dễ mất dị ứng nguyên liệu khi demo.
- Lệch revision → `409 DIET_PREFERENCES_CONFLICT` + `fields.currentRevision`.

**Bước 5 — sửa kế hoạch bị ảnh hưởng**

```http
POST /api/v1/meal-plans/diet-repair/preview
{ "planIds": ["<uuid-1>"], "expectedDietaryRevision": 1 }

POST /api/v1/meal-plans/diet-repair/apply
{ "proposalId": "<uuid>", "idempotencyKey": "demo-repair-2026-11-29-v1" }
```

**Bước 6 — program đã xác nhận**

```http
POST /api/v1/meal-programs/{id}/diet-revision
{ "expectedVersion": 3, "idempotencyKey": "demo-program-revision-v1" }
```

Kết quả là DRAFT liên kết, không sửa program nguồn.

> Nếu chỉ có 5 phút demo: bỏ bước 2 và 3, đi thẳng bước 4 với dữ liệu đã chuẩn bị; nhưng vẫn phải đọc `dietaryRevision` trước để tránh 409.

---

## 9. KẾT LUẬN 5 CÂU (thuộc lòng)

1. Backend giữ luật an toàn; client chỉ gửi ý định.
2. Hồ sơ ăn hiện tại là 4 quyền hằng ngày; thịt/cá luôn bị loại; dị ứng/loại trừ đè tất cả.
3. AI chỉ đề xuất, có provenance; người dùng/người duyệt mới là quyết định.
4. Mọi thay đổi dữ liệu nhạy cảm đi qua transaction + confirm + audit + idempotency.
5. Em biết rõ phần chưa xong (scan thật, native, submit/billing CHANGING, doc drift) và ghi trong release checklist thay vì tuyên bố quá mức.

---

*Tài liệu này tổng hợp từ source và registry tại `HEAD bd83d2d`, ngày 19/11/2026. Không thay thế SRS/Implementation Plan khi có xung đột. Nếu bảo vệ ở commit khác, kiểm tra lại `git status`, `IMPLEMENTATION_PHASES.md` và `BACKEND_INTEGRATION.md` trước khi dùng số liệu.*
