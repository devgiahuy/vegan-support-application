# Frontend ↔ Backend Integration Guide

**Version:** 2.3

**Cập nhật:** 16/09/2026

**Backend implementation status:** `IN_PROGRESS`

**Contract target:** `/api/v1`

> Tài liệu này là registry sống cho những capability backend đã sẵn sàng để frontend tích hợp. Foundation, Authentication & Sessions, Profile/Health, Diet Rules, Catalog, Content Core, Content Discovery, Community Interactions, Contributor Applications, Moderation & Reports, Behavioral Recommendation, Meal Planner và AI Chat Gateway đã hoàn tất; các feature còn lại giữ `PLANNED` cho tới khi phase tương ứng vượt qua đầy đủ completion gate.

---

## 1. Source of truth và status

Thứ tự ưu tiên khi tài liệu khác nhau:

1. OpenAPI được backend phục vụ tại `/api-docs.json` — contract kỹ thuật thực thi được.
2. File này — trạng thái triển khai, hướng dẫn tích hợp và ngoại lệ frontend.
3. `/docs/IMPLEMENTATION_PLAN.md` — business rules, scope và sequencing.
4. `/backend/docs/IMPLEMENTATION_PHASES.md` — phase dependency, completion record và prompt triển khai.
5. `/docs/SRS.md` — product requirements sau khi được hợp nhất.

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
| Meal Plans                       | `features/meal-plan`                                           | `/meal-plans`, `/meal-plans/saved`                                     |
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
| POST   | `/auth/register`             | `READY`   | 2026-09-15      | Yes (2026-09-15) | Optional `contributorRequest` chỉ tạo application `PENDING`; account/JWT vẫn là `MEMBER`; FE: `features/auth` register + session + contributor form       |
| POST   | `/auth/login`                | `READY`   | 2026-09-15      | Yes (2026-09-15) | Trả access token và đặt access/refresh HttpOnly cookies; generic invalid-credential response; FE: login form xử lý theo `error.code`                      |
| POST   | `/auth/refresh`              | `READY`   | 2026-09-15      | Yes (2026-09-15) | Đọc refresh cookie, rotation mỗi lần dùng; reuse revoke toàn token family; FE: Next proxy `/api/auth/refresh-token` + refresh-queue                       |
| POST   | `/auth/logout`               | `READY`   | 2026-09-15      | Yes (2026-09-15) | Idempotent; body `{ allDevices?: boolean }`; revoke phiên hiện tại hoặc toàn bộ phiên của user; FE: Next proxy + xóa 4 cookie                             |
| GET    | `/users/me`                  | `READY`   | 2026-09-15      | Yes (2026-09-15) | Trả profile, health `MANUAL`, diet snapshot/effective constraints; không lộ hash/session; FE auth chỉ map 8 field user, health/diet để `features/profile` |
| PATCH  | `/users/me`                  | `READY`   | 2026-09-15      | Yes (2026-09-15) | Cập nhật `displayName`/HTTP(S) `avatarUrl`; cần ít nhất một field                                                                                         |
| PUT    | `/users/me/health-profile`   | `READY`   | 2026-09-15      | Yes (2026-09-15) | Upsert manual inputs; backend tính BMI, Mifflin–St Jeor BMR và activity-factor TDEE                                                                       |
| POST   | `/diet-rules/preview`        | `READY`   | 2026-09-15      | Yes (2026-09-15) | Auth required; trả rule set v1, source/default/hard flag; tradition rule là configurable                                                                  |
| PUT    | `/users/me/diet-preferences` | `READY`   | 2026-09-15      | Yes (2026-09-15) | Exclusion nhận optional canonical `ingredientId`; free-text vẫn hỗ trợ; allergy/exclusion luôn hard                                                       |
| PUT    | `/users/me/diet-schedule`    | `READY`   | 2026-09-15      | Yes (2026-09-15) | Replace lịch PERIODIC bằng `YYYY-MM-DD`, semantic `Asia/Ho_Chi_Minh`, PostgreSQL `DATE`                                                                   |
| DELETE | `/users/me/behavior-history` | `PLANNED` | —               | No               | Reset personalization                                                                                                                                     |

