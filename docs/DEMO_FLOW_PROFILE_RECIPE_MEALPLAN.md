# Kịch bản demo end-to-end — Hồ sơ → Lọc → Công thức → Thực đơn tuần

**Cập nhật:** 18/11/2026 · **Đối chiếu:** `dev` @ `a4d138f`

Tài liệu này là runbook để chạy demo trên môi trường local, có dữ liệu mẫu và checkpoint rõ ràng. Luồng gồm:

1. Tạo/cập nhật hồ sơ ăn uống.
2. Chứng minh hồ sơ được backend áp dụng thành bộ lọc cứng.
3. Tạo công thức mới và xuất bản bằng tài khoản Contributor.
4. Tạo thực đơn 7 ngày, kiểm tra ràng buộc và thêm công thức vừa tạo vào một bữa.

> Đây là kịch bản demo, không phải tuyên bố endpoint mới. `POST /posts/{id}/submit` vẫn đang `CHANGING` trong registry vì phần mobile chưa được kiểm chứng thủ công trên thiết bị; web đã tích hợp. Không dùng kịch bản này để tuyên bố mọi năng lực đã `READY`.

---

## 1. Phạm vi và nguyên tắc nói khi demo

**Luồng này chứng minh:**

- Hồ sơ ăn uống được lưu trong một transaction và có hiệu lực ngay cho tìm kiếm.
- Dị ứng, nguyên liệu loại trừ, chế độ ăn và quy tắc truyền thống là ràng buộc cứng do backend thực thi.
- Công thức của Contributor/Admin được xuất bản ngay khi khai đủ 6 chỉ số dinh dưỡng và không bị moderation flag.
- Thực đơn tuần được tạo từ kho công thức đã qua lọc, có phân tích ràng buộc và danh sách đi chợ.

**Không được nói:**

- “Hồ sơ sức khỏe quyết định món nào hiện ra.” → Sai. Hồ sơ sức khỏe chỉ dùng cho mục tiêu năng lượng của thực đơn.
- “Frontend tự lọc rồi backend chỉ sắp xếp.” → Sai. Lọc cứng nằm trong pipeline backend trước khi chấm điểm và phân trang.
- “AI đã xác nhận món an toàn.” → Sai. AI không phải nguồn xác nhận dị ứng hay dinh dưỡng chuẩn.
- “Contributor này có quyền cao hơn Contributor khác.” → Sai. Mọi Contributor đã duyệt có cùng quyền; `approvalBasis` chỉ là hồ sơ audit.
- “Thực đơn chứng nhận đủ vi chất.” → Sai. Chỉ số vi chất có thể thiếu dữ liệu; phải đọc cảnh báo và độ phủ dữ liệu.

---

## 2. Chuẩn bị môi trường

Chạy tại thư mục `backend/`:

```powershell
cd D:\Project\vegan-support-application\backend
docker compose up -d mongodb mongo-init
docker compose up -d --wait mongodb
npm ci
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev
```

Chạy tại thư mục `frontend/` (terminal khác):

```powershell
cd D:\Project\vegan-support-application\frontend
npm ci
npm run dev
```

Mở `http://localhost:3000`.

**Kiểm tra nhanh API:**

```powershell
Invoke-RestMethod http://localhost:4000/api/v1/health
```

---

## 3. Tài khoản và dữ liệu seed

Mật khẩu lấy từ `backend/.env` (`SEED_MEMBER_PASSWORD`). Giá trị local hiện tại là `12345678`.

| Vai trò | Email | Dùng để |
|---|---|---|
| Contributor | `contributor@example.com` | Tạo công thức và xuất bản ngay; phù hợp nhất cho luồng demo |
| Member | `member@example.com` | Đối chứng: công thức phải qua duyệt, không xuất bản ngay |
| Admin | `admin@example.com` | Duyệt hoặc xử lý ngoại lệ nếu công thức bị moderation flag |

**Lưu ý về seed:** tài khoản Contributor đã có sẵn hồ sơ sức khỏe, dị ứng `SOY` và loại trừ nấm hương từ kịch bản seed. Bước 4 bên dưới chủ động ghi đè về hồ sơ sạch để demo được “trước/sau”. Chạy lại `npm run seed` sẽ khôi phục trạng thái seed.

**Cảnh báo:** các lệnh API bên dưới thay đổi dữ liệu của tài khoản demo. Nếu cần dữ liệu sạch, dùng database riêng hoặc chạy lại seed sau buổi demo.

---

## 4. Bảng dữ liệu demo

### 4.1 Hồ sơ

| Trường | Giá trị baseline | Giá trị sau khi cập nhật |
|---|---|---|
| `displayName` | `Minh Tâm Demo` | giữ nguyên |
| `heightCm` | `165` | giữ nguyên |
| `weightKg` | `58` | giữ nguyên |
| `age` | `30` | giữ nguyên |
| `sex` | `FEMALE` | giữ nguyên |
| `activityLevel` | `MODERATELY_ACTIVE` | giữ nguyên |
| `dietPattern` | `VEGAN` | giữ nguyên |
| `practiceSchedule` | `PERMANENT` | giữ nguyên |
| `tradition` | `NONE` | giữ nguyên |
| Dị ứng | không có | `SOY` — `SEVERE` |
| Loại trừ | không có | Nấm hương tươi (dùng khô) |

