# Frontend ↔ Backend Integration Guide

**Version:** 4.5

**Cập nhật:** 23/09/2026

**Backend implementation status:** `IN_PROGRESS`

**Contract target:** `/api/v1`

> Tài liệu này là registry sống cho capability backend thực tế. Phases 00–11 là baseline hiện có; Phases 12–27 chỉ được nâng trạng thái sau khi từng phase vượt completion gate. Backend Phase 14 đã thay subtype bằng một Contributor role với approval basis chỉ dùng cho audit/presentation. Các consumer frontend legacy phải migrate trước khi các endpoint breaking trở lại `READY`.

---

## 1. Source of truth và status

Khi xác định yêu cầu nghiệp vụ, ưu tiên `docs/SRS.md` rồi `docs/IMPLEMENTATION_PLAN.md`. Khi xác định contract có thể gọi ngay, dùng thứ tự:

1. OpenAPI được backend phục vụ tại `/api-docs.json` — contract kỹ thuật thực thi được.
2. File này — trạng thái triển khai, hướng dẫn tích hợp và ngoại lệ frontend.
3. `/docs/SRS.md` — canonical product requirement; không đồng nghĩa capability đã READY.
4. `/docs/IMPLEMENTATION_PLAN.md` — business rules, scope và sequencing.
5. `/backend/docs/IMPLEMENTATION_PHASES.md` — phase dependency, completion record và prompt triển khai.
6. `/docs/ROADMAP_PHASE_2.md` — backlog sau MVP, không phải runtime contract.

Nếu OpenAPI và file này lệch nhau, không tự đoán. Backend phải cập nhật cả hai trong cùng change trước khi frontend tích hợp.

### 1.1 Status legend

| Status        | Ý nghĩa                                              | Frontend được làm gì                                |
| ------------- | ---------------------------------------------------- | --------------------------------------------------- |
| `PLANNED`     | Chỉ có trong kế hoạch                                | Có thể dựng type/UI mock nội bộ, không gọi API thật |
| `IN_PROGRESS` | Backend đang phát triển, contract chưa ổn định       | Không merge integration phụ thuộc endpoint          |
| `READY`       | OpenAPI, migration/seed và backend gates đã hoàn tất | Được tích hợp và viết mapper/query                  |
| `CHANGING`    | Có breaking change đang được phối hợp                | Dùng version/branch đã thống nhất; không sync mù    |
| `DEPRECATED`  | Còn tạm thời cho migration                           | Không tạo consumer mới                              |
| `REMOVED`     | Không còn được phục vụ                               | Xóa consumer sau khi migration hoàn tất             |

### 1.2 Rule xác nhận readiness

Endpoint chỉ được chuyển sang `READY` khi có đủ:

- Route hoạt động trong local environment.
- Schema request/response/error xuất hiện trong OpenAPI.
- Authorization được backend enforce và review.
- Migration/seed cần thiết đã có.
- Lint, typecheck và build backend pass.
- Mục endpoint tương ứng trong file này có ngày cập nhật.

---

## 2. Environment và base URL

Frontend `.env.local`:

```text
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
BACKEND_API_URL=http://localhost:4000/api/v1
```

- Client call dùng `NEXT_PUBLIC_API_URL` qua `src/lib/axios.ts`.
- Server Component/Route Handler ưu tiên `BACKEND_API_URL`.
- Không nối `/api/v1` lần thứ hai trong feature API.
- `withCredentials=true` để refresh cookie được gửi.
- Maps JavaScript browser key là cấu hình frontend riêng, bị giới hạn HTTP referrer; không dùng server key ở client.

Backend expected local endpoints:

```text
API:      http://localhost:4000/api/v1
Swagger:  http://localhost:4000/api-docs
OpenAPI:  http://localhost:4000/api-docs.json
```

---

## 3. Contract chung

### 3.1 Success envelope

```ts
interface APIResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMetadata | null;
}
```

### 3.2 Error envelope

```ts
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
    requestId?: string;
  };
}
```

Frontend không branch theo text `message`; luôn dùng `error.code`. `message` chỉ để hiển thị fallback.

### 3.3 Pagination

Request:

```text
?page=1&limit=20
```

Response `meta`:

```ts
interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
```

### 3.4 Date, enum và ID

- ID là UUID string; mapper không được giả định numeric ID.
- Timestamp từ backend là ISO 8601 UTC.
- Date-only như `diet_schedule_dates.date` là `YYYY-MM-DD`, không parse thành UTC instant.
- DTO giữ enum string từ backend; mapper dùng safe enum fallback.
- Tiền, calories, distance và rating phải có unit rõ trong schema.

---

## 4. Workflow tích hợp bắt buộc

### Khi backend chuyển endpoint sang READY

1. Backend cập nhật OpenAPI và ma trận status ở mục 6.
2. Frontend chạy:

```bash
cd frontend
npm run sync:swagger
```

3. Đọc `docs/API-CATALOG.md`, sau đó chỉ đọc file tag liên quan trong `docs/api/`.
4. Thêm endpoint vào `src/common/constants/api-endpoints.ts`.
5. Tạo DTO request/response.
6. Tạo UI Model riêng.
7. Tạo Mapper DTO ↔ Model.
8. Tạo API client.
9. Tạo TanStack Query key/hooks.
10. Tạo UI đủ loading/error/empty/success.
11. Thêm mapper test và integration test phù hợp.

Không sử dụng `any`, không trả DTO trực tiếp về component và không hard-code endpoint trong feature.

### Khi backend thay đổi endpoint đã READY

- Non-breaking field mới: DTO nhận optional trước, mapper có default an toàn.
- Breaking rename/remove/type change: backend chuyển status sang `CHANGING`, cập nhật changelog và phối hợp frontend trong cùng PR/commit series.
- Backend không được đánh dấu `READY` trở lại cho tới khi frontend consumer và contract test đã cập nhật.

---

## 5. Mapping module frontend

| Backend tag/module               | Frontend feature đề xuất                                       | Route FE (tiếng Anh)                                                   |
| -------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Auth                             | `features/auth`                                                | `/login`, `/verify-otp`, `/onboarding`                                 |
| Users/Profile                    | `features/profile`                                             | `/profile`                                                             |
| Diet Rules                       | `features/diet-preferences`                                    | `/profile` (tab diet)                                                  |
| Posts/Recipes/Videos             | `features/content` hoặc tách `recipe`, `blog`, `video` nếu lớn | `/recipes`, `/articles`, `/videos`                                     |
| Comments/Votes/Ratings/Bookmarks | `features/community`                                           | (trong trang detail `/recipes/[id]`, `/articles/[id]`, `/videos/[id]`) |
| Contributors                     | `features/contributor`                                         | `/articles/new`, `/recipes/new`                                        |
| Moderation/Admin Users           | `features/admin`                                               | `/admin`                                                               |
| Categories                       | `features/category`                                            | `/categories`                                                          |
| Ingredients                      | `features/ingredient`                                          | `/categories#tra-cuu`                                                  |
| Food Data/Nutrition              | `features/food-data`, `features/recipe-nutrition`               | `/ingredients`, recipe editor/detail                                   |
| Meal Plans                       | `features/meal-plan`                                           | `/meal-plans`, `/meal-plans/saved`                                     |
| Custom Meals/Programs            | `features/custom-meal`, `features/meal-program`                 | `/meals/custom`, `/meal-programs`                                      |
| Pantry/Vision/Receipts           | `features/pantry`, `features/ingredient-vision`, `features/receipt` | `/pantry`, `/pantry/scan`, `/receipts`                              |
| Storage                          | `features/storage`                                             | `/profile` (tab dung lượng)                                            |
| Recommendations/Behavior         | `features/recommendation`                                      | `/` (khối gợi ý trang chủ)                                             |
| Chat                             | `features/chat`                                                | `/assistant`                                                           |
| Restaurants/Location             | `features/restaurant`                                          | `/restaurants`, `/restaurants/[id]`                                    |
| AI Governance                    | `features/admin-ai`                                            | `/admin`                                                               |
| Notifications                    | `features/notification`                                        | (header bell — trang riêng ngoài MVP)                                  |

> Quy ước route (từ 16/09/2026): slug FE dùng tiếng Anh, đồng bộ tên backend module. URL tiếng Việt cũ 308 về URL mới (xem `next.config.ts` → `redirects()`), giữ query/hash. Chi tiết xem `specs/004-fe-english-routes/contracts/route-contract.md`.

Feature không import trực tiếp lẫn nhau. Shared enum hoặc presentation model dùng chung phải được nâng lên `src/common` hoặc `src/types` sau khi review.

---

## 6. Backend capability registry

### 6.1 Foundation

| Method | Path             | Status  | Backend updated | FE integrated | Ghi chú                                                                |
| ------ | ---------------- | ------- | --------------- | ------------- | ---------------------------------------------------------------------- |
| GET    | `/health`        | `READY` | 2026-09-15      | No            | Public; kiểm tra API/PostgreSQL, trả request ID; 503 khi database down |
| GET    | `/api-docs.json` | `READY` | 2026-09-15      | No            | Public OpenAPI 3.1 source; catalog frontend đã sync                    |

### 6.2 Auth và Profile

