# 12. Kịch bản nói 2 phút — hồ sơ Member & khám phá cá nhân hóa

**Cập nhật:** 2026-11-17 · **Đối chiếu:** `dev` @ `3c6c59c`.
Dùng cho sơ đồ "Personalized recipe discovery": Member → Setup Profile → Search recipes → Apply hard rules → Rank results → Choose a recipe.

---

## 1. Mục tiêu và thời lượng

| Phần | Thời lượng | Điều phải cắm cờ |
|---|---:|---|
| Mở | 0:00–0:20 | 2 nửa, 4 nhóm hồ sơ, 2 entry point |
| Setup Profile | 0:20–0:50 | catalog, rule version, transaction |
| Search + ngày | 0:50–1:20 | `forDate`, PERIODIC, guest vs member |
| Lọc cứng | 1:20–1:45 | composition, thứ tự filter trước rank |
| Xếp hạng | 1:45–2:10 | search vs recommendation, consent, cold start |
| Chọn món + kết | 2:10–2:25 | tab INELIGIBLE, detail vẫn xem được |

> Bản 45 giây ở mục 6.

---

## 2. Lời nói từng câu

### 2.1 Mở (20 giây)

> "Em xin trình bày luồng khám phá công thức cá nhân hóa. Luồng này có **hai nửa**: thiết lập hồ sơ ăn uống của Member, và truy vấn tìm kiếm/gợi ý. Điểm cốt lõi là **lọc cứng chạy trong backend trước khi xếp hạng**, nên món không phù hợp không thể quay lại bằng điểm."

**Nếu bị hỏi "hồ sơ gồm gì?"** → mở `frontend/src/features/diet-preferences/components/diet-wizard.tsx` dòng 40–61:
> "Bốn bước: chế độ ăn, quy tắc, dị ứng và kiêng, xác nhận. Ngoài ra còn hồ sơ sức khỏe ở màn hình khác."

---

### 2.2 Setup Profile (30 giây)

> "Hồ sơ có bốn nhóm. Nhóm một là thông tin cơ bản. Nhóm hai là hồ sơ sức khỏe — chiều cao, cân nặng, tuổi, mức vận động — nhưng nhóm này **không dùng để lọc công thức**, chỉ dùng cho mục tiêu bữa ăn. Nhóm ba là chế độ ăn: kiểu ăn, lịch thực hành và truyền thống; hệ thống trả một bộ quy tắc theo phiên bản, người dùng xác nhận và bật/tắt từng quy tắc. Nhóm bốn là dị ứng và nguyên liệu kiêng: dị ứng phải chọn từ **danh mục chuẩn đang hoạt động**, không nhập mã tùy ý. Toàn bộ được lưu trong **một transaction**, và nếu bộ quy tắc đã đổi phiên bản thì backend bắt xác nhận lại."

**Chỗ dừng 1:** nếu hỏi "vì sao bắt xác nhận lại?" → `backend/src/modules/profile/profile.service.ts` dòng 270–277:
> "Lưu phải khớp `ruleSetVersion` mới nhất; lệch thì trả `DIET_RULE_RECONFIRMATION_REQUIRED` để người dùng xem lại, không âm thầm áp luật mới."

**Chỗ dừng 2:** nếu hỏi "lưu có nguyên tử không?" → `backend/src/modules/profile/profile.repository.ts` dòng 142–225:
> "Một transaction thay thế preference, rules, schedule, allergies, ingredient allergies và exclusions; lỗi giữa chừng thì rollback."

**Chỗ dừng 3:** nếu hỏi "dị ứng tự do hay theo danh mục?" → `profile.service.ts` 236–247:
> "Chỉ nhận `allergenCode` có definition active; mã lạ trả `INVALID_ALLERGEN_SELECTION`."

---

### 2.3 Search và selected meal date (30 giây)

> "Khi người dùng tìm hoặc mở trang chủ, backend **không tin dữ liệu client gửi lên**. Nó đọc lại hồ sơ từ database, rồi dựng constraint. Với lịch `PERMANENT`, luật truyền thống áp mọi ngày; với `PERIODIC`, chỉ áp khi ngày được chọn nằm trong danh sách — đó là ý nghĩa của **selected meal date**. Ngày mặc định là hôm nay theo giờ Việt Nam. Khách không có hồ sơ thì chỉ lọc theo filter chọn tay; Member thì hồ sơ đã lưu được ưu tiên hơn filter trên query."

