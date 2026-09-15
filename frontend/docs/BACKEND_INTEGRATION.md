# Frontend ↔ Backend Integration Guide

**Version:** 1.1

**Cập nhật:** 15/09/2026

**Backend implementation status:** `IN_PROGRESS`

**Contract target:** `/api/v1`

> Tài liệu này là registry sống cho những capability backend đã sẵn sàng để frontend tích hợp. Foundation và OpenAPI đã hoàn tất; các feature nghiệp vụ vẫn ở trạng thái `PLANNED` cho tới khi phase tương ứng vượt qua đầy đủ completion gate.

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
| `READY`       | OpenAPI, migration, seed và test backend đã hoàn tất | Được tích hợp và viết mapper/query                  |
| `CHANGING`    | Có breaking change đang được phối hợp                | Dùng version/branch đã thống nhất; không sync mù    |
| `DEPRECATED`  | Còn tạm thời cho migration                           | Không tạo consumer mới                              |
| `REMOVED`     | Không còn được phục vụ                               | Xóa consumer sau khi migration hoàn tất             |

### 1.2 Rule xác nhận readiness

Endpoint chỉ được chuyển sang `READY` khi có đủ:

- Route hoạt động trong local environment.
- Schema request/response/error xuất hiện trong OpenAPI.
- Authorization được test.
- Migration/seed cần thiết đã có.
- Happy path và business-error integration tests pass.
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

| Method | Path                         | Status    | Backend updated | FE integrated | Ghi chú                                                    |
| ------ | ---------------------------- | --------- | --------------- | ------------- | ---------------------------------------------------------- |
| POST   | `/auth/register`             | `PLANNED` | —               | No            | Có optional `requestedContributorType`                     |
| POST   | `/auth/login`                | `PLANNED` | —               | No            | Access token + refresh cookie                              |
| POST   | `/auth/refresh`              | `PLANNED` | —               | No            | Rotation, Route Handler proxy                              |
| POST   | `/auth/logout`               | `PLANNED` | —               | No            | Revoke refresh session                                     |
| GET    | `/users/me`                  | `PLANNED` | —               | No            | Trả role đã được duyệt, không trả requested role như quyền |
| PATCH  | `/users/me`                  | `PLANNED` | —               | No            | Profile cơ bản                                             |
| PUT    | `/users/me/health-profile`   | `PLANNED` | —               | No            | Manual BMI/BMR/TDEE inputs                                 |
| POST   | `/diet-rules/preview`        | `PLANNED` | —               | No            | Trả rule set để user toggle/xác nhận                       |
| PUT    | `/users/me/diet-preferences` | `PLANNED` | —               | No            | Lưu pattern/schedule/tradition/rules                       |
| PUT    | `/users/me/diet-schedule`    | `PLANNED` | —               | No            | Date-only values cho PERIODIC                              |
| DELETE | `/users/me/behavior-history` | `PLANNED` | —               | No            | Reset personalization                                      |

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

### 6.4 Contributor, Moderation và Category

| Method | Path                                         | Status    | Backend updated | FE integrated | Ghi chú                                  |
| ------ | -------------------------------------------- | --------- | --------------- | ------------- | ---------------------------------------- |
| POST   | `/contributor-applications`                  | `PLANNED` | —               | No            | Member upgrade; không có certificate MVP |
| GET    | `/admin/contributor-applications`            | `PLANNED` | —               | No            | Admin only                               |
| PATCH  | `/admin/contributor-applications/:id/review` | `PLANNED` | —               | No            | Approve/reject + type + basis            |
| GET    | `/review-queue/posts`                        | `PLANNED` | —               | No            | Contributor/Admin filtering              |
| PATCH  | `/review-queue/posts/:id/approve`            | `PLANNED` | —               | No            | Cấm self-approve                         |
| PATCH  | `/review-queue/posts/:id/reject`             | `PLANNED` | —               | No            | Reason required                          |
| POST   | `/reports`                                   | `PLANNED` | —               | No            | One active report/user/target            |
| GET    | `/admin/reports`                             | `PLANNED` | —               | No            | Admin only                               |
| PATCH  | `/admin/reports/:id/resolve`                 | `PLANNED` | —               | No            | Audit required                           |
| GET    | `/admin/users`                               | `PLANNED` | —               | No            | Search/filter/pagination                 |
| PATCH  | `/admin/users/:id/status`                    | `PLANNED` | —               | No            | Lock/ban/unban/delete rules              |
| GET    | `/admin/comments`                            | `PLANNED` | —               | No            | Moderation list                          |
| PATCH  | `/admin/comments/:id/status`                 | `PLANNED` | —               | No            | Hide/restore                             |
| GET    | `/categories`                                | `PLANNED` | —               | No            | Public active tree                       |
| POST   | `/admin/categories`                          | `PLANNED` | —               | No            | Admin only                               |
| PATCH  | `/admin/categories/:id`                      | `PLANNED` | —               | No            | Admin only                               |
| DELETE | `/admin/categories/:id`                      | `PLANNED` | —               | No            | `replacementId` required when used       |

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

