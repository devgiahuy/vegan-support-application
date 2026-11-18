# 13. Các loại thông tin ăn chay của User — giải thích & tra cứu

**Cập nhật:** 2026-11-17 · **Đối chiếu:** `dev` @ `3c6c59c`.
Dùng khi cần nhớ nhanh màn hình "Chế độ ăn" và cách các lựa chọn này ảnh hưởng tìm kiếm / meal plan.

---

## 1. Bốn lớp thông tin, đừng gộp làm một

| Lớp | Trường dữ liệu | Giá trị | Ảnh hưởng |
|---|---|---|---|
| **Kiểu ăn** | `DietPreference.dietPattern` | `VEGAN`, `LACTO_OVO` | Lọc món **mọi ngày** |
| **Lịch thực hành** | `practiceSchedule` + `DietScheduleDate` | `PERMANENT`, `PERIODIC` + ngày | Chỉ quyết định **luật truyền thống có áp dụng hay không** |
| **Truyền thống** | `tradition` + `DietPreferenceRule` | `NONE`, `BUDDHIST`, `CHRISTIAN` + rule bật/tắt | Áp luật truyền thống vào ngày phù hợp |
| **Dị ứng / kiêng** | `UserAllergy`, `UserIngredientAllergy`, `UserIngredientExclusion` | allergen code, ingredient id, tên chuẩn hóa | Lọc cứng **mọi ngày**, ưu tiên cao nhất |

Ngoài ra còn:
- **Hồ sơ sức khỏe**: chiều cao, cân nặng, tuổi, giới, vận động → BMI/BMR/TDEE. Dùng cho mục tiêu bữa ăn, **không** dùng để lọc recipe.
- **Consent cá nhân hóa**: bật/tắt ghi nhận hành vi để xếp hạng gợi ý; không phải chế độ ăn.

Nguồn enum: `backend/prisma/schema.prisma` dòng 258–278.
Model: `DietPreference` 3124, `DietRuleDefinition` 3139, `DietPreferenceRule` 3161, `DietScheduleDate` 3178, `UserAllergy` 3193, `UserIngredientAllergy` 3210, `UserIngredientExclusion` 3228.

---

## 2. Kiểu ăn — `DietPattern`

| UI | Enum | Nghĩa | Rule bắt buộc |
|---|---|---|---|
| **Thuần chay** | `VEGAN` | Không thịt, cá, trứng, sữa, mật ong; loại sản phẩm nguồn gốc động vật | `DIET_VEGAN_EXCLUDE_ANIMAL_PRODUCTS` — luôn bật, hard |
| **Có trứng sữa** | `LACTO_OVO` | Không thịt, cá; **được phép** trứng và sữa | `DIET_LACTO_OVO_EXCLUDE_MEAT_AND_FISH` — luôn bật, hard |

Seed rule: `backend/prisma/seed.ts` 711–729.

**Điểm cần nhớ:**
- Đây là ràng buộc **mọi ngày**, không phụ thuộc lịch.
- `LACTO_OVO` vẫn ăn được món thuần chay; dữ liệu ingredient đánh dấu compatible cho cả hai pattern khi phù hợp.
- Món có nguyên liệu chưa xác định hoặc composition chưa đủ review sẽ bị loại khi có bất kỳ ràng buộc cứng nào.
- Không thể tắt rule của diet pattern; backend trả `DIET_RULE_REQUIRED` nếu cố tắt (`profile.service.ts` 330+).

---

## 3. Lịch thực hành — `PracticeSchedule`

| UI | Enum | Nghĩa | Ràng buộc dữ liệu |
|---|---|---|---|
| **Trường chay** | `PERMANENT` | Áp dụng mọi ngày | Không nhận danh sách ngày; gửi ngày → `DIET_SCHEDULE_NOT_APPLICABLE` |
| **Chay kỳ** | `PERIODIC` | Chỉ áp dụng vào ngày được chọn | Phải có ít nhất 1 ngày; thiếu → `DIET_SCHEDULE_REQUIRED` |

Ngày lưu dạng date-only theo `Asia/Ho_Chi_Minh`. Validate: `profile.service.ts` 255–268; lưu: `profile.repository.ts` 182–187.

### Điểm cực dễ nói sai
> "Chay kỳ chỉ lọc món vào những ngày bạn chọn" — **chỉ đúng với luật truyền thống**.

