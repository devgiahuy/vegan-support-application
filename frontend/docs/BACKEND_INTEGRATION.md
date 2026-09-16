# Frontend ↔ Backend Integration Guide

**Version:** 1.9

**Cập nhật:** 16/09/2026

**Backend implementation status:** `IN_PROGRESS`

**Contract target:** `/api/v1`

> Tài liệu này là registry sống cho những capability backend đã sẵn sàng để frontend tích hợp. Foundation, Authentication & Sessions, Profile/Health, Diet Rules, Catalog, Content Core, Content Discovery, Community Interactions, Contributor Applications và Moderation & Reports đã hoàn tất; các feature còn lại giữ `PLANNED` cho tới khi phase tương ứng vượt qua đầy đủ completion gate.

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

| Backend tag/module               | Frontend feature đề xuất                                       |
| -------------------------------- | -------------------------------------------------------------- |
| Auth                             | `features/auth`                                                |
| Users/Profile                    | `features/profile`                                             |
| Diet Rules                       | `features/diet-preferences`                                    |
| Posts/Recipes/Videos             | `features/content` hoặc tách `recipe`, `blog`, `video` nếu lớn |
| Comments/Votes/Ratings/Bookmarks | `features/community`                                           |
| Contributors                     | `features/contributor`                                         |
| Moderation/Admin Users           | `features/admin`                                               |
| Categories                       | `features/category`                                            |
| Ingredients                      | `features/ingredient`                                          |
| Meal Plans                       | `features/meal-plan`                                           |
| Recommendations/Behavior         | `features/recommendation`                                      |
| Chat                             | `features/chat`                                                |
| Restaurants/Location             | `features/restaurant`                                          |
| AI Governance                    | `features/admin-ai`                                            |
| Notifications                    | `features/notification`                                        |

Feature không import trực tiếp lẫn nhau. Shared enum hoặc presentation model dùng chung phải được nâng lên `src/common` hoặc `src/types` sau khi review.

---

## 6. Backend capability registry

### 6.1 Foundation

| Method | Path             | Status  | Backend updated | FE integrated | Ghi chú                                                                |
| ------ | ---------------- | ------- | --------------- | ------------- | ---------------------------------------------------------------------- |
| GET    | `/health`        | `READY` | 2026-09-15      | No            | Public; kiểm tra API/PostgreSQL, trả request ID; 503 khi database down |
| GET    | `/api-docs.json` | `READY` | 2026-09-15      | No            | Public OpenAPI 3.1 source; catalog frontend đã sync                    |

### 6.2 Auth và Profile

| Method | Path                         | Status    | Backend updated | FE integrated | Ghi chú                                                                                             |
| ------ | ---------------------------- | --------- | --------------- | ------------- | --------------------------------------------------------------------------------------------------- |
| POST   | `/auth/register`             | `READY`   | 2026-09-15      | No            | Optional `contributorRequest` chỉ tạo application `PENDING`; account/JWT vẫn là `MEMBER`            |
| POST   | `/auth/login`                | `READY`   | 2026-09-15      | No            | Trả access token/cookies và approved `contributorProfile`; generic invalid-credential response      |
| POST   | `/auth/refresh`              | `READY`   | 2026-09-15      | No            | Đọc refresh cookie, rotation mỗi lần dùng; reuse revoke toàn token family                           |
| POST   | `/auth/logout`               | `READY`   | 2026-09-15      | No            | Idempotent; body `{ allDevices?: boolean }`; revoke phiên hiện tại hoặc toàn bộ phiên của user      |
| GET    | `/users/me`                  | `READY`   | 2026-09-15      | No            | Trả profile, approved Contributor subtype/label, health `MANUAL`, diet/effective constraints        |
| PATCH  | `/users/me`                  | `READY`   | 2026-09-15      | No            | Cập nhật `displayName`/HTTP(S) `avatarUrl`; cần ít nhất một field                                   |
| PUT    | `/users/me/health-profile`   | `READY`   | 2026-09-15      | No            | Upsert manual inputs; backend tính BMI, Mifflin–St Jeor BMR và activity-factor TDEE                 |
| POST   | `/diet-rules/preview`        | `READY`   | 2026-09-15      | No            | Auth required; trả rule set v1, source/default/hard flag; tradition rule là configurable            |
| PUT    | `/users/me/diet-preferences` | `READY`   | 2026-09-15      | No            | Exclusion nhận optional canonical `ingredientId`; free-text vẫn hỗ trợ; allergy/exclusion luôn hard |
| PUT    | `/users/me/diet-schedule`    | `READY`   | 2026-09-15      | No            | Replace lịch PERIODIC bằng `YYYY-MM-DD`, semantic `Asia/Ho_Chi_Minh`, PostgreSQL `DATE`             |
| DELETE | `/users/me/behavior-history` | `PLANNED` | —               | No            | Reset personalization                                                                               |