| Method | Path                         | Status    | Backend updated | FE integrated    | Ghi chú                                                                                                                                                   |
| ------ | ---------------------------- | --------- | --------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/auth/register`             | `CHANGING` | 2026-09-19     | Yes (legacy; migrate) | Breaking Phase 14: `contributorRequest.claimedApprovalBasis`, optional `organizationClaim`, `experience`, `referenceLinks`; pending account/JWT vẫn `MEMBER` |
| POST   | `/auth/login`                | `CHANGING` | 2026-09-19     | Yes (legacy; migrate) | Session user bỏ subtype fields; Contributor profile trả `approvalBasis`/label chỉ để hiển thị; authorization vẫn theo role/profile |
| POST   | `/auth/refresh`              | `READY`   | 2026-09-15      | Yes (2026-09-15) | Đọc refresh cookie, rotation mỗi lần dùng; reuse revoke toàn token family; FE: Next proxy `/api/auth/refresh-token` + refresh-queue                       |
| POST   | `/auth/logout`               | `READY`   | 2026-09-15      | Yes (2026-09-15) | Idempotent; body `{ allDevices?: boolean }`; revoke phiên hiện tại hoặc toàn bộ phiên của user; FE: Next proxy + xóa 4 cookie                             |
| GET    | `/users/me`                  | `CHANGING` | 2026-09-19     | Yes (legacy; migrate) | Breaking Phase 14 user shape: bỏ subtype; pending application dùng `claimedApprovalBasis`; active profile dùng `approvalBasis`/label |
| PATCH  | `/users/me`                  | `READY`   | 2026-09-15      | Yes (2026-09-15) | Cập nhật `displayName`/HTTP(S) `avatarUrl`; cần ít nhất một field                                                                                         |
| PUT    | `/users/me/health-profile`   | `READY`   | 2026-09-15      | Yes (2026-09-15) | Upsert manual inputs; backend tính BMI, Mifflin–St Jeor BMR và activity-factor TDEE                                                                       |
| POST   | `/diet-rules/preview`        | `READY`   | 2026-09-15      | Yes (2026-09-15) | Auth required; trả rule set v1, source/default/hard flag; tradition rule là configurable                                                                  |
| PUT    | `/users/me/diet-preferences` | `READY`   | 2026-09-15      | Yes (2026-09-15) | Exclusion nhận optional canonical `ingredientId`; free-text vẫn hỗ trợ; allergy/exclusion luôn hard                                                       |
| DELETE | `/users/me/behavior-history` | `READY`   | 2026-09-17      | Yes (2026-09-17) | Reset personalization history; FE: `features/safety`                                                                      |

### 6.3 Content và Community

| Method | Path                  | Status    | Backend updated | FE integrated | Ghi chú                        |
| ------ | --------------------- | --------- | --------------- | ------------- | ------------------------------ |
| GET    | `/posts`              | `READY`   | 2026-09-21      | No            | Public chỉ thấy approved revision; filter/type/pagination |
| POST   | `/posts`              | `READY`   | 2026-09-21      | No            | Auth; luôn tạo draft revision, không auto-publish |
| GET    | `/posts/:idOrSlug`    | `READY`   | 2026-09-21      | No            | Public thấy approved revision gần nhất trong lúc edit pending |
| PATCH  | `/posts/:id`          | `READY`   | 2026-09-21      | No            | Author-only; tạo draft revision mới với expectedVersion |
| DELETE | `/posts/:id`          | `READY`   | 2026-09-21      | No            | Author-only soft-delete; giữ review/audit evidence |
| POST   | `/posts/:id/submit`   | `READY`   | 2026-09-21      | No            | Author-only; latest draft + expectedVersion; video asset phải committed/owned |
| GET    | `/posts/:id/review-history` | `READY` | 2026-09-21 | No | Author/Admin; revisions, media source, signals, reviewer/reason, pagination |
| GET    | `/posts/:id/related`  | `PLANNED` | —               | No            | Trả recipes/blogs/videos riêng |
| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead|| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadP| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadO| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadS| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadT| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead|| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead`| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead/| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadu| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadp| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadl| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteado| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteada| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadd| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteads| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead/| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteads| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadi| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadg| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadn| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteada| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadt| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadu| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadr| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteade| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead`| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead|| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead`| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadR| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadE| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadM| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadO| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadV| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadE| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadD| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead`| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead|| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead—| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead|| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadN| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteado| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead|| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadC| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadl| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteado| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadu| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadd| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadi| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadn| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteada| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadr| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteady| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteads| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadi| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadg| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadn| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteade| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadd| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadu| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadp| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadl| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteado| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteada| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` insteadd| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead | 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead|| 2026-09-19 | No | Replaced by reservation flow (Phase 15); use `POST /uploads/reservations` instead
| GET    | `/posts/:id/comments` | `PLANNED` | —               | No            | Reply tối đa một tầng          |
| POST   | `/posts/:id/comments` | `PLANNED` | —               | No            | Member+                        |
| PATCH  | `/comments/:id`       | `PLANNED` | —               | No            | Owner only, editedAt           |
| DELETE | `/comments/:id`       | `PLANNED` | —               | No            | Soft-delete                    |
| PUT    | `/posts/:id/vote`     | `PLANNED` | —               | No            | Upvote toggle/create           |
| DELETE | `/posts/:id/vote`     | `PLANNED` | —               | No            | Remove upvote                  |
| PUT    | `/posts/:id/rating`   | `PLANNED` | —               | No            | Recipe only, upsert            |
| PUT    | `/posts/:id/bookmark` | `PLANNED` | —               | No            | Recipe/Video only              |
| DELETE | `/posts/:id/bookmark` | `PLANNED` | —               | No            | Remove bookmark                |

### 6.4 Contributor, Moderation và Catalog

| Method | Path                                         | Status    | Backend updated | FE integrated         | Ghi chú                                                                            |
| ------ | -------------------------------------------- | --------- | --------------- | --------------------- | ---------------------------------------------------------------------------------- |
| POST   | `/contributor-applications`                  | `CHANGING` | 2026-09-19     | Yes (legacy; migrate) | Member-only unified application; public claim chỉ organization/platform; pending không cấp quyền |
| GET    | `/contributor-applications/me`               | `CHANGING` | 2026-09-19     | Yes (legacy; migrate) | Breaking response bỏ requested/approved subtype; trả claimed/final basis và evidence audit |
| GET    | `/admin/contributor-applications`            | `CHANGING` | 2026-09-19     | Yes (legacy; migrate) | Filter `claimedApprovalBasis`; response unified basis/evidence/inviter |
| POST   | `/admin/contributor-invitations`             | `IN_PROGRESS` | 2026-09-19  | No                   | Source/OpenAPI complete; final READY blocked by Windows Prisma query-engine DLL `EPERM` during build |
| PATCH  | `/admin/contributor-applications/:id/review` | `CHANGING` | 2026-09-19     | Yes (legacy; migrate) | APPROVE chọn final basis + reason; transactional role/profile/evidence/decision/session revoke; REJECT giữ Member + cooldown |
| PATCH  | `/admin/contributors/:userId/revoke`         | `IN_PROGRESS` | 2026-09-19  | No                   | Audited revoke implemented; final READY blocked by Windows Prisma query-engine DLL `EPERM` during build |
| GET    | `/review-queue/posts`                        | `PLANNED` | —               | Yes (legacy scaffold; migrate) | Unified Contributor/Admin filtering; author summary uses optional `contributorApprovalBasis` |
| PATCH  | `/review-queue/posts/:id/approve`            | `PLANNED` | —               | Yes (legacy scaffold; migrate) | Cấm self-approve; all active Contributors have identical review permission; response summary migrated |
| PATCH  | `/review-queue/posts/:id/reject`             | `PLANNED` | —               | Yes (legacy scaffold; migrate) | Reason required; all active Contributors have identical review permission; response summary migrated |
| POST   | `/reports`                                   | `READY`   | 2026-09-17      | Yes (2026-09-17)      | One active report/user/target; FE: `features/safety`                               |
| GET    | `/admin/reports`                             | `READY`   | 2026-09-16      | Yes (2026-09-17) | Admin only; filter status/priority/targetType                                      |
| PATCH  | `/admin/reports/:id/resolve`                 | `IN_PROGRESS` | 2026-09-19  | Yes (2026-09-17) | DEMOTE preservation/audit change implemented; final gate blocked by Windows Prisma query-engine DLL `EPERM` |
| GET    | `/admin/users`                               | `CHANGING` | 2026-09-19     | Yes (legacy; migrate) | Breaking response đổi `contributorType` thành optional `contributorApprovalBasis` |
| PATCH  | `/admin/users/:id/status`                    | `READY`   | 2026-09-16      | Yes (2026-09-17) | Lock/ban/unban/delete rules; chặn self & protected admin                           |
| GET    | `/admin/comments`                            | `CHANGING` | 2026-09-19     | Yes (legacy; migrate) | Author summary đổi subtype thành optional approval basis; basis không cấp quyền |
| PATCH  | `/admin/comments/:id/status`                 | `CHANGING` | 2026-09-19     | Yes (legacy; migrate) | Response author summary dùng unified Contributor contract |
| GET    | `/categories`                                | `READY`   | 2026-09-15      | Yes (2026-09-15)READY | Public active tree tối đa hai tầng; filter `type`                                  |
| GET    | `/admin/categories`                          | `READY`   | 2026-09-15      | Yes (2026-09-15)READY | Admin only; pagination; xem cả archived                                            |
| POST   | `/admin/categories`                          | `READY`   | 2026-09-15      | Yes (2026-09-15)READY | Admin only; parent/child cùng type                                                 |
| PATCH  | `/admin/categories/:id`                      | `READY`   | 2026-09-15      | Yes (2026-09-15)READY | Admin only; enforce depth và scoped slug                                           |
| DELETE | `/admin/categories/:id`                      | `READY`   | 2026-09-15      | Yes (2026-09-15)READY | Archive; child/proposal đang dùng cần replacement cùng type/tầng trong transaction |
| GET    | `/ingredients`                               | `READY`   | 2026-09-15      | Yes (2026-09-15)READY | Public active list; q không dấu, foodGroup, pagination                             |
| GET    | `/ingredients/resolve`                       | `READY`   | 2026-09-15      | Yes (2026-09-15)READY | `NONE/EXACT/AMBIGUOUS`; ambiguous luôn trả candidates                              |
| GET    | `/admin/ingredients`                         | `READY`   | 2026-09-15      | Yes (2026-09-15)READY | Admin only; xem active/archived và metadata                                        |
| POST   | `/admin/ingredients`                         | `READY`   | 2026-09-15      | Yes (2026-09-15)READY | Admin only; canonical + allergen/diet/tradition metadata                           |
| PATCH  | `/admin/ingredients/:id`                     | `READY`   | 2026-09-15      | Yes (2026-09-15)READY | Admin only; metadata array là full snapshot khi gửi                                |
| DELETE | `/admin/ingredients/:id`                     | `READY`   | 2026-09-15      | Yes (2026-09-15)READY | Archive; public endpoint ngừng trả item                                            |
| POST   | `/admin/ingredients/:id/aliases`             | `READY`   | 2026-09-15      | Yes (2026-09-15)READY | Admin only; normalize tiếng Việt có/không dấu                                      |
| DELETE | `/admin/ingredients/:id/aliases/:aliasId`    | `READY`   | 2026-09-15      | Yes (2026-09-15)READY | Admin only; 204 khi xóa thành công                                                 |

Persistence cho `category_proposals` đã có để giữ BL-12, nhưng endpoint Contributor submit/Admin
review proposal vẫn là `PLANNED` cho tới Phase 07; frontend chưa được tạo API consumer cho luồng này.

### 6.5 Meal Plan và Recommendation