TDEE dự kiến sau khi lưu hồ sơ sức khỏe: **≈ 2.015 kcal/ngày**. Backend tự tính BMI/BMR/TDEE; không nhập tay các giá trị này.

### 4.2 Công thức

| Trường | Giá trị |
|---|---|
| Tên | `Cà ri đậu gà khoai lang nước cốt dừa (Demo)` |
| Slug | `ca-ri-dau-ga-khoai-lang-demo` |
| Danh mục | `Món hầm và Cà ri` (`mon-ham-va-ca-ri`) |
| Khẩu phần | `4` |
| Sơ chế / nấu | `15` / `30` phút |
| Độ khó | `EASY` |
| Tags | `cà ri`, `đậu gà`, `demo` |

**Nguyên liệu:**

| Tên hiển thị | Định lượng | Đơn vị |
|---|---:|---|
| Đậu gà khô | 200 | g |
| Khoai lang | 300 | g |
| Nước cốt dừa | 200 | ml |
| Cải bó xôi (rau chân vịt) | 100 | g |
| Bột cà ri | 10 | g |
| Gừng tươi | 10 | g |
| Muối ăn | 3 | g |

Các nguyên liệu này đều có trong catalogue chuẩn và **không** chứa đậu nành, gluten hay nấm hương — nhờ vậy công thức vẫn hợp lệ sau khi hồ sơ có dị ứng `SOY` và loại trừ nấm hương.

**Dinh dưỡng mỗi khẩu phần (tác giả khai báo):**

| Chỉ số | Giá trị |
|---|---:|
| Năng lượng | 360 kcal |
| Protein | 13.2 g |
| Carbohydrate | 48 g |
| Chất béo | 15.2 g |
| Chất xơ | 9.8 g |
| Vitamin B12 | 0 mcg |

> Contributor/Admin phải khai đủ cả 6 chỉ số trước khi submit. `0` là giá trị hợp lệ; thiếu hẳn trường mới bị `422 RECIPE_NUTRITION_REQUIRED`.

**Các bước nấu:**

1. Ngâm đậu gà khô qua đêm, luộc khoảng 30 phút đến khi mềm.
2. Khoai lang gọt vỏ, cắt khối vừa ăn; gừng băm nhỏ.
3. Phi gừng với bột cà ri, cho khoai lang và nước cốt dừa vào nấu 15 phút.
4. Cho đậu gà và cải bó xôi vào, nêm muối, nấu thêm 5 phút rồi tắt bếp.

### 4.3 Thực đơn tuần

| Trường | Giá trị |
|---|---|
| `weekStart` | `2026-11-23` (Thứ Hai) |
| `goal` | `MAINTAIN` (Giữ cân) |
| `idempotencyKey` | `demo-plan-2026-11-23-v1` |
| `seed` | `demo-2026-11-23` |

Kết quả kỳ vọng: 7 ngày × 3 bữa = 21 slot, có `shoppingList`, `analysis`, `warnings` và `estimatedNutritionTargets`.

---

## 5. Kịch bản step-by-step

### Bước 0 — Đăng nhập và tạo biến phiên

**UI:** mở `/login`, đăng nhập `contributor@example.com` / mật khẩu trong `backend/.env`.

**API:**

```powershell
$api = 'http://localhost:4000/api/v1'

# Windows PowerShell 5.1 gửi chuỗi -Body theo bảng mã cũ, làm hỏng tiếng Việt.
# Helper này gửi JSON dưới dạng UTF-8 bytes để tên món/nguyên liệu khớp catalogue.
function Invoke-ApiJson {
  param(
    [Parameter(Mandatory)][string]$Method,
    [Parameter(Mandatory)][string]$Uri,
    [hashtable]$Headers,
    $Body
  )
  $params = @{ Method = $Method; Uri = $Uri; ContentType = 'application/json; charset=utf-8' }
  if ($Headers) { $params.Headers = $Headers }
  if ($null -ne $Body) {
    $json = $Body | ConvertTo-Json -Depth 12
    $params.Body = [System.Text.Encoding]::UTF8.GetBytes($json)
  }
  Invoke-RestMethod @params
}

$login = Invoke-ApiJson -Method Post -Uri "$api/auth/login" -Body @{
  email = 'contributor@example.com'
  password = '12345678'
}

$token = $login.data.accessToken
$headers = @{ Authorization = "Bearer $token" }

$login.data.user.email
$login.data.user.role
```

**Checkpoint:** `role` là `CONTRIBUTOR`. Nếu là `MEMBER`, công thức sẽ vào `PENDING_REVIEW` thay vì xuất bản ngay.

> Chạy các block trong **cùng một phiên PowerShell** để giữ biến và hàm. Windows PowerShell 5.1 có thể hiển thị tiếng Việt sai trong console dù dữ liệu đã đúng UTF-8; kiểm tra lại trên UI hoặc bằng `curl.exe` nếu cần.

