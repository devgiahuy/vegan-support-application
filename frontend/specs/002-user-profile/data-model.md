# Data Model: User Profile

**Feature**: `002-user-profile` | **Date**: 2026-09-15 | **Sources**: `docs/api/users.md`, `docs/api/diet-rules.md`, [spec.md](./spec.md), [research.md](./research.md)

Quy ước chung: ID UUID string; timestamp ISO 8601 UTC; enum giữ chuỗi backend và map qua `safeEnum` + fallback; số backend đã làm tròn 2 decimals — frontend **không** tính lại.

---

## 1. Enum (`src/common/enums/index.ts` — bổ sung)

| Enum | Giá trị | Nguồn |
| --- | --- | --- |
| `DietPattern` | `VEGAN`, `LACTO_OVO` | OpenAPI diet |
| `PracticeSchedule` | `PERMANENT`, `PERIODIC` | OpenAPI diet |
| `Tradition` | `NONE`, `BUDDHIST`, `CHRISTIAN` | OpenAPI diet |
| `BiologicalSex` | `MALE`, `FEMALE` | `HealthProfileRequest.sex` |
| `ActivityLevel` | `SEDENTARY`, `LIGHTLY_ACTIVE`, `MODERATELY_ACTIVE`, `VERY_ACTIVE`, `EXTRA_ACTIVE` | `HealthProfileRequest.activityLevel` |
| `HealthDataSource` | `MANUAL` | `HealthProfileResponse.data.dataSource` |

Nhãn tiếng Việt cho UI (đặt trong mapper/model, không format trong JSX):
- Pattern: thuần chay / có trứng sữa · Schedule: trường chay / chay kỳ · Tradition: không theo truyền thống / Phật giáo / Kitô giáo.
- Activity: ít vận động / vận động nhẹ / vận động vừa / vận động nhiều / vận động rất nhiều.
- Sex: Nam / Nữ.

---

## 2. Entities (UI Model)

### 2.1 `DetailedProfile` (`features/profile`)

Mở rộng `User` từ `features/auth` (dùng lại, không định nghĩa lại các field cơ bản).

| Field | Type | Null | Nguồn DTO | Ghi chú |
| --- | --- | --- | --- | --- |
| `user` | `User` | no | toàn bộ `ProfileResponse.data` 8 field đầu | map qua `authMapper.toModel` |
| `health` | `HealthProfile \| null` | yes | `data.healthProfile` | null khi chưa nhập |
| `diet` | `DietPreferenceSummary \| null` | yes | `data.dietPreference` | tóm tắt, chi tiết ở feature diet |
| `memberSince` | `string` | no | derived từ `user.createdAt` | `formatDate`, '-' khi null |

### 2.2 `HealthProfile` (`features/profile`)

| Field | Type | Null | Nguồn | Ghi chú |
| --- | --- | --- | --- | --- |
| `heightCm` | `number` | no | `heightCm` | > 0 |
| `weightKg` | `number` | no | `weightKg` | > 0 |
| `age` | `number` | no | `age` | nguyên, 1–120 |
| `sex` | `BiologicalSex` | no | `sex` | + `sexLabel` |
| `activityLevel` | `ActivityLevel` | no | `activityLevel` | + `activityLevelLabel` |
| `bmi` | `number` | no | `bmi` | backend tính, giữ nguyên |
| `bmiCategory` | `string` | no | derived (`calcBmi`) | chuẩn châu Á |
| `hasAbnormalBmi` | `boolean` | no | derived | `bmi < 12 \|\| bmi > 45` → cảnh báo |
| `needsDisclaimer` | `boolean` | no | derived | `bmi < 16 \|\| bmi > 35` → disclaimer |
| `bmr` | `number` | no | `bmr` | kcal/ngày |
| `tdee` | `number` | no | `tdee` | kcal/ngày |
| `dataSource` | `HealthDataSource` | no | `dataSource` | luôn MANUAL ở slice này |
| `updatedAt` | `Date \| null` | yes | `updatedAt` | |

### 2.3 `DietRule`, `Allergy`, `IngredientExclusion` (`features/diet-preferences`)