### 7.5 Behavioral events

- Không block primary action nếu ghi event thất bại.
- Chỉ gửi event khi backend xác nhận personalization consent đang active.
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

| Code                                | UI behavior                                                           |
| ----------------------------------- | --------------------------------------------------------------------- |
| `AUTH_REQUIRED`                     | Mở login/redirect có return URL                                       |
| `TOKEN_EXPIRED`                     | Để refresh queue xử lý                                                |
| `ACCOUNT_LOCKED`                    | Hiện thời gian thử lại nếu có                                         |
| `ACCOUNT_BANNED`                    | Logout và hiển thị lý do/contact                                      |
| `FORBIDDEN`                         | Trang/notification không đủ quyền                                     |
| `VALIDATION_ERROR`                  | Map `fields` vào form                                                 |
| `NOT_FOUND`                         | Hiển thị trạng thái không tìm thấy phù hợp với resource/page          |
| `INVALID_JSON`                      | Báo request không hợp lệ; không retry tự động                         |
| `PAYLOAD_TOO_LARGE`                 | Yêu cầu user giảm kích thước payload/file trước khi thử lại           |
| `DATABASE_UNAVAILABLE`              | Hiển thị trạng thái dịch vụ tạm thời không khả dụng và cho phép retry |
| `INTERNAL_SERVER_ERROR`             | Hiển thị lỗi hệ thống kèm mã request để hỗ trợ tra soát               |
| `CONTRIBUTOR_APPLICATION_PENDING`   | Disable submit, link xem trạng thái                                   |
| `CONTRIBUTOR_REAPPLY_NOT_ALLOWED`   | Hiển thị ngày được apply lại                                          |
| `SELF_APPROVAL_FORBIDDEN`           | Giữ queue và báo lỗi rõ                                               |
| `DIET_RULE_RECONFIRMATION_REQUIRED` | Mở review rule flow                                                   |
| `DIET_SCHEDULE_REQUIRED`            | Yêu cầu chọn ngày periodic                                            |
| `HEALTH_PROFILE_INCOMPLETE`         | Link tới health profile                                               |
| `NO_ELIGIBLE_RECIPE`                | Hiển thị slot trống/warnings, không crash                             |
| `VERIFICATION_ALREADY_EXISTS`       | Refresh target và hiển thị reviewer hiện tại                          |
| `AI_QUOTA_EXCEEDED`                 | Hiển thị reset time/CTA phù hợp role                                  |
| `AI_FEATURE_DISABLED`               | Hiển thị maintenance state; history vẫn xem được                      |
| `AI_PROVIDER_UNAVAILABLE`           | Retry/fallback message                                                |
| `EXTERNAL_LOCATION_UNAVAILABLE`     | Dùng internal restaurant results                                      |
| `RESOURCE_CONFLICT`                 | Refresh entity/version trước khi sửa lại                              |

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
7. Chạy backend tests và xuất `/api-docs.json` thành công.
8. Ghi rõ frontend action cần làm trong PR summary.

Không được mô tả endpoint là READY chỉ vì route đã tồn tại nếu authorization, schema hoặc test chưa hoàn chỉnh.

### Backend PR checklist

```text
[ ] OpenAPI updated
[ ] BACKEND_INTEGRATION.md status updated
[ ] Request/response/error examples updated
[ ] Migration/seed updated if needed
[ ] Authorization and ownership tests added
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

| Date       | Version | Module     | Change                                                                                  | Breaking | FE action                                                         |
| ---------- | ------- | ---------- | --------------------------------------------------------------------------------------- | :------: | ----------------------------------------------------------------- |
| 2026-09-15 | 1.1     | Foundation | Hoàn tất health, Swagger UI và OpenAPI JSON; thêm request ID và error envelope nền tảng |    No    | Dùng catalog OpenAPI đã sync; chưa cần tạo consumer UI cho health |
| 2026-09-15 | 1.0     | All        | Tạo integration registry; backend chưa triển khai                                       |    No    | Không tích hợp API thật cho tới khi status READY                  |

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
- Contract/integration test pass.
- Ma trận mục 6 ghi `FE integrated = Yes` kèm ngày hoặc PR/commit reference.
- Changelog được cập nhật nếu behavior hoặc contract thay đổi.