| Method | Path                                 | Status  | Backend updated | FE integrated | Ghi chú                                                                   |
| ------ | ------------------------------------ | ------- | --------------- | ------------- | ------------------------------------------------------------------------- |
| POST   | `/meal-plans/generate`               | `READY` | 2026-09-16      | Yes (2026-09-16)  | Auth; tạo version mới 7×3, deterministic seed + idempotency               |
| GET    | `/meal-plans`                        | `READY` | 2026-09-16      | Yes (2026-09-16)  | Auth; own plans, pagination/filter tuần                                   |
| GET    | `/meal-plans/:id`                    | `READY` | 2026-09-16      | Yes (2026-09-16)  | Auth + ownership; 21 slots, snapshots, warnings và shopping list          |
| PATCH  | `/meal-plans/:id/items/:itemId/swap` | `READY` | 2026-09-16      | Yes (2026-09-16)  | Auth + ownership; expectedVersion/idempotency; hard-safe candidate        |
| DELETE | `/meal-plans/:id`                    | `READY` | 2026-09-16      | Yes (2026-09-16)  | Auth + ownership; idempotent soft-delete với expectedVersion              |
| POST   | `/behavior-events`                   | `READY` | 2026-09-16      | Yes (2026-09-16)  | Auth + active consent; allowlist metadata, idempotency và 5-minute dedupe |
| GET    | `/users/me/personalization`          | `READY` | 2026-09-16      | Yes (2026-09-16)  | Auth; đọc consent + consentVersion (verify live, bổ sung registry)        |
| PUT    | `/users/me/personalization`          | `READY` | 2026-09-16      | Yes (2026-09-16)  | Auth; body `{enabled, consentVersion}` đều bắt buộc (verify live)         |
| GET    | `/recommendations/home`              | `READY` | 2026-09-16      | Yes (2026-09-16)  | Auth; hard constraints trước ranking; score/reason codes v1               |

### 6.6 Chat và AI verification

> Provider decision: live AI dùng OpenAI Responses API; chat mặc định `gpt-5.6-terra`, moderation
> dùng `omni-moderation-latest`. Frontend chỉ gọi backend SSE contract, không gọi OpenAI trực tiếp và
> không phụ thuộc provider event shape. Năm endpoint private chat đã `READY`; public sharing và expert
> verification vẫn `PLANNED` cho Phase 23. Phase 14 sẽ thống nhất Contributor trước khi mở verification.

| Method | Path                              | Status    | Backend updated | FE integrated | Ghi chú                                      |
| ------ | --------------------------------- | --------- | --------------- | ------------- | -------------------------------------------- |
| POST   | `/chat/sessions`                  | `READY`   | 2026-09-16      | Yes (2026-09-16) | Guest signed cookie hoặc authenticated       |
| GET    | `/chat/sessions`                  | `READY`   | 2026-09-16      | Yes (2026-09-16) | Authenticated private history                |
| GET    | `/chat/sessions/:id/messages`     | `READY`   | 2026-09-16      | Yes (2026-09-16) | Auth/guest ownership; guest retention 7 ngày |
| POST   | `/chat/sessions/:id/messages`     | `READY`   | 2026-09-16      | Yes (2026-09-16) | SSE, idempotency, quota, fallback            |
| POST   | `/chat/messages/:id/feedback`     | `READY`   | 2026-09-16      | Yes (2026-09-16) | Owned assistant message; upsert up/down      |
| PATCH  | `/chat/messages/:id/share`        | `PLANNED` | —               | No            | Authenticated only                           |
| GET    | `/chat/public`                    | `PLANNED` | —               | No            | Public shared answers                        |
| POST   | `/ai-artifacts/:id/verifications` | `PLANNED` | —               | No            | Phase 23; mọi approved Contributor hoặc Admin; không phân subtype |

### 6.7 Restaurants và Location

| Method | Path                            | Status    | Backend updated | FE integrated | Ghi chú                             |
| ------ | ------------------------------- | --------- | --------------- | ------------- | ----------------------------------- |
| GET    | `/restaurants/nearby`           | `PLANNED` | —               | No            | lat/lng/radius                      |
| GET    | `/restaurants/search`           | `PLANNED` | —               | No            | Food query + Google/internal hybrid |
| GET    | `/restaurants/:id`              | `PLANNED` | —               | No            | Source/fetchedAt fields             |
| POST   | `/restaurants`                  | `PLANNED` | —               | No            | Member submission pending           |
| GET    | `/location/geocode`             | `PLANNED` | —               | No            | Backend server key                  |
| GET    | `/admin/restaurants`            | `PLANNED` | —               | No            | Pending queue                       |
| PATCH  | `/admin/restaurants/:id/review` | `PLANNED` | —               | No            | Approve/reject                      |

### 6.8 AI Governance và Notifications

| Method | Path                          | Status    | Backend updated | FE integrated | Ghi chú                       |
| ------ | ----------------------------- | --------- | --------------- | ------------- | ----------------------------- |
| GET    | `/admin/ai/metrics`           | `PLANNED` | —               | No            | Date range + feature filters  |
| GET    | `/admin/ai/requests`          | `PLANNED` | —               | No            | Redacted logs only            |
| GET    | `/admin/ai/flags`             | `PLANNED` | —               | No            | Review status                 |
| GET    | `/admin/ai/features`          | `PLANNED` | —               | No            | Current provider/model/toggle |
| PATCH  | `/admin/ai/features/:feature` | `PLANNED` | —               | No            | Reason required               |
| GET    | `/notifications`              | `PLANNED` | —               | No            | Pagination                    |
| PATCH  | `/notifications/:id/read`     | `PLANNED` | —               | No            | Owner only                    |
| PATCH  | `/notifications/read-all`     | `PLANNED` | —               | No            | Owner only                    |

### 6.9 Food data và cooking-aware nutrition — Phases 12–13

Các path dưới đây là contract target để định hướng; phase triển khai được quyền tinh chỉnh trước khi đánh `READY`, nhưng phải cập nhật OpenAPI và bảng này cùng lúc.

| Method | Path | Status | Backend updated | FE integrated | Ghi chú |
|---|---|---|---|---|---|
| GET | `/food-data/ingredients/:ingredientId/nutrients` | `READY` | 2026-09-19 | No | Approved effective profiles, conversions, nutrients + provenance/version; missing không phải zero |
| GET | `/food-data/reference-intakes` | `READY` | 2026-09-19 | No | Approved effective population/unit/source/version records |
| GET | `/food-data/ingredient-guidelines` | `READY` | 2026-09-19 | No | Amount/frequency per period; population/evidence/source/severity |
| GET | `/food-data/cooking-methods` | `READY` | 2026-09-19 | No | Active methods with approved effective retention/yield factors |
| GET | `/food-data/interaction-rules` | `READY` | 2026-09-19 | No | Reviewed evidence-graded rules; scope dish/meal/day |
| GET/POST | `/admin/food-data/records` | `READY` | 2026-09-19 | No | Admin list/create by typed `kind`; AI suggestions remain `STAGED` |
| PUT/DELETE | `/admin/food-data/records/:id` | `READY` | 2026-09-19 | No | Full replace or archive/supersede; no hard-delete of reviewed records |
| POST | `/admin/food-data/imports/preview` | `READY` | 2026-09-19 | No | Admin, provider adapter validation; writes staging/audit only, not canonical data |
| POST | `/admin/food-data/imports` | `READY` | 2026-09-19 | No | Admin, commits a preview by `importId`; idempotent replay + audit |
| POST | `/posts/:id/nutrition/preview` | `IN_PROGRESS` | 2026-09-19 | No | Implemented in source/OpenAPI; public for published recipe, owner/Admin for draft/latest; unsaved deterministic/partial estimate; pending final `npm run build` gate |
| POST | `/posts/:id/nutrition/recalculate` | `IN_PROGRESS` | 2026-09-19 | No | Implemented in source/OpenAPI; Auth owner/Admin; saves new estimate version, histories previous current estimate; pending final `npm run build` gate |
| GET | `/posts/:id/nutrition/current` | `IN_PROGRESS` | 2026-09-19 | No | Implemented in source/OpenAPI; current saved estimate; stale/incomplete errors documented; pending final `npm run build` gate |
| GET | `/posts/:id/nutrition/history` | `IN_PROGRESS` | 2026-09-19 | No | Implemented in source/OpenAPI; paginated saved estimate versions with `CURRENT/HISTORICAL/STALE` status; pending final `npm run build` gate |
| GET | `/posts/:id/nutrition/status` | `IN_PROGRESS` | 2026-09-19 | No | Implemented in source/OpenAPI; estimate freshness and latest nutrition AI fallback job status; pending final `npm run build` gate |

### 6.10 Unified Contributor migration — Phase 14

| Contract area | Status | FE action |
|---|---|---|
| Registration/application request | `CHANGING` | Replace `requestedType` with `claimedApprovalBasis`; add conditional `organizationClaim`; role remains `MEMBER` while pending |
| Admin review | `CHANGING` | Remove subtype selection; choose final `approvalBasis` and enter reason; handle basis/source conflict |
| Contributor profile/session | `CHANGING` | Remove `contributorType`; show one Contributor role plus optional approval-basis label |
| Admin invitation/revocation | `IN_PROGRESS`, FE not integrated | Source/OpenAPI complete; wait for backend build gate, then add DTOs/hooks when scheduled |
| RBAC/UI gates | `CHANGING` | Gate only by authoritative `role === CONTRIBUTOR` plus active profile returned by backend, never by basis |

Phase 14 source/migration/OpenAPI is implemented. Existing frontend consumers still use the removed subtype fields, so affected endpoints remain `CHANGING` until frontend runs `npm run sync:swagger` and migrates DTO/Model/Mapper/forms/tests. New invitation/revocation endpoints remain `IN_PROGRESS` until the backend build gate passes; `FE integrated = No`.

Legacy data mapping is intentionally conservative: both `EXPERIENCED_PRACTITIONER` and `NUTRITION_EXPERT` rows become `PLATFORM_TRACK_RECORD`. The migration snapshots platform post/interaction counts and retains old values/free-text basis inside database audit evidence; it does not infer organization affiliation, certificate verification, or professional status.

### 6.11 Storage quota và video review — Phases 15–16

| Method | Path | Status | Backend updated | FE integrated | Ghi chú |
|---|---|---|---|---|---|
| GET | `/storage/me` | `READY` | — | No | used/reserved/limit/remaining bytes |
| POST | `/uploads/reservations` | `READY` | — | No | Reserve quota before upload |
| POST | `/uploads/reservations/:id/commit` | `READY` | — | No | Commit actual provider bytes |
| DELETE | `/uploads/reservations/:id` | `READY` | — | No | Cancel/release owner reservation |
| GET | `/admin/storage/accounts` | `READY` | — | No | Admin usage/policy inspection |
| DELETE | `/storage/assets/:id` | `READY` | 2026-09-19 | No | Idempotent durable provider delete; usage decrements after Cloudinary confirms |
| GET | `/admin/storage/policies` | `READY` | 2026-09-19 | No | List configurable quota policies |
| PATCH | `/admin/storage/policies/:id` | `READY` | 2026-09-19 | No | Update policy fields with optimistic version |
| POST | `/admin/storage/accounts/:userId/adjustments` | `READY` | 2026-09-19 | No | Idempotent audited byte-level quota adjustment |
| GET | `/admin/storage/adjustments` | `READY` | 2026-09-19 | No | Paginated immutable adjustment audit log |
| POST | `/posts/:id/submit` | `READY` | 2026-09-21 | No | Shared recipe/handbook/video submission; moderation signal only |
| GET | `/posts/:id/review-history` | `READY` | 2026-09-21 | No | Author/Admin paginated immutable revision/review/media/signal history |
| GET | `/admin/content-review` | `READY` | 2026-09-21 | No | Admin-only; filter `type=VIDEO`, status/priority và pagination |
| GET | `/admin/content-review/:revisionId` | `READY` | 2026-09-21 | No | Admin-only detail; retained for hidden/deleted audit evidence |
| PATCH | `/admin/content-review/:revisionId` | `READY` | 2026-09-21 | No | Admin-only `APPROVE`/`REJECT`; reason bắt buộc; cấm self-review |
| GET/PATCH | `/review-queue/posts*` | `DEPRECATED` | 2026-09-21 | Yes (legacy; migrate) | Admin-only legacy aliases; migrate sang `/admin/content-review*` |

