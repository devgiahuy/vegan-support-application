# Implementation Plan — Vegan Support Application

**Version:** 1.3

**Ngày chốt:** 15/09/2026

**Trạng thái:** Approved baseline for planning
**Mục tiêu gần:** Có một MVP chạy xuyên suốt UI → API → Database trong một tuần phát triển đầu tiên.

---

## 1. Các quyết định đã chốt

| ID  | Quyết định          | Phương án được chọn                                                                                             |
| --- | ------------------- | --------------------------------------------------------------------------------------------------------------- |
| D1  | Phạm vi             | MVP theo lát cắt dọc; các chức năng nâng cao vẫn được giữ trong roadmap                                         |
| D2  | Cá nhân hóa hành vi | MVP dùng behavioral scoring có thể giải thích; Phase 2 dùng GenAI/embedding nâng cao                            |
| D3  | Contributor         | User có thể chọn loại Contributor khi đăng ký hoặc apply sau; tài khoản vẫn là `MEMBER` cho tới khi Admin duyệt |
| D4  | Phân loại ăn chay   | Tách `dietPattern`, `practiceSchedule`, `tradition`; hệ thống đề xuất rule để user xác nhận/toggle từng rule    |
| D5  | Moderation          | Member chờ duyệt; Contributor được auto-publish nếu không bị flag; Admin quyết định removal cuối cùng           |
| D6  | Sức khỏe            | MVP web nhập tay; HealthKit/Health Connect và cảm biến thuộc Phase 2                                            |
| D7  | Database            | PostgreSQL + Prisma                                                                                             |
| D8  | Backend             | Node.js + Express + TypeScript                                                                                  |
| D9  | Bản đồ              | Hybrid: dữ liệu quán nội bộ + Google Maps/Places/Geocoding                                                      |
| D10 | Media               | Cloudinary cho upload; hỗ trợ thêm YouTube URL                                                                  |
| D11 | AI provider         | Provider adapter và model cấu hình qua environment; không hard-code model vào domain                            |
| D12 | Tài liệu            | Product SRS đặt tập trung ở `/docs`; tài liệu frontend/backend chỉ mô tả kỹ thuật                               |
| D13 | FE/BE contract      | OpenAPI-first; frontend sinh catalog từ Swagger trước khi tích hợp                                              |
| D14 | CV/STT              | Đặc tả trong roadmap; không coi UI mock là hoàn thành requirement                                               |
| D15 | AI governance       | MVP có request log, feedback metrics, moderation metrics và feature toggle                                      |

### 1.1 Quy ước về tradition trong MVP

Giá trị hỗ trợ:

```text
NONE
BUDDHIST
CHRISTIAN
```

`NONE` là lựa chọn trung lập, không phải một tôn giáo. Các tradition khác được bổ sung qua cấu hình sau này, không cần đổi cấu trúc User hoặc Recipe.

Không hard-code rằng mọi người dùng cùng một tradition đều có cùng danh sách kiêng. Khi user chọn `dietPattern`, `practiceSchedule` và `tradition`, backend trả về bộ rule mặc định có version. User phải xác nhận và có thể bật/tắt từng rule trước khi lưu. `excludedIngredients` và `allergens` của từng user luôn có độ ưu tiên cao hơn.

MVP chưa thu thập hoặc xác minh chứng chỉ Contributor. Admin duyệt thủ công dựa trên thông tin đăng ký; UI chỉ được hiển thị “Contributor/Chuyên gia được Admin duyệt”, không được tuyên bố “đã xác minh chứng chỉ”. Upload và xác minh chứng chỉ thuộc Phase 2.

---

## 2. Phạm vi sản phẩm

### 2.1 MVP bắt buộc

1. Đăng ký, đăng nhập, refresh token, logout và RBAC.
2. Hồ sơ cá nhân, thông tin BMI/BMR/TDEE nhập tay và sở thích ăn chay.
3. CRUD Recipe/Blog/Video; upload ảnh/video hoặc gắn YouTube URL.
4. Search/filter content; related recipe/blog/video.
5. Comment, vote, rating và bookmark.
6. Contributor application, phân loại chuyên môn và quy trình xét duyệt.
7. Moderation queue cho content/report/AI flag.
8. Meal Planner 7 ngày dựa trên rule dinh dưỡng và nguyên liệu.
9. Behavioral recommendation MVP dựa trên lịch sử tương tác.
10. AI Nutrition Chatbot có quota, disclaimer, feedback và verification.
11. Bản đồ quán ăn gần vị trí hiện tại, tìm địa chỉ và gợi ý quán theo món.
12. Admin quản lý user/category/content/comment/report.
13. Admin AI dashboard tối thiểu và feature toggle.
14. Notification trong ứng dụng.

### 2.2 Phase 2 đã giữ trong roadmap

- GenAI Meal Planner toàn phần, embedding/vector search và mô hình sở thích dài hạn.
- Nhận diện nguyên liệu/độ tươi bằng ảnh.
- Speech-to-Text và tự động tóm tắt video.
- Apple HealthKit, Android Health Connect, wearable và dữ liệu cảm biến.
- Seasonal/regional recommendation nâng cao.
- Thêm tradition và rule tương ứng sau khi được xác nhận chuyên môn.
- Push notification, realtime notification và mobile app native.
- Model evaluation dataset, drift detection và rollback tự động nâng cao.

### 2.3 Ngoài phạm vi hiện tại

- Thanh toán và marketplace.
- Blockchain/chuỗi cung ứng.
- Chat realtime giữa người dùng.
- Chẩn đoán hoặc điều trị bệnh.
- Tự huấn luyện foundation model.

---

## 3. Kiến trúc mục tiêu

```text
Next.js 16 / React 19
        |
        | REST + SSE, /api/v1
        v
Express + TypeScript
  ├── Auth/RBAC
  ├── Content/Community
  ├── Diet/Meal Planner/Recommendation
  ├── Chat/AI Gateway
  ├── Location
  ├── Moderation/Admin
  └── Notifications
        |
        ├── PostgreSQL + Prisma
        ├── Redis-compatible cache/rate limit
        ├── Cloudinary
        ├── Google Maps Platform
        └── AI Provider Adapter
```

### 3.1 Backend structure

```text
backend/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   ├── common/
│   │   ├── errors/
│   │   ├── middleware/
│   │   ├── validation/
│   │   └── types/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── diets/
│   │   ├── content/
│   │   ├── community/
│   │   ├── contributors/
│   │   ├── moderation/
│   │   ├── meal-plans/
│   │   ├── recommendations/
│   │   ├── chat/
│   │   ├── restaurants/
│   │   ├── ai-governance/
│   │   └── notifications/
│   └── openapi/
```

Mỗi module dùng luồng:

```text
route → validation → controller → service → repository/Prisma
```

Controller không chứa business rule; service không phụ thuộc Express request/response.

### 3.2 Frontend structure

Giữ kiến trúc feature-based hiện có:

```text
features/<domain>/
├── types/*.dto.ts
├── types/*.model.ts
├── mappers/*.mapper.ts
├── api/*.api.ts
├── queries/*.queries.ts
├── schemas/*.schema.ts
└── components/
```