### 6.3 Content và Community

| Method | Path                  | Status    | Backend updated | FE integrated | Ghi chú                        |
| ------ | --------------------- | --------- | --------------- | ------------- | ------------------------------ |
| GET    | `/posts`              | `PLANNED` | —               | No            | Search/filter/pagination       |
| POST   | `/posts`              | `PLANNED` | —               | No            | Role-based publish state       |
| GET    | `/posts/:idOrSlug`    | `PLANNED` | —               | No            | Published revision cho public  |
| PATCH  | `/posts/:id`          | `PLANNED` | —               | No            | Tạo revision theo role         |
| DELETE | `/posts/:id`          | `PLANNED` | —               | No            | Soft-delete owner/admin rules  |
| GET    | `/posts/:id/related`  | `PLANNED` | —               | No            | Trả recipes/blogs/videos riêng |
| POST   | `/uploads/signature`  | `PLANNED` | —               | No            | Cloudinary signed upload       |
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
| POST   | `/contributor-applications`                  | `PLANNED` | —               | No                    | Member upgrade; không có certificate MVP                                           |
| GET    | `/admin/contributor-applications`            | `PLANNED` | —               | No                    | Admin only                                                                         |
| PATCH  | `/admin/contributor-applications/:id/review` | `PLANNED` | —               | No                    | Approve/reject + type + basis                                                      |
| GET    | `/review-queue/posts`                        | `PLANNED` | —               | Yes (2026-09-16, chờ READY chính thức) | Contributor/Admin filtering; FE: `features/review` list + filter + pagination |
| PATCH  | `/review-queue/posts/:id/approve`            | `PLANNED` | —               | Yes (2026-09-16, chờ READY chính thức) | Cấm self-approve; FE: dialog reason bắt buộc + chặn tự duyệt 2 lớp              |
| PATCH  | `/review-queue/posts/:id/reject`             | `PLANNED` | —               | Yes (2026-09-16, chờ READY chính thức) | Reason required; FE: chung dialog + toast lý do cho tác giả                     |
| POST   | `/reports`                                   | `PLANNED` | —               | No                    | One active report/user/target                                                      |
| GET    | `/admin/reports`                             | `PLANNED` | —               | No                    | Admin only                                                                         |
| PATCH  | `/admin/reports/:id/resolve`                 | `PLANNED` | —               | No                    | Audit required                                                                     |
| GET    | `/admin/users`                               | `PLANNED` | —               | No                    | Search/filter/pagination                                                           |
| PATCH  | `/admin/users/:id/status`                    | `PLANNED` | —               | No                    | Lock/ban/unban/delete rules                                                        |
| GET    | `/admin/comments`                            | `PLANNED` | —               | No                    | Moderation list                                                                    |
| PATCH  | `/admin/comments/:id/status`                 | `PLANNED` | —               | No                    | Hide/restore                                                                       |
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
| POST   | `/meal-plans/generate`               | `READY` | 2026-09-16      | No            | Auth; tạo version mới 7×3, deterministic seed + idempotency               |
| GET    | `/meal-plans`                        | `READY` | 2026-09-16      | No            | Auth; own plans, pagination/filter tuần                                   |
| GET    | `/meal-plans/:id`                    | `READY` | 2026-09-16      | No            | Auth + ownership; 21 slots, snapshots, warnings và shopping list          |
| PATCH  | `/meal-plans/:id/items/:itemId/swap` | `READY` | 2026-09-16      | No            | Auth + ownership; expectedVersion/idempotency; hard-safe candidate        |
| DELETE | `/meal-plans/:id`                    | `READY` | 2026-09-16      | No            | Auth + ownership; idempotent soft-delete với expectedVersion              |
| POST   | `/behavior-events`                   | `READY` | 2026-09-16      | No            | Auth + active consent; allowlist metadata, idempotency và 5-minute dedupe |
| GET    | `/recommendations/home`              | `READY` | 2026-09-16      | No            | Auth; hard constraints trước ranking; score/reason codes v1               |