MVP không có payment/quota purchase, DMCA workflow, audio/frame copyright detection, hoặc video transcription.

### 6.12 Custom meals, analysis, và multi-week programs — Phases 17–19

| Method | Path | Status | Backend updated | FE integrated | Ghi chú |
|---|---|---|---|---|---|
| GET/POST | `/custom-meals` | `PLANNED` | — | No | Owner-only list/create; multiple photos and structured ingredients |
| GET/PATCH/DELETE | `/custom-meals/:id` | `PLANNED` | — | No | Owner-only; safe behavior when used by plan |
| POST | `/custom-meals/:id/media` | `PLANNED` | — | No | Quota-aware photo attach/reorder |
| PATCH | `/meal-plans/:id/items/:itemId/manual-add` | `READY` | 2026-09-23 | No | Recipe/private custom meal; hard diet/allergy/exclusion/tradition precedence; returns refreshed analysis |
| POST | `/meal-plans/:id/analyze` | `READY` | 2026-09-23 | No | Versioned portion, nutrient limit, ingredient guideline, same-dish/meal/day warnings with UI dialog fields |
| GET | `/meal-plans/:id/analysis` | `READY` | 2026-09-23 | No | Current fingerprint-validated result; returns `MEAL_ANALYSIS_STALE` after relevant input changes |
| GET/POST | `/meal-programs` | `PLANNED` | — | No | Multi-week list/create/generate |
| GET/PATCH | `/meal-programs/:id` | `PLANNED` | — | No | Versioned owner detail/edit/confirm |

`tags` của custom meal là text do user tạo; `shopee` không phải service/provider ID. Warning DTO phải có code, severity, source/evidence, affected items, explanation, confidence, và suggested adjustment để FE render tooltip/dialog.

### 6.13 Pantry và fridge recognition — Phases 20–21

| Method | Path | Status | Backend updated | FE integrated | Ghi chú |
|---|---|---|---|---|---|
| GET/POST | `/pantry/items` | `PLANNED` | — | No | Confirmed owner inventory |
| PATCH/DELETE | `/pantry/items/:id` | `PLANNED` | — | No | Optimistic version; preserve adjustment history |
| POST | `/pantry/merge` | `PLANNED` | — | No | Preview/confirm duplicate merge |
| POST | `/ingredient-recognition/jobs` | `PLANNED` | — | No | Multiple images; asynchronous |
| GET | `/ingredient-recognition/jobs/:id` | `PLANNED` | — | No | Candidates/confidence/evidence/status |
| PATCH | `/ingredient-recognition/jobs/:id/candidates/:candidateId` | `PLANNED` | — | No | User correction/rejection |
| POST | `/ingredient-recognition/jobs/:id/confirm` | `PLANNED` | — | No | Only this boundary updates pantry |

Freshness is an uncertain observation. UI must not say the system has certified food safety.

### 6.14 Receipt analysis và shopping gaps — Phase 22

| Method | Path | Status | Backend updated | FE integrated | Ghi chú |
|---|---|---|---|---|---|
| POST | `/receipt-jobs` | `PLANNED` | — | No | Upload/attach image and start extraction |
| GET | `/receipt-jobs/:id` | `PLANNED` | — | No | Candidate lines, matches, confidence, status |
| PATCH | `/receipt-jobs/:id/candidates/:candidateId` | `PLANNED` | — | No | Correct/reject candidate |
| POST | `/receipt-jobs/:id/confirm` | `PLANNED` | — | No | Idempotent confirmed pantry diff |
| POST | `/shopping-lists/preview` | `PLANNED` | — | No | Required/available/missing + assumptions/source meals |

Receipt extraction never mutates pantry before confirmation. Shopping gap uses confirmed pantry and selected meal servings.

### 6.15 AI artifacts và unified verification — Phase 23

| Method | Path | Status | Backend updated | FE integrated | Ghi chú |
|---|---|---|---|---|---|
| POST | `/ai-artifacts` | `PLANNED` | — | No | Save eligible immutable/versioned output |
| PATCH | `/ai-artifacts/:id/visibility` | `PLANNED` | — | No | Owner share/unshare; strict public allowlist |
| GET | `/ai-artifacts/public` | `PLANNED` | — | No | Public artifacts only; no private context |
| POST | `/ai-artifacts/:id/verifications` | `PLANNED` | — | No | Any approved Contributor/Admin; no self-review |
| PATCH | `/admin/ai-verifications/:id` | `PLANNED` | — | No | Audited override/revoke with reason |

Verification is not canonical food-data promotion. UI badge says “Contributor verified”, never “scientifically certified”.

### 6.16 Phase 26 governance additions

The existing Phase 26 governance paths in section 6.8 will expand to cover cooking-aware nutrition, fridge recognition, receipt extraction, and verification metrics. Required DTOs include provider/model/template version, status, latency, coverage/confidence aggregates, correction rates, redaction state, and feature fallback; raw health/image/receipt/prompt content must not be returned.

### 6.17 Roadmap Phase 2 boundary

Do not add live consumers for wearables/HealthKit/Health Connect, video STT/summarization, storage payments, certificate verification, formal DMCA, marketplace APIs, expanded traditions, or clinical medication interactions. Those capabilities are retained in `/docs/ROADMAP_PHASE_2.md`, not in the current OpenAPI contract.

---

## 7. Luồng tích hợp đặc biệt

### 7.1 Register có Contributor request — Phase 14 breaking contract

Current backend target:

```json
{
  "email": "user@example.com",
  "password": "...",
  "displayName": "...",
  "contributorRequest": {
    "claimedApprovalBasis": "ORGANIZATION_AFFILIATION",
    "organizationClaim": "Tên tổ chức do applicant khai báo",
    "experience": "Động lực và kinh nghiệm đóng góp...",
    "referenceLinks": ["https://example.com/reference"]
  }
}
```

Response user luôn có:

```json
{
  "role": "MEMBER",
  "contributorApplication": {
    "status": "PENDING",
    "claimedApprovalBasis": "ORGANIZATION_AFFILIATION"
  }
}
```

User form chỉ cho claim `ORGANIZATION_AFFILIATION` hoặc `PLATFORM_TRACK_RECORD`; `organizationClaim` bắt buộc cho organization và không gửi cho platform. `ADMIN_INVITED` chỉ do `POST /admin/contributor-invitations` tạo, vẫn `PENDING` và cần manual review. Response bỏ `requestedType`, `approvedType`, và `contributorType`; approval trả `approvalBasis`, `approvalBasisLabel`, và evidence theo kind. Cả ba basis có quyền giống hệt nhau.

Frontend migration bắt buộc: sync OpenAPI; xóa `ContributorType` và mọi subtype label/branch; đổi register/application/admin review DTO + Zod form + mapper/tests; đổi filter `requestedType` thành `claimedApprovalBasis`; đổi author/admin summaries sang `contributorApprovalBasis`; xử lý `CONTRIBUTOR_APPROVAL_BASIS_INVALID`, invitation/revoke conflicts và `STALE_ACCESS_TOKEN` sau approve/revoke.

### 7.2 Diet rule confirmation

```text
User chọn pattern/schedule/tradition
→ POST /diet-rules/preview
→ render từng rule với toggle
→ user xác nhận
→ PUT /users/me/diet-preferences
→ nếu PERIODIC: PUT /users/me/diet-schedule
```

Frontend gửi rule ID + enabled state, không gửi tự chế ingredient restriction thay cho rule ID. Allergies và explicit exclusions được quản lý riêng.

Khi backend trả `DIET_RULE_RECONFIRMATION_REQUIRED`, UI đưa user về màn review rules; không tự bật rule mới.

### 7.3 Upload Cloudinary

```text
FE xin signature từ backend
→ FE upload trực tiếp Cloudinary
→ FE nhận secure URL/public ID
→ FE tạo/cập nhật post bằng media reference
```

- Không gửi API secret xuống frontend.
- Validate MIME/size ở UI để UX tốt, nhưng backend vẫn phải validate metadata khi lưu Post.
- Hiển thị progress và retry; không tạo Post record trước khi upload hoàn tất trừ khi backend contract hỗ trợ draft rõ ràng.
- Sau Phase 15, flow bắt buộc thêm bước reserve quota trước upload và commit/release bằng reservation ID; frontend hiển thị used/reserved/remaining nhưng backend là nơi quyết định quota.

### 7.4 Chat SSE

Frontend cần xử lý event types do OpenAPI chốt, tối thiểu:

```text
message_start
content_delta
message_complete
quota
error
```

- Chỉ commit message vào cache khi nhận `message_complete`.
- Abort navigation phải đóng stream.
- `error` có thể xuất hiện sau HTTP 200; không chỉ dựa vào Axios error interceptor.
- Disclaimer render cố định kể cả khi stream lỗi một phần.
- `POST /chat/sessions` cấp signed HttpOnly `chatGuest` cookie khi chưa đăng nhập; frontend không gửi
  `guestId`. Guest session hết hạn và bị purge sau 7 ngày. `GET /chat/sessions` chỉ dành cho user đã
  đăng nhập; guest mở history qua session ID cùng cookie ownership.
- Daily quota mặc định: Guest `5`, Member `20`, Contributor/Admin `50`; backend config có thể thay đổi
  các giá trị này. Reset lúc `00:00 Asia/Ho_Chi_Minh`. Reservation ngăn concurrent request vượt quota,
  và chỉ provider response hoàn chỉnh mới consume quota.
- Validation, topic/safety block, timeout, provider failure, client abort và static fallback không trừ
  quota. Retry phải giữ nguyên `idempotencyKey`; completed turn được replay, payload khác trả conflict.
- Live provider là OpenAI Responses API với `gpt-5.6-terra`; thiếu key/provider down trả static fallback
  và core API vẫn hoạt động. Local development có thể đặt `AI_PROVIDER=fake`.
- Raw chat chỉ nằm trong private message history. AI request log chỉ giữ prompt hash, allowlisted topic
  codes, provider/model, latency/token usage và status; không ghi raw prompt/profile.
- Khi personalization consent active, backend tự emit `CHAT_TOPIC` từ allowlist; frontend không được
  tự gửi raw chat text vào behavior event.