- `dietPattern` (Thuần chay / Có trứng sữa) **luôn áp dụng mọi ngày**.
- `practiceSchedule` chỉ quyết định **luật truyền thống** có được bật trong ngày đó hay không (`search-constraints.ts` 54–70).
- Vì vậy:
  - `VEGAN + PERIODIC` vẫn thuần chay mỗi ngày; ngày chọn chỉ thêm luật truyền thống (nếu có).
  - `LACTO_OVO + PERIODIC + CHRISTIAN` bình thường ăn trứng/sữa; vào ngày chọn, nếu bật rule kiêng, ngày đó thành thuần chay.
  - `NONE + PERIODIC` không có luật truyền thống để áp; ngày chọn gần như không có tác dụng.

---

## 4. Truyền thống — `Tradition`

| UI | Enum | Có luật gì trong seed? |
|---|---|---|
| **Không theo truyền thống** | `NONE` | Không thêm luật |
| **Phật giáo** | `BUDDHIST` | Tùy chọn tránh **ngũ vị tân** (`TRADITION_BUDDHIST_EXCLUDE_FIVE_PUNGENT_ROOTS`) |
| **Kitô giáo** | `CHRISTIAN` | Tùy chọn kiêng sản phẩm động vật trong ngày thực hành (`TRADITION_CHRISTIAN_FASTING_EXCLUDE_ANIMAL_PRODUCTS`) |

Seed: `seed.ts` 730–749.

**Bốn rule hiện có:**

| Code | Nguồn | Default | Bản chất |
|---|---|---|---|
| `DIET_VEGAN_EXCLUDE_ANIMAL_PRODUCTS` | Diet pattern | Bật | Hard, không tắt |
| `DIET_LACTO_OVO_EXCLUDE_MEAT_AND_FISH` | Diet pattern | Bật | Hard, không tắt |
| `TRADITION_BUDDHIST_EXCLUDE_FIVE_PUNGENT_ROOTS` | Tradition | Tắt | Khi bật → hard |
| `TRADITION_CHRISTIAN_FASTING_EXCLUDE_ANIMAL_PRODUCTS` | Tradition | Tắt | Khi bật → hard |

### Cách hiểu `hardConstraint` của rule truyền thống
- `defaultEnabled: false` → mặc định không áp.
- `hardConstraint: true` → **một khi người dùng bật**, rule được enforce cứng, không phải cảnh báo mềm.
- Đây là lý do rule truyền thống vừa "tùy chọn" vừa "hard": tùy chọn lúc bật, cứng lúc đã bật.

### Cảnh báo cần kiểm tra trước demo
Theo code hiện tại, mapper FE lấy `hardConstraint` → `isHard` (`diet.mapper.ts` 62–67), và wizard đặt `enabled: isHard ? true : ...` (`diet-wizard.tsx` 139–146). Vì cả 4 rule đều `hardConstraint: true`, rule truyền thống **có thể bị xếp vào nhóm "Luôn áp dụng" và tự bật**, trái với mô tả "tùy chọn" và `defaultEnabled: false`.

Nếu demo thấy vậy:
- Về nghiệp vụ: rule truyền thống phải là **tùy chọn** (SRS/BL-04).
- Về code: đây là **gap UI/data cần sửa**, không phải thiết kế mong muốn.
- Cách nói an toàn: "Rule truyền thống mặc định tắt; nếu bật thì thành ràng buộc cứng. Em đang kiểm tra lại cách UI phân nhóm để không tự bật ngoài ý người dùng."

---

## 5. Dị ứng và kiêng — lớp ưu tiên cao nhất

### 5.1 Dị ứng theo catalog
`UserAllergy` lưu `allergenCode` + label + severity + active. Chỉ nhận definition đang active; mã lạ → `INVALID_ALLERGEN_SELECTION`.

Catalog demo: `GLUTEN`, `PEANUT`, `TREE_NUT`, `SOY`, `SESAME`, `MILK`, `EGG` (`seed.ts` 71–79).

### 5.2 Dị ứng theo nguyên liệu
`UserIngredientAllergy` lưu `ingredientId` canonical đang active. Dùng khi người dùng dị ứng một nguyên liệu cụ thể chưa có code nhóm.

### 5.3 Loại trừ nguyên liệu
`UserIngredientExclusion` lưu canonical id hoặc `normalizedName` + lý do. Dùng cho "tôi không muốn ăn nguyên liệu này", không phải dị ứng y khoa.