> Lời thoại: “Em dùng tài khoản Contributor đã được duyệt. Quyền này đến từ hồ sơ Contributor đang hoạt động trong database, không phải từ dữ liệu client gửi lên.”

---

### Bước 1 — Cập nhật thông tin cơ bản

**UI:** `/profile` → tab **Thông tin cá nhân** → đổi tên hiển thị → Lưu.

**API:**

```powershell
$basic = Invoke-ApiJson -Method Patch `
  -Uri "$api/users/me" -Headers $headers `
  -Body @{ displayName = 'Minh Tâm Demo' }

$basic.data.displayName
```

**Checkpoint:** trả về `Minh Tâm Demo`.

---

### Bước 2 — Lưu hồ sơ sức khỏe

**UI:** `/profile` → tab **Sức khỏe & BMI** → nhập 165 cm, 58 kg, 30 tuổi, Nữ, Vận động vừa → Lưu.

**API:**

```powershell
$health = Invoke-ApiJson -Method Put `
  -Uri "$api/users/me/health-profile" -Headers $headers `
  -Body @{
    heightCm = 165
    weightKg = 58
    age = 30
    sex = 'FEMALE'
    activityLevel = 'MODERATELY_ACTIVE'
  }

$health.data.bmi
$health.data.bmr
$health.data.tdee
```

**Checkpoint:** `bmi ≈ 21.30`, `bmr ≈ 1300.25`, `tdee ≈ 2015.39`. Đây là dữ liệu cho mục tiêu thực đơn, **không** tham gia lọc công thức.

> Lời thoại: “Hồ sơ sức khỏe chỉ quyết định mục tiêu năng lượng của thực đơn. Nó không làm món ăn xuất hiện hay biến mất trong tìm kiếm.”

---

### Bước 3 — Preview bộ quy tắc ăn uống

**UI:** `/profile` → tab **Chế độ ăn** → chọn **Thuần chay**, **Trường chay**, **Không theo truyền thống**.

**API:**

```powershell
$selection = @{
  dietPattern = 'VEGAN'
  practiceSchedule = 'PERMANENT'
  tradition = 'NONE'
}

$preview = Invoke-ApiJson -Method Post `
  -Uri "$api/diet-rules/preview" -Headers $headers `
  -Body $selection

$preview.data.ruleSetVersion
$preview.data.rules | Select-Object id, code, defaultEnabled, hardConstraint

$ruleId = $preview.data.rules[0].id
```

**Checkpoint:** `ruleSetVersion = 1`; có rule `DIET_VEGAN_EXCLUDE_ANIMAL_PRODUCTS`, `hardConstraint = true`. Rule ID do database sinh, nên kịch bản phải đọc động chứ không hard-code.

---

### Bước 4 — Lưu hồ sơ baseline (chưa có dị ứng/loại trừ)

Bước này chủ động ghi đè dữ liệu seed để có mốc “trước”.

**UI:** trong wizard chọn **Dị ứng & kiêng** → để trống → **Xác nhận lưu**.

**API:**

```powershell
$baseline = Invoke-ApiJson -Method Put `
  -Uri "$api/users/me/diet-preferences" -Headers $headers `
  -Body @{
    ruleSetVersion = $preview.data.ruleSetVersion
    dietPattern = 'VEGAN'
    practiceSchedule = 'PERMANENT'
    tradition = 'NONE'
    rules = @(@{ ruleDefinitionId = $ruleId; enabled = $true })
    allergies = @()
    ingredientExclusions = @()
  }

$baseline.data.effectiveConstraints.always | Select-Object priority, source, code, label
```

**Checkpoint:** `effectiveConstraints.always` chỉ còn rule `DIET_PATTERN`; không còn `ALLERGY` hay `INGREDIENT_EXCLUSION`.

---

### Bước 5 — Chứng minh lọc cứng trước khi thêm dị ứng

Chạy cùng một truy vấn với tài khoản đã đăng nhập:

```powershell
$q = [uri]::EscapeDataString('đậu hũ')

$before = Invoke-RestMethod `
  -Uri "$api/posts?type=RECIPE&q=$q&eligibility=ELIGIBLE&limit=10" `
  -Headers $headers

"Eligible trước: $($before.meta.total)"
$before.data | Select-Object -First 5 id, @{ n = 'title'; e = { $_.revision.title } }
```

**Checkpoint:** có ít nhất một công thức từ đậu hũ trong danh sách `ELIGIBLE` (ví dụ món phở chay hoặc đậu hũ xào). Số lượng có thể thay đổi theo seed; điều cần chứng minh là **lớn hơn 0**.

> Lần chạy kiểm chứng 18/11/2026: `ELIGIBLE = 12`, `INELIGIBLE = 0`.

> Lời thoại: “Đây là truy vấn có xác thực. Backend đọc hồ sơ đã lưu, không dùng filter do client tự gửi.”

---

### Bước 6 — Cập nhật hồ sơ: thêm dị ứng đậu nành và loại trừ nấm hương