### 7.5 Behavioral events

- Không block primary action nếu ghi event thất bại.
- Chỉ gửi event khi backend xác nhận personalization consent đang active.
- Dùng `idempotencyKey` ổn định khi retry. `SEARCH`, `VIEW_RECIPE` và `CHAT_TOPIC` được backend dedupe
  theo cửa sổ 5 phút; client có thể giảm noise thêm nhưng không thay thế backend dedupe.
- Chỉ gửi metadata đúng event type. `CHAT_TOPIC` gửi topic code allowlist, tuyệt đối không gửi raw chat text;
  `RATE` và `BOOKMARK` được backend đối chiếu với interaction thuộc chính user.
- `behavioral-v1` dùng lookback 30 ngày và decay half-life 14 ngày. Trọng số ổn định:
  ingredient overlap `+5`, bookmark similar `+4`, rating >= 4 similar `+3`, chat topic `+2`, repeated
  view `+2`, recent search `+1`, recent accepted meal `-4`, rejected/swapped similar `-3`.
- Allergy, explicit ingredient exclusion, diet pattern và enabled tradition được filter trước scoring.
  Candidate pool lấy tối đa 200 Recipe published mới nhất sau hard-filter. Consent off/no events dùng
  cold start rating/popularity. Tie-break lần lượt rating average, rating count, vote count, bookmark
  count, published time và UUID.
- Recommendation UI render tối đa hai `reasonCodes`, hiển thị `scoringVersion` và
  `appliedConstraints`; không tự đọc raw behavior history.

### 7.6 Meal Planner

- `POST /meal-plans/generate` yêu cầu `weekStart` là thứ Hai, `goal`, `idempotencyKey`; `seed` và
  `supersedesMealPlanId` là optional. Mỗi lần generate/regenerate tạo record version mới, không
  overwrite plan cũ. `MAINTAIN/LOSE/GAIN` lần lượt dùng TDEE × `1/0.9/1.1` từ backend config.
- Plan cố định 7 ngày × 3 bữa với split sáng/trưa/tối `25/40/35`. Candidate phải là published Recipe,
  `mealPlannerEligible`, có calories và toàn bộ ingredient đã canonical hóa. Backend áp allergy,
  explicit exclusion, diet pattern và enabled tradition theo từng ngày trước mọi scoring.
- Calorie tolerance bắt đầu ±15%; chỉ nới ±20% khi không có candidate và trả
  `CALORIE_TOLERANCE_WIDENED`. Recipe không lặp khi pool đủ; thiếu pool được dùng tối đa hai lần với
  `RECIPE_REPEATED`; không có món hợp lệ thì slot `UNFILLED`, không nới hard constraint.
- `PERIODIC` phải có ít nhất một ngày được chọn trong tuần generate; `DIET_SCHEDULE_REQUIRED` trả
  `fields.availableDates`. Behavioral score và ingredient coverage chỉ xếp hạng candidate đã an toàn.
- Swap dùng `expectedVersion` và `idempotencyKey`; ưu tiên ±100 kcal so với món cũ, sau đó mới dùng
  ±20% target có warning. Khi `MEAL_PLAN_VERSION_CONFLICT`, refetch detail trước khi retry.
- Shopping list chỉ cộng canonical ingredient theo cùng unit hoặc conversion chắc chắn `kg→g`,
  `l→ml`; unit không tương thích giữ thành dòng riêng và trả `SHOPPING_UNIT_NOT_COMBINED`.
- `nutritionDataQuality` là `COMPLETE/PARTIAL/UNAVAILABLE`. Tổng B12 chỉ có khi recipe thật sự có dữ
  liệu; backend không suy luận micronutrient từ calories. UI render warning/reason code từ response,
  không tự diễn giải lại hard constraints.

### 7.7 Maps

- Browser lấy geolocation sau thao tác/consent rõ ràng.
- Từ chối permission phải chuyển sang form địa chỉ.
- Map và list dùng cùng một result set/backend IDs.
- Không gọi Places web service bằng backend key từ browser.
- Khi `externalDataUnavailable=true`, UI vẫn hiển thị list nội bộ và thông báo nhẹ, không block màn hình.

### 7.8 Cooking-aware nutrition — planned Phase 13

```text
Recipe ingredients + structured cooking steps
→ preview calculation
→ render canonical/calculated/AI-estimated origin per value
→ user reviews uncovered ingredients + assumptions/confidence/range
→ save/recalculate version
```

Frontend không cộng nutrient hoặc tự áp retention factor. Missing value hiển thị “chưa có dữ liệu”, không hiển thị `0`. Khi AI provider down, vẫn render deterministic/partial result backend trả về.

### 7.9 Quota-aware upload — planned Phase 15

```text
GET storage usage
→ reserve declared bytes
→ upload trực tiếp provider
→ commit actual provider bytes
→ release reservation nếu cancel/fail
```

Retry cùng thao tác dùng idempotency semantics backend chốt. Không tự tăng usage ở client ngoài optimistic display có rollback.

### 7.10 Custom meal và compatibility — planned Phases 17–19

- Custom meal là private owner resource, có nhiều ảnh và tag text tự do.
- Plan item picker gửi explicit source type `RECIPE` hoặc `CUSTOM_MEAL`.
- Render warning do backend trả với severity/evidence/source/confidence; frontend không tự tạo hard prohibition.
- Edit plan/program phải gửi expected version và refetch khi conflict.

### 7.11 Fridge/receipt confirmation — planned Phases 21–22

```text
Upload one or more images
→ poll job status
→ show editable candidates and confidence
→ user confirms/rejects
→ backend returns pantry diff
→ refetch pantry and shopping gap
```

Không update pantry từ `PROCESSING` hoặc candidate response. Không dùng copy khẳng định thực phẩm “an toàn để ăn”.

### 7.12 AI artifact verification — planned Phase 23

- Share/unshare chỉ trên artifact allowlist, không đưa chat session/profile/receipt/image raw ra public.
- Button verify gate bằng approved Contributor/Admin role, không gate bằng approval basis.
- Hiển thị original output bất biến và correction/evidence riêng; xử lý self-review/version/concurrency conflicts.
- Badge dùng “Contributor verified”, không dùng “scientifically certified”.

---

## 8. Business error codes frontend phải xử lý

Danh sách này là baseline; schema chính thức phải nằm trong OpenAPI.