### 6.6 Chat và AI verification

> Provider decision: live AI dùng OpenAI Responses API; chat mặc định `gpt-5.6-terra`, moderation
> dùng `omni-moderation-latest`. Frontend chỉ gọi backend SSE contract, không gọi OpenAI trực tiếp và
> không phụ thuộc provider event shape. Năm endpoint private chat đã `READY`; public sharing và expert
> verification vẫn `PLANNED` cho Phase 12.

| Method | Path                              | Status    | Backend updated | FE integrated | Ghi chú                                      |
| ------ | --------------------------------- | --------- | --------------- | ------------- | -------------------------------------------- |
| POST   | `/chat/sessions`                  | `READY`   | 2026-09-16      | No            | Guest signed cookie hoặc authenticated       |
| GET    | `/chat/sessions`                  | `READY`   | 2026-09-16      | No            | Authenticated private history                |
| GET    | `/chat/sessions/:id/messages`     | `READY`   | 2026-09-16      | No            | Auth/guest ownership; guest retention 7 ngày |
| POST   | `/chat/sessions/:id/messages`     | `READY`   | 2026-09-16      | No            | SSE, idempotency, quota, fallback            |
| POST   | `/chat/messages/:id/feedback`     | `READY`   | 2026-09-16      | No            | Owned assistant message; upsert up/down      |
| PATCH  | `/chat/messages/:id/share`        | `PLANNED` | —               | No            | Authenticated only                           |
| GET    | `/chat/public`                    | `PLANNED` | —               | No            | Public shared answers                        |
| POST   | `/chat/messages/:id/verification` | `PLANNED` | —               | No            | Approved Nutrition Expert/Admin              |

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

---

## 7. Luồng tích hợp đặc biệt

### 7.1 Register có Contributor request

Request dự kiến:

```json
{
  "email": "user@example.com",
  "password": "...",
  "displayName": "...",
  "contributorRequest": {
    "requestedType": "NUTRITION_EXPERT",
    "experience": "...",
    "referenceLinks": []
  }
}
```

Response user luôn có:

```json
{
  "role": "MEMBER",
  "contributorApplication": {
    "status": "PENDING",
    "requestedType": "NUTRITION_EXPERT"
  }
}
```

Frontend tuyệt đối không mở contributor routes dựa trên `requestedType`. Chỉ dùng `user.role` và approved contributor profile từ `/users/me`.

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

### 7.10 Meal Planner

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

### 7.11 Maps
- Dedupe rapid repeated views ở client để giảm noise; backend vẫn là nơi quyết định dedupe chính thức.
- Recommendation UI render `reasonCodes`, không tự đọc raw behavior history.

### 7.6 Maps

- Browser lấy geolocation sau thao tác/consent rõ ràng.
- Từ chối permission phải chuyển sang form địa chỉ.
- Map và list dùng cùng một result set/backend IDs.
- Không gọi Places web service bằng backend key từ browser.
- Khi `externalDataUnavailable=true`, UI vẫn hiển thị list nội bộ và thông báo nhẹ, không block màn hình.

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
| `CONTRIBUTOR_TYPE_UNCHANGED`                  | Yêu cầu chọn subtype khác profile Contributor hiện tại                 |
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

---

## 9. Mocking policy

- Mock chỉ dùng cho component development khi endpoint còn `PLANNED/IN_PROGRESS`.
- Mock payload phải bám draft OpenAPI và đặt trong `features/<domain>/__fixtures__`.
- Không để mock fallback âm thầm chạy trong production build.
- Khi endpoint chuyển `READY`, integration task phải xóa hoặc cô lập mock bằng test-only boundary.
- UI mock của CV/STT không được đánh dấu feature hoàn thành.

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
