# 11. Luồng hồ sơ Member → tìm kiếm → lọc cứng → xếp hạng

**Cập nhật:** 2026-11-17 · **Đối chiếu:** `dev` @ `3c6c59c`.
Dùng cho sơ đồ "Personalized recipe discovery": Member → Setup Profile → Search recipes → Apply hard rules → Rank results → Choose a recipe.

---

## 1. Đánh giá sơ đồ: đúng khung, thiếu 7 chi tiết

| Mắt xích trong sơ đồ | Thực tế | Ghi chú |
|---|---|---|
| Member | Có 2 loại phiên: Guest và Member | Guest chỉ lọc theo filter chọn tay; Member dùng hồ sơ đã lưu |
| Setup Profile | Không phải một màn hình; gồm **hồ sơ cơ bản, hồ sơ sức khỏe, chế độ ăn + quy tắc, dị ứng/kiêng**, và **consent cá nhân hóa** | Hồ sơ sức khỏe **không** dùng cho tìm recipe; nó dùng cho mục tiêu meal plan |
| Search recipes | Có **2 đường**: `GET /posts` (tìm kiếm văn bản) và `GET /recommendations/home` (gợi ý cá nhân hóa) | Sơ đồ đang trộn hai đường |
| Apply hard rules | Chạy **bên trong** search/recommendation, trước khi chấm điểm và phân trang | Không phải bước client riêng |
| Rank results | Search: điểm relevance văn bản. Recommendation: điểm hành vi **chỉ khi consent** | Hai công thức khác nhau |
| Choose a recipe | Mở chi tiết; món bị loại vẫn xem được | Danh sách `INELIGIBLE` là tab riêng |

**Ba câu dễ nói sai:**
1. "Hồ sơ sức khỏe quyết định món nào hiện ra" → **sai**; search chỉ dùng diet/allergy/exclusion/tradition.
2. "Lọc ở frontend rồi backend chỉ sắp xếp" → **sai**; lọc cứng chạy trong Mongo pipeline trước sort/pagination.
3. "Cá nhân hóa mặc định" → **sai**; chỉ khi `personalizationPreference.enabled` và đúng `consentVersion`.

---

## 2. Luồng dữ liệu tổng quát

```
[Member]
   │ 1. lưu hồ sơ ăn uống
   ▼
PUT /users/me/diet-preferences ──► validate catalog + rule set version
   │                                └─ transaction: preference, rules, schedule,
   │                                   allergies, ingredient allergies, exclusions
   ▼
DB: diet_preferences, diet_preference_rules, diet_schedule_dates,
    user_allergies, user_ingredient_allergies, user_ingredient_exclusions
   │
   │ 2. tìm kiếm / mở trang chủ
   ▼
GET /posts?q=&forDate=&eligibility=   hoặc   GET /recommendations/home
   │
   ├─ optionalAuthenticate → đọc hồ sơ từ DB (không tin client)
   ├─ build constraints (diet, allergen codes, ingredient ids, names, traditions)
   ├─ load safety catalog + closure (composition xuyên cấp)
   ├─ Mongo $match: PUBLISHED + revision PUBLISHED + hard checks
   ├─ search: text score; recommendation: behavioral score (nếu consent)
   ├─ sort → skip/limit → count sau lọc
   ▼
Response: data + meta.appliedConstraints (+ eligibility reasons nếu INELIGIBLE)
   │
   ▼
UI: card / tab "Phù hợp" – "Không phù hợp" → chọn món → detail
```

---

## 3. Setup Profile — 4 nhóm dữ liệu

### 3.1 Hồ sơ cơ bản
Tên hiển thị, avatar, bio. Không tham gia lọc recipe.

### 3.2 Hồ sơ sức khỏe
Chiều cao, cân nặng, tuổi, giới tính, mức vận động → BMI/BMR/TDEE.
**Không** nằm trong `searchProfileSelect` (content.repository 62–88), nên **không** ảnh hưởng tìm recipe; dùng cho meal plan/analysis.