| Code                                          | UI behavior                                                            |
| --------------------------------------------- | ---------------------------------------------------------------------- |
| `AUTH_REQUIRED`                               | Mở login/redirect có return URL                                        |
| `INVALID_ACCESS_TOKEN`                        | Xóa auth state; yêu cầu đăng nhập lại                                  |
| `TOKEN_EXPIRED`                               | Để refresh queue xử lý                                                 |
| `INVALID_REFRESH_TOKEN`                       | Xóa auth state; yêu cầu đăng nhập lại                                  |
| `REFRESH_TOKEN_REUSED`                        | Xóa auth state trên thiết bị và cảnh báo phiên đã bị thu hồi           |
| `INVALID_CREDENTIALS`                         | Báo email hoặc mật khẩu không đúng, không tiết lộ tài khoản tồn tại    |
| `EMAIL_ALREADY_EXISTS`                        | Hiển thị lỗi email đã được sử dụng tại form đăng ký                    |
| `ACCOUNT_LOCKED`                              | Hiện thời gian thử lại nếu có                                          |
| `ACCOUNT_BANNED`                              | Logout và hiển thị lý do/contact                                       |
| `STALE_ACCESS_TOKEN`                          | Xóa session và yêu cầu đăng nhập lại để nhận role hiện tại             |
| `FORBIDDEN`                                   | Trang/notification không đủ quyền                                      |
| `VALIDATION_ERROR`                            | Map `fields` vào form                                                  |
| `NOT_FOUND`                                   | Hiển thị trạng thái không tìm thấy phù hợp với resource/page           |
| `INVALID_JSON`                                | Báo request không hợp lệ; không retry tự động                          |
| `PAYLOAD_TOO_LARGE`                           | Yêu cầu user giảm kích thước payload/file trước khi thử lại            |
| `DATABASE_UNAVAILABLE`                        | Hiển thị trạng thái dịch vụ tạm thời không khả dụng và cho phép retry  |
| `INTERNAL_SERVER_ERROR`                       | Hiển thị lỗi hệ thống kèm mã request để hỗ trợ tra soát                |
| `CONTRIBUTOR_APPLICATION_PENDING`             | Disable submit, link xem trạng thái                                    |
| `CONTRIBUTOR_REAPPLY_NOT_ALLOWED`             | Hiển thị ngày được apply lại                                           |
| `CONTRIBUTOR_APPLICATION_NOT_ALLOWED`         | Ẩn form apply với Admin hoặc role không phù hợp                        |
| `CONTRIBUTOR_APPROVAL_BASIS_INVALID`          | Refresh application; chỉ chọn basis hợp lệ cho source/evidence đã lưu |
| `CONTRIBUTOR_INVITATION_NOT_ALLOWED`          | Refresh target; chỉ mời Member ACTIVE chưa có application pending |
| `CONTRIBUTOR_REVOCATION_NOT_APPLICABLE`       | Refresh user; Contributor đã bị revoke hoặc không còn active |
| `CONTRIBUTOR_APPLICATION_ALREADY_REVIEWED`    | Refresh Admin queue; application đã có quyết định                      |
| `CONTRIBUTOR_APPLICATION_NOT_REVIEWABLE`      | Giữ queue và báo applicant không còn đủ điều kiện                      |
| `SELF_APPROVAL_FORBIDDEN`                     | Giữ queue và báo lỗi rõ                                                |
| `ADMIN_REVIEW_REQUIRED`                       | Chỉ hiển thị quyết định final cho Admin với flagged/quarantined target |
| `REVIEW_ALREADY_DECIDED`                      | Refresh review queue; revision đã có quyết định                        |
| `REVIEW_CONFLICT`                             | Refresh review queue; reviewer khác vừa xử lý revision                 |
| `CONTENT_AUTHOR_INACTIVE`                     | Không cho publish content của user đã bị ban/xóa                       |
| `SELF_REPORT_FORBIDDEN`                       | Không cho report content/comment của chính user                        |
| `DUPLICATE_ACTIVE_REPORT`                     | Mở report hiện tại thay vì submit report trùng                         |
| `REPORT_ALREADY_RESOLVED`                     | Refresh Admin report queue                                             |
| `REPORT_REVIEW_CONFLICT`                      | Refresh queue; Admin khác vừa resolve                                  |
| `DEMOTION_NOT_APPLICABLE`                     | Refresh target; author không còn là Contributor                        |
| `SELF_MODERATION_FORBIDDEN`                   | Không cho Admin đổi status tài khoản của chính mình                    |
| `PROTECTED_ADMIN_ACCOUNT`                     | Không cho moderation tài khoản Admin qua endpoint này                  |
| `USER_STATUS_CONFLICT`                        | Refresh user; transition status không hợp lệ                           |
| `COMMENT_NOT_MODERATABLE`                     | Comment đã bị author xóa và không thể restore                          |
| `COMMENT_STATUS_CONFLICT`                     | Refresh comment; item đã ở trạng thái yêu cầu                          |
| `DIET_RULE_RECONFIRMATION_REQUIRED`           | Mở review rule flow                                                    |
| `DIET_SCHEDULE_REQUIRED`                      | Yêu cầu chọn ngày periodic                                             |
| `DIET_RULES_UNAVAILABLE`                      | Không cho lưu preference; hiển thị trạng thái cấu hình chưa sẵn sàng   |
| `INVALID_DIET_RULE_SELECTION`                 | Sync lại preview và yêu cầu user xác nhận toàn bộ rule                 |
| `DIET_RULE_REQUIRED`                          | Giữ bật hard constraint của diet pattern                               |
| `DIET_PREFERENCES_REQUIRED`                   | Điều hướng user lưu diet preference trước khi chỉnh lịch               |
| `DIET_SCHEDULE_NOT_APPLICABLE`                | Không gửi ngày khi practice schedule là `PERMANENT`                    |
| `INVALID_INGREDIENT_EXCLUSIONS`               | Yêu cầu loại mục rỗng/trùng khỏi danh sách exclusion                   |
| `INVALID_CATALOG_NAME`                        | Báo tên không thể chuẩn hóa thành slug/canonical key hợp lệ            |
| `INVALID_CATEGORY_PARENT`                     | Yêu cầu chọn parent category active                                    |
| `CATEGORY_TYPE_MISMATCH`                      | Chỉ cho chọn parent cùng category type                                 |
| `CATEGORY_DEPTH_EXCEEDED`                     | Không cho tạo/chuyển category vượt quá hai tầng                        |
| `CATEGORY_SLUG_CONFLICT`                      | Báo slug đã tồn tại trong cùng parent/type                             |
| `CATEGORY_REPLACEMENT_REQUIRED`               | Mở selector replacement trước khi archive category đang được dùng      |
| `INVALID_CATEGORY_REPLACEMENT`                | Chỉ chấp nhận replacement active, cùng type và cùng tầng               |
| `CATEGORY_REPLACEMENT_CONFLICT`               | Refresh cây; replacement gây xung đột slug ở subtree                   |
| `INVALID_INGREDIENT_METADATA`                 | Sync catalog; allergen/diet/tradition metadata không hợp lệ            |
| `INGREDIENT_NAME_CONFLICT`                    | Báo canonical ingredient đã tồn tại sau normalize không dấu            |
| `INGREDIENT_ALIAS_CONFLICT`                   | Báo alias đã tồn tại trên canonical ingredient này                     |
| `CATALOG_REFERENCE_CONFLICT`                  | Refresh catalog; item/metadata đang có reference không hợp lệ          |
| `INVALID_CONTENT`                             | Giữ form và hiển thị business validation của Recipe/Blog/Video         |
| `INVALID_MEDIA_REFERENCE`                     | Yêu cầu upload/chọn lại media hợp lệ trước khi submit                  |
| `INVALID_INGREDIENT_REFERENCE`                | Sync catalog và yêu cầu chọn lại canonical ingredient                  |
| `CONTENT_SLUG_CONFLICT`                       | Báo slug đã tồn tại và cho user chỉnh slug                             |
| `CONTENT_VERSION_CONFLICT`                    | Fetch revision mới nhất trước khi merge/submit lại                     |
| `CONTENT_STATE_CONFLICT`                      | Khóa edit khi content đang bị giữ để review                            |
| `CONTENT_DELETED`                             | Đóng editor và hiển thị trạng thái đã xóa cho owner/Admin              |
| `INVALID_SEARCH_QUERY`                        | Giữ filters hiện tại và yêu cầu từ khóa có chữ hoặc số                 |
| `PERSONALIZATION_CONSENT_REQUIRED`            | Mở consent setting; không retry event cho tới khi user bật             |
| `PERSONALIZATION_CONSENT_VERSION_UNSUPPORTED` | Sync contract và yêu cầu user xác nhận consent version hiện hành       |
| `BEHAVIOR_EVENT_INVALID_TARGET`               | Bỏ event stale; refresh published recipe                               |
| `BEHAVIOR_EVENT_NOT_OWNED`                    | Không retry; sync lại bookmark/rating state của current user           |
| `BEHAVIOR_EVENT_TIME_INVALID`                 | Tạo event mới với client timestamp hợp lệ trong lookback               |
| `BEHAVIOR_IDEMPOTENCY_CONFLICT`               | Tạo idempotency key mới chỉ cho primary action mới                     |
| `INVALID_COMMENT_PARENT`                      | Giữ nội dung và yêu cầu reply lại một root comment còn visible         |
| `COMMENT_OWNER_REQUIRED`                      | Không mở edit/delete cho comment của user khác                         |
| `COMMENT_NOT_EDITABLE`                        | Refresh thread; comment đã deleted/hidden không thể sửa hoặc restore   |
| `RATING_RECIPE_ONLY`                          | Ẩn rating control khỏi Blog/Video                                      |
| `BOOKMARK_TYPE_NOT_SUPPORTED`                 | Ẩn bookmark control khỏi Blog                                          |
| `COMMUNITY_RATE_LIMITED`                      | Disable action theo `retryAfterSeconds`, không retry tự động           |
| `HEALTH_PROFILE_INCOMPLETE`                   | Link tới health profile                                                |
| `NO_ELIGIBLE_RECIPE`                          | Hiển thị slot trống/warnings, không crash                              |
| `MEAL_PLAN_SUPERSEDES_INVALID`                | Chỉ regenerate từ own plan cùng tuần                                   |
| `MEAL_PLAN_IDEMPOTENCY_CONFLICT`              | Không retry payload khác với cùng key; tạo key mới cho thao tác mới    |
| `MEAL_PLAN_VERSION_CONFLICT`                  | Refetch plan detail và cho user thực hiện lại swap/delete              |
| `VERIFICATION_ALREADY_EXISTS`                 | Refresh target và hiển thị reviewer hiện tại                           |
| `AI_QUOTA_EXCEEDED`                           | Hiển thị reset time/CTA phù hợp role                                   |
| `AI_RATE_LIMITED`                             | Tôn trọng `retryAfterSeconds`; không tự đổi guest identity             |
| `AI_FEATURE_DISABLED`                         | Hiển thị maintenance state; history vẫn xem được                       |
| `AI_PROVIDER_UNAVAILABLE`                     | Retry/fallback message                                                 |
| `CHAT_IDEMPOTENCY_CONFLICT`                   | Chỉ tạo key mới cho user action mới; không đổi payload của key cũ      |
| `CHAT_REQUEST_IN_PROGRESS`                    | Giữ stream hiện tại hoặc chờ rồi retry cùng idempotency key            |
| `EXTERNAL_LOCATION_UNAVAILABLE`               | Dùng internal restaurant results                                       |
| `RESOURCE_CONFLICT`                           | Refresh entity/version trước khi sửa lại                               |
| `FOOD_DATA_SOURCE_UNAVAILABLE`                | Chọn nguồn active đã được Admin cấu hình trước khi preview import       |
| `DUPLICATE_SOURCE_RECORD`                     | Loại source record ID trùng trong cùng payload import                   |
| `UNKNOWN_NUTRIENT_CODE`                       | Tạo/activate nutrient definition rồi preview lại                        |
| `NUTRIENT_UNIT_MISMATCH`                      | Đổi về default unit của nutrient; backend không tự đổi dimension        |
| `FOOD_DATA_REFERENCE_INVALID`                 | Refetch source/nutrient/ingredient/method ID trước khi lưu              |
| `FOOD_DATA_DUPLICATE`                         | Refetch code/source identity/effective version; không retry mù          |
| `FOOD_DATA_NOT_FOUND`                         | Hiển thị record không tồn tại hoặc ingredient không active              |
| `FOOD_DATA_VERSION_CONFLICT`                  | Refetch source/version trước khi Admin sửa/import lại                    |
| `IMPORT_IDEMPOTENCY_CONFLICT`                 | Giữ key cho cùng payload; tạo key mới chỉ cho import action mới         |
| `IMPORT_NOT_COMMITTABLE`                      | Tạo preview mới thay vì commit batch FAILED                             |
| `IMPORT_STAGING_INVALID`                      | Preview lại theo contract hiện tại                                      |
| `IMPORT_REFERENCE_CHANGED`                    | Nutrient definition đổi sau preview; preview lại trước khi commit       |
| `INVALID_SERVINGS`                            | Chặn lưu/tính với servings không hợp lệ; yêu cầu sửa recipe trước khi thử lại |
| `NUTRITION_DATA_INCOMPLETE`                   | Hiển thị trạng thái chưa có estimate đã lưu hoặc partial/unknown; không coi missing là zero |
| `NUTRITION_ESTIMATE_STALE`                    | Refetch/recalculate vì ingredient/step/source/factor fingerprint đã đổi |
| `STORAGE_QUOTA_EXCEEDED`                      | Hiển thị used/limit/remaining; yêu cầu xóa media hoặc giảm upload (READY Phase 15) |
| `UPLOAD_RESERVATION_EXPIRED`                  | Xin reservation mới trước khi retry upload (READY Phase 15)          |
| `UPLOAD_PROVIDER_MISMATCH`                    | Không attach asset; thông báo upload thất bại và release quota (READY Phase 15) |
| `CUSTOM_MEAL_IN_USE`                          | Giải thích plan đang tham chiếu; dùng policy snapshot/block của backend (planned Phase 17) |
| `MEAL_ANALYSIS_STALE`                         | Refetch plan then rerun analysis after plan/portion/recipe/nutrition/profile/rule changes (READY Phase 18) |
| `MEAL_ANALYSIS_ITEM_UNFILLED`                 | Exclude unfilled slots or add a meal first (READY Phase 18) |
| `MEAL_ANALYSIS_SOURCE_MISSING`                | Refetch the plan; the selected item no longer has a usable source (READY Phase 18) |
| `MEAL_PLAN_HARD_CONSTRAINT_VIOLATION`         | Do not confirm manual-add; show backend hard diet/allergy/exclusion/tradition reasons (READY Phase 18) |
| `MEAL_PROGRAM_VERSION_CONFLICT`               | Refetch chương trình nhiều tuần trước khi edit/regenerate (planned Phase 19) |
| `PANTRY_VERSION_CONFLICT`                     | Refetch inventory và cho user áp dụng lại adjustment (planned Phase 20) |
| `RECOGNITION_NEEDS_CONFIRMATION`              | Mở candidate editor; không cập nhật pantry tự động (planned Phase 21)   |
| `RECOGNITION_PROVIDER_UNAVAILABLE`            | Giữ ảnh/job để retry hoặc cho nhập pantry thủ công (planned Phase 21)   |
| `RECEIPT_NEEDS_CONFIRMATION`                  | Mở receipt candidate editor; không cập nhật pantry tự động (planned Phase 22) |
| `SHOPPING_UNIT_UNRESOLVED`                    | Hiển thị dòng riêng và conversion assumption/unknown (planned Phase 22) |
| `AI_ARTIFACT_VERSION_CONFLICT`                | Refetch artifact/version trước khi share/verify (planned Phase 23)      |
| `SELF_VERIFICATION_FORBIDDEN`                 | Không cho Contributor tự verify artifact của mình (planned Phase 23)   |