**Chỗ dừng:** nếu hỏi "constraint gồm gì?" → `backend/src/modules/content/search-constraints.ts` dòng 48–106:
> "Diet pattern, allergen codes, ingredient allergy ids, exclusion ids và tên chuẩn hóa, traditions; có bất kỳ constraint nào thì bắt buộc nguyên liệu phải resolve EXACT."

**Nếu hỏi "web có chọn ngày không?"**:
> "Backend nhận `forDate`; trang recipe hiện dùng hôm nay, còn API gợi ý và meal plan truyền ngày cụ thể. Đây là điểm em nói rõ để không claim quá giao diện."

---

### 2.4 Lọc cứng (25 giây)

> "Lọc cứng chạy ngay trong Mongo, trước chấm điểm và phân trang. Hệ thống join revision, recipe detail, nguyên liệu, allergen, alias, category và diet compatibility; sau đó loại món nếu: nguyên liệu chưa resolve, có allergen, có nguyên liệu bị loại trừ, sai chế độ ăn, hoặc vướng luật truyền thống. Điểm quan trọng là hệ thống kiểm tra **thành phần lồng nhau**: một hợp chất như sốt hay bột nêm vẫn bị loại nếu thành phần con chưa được review đầy đủ. Không thấy allergen ở bản ghi cha **không** có nghĩa là an toàn."

**Chỗ dừng 1:** nếu hỏi "hợp chất kiểm tra thế nào?" → `backend/src/modules/catalog/ingredient-safety.ts` dòng 75–117 và 119–174:
> "Closure đi tối đa 32 cấp, phát hiện cycle, kiểm tra source/version/scope/reviewer; thiếu là `complete = false` và trả `INGREDIENT_COMPOSITION_UNCERTAIN`."

**Chỗ dừng 2:** nếu hỏi "vì sao lọc trước rank?" → `content-search.mongo.ts` 203–218 và 313:
> "Filter nằm trước sort/skip/limit, nên món đã loại không thể quay lại bằng điểm, và tổng số/phân trang vẫn đúng."

---

### 2.5 Xếp hạng (25 giây)

> "Có **hai công thức xếp hạng**. Tìm kiếm chấm relevance văn bản: tiêu đề, nguyên liệu, category, tag, mô tả và thân bài. Gợi ý cá nhân hóa chấm tín hiệu hành vi như nguyên liệu tương đồng, bookmark, rating cao, xem lặp, chủ đề chat và tìm kiếm gần đây. Nhưng tín hiệu hành vi **chỉ được dùng khi người dùng bật consent**; không có consent thì hệ thống rơi về cold start theo rating, vote và bookmark. Cả hai đường đều nhận candidate từ tập đã lọc cứng, nên cá nhân hóa không thể thêm món bị loại."

**Chỗ dừng 1:** nếu hỏi "consent nằm đâu?" → `backend/src/modules/recommendations/recommendation.service.ts` 348–355:
> "Chỉ đọc behavior events khi `preference.enabled`; event cũng chỉ được ghi khi consent bật."

**Chỗ dừng 2:** nếu hỏi "cold start tính gì?" → cùng file 458–461:
> "Rating trung bình nhân 2, cộng log của vote và bookmark; không dùng hành vi cá nhân."

**Chỗ dừng 3:** nếu hỏi "vì sao user thấy lý do?" → 462–486:
> "Trả tối đa hai `reasonCodes`; frontend hiển thị để giải thích gợi ý."

---

### 2.6 Chọn món và kết (15 giây)

> "Món bị hồ sơ loại vẫn mở chi tiết được, nhưng chỉ xuất hiện trong tab **Không phù hợp** kèm mã lý do và tên nguyên liệu vi phạm; tab này không trộn vào kết quả phù hợp, không vào ranking và không vào meal plan. Tóm lại: hồ sơ do người dùng xác nhận, lọc cứng do backend thực thi, cá nhân hóa chỉ là tín hiệu xếp hạng sau khi đã an toàn."

**Chỗ dừng:** nếu hỏi "tab đó ở đâu?" → `frontend/src/app/(site)/recipes/page.tsx` 74–101 và `recipe-card.tsx` 103–115.

---

## 3. Ba nơi nên chủ động mở

1. `search-constraints.ts` 48–106 — hồ sơ biến thành constraint.
2. `content-search.mongo.ts` 114–218 — lọc cứng trước rank.
3. `recommendation.service.ts` 348–380 và 458–461 — consent và cold start.