### 3.3 Chế độ ăn + quy tắc
- Bộ ba: `dietPattern` (VEGAN/LACTO_OVO), `practiceSchedule` (PERMANENT/PERIODIC), `tradition` (NONE/BUDDHIST/CHRISTIAN).
- `POST /diet-rules/preview` trả bộ quy tắc mặc định theo `ruleSetVersion` (`profile.service.ts` 210–219).
- Người dùng bật/tắt từng rule; rule `hardConstraint` không được tắt.
- Lưu phải khớp `ruleSetVersion` mới nhất; lệch → `DIET_RULE_RECONFIRMATION_REQUIRED` (270–277).
- `PERIODIC` bắt buộc có ngày; `PERMANENT` không nhận ngày (255–268).

### 3.4 Dị ứng và kiêng
- Dị ứng theo **catalog tên** (`allergenCode`), backend chỉ nhận definition active; mã lạ → `INVALID_ALLERGEN_SELECTION` (236–247).
- Dị ứng nguyên liệu theo canonical `ingredientId` active (225–235).
- Loại trừ nguyên liệu: canonical id hoặc text chuẩn hóa; trùng/rỗng → `INVALID_INGREDIENT_EXCLUSIONS` (364–401).
- Toàn bộ lưu trong **một transaction**, thay thế cấu hình cũ (`profile.repository.ts` 142–225).

### 3.5 Consent cá nhân hóa
- `PersonalizationPreference.enabled` + `consentVersion`.
- Không có consent → không ghi behavior event (`recommendation.service.ts` 159–166) và ranking rơi về cold start.

---

## 4. Tìm kiếm và lọc cứng

### 4.1 Hai entry point
| Entry | API | Dùng gì để xếp hạng |
|---|---|---|
| Tìm kiếm | `GET /api/v1/posts?type=RECIPE` | Relevance văn bản (title, ingredient, category, tag, excerpt, body) |
| Gợi ý | `GET /api/v1/recommendations/home` | Behavioral score nếu consent; cold start nếu không |

Cả hai **dùng chung** `buildAuthenticatedSearchConstraints` và lọc cứng trước.

### 4.2 Constraint được dựng từ DB
`backend/src/modules/content/search-constraints.ts` 48–106:
- Schedule: PERMANENT luôn áp; PERIODIC chỉ khi `forDate` nằm trong danh sách ngày (54–59).
- Traditions: chỉ rule **enabled + active + hardConstraint + có tradition** (60–70).
- Allergen codes + ingredient allergy ids (71–78).
- Exclusions: canonical ids + normalized names (74–78).
- `dietPattern = profile.dietPattern ?? requestedDietPattern` (79).
- Có bất kỳ constraint nào → `requireResolvedIngredients = true` (80–86).

`forDate` mặc định là hôm nay theo `Asia/Ho_Chi_Minh`; query schema ở `content.schemas.ts` 248.

### 4.3 Lọc cứng nằm ở đâu
`backend/src/modules/content/content-search.mongo.ts` 88–218:
1. `$match` Post `PUBLISHED`, chưa xoá, có `published_revision_id` (89–97).
2. Join revision, recipe detail, ingredients, canonical ingredients, allergens, aliases, categories, tags, diet compatibility (102–112).
3. Precompute `blockedIngredientIds` từ safety catalog (124–127).
4. Kiểm tra:
   - ingredient nằm ngoài catalog → loại (128–140);
   - diet compatibility (143–159);
   - allergen snapshot + allergen xuyên composition (160–165);
   - exclusion theo id và tên/alias (166–177);
   - tradition warning (178–181);
   - unresolved/không EXACT (182–202).
5. `ELIGIBLE` mặc định giữ món qua mọi check; `INELIGIBLE` đảo điều kiện và chỉ trả recipe (203–218).