**UI:** `/profile` → tab **Chế độ ăn** → sửa → **Dị ứng & kiêng**:

- Thêm dị ứng **Đậu nành** (`SOY`), mức độ nghiêm trọng.
- Thêm nguyên liệu cần tránh **Nấm hương tươi (dùng khô)**.

**API:**

```powershell
$mushroomResponse = Invoke-RestMethod `
  -Uri "$api/ingredients/resolve?query=$([uri]::EscapeDataString('nấm hương'))"
if ($mushroomResponse.data.match -ne 'EXACT') {
  throw "Không resolve chính xác nấm hương (match=$($mushroomResponse.data.match))"
}
$mushroom = $mushroomResponse.data.candidates[0]

$updated = Invoke-ApiJson -Method Put `
  -Uri "$api/users/me/diet-preferences" -Headers $headers `
  -Body @{
    ruleSetVersion = $preview.data.ruleSetVersion
    dietPattern = 'VEGAN'
    practiceSchedule = 'PERMANENT'
    tradition = 'NONE'
    rules = @(@{ ruleDefinitionId = $ruleId; enabled = $true })
    allergies = @(
      @{ allergenCode = 'SOY'; severity = 'SEVERE' }
    )
    ingredientExclusions = @(
      @{
        ingredientId = $mushroom.id
        ingredientName = $mushroom.canonicalName
        reason = 'Kiêng nấm hương trong buổi demo'
      }
    )
  }

$updated.data.effectiveConstraints.always |
  Select-Object priority, source, code, label
```

**Checkpoint:** `effectiveConstraints.always` có thêm `ALLERGY` (`SOY`) và `INGREDIENT_EXCLUSION` (nấm hương).

> Lưu ý nghiệp vụ: lưu preference là thay thế toàn bộ cấu hình cũ trong một transaction. Nếu bỏ sót dị ứng cũ, dị ứng đó sẽ không còn hiệu lực.

---

### Bước 7 — Chứng minh lọc cứng sau khi thêm ràng buộc

```powershell
$afterEligible = Invoke-RestMethod `
  -Uri "$api/posts?type=RECIPE&q=$q&eligibility=ELIGIBLE&limit=10" `
  -Headers $headers

$afterIneligible = Invoke-RestMethod `
  -Uri "$api/posts?type=RECIPE&q=$q&eligibility=INELIGIBLE&limit=10" `
  -Headers $headers

"Eligible sau: $($afterEligible.meta.total)"
"Ineligible sau: $($afterIneligible.meta.total)"

$afterIneligible.data | Select-Object -First 3 @{ n = 'title'; e = { $_.revision.title } }, @{ n = 'reasons'; e = { $_.recipe.eligibility.reasons | ConvertTo-Json -Compress } }
```

**Checkpoint:**

- Các món dùng đậu hũ hoặc nấm hương **không còn** trong `ELIGIBLE`. Số lượng có thể không về 0 tuyệt đối nếu từ khóa còn khớp phần mô tả của món khác; điều cần chứng minh là các món chứa hai nguyên liệu bị loại đã biến mất.
- `INELIGIBLE` lớn hơn 0 và mỗi món có `recipe.eligibility.reasons` nêu mã lý do (`ALLERGY`, `INGREDIENT_EXCLUSION`...), kèm `ingredientNames` khi xác định được.

> Lần chạy kiểm chứng 18/11/2026: `ELIGIBLE = 0`, `INELIGIBLE = 12`; món đầu tiên báo `ALLERGY` với `Đậu hũ (đậu phụ)` và `Nước tương tamari`.
- Các món bị loại vẫn mở được trang chi tiết, nhưng không xuất hiện trong luồng thực đơn.

> Lời thoại: “Món không hợp không bị xóa. Nó chuyển sang tab ‘Không phù hợp’ kèm lý do, và không thể quay lại danh sách gợi ý hay thực đơn bằng điểm xếp hạng.”

---

### Bước 8 — Tạo công thức mới

**UI:** `/recipes/new`, đi 5 bước:

1. **Thông tin cơ bản:** nhập dữ liệu ở mục 4.2.
2. **Nguyên liệu:** gõ tên và chọn gợi ý chuẩn cho từng nguyên liệu; nhập định lượng/đơn vị.
3. **Các bước nấu:** nhập 4 bước.
4. **Phân loại:** chọn **Món hầm và Cà ri**, độ khó **Dễ**, nhập 6 chỉ số dinh dưỡng.
5. **Xem lại & gửi:** bấm **Đăng & xuất bản công thức** (vì đang là Contributor).

**API — chuẩn bị danh mục và nguyên liệu:**

```powershell
$categories = Invoke-RestMethod -Uri "$api/categories?type=FOOD_TYPE"

function Flatten-Nodes($nodes) {
  $result = @()
  foreach ($node in $nodes) {
    $result += $node
    if ($node.children) { $result += Flatten-Nodes $node.children }
  }
  return $result
}

$flat = Flatten-Nodes $categories.data
$category = $flat | Where-Object { $_.slug -eq 'mon-ham-va-ca-ri' } | Select-Object -First 1
if (-not $category) { throw 'Không tìm thấy danh mục mon-ham-va-ca-ri' }