Mỗi API mới phải có DTO, Model và Mapper. Frontend chỉ bắt đầu tích hợp một module sau khi OpenAPI của module đó được merge.

### 3.3 Quy ước API chung

Success:

```json
{
  "success": true,
  "data": {},
  "meta": null
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "fields": {}
  }
}
```

Pagination:

```json
{
  "page": 1,
  "limit": 20,
  "total": 100,
  "totalPages": 5
}
```

- API prefix: `/api/v1`.
- ID dùng UUID.
- Timestamp dùng ISO 8601 UTC; UI chuyển về múi giờ người dùng.
- Mutation có nguy cơ submit lặp dùng idempotency key.
- List endpoint luôn có pagination và giới hạn `limit <= 100`.
- Validation dùng Zod ở boundary.

---

## 4. Domain model và migration order

### 4.1 Identity và profile

| Table                        | Trường chính                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `users`                      | id, email, passwordHash, displayName, role, status, avatarUrl, deletedAt                                                     |
| `refresh_sessions`           | userId, tokenHash, expiresAt, revokedAt, replacedById, deviceInfo                                                            |
| `health_profiles`            | userId, heightCm, weightKg, age, sex, activityLevel, bmi, bmr, tdee, dataSource                                              |
| `diet_preferences`           | userId, dietPattern, practiceSchedule, tradition, ruleSetVersion, confirmedAt                                                |
| `diet_preference_rules`      | userId, ruleDefinitionId, enabled, source, updatedAt                                                                         |
| `diet_schedule_dates`        | userId, date, enabled; dùng khi `practiceSchedule=PERIODIC`                                                                  |
| `diet_rule_definitions`      | code, type, tradition nullable, ingredientId nullable, defaultEnabled, version, active                                       |
| `user_allergies`             | userId, ingredient/allergen code, severity optional, active                                                                  |
| `user_ingredient_exclusions` | userId, ingredientId nullable, ingredientName, normalizedName, reason, active; free-text vẫn được giữ khi chưa map canonical |
| `contributor_profiles`       | userId, contributorType, approvalBasis, approvedAt, approvedBy, sourceApplicationId                                          |
| `contributor_applications`   | userId, requestedType, experience, referenceLinks, source, status, final type, review/cooldown audit fields                  |

Enums MVP:

```text
Role                 MEMBER | CONTRIBUTOR | ADMIN
UserStatus           ACTIVE | LOCKED | BANNED | DELETED
ContributorType      EXPERIENCED_PRACTITIONER | NUTRITION_EXPERT
DietPattern          VEGAN | LACTO_OVO
PracticeSchedule     PERMANENT | PERIODIC
Tradition            NONE | BUDDHIST | CHRISTIAN
HealthDataSource     MANUAL
```

MVP không suy luận tradition từ diet pattern. User có thể chọn `VEGAN + PERIODIC + CHRISTIAN` hoặc tổ hợp khác nếu không vi phạm rule dữ liệu. `requestedType` trong Contributor application không được đưa vào JWT và không cấp quyền cho tới khi application ở trạng thái `APPROVED`.

Health calculation MVP dùng dữ liệu `MANUAL`: `BMI = weightKg / heightMeters²`; BMR theo Mifflin–St Jeor (`+5` cho `MALE`, `-161` cho `FEMALE`); TDEE bằng BMR nhân activity factor `1.2 / 1.375 / 1.55 / 1.725 / 1.9` tương ứng `SEDENTARY / LIGHTLY_ACTIVE / MODERATELY_ACTIVE / VERY_ACTIVE / EXTRA_ACTIVE`. Kết quả được làm tròn hai chữ số thập phân.

### 4.2 Content và community

| Table                             | Trường chính                                                                                             |
| --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `categories`                      | id, parentId, name, slug, type, status, sortOrder                                                        |
| `category_proposals`              | proposedById, parentId, name, slug, type, status, reviewedById, resolvedCategoryId                       |
| `posts`                           | id, authorId, type, slug, status, version, publishedRevisionId, publishedAt, deletedAt, deletedById      |
| `post_revisions`                  | postId, version, title/body + normalized search fields, status, createdById, reviewNote                  |
| `recipe_details`                  | revisionId, servings, prep/cook time, difficulty, nutrition, mealPlannerEligible, derived constraints    |
| `ingredients`                     | id, canonicalName, normalizedName, foodGroup, status                                                     |
| `ingredient_aliases`              | ingredientId, alias, normalizedAlias; alias có thể map nhiều candidate                                   |
| `allergen_definitions`            | code, label, description, active                                                                         |
| `ingredient_allergens`            | ingredientId, allergenCode                                                                               |
| `ingredient_diet_compatibilities` | ingredientId, dietPattern, compatible                                                                    |
| `ingredient_tradition_warnings`   | ingredientId, tradition, warningCode, label                                                              |
| `recipe_ingredients`              | revisionId, ingredientId nullable, displayName, normalizedName, amount, unit, optional, resolutionStatus |
| `recipe_diet_compatibilities`     | revisionId, dietPattern, compatible, reasonCodes                                                         |
| `post_categories`                 | revisionId, categoryId                                                                                   |
| `post_tags`                       | revisionId, tag, normalizedTag                                                                           |
| `post_media`                      | revisionId, kind, provider, publicId, secureUrl, MIME/size/dimension metadata                            |
| `comments`                        | id, postId, authorId, parentId, content, status, edit/delete/hide audit fields                           |
| `post_votes`                      | userId, postId, createdAt; unique(userId, postId)                                                        |
| `post_ratings`                    | userId, postId, taste, difficulty, active, timestamps; unique(userId, postId)                            |
| `post_bookmarks`                  | userId, postId, createdAt; unique(userId, postId)                                                        |
| `community_rate_limit_buckets`    | userId, action, windowStart, count; unique(userId, action, windowStart)                                  |

`post_revisions` cho phép bản published cũ tiếp tục hiển thị trong lúc bản sửa mới chờ duyệt.
Search v1 dùng normalized ASCII fields với GIN trigram indexes; ranking theo title > canonical
ingredient > category/tag > body. Allergy, ingredient exclusion, diet pattern và enabled tradition rule
của user đăng nhập luôn được lọc trước ranking. Related content dùng category/tag/ingredient overlap và
trả ba nhóm Recipe/Blog/Video riêng.

### 4.3 Moderation, AI và behavior

| Table                | Trường chính                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `reports`            | reporterId, targetType, targetId, reason, description, status                                              |
| `moderation_actions` | actorId, action, targetType, targetId, reason, aiFlagId, reportId                                          |
| `ai_flags`           | feature, targetType, targetId, reasonCodes, riskScore, modelId, status                                     |
| `chat_sessions`      | userId nullable, guestId nullable, title, deletedAt                                                        |
| `chat_messages`      | sessionId, role, content, isPublic, modelId, createdAt                                                     |
| `ai_verifications`   | targetType, targetId, reviewerId, decision, note, createdAt                                                |
| `behavior_events`    | userId, eventType, entityType, entityId, metadata, createdAt                                               |
| `ai_request_logs`    | feature, userId nullable, guestId nullable, provider, modelId, latencyMs, status, tokenUsage, costEstimate |
| `ai_feedback`        | requestLogId, userId nullable, rating, reason, comment                                                     |
| `ai_feature_configs` | feature, enabled, provider, modelId, timeoutMs, updatedBy                                                  |
| `notifications`      | userId, type, title, message, targetType, targetId, readAt, expiresAt                                      |