**Thứ tự quan trọng:** filter → search match → score → sort → skip/limit → count. Nhờ vậy phân trang và tổng số đúng, ranking không thể "kéo lại" món đã bị loại.

### 4.4 Composition xuyên cấp
`backend/src/modules/catalog/ingredient-safety.ts`:
- `closure()` đi xuống component tối đa 32 cấp, phát hiện cycle, kiểm tra evidence/source/version/scope/reviewer (75–117).
- Thiếu bất kỳ điều kiện nào → `complete = false` → `INGREDIENT_COMPOSITION_UNCERTAIN`.
- `reasons()` kiểm tra allergen, exclusion, diet, tradition trên **toàn bộ closure** (119–174).
- `blockedIngredientIds()` biến thành danh sách id bị chặn (176–180).

Đây là lý do một hợp chất như sốt/bột nêm vẫn bị loại nếu thành phần con chưa được review đầy đủ.

### 4.5 Khách và Member khác nhau
- Guest: chỉ `requestedDietPattern` (nếu có) và `requireResolvedIngredients` theo filter đó (`search-constraints.ts` 24–46).
- Member: hồ sơ đã lưu **được ưu tiên**; filter `dietPattern` trên query không ghi đè `profile.dietPattern`.
- `INELIGIBLE` chỉ có ý nghĩa với Member; FE chỉ bật query này khi đã đăng nhập (`recipes/page.tsx` 86–90).

---

## 5. Xếp hạng

### 5.1 Search (`GET /posts`)
`content-search.mongo.ts` 251–277:
- Khớp title chính xác: 400; title chứa: 300; ingredient: 200; category: 100; tag: 80; excerpt: 60; body: 40; cộng trigram similarity.
- Sort: `score desc → published_at desc → _id asc` (313).

### 5.2 Recommendation (`GET /recommendations/home`)
`recommendation.service.ts`:
- Candidate pool 200 (dòng 26), lấy sau khi đã lọc cứng (283–292).
- Consent: chỉ đọc behavior events khi `preference.enabled` (348–355).
- Lookback 30 ngày, half-life 14 ngày (23–24).
- Tín hiệu dương: nguyên liệu tương đồng, bookmark tương tự, rating cao, xem lặp, chat topic, search gần đây.
- Tín hiệu âm: `ACCEPT_MEAL` cùng món −4, `SWAP/REJECT` món tương tự −3.
- Không personalized → cold start: `ratingAverage*2 + 0.5*log1p(vote) + 0.5*log1p(bookmark)` (458–461).
- Trả `reasonCodes` tối đa 2 (462–486).
- `scoringVersion`, `personalized`, `appliedConstraints` trong meta (314–323).

### 5.3 Không tái đưa món bị loại
Cả hai đường đều lấy candidate từ câu query đã lọc cứng; score không có quyền thêm item. Vì vậy không thể "rank lại" món dị ứng.

---

## 6. Trạng thái và metadata

| Đối tượng | Trạng thái / trường | Ý nghĩa |
|---|---|---|
| DietPreference | `ruleSetVersion`, `confirmedAt` | Bộ quy tắc đã xác nhận; lệch version phải xác nhận lại |
| DietPreferenceRule | `enabled`, `source` | Rule bật/tắt; rule cứng luôn bật |
| Schedule | `PERMANENT` / `PERIODIC` + `dates` | Ngày áp dụng tradition |
| Allergy | `active` | Chỉ allergy active được dùng |
| Exclusion | `active` | Chỉ exclusion active được dùng |
| Personalization | `enabled`, `consentVersion` | Quyết định có dùng behavior events |
| Kết quả tìm | `ELIGIBLE` / `INELIGIBLE` | Mặc định eligible; ineligible là tab riêng |
| Meta | `appliedConstraints`, `rankingVersion`/`scoringVersion`, `personalized`, `forDate` | Giải thích vì sao kết quả như vậy |
| Món bị loại | `recipe.eligibility.reasons[]` | Mã lý do + tên nguyên liệu vi phạm |