Mỗi file mở 5–7 giây, chỉ đúng dòng, đọc một câu rồi quay lại.

---

## 4. Nếu hội đồng hỏi ngay sau script

| Câu hỏi | Trả lời ngắn | File |
|---|---|---|
| Hồ sơ sức khỏe có lọc món không? | Không; chỉ dùng cho mục tiêu bữa ăn | `content.repository.ts` 62–88 |
| Lọc ở frontend hay backend? | Backend, trong Mongo pipeline trước rank | `content-search.mongo.ts` 203–218 |
| Nguyên liệu chưa xác định? | Loại khi có constraint cứng; không coi là 0/an toàn | 182–202 |
| Hợp chất thiếu dữ liệu? | `INGREDIENT_COMPOSITION_UNCERTAIN`; loại | `ingredient-safety.ts` 75–117 |
| Khách có cá nhân hóa không? | Không; chỉ filter tay | `search-constraints.ts` 24–46 |
| Consent tắt thì sao? | Không ghi/không đọc event; cold start | `recommendation.service.ts` 348–355 |
| Vì sao Member không thấy món? | Có thể bị hồ sơ loại; xem tab Không phù hợp | `recipes/page.tsx` 86–99 |
| Selected date ảnh hưởng gì? | Chỉ tradition `PERIODIC`; mặc định hôm nay VN | `search-constraints.ts` 54–59 |
| Restaurant có áp hồ sơ không? | Không; ngoại lệ đã duyệt | `IMPLEMENTATION_PLAN.md` BL-16 |
| Vì sao không dùng AI để lọc? | AI không được tạo luật cứng; dữ liệu phải review | `docs/SRS.md` FR-05 |

---

## 5. Câu chữ tuyệt đối tránh

| Không nói | Nói thay |
|---|---|
| "Hồ sơ sức khỏe quyết định món nào hiện ra" | "Hồ sơ sức khỏe dùng cho mục tiêu bữa ăn; lọc recipe dùng diet/allergy/exclusion" |
| "Frontend lọc rồi backend xếp hạng" | "Backend lọc cứng trước rank và phân trang" |
| "Cá nhân hóa mặc định" | "Chỉ khi consent bật; không thì cold start" |
| "Món bị loại bị ẩn hoàn toàn" | "Vẫn xem chi tiết; chỉ tách khỏi tab phù hợp và meal plan" |
| "Search và recommendation giống nhau" | "Cùng lọc cứng, khác công thức xếp hạng" |
| "Chỉ cần tên allergen là đủ" | "Kiểm tra cả composition lồng nhau; thiếu dữ liệu thì loại" |
| "Selected date đổi toàn bộ kết quả" | "Chỉ ảnh hưởng luật truyền thống PERIODIC" |
| "Chắc là/em nghĩ là" (khi nói enum) | "Em kiểm tra contract hiện tại" rồi mở file |

---

## 6. Bản rút gọn 45 giây

> "Member lưu hồ sơ ăn uống gồm kiểu ăn, lịch, truyền thống, bộ quy tắc đã xác nhận, dị ứng theo danh mục chuẩn và nguyên liệu kiêng. Hồ sơ sức khỏe là nhóm riêng, không dùng để lọc recipe.
>
> Khi tìm hoặc mở gợi ý, backend đọc hồ sơ từ DB, dựng constraint theo ngày rồi lọc cứng trong Mongo trước khi chấm điểm và phân trang. Lọc gồm dị ứng, loại trừ, chế độ ăn, truyền thống và thành phần lồng nhau; dữ liệu chưa đủ thì loại.
>
> Tìm kiếm chấm relevance văn bản; gợi ý chấm hành vi khi có consent, không thì cold start. Món bị loại chỉ hiện ở tab Không phù hợp kèm lý do, không quay lại ranking hay meal plan."

---

## 7. Checklist trước khi nói

- [ ] Mở sẵn 3 file: `search-constraints.ts`, `content-search.mongo.ts`, `recommendation.service.ts`.
- [ ] Biết tài khoản demo đã có diet/allergy chưa; nếu chưa, chuẩn bị một Member có hồ sơ.
- [ ] Có sẵn 1 món phù hợp và 1 món bị loại để so.
- [ ] Nhớ 4 nhóm hồ sơ và 2 entry point.
- [ ] Nhớ thứ tự: **filter → score → sort → paginate**.
