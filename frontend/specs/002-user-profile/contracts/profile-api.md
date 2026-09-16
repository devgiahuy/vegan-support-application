# Contract: Profile API (`/api/v1`) — frontend consumer

**Feature**: `002-user-profile` | **Status nguồn**: `BACKEND_INTEGRATION.md` §6.2 — tất cả `READY` (2026-09-15)
**Nguồn schema**: `docs/api/users.md`. OpenAPI tại `/api-docs.json` là source of truth.
**Dùng chung**: envelope `{success,data,meta}`, `getApiErrorCode/getApiErrorFields`, refresh-queue từ `001-user-auth`.

Base URL đã gồm `/api/v1`, **không** nối thêm. Auth: Bearer từ memory + `withCredentials: true`.

---

## 1. `GET /users/me`

- **Constant**: `API_ENDPOINTS.USERS.ME` (đã có từ `001-user-auth`)
- **Auth**: bắt buộc
- **Success** `200` → `ProfileResponse`: `data` gồm 8 field user đầu + `contributorApplication` + `healthProfile` (object|null) + `dietPreference` (object|null).
  → `profileMapper.toDetailedModel(res.data.data)` trả `DetailedProfile` (user map qua `authMapper.toModel`).
- **Errors**: `401 AUTH_REQUIRED` / `403 FORBIDDEN` → interceptor refresh-queue; thất bại ⇒ logout + về login.
- **Ghi chú**: `features/auth` đã đọc 8 field đầu cho session; `features/profile` sở hữu toàn bộ response này (thêm health/diet).

## 2. `PATCH /users/me`

- **Constant**: `API_ENDPOINTS.USERS.ME` (tái dùng path; method PATCH ở call site)
- **Auth**: bắt buộc
- **Request**: `UpdateBasicProfileRequestDto` — `{ displayName?: string; avatarUrl?: string | null }`, **cần ít nhất một field** (backend 400 nếu rỗng).
- **Success** `200` → `ProfileResponse` (đủ).
  → `profileMapper.toDetailedModel` → `DetailedProfile`.
- **Hành vi UI**: `onSuccess` → `useAuthStore.setUser(detailed.user)` (header cập nhật ngay) + invalidate `PROFILE_QUERY_KEYS.detail` **và** `AUTH_QUERY_KEYS.me()`.
- **Errors**:
  | Status | `error.code` | UI |
  | --- | --- | --- |
  | 400 | `VALIDATION_ERROR` | Map `error.fields` vào input (tên/ảnh) |
  | 401/403 | `AUTH_REQUIRED`/`FORBIDDEN` | Luồng auth chung |

## 3. `PUT /users/me/health-profile`

- **Constant**: `API_ENDPOINTS.USERS.HEALTH_PROFILE = '/users/me/health-profile'`
- **Auth**: bắt buộc
- **Request**: `HealthProfileRequestDto` — `{ heightCm: number; weightKg: number; age: integer; sex: MALE|FEMALE; activityLevel: 1 trong 5 mức }`, tất cả bắt buộc.
- **Success** `200` → `HealthProfileResponse`: `data` đủ 10 field (`heightCm, weightKg, age, sex, activityLevel, bmi, bmr, tdee, dataSource, updatedAt`).
  → `healthMapper.toModel(res.data.data)` trả `HealthProfile` (giữ nguyên số backend, thêm `bmiCategory/hasAbnormalBmi/needsDisclaimer` derived).
- **Hành vi UI**: `onSuccess` → invalidate `PROFILE_QUERY_KEYS.detail` + `HEALTH_QUERY_KEYS.detail`; hiện kết quả ngay không tải lại.
- **Errors**:
  | Status | `error.code` | UI |
  | --- | --- | --- |
  | 400 | `VALIDATION_ERROR` | Map `error.fields` (vd `heightCm`, `age`) |
  | 400 | (khác) | Alert chung tiếng Việt |

## 4. Tổng hợp constant (profile)

```ts
API_ENDPOINTS.USERS.ME               // '/users/me' — dùng cho GET + PATCH
API_ENDPOINTS.USERS.HEALTH_PROFILE   // '/users/me/health-profile' — PUT
```

## 5. Definition of Done cho contract này

- [ ] `profile.api.ts` + `health.api.ts` typed `APIResponse<...Dto>`, trả `Model`, không leak DTO.
- [ ] Mapper test phủ response đủ/thiếu `healthProfile`, số dạng chuỗi, enum lạ, ngày sai.
- [ ] PATCH xong header đổi ngay không cần F5 (Zustand đồng bộ).
- [ ] BMI hiển thị đúng số backend; phân loại/cảnh báo/disclaimer đúng ngưỡng SRS.