function Resolve-Ingredient([string]$name) {
  $encoded = [uri]::EscapeDataString($name)
  $response = Invoke-RestMethod -Uri "$api/ingredients/resolve?query=$encoded"
  if ($response.data.match -ne 'EXACT' -or -not $response.data.candidates) {
    throw "Không resolve được nguyên liệu '$name' (match=$($response.data.match))"
  }
  return $response.data.candidates[0]
}

$specs = @(
  @{ name = 'Đậu gà khô'; amount = 200; unit = 'g' },
  @{ name = 'Khoai lang'; amount = 300; unit = 'g' },
  @{ name = 'Nước cốt dừa'; amount = 200; unit = 'ml' },
  @{ name = 'Cải bó xôi (rau chân vịt)'; amount = 100; unit = 'g' },
  @{ name = 'Bột cà ri'; amount = 10; unit = 'g' },
  @{ name = 'Gừng tươi'; amount = 10; unit = 'g' },
  @{ name = 'Muối ăn'; amount = 3; unit = 'g' }
)

$ingredients = foreach ($spec in $specs) {
  $canonical = Resolve-Ingredient $spec.name
  @{
    ingredientId = $canonical.id
    displayName = $canonical.canonicalName
    amount = $spec.amount
    unit = $spec.unit
    optional = $false
  }
}
```

**API — tạo bài:**

```powershell
$recipeBody = @{
  type = 'RECIPE'
  title = 'Cà ri đậu gà khoai lang nước cốt dừa (Demo)'
  slug = 'ca-ri-dau-ga-khoai-lang-demo'
  excerpt = 'Cà ri chay một nồi, béo nhẹ từ nước cốt dừa, đủ đạm từ đậu gà và chất xơ từ khoai lang.'
  body = 'Món cà ri chay nấu một nồi, phù hợp bữa trưa hoặc bữa tối. Đậu gà được ngâm và luộc trước để mềm, khoai lang tạo vị ngọt tự nhiên, nước cốt dừa giúp món béo nhẹ mà không cần nguyên liệu động vật.'
  categoryIds = @($category.id)
  tags = @('cà ri', 'đậu gà', 'demo')
  media = @()
  recipe = @{
    servings = 4
    prepTimeMinutes = 15
    cookTimeMinutes = 30
    difficulty = 'EASY'
    nutrition = @{
      calories = 360
      proteinGrams = 13.2
      carbsGrams = 48
      fatGrams = 15.2
      fiberGrams = 9.8
      vitaminB12Mcg = 0
    }
    ingredients = $ingredients
    steps = @(
      @{ instruction = 'Ngâm đậu gà khô qua đêm, luộc khoảng 30 phút đến khi mềm.'; durationMinutes = 30 },
      @{ instruction = 'Khoai lang gọt vỏ, cắt khối vừa ăn; gừng băm nhỏ.'; durationMinutes = 5 },
      @{ instruction = 'Phi gừng với bột cà ri, cho khoai lang và nước cốt dừa vào nấu 15 phút.'; durationMinutes = 15 },
      @{ instruction = 'Cho đậu gà và cải bó xôi vào, nêm muối, nấu thêm 5 phút rồi tắt bếp.'; durationMinutes = 5 }
    )
  }
}

$created = Invoke-ApiJson -Method Post `
  -Uri "$api/posts" -Headers $headers -Body $recipeBody

$postId = $created.data.id
$revisionId = $created.data.revision.id
$postVersion = $created.data.version

$created.data.status
$created.data.revision.status
```

**Checkpoint:** HTTP `201`; `data.status = DRAFT`, `data.revision.status = DRAFT`. Đây là bước tạo nháp, **chưa** xuất bản.

> Nếu chạy lại kịch bản trên cùng database, đổi `slug` (hoặc xóa mềm công thức cũ) để tránh `409 CONTENT_SLUG_CONFLICT`.

---

### Bước 9 — Submit công thức và kiểm tra xuất bản

**UI:** sau bước **Xem lại & gửi**, UI tự gọi submit; thông báo thành công và chuyển sang trang chi tiết.

**API:**

```powershell
$submitted = Invoke-ApiJson -Method Post `
  -Uri "$api/posts/$postId/submit" -Headers $headers `
  -Body @{
    revisionId = $revisionId
    expectedVersion = $postVersion
  }

$submitted.data.status
$submitted.data.revision.status
$submitted.data.recipe.authorNutrition
$submitted.data.recipe.mealPlannerEligible
```

**Checkpoint:**

- Contributor đã duyệt + đủ 6 chỉ số + không bị moderation flag → `data.status = PUBLISHED`, `data.revision.status = PUBLISHED`.
- `recipe.authorNutrition` giữ đúng 6 giá trị đã khai.
- `recipe.mealPlannerEligible = true` vì mọi nguyên liệu resolve `EXACT` và đủ 4 chỉ số năng lượng/đạm/béo/carb.