### 5.4 Kiểm tra xuyên composition
- Ingredient có thể là hợp chất; hệ thống đi xuống component tối đa 32 cấp (`ingredient-safety.ts` 75–117).
- Kiểm tra allergen, exclusion, diet, tradition trên **toàn bộ closure** (119–174).
- Thiếu source/version/scope/reviewer → `INGREDIENT_COMPOSITION_UNCERTAIN`; bị loại khi có ràng buộc cứng.
- Không thấy allergen ở bản ghi cha **không** có nghĩa là an toàn.

---

## 6. Thứ tự ưu tiên khi lọc

```
1. Dị ứng (allergen code + ingredient allergy)
2. Loại trừ nguyên liệu tường minh
3. Diet pattern (VEGAN / LACTO_OVO)
4. Luật truyền thống đang bật, nếu ngày áp dụng
5. Giới hạn sức khỏe / dinh dưỡng (meal plan, analysis)
6. Sở thích & tín hiệu xếp hạng
```

- 1–4 là **hard constraint**, loại trước khi rank.
- 5–6 không được khôi phục món đã bị 1–4 loại.
- Tắt/bật luật truyền thống **không bao giờ** làm mất dị ứng hoặc exclusion.

---

## 7. Ví dụ bốn tổ hợp

| Tổ hợp | Hành vi thực tế |
|---|---|
| `VEGAN + PERMANENT + NONE` | Thuần chay mọi ngày; không thêm luật truyền thống |
| `LACTO_OVO + PERMANENT + NONE` | Trứng/sữa được phép mọi ngày; thịt/cá bị loại |
| `LACTO_OVO + PERIODIC + CHRISTIAN` + bật rule kiêng | Ngày thường: trứng/sữa được phép. Ngày chọn: kiêng sản phẩm động vật (nếu dữ liệu warning có) |
| `VEGAN + PERIODIC + BUDDHIST` + bật ngũ vị tân | Thuần chay mọi ngày; ngày chọn: thêm loại nguyên liệu thuộc ngũ vị tân (nếu dữ liệu warning có) |

**Lưu ý dữ liệu demo:**
- Seed chỉ gắn warning ngũ vị tân cho **hành lá** (`seed.ts` 210–219).
- **Chưa có** ingredient warning cho Kitô giáo, nên rule Kitô giáo có thể chưa thấy tác dụng trên dữ liệu demo dù logic đã có.
- Đây là giới hạn dữ liệu demo, không phải kết luận về toàn bộ người theo tôn giáo.

---

## 8. Câu trả lời mẫu 30 giây

> "Thông tin ăn chay của user có bốn lớp: kiểu ăn gồm thuần chay hoặc có trứng sữa; lịch thực hành gồm trường chay hoặc chay kỳ; truyền thống gồm không theo, Phật giáo hoặc Kitô giáo; và dị ứng/kiêng là lớp riêng, ưu tiên cao nhất.
>
> Kiểu ăn áp dụng mọi ngày. Lịch chỉ quyết định luật truyền thống có áp dụng vào ngày đó hay không. Luật truyền thống mặc định tắt; khi bật thì thành ràng buộc cứng. Dị ứng và loại trừ luôn thắng, kể cả khi tắt luật truyền thống."

---

## 9. Câu hỏi dễ nhầm

| Câu hỏi | Trả lời |
|---|---|
| Chay kỳ có làm mất kiểu ăn thuần chay mỗi ngày? | Không; kiểu ăn luôn áp dụng, lịch chỉ ảnh hưởng luật truyền thống |
| Lacto-ovo có ăn được món thuần chay? | Có; món thuần chay tương thích với cả hai |
| Chọn Phật giáo là bắt buộc tránh ngũ vị tân? | Không; đây là rule tùy chọn, mặc định tắt |
| Kitô giáo có nghĩa là thuần chay? | Không; chỉ là rule kiêng tùy chọn trong ngày thực hành |
| Hồ sơ sức khỏe có lọc món? | Không; dùng cho mục tiêu bữa ăn |
| Dị ứng có nằm trong tradition? | Không; là lớp riêng, ưu tiên cao hơn |
| Tắt rule truyền thống có làm mất dị ứng? | Không; dị ứng/exclusion độc lập và luôn áp dụng |
| Ngũ vị tân gồm gì? | Thường là hành, hẹ, tỏi, kiệu, hưng cừ; dữ liệu phải được review, demo chỉ có hành lá |