### 6.3 Content và Community

| Method | Path                           | Status  | Backend updated | FE integrated | Ghi chú                                                                                                       |
| ------ | ------------------------------ | ------- | --------------- | ------------- | ------------------------------------------------------------------------------------------------------------- |
| GET    | `/posts`                       | `READY` | 2026-09-15      | No            | Search v1 không dấu; q/type/category/cook-time/difficulty/diet/ingredient filters; auth profile constraints   |
| POST   | `/posts`                       | `READY` | 2026-09-16      | No            | Member pending; approved Contributor/Admin auto-publish nếu rule moderation không flag; high risk quarantine  |
| GET    | `/posts/:idOrSlug`             | `READY` | 2026-09-15      | No            | Public thấy published revision; owner/Admin thấy latest revision                                              |
| PATCH  | `/posts/:id`                   | `READY` | 2026-09-16      | No            | Owner/Admin; full revision + expectedVersion; published revision cũ giữ visible trong lúc review revision mới |
| DELETE | `/posts/:id`                   | `READY` | 2026-09-15      | No            | Owner/Admin soft-delete; query `expectedVersion`; idempotent                                                  |
| GET    | `/posts/:id/related`           | `READY` | 2026-09-15      | No            | Published-only; recipes/blogs/videos riêng, dedupe, profile-safe, limit 1–10/type                             |
| POST   | `/uploads/signature`           | `READY` | 2026-09-15      | No            | Auth; Cloudinary SHA-1 signature/config, không lộ API secret                                                  |
| GET    | `/posts/:id/comments`          | `READY` | 2026-09-15      | No            | Public; phân trang root thread; reply một tầng; deleted/hidden placeholder khi còn reply                      |
| POST   | `/posts/:id/comments`          | `READY` | 2026-09-15      | No            | Auth; chỉ published content; parent phải là root visible cùng post                                            |
| PATCH  | `/comments/:id`                | `READY` | 2026-09-15      | No            | Owner only; visible only; backend ghi `editedAt`                                                              |
| DELETE | `/comments/:id`                | `READY` | 2026-09-15      | No            | Owner only; soft-delete idempotent; không đổi comment bị Admin hide                                           |
| GET    | `/posts/:id/community-summary` | `READY` | 2026-09-15      | No            | Public aggregate; optional auth trả viewer vote/bookmark/rating state                                         |
| PUT    | `/posts/:id/vote`              | `READY` | 2026-09-15      | No            | Auth; idempotent upvote; trả counter server-side                                                              |
| DELETE | `/posts/:id/vote`              | `READY` | 2026-09-15      | No            | Auth; idempotent remove; trả counter server-side                                                              |
| PUT    | `/posts/:id/rating`            | `READY` | 2026-09-15      | No            | Auth; Recipe only; taste/difficulty 1–5; upsert và trả active aggregate                                       |
| PUT    | `/posts/:id/bookmark`          | `READY` | 2026-09-15      | No            | Auth; Recipe/Video only; idempotent                                                                           |
| DELETE | `/posts/:id/bookmark`          | `READY` | 2026-09-15      | No            | Auth; Recipe/Video only; idempotent                                                                           |
| GET    | `/users/me/bookmarks`          | `READY` | 2026-09-15      | No            | Auth; published Recipe/Video; filter type và pagination                                                       |

### 6.4 Contributor, Moderation và Catalog