> Lần chạy kiểm chứng 18/11/2026: `status = PUBLISHED`, `revision.status = PUBLISHED`, `mealPlannerEligible = true`, `allergenCodes = []`.

**Nếu nhận `422 RECIPE_NUTRITION_REQUIRED`:** đọc `error.fields.missingMetrics`, bổ sung đúng chỉ số còn thiếu rồi submit lại với `revisionId`/`expectedVersion` mới nhất.

**Nếu nhận `PENDING_REVIEW`:** nội dung bị moderation flag. Đây không phải lỗi; dùng Admin duyệt qua review queue hoặc chọn nội dung khác cho demo.

---

### Bước 10 — Xác nhận công thức vừa tạo đi qua bộ lọc

```powershell
$curryQuery = [uri]::EscapeDataString('cà ri đậu gà')

$search = Invoke-RestMethod `
  -Uri "$api/posts?type=RECIPE&q=$curryQuery&eligibility=ELIGIBLE&limit=10" `
  -Headers $headers

$search.meta.total
$search.data | Select-Object id, @{ n = 'title'; e = { $_.revision.title } }, status

$detail = Invoke-RestMethod -Uri "$api/posts/$postId" -Headers $headers
$detail.data.recipe.mealPlannerEligible
$detail.data.recipe.allergenCodes
$detail.data.recipe.allergyWarnings
```

**Checkpoint:**

- Công thức mới xuất hiện trong `ELIGIBLE`.
- `allergenCodes` không chứa `SOY`; `allergyWarnings` rỗng vì người xem đang có dị ứng đậu nành nhưng công thức không chứa đậu nành.
- **Không** nói “rỗng nghĩa là chắc chắn an toàn”. Đây là kết quả khớp đã biết, không phải chứng nhận.

---

### Bước 11 — Tạo thực đơn tuần

**UI:** `/meal-plans` → **Tạo thực đơn mới** → chọn Thứ Hai `23/11/2026`, mục tiêu **Giữ cân** → Tạo.

**API:**

```powershell
$today = Get-Date
$daysToMonday = ((1 - [int]$today.DayOfWeek + 7) % 7)
if ($daysToMonday -eq 0) { $daysToMonday = 7 }
$weekStart = $today.AddDays($daysToMonday).ToString('yyyy-MM-dd')

# Hoặc cố định cho buổi demo:
$weekStart = '2026-11-23'

$planResponse = Invoke-ApiJson -Method Post `
  -Uri "$api/meal-plans/generate" -Headers $headers `
  -Body @{
    weekStart = $weekStart
    goal = 'MAINTAIN'
    idempotencyKey = "demo-plan-$($weekStart)-v1"
    seed = "demo-$weekStart"
  }

$planId = $planResponse.data.id
$planResponse.data.targetCalories
$planResponse.data.items.Count
$planResponse.data.days.Count
$planResponse.data.shoppingList.Count
$planResponse.data.userSummary
```

**Checkpoint:**

- HTTP `201`.
- `items.Count = 21`, `days.Count = 7`.
- `targetCalories ≈ 2015` (TDEE × hệ số mục tiêu `MAINTAIN = 1`).
- `analysis.summary.hardConstraintsPreserved = true`.
- `shoppingList` có ít nhất một dòng.
- Cảnh báo có thể có (`RECIPE_REPEATED`, `UNFILLED_SLOT`, `MICRONUTRIENT_DATA_PARTIAL`...) và là **advisory**, không phải vi phạm.

> Lần chạy kiểm chứng 18/11/2026: `targetCalories = 2015`, `items = 21`, `days = 7`, `shoppingList = 39` dòng, `analysis.summary.hardConstraintsPreserved = true`, `userSummary.status = ADVISORY_ADJUSTMENTS`, warnings `RECIPE_REPEATED` và `SHOPPING_UNIT_NOT_COMBINED`.

> Lời thoại: “Backend lấy hồ sơ sức khỏe để tính mục tiêu, lấy hồ sơ ăn uống để lọc ứng viên, rồi mới xếp 21 bữa. Món bị loại không thể được xếp lại bởi điểm hành vi.”

---

### Bước 12 — Kiểm tra chi tiết và thêm công thức vừa tạo vào một bữa

```powershell
$plan = Invoke-RestMethod -Uri "$api/meal-plans/$planId" -Headers $headers

$plan.data.items |
  Select-Object -First 3 date, mealType, status, @{n='title';e={$_.recipe.title}}

$slot = $plan.data.items |
  Where-Object { $_.mealType -eq 'BREAKFAST' } |
  Select-Object -First 1

$manual = Invoke-ApiJson -Method Patch `
  -Uri "$api/meal-plans/$planId/items/$($slot.id)/manual-add" `
  -Headers $headers `
  -Body @{
    expectedVersion = $plan.data.lockVersion
    idempotencyKey = 'demo-manual-add-001'
    sourceType = 'RECIPE'
    recipeId = $postId
    servings = 1
  }