---

## 9. Mocking policy

- Mock chỉ dùng cho component development khi endpoint còn `PLANNED/IN_PROGRESS`.
- Mock payload phải bám draft OpenAPI và đặt trong `features/<domain>/__fixtures__`.
- Không để mock fallback âm thầm chạy trong production build.
- Khi endpoint chuyển `READY`, integration task phải xóa hoặc cô lập mock bằng test-only boundary.
- UI mock của food data, nutrition estimate, quota, custom meal, compatibility, multi-week, pantry, CV, receipt hoặc STT không được đánh dấu feature hoàn thành.

---

## 10. Backend change protocol

Mỗi backend change ảnh hưởng frontend phải thực hiện trong cùng change set:

1. Cập nhật route/schema OpenAPI.
2. Cập nhật migration/seed nếu data contract đổi.
3. Cập nhật status và ghi chú endpoint ở mục 6.
4. Cập nhật business error ở mục 8 nếu thêm code mới.
5. Thêm entry vào changelog mục 11 nếu breaking hoặc behavior thay đổi.
6. Cập nhật completion record của phase tương ứng khi toàn bộ gate đã pass.
7. Chạy backend lint/typecheck/build và xuất `/api-docs.json` thành công.
8. Ghi rõ frontend action cần làm trong PR summary.

Không được mô tả endpoint là READY chỉ vì route đã tồn tại nếu authorization, schema hoặc backend gate chưa hoàn chỉnh.

### Backend PR checklist

```text
[ ] OpenAPI updated
[ ] BACKEND_INTEGRATION.md status updated
[ ] Request/response/error examples updated
[ ] Migration/seed updated if needed
[ ] Authorization and ownership implementation reviewed
[ ] Breaking change documented
[ ] Frontend migration note included
```

### Frontend integration checklist

```text
[ ] Synced Swagger/API catalog
[ ] Endpoint constant added
[ ] Request/response DTO added
[ ] UI Model and Mapper added
[ ] Mapper test added
[ ] Query key/API hook added
[ ] Loading/error/empty/success handled
[ ] Business error codes handled
[ ] FE integrated column changed to Yes with date/PR reference
```

---

## 11. Integration changelog

Thêm entry mới nhất ở trên cùng.

| Date       | Version | Module         | Change                                                                                                                                | Breaking | FE action                                                                                            |
| ---------- | ------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------- | :------: | ---------------------------------------------------------------------------------------------------- |
| 2026-09-23 | 4.5     | Meal Analysis  | Phase 18 READY: versioned analysis for recipe/custom-meal portions, cooking-aware daily nutrients, ingredient guidelines and SAME_DISH/SAME_MEAL/SAME_DAY interactions; duplicate suppression, provenance/applicability/confidence/incomplete notes, stale fingerprints, plus hard-safe manual-add and refreshed generate/swap responses. | No | Run `npm run sync:swagger`; add DTO/Model/Mapper/query for analysis and render backend warning fields without promoting advisory evidence to a frontend prohibition. |
| 2026-09-21 | 4.4     | Video Review   | Phase 16 READY: mọi content dùng draft → explicit submit → Admin approve/reject-with-reason; approved edit giữ revision cũ public; uploaded video bắt buộc Phase 15 committed owned asset, external YouTube không tính quota; moderation chỉ ghi signal; thêm author history và Admin queue/detail/decision. Legacy `/review-queue/posts*` chuyển `DEPRECATED` và Admin-only. | Yes | Run `npm run sync:swagger`; migrate create/edit UI khỏi role-based auto-publish, thêm submit/status/history và dùng `/admin/content-review*`. |
| 2026-09-19 | 4.3     | Contributors   | Phase 14 source/migration/OpenAPI implemented: removed subtype fields/RBAC, added typed approval basis, immutable organization/platform/invitation evidence, Admin invitation, manual approve/reject, audited revoke, conservative legacy migration, stale-session revocation. Existing consumed endpoints remain `CHANGING`; new endpoints remain `IN_PROGRESS` because `npm run build` is blocked by Windows Prisma DLL `EPERM`. | Yes | Run `npm run sync:swagger`; replace subtype DTO/model/forms/mappers/tests and UI/RBAC branches with unified role/profile contract after backend build gate passes; integrate invitation/revoke when scheduled. |
| 2026-09-19 | 4.2     | Recipe Nutrition | Phase 13 implemented in source/OpenAPI: structured recipe steps on recipe revisions plus cooking-aware preview/recalculate/current/history/status endpoints; deterministic calculation uses unit conversion, edible portion, reviewed yield/retention factors, provenance, confidence, uncertainty and uncovered ingredients; AI fallback is provider-adapter only and labeled. Runtime status remains `IN_PROGRESS` until the blocked `npm run build` gate completes. | No | Do not integrate until status returns to `READY`; then sync OpenAPI and add `features/recipe-nutrition` DTO/Model/Mapper/query with partial coverage/stale/provider fallback handling. |
| 2026-09-19 | 4.1     | Food Data      | Phase 12 READY: canonical profiles/nutrients/conversions, intake/guidelines, cooking factors, interaction rules, typed Admin CRUD, staged AI suggestions và provider-neutral idempotent imports. | No | Sync OpenAPI; thêm DTO/Model/Mapper/query cho các read endpoint và màn quản trị khi được ưu tiên. Missing nutrient không render thành 0. |
| 2026-09-19 | 4.1 | Storage Phase 15 | Schema+migration (`20260919170000_storage_quota_accounting`), StoragePolicy/Account/Reservation/MediaAsset/StorageAdjustment models; reservation->commit->release flow; expiry cleanup; reconciliation; existing-media backfill; `/uploads/signature` REMOVED and replaced by reservation flow; 9 new READY endpoints (`GET /storage/me`, `POST /uploads/reservations`, `POST /uploads/reservations/:id/commit`, `DELETE /uploads/reservations/:id`, `DELETE /storage/assets/:id`, `GET /admin/storage/accounts`, `GET /admin/storage/policies`, `PATCH /admin/storage/policies/:id`, `POST /admin/storage/accounts/:userId/adjustments`, `GET /admin/storage/adjustments`); error codes `STORAGE_QUOTA_EXCEEDED`, `UPLOAD_RESERVATION_EXPIRED`, `UPLOAD_IDEMPOTENCY_CONFLICT`, `UPLOAD_RESERVATION_CONFLICT`, `UPLOAD_PROVIDER_MISMATCH`, `MEDIA_ASSET_IN_USE`, `MEDIA_DELETE_IDEMPOTENCY_CONFLICT`, `STORAGE_POLICY_CONFLICT`, `STORAGE_ADJUSTMENT_IDEMPOTENCY_CONFLICT`, `STORAGE_ADJUSTMENT_INVALID` now READY. Default quota: 1 GiB per user. Reservation TTL: 900 s. | No | Run `npm run sync:swagger`; integrate reservation->commit flow for Cloudinary uploads; add `GET /storage/me` usage widget |
| 2026-09-18 | 4.0     | Product plan   | Đồng bộ canonical SRS và backend Phases 12–27: food data, cooking-aware nutrition, unified Contributor, quota/video review, custom meals/tags, meal analysis/programs, pantry, fridge, receipt, AI artifacts, maps, notifications và governance. Contract runtime hiện tại không đổi; Contributor Phase 14 được ghi là breaking migration tương lai. | Future Phase 14 | Chưa đổi consumer live; chỉ sync/migrate khi từng endpoint chuyển READY/CHANGING theo OpenAPI |
| 2026-09-17 | 3.8     | AI Governance  | FE scaffold 5 ops AI governance theo spec 017 (DTO suy luận + reconfirm ở task nối live/Mapper/test redaction/fixtures 0 nội dung thô/API fixture 0 request/Query/tab dashboard tổng quan + log che mờ + cờ + công tắc); endpoint giữ `PLANNED`, `FE integrated` giữ `No` |    No    | Test tay AG-1..AG-3 + check Network 0 request + quét DOM 0 nội dung thô theo `specs/017-ai-governance/quickstart.md`; nối live khi BE đánh `READY` |
| 2026-09-17 | 3.7     | Restaurants    | FE scaffold 7 ops restaurants/location theo spec 016 (DTO suy luận + reconfirm ở task nối live/Mapper/test haversine/fixtures/API fixture 0 request + 0 maps/Query/viết lại 2 routes + tab dashboard, khung bản đồ CSS không SDK); endpoint giữ `PLANNED`, `FE integrated` giữ `No` |    No    | Test tay RT-1..RT-4 + check Network 0 request/maps theo `specs/016-restaurants-location/quickstart.md`; nối live (SDK maps/key) khi BE đánh `READY` |
| 2026-09-17 | 3.6     | Trust Safety   | FE kết nối live API thực tế cho 2 endpoint (`POST /reports` gửi báo cáo vi phạm, `DELETE /users/me/behavior-history` xóa lịch sử hành vi cá nhân hóa), bỏ mock fixture |    No    | Test tay TS-1..TS-3 với dữ liệu thật và tài khoản Member seed |
| 2026-09-17 | 3.5     | Notifications  | FE scaffold 3 ops notifications theo spec 015 (DTO suy luận + reconfirm ở task nối live/Mapper/test/fixtures/API fixture 0 request/Query polling 60s + lạc quan rollback/chuông + panel + item ở header); endpoint giữ `PLANNED`, `FE integrated` giữ `No` |    No    | Test tay NT-1..NT-3 + check Network 0 request (member + khách) theo `specs/015-notifications/quickstart.md`; nối live khi BE đánh `READY` |
| 2026-09-17 | 3.4     | Contributors   | FE kết nối live API thực tế cho 4 endpoints contributor (nộp đơn, xem đơn cá nhân, hàng chờ duyệt admin, review phê duyệt/từ chối), bỏ mock data |    No    | Test tay CA-1..CA-4 với dữ liệu thật và tài khoản Member/Admin seed |
| 2026-09-17 | 3.3     | Chat Sharing   | FE scaffold 3 ops chat share/public/verify theo spec 014 (DTO suy luận + reconfirm ở task nối live/Mapper/test/fixtures/API fixture 0 request/Query/route `/assistant/public` + huy hiệu theo role thật); endpoint giữ `PLANNED`, `FE integrated` giữ `No` |    No    | Test tay CS-1..CS-4 + check Network 0 request theo `specs/014-chat-sharing-verification/quickstart.md`; nối live khi BE đánh `READY` |
| 2026-09-17 | 3.2     | Trust Safety   | FE scaffold 2 endpoint còn sót (`POST /reports`, `DELETE behavior-history`) theo spec 013 (DTO đủ/Mapper/test/fixtures/API fixture 0 request/Query/nút shared + dialogs, thay toast giả privacy); endpoint giữ `PLANNED`, `FE integrated` giữ `No` |    No    | Test tay TS-1..TS-3 + check Network 0 request + grep 0 toast giả theo `specs/013-trust-safety-leftovers/quickstart.md`; nối live khi BE đánh `READY` |
| 2026-09-16 | 3.1     | Contributors   | FE scaffold live-shape 4 ops contributors theo spec 012 (DTO đủ/oneOf review/Mapper/test/fixtures/API fixture 0 request/Query/tab profile + tab dashboard, không cấp quyền theo requestedType, không đụng auth); endpoint giữ `PLANNED`, `FE integrated` giữ `No` |    No    | Test tay CA-1..CA-4 + check Network 0 request theo `specs/012-contributor-applications/quickstart.md`; nối live khi BE đánh `READY` |
| 2026-09-16 | 3.0     | Moderation Admin | FE scaffold live-shape 6 ops moderation-admin theo spec 011 (DTO đủ/Mapper/test/fixtures/API fixture 0 request/Query/3 tabs dashboard); endpoint giữ `PLANNED`, `FE integrated` giữ `No` — ngày nối live chỉ sửa thân api |    No    | Test tay MA-1..MA-4 + check Network 0 request theo `specs/011-moderation-admin-integration/quickstart.md`; nối live khi BE đánh `READY` |
| 2026-09-16 | 2.9     | Community      | FE scaffold live-shape 11 ops community theo spec 010 (DTO đủ/Mapper/test/fixtures/API fixture 0 request/Query/components); endpoint giữ `PLANNED`, `FE integrated` giữ `No` — ngày nối live chỉ sửa thân api |    No    | Test tay CM-1..CM-4 + check Network 0 request theo `specs/010-community-integration/quickstart.md`; nối live khi BE đánh `READY` |
| 2026-09-16 | 2.8     | Recommendations | FE tích hợp home/consent/behavior-events theo spec 009 (khối home member, switch consent thật, hook event fire-and-forget + 4 điểm chạm); verify live (PUT off → cold-start + chặn event, restore on; bổ sung 2 dòng personalization vào registry) |    No    | Test tay RC-1..RC-5 theo `specs/009-recommendations-integration/quickstart.md` (2 tài khoản seed khác khẩu vị) |
| 2026-09-16 | 2.7     | AI Chat        | FE tích hợp 5 endpoint chat private (sessions/history/SSE stream/feedback) theo spec 008; verify live với BE `:4000` (guest cookie `chatGuest`, SSE đủ 5 events, quota `resetAt`, feedback upsert); sharing/verification vẫn `PLANNED` ngoài phạm vi |    No    | Test tay trình duyệt AC-1..AC-6 theo `specs/008-ai-chat-integration/quickstart.md` (khách ẩn danh + member seed) |
| 2026-09-16 | 2.6     | Meal Planner   | FE tích hợp 5 endpoint meal-plans (generate/list/detail/swap/delete) theo spec 007; verify live với BE `:4000` (generate 21/21, swap theo `lockVersion`, delete idempotent; shape thật `canonicalName/amount`, slot-level calories) |    No    | Test tay trình duyệt MP-1..MP-6 theo `specs/007-meal-planner-integration/quickstart.md` |
| 2026-09-16 | 2.5     | Review Queue   | FE nối `GET /review-queue/posts` + approve/reject (reason bắt buộc, cấm self-approve) theo code BE local; endpoint vẫn `PLANNED`      |    No    | Test tay theo `specs/006-content-review-queue/quickstart.md`; chờ BE đánh `READY` chính thức          |
| 2026-09-16 | 2.2     | AI baseline    | Chốt OpenAI Responses API, `gpt-5.6-terra` cho chat và `omni-moderation-latest`; endpoint vẫn PLANNED                                 |    No    | Không gọi OpenAI từ browser; chờ backend SSE contract Phase 11                                       |
| 2026-09-16 | 2.1     | Meal Planner   | Thêm weekly generate/version/regenerate, per-day hard filters, calorie/repeat fallback, safe swap, shopping list và nutrition quality |    No    | Sync OpenAPI; tạo DTO/Model/Mapper/hooks cho 21 slots, warnings, optimistic version và shopping list |
| 2026-09-16 | 2.0     | Recommendation | Thêm consent/version, behavior event allowlist/idempotency/dedupe, hard-filtered scoring v1, cold start và reason codes               |    No    | Sync OpenAPI; tạo consent/event/recommendation DTO, mapper, hooks và xử lý sáu business errors       |
| 2026-09-16 | 1.9     | Moderation     | Thêm rule flags v1, transactional post review, report escalation, Admin decisions, selective ban/unban và audit trail                 |    No    | Sync OpenAPI; map queue/report/user/comment DTO, reason codes và xử lý conflict/state boundary       |
| 2026-09-15 | 1.8     | Contributors   | Hoàn thiện shared application state machine, own/Admin list-review, approved subtype profile, cooldown và stale-session protection    |    No    | Sync OpenAPI; map profile/application DTO và buộc đăng nhập lại khi STALE_ACCESS_TOKEN               |
| 2026-09-15 | 1.7     | Community      | Thêm comment thread một tầng, idempotent vote/bookmark, Recipe rating aggregate, community summary và current-user bookmark list      |    No    | Sync OpenAPI; tạo DTO/Model/Mapper/query hooks và xử lý placeholder/rate limit                       |
| 2026-09-15 | 1.6     | Search         | Mở rộng GET posts với normalized ranking/filter an toàn và thêm related content theo ba type                                          |    No    | Sync OpenAPI; map search meta/filters và ba list related, không tự nới appliedConstraints            |
| 2026-09-15 | 1.5     | Content        | Thêm Recipe/Blog/Video revision CRUD, structured recipe constraints, soft-delete/version conflict và signed Cloudinary upload         |    No    | Sync OpenAPI; tạo DTO/Model/Mapper theo post type, upload trực tiếp và xử lý revision conflict       |
| 2026-09-15 | 1.4     | Catalog        | Thêm category tree, canonical ingredient, alias resolution và metadata allergen/diet/tradition; exclusion nhận optional ingredientId  |    No    | Sync OpenAPI; tạo DTO/Model/Mapper cho category và ingredient, xử lý AMBIGUOUS                       |
| 2026-09-15 | 1.3     | Profile/Diet   | Thêm profile, BMI/BMR/TDEE, rule preview v1, preference/effective constraints và PERIODIC dates                                       |    No    | Sync OpenAPI; tạo DTO/Model/Mapper riêng cho profile và diet flow                                    |
| 2026-09-15 | 1.2     | Auth           | Hoàn tất register/login/refresh rotation/logout, RBAC primitives và `/users/me`                                                       |    No    | Sync OpenAPI; tích hợp proxy/cookie với `withCredentials=true`                                       |
| 2026-09-15 | 1.1     | Foundation     | Hoàn tất health, Swagger UI và OpenAPI JSON; thêm request ID và error envelope nền tảng                                               |    No    | Dùng catalog OpenAPI đã sync; chưa cần tạo consumer UI cho health                                    |
| 2026-09-15 | 1.0     | All            | Tạo integration registry; backend chưa triển khai                                                                                     |    No    | Không tích hợp API thật cho tới khi status READY                                                     |