| Entity | Field | Type | Null | Ghi chú |
| --- | --- | --- | --- | --- |
| `DietRule` | `ruleDefinitionId` | `string` | no | gửi lại nguyên vẹn khi save |
|  | `name` | `string` | no (fallback `'Quy tắc'`) | schema preview `_truncated` — mapper giữ chuỗi gốc nếu có, fallback tên chung |
|  | `source` | `string` | no (fallback `''`) | nguồn quy tắc |
|  | `isDefault` | `boolean` | no | mặc định của bộ rule |
|  | `isHard` | `boolean` | no | cứng → toggle disabled + nhãn "Luôn bật" |
|  | `enabled` | `boolean` | no | trạng thái user chọn |
| `Allergy` | `allergenCode` | `string` | no | bắt buộc |
|  | `label` | `string` | no (fallback code) |  |
|  | `severity` | `string` | no (fallback `''`) | hiển thị, không branch logic |
| `IngredientExclusion` | `ingredientId` | `string \| null` | yes | optional canonical ID |
|  | `ingredientName` | `string` | no | bắt buộc, không rỗng/trùng |
|  | `reason` | `string` | no (fallback `''`) |  |

### 2.4 `DietPreference` + `DietPreferenceSummary`

| Field | Type | Null | Ghi chú |
| --- | --- | --- | --- |
| `dietPattern` / `practiceSchedule` / `tradition` | enum §1 | no | + label tiếng Việt |
| `ruleSetVersion` | `number` | no | từ preview, gửi lại nguyên vẹn |
| `confirmedAt` | `Date \| null` | yes |  |
| `requiresRuleReview` | `boolean` | no | true → UI đưa về màn review |
| `rules` | `DietRule[]` | no |  |
| `allergies` | `Allergy[]` | no | luôn cứng |
| `ingredientExclusions` | `IngredientExclusion[]` | no | luôn cứng |
| `schedule` | `{ timezone: string; dates: string[] } \| null` | yes |  |
| `effectiveConstraints` | `{ always: string[]; scheduledTradition: string \| null }` | no | hiển thị "ràng buộc hiệu lực" |

`DietPreferenceSummary` (trong `DetailedProfile`): `dietPattern + label`, `practiceSchedule + label`, `tradition + label`, `requiresRuleReview`, `confirmedAt`.

### 2.5 `DietSchedule`

| Field | Type | Null |
| --- | --- | --- |
| `practiceSchedule` | `PracticeSchedule` | no |
| `timezone` | `string` | no (luôn `Asia/Ho_Chi_Minh` ở slice này) |
| `dates` | `string[]` | no — mỗi phần tử `YYYY-MM-DD` |

---

## 3. Request payloads

### 3.1 `UpdateBasicProfileRequestDto` → `PATCH /users/me`

| Field | Type | Bắt buộc | Ghi chú |
| --- | --- | --- | --- |
| `displayName` | `string` | ít nhất 1 trong 2 | 2–100 ký tự |
| `avatarUrl` | `string \| null` | ít nhất 1 trong 2 | HTTP(S) URL; `null` để xóa ảnh |

### 3.2 `HealthProfileRequestDto` → `PUT /users/me/health-profile`

| Field | Type | Bắt buộc |
| --- | --- | --- |
| `heightCm` | `number` | yes, > 0 |
| `weightKg` | `number` | yes, > 0 |
| `age` | `integer` | yes, 1–120 |
| `sex` | `MALE \| FEMALE` | yes |
| `activityLevel` | 1 trong 5 mức | yes |

### 3.3 `DietRulePreviewRequestDto` → `POST /diet-rules/preview`

`{ dietPattern, practiceSchedule, tradition }` — cả 3 bắt buộc.

### 3.4 `SaveDietPreferencesRequestDto` → `PUT /users/me/diet-preferences`

| Field | Bắt buộc | Ghi chú |
| --- | --- | --- |
| `dietPattern`, `practiceSchedule`, `tradition` | yes | từ bước chọn |
| `ruleSetVersion` | yes | từ preview, nguyên vẹn |
| `rules` | yes | `{ ruleDefinitionId, enabled }[]` — đủ mọi rule đã preview |
| `scheduleDates` | no | `YYYY-MM-DD[]` |
| `allergies` | no | `{ allergenCode, label?, severity? }[]` |
| `ingredientExclusions` | no | `{ ingredientId?, ingredientName, reason? }[]`, tên không rỗng/trùng |