Không lưu raw prompt chứa PII trong `ai_request_logs`. Nếu cần debug, chỉ lưu payload đã redact và có thời hạn lưu rõ ràng.

### 4.4 Meal plan và location

| Table                    | Trường chính                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `meal_plans`             | userId, weekStart, goal, targetCalories, generatedBy, explanation                          |
| `meal_plan_items`        | mealPlanId, date, mealType, recipeId, calories, position                                   |
| `restaurants`            | name, address, latitude, longitude, googlePlaceId, status, menuTags, supportedDietPatterns |
| `restaurant_submissions` | restaurantId, submitterId, status, reviewNote, reviewedBy                                  |

Tạo index cho:

- `posts(status, type, publishedAt)`.
- `categories(type, slug)` unique cho root và `categories(type, parentId, slug)` unique cho child.
- `ingredients(normalizedName)`.
- `behavior_events(userId, createdAt)`.
- `restaurants(latitude, longitude)`; cân nhắc PostGIS sau MVP nếu query khoảng cách tăng.
- Full-text/normalized search field cho title, ingredient và tags.

---

## 5. MVP Business Rules Baseline

Các rule trong mục này là baseline bắt buộc cho schema, OpenAPI và UI. Nếu thay đổi, phải cập nhật tài liệu này, OpenAPI và frontend integration guide trong cùng change.

### BL-01 — Contributor registration và upgrade

#### Cách yêu cầu role

User có hai đường vào cùng một quy trình:

1. Khi đăng ký tài khoản, user có thể chọn “Tôi muốn đăng ký làm Contributor” và chọn một `requestedContributorType`.
2. Member hiện hữu có thể mở Profile và gửi Contributor application sau.

Trong cả hai trường hợp:

- Account luôn được tạo với `role=MEMBER`.
- Chọn Contributor khi đăng ký chỉ tạo thêm một application `PENDING`; không cấp quyền ngay.
- Mỗi user chỉ có tối đa một application `PENDING`.
- `requestedContributorType` không được tin cậy như quyền và không được đưa vào access token.
- User vẫn dùng toàn bộ quyền Member trong lúc chờ duyệt.

#### Loại Contributor MVP

```text
EXPERIENCED_PRACTITIONER
NUTRITION_EXPERT
```

- Applicant cung cấp mô tả kinh nghiệm và reference links nếu có.
- MVP không có trường upload/xác minh chứng chỉ.
- Admin xem hồ sơ, chọn loại được phê duyệt và ghi `approvalBasis` + `reviewNote`.
- Khi approve: `role=CONTRIBUTOR`, tạo `contributor_profile`, revoke/rotate access token cũ để quyền mới có hiệu lực an toàn.
- Khi reject: user vẫn là Member, nhận lý do và được apply lại sau 30 ngày.
- Muốn đổi Contributor type phải tạo application mới và được Admin duyệt lại.

#### Quyền chuyên môn

- `EXPERIENCED_PRACTITIONER`: review recipe/blog/video của Member; không verify/correct AI output dinh dưỡng.
- `NUTRITION_EXPERT`: có các quyền trên và được verify/correct AI nutrition output sau khi Admin approve đúng type.
- Admin luôn có quyền override và là actor cuối cùng của hide/remove/ban.
- UI dùng nhãn “được Admin duyệt”; không hiển thị “đã xác minh chứng chỉ” trong MVP.

### BL-02 — Diet rule confirmation và độ ưu tiên

#### Luồng xác nhận rule

1. User chọn `dietPattern`, `practiceSchedule`, `tradition`.
2. Frontend gọi preview rule endpoint.
3. Backend trả danh sách rule mặc định, mô tả dễ hiểu, trạng thái mặc định và `ruleSetVersion`.
4. User toggle từng rule rồi xác nhận.
5. Backend lưu snapshot lựa chọn vào `diet_preference_rules` và `confirmedAt`.
6. Nếu rule set được cập nhật lên version mới, lựa chọn cũ vẫn có hiệu lực; UI yêu cầu user review lại ở lần chỉnh Profile tiếp theo, không âm thầm đổi thực đơn hiện có.

Rule response tối thiểu:

```json
{
  "code": "EXCLUDE_INGREDIENT_X",
  "label": "Không dùng ...",
  "description": "...",
  "defaultEnabled": true,
  "hardConstraint": true,
  "source": "TRADITION",
  "version": 1
}
```

#### Độ ưu tiên khi lọc

```text
1. Allergy đang active                         hard, không tự nới
2. User ingredient exclusion đang active      hard, không tự nới
3. Diet pattern                               hard, không tự nới
4. Tradition rule user đã bật                 theo thuộc tính hardConstraint
5. Practice schedule                          quyết định ngày áp dụng tradition rule
6. Behavioral preference                     chỉ ranking
7. Popularity/rating                          chỉ ranking
```

- Allergy không phải toggle trong danh sách tradition; user phải sửa riêng trong mục Allergies.
- Tradition rule chỉ có hiệu lực khi user đã xác nhận và bật rule đó.
- User tắt một tradition rule không được phép vô hiệu hóa allergy hoặc diet-pattern constraint.
- Backend là nơi tính effective rules; frontend không tự suy luận compatibility.

### BL-03 — Periodic practice schedule

- `PERMANENT`: diet/tradition rules đã bật áp dụng mọi ngày.
- `PERIODIC`: user chọn ngày cụ thể trên calendar cho tuần/tháng cần lập kế hoạch.
- Các ngày được lưu theo local date của `Asia/Ho_Chi_Minh`, không lưu như instant làm lệch ngày.
- MVP không tự tính lịch âm hoặc ngày lễ tôn giáo.
- Khi generate meal plan mà user chọn `PERIODIC` nhưng chưa chọn ngày, API trả `DIET_SCHEDULE_REQUIRED` và danh sách ngày của tuần để UI yêu cầu chọn.
- Ngoài ngày periodic, allergy, explicit exclusions và diet pattern vẫn áp dụng; chỉ tradition rules gắn với lịch được tắt.
- Thay đổi schedule không tự sửa meal plan đã lưu. User phải regenerate và tạo version mới.

### BL-04 — Recipe compatibility và ingredient normalization

- Ingredient do author nhập phải được map sang `ingredients.canonicalName` bằng normalize không dấu + alias table.
- Author có thể chọn candidate khi có nhiều kết quả; không cho AI tự quyết định hard constraint.
- Backend tự tính allergen, diet-pattern compatibility và tradition warnings từ canonical ingredients.
- Author-declared tags chỉ là metadata hỗ trợ review, không phải nguồn duy nhất của hard constraint.
- Member recipe có ingredient chưa map được vẫn ở `PENDING_REVIEW` cho tới khi reviewer xử lý.
- Contributor recipe có ingredient chưa map được có thể publish nếu moderation cho phép, nhưng `mealPlannerEligible=false` cho tới khi ingredient được chuẩn hóa.
- Mọi thay đổi ingredient của recipe phải tính lại compatibility và moderation.
- Recipe chỉ vào Meal Planner khi `status=PUBLISHED`, `mealPlannerEligible=true` và có nutrition tối thiểu.