$manual.data.lockVersion
```

**Checkpoint:** HTTP `200`; slot chuyển sang công thức vừa tạo; `lockVersion` tăng. `expectedVersion` là `lockVersion`, không phải `version`.

---

### Bước 13 — Kiểm tra âm: thêm món bị hồ sơ loại

Lấy một món đậu hũ trong tab `INELIGIBLE`, rồi thử thêm vào thực đơn:

```powershell
$ineligible = Invoke-RestMethod `
  -Uri "$api/posts?type=RECIPE&q=$q&eligibility=INELIGIBLE&limit=1" `
  -Headers $headers

$blockedId = $ineligible.data[0].id
$current = Invoke-RestMethod -Uri "$api/meal-plans/$planId" -Headers $headers

try {
  Invoke-ApiJson -Method Patch `
    -Uri "$api/meal-plans/$planId/items/$($slot.id)/manual-add" `
    -Headers $headers `
    -Body @{
      expectedVersion = $current.data.lockVersion
      idempotencyKey = 'demo-manual-add-blocked-001'
      sourceType = 'RECIPE'
      recipeId = $blockedId
      servings = 1
    }
} catch {
  $_.ErrorDetails.Message
}
```

**Checkpoint:** HTTP `409`, `error.code = MEAL_PLAN_HARD_CONSTRAINT_VIOLATION` (hoặc `MEAL_PLAN_INGREDIENTS_UNVERIFIED` nếu nguyên liệu chưa liên kết chuẩn).

- `MEAL_PLAN_HARD_CONSTRAINT_VIOLATION`: đã xác định vi phạm dị ứng/loại trừ/chế độ ăn/truyền thống.
- `MEAL_PLAN_INGREDIENTS_UNVERIFIED`: chưa kiểm tra được vì nguyên liệu chưa liên kết; **không** gọi là vi phạm.

> Lời thoại: “Đây là điểm quan trọng: UI có thể vô tình gửi món sai, nhưng backend vẫn chặn. Ràng buộc không nằm ở nút bấm.”

---

## 6. Bảng checkpoint tổng hợp

| # | Hành động | Kết quả phải thấy |
|---|---|---|
| 1 | Login Contributor | `role = CONTRIBUTOR` |
| 2 | Lưu hồ sơ sức khỏe | `tdee ≈ 2015.39` |
| 3 | Preview VEGAN/PERMANENT/NONE | `ruleSetVersion = 1`; rule hard constraint |
| 4 | Lưu baseline không dị ứng | `effectiveConstraints.always` chỉ có `DIET_PATTERN` |
| 5 | Tìm `đậu hũ` | `ELIGIBLE > 0` |
| 6 | Thêm `SOY` + loại trừ nấm hương | Có `ALLERGY` và `INGREDIENT_EXCLUSION` |
| 7 | Tìm lại `đậu hũ` | Món chứa đậu hũ/nấm hương rời `ELIGIBLE`; `INELIGIBLE > 0` có reasons |
| 8 | Tạo công thức | HTTP 201; `status = DRAFT` |
| 9 | Submit | `status = PUBLISHED`; `mealPlannerEligible = true` |
| 10 | Tìm công thức mới | Xuất hiện trong `ELIGIBLE` |
| 11 | Tạo thực đơn | 21 slot, 7 ngày, target ≈ 2015 kcal |
| 12 | Manual add công thức mới | HTTP 200; `lockVersion` tăng |
| 13 | Manual add món đậu hũ | HTTP 409; mã lỗi ràng buộc cứng |

---

## 7. Biến thể nâng cao (tuỳ chọn)

### 7.1 Chay kỳ theo lịch

Dùng khi muốn demo `PERIODIC` và lịch ăn chay:

1. Preview với `practiceSchedule = 'PERIODIC'`, `tradition = 'BUDDHIST'`.
2. Bộ rule trả về gồm rule vegan và rule `TRADITION_BUDDHIST_EXCLUDE_FIVE_PUNGENT_ROOTS`.
3. Bật cả hai rule.
4. Lưu preference **kèm** `scheduleDates` ít nhất một ngày trong tuần, ví dụ `['2026-11-23']`.
5. Nếu cố lưu `PERIODIC` mà không có ngày → `409 DIET_SCHEDULE_REQUIRED`.
6. Nếu tuần tạo thực đơn không có ngày chay nào → generate trả `409 DIET_SCHEDULE_REQUIRED` kèm `fields.availableDates`.

Cập nhật lịch về sau bằng:

```powershell
Invoke-ApiJson -Method Put `
  -Uri "$api/users/me/diet-schedule" -Headers $headers `
  -Body @{ dates = @('2026-11-23') }
```

### 7.2 Lộ trình nhiều tuần

Sau khi thực đơn tuần chạy ổn:

```powershell
$program = Invoke-ApiJson -Method Post `
  -Uri "$api/meal-programs" -Headers $headers `
  -Body @{
    title = 'Lộ trình 2 tuần demo'
    goal = 'MAINTAIN'
    startDate = '2026-11-23'
    timezone = 'Asia/Ho_Chi_Minh'
    horizonWeeks = 2
    alternativesPerWeek = 2
    idempotencyKey = 'demo-program-2026-11-23-v1'
  }

$program.data.id
$program.data.weeks.Count
```

Đây là phần mở rộng của cùng bộ lọc và mục tiêu; không cần chạy nếu buổi demo giới hạn thời gian.

---

## 8. Lỗi thường gặp và cách xử lý

| Mã lỗi | Nguyên nhân | Cách xử lý |
|---|---|---|
| `INVALID_CREDENTIALS` | Sai email/mật khẩu | Đọc `SEED_MEMBER_PASSWORD` trong `backend/.env` |
| `HEALTH_PROFILE_INCOMPLETE` | Chưa lưu hồ sơ sức khỏe | Chạy lại bước 2 |
| `INVALID_DIET_RULE_SELECTION` | Gửi thiếu rule hoặc rule ngoài preview | Gọi lại preview và gửi **đủ** danh sách rule |
| `DIET_RULE_REQUIRED` | Tắt rule hard constraint của diet pattern | Giữ `enabled = true` cho rule vegan/lacto-ovo |
| `DIET_RULE_RECONFIRMATION_REQUIRED` | `ruleSetVersion` lệch bản mới | Preview lại, dùng version mới |
| `INVALID_ALLERGEN_SELECTION` | Mã dị ứng không có trong catalogue active | Dùng `SOY`, `GLUTEN`, `PEANUT`, `TREE_NUT`... |
| `DIET_SCHEDULE_REQUIRED` | `PERIODIC` thiếu ngày | Thêm `scheduleDates` hoặc `PUT /users/me/diet-schedule` |
| `RECIPE_NUTRITION_REQUIRED` | Contributor/Admin thiếu chỉ số | Bổ sung `fields.missingMetrics` |
| `CONTENT_VERSION_CONFLICT` | Submit với version cũ | Lấy lại post/revision mới nhất rồi submit |
| `NO_ELIGIBLE_RECIPE` | Bộ lọc quá chặt, không còn ứng viên | Giảm bớt ràng buộc demo hoặc kiểm tra seed |
| `MEAL_PLAN_HARD_CONSTRAINT_VIOLATION` | Món vi phạm dị ứng/loại trừ/diet/tradition | Chọn món khác |
| `MEAL_PLAN_INGREDIENTS_UNVERIFIED` | Nguyên liệu chưa liên kết chuẩn | Liên kết nguyên liệu hoặc chọn món khác; **không** gọi là vi phạm |
| `MEAL_PLAN_VERSION_CONFLICT` | `expectedVersion` cũ | Đọc lại plan, dùng `lockVersion` mới |
| `MEAL_PLAN_IDEMPOTENCY_CONFLICT` | Cùng key nhưng payload khác | Đổi `idempotencyKey` cho lần chạy mới |

---

## 9. Dọn dẹp và khôi phục

Cách nhanh nhất để trả tài khoản demo về seed:

```powershell
cd D:\Project\vegan-support-application\backend
npm run seed
```

Hoặc chỉ reset hồ sơ qua API bằng cách lưu lại preference baseline ở bước 4 (không có dị ứng/loại trừ).

Xóa thực đơn demo nếu cần:

```powershell
$plan = Invoke-RestMethod -Uri "$api/meal-plans/$planId" -Headers $headers
Invoke-RestMethod -Method Delete `
  -Uri "$api/meal-plans/${planId}?expectedVersion=$($plan.data.lockVersion)" `
  -Headers $headers
```

Công thức demo có thể xóa mềm:

```powershell
Invoke-RestMethod -Method Delete `
  -Uri "$api/posts/${postId}?expectedVersion=$($detail.data.version)" `
  -Headers $headers
```

---

## 10. Ghi chú chính xác hợp đồng

- Endpoint hồ sơ: `GET/PATCH /users/me`, `PUT /users/me/health-profile`, `PUT /users/me/diet-preferences`, `PUT /users/me/diet-schedule`.
- Preview rule: `POST /diet-rules/preview` (không phải `/users/me/diet-rules`).
- Tìm công thức: `GET /posts?type=RECIPE&eligibility=ELIGIBLE|INELIGIBLE`.
- Tạo/sửa công thức: `POST /posts`, `PATCH /posts/{id}`; submit: `POST /posts/{id}/submit` với `revisionId` + `expectedVersion`.
- Thực đơn: `POST /meal-plans/generate`, `GET /meal-plans/{id}`, `PATCH /meal-plans/{id}/items/{itemId}/manual-add|swap`, `POST /meal-plans/{id}/analyze`.
- Lộ trình: `POST /meal-programs`, `PATCH /meal-programs/{id}`.
- Nguyên liệu chuẩn: `GET /ingredients/resolve?query=...`; danh mục: `GET /categories?type=FOOD_TYPE`.
- `POST /posts/{id}/submit` vẫn `CHANGING` trong `frontend/docs/BACKEND_INTEGRATION.md` tại thời điểm cập nhật tài liệu này; web đã tích hợp, mobile chưa được kiểm chứng thủ công trên thiết bị.
- Không có endpoint nào trong kịch bản này biến kết quả AI thành dữ liệu chuẩn, xác nhận chứng chỉ, hay bảo đảm an toàn tuyệt đối.