### 3.5 `UpdateDietScheduleRequestDto` → `PUT /users/me/diet-schedule`

`{ dates: YYYY-MM-DD[] }` — bắt buộc (mảng rỗng được phép khi muốn xóa hết ngày đã chọn).

---

## 4. State transitions

### 4.1 Hồ sơ & sức khỏe

```text
DetailedProfile (GET) ──PATCH displayName/avatarUrl──▶ DetailedProfile (mới) + Zustand user đồng bộ
HealthProfile null ──PUT đủ 5 chỉ số──▶ HealthProfile (có bmi/bmr/tdee)
```

### 4.2 Diet wizard (client orchestration, backend quyết định)

```text
Chọn bộ ba ──POST preview──▶ rules + ruleSetVersion
  ──toggle rule (trừ rule cứng) + khai dị ứng/kiêng──▶ PUT preferences ──▶ DietPreference
  ──nếu PERIODIC──▶ chọn ngày ──PUT schedule──▶ DietSchedule
  ──nếu DIET_RULE_RECONFIRMATION_REQUIRED──▶ quay về preview (giữ lựa chọn)
```

---

## 5. Validation rules

| # | Rule | Nơi enforce |
| --- | --- | --- |
| V1 | `displayName` 2–100 ký tự | zod + backend |
| V2 | `avatarUrl` rỗng hoặc URL HTTP(S) | zod + backend |
| V3 | PATCH cần ít nhất 1 field đổi (UI vô hiệu hóa nút lưu khi không đổi) | client (+ backend 400 nếu rỗng) |
| V4 | `heightCm`/`weightKg` > 0; `age` nguyên 1–120 | zod + backend |
| V5 | `sex` ∈ `MALE/FEMALE`; `activityLevel` ∈ 5 mức | zod + backend |
| V6 | Ngày chay kỳ khớp `^\d{4}-\d{2}-\d{2}$` | zod + backend |
| V7 | `rules[]` đủ mọi rule đã preview, đúng `ruleSetVersion` | client (gửi nguyên) + backend |
| V8 | Tên nguyên liệu kiêng không rỗng/trùng (chuẩn hóa trim + lowercase để dedupe) | client + backend |
| V9 | Lỗi `VALIDATION_ERROR` map theo `error.fields` vào đúng input | form layer |

---

## 6. DTO ↔ Model mapping matrix (trích yếu)

| Model field | `pickField` candidates | `safe*` | Fallback |
| --- | --- | --- | --- |
| `HealthProfile.heightCm/weightKg/age` | `['heightCm','height_cm']`… | `safeNumber` | `0` |
| `HealthProfile.sex` | `['sex']` | `safeEnum(BiologicalSex)` | `MALE` |
| `HealthProfile.activityLevel` | `['activityLevel','activity_level']` | `safeEnum(ActivityLevel)` | `SEDENTARY` |
| `HealthProfile.bmi/bmr/tdee` | `['bmi']`… | `safeNumber` | `0` |
| `HealthProfile.updatedAt` | `['updatedAt','updated_at']` | `safeDate` | `null` |
| `DietRule.ruleDefinitionId` | `['ruleDefinitionId','rule_definition_id','id']` | `safeString` | `''` (lọc bỏ rule rỗng ID khi gửi) |
| `DietRule.isHard` | `['isHard','is_hard','hard','required']` | `safeBoolean` | `false` |
| `DietRule.enabled` | `['enabled','isEnabled']` | `safeBoolean` | `false` |
| `DietSchedule.dates` | `['dates']` | `safeArray` + lọc regex ngày | `[]` |
| `DietPreference.ruleSetVersion` | `['ruleSetVersion','rule_set_version']` | `safeNumber` | `0` |

`DetailedProfile` dùng lại `authMapper.toModel` cho 8 field user đầu; `health`/`diet` map bằng mapper mới, `null` khi backend trả `null`.