### BL-05 — Content lifecycle, edit và delete

- Member submit: `PENDING_REVIEW`.
- Contributor submit: chạy moderation; `PUBLISHED` nếu không flag, `FLAGGED` nếu có flag.
- Admin content có thể publish nhưng vẫn phải chạy validation và ghi audit.
- Member sửa published post: tạo `post_revision=PENDING_REVIEW`; revision cũ tiếp tục hiển thị.
- Contributor sửa published post: tạo revision, moderation lại và publish revision mới nếu không flag.
- Reject bắt buộc có reason. Author được sửa rejected revision và resubmit.
- Owner delete là soft-delete; public endpoint trả 404/410 theo contract, Admin vẫn xem được audit.
- Admin hide không xóa revision và có thể restore.
- Ban user ẩn cả post và comment đang visible của user bằng reason `USER_BANNED`.
- Khi unban, chỉ tự restore nội dung bị ẩn duy nhất do `USER_BANNED`; nội dung có moderation violation độc lập vẫn hidden.

### BL-06 — AI flag, user report và violation

```text
AI flag     != User report
User report != Confirmed violation
```

- Một user chỉ có một report chưa resolved cho cùng target.
- Ngưỡng escalation tính theo reporter khác nhau, không theo số lần submit.
- Đủ 5 reporter khác nhau chuyển priority thành `HIGH`, không tự kết luận vi phạm.
- AI moderation tạo `ai_flag` gồm reason codes, risk score, provider/model và trạng thái review.
- Risk thấp/trung bình: content giữ nguyên visibility và vào review queue.
- Risk cao đối với spam rõ ràng hoặc nội dung sức khỏe có khả năng gây hại: chuyển `QUARANTINED` tạm thời; không hard-delete.
- `QUARANTINED` phải được Admin review; Contributor chỉ đưa đánh giá chuyên môn.
- Chỉ Admin ra quyết định `NO_VIOLATION`, `WARN`, `HIDE`, `RESTORE`, `DEMOTE`, `BAN`.
- Mọi quyết định cần reason, actor, timestamp, related reports/AI flag và audit trail.
- Appeal không thuộc MVP.

### BL-07 — Meal Planner rules

#### Calorie target MVP

```text
MAINTAIN = TDEE
LOSE     = TDEE × 0.90
GAIN     = TDEE × 1.10
```

Các hệ số phải để trong config và được người có chuyên môn review trước production. MVP không đưa ra chế độ giảm/tăng cực đoan. Profile thiếu age, sex, height, weight hoặc activity level thì không generate và trả `HEALTH_PROFILE_INCOMPLETE`.

#### Cấu trúc và hard constraints

- 7 ngày, cố định 3 bữa/ngày trong MVP.
- Sáng 25%, trưa 40%, tối 35% calorie target.
- Allergy, explicit exclusions và diet pattern không bao giờ được nới.
- Tradition rule đã bật chỉ áp dụng theo BL-02/BL-03.
- Behavioral score không được đưa món vi phạm hard constraint trở lại candidate pool.

#### Fallback

- Calorie tolerance bắt đầu ±15%; có thể nới đến ±20% và phải trả warning.
- Ingredient overlap là ranking signal, không phải điều kiện bắt buộc 60% cho từng món.
- Ưu tiên phủ được nhiều ingredient user có trên toàn tuần.
- Không lặp recipe nếu pool đủ; nếu không đủ, một recipe được xuất hiện tối đa hai lần và API trả warning.
- Không có candidate hợp lệ thì để meal slot `UNFILLED`, không dùng món vi phạm allergy/diet rule.

#### Save, regenerate và swap

- Generate tạo Meal Plan version mới, không ghi đè plan trước.
- Regenerate cũng tạo version mới và liên kết `supersedesMealPlanId`.
- Swap chỉ trả candidate thỏa cùng hard constraints và calorie ±100 kcal; nếu không có thì dùng tolerance đã nới và báo warning.
- Shopping list MVP tổng hợp canonical ingredient; chỉ cộng số lượng khi cùng unit hoặc có conversion rule chắc chắn.
- Cảnh báo micronutrient chỉ hiển thị khi dữ liệu recipe đủ; không suy luận B12 từ calories.

### BL-08 — Behavioral recommendation MVP

- Behavioral personalization cần consent riêng; user từ chối vẫn dùng được search và rule-based Meal Planner.
- Chỉ dùng event của chính user.
- Lookback mặc định 30 ngày và áp dụng recency decay.
- Event hợp lệ: `SEARCH`, `VIEW_RECIPE`, `BOOKMARK`, `RATE`, `CHAT_TOPIC`, `ACCEPT_MEAL`, `SWAP_MEAL`, `REJECT_MEAL`.
- Bookmark/rating/accept có trọng số cao hơn view/search.
- Swap/reject là negative signal.
- Recommendation phải trả tối đa hai reason codes để UI giải thích.
- Cold start dùng popular/rated recipes sau khi áp dụng hard constraints.
- User có thể tắt personalization và xóa behavior history.
- Bộ weight có `scoringVersion`; thay đổi weight không làm thay đổi meal plan đã lưu.
- Phase 2 có thể dùng embeddings/GenAI nhưng vẫn phải đi qua hard-constraint validator.

### BL-09 — Chatbot, quota, privacy và verification

- Quota chỉ bị trừ sau khi provider trả ít nhất một response hoàn chỉnh thành công.
- Retry nội bộ không trừ thêm lượt; validation error/provider failure không trừ lượt.
- Quota reset lúc 00:00 `Asia/Ho_Chi_Minh`.
- Guest được nhận signed anonymous cookie và kết hợp IP/device rate limit; không tin guest ID tự khai báo.
- Guest history lưu tối đa 7 ngày để chống abuse/debug, không được public share và không dùng cho behavioral personalization.
- Authenticated chat mặc định private; user share từng AI answer, không tự share cả session.
- Xóa/ẩn public answer làm verification không còn public nhưng audit vẫn giữ.
- Original AI answer không bị reviewer sửa trực tiếp; correction lưu thành record riêng để audit.
- Chỉ approved `NUTRITION_EXPERT` và Admin được verify/correct nutrition output trong MVP.
- Một target chỉ có một active verification; concurrent request thứ hai trả `409 VERIFICATION_ALREADY_EXISTS`.
- Admin có thể override/remove verification với reason.
- Disclaimer được hệ thống gắn cố định ở UI/API response, không phụ thuộc model.
- Câu hỏi ngoài phạm vi dinh dưỡng chay được từ chối lịch sự.

### BL-10 — Restaurant source, deduplication và ranking