| Method | Path                                         | Status  | Backend updated | FE integrated | Ghi chú                                                                                          |
| ------ | -------------------------------------------- | ------- | --------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| POST   | `/contributor-applications`                  | `READY` | 2026-09-15      | No            | Member/Contributor; one pending; reapply sau 30 ngày; không certificate                          |
| GET    | `/contributor-applications/me`               | `READY` | 2026-09-15      | No            | Auth; lịch sử status/review/cooldown của current user                                            |
| GET    | `/admin/contributor-applications`            | `READY` | 2026-09-15      | No            | Admin only; pagination và filter status/type/source/applicant                                    |
| PATCH  | `/admin/contributor-applications/:id/review` | `READY` | 2026-09-15      | No            | Admin; atomic approve/reject; final type+basis+note; approve revoke applicant sessions           |
| GET    | `/review-queue/posts`                        | `READY` | 2026-09-16      | No            | Contributor thấy clean Member pending; Admin thấy cả flagged/quarantined + reason/score/priority |
| PATCH  | `/review-queue/posts/:id/approve`            | `READY` | 2026-09-16      | No            | Reason required; cấm self-approve; row lock chống concurrent reviewer                            |
| PATCH  | `/review-queue/posts/:id/reject`             | `READY` | 2026-09-16      | No            | Reason required; published revision cũ không bị gỡ khi reject revision mới                       |
| POST   | `/reports`                                   | `READY` | 2026-09-16      | No            | Auth; visible target; one active/user/target; 5 distinct reporters chỉ nâng HIGH                 |
| GET    | `/admin/reports`                             | `READY` | 2026-09-16      | No            | Admin filter status/priority/target type                                                         |
| PATCH  | `/admin/reports/:id/resolve`                 | `READY` | 2026-09-16      | No            | Admin final decision; resolve active reports cùng target và lưu related IDs trong audit          |
| GET    | `/admin/users`                               | `READY` | 2026-09-16      | No            | Admin search/filter/pagination; có Contributor subtype và purge schedule                         |
| PATCH  | `/admin/users/:id/status`                    | `READY` | 2026-09-16      | No            | Lock/unlock/ban/unban/delete; reason required; revoke sessions                                   |
| GET    | `/admin/comments`                            | `READY` | 2026-09-16      | No            | Admin filter status/post/author/query                                                            |
| PATCH  | `/admin/comments/:id/status`                 | `READY` | 2026-09-16      | No            | Admin hide/restore; deleted comment không restore; reason + audit                                |
| GET    | `/categories`                                | `READY` | 2026-09-15      | No            | Public active tree tối đa hai tầng; filter `type`                                                |
| GET    | `/admin/categories`                          | `READY` | 2026-09-15      | No            | Admin only; pagination; xem cả archived                                                          |
| POST   | `/admin/categories`                          | `READY` | 2026-09-15      | No            | Admin only; parent/child cùng type                                                               |
| PATCH  | `/admin/categories/:id`                      | `READY` | 2026-09-15      | No            | Admin only; enforce depth và scoped slug                                                         |
| DELETE | `/admin/categories/:id`                      | `READY` | 2026-09-15      | No            | Archive; child/proposal/content reference cần replacement transaction                            |
| GET    | `/ingredients`                               | `READY` | 2026-09-15      | No            | Public active list; q không dấu, foodGroup, pagination                                           |
| GET    | `/ingredients/resolve`                       | `READY` | 2026-09-15      | No            | `NONE/EXACT/AMBIGUOUS`; ambiguous luôn trả candidates                                            |
| GET    | `/admin/ingredients`                         | `READY` | 2026-09-15      | No            | Admin only; xem active/archived và metadata                                                      |
| POST   | `/admin/ingredients`                         | `READY` | 2026-09-15      | No            | Admin only; canonical + allergen/diet/tradition metadata                                         |
| PATCH  | `/admin/ingredients/:id`                     | `READY` | 2026-09-15      | No            | Admin only; metadata array là full snapshot khi gửi                                              |
| DELETE | `/admin/ingredients/:id`                     | `READY` | 2026-09-15      | No            | Archive; public endpoint ngừng trả item                                                          |
| POST   | `/admin/ingredients/:id/aliases`             | `READY` | 2026-09-15      | No            | Admin only; normalize tiếng Việt có/không dấu                                                    |
| DELETE | `/admin/ingredients/:id/aliases/:aliasId`    | `READY` | 2026-09-15      | No            | Admin only; 204 khi xóa thành công                                                               |

Persistence cho `category_proposals` đã có để giữ BL-12, nhưng endpoint Contributor submit/Admin
review proposal vẫn ngoài scope Phase 07 và giữ `PLANNED`; frontend chưa được tạo API consumer cho
luồng này.

### 6.5 Meal Plan và Recommendation

| Method | Path                                 | Status    | Backend updated | FE integrated | Ghi chú                               |
| ------ | ------------------------------------ | --------- | --------------- | ------------- | ------------------------------------- |
| POST   | `/meal-plans/generate`               | `PLANNED` | —               | No            | Tạo version mới                       |
| GET    | `/meal-plans`                        | `PLANNED` | —               | No            | User-owned plans                      |
| GET    | `/meal-plans/:id`                    | `PLANNED` | —               | No            | Ownership required                    |
| PATCH  | `/meal-plans/:id/items/:itemId/swap` | `PLANNED` | —               | No            | Giữ hard constraints                  |
| DELETE | `/meal-plans/:id`                    | `PLANNED` | —               | No            | Soft-delete hoặc archive theo OpenAPI |
| POST   | `/behavior-events`                   | `PLANNED` | —               | No            | Chỉ khi có consent                    |
| GET    | `/recommendations/home`              | `PLANNED` | —               | No            | Trả reason codes                      |