---

## 7. Những điểm cần bổ sung vào mô tả của bạn

1. **Setup Profile không chỉ là diet**: còn hồ sơ sức khỏe (không dùng cho search), dị ứng theo catalog, loại trừ, lịch, consent.
2. **Rule confirmation + version**: đổi bộ ba → preview bộ quy tắc mới → xác nhận; version lệch → lỗi.
3. **Lọc cứng nằm trong backend pipeline**, trước rank và pagination.
4. **Composition xuyên cấp**: hợp chất chưa review đầy đủ bị loại; không coi "không thấy allergen" là an toàn.
5. **Selected meal date**: chỉ ảnh hưởng tradition PERIODIC; mặc định hôm nay VN; web recipe list chưa có date picker, recommendation API có `forDate`.
6. **Hai công thức rank**: text relevance cho search, behavioral cho recommendation; consent mới có cá nhân hóa.
7. **Tab INELIGIBLE**: chỉ để giải thích, không trộn vào kết quả, không vào meal plan; detail vẫn xem được.
8. **Guest vs Member**: guest không có hồ sơ, chỉ filter tay; member ưu tiên hồ sơ đã lưu.

---

## 8. Kịch bản nói 90 giây

> "Luồng khám phá cá nhân hóa có hai nửa: thiết lập hồ sơ và truy vấn.
>
> Hồ sơ gồm bốn nhóm: thông tin cơ bản; hồ sơ sức khỏe dùng cho mục tiêu bữa ăn; chế độ ăn gồm kiểu ăn, lịch và truyền thống kèm bộ quy tắc được xác nhận theo phiên bản; và dị ứng/kiêng chọn từ danh mục chuẩn. Toàn bộ lưu trong một transaction, nên không có trạng thái nửa vời.
>
> Khi tìm, backend không tin dữ liệu client gửi lên. Nó đọc hồ sơ từ database, dựng constraint cho đúng ngày, rồi lọc cứng ngay trong Mongo: dị ứng, loại trừ, chế độ ăn, truyền thống, và cả thành phần lồng nhau qua composition. Dữ liệu chưa đủ tin cậy thì bị loại, không được coi là an toàn. Lọc xong mới chấm điểm và phân trang.
>
> Tìm kiếm chấm relevance văn bản; gợi ý chấm tín hiệu hành vi nhưng chỉ khi người dùng bật consent, còn không thì cold start theo rating/vote/bookmark. Món bị hồ sơ loại chỉ hiện ở tab Không phù hợp kèm lý do, không bao giờ quay lại ranking hay meal plan. Người dùng chọn món nào thì mở chi tiết món đó."

---

## 9. Câu hỏi nối tiếp

| Câu hỏi | Trả lời ngắn |
|---|---|
| Vì sao lọc trước rank? | Để món dị ứng không thể quay lại bằng điểm; tổng số và phân trang cũng đúng |
| Nếu nguyên liệu chưa xác định? | Bị loại khi có constraint cứng; không coi là 0 hay an toàn |
| Nếu hợp chất thiếu dữ liệu? | `INGREDIENT_COMPOSITION_UNCERTAIN`; loại |
| Khách có được cá nhân hóa? | Không; chỉ filter tay, ranking ngữ cảnh |
| Consent tắt thì sao? | Không ghi event, không đọc event; cold start |
| Vì sao member không thấy món hợp khẩu vị? | Có thể bị hồ sơ loại; xem tab Không phù hợp để biết lý do |
| Đổi ngày ăn chay ở đâu? | `forDate` khi gọi API; web recipe list hiện dùng hôm nay, recommendation nhận `forDate` |
| Restaurant có áp hồ sơ không? | Không; ngoại lệ đã duyệt, chỉ filter tường minh |