- Restaurant nội bộ đã được Admin duyệt là canonical record của ứng dụng.
- Google Places dùng để tìm/làm giàu; user submission luôn `PENDING` trước khi xuất hiện như verified.
- Deduplicate ưu tiên `googlePlaceId`; nếu không có, dùng normalized name + địa chỉ/toạ độ gần nhau.
- Field do Admin xác minh thủ công được ưu tiên hơn Google cho tới khi Admin bỏ override.
- Rating/opening hours từ Google phải lưu `source` và `fetchedAt`; không ghi đè field nội bộ một cách im lặng.
- Query theo món xếp hạng: menu tag match → diet compatibility → open now → distance → rating.
- Query không có món: distance → verified status → open now → rating.
- Mặc định 5 km; không có kết quả thì user chủ động mở 10 km rồi 20 km.
- Google lỗi/quota hết: trả dữ liệu nội bộ và `externalDataUnavailable=true`.

### BL-11 — Comment, vote, rating và bookmark

- Comment chỉnh sửa bất kỳ lúc nào khi còn visible; cập nhật `editedAt`.
- Delete comment là soft-delete và giữ placeholder nếu có reply.
- Reply tối đa một tầng trong MVP.
- Vote chỉ là upvote toggle, unique theo `(userId, postId)`.
- Rating chỉ áp dụng Recipe, gồm taste và difficulty từ 1–5; user được update rating cũ.
- Average rating tính từ active ratings, không dựa vào cached number do client gửi.
- Bookmark chỉ áp dụng Recipe/Video; unique theo `(userId, postId)`.
- Comment bị Admin hide không được author tự restore.
- Community mutation dùng fixed-window rate limit do backend lưu; client không tự suy luận hoặc gửi counter.

### BL-12 — Category

- Category type: `FOOD_TYPE`, `RECIPE_GROUP`, `CONTENT_TOPIC`.
- Tối đa hai tầng; parent và child phải cùng type trừ khi có migration được duyệt.
- Slug unique trong cùng parent/type.
- Contributor chỉ tạo proposal; Admin tạo/approve category thật.
- Xóa category đang được dùng bắt buộc có replacement category cùng type và thực hiện trong transaction.
- Category sau replacement được archive, không hard-delete.

### BL-13 — Account lifecycle và data retention

- `LOCKED`: chặn login tạm thời; content không đổi visibility.
- `BANNED`: chặn login/mutation; áp dụng visibility rule ở BL-05.
- `DELETED`: revoke toàn bộ session, anonymize public content, lên lịch xóa health/chat/private behavior trong 30 ngày.
- Email/token/password hash không còn dùng được sau delete.
- Moderation/audit log được giữ nhưng không chứa dữ liệu sức khỏe hoặc raw PII không cần thiết.
- User có endpoint xóa behavior history độc lập với xóa account.
- Appeal và account recovery sau delete không thuộc MVP.

### BL-14 — Notification

- MVP chỉ in-app và lưu tối đa 90 ngày.
- Hỗ trợ mark-one và mark-all read.
- Dedupe theo `eventKey`; retry không tạo notification trùng.
- Không gửi notification cho chính actor vừa thực hiện action.
- Report resolved gửi cho reporter và target nhưng không lộ danh tính reporter.
- Notification chỉ chứa summary; dữ liệu nhạy cảm được xem qua endpoint có authorization.

### BL-15 — AI governance metrics và feature toggle

- Request count: số request thực sự gửi provider.
- Error rate: failed provider requests / total provider requests.
- Fallback rate: responses dùng fallback / total user requests.
- Feedback rate: answered messages có feedback / total answered messages.
- Negative rate: thumbs-down / total feedback.
- Override rate: AI flags bị Admin kết luận `NO_VIOLATION` / total reviewed AI flags.
- Cost là estimate nếu provider không trả billing amount; UI phải ghi rõ “ước tính”.
- Admin disable Chatbot: history vẫn xem được, gửi message mới trả `AI_FEATURE_DISABLED`.
- Disable AI explanation không được làm hỏng rule-based Meal Planner.
- Toggle bắt buộc có reason và ghi audit actor/time/old/new value.
- MVP không retrain, deploy hoặc rollback model binary từ dashboard.

---

## 6. RBAC và trách nhiệm

| Hành động                           |  Guest   | Member  | Experienced Contributor | Admin-approved Nutrition Expert | Admin |
| ----------------------------------- | :------: | :-----: | :---------------------: | :-----------------------------: | :---: |
| Xem/search content                  |    ✓     |    ✓    |            ✓            |                ✓                |   ✓   |
| Chatbot                             | Giới hạn |    ✓    |            ✓            |                ✓                |   ✓   |
| Comment/vote/rating/bookmark        |          |    ✓    |            ✓            |                ✓                |   ✓   |
| Tạo content                         |          | Pending |   Auto nếu không flag   |       Auto nếu không flag       | Auto  |
| Sửa/xóa content của mình            |          |    ✓    |            ✓            |                ✓                |   ✓   |
| Duyệt chất lượng recipe/member post |          |         |            ✓            |                ✓                |   ✓   |
| Kiểm chứng nội dung AI dinh dưỡng   |          |         |                         |                ✓                |   ✓   |
| Quản lý user/category/report        |          |         |                         |                                 |   ✓   |
| Hide/remove/ban cuối cùng           |          |         |                         |                                 |   ✓   |
| Bật/tắt AI feature                  |          |         |                         |                                 |   ✓   |

Mọi authorization được kiểm tra ở backend. Frontend guard chỉ phục vụ UX, không phải security boundary.

---

## 7. State machines

### 7.1 Post

```text
DRAFT
  └── submit by Member ──────────────> PENDING_REVIEW
  └── submit by Contributor
        ├── no flag ─────────────────> PUBLISHED
        └── flagged ─────────────────> FLAGGED

PENDING_REVIEW / FLAGGED
  ├── approve ───────────────────────> PUBLISHED
  └── reject ────────────────────────> REJECTED

PUBLISHED
  ├── Member edit ─> new revision PENDING_REVIEW; old revision remains visible
  ├── Contributor edit + no flag ────> PUBLISHED as new revision
  ├── report/admin quarantine ───────> HIDDEN
  └── owner soft delete ─────────────> DELETED

HIDDEN ── admin restore ─────────────> PUBLISHED
```

AI/rule moderation không xóa content. Nó chỉ tạo `ai_flag` và chuyển content sang hàng chờ phù hợp.

### 7.2 Contributor application

```text
PENDING → APPROVED
        → REJECTED → được apply lại sau thời gian cấu hình
```

Khi approve, Admin phải chọn `contributorType` và ghi `approvalBasis`. MVP không có trạng thái xác minh chứng chỉ; khả năng upload/xác minh chứng chỉ được bổ sung ở Phase 2.

### 7.3 AI verification

```text
PENDING → APPROVED
        → CORRECTED
        → REJECTED
        → NEED_SECOND_OPINION (Phase 2)
```

MVP tạo unique constraint trên `(targetType, targetId)` để tránh hai người kiểm chứng cùng một output. Tranh chấp đồng thời trả `409 CONFLICT`.

---

## 8. Functional slices và API

### Slice 0 — Contract và nền tảng

Backend:

- Express TypeScript, Prisma, PostgreSQL, lint/typecheck/build.
- Config validation; centralized error handler; request ID; health endpoint.
- OpenAPI UI tại `/api-docs` và JSON tại `/api-docs.json`.
- Seed account cho Member, hai loại Contributor và Admin.