### 6.6 Chat và AI verification

| Method | Path                              | Status    | Backend updated | FE integrated | Ghi chú                         |
| ------ | --------------------------------- | --------- | --------------- | ------------- | ------------------------------- |
| POST   | `/chat/sessions`                  | `PLANNED` | —               | No            | Guest hoặc authenticated        |
| GET    | `/chat/sessions`                  | `PLANNED` | —               | No            | Authenticated history           |
| GET    | `/chat/sessions/:id/messages`     | `PLANNED` | —               | No            | Ownership/public rules          |
| POST   | `/chat/sessions/:id/messages`     | `PLANNED` | —               | No            | SSE stream                      |
| POST   | `/chat/messages/:id/feedback`     | `PLANNED` | —               | No            | Up/down + reason                |
| PATCH  | `/chat/messages/:id/share`        | `PLANNED` | —               | No            | Authenticated only              |
| GET    | `/chat/public`                    | `PLANNED` | —               | No            | Public shared answers           |
| POST   | `/chat/messages/:id/verification` | `PLANNED` | —               | No            | Approved Nutrition Expert/Admin |

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
  },
  "contributorProfile": null
}
```

Frontend tuyệt đối không mở contributor routes dựa trên `requestedType`. Chỉ dùng `user.role` và approved contributor profile từ `/users/me`.

- `POST /contributor-applications` dùng cùng payload cho Member hiện hữu hoặc Contributor yêu cầu
  đổi subtype. Application chỉ chuyển quyền sau Admin approval; duplicate pending trả conflict.
- `GET /contributor-applications/me` là nguồn lịch sử/status và `reapplyEligibleAt`; không tính
  cooldown 30 ngày ở client.
- Admin approve gửi `decision=APPROVE`, final `contributorType`, `approvalBasis` và `reviewNote`.
  Reject gửi `decision=REJECT` và `reviewNote`.
- Sau approve, backend revoke refresh sessions và access token mang role cũ trả
  `STALE_ACCESS_TOKEN`; frontend xóa session hiện tại và yêu cầu applicant đăng nhập lại.
- Nhãn profile chỉ dùng “được Admin duyệt”. Không hiển thị “đã xác minh chứng chỉ” trong MVP.
- Permission backend dùng approved profile từ DB: `EXPERIENCED_PRACTITIONER` được review Member
  content từ Phase 08 nhưng không verify AI nutrition; `NUTRITION_EXPERT` được phép verify từ Phase 12. Frontend guard chỉ phục vụ UX.

### 7.2 Moderation và visibility

```text
Member submit -> PENDING_REVIEW
Approved Contributor/Admin + no flag -> PUBLISHED
Member + low/medium rule flag -> PENDING_REVIEW kèm aiFlags
Approved Contributor/Admin + low/medium rule flag -> FLAGGED
High spam/harmful-health -> QUARANTINED -> Admin bắt buộc review
Approve -> PUBLISHED; Reject -> REJECTED (published revision cũ vẫn visible)
```

- Rule flag gồm `provider`, `model`, `ruleVersion`, `reasonCodes`, `riskScore`, `riskLevel`; đây là signal, không phải confirmed violation.
- Contributor chỉ quyết định clean Member `PENDING_REVIEW`, không self-review. Admin xử lý flagged/quarantined và final decision `NO_VIOLATION/WARN/HIDE/RESTORE/DEMOTE/BAN`.
- `POST /reports` chỉ nhận target đang visible. Report thứ năm từ reporter khác nhau nâng các active report của target lên `HIGH`; UI không được hiển thị như violation đã xác nhận.
- Khi ban, backend chỉ gắn `USER_BANNED` lên post/comment đang visible. Khi unban, backend chỉ restore item vẫn mang đúng lý do này; item đã đổi sang moderation violation vẫn hidden.
- Mọi mutation moderation cần reason; `REVIEW_CONFLICT`/`REPORT_REVIEW_CONFLICT` phải refresh server state, không optimistic overwrite.

### 7.3 Diet rule confirmation

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

### 7.4 Upload Cloudinary

```text
FE xin signature từ backend
→ FE upload trực tiếp Cloudinary
→ FE nhận secure URL/public ID
→ FE tạo/cập nhật post bằng media reference
```

- Không gửi API secret xuống frontend.
- Gọi `POST /uploads/signature` với `resourceType: image | video`, sau đó dùng nguyên
  `uploadUrl`, `cloudName`, `apiKey`, `folder`, `timestamp` và `signature` trả về cho request upload.
- Signature chỉ có hiệu lực tới `expiresAt`; nếu upload bắt đầu sau thời điểm này, xin signature mới.
- Khi tạo/cập nhật Post, media Cloudinary phải gửi lại `provider`, `kind`, `publicId`, `secureUrl`,
  `mimeType`, `bytes` và metadata dimension/duration nếu có. Backend kiểm tra cloud, folder, MIME và
  size trước khi lưu.
- Video ngoài Cloudinary chỉ nhận URL YouTube thuộc allowlist và backend chuẩn hóa thành watch URL.
- Validate MIME/size ở UI để UX tốt, nhưng backend vẫn phải validate metadata khi lưu Post.
- Hiển thị progress và retry; không tạo Post record trước khi upload hoàn tất trừ khi backend contract hỗ trợ draft rõ ràng.

### 7.5 Content revisions

- Request create/update là discriminated union theo `type = RECIPE | BLOG | VIDEO`; frontend phải giữ
  DTO riêng cho từng nhánh, không gửi field publication/author do client tự đặt.
- `tags` là snapshot theo revision, tối đa 15 giá trị; backend chuẩn hóa để search/related nhưng trả
  lại nhãn gốc cho UI.
- `PATCH /posts/:id` gửi full revision snapshot kèm `expectedVersion`. Khi nhận
  `CONTENT_VERSION_CONFLICT`, fetch lại detail trước khi cho user merge hoặc submit lại.
- Member submission luôn `PENDING_REVIEW`; chỉ approved Contributor profile hoặc Admin mới được
  auto-publish khi rule moderation không flag. Khi sửa content đã published, public tiếp tục thấy
  `publishedRevisionVersion` cũ trong lúc revision mới pending/flagged/quarantined.
- Recipe có ingredient `AMBIGUOUS` hoặc `UNKNOWN` vẫn lưu được để review nhưng
  `mealPlannerEligible=false`; frontend phải hiển thị trạng thái resolution và không tự chọn canonical
  ingredient thay backend.

### 7.6 Search và related content

- `GET /posts` nhận `q`, `type`, `category` (UUID hoặc slug), `maxCookTimeMinutes`, `difficulty`,
  `dietPattern`, `ingredientIds`, `forDate`, `page`, `limit`. `ingredientIds` yêu cầu Recipe chứa đủ
  toàn bộ canonical IDs đã gửi.
- Query rỗng hợp lệ và trả discovery mới nhất. `q` chỉ có dấu câu trả `INVALID_SEARCH_QUERY`.
- Với authenticated request, backend dùng diet profile đã lưu thay cho query có khả năng nới rule,
  đồng thời lọc allergy/exclusion và enabled tradition rules trước ranking. `forDate` mặc định là ngày
  hiện tại tại `Asia/Ho_Chi_Minh` và quyết định tradition rule cho lịch `PERIODIC`.
- Response meta trả `rankingVersion=v1` và `appliedConstraints`; UI dùng metadata này để giải thích
  filter đang áp dụng, không tự suy luận lại hard constraints.
- `GET /posts/:id/related?limitPerType=4` trả `{ recipes, blogs, videos }`. Current item luôn bị loại;
  mỗi nhóm được xếp theo category/ingredient/tag overlap rồi `publishedAt` và UUID.

### 7.7 Community interactions

- Chỉ published content nhận comment/vote/rating/bookmark. Không dùng counter từ client; đọc
  aggregate và viewer state qua `GET /posts/:id/community-summary`.
- Comment list phân trang theo root thread; `replies` chỉ có một tầng. `isPlaceholder=true` đi cùng
  `content=null` và `author=null` khi root đã deleted/hidden nhưng còn reply visible.
- `PATCH/DELETE /comments/:id` chỉ dành cho owner. Comment `HIDDEN` không thể được tác giả sửa, xóa
  hoặc restore; moderation status do Admin endpoint Phase 08 quản lý.
- Vote và bookmark dùng PUT/DELETE idempotent. Rating là PUT upsert, chỉ Recipe, gồm hai điểm nguyên
  `taste` và `difficulty` từ 1–5; aggregate chỉ tính rating `active`.
- Mutation có fixed-window rate limit lưu ở backend. Khi nhận `COMMUNITY_RATE_LIMITED`, đọc
  `error.fields.retryAfterSeconds[0]`, disable action tạm thời và không optimistic-retry liên tục.
- Bookmark list chỉ trả published Recipe/Video; frontend vẫn cần DTO/Model/Mapper riêng trước khi
  đổi `FE integrated` sang Yes.

### 7.8 Chat SSE

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

### 7.9 Behavioral events

- Không block primary action nếu ghi event thất bại.
- Chỉ gửi event khi backend xác nhận personalization consent đang active.
- Dedupe rapid repeated views ở client để giảm noise; backend vẫn là nơi quyết định dedupe chính thức.
- Recommendation UI render `reasonCodes`, không tự đọc raw behavior history.

### 7.10 Maps

- Browser lấy geolocation sau thao tác/consent rõ ràng.
- Từ chối permission phải chuyển sang form địa chỉ.
- Map và list dùng cùng một result set/backend IDs.
- Không gọi Places web service bằng backend key từ browser.
- Khi `externalDataUnavailable=true`, UI vẫn hiển thị list nội bộ và thông báo nhẹ, không block màn hình.

---

## 8. Business error codes frontend phải xử lý

Danh sách này là baseline; schema chính thức phải nằm trong OpenAPI.

| Code                                       | UI behavior                                                            |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| `AUTH_REQUIRED`                            | Mở login/redirect có return URL                                        |
| `INVALID_ACCESS_TOKEN`                     | Xóa auth state; yêu cầu đăng nhập lại                                  |
| `TOKEN_EXPIRED`                            | Để refresh queue xử lý                                                 |
| `INVALID_REFRESH_TOKEN`                    | Xóa auth state; yêu cầu đăng nhập lại                                  |
| `REFRESH_TOKEN_REUSED`                     | Xóa auth state trên thiết bị và cảnh báo phiên đã bị thu hồi           |
| `INVALID_CREDENTIALS`                      | Báo email hoặc mật khẩu không đúng, không tiết lộ tài khoản tồn tại    |
| `EMAIL_ALREADY_EXISTS`                     | Hiển thị lỗi email đã được sử dụng tại form đăng ký                    |
| `ACCOUNT_LOCKED`                           | Hiện thời gian thử lại nếu có                                          |
| `ACCOUNT_BANNED`                           | Logout và hiển thị lý do/contact                                       |
| `STALE_ACCESS_TOKEN`                       | Xóa session và yêu cầu đăng nhập lại để nhận role hiện tại             |
| `FORBIDDEN`                                | Trang/notification không đủ quyền                                      |
| `VALIDATION_ERROR`                         | Map `fields` vào form                                                  |
| `NOT_FOUND`                                | Hiển thị trạng thái không tìm thấy phù hợp với resource/page           |
| `INVALID_JSON`                             | Báo request không hợp lệ; không retry tự động                          |
| `PAYLOAD_TOO_LARGE`                        | Yêu cầu user giảm kích thước payload/file trước khi thử lại            |
| `DATABASE_UNAVAILABLE`                     | Hiển thị trạng thái dịch vụ tạm thời không khả dụng và cho phép retry  |
| `INTERNAL_SERVER_ERROR`                    | Hiển thị lỗi hệ thống kèm mã request để hỗ trợ tra soát                |
| `CONTRIBUTOR_APPLICATION_PENDING`          | Disable submit, link xem trạng thái                                    |
| `CONTRIBUTOR_REAPPLY_NOT_ALLOWED`          | Hiển thị ngày được apply lại                                           |
| `CONTRIBUTOR_APPLICATION_NOT_ALLOWED`      | Ẩn form apply với Admin hoặc role không phù hợp                        |
| `CONTRIBUTOR_TYPE_UNCHANGED`               | Yêu cầu chọn subtype khác profile Contributor hiện tại                 |
| `CONTRIBUTOR_APPLICATION_ALREADY_REVIEWED` | Refresh Admin queue; application đã có quyết định                      |
| `CONTRIBUTOR_APPLICATION_NOT_REVIEWABLE`   | Giữ queue và báo applicant không còn đủ điều kiện                      |
| `SELF_APPROVAL_FORBIDDEN`                  | Giữ queue và báo lỗi rõ                                                |
| `ADMIN_REVIEW_REQUIRED`                    | Chỉ hiển thị quyết định final cho Admin với flagged/quarantined target |
| `REVIEW_ALREADY_DECIDED`                   | Refresh review queue; revision đã có quyết định                        |
| `REVIEW_CONFLICT`                          | Refresh review queue; reviewer khác vừa xử lý revision                 |
| `CONTENT_AUTHOR_INACTIVE`                  | Không cho publish content của user đã bị ban/xóa                       |
| `SELF_REPORT_FORBIDDEN`                    | Không cho report content/comment của chính user                        |
| `DUPLICATE_ACTIVE_REPORT`                  | Mở report hiện tại thay vì submit report trùng                         |
| `REPORT_ALREADY_RESOLVED`                  | Refresh Admin report queue                                             |
| `REPORT_REVIEW_CONFLICT`                   | Refresh queue; Admin khác vừa resolve                                  |
| `DEMOTION_NOT_APPLICABLE`                  | Refresh target; author không còn là Contributor                        |
| `SELF_MODERATION_FORBIDDEN`                | Không cho Admin đổi status tài khoản của chính mình                    |
| `PROTECTED_ADMIN_ACCOUNT`                  | Không cho moderation tài khoản Admin qua endpoint này                  |
| `USER_STATUS_CONFLICT`                     | Refresh user; transition status không hợp lệ                           |
| `COMMENT_NOT_MODERATABLE`                  | Comment đã bị author xóa và không thể restore                          |
| `COMMENT_STATUS_CONFLICT`                  | Refresh comment; item đã ở trạng thái yêu cầu                          |
| `DIET_RULE_RECONFIRMATION_REQUIRED`        | Mở review rule flow                                                    |
| `DIET_SCHEDULE_REQUIRED`                   | Yêu cầu chọn ngày periodic                                             |
| `DIET_RULES_UNAVAILABLE`                   | Không cho lưu preference; hiển thị trạng thái cấu hình chưa sẵn sàng   |
| `INVALID_DIET_RULE_SELECTION`              | Sync lại preview và yêu cầu user xác nhận toàn bộ rule                 |
| `DIET_RULE_REQUIRED`                       | Giữ bật hard constraint của diet pattern                               |
| `DIET_PREFERENCES_REQUIRED`                | Điều hướng user lưu diet preference trước khi chỉnh lịch               |
| `DIET_SCHEDULE_NOT_APPLICABLE`             | Không gửi ngày khi practice schedule là `PERMANENT`                    |
| `INVALID_INGREDIENT_EXCLUSIONS`            | Yêu cầu loại mục rỗng/trùng khỏi danh sách exclusion                   |
| `INVALID_CATALOG_NAME`                     | Báo tên không thể chuẩn hóa thành slug/canonical key hợp lệ            |
| `INVALID_CATEGORY_PARENT`                  | Yêu cầu chọn parent category active                                    |
| `CATEGORY_TYPE_MISMATCH`                   | Chỉ cho chọn parent cùng category type                                 |
| `CATEGORY_DEPTH_EXCEEDED`                  | Không cho tạo/chuyển category vượt quá hai tầng                        |
| `CATEGORY_SLUG_CONFLICT`                   | Báo slug đã tồn tại trong cùng parent/type                             |
| `CATEGORY_REPLACEMENT_REQUIRED`            | Mở selector replacement trước khi archive category đang được dùng      |
| `INVALID_CATEGORY_REPLACEMENT`             | Chỉ chấp nhận replacement active, cùng type và cùng tầng               |
| `CATEGORY_REPLACEMENT_CONFLICT`            | Refresh cây; replacement gây xung đột slug ở subtree                   |
| `INVALID_INGREDIENT_METADATA`              | Sync catalog; allergen/diet/tradition metadata không hợp lệ            |
| `INGREDIENT_NAME_CONFLICT`                 | Báo canonical ingredient đã tồn tại sau normalize không dấu            |
| `INGREDIENT_ALIAS_CONFLICT`                | Báo alias đã tồn tại trên canonical ingredient này                     |
| `CATALOG_REFERENCE_CONFLICT`               | Refresh catalog; item/metadata đang có reference không hợp lệ          |
| `INVALID_CONTENT`                          | Giữ form và hiển thị business validation của Recipe/Blog/Video         |
| `INVALID_MEDIA_REFERENCE`                  | Yêu cầu upload/chọn lại media hợp lệ trước khi submit                  |
| `INVALID_INGREDIENT_REFERENCE`             | Sync catalog và yêu cầu chọn lại canonical ingredient                  |
| `CONTENT_SLUG_CONFLICT`                    | Báo slug đã tồn tại và cho user chỉnh slug                             |
| `CONTENT_VERSION_CONFLICT`                 | Fetch revision mới nhất trước khi merge/submit lại                     |
| `CONTENT_STATE_CONFLICT`                   | Khóa edit khi content đang bị giữ để review                            |
| `CONTENT_DELETED`                          | Đóng editor và hiển thị trạng thái đã xóa cho owner/Admin              |
| `INVALID_SEARCH_QUERY`                     | Giữ filters hiện tại và yêu cầu từ khóa có chữ hoặc số                 |
| `INVALID_COMMENT_PARENT`                   | Giữ nội dung và yêu cầu reply lại một root comment còn visible         |
| `COMMENT_OWNER_REQUIRED`                   | Không mở edit/delete cho comment của user khác                         |
| `COMMENT_NOT_EDITABLE`                     | Refresh thread; comment đã deleted/hidden không thể sửa hoặc restore   |
| `RATING_RECIPE_ONLY`                       | Ẩn rating control khỏi Blog/Video                                      |
| `BOOKMARK_TYPE_NOT_SUPPORTED`              | Ẩn bookmark control khỏi Blog                                          |
| `COMMUNITY_RATE_LIMITED`                   | Disable action theo `retryAfterSeconds`, không retry tự động           |
| `HEALTH_PROFILE_INCOMPLETE`                | Link tới health profile                                                |
| `NO_ELIGIBLE_RECIPE`                       | Hiển thị slot trống/warnings, không crash                              |
| `VERIFICATION_ALREADY_EXISTS`              | Refresh target và hiển thị reviewer hiện tại                           |
| `AI_QUOTA_EXCEEDED`                        | Hiển thị reset time/CTA phù hợp role                                   |
| `AI_FEATURE_DISABLED`                      | Hiển thị maintenance state; history vẫn xem được                       |
| `AI_PROVIDER_UNAVAILABLE`                  | Retry/fallback message                                                 |
| `EXTERNAL_LOCATION_UNAVAILABLE`            | Dùng internal restaurant results                                       |
| `RESOURCE_CONFLICT`                        | Refresh entity/version trước khi sửa lại                               |

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

| Date       | Version | Module       | Change                                                                                                                               | Breaking | FE action                                                                                      |
| ---------- | ------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------ | :------: | ---------------------------------------------------------------------------------------------- |
| 2026-09-16 | 1.9     | Moderation   | Thêm rule flags v1, transactional post review, report escalation, Admin decisions, selective ban/unban và audit trail                |    No    | Sync OpenAPI; map queue/report/user/comment DTO, reason codes và xử lý conflict/state boundary |
| 2026-09-15 | 1.8     | Contributors | Hoàn thiện shared application state machine, own/Admin list-review, approved subtype profile, cooldown và stale-session protection   |    No    | Sync OpenAPI; map profile/application DTO và buộc đăng nhập lại khi STALE_ACCESS_TOKEN         |
| 2026-09-15 | 1.7     | Community    | Thêm comment thread một tầng, idempotent vote/bookmark, Recipe rating aggregate, community summary và current-user bookmark list     |    No    | Sync OpenAPI; tạo DTO/Model/Mapper/query hooks và xử lý placeholder/rate limit                 |
| 2026-09-15 | 1.6     | Search       | Mở rộng GET posts với normalized ranking/filter an toàn và thêm related content theo ba type                                         |    No    | Sync OpenAPI; map search meta/filters và ba list related, không tự nới appliedConstraints      |
| 2026-09-15 | 1.5     | Content      | Thêm Recipe/Blog/Video revision CRUD, structured recipe constraints, soft-delete/version conflict và signed Cloudinary upload        |    No    | Sync OpenAPI; tạo DTO/Model/Mapper theo post type, upload trực tiếp và xử lý revision conflict |
| 2026-09-15 | 1.4     | Catalog      | Thêm category tree, canonical ingredient, alias resolution và metadata allergen/diet/tradition; exclusion nhận optional ingredientId |    No    | Sync OpenAPI; tạo DTO/Model/Mapper cho category và ingredient, xử lý AMBIGUOUS                 |
| 2026-09-15 | 1.3     | Profile/Diet | Thêm profile, BMI/BMR/TDEE, rule preview v1, preference/effective constraints và PERIODIC dates                                      |    No    | Sync OpenAPI; tạo DTO/Model/Mapper riêng cho profile và diet flow                              |
| 2026-09-15 | 1.2     | Auth         | Hoàn tất register/login/refresh rotation/logout, RBAC primitives và `/users/me`                                                      |    No    | Sync OpenAPI; tích hợp proxy/cookie với `withCredentials=true`                                 |
| 2026-09-15 | 1.1     | Foundation   | Hoàn tất health, Swagger UI và OpenAPI JSON; thêm request ID và error envelope nền tảng                                              |    No    | Dùng catalog OpenAPI đã sync; chưa cần tạo consumer UI cho health                              |
| 2026-09-15 | 1.0     | All          | Tạo integration registry; backend chưa triển khai                                                                                    |    No    | Không tích hợp API thật cho tới khi status READY                                               |

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