Template:

```text
| YYYY-MM-DD | x.y | Module | Mô tả contract/behavior đổi | Yes/No | Việc frontend phải làm |
```

---

## 12. Integration Definition of Done

Một frontend/backend capability chỉ được xem là tích hợp xong khi:

- Endpoint có status `READY`.
- OpenAPI sync thành công.
- Frontend dùng endpoint constant, DTO, Model và Mapper.
- Không có `any` hoặc component dùng raw DTO.
- Auth/ownership error được xử lý.
- Loading/error/empty/success UI đầy đủ.
- Backend gates và frontend checks liên quan pass.
- Ma trận mục 6 ghi `FE integrated = Yes` kèm ngày hoặc PR/commit reference.
- Changelog được cập nhật nếu behavior hoặc contract thay đổi.

### 6.12 Custom Meals — Phase 17

| Method | Endpoint | Status | FE integrated | FE integrated date | Notes |
|--------|----------|--------|---------------|--------------------|-------|
| GET | /api/v1/custom-meals | READY | No | — | Owner-scoped paginated list; optional ?tag= filter |
| POST | /api/v1/custom-meals | READY | No | — | Create private custom meal with ingredients and tags |
| GET | /api/v1/custom-meals/{id} | READY | No | — | Detail with ingredients, photos, tags |
| PATCH | /api/v1/custom-meals/{id} | READY | No | — | Partial update; replaces entire ingredients/tags lists if provided |
| DELETE | /api/v1/custom-meals/{id} | READY | No | — | Soft-delete; 409 CUSTOM_MEAL_IN_USE if BLOCK policy and plan references exist |
| POST | /api/v1/custom-meals/{id}/photos | READY | No | — | Attach existing MediaAsset (COVER_IMAGE); max 10 per meal |
| DELETE | /api/v1/custom-meals/{id}/photos/{assetId} | READY | No | — | Detach photo; asset deletion handled via storage module |
| PUT | /api/v1/custom-meals/{id}/photos/order | READY | No | — | Reorder photos by orderedAssetIds array |

**Business rules (backend-enforced):**
- All endpoints require authentication; owner-scoped (no cross-user access).
- deletePolicy=BLOCK (default): DELETE returns 409 if meal is referenced by any MealPlanItem with RETAIN_SNAPSHOT not set.
- deletePolicy=RETAIN_SNAPSHOT: allows delete; plan items retain the snapshot on customMealSnapshot JSON field.
- Asset attached as photo must be owned by the same user and of COVER_IMAGE kind.
- Deleting a MediaAsset used as a custom meal photo is blocked (409 ASSET_IN_USE) by storage module.
- MealPlanItem now has sourceType (RECIPE|CUSTOM_MEAL) and customMealId; existing rows default to RECIPE.

**Error codes:**
| Code | HTTP | Description |
|------|------|-------------|
| CUSTOM_MEAL_NOT_FOUND | 404 | Meal does not exist or is not owned by the requester |
| CUSTOM_MEAL_IN_USE | 409 | BLOCK policy delete rejected because meal is referenced by a plan item |
| CUSTOM_MEAL_PHOTO_LIMIT | 422 | Meal already has 10 photos |
| ASSET_NOT_FOUND_OR_INELIGIBLE | 422 | Asset is not COVER_IMAGE, not owned by user, or not ACTIVE |