API:

```text
GET /api/v1/health
```

Done khi frontend chạy được `npm run sync:swagger` và sinh API catalog.

### Slice 1 — Auth, profile và diet preference

API:

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/users/me
PATCH  /api/v1/users/me
PUT    /api/v1/users/me/health-profile
POST   /api/v1/diet-rules/preview
PUT    /api/v1/users/me/diet-preferences
PUT    /api/v1/users/me/diet-schedule
```

UI:

- Login/register.
- Tùy chọn yêu cầu Contributor và chọn requested type trong register.
- Onboarding profile.
- Health profile và kết quả BMI/BMR/TDEE.
- Diet pattern, practice schedule, tradition, rule confirmation/toggle, exclusions và allergies.

Acceptance:

- Refresh token rotation hoạt động sau reload.
- Register có requested Contributor type vẫn trả user role `MEMBER` và tạo application `PENDING`.
- BMR/TDEE chỉ tính khi đủ age, sex và activity level.
- API và UI đều giải thích nguồn dữ liệu là `MANUAL`.
- Effective diet rules ở API khớp đúng các toggle user đã xác nhận.

### Slice 2 — Content, search và community

API:

```text
GET    /api/v1/posts
POST   /api/v1/posts
GET    /api/v1/posts/:idOrSlug
PATCH  /api/v1/posts/:id
DELETE /api/v1/posts/:id
GET    /api/v1/posts/:id/related
POST   /api/v1/uploads/signature

GET    /api/v1/posts/:id/comments
POST   /api/v1/posts/:id/comments
PATCH  /api/v1/comments/:id
DELETE /api/v1/comments/:id
GET    /api/v1/posts/:id/community-summary
PUT    /api/v1/posts/:id/vote
DELETE /api/v1/posts/:id/vote
PUT    /api/v1/posts/:id/rating
PUT    /api/v1/posts/:id/bookmark
DELETE /api/v1/posts/:id/bookmark
GET    /api/v1/users/me/bookmarks
```

UI:

- Home/discovery.
- Search/filter.
- Detail Recipe/Blog/Video.
- Create/edit own post.
- My content.
- Comment, rating, vote, bookmark.

Related content trả các nhóm riêng:

```json
{
  "recipes": [],
  "blogs": [],
  "videos": []
}
```

Acceptance:

- Guest xem/search được published content.
- User không sửa/xóa content hoặc comment của người khác.
- Search không dấu hoạt động với bộ dữ liệu seed.
- Filter cứng loại bỏ allergy và excluded ingredient trước khi ranking.

### Slice 3 — Contributor và moderation

API:

```text
POST   /api/v1/contributor-applications
GET    /api/v1/contributor-applications/me
GET    /api/v1/admin/contributor-applications
PATCH  /api/v1/admin/contributor-applications/:id/review

GET    /api/v1/review-queue/posts
PATCH  /api/v1/review-queue/posts/:id/approve
PATCH  /api/v1/review-queue/posts/:id/reject

POST   /api/v1/reports
GET    /api/v1/admin/reports
PATCH  /api/v1/admin/reports/:id/resolve
GET    /api/v1/admin/users
PATCH  /api/v1/admin/users/:id/status
GET    /api/v1/admin/comments
PATCH  /api/v1/admin/comments/:id/status
```

UI:

- Apply Contributor.
- Contributor review queue.
- Admin user/application/content/comment/report screens.
- AI flag reason và risk score hiển thị rõ cho reviewer.

Acceptance:

- Không self-approve/self-verify.
- Experienced Contributor không được verify nutrition AI output.
- Mọi quyết định tạo audit log.
- Không có luồng tự động hard-delete content bị AI flag.

### Slice 4 — Category

API:

```text
GET    /api/v1/categories
POST   /api/v1/admin/categories
PATCH  /api/v1/admin/categories/:id
DELETE /api/v1/admin/categories/:id?replacementId=
```

Category `type` trong MVP:

```text
FOOD_TYPE
RECIPE_GROUP
CONTENT_TOPIC
```

Xóa category đang được dùng bắt buộc có `replacementId` và chạy trong transaction.

### Slice 5 — Meal Planner và behavioral recommendation

API:

```text
POST   /api/v1/meal-plans/generate
GET    /api/v1/meal-plans
GET    /api/v1/meal-plans/:id
PATCH  /api/v1/meal-plans/:id/items/:itemId/swap
DELETE /api/v1/meal-plans/:id
POST   /api/v1/behavior-events
GET    /api/v1/recommendations/home
```

Hard constraints theo thứ tự ưu tiên:

1. Published recipe.
2. Không chứa allergen của user.
3. Phù hợp diet pattern.
4. Phù hợp explicit excluded ingredients.
5. Áp dụng tradition rule đã cấu hình.
6. Nằm trong calorie tolerance.

Behavioral scoring MVP:

```text
+5 ingredient overlap
+4 bookmarked similar recipe/category
+3 rating >= 4 cho món/category tương tự
+2 chat topic match
+2 repeated view
+1 recent search match
-4 recipe đã xuất hiện trong meal plan gần đây
-3 user đã reject/swap khỏi món tương tự
```

- Lookback mặc định: 30 ngày.
- Hard constraint luôn thắng behavioral score.
- Cold start: popular recipes phù hợp diet profile.
- Lý do gợi ý được tạo từ 1–2 signal có điểm cao nhất; không cần LLM để quyết định ranking.
- Có consent riêng cho behavioral personalization và endpoint xóa history.

Meal Planner MVP:

- 7 ngày × 3 bữa.
- Không lặp recipe nếu pool đủ lớn.
- Nếu không đủ recipe, cho phép lặp tối đa một lần và trả warning.
- Calorie distribution: sáng 25%, trưa 40%, tối 35% với tolerance cấu hình.
- Shopping list tổng hợp theo canonical ingredient và đơn vị có thể quy đổi.
- Vitamin/mineral warning chỉ được hiển thị khi recipe có dữ liệu tương ứng; không suy luận từ `estimatedCalories`.

### Slice 6 — AI Nutrition Chatbot và verification

API:

```text
POST   /api/v1/chat/sessions
GET    /api/v1/chat/sessions
GET    /api/v1/chat/sessions/:id/messages
POST   /api/v1/chat/sessions/:id/messages       # SSE
POST   /api/v1/chat/messages/:id/feedback
PATCH  /api/v1/chat/messages/:id/share
GET    /api/v1/chat/public
POST   /api/v1/chat/messages/:id/verification
```

AI adapter:

```ts
interface AiProvider {
  streamChat(input: ChatInput): AsyncIterable<ChatChunk>;
  moderate(input: ModerationInput): Promise<ModerationResult>;
}
```

Environment/config:

```text
AI_PROVIDER
AI_MODEL_CHAT
AI_MODEL_MODERATION
AI_TIMEOUT_MS
AI_MAX_OUTPUT_TOKENS
```

Acceptance:

- Disclaimer do UI/backend cố định thêm vào, không phụ thuộc model tự sinh.
- Prompt chỉ nhận tối thiểu dữ liệu profile cần thiết và đã có consent.
- Guest identity dùng signed anonymous cookie kết hợp IP/device rate limit; không tin `guestId` do client tự gửi.
- Lỗi provider degrade về thông báo tĩnh, không làm hỏng phần core.
- Chỉ Admin-approved Nutrition Expert hoặc Admin được verify/correct output dinh dưỡng.

### Slice 7 — Restaurant và Google Maps

API:

```text
GET    /api/v1/restaurants/nearby
GET    /api/v1/restaurants/search
GET    /api/v1/restaurants/:id
POST   /api/v1/restaurants
GET    /api/v1/location/geocode
GET    /api/v1/admin/restaurants
PATCH  /api/v1/admin/restaurants/:id/review
```

UI:

- Map + list đồng bộ selection.
- Cho phép dùng vị trí trình duyệt hoặc nhập địa chỉ.
- Gợi ý quán theo `menuTags` khi user tìm món.
- Nút mở chỉ đường bằng Google Maps Universal Link.

Chiến lược key:

- Maps JavaScript browser key: giới hạn HTTP referrer và chỉ bật Maps JS API.
- Places/Geocoding server key: giới hạn IP/service và chỉ dùng ở backend.
- Không commit key; có fallback list nội bộ khi Google API lỗi.

### Slice 8 — Admin AI governance

API:

```text
GET    /api/v1/admin/ai/metrics?from=&to=&feature=
GET    /api/v1/admin/ai/requests
GET    /api/v1/admin/ai/flags
GET    /api/v1/admin/ai/features
PATCH  /api/v1/admin/ai/features/:feature
```

Dashboard MVP:

- Requests theo feature/provider/model.
- Success/error/fallback rate.
- p50/p95 latency.
- Token usage và cost estimate nếu provider trả usage.
- Thumbs up/down rate.
- AI flag count và Admin override rate.
- Verified/corrected/rejected count.
- Feature toggle có reason và audit log.

MVP chưa thực hiện retrain hoặc deployment model từ dashboard.

---

## 9. Kế hoạch thực hiện một tuần

Backend được chia nhỏ và theo dõi chi tiết trong [`backend/docs/IMPLEMENTATION_PHASES.md`](../backend/docs/IMPLEMENTATION_PHASES.md). Mỗi phase có prompt độc lập trong `backend/docs/prompts/` và phải kết thúc bằng một commit riêng. Lịch theo ngày dưới đây là góc nhìn phối hợp FE/BE, không thay thế phase gate.

Kế hoạch giả định team có thể chia ít nhất hai luồng FE/BE. Nếu chỉ có một developer, phải giảm phạm vi theo thứ tự P2 rồi P1 ở mục 10.

| Ngày | Backend phases mục tiêu | Ghi chú                                                                |
| ---- | ----------------------- | ---------------------------------------------------------------------- |
| 0    | 00                      | Foundation và contract trước mọi feature                               |
| 1    | 01–03                   | Auth trước; Profile/Diet, Catalog có thể tách branch sau Auth          |
| 2    | 04–06                   | Content trước; Search và Community sau Content                         |
| 3    | 07–08                   | Contributor trước Moderation                                           |
| 4    | 09–10                   | Behavior trước Meal Planner                                            |
| 5    | 11–12, 15               | Chat trước Sharing/Verification; Governance sau Moderation/Chat/Review |
| 6    | 13–14                   | Restaurant trước notification event cuối cùng                          |
| 7    | 16                      | Chỉ hardening, không thêm feature                                      |

### Ngày 0 — Freeze contract

- Đưa SRS chuẩn về `/docs/SRS.md` và đánh dấu SRS cũ là deprecated/reference.
- Chốt enum, state machine, response/error format.
- Tạo OpenAPI skeleton cho Slice 0–4.
- Chốt wireframe các màn hình chính.
- Tạo project board theo từng vertical slice.

**Exit:** Không còn mâu thuẫn Mongo/Postgres, Member/Authorized User hoặc `veganType` cũ.

### Ngày 1 — Foundation + Auth/Profile

Backend:

- Scaffold Express TypeScript, Prisma, PostgreSQL.
- Migration identity/profile/diet.
- Auth, refresh rotation, RBAC và seed users.
- Swagger/OpenAPI.

Frontend:

- Đồng bộ Swagger.
- Thay product demo bằng navigation khung.
- Login/register/profile/onboarding.

**Demo cuối ngày:** đăng nhập bốn account seed, sửa profile và xem BMI/TDEE.

### Ngày 2 — Content + Community

Backend:

- Category, Post, Recipe, Ingredient, Comment, Vote, Rating, Bookmark.
- Cloudinary signature và search normalized.

Frontend:

- Home/search/detail/create/edit/my-content.
- Comment/vote/rating/bookmark.

**Demo cuối ngày:** Guest search/xem; Member tạo recipe và comment; video qua YouTube URL.

### Ngày 3 — Contributor + Moderation + Admin core

Backend:

- Contributor application/profile.
- Post revision/state machine.
- Review queue, report và moderation audit.
- Admin users/categories/comments.

Frontend:

- Contributor apply/review.
- Admin user/content/report/category screens.

**Demo cuối ngày:** Member post pending; Contributor approve; Admin hide/restore và xem audit.

### Ngày 4 — Meal Planner + Behavioral MVP

Backend:

- Health calculation service.
- Meal plan generator và swap.
- Behavior event ingestion, scoring và explanation.

Frontend:

- Health/diet input hoàn chỉnh.
- Meal plan week view, swap và shopping list.
- “Gợi ý cho bạn” kèm lý do.

**Demo cuối ngày:** hai user có behavior khác nhau nhận ranking khác nhau nhưng vẫn qua cùng hard constraints.

### Ngày 5 — Chatbot + AI governance

Backend:

- AI provider adapter, streaming SSE, quota và fallback.
- Chat history/feedback/share.
- AI logs, feature config và verification.
- Rule moderation tạo `ai_flags`.

Frontend:

- Chat UI streaming.
- Public chat/verification UI.
- Admin AI metrics và feature toggle.

**Demo cuối ngày:** chat streaming; expert correct output; Admin xem log và tắt/bật chatbot.

### Ngày 6 — Maps + Integration

Backend:

- Restaurant seed/submission/moderation.
- Places/Geocoding proxy và cache.

Frontend:

- Map/list, location permission, manual address fallback.
- Food-to-shop suggestion.

Toàn team:

- Chạy critical E2E flows.
- Fix API/mapper contract mismatch.

### Ngày 7 — Hardening và demo rehearsal

- Rà ownership và RBAC cho mọi mutation.
- Rà empty/loading/error/429/provider-down/map-down behavior.
- Seed demo dataset.
- Kiểm tra accessibility, mobile layout và Vietnamese labels.
- Build production FE/BE.
- Chuẩn bị demo script và fallback data.

Không thêm feature mới trong ngày 7.

---

## 10. Ưu tiên khi thiếu thời gian

### P0 — Không được cắt

- OpenAPI và response contract.
- Auth/RBAC/ownership.
- Profile/diet/allergy.
- Content CRUD/search/view.
- Comment/vote.
- Admin moderation cơ bản.
- Rule Meal Planner.
- Chatbot + disclaimer + quota.
- Database migration và seed.

### P1 — Giảm độ sâu nhưng vẫn phải có lát cắt chạy được

- Behavioral recommendation.
- Contributor verification.
- Maps hybrid.
- Admin AI metrics/feature toggle.
- Notifications.
- Rating/bookmark/related mixed content.

### P2 — Có thể chuyển sang iteration kế tiếp sau khi được sign-off

- Public chat sharing.
- Restaurant submission bởi Member.
- Shopping-list unit conversion nâng cao.
- Bulk moderation.
- Google OAuth nếu email/password đã ổn nhưng OAuth setup bị chặn.

CV, STT, wearable và full GenAI không thuộc backlog một tuần; chúng nằm trong Phase 2 chứ không phải P2 của tuần này.

---

## 11. Verification strategy

### 11.1 Backend

- Không duy trì automated unit hoặc integration test suite cho các backend phase.
- Gate bắt buộc: `npm run lint`, `npm run typecheck`, `npm run build`.
- Contract thay đổi phải regenerate OpenAPI và sync frontend catalog.
- Security/business review vẫn bao phủ IDOR, role escalation, self-approve, forged guest ID, upload MIME/size và các deterministic business rule quan trọng trong code/schema review.

### 11.2 Frontend

- Mapper tests cho mọi DTO mới.
- Component state: loading/error/empty/success.
- Form validation cho profile, recipe, comment, Contributor application.
- Auth refresh after reload.

### 11.3 Critical E2E scenarios

1. Guest search recipe/video → mở detail → hết chatbot quota → thấy CTA register.
2. Member đăng ký → nhập profile/diet → tạo recipe → post pending.
3. Contributor duyệt recipe của Member nhưng không duyệt được bài của chính mình.
4. Admin-approved Nutrition Expert correct một AI answer; Experienced Contributor bị 403 khi thử cùng action.
5. User có allergy không nhận recipe chứa allergen trong search/recommendation/meal plan.
6. Admin xử lý report → hide → restore và audit trail đầy đủ.
7. User từ chối location → nhập địa chỉ → vẫn xem được danh sách quán.
8. AI provider lỗi → core app vẫn chạy và chatbot trả fallback.

---

## 12. Definition of Done

Một slice chỉ hoàn thành khi:

- AC tương ứng đã pass.
- OpenAPI được cập nhật trước hoặc cùng PR backend.
- Migration và seed chạy được từ database rỗng.
- Backend có validation, authorization và error code rõ ràng.
- Frontend có DTO + Model + Mapper, không dùng `any`.
- UI có loading/error/empty state và usable ở mobile width.
- Backend lint/typecheck/build pass; frontend checks áp dụng khi có consumer change.
- Không commit secret hoặc log PII/health data.
- Build frontend và backend pass.
- Có demo path dùng seed data.

Release MVP chỉ được chấp nhận khi tám E2E scenario ở mục 11.3 đều pass.

---

## 13. Phase 2 design direction

### 13.1 Full GenAI behavioral meal planner

Phát triển từ behavioral MVP, không thay hard constraints:

```text
Behavior events
→ user preference profile / embeddings
→ candidate retrieval từ recipe DB
→ hard constraint filter
→ learned/AI ranking
→ LLM composition + explanation
→ deterministic validator
→ feedback loop
```

LLM không được tạo recipe ngoài DB như một item có thể click nếu chưa qua validation. Mọi output lưu `modelId`, inputs đã dùng và reason để giải trình.

### 13.2 Ingredient recognition

- Upload ảnh → vision provider/model adapter.
- Trả ingredient candidates + confidence.
- User xác nhận/sửa trước khi dùng vào Meal Planner.
- Freshness luôn hiển thị dưới dạng ước lượng, không phải kết luận an toàn thực phẩm.

### 13.3 Video summarization

- Upload/YouTube URL → audio extraction → STT → chunk → structured summary.
- Job async có trạng thái `QUEUED/RUNNING/COMPLETED/FAILED`.
- Summary cần nguyên liệu, bước, timestamps và confidence/source label.

### 13.4 Health integration

- iOS: HealthKit.
- Android: Health Connect; không xây mới trên Google Fit legacy.
- Sensor fallback chỉ bổ sung steps/activity/distance.
- Height/weight lấy từ health platform hoặc nhập tay; không tính BMI chỉ từ sensor.
- Consent theo từng data type, revoke và delete flow đầy đủ.

### 13.5 Mở rộng tradition

Không thêm enum trực tiếp vào nhiều bảng. Chuyển sang catalog/rule table nếu số tradition tăng:

```text
diet_traditions
diet_tradition_rules
recipe_tradition_compatibility
```

Mỗi rule mới cần nguồn, reviewer chuyên môn, ngày hiệu lực và version.

### 13.6 Contributor credential verification

- Cho phép upload certificate/license với MIME, size và access control riêng.
- Admin xác minh và lưu `credentialStatus`, reviewer, thời điểm hết hạn nếu có và audit trail.
- Tách rõ badge “Admin-approved Contributor” với badge “Credential verified”.
- Nếu credential hết hạn hoặc bị thu hồi, hệ thống ngừng quyền verification mới nhưng giữ audit của verification cũ kèm trạng thái reviewer tại thời điểm thực hiện.

---

## 14. Rủi ro chính

| Rủi ro                       | Giảm thiểu                                                            |
| ---------------------------- | --------------------------------------------------------------------- |
| Scope vượt một tuần          | Giữ P0, giảm chiều sâu P1, không kéo Phase 2 vào sprint               |
| FE/BE lệch contract          | OpenAPI-first, sync Swagger mỗi ngày                                  |
| AI provider/model thay đổi   | Adapter + model config, không hard-code                               |
| Meal Planner thiếu dữ liệu   | Seed recipe có nutrition/food-group/allergen đầy đủ                   |
| Rule tradition sai           | Rule có version; explicit exclusions ưu tiên; cần reviewer chuyên môn |
| AI moderation false positive | Chỉ flag/quarantine, không tự hard-delete                             |
| Google quota/lỗi             | Cache + restaurant DB nội bộ + list fallback                          |
| Permission bug               | Permission matrix + backend authorization review từng role            |
| Health/privacy risk          | MVP manual, consent rõ ràng, không log dữ liệu nhạy cảm               |

---

## 15. Deliverables của iteration đầu

- `docs/SRS.md` đã hợp nhất và có traceability matrix.
- `docs/IMPLEMENTATION_PLAN.md` — tài liệu này.
- `backend/docs/IMPLEMENTATION_PHASES.md` và bộ prompt session độc lập trong `backend/docs/prompts/`.
- `backend/openapi.yaml` hoặc `/api-docs.json` sinh từ code.
- Prisma schema + migrations + seed.
- Backend chạy được bằng một lệnh dev.
- Frontend đã thay feature `product` mẫu bằng feature domain thật.
- Critical demo checklist và demo script.
- `.env.example` cho frontend/backend không chứa secret.

Thứ tự bắt đầu bắt buộc: **hợp nhất SRS → OpenAPI Slice 0–2 → Prisma schema → scaffold backend → UI integration**.
