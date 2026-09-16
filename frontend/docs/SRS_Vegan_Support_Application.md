# SRS — Ứng Dụng Hỗ Trợ Người Ăn Chay (Vegan Support Application)

**Version:** 1.5-aligned | **Ngày gốc:** 10/09/2026 | **Cập nhật:** 15/09/2026
**Trạng thái:** 🔶 REFERENCE — đã căn chỉnh theo `docs/IMPLEMENTATION_PLAN.md` v1.1
**Stack:** Next.js 16 · Node/Express + TypeScript · PostgreSQL + Prisma · AI Provider Adapter · Cloudinary + YouTube URL · Google Maps Platform

---

> **📌 Nguồn sự thật (Single Source of Truth):**
> File này **không còn là nguồn sự thật duy nhất**. Nguồn sự thật là:
>
> 1. `docs/IMPLEMENTATION_PLAN.md` v1.1 — scope, business rules BL-01..BL-15, state machines, slices.
> 2. `backend/docs/IMPLEMENTATION_PHASES.md` + `backend/docs/prompts/` — phase dependency và gate.
> 3. `frontend/docs/BACKEND_INTEGRATION.md` + OpenAPI `/api-docs.json` — contract tích hợp thực thi được.
> 4. `docs/SRS.md` — sau khi hợp nhất theo Ngày 0 của IMPLEMENTATION_PLAN.
>
> File này chỉ là **tài liệu tham chiếu frontend**, mô tả lại yêu cầu theo ngôn ngữ UC/FR để dev FE dễ đọc. Khi lệch với IMPLEMENTATION_PLAN, IMPLEMENTATION_PLAN thắng. Theo D12: Product SRS đặt ở `/docs`, tài liệu frontend chỉ mô tả kỹ thuật.
>
> **Changelog v1.4 → v1.5-aligned (15/09/2026 — căn chỉnh IMPLEMENTATION_PLAN v1.1):**
>
> - Roles: bỏ `AUTHORIZED_USER`, dùng `MEMBER`; `CONTRIBUTOR` tách 2 `ContributorType`: `EXPERIENCED_PRACTITIONER` / `NUTRITION_EXPERT`. Chỉ `NUTRITION_EXPERT` + Admin được verify/correct AI dinh dưỡng.
> - Bỏ `veganType` 5 giá trị và `dietSchool PHAT_GIAO/DAO_GIAO/KHONG_TON_GIAO`. Dùng `dietPattern VEGAN|LACTO_OVO` + `practiceSchedule PERMANENT|PERIODIC` + `tradition NONE|BUDDHIST|CHRISTIAN` + rule confirmation có version/toggle (BL-02/BL-03).
> - DB: bỏ `MongoDB Atlas`, dùng `PostgreSQL + Prisma`. Bỏ `Gemini 1.5 Flash` hard-code, dùng `AI Provider Adapter` cấu hình qua env (`AI_PROVIDER/AI_MODEL_CHAT/AI_MODEL_MODERATION`).
> - Search: bỏ `Elasticsearch`, dùng Postgres normalized không dấu. Upload: bỏ `S3 pre-signed/multipart/HLS/DLQ/SSE transcode`, dùng `Cloudinary signature` (`POST /api/v1/uploads/signature`) + YouTube URL.
> - Health MVP: chỉ nhập tay (`MANUAL`), công thức BMI/BMR Mifflin-St Jeor/TDEE 5 mức activity. HealthKit/Health Connect/sensor/wearable/WHtR-sync thuộc Phase 2.
> - Moderation: bỏ `auto REJECTED khi risk >0.8`. Chỉ `flag/QUARANTINED` tạm, không hard-delete, Admin quyết định cuối (BL-06).
> - Meal Planner: tolerance `±15% → ±20% + warning`, overlap nguyên liệu là ranking không phải `60%` hard, lặp tối đa 2 + warning, slot hết candidate để `UNFILLED`, swap `±100kcal` (BL-07). Behavioral MVP **IN scope** với scoring giải thích được, không phải DEFER.
> - Chat: quota chỉ trừ sau provider success, reset `00:00 Asia/Ho_Chi_Minh`, guest `signed cookie + IP`, share từng answer, 1 active verification/target else `409` (BL-09).
> - Contributor MVP: **không** upload/xác minh chứng chỉ, không nhãn `đã xác minh chứng chỉ`, chỉ `được Admin duyệt`. Chứng chỉ thuộc Phase 2.
> - API prefix thống nhất `/api/v1`, envelope success/error, pagination `limit<=100`, UUID, ISO 8601 UTC.

---

## Mục lục

1. [Tổng quan sản phẩm](#1-tổng-quan-sản-phẩm)
2. [Người dùng mục tiêu và Personas](#2-người-dùng-mục-tiêu-và-personas)
3. [Vai trò và Phân quyền RBAC](#3-vai-trò-và-phân-quyền-rbac)
4. [Mô hình ăn chay và diet rules](#4-mô-hình-ăn-chay-và-diet-rules)
5. [Scope MVP vs Phase 2](#5-scope-mvp-vs-phase-2)
6. [Yêu cầu chức năng chi tiết FR](#6-yêu-cầu-chức-năng-chi-tiết-fr)
7. [Yêu cầu phi chức năng NFR](#7-yêu-cầu-phi-chức-năng-nfr)
8. [Data và Tích hợp bên thứ ba](#8-data-và-tích-hợp-bên-thứ-ba)
9. [Business Rules đã chốt](#9-business-rules-đã-chốt)
10. [Luồng người dùng quan trọng](#10-luồng-người-dùng-quan-trọng)
11. [Rủi ro và Roadmap](#11-rủi-ro-và-roadmap)
12. [Hướng dẫn Dev và Definition of Done](#12-hướng-dẫn-dev-và-definition-of-done)

---

## 1. Tổng quan sản phẩm

### 1.1 Value Proposition

> **"Ứng dụng hỗ trợ người trung niên duy trì chế độ ăn chay/bán chay lành mạnh thông qua gợi ý món ăn, thông tin dinh dưỡng dễ hiểu, thực đơn cá nhân hóa, AI Assistant và cộng đồng nội dung được kiểm duyệt."**

### 1.2 Bài toán cần giải

| #   | Vấn đề                                                    | Giải pháp                                             |
| --- | --------------------------------------------------------- | ----------------------------------------------------- |
| 1   | Khó cân bằng dinh dưỡng, BMI khó hình dung                | Profile + BMI/BMR/TDEE + AI Chatbot giải thích        |
| 2   | Khó tìm công thức phù hợp loại chay và nguyên liệu sẵn có | Recipe Search + Filter theo diet rules + Meal Planner |
| 3   | Thông tin ăn chay phân tán, khó kiểm chứng                | Cộng đồng + Contributor duyệt + Admin moderation      |

### 1.3 Vòng lặp sản phẩm

```
Tìm công thức (Search)
  → Xem chi tiết + gợi ý liên quan
  → Hỏi AI dinh dưỡng (Chatbot)
  → Lên thực đơn tuần (Meal Planner)
  → Tìm quán lân cận (Map)
  → Đăng Blog/Video + Comment/Vote
  → (lặp lại)
```

Admin và Contributor giữ vòng lặp sạch: duyệt bài, kiểm chứng AI, quản user.

### 1.4 Kiến trúc kỹ thuật (theo IMPLEMENTATION_PLAN §3)

```
[Web Next.js 16 / React 19 : frontend/]
  → [API: backend/ Node/Express + TypeScript · /api/v1 · REST + SSE]
       ├─ PostgreSQL + Prisma (data chính)
       ├─ Redis-compatible (cache + rate-limit)
       ├─ AI Provider Adapter (model qua env, không hard-code)
       ├─ Cloudinary (ảnh + video) + YouTube URL embed
       └─ Google Maps Platform (Maps JS + Places + Geocoding, Directions qua Universal Link)
```

> ⚠️ **Bảo mật:** Frontend KHÔNG gọi AI/Maps trực tiếp bằng secret. Mọi API key ở Backend `.env`. Frontend chỉ gọi `backend/api`. Maps browser key giới hạn referrer, Places/Geocoding server key chỉ ở backend.

### 1.5 Cấu trúc thư mục

**Frontend (`frontend/src/`) — theo `ARCHITECTURE.md`:**

| Thư mục                             | Mục đích                                                                                                                                              |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`                              | Routes: `(auth)/login,register` · `(main)/home,recipes,restaurants,meal-plan,chat` · `admin/`                                                         |
| `features/`                         | Mỗi module: `types/*.dto.ts`, `types/*.model.ts`, `mappers/*.mapper.ts`, `api/*.api.ts`, `queries/*.queries.ts`, `schemas/*.schema.ts`, `components/` |
| `store/` (zustand)                  | Client-state only: auth/user/theme. Không cache server-state                                                                                          |
| `lib/`                              | `axios.ts` · `server-fetch.ts` · `query-client.ts` · `mapper/` · `api-error.ts`                                                                       |
| `common/constants/api-endpoints.ts` | Mọi endpoint tập trung, cấm hard-code URL trong feature                                                                                               |

**Backend (`backend/src/`) — theo IMPLEMENTATION_PLAN §3.1:**

```
route → validation (Zod) → controller → service → repository/Prisma
modules/ auth, users, diets, content, community, contributors,
  moderation, meal-plans, recommendations, chat, restaurants,
  ai-governance, notifications + openapi/
```

### 1.6 KPI

| KPI                 | Mục tiêu                     |
| ------------------- | ---------------------------- |
| Search có kết quả   | >85%, <800ms                 |
| Chatbot first token | <2s                          |
| Bản đồ 50 quán load | <2s                          |
| Tạo meal plan       | <3s                          |
| Bảo mật             | Không lộ API key ra frontend |

---

## 2. Người dùng mục tiêu và Personas

> **Phân biệt:** Persona = đối tượng định vị sản phẩm. Role = quyền trong hệ thống. Không trộn lẫn.

### 2.1 Primary Persona — Người trung niên (~40–60 tuổi)

| Thuộc tính | Chi tiết                                                      |
| ---------- | ------------------------------------------------------------- |
| Độ tuổi    | ~40–60 tuổi                                                   |
| Bối cảnh   | Quan tâm sức khỏe, chế độ ăn, lối sống lành mạnh              |
| Hành vi    | Ăn chay, ăn bán chay, hoặc đang muốn bắt đầu                  |
| Công nghệ  | Dùng smartphone nhưng ưu tiên giao diện đơn giản, ít thao tác |
| Động lực   | Chọn món phù hợp, hiểu dinh dưỡng, lập thực đơn dễ dàng       |

**Pain Point → Feature Mapping:**

| Pain Point                         | Feature                    |
| ---------------------------------- | -------------------------- |
| Không biết xây dựng bữa ăn đa dạng | FR-A02 Meal Planner        |
| Khó tìm món phù hợp loại chay      | FR-R02 Search + Filter     |
| Khó hiểu chỉ số dinh dưỡng         | FR-U02 BMI; FR-A01 Chatbot |
| Thông tin phân tán, khó tin        | FR-C01; FR-U04 Moderation  |
| Không thích thao tác phức tạp      | NFR-UX-01, 02, 03          |
| Muốn tìm quán gần nhà              | FR-L01 Nearby Restaurant   |

### 2.2 Secondary Persona — Người trẻ (~18–39 tuổi)

Được hỗ trợ đầy đủ nhưng không phải đối tượng định vị chính. Dùng được toàn bộ tính năng.

### 2.3 Supporting Personas

| Persona         | Mô tả                                                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Contributor** | 2 loại (BL-01): `EXPERIENCED_PRACTITIONER` và `NUTRITION_EXPERT`. Đóng góp, duyệt bài Member, chỉ `NUTRITION_EXPERT` được verify AI |
| **Admin**       | Quản lý hệ thống, quyết định moderation cuối cùng                                                                                   |

---

## 3. Vai trò và Phân quyền RBAC

> Nguồn: IMPLEMENTATION_PLAN §6 + BL-01, BL-05, BL-06, BL-09.

### 3.1 Sơ đồ vai trò

```
Guest ──(register, optional contributorRequest)──► MEMBER (+ application PENDING)
Member ──(apply + Admin duyệt)──► CONTRIBUTOR (EXPERIENCED_PRACTITIONER | NUTRITION_EXPERT)

Admin = system role riêng biệt, KHÔNG phải tiến hóa từ Contributor
```

- Đăng ký có chọn Contributor chỉ tạo application `PENDING`; account/JWT vẫn `MEMBER`.
- Mỗi user tối đa 1 application `PENDING`. `requestedType` không vào access token, không dùng để mở route.
- Approve: `role=CONTRIBUTOR`, tạo `contributor_profile` (`contributorType`, `approvalBasis`, `approvedAt/By`), revoke/rotate token cũ.
- Reject: vẫn Member, nhận lý do, apply lại sau 30 ngày. Đổi type phải apply lại.
- MVP không có upload/xác minh chứng chỉ. UI chỉ ghi `được Admin duyệt`, cấm ghi `đã xác minh chứng chỉ`.

### 3.2 Mô tả từng vai trò

#### Guest (Chưa đăng nhập)

- Xem/search content `PUBLISHED`, xem quán, xem chatlog công khai.
- AI Chatbot giới hạn + signed anonymous cookie + IP/device rate limit. History tối đa 7 ngày, không public share, không dùng cho personalization.
- Không thể: comment, vote, rating, bookmark, tạo content, Meal Planner.

#### Member (Đã đăng ký)

- Comment, upvote toggle, rating recipe (`taste` + `difficulty` 1–5, upsert), bookmark (recipe + video only).
- Tạo content → `PENDING_REVIEW` (member submit) hoặc `FLAGGED`/`PUBLISHED` theo moderation. Sửa published post tạo `post_revision PENDING_REVIEW`, bản cũ vẫn hiển thị.
- Dùng Meal Planner rule-based + behavioral ranking (có consent riêng), Report, Thêm nhà hàng (`PENDING`), Chia sẻ từng AI answer (không share cả session).
- Contributor application: 1 `PENDING` duy nhất, chờ duyệt vẫn dùng quyền Member.

#### Contributor (Member được Admin duyệt)

Không có quyền chứng chỉ MVP. Phân quyền theo type:

- `EXPERIENCED_PRACTITIONER`: tạo content auto-publish nếu không flag; review recipe/blog/video của Member (không self-approve); **không** verify/correct AI dinh dưỡng.
- `NUTRITION_EXPERT`: có quyền trên + verify/correct AI nutrition output sau khi Admin approve đúng type.
- Đề xuất category mới (proposal, Admin tạo thật). Không tự duyệt bài của chính mình.

#### Admin (System role)

- Duyệt/reject/hide/restore content, restaurant, category, Contributor application. Review report/AI flag → `NO_VIOLATION/WARN/HIDE/RESTORE/DEMOTE/BAN`.
- Quản user (`ACTIVE/LOCKED/BANNED/DELETED`), comment, AI feature toggle (có reason + audit). Override/remove verification.
- Actor cuối cùng mọi quyết định vi phạm. Content Admin tự tạo vẫn chạy validation + audit.

### 3.3 Permission Matrix (rút gọn từ PLAN §6)

| Feature                      |  Guest   | Member  |     Experienced     |  Nutrition Expert   |      Admin      |
| ---------------------------- | :------: | :-----: | :-----------------: | :-----------------: | :-------------: |
| Xem/search content published |    ✅    |   ✅    |         ✅          |         ✅          |       ✅        |
| Chatbot                      | Giới hạn |   ✅    |         ✅          |         ✅          |       ✅        |
| Comment/vote/rating/bookmark |    ❌    |   ✅    |         ✅          |         ✅          |       ✅        |
| Tạo content                  |    ❌    | Pending | Auto nếu không flag | Auto nếu không flag | Auto (có audit) |
| Duyệt bài Member             |    ❌    |   ❌    |         ✅          |         ✅          |       ✅        |
| Verify AI dinh dưỡng         |    ❌    |   ❌    |         ❌          |         ✅          |       ✅        |
| Quản user/category/report    |    ❌    |   ❌    |         ❌          |         ❌          |       ✅        |
| Hide/remove/ban cuối cùng    |    ❌    |   ❌    |         ❌          |         ❌          |       ✅        |
| Bật/tắt AI feature           |    ❌    |   ❌    |         ❌          |         ❌          |       ✅        |

### 3.4 Luật cứng

- Mọi `POST/PUT/DELETE` cần auth. Authorization ở backend; frontend guard chỉ UX.
- **Report ≠ Violation. AI flag ≠ Report ≠ Violation.** 1 user/target chỉ 1 report chưa resolved. Ngưỡng escalate tính theo reporter khác nhau; ≥5 reporter khác nhau → `HIGH`, không tự hide.
- Risk thấp/TB: giữ visibility + vào queue. Risk cao (spam rõ/health gây hại): `QUARANTINED` tạm, Admin review, không hard-delete.
- Contributor **không** self-approve/self-verify. Admin **là actor cuối**.
- Xóa user (soft-delete + `DELETED`): revoke sessions, anonymize public content, lên lịch xóa health/chat/private behavior 30 ngày. Giữ audit không chứa health/raw PII.
- Ban: `hidden` tạm với `USER_BANNED`. Unban chỉ restore nội dung bị ẩn duy nhất do `USER_BANNED`.
- Quota AI reset `00:00 Asia/Ho_Chi_Minh`. Quota chỉ trừ sau provider success; retry/validation/provider failure không trừ.

---

## 4. Mô hình ăn chay và diet rules

> Nguồn: IMPLEMENTATION_PLAN §4.1 + BL-02, BL-03, BL-04. Thay thế toàn bộ `veganType` / `dietSchool` cũ.

### 4.1 Enums MVP

```text
Role              MEMBER | CONTRIBUTOR | ADMIN
ContributorType   EXPERIENCED_PRACTITIONER | NUTRITION_EXPERT
DietPattern       VEGAN | LACTO_OVO
PracticeSchedule  PERMANENT | PERIODIC
Tradition         NONE | BUDDHIST | CHRISTIAN
HealthDataSource  MANUAL
```

- `NONE` là trung lập, không phải tôn giáo. Không suy luận tradition từ diet pattern. `VEGAN + PERIODIC + CHRISTIAN` hợp lệ nếu không vi phạm rule.
- Không hard-code mọi user cùng tradition có cùng danh sách kiêng. Backend trả rule mặc định có version; user xác nhận/toggle từng rule.

### 4.2 Luồng xác nhận rule (BL-02)

```
User chọn dietPattern/practiceSchedule/tradition
→ POST /api/v1/diet-rules/preview
→ Backend trả rules {code,label,description,defaultEnabled,hardConstraint,source,version}
→ User toggle từng rule → PUT /api/v1/users/me/diet-preferences (snapshot + confirmedAt)
→ Nếu PERIODIC: PUT /api/v1/users/me/diet-schedule (YYYY-MM-DD, Asia/Ho_Chi_Minh)
```

- Version mới không âm thầm đổi plan cũ; UI yêu cầu review ở lần sửa Profile tiếp theo.
- Allergy/exclusion quản lý riêng, luôn hard, không phải toggle tradition. Tắt tradition rule không tắt được allergy/diet-pattern.
- Backend tính effective rules; frontend không tự suy luận compatibility.

### 4.3 Độ ưu tiên khi lọc

```text
1. Allergy active — hard
2. User ingredient exclusion active — hard
3. Diet pattern — hard
4. Tradition rule đã bật — theo hardConstraint
5. Practice schedule — quyết định ngày áp dụng
6. Behavioral preference — chỉ ranking
7. Popularity/rating — chỉ ranking
```

### 4.4 Periodic schedule (BL-03)

- `PERMANENT`: rules đã bật áp dụng mọi ngày. `PERIODIC`: user chọn ngày trên calendar, lưu local date `Asia/Ho_Chi_Minh` (PostgreSQL `DATE`).
- MVP không tính lịch âm/lễ tôn giáo. Generate mà thiếu ngày → `DIET_SCHEDULE_REQUIRED` + danh sách ngày để UI yêu cầu chọn.
- Ngoài ngày periodic, allergy/exclusion/diet pattern vẫn áp dụng. Đổi schedule không sửa plan đã lưu; phải regenerate version mới.

### 4.5 Tương quan với thuật ngữ cũ (deprecated)

| Thuật ngữ cũ (không dùng)                                                | Thay bằng (MVP)                                                                                          |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `veganType: thuan-thuc-vat/chay-truong/chay-ky/lacto-ovo/eat-clean-chay` | `dietPattern + tradition rules + exclusions/allergens`                                                   |
| `dietSchool: PHAT_GIAO/DAO_GIAO/KHONG_TON_GIAO`, `vegetarianMode`        | `tradition NONE/BUDDHIST/CHRISTIAN` + `practiceSchedule` + rule toggle                                   |
| `avoidTags` tự khai báo là hard constraint duy nhất                      | Author tags chỉ metadata; compatibility tính từ canonical ingredients + allergen/diet/tradition metadata |

---

## 5. Scope MVP vs Phase 2

> Nguồn: IMPLEMENTATION_PLAN §2. MVP = lát cắt dọc chạy UI→API→DB.

### 5.1 In-Scope MVP (14 mục)

1. Đăng ký/đăng nhập/refresh/logout + RBAC.
2. Hồ sơ, BMI/BMR/TDEE nhập tay + diet preferences.
3. CRUD Recipe/Blog/Video; upload Cloudinary hoặc YouTube URL.
4. Search/filter + related `recipes/blogs/videos` riêng.
5. Comment/vote/rating/bookmark.
6. Contributor application + phân loại + duyệt.
7. Moderation queue content/report/AI flag.
8. Meal Planner 7 ngày rule + behavioral ranking giải thích được.
9. Behavioral recommendation MVP (consent riêng, lookback 30d, recency decay).
10. AI Nutrition Chatbot (quota, disclaimer cố định, feedback, verification).
11. Bản đồ quán gần vị trí hiện tại + geocode + gợi ý theo món.
12. Admin user/category/content/comment/report.
13. Admin AI dashboard tối thiểu + feature toggle (có reason + audit).
14. Notification in-app (90 ngày, dedupe `eventKey`).

### 5.2 Out-of-Scope (Phase 2)

- GenAI Meal Planner toàn phần, embedding/vector search, preference dài hạn.
- CV nhận diện nguyên liệu/độ tươi, STT + tóm tắt video.
- HealthKit/Health Connect/wearable/sensor, seasonal/regional nâng cao.
- Thêm tradition/rule mới sau review chuyên môn, push/realtime/mobile native.
- Model evaluation/drift/rollback nâng cao, thanh toán/marketplace, chat realtime, chẩn đoán bệnh, tự train foundation model.

> Không upload video >100MB ở MVP demo, không transcode HLS riêng. Không tư vấn bệnh nặng — chung + disclaimer.

---

## 6. Yêu cầu chức năng chi tiết (FR)

> **Ký hiệu AC:** `Given When Then`. API prefix `/api/v1`. Envelope và pagination theo §7. Chi tiết BL xem IMPLEMENTATION_PLAN §5.

---

### Module 1: User & Community

#### FR-U01 — Auth (Slice 1, Phase 01)

**AC:**

- `Given` `/register` email + pass ≥8 ký tự `When` submit kèm optional `contributorRequest{requestedType,experience,referenceLinks}` `Then` tạo user `role=MEMBER` + application `PENDING`, JWT không chứa `requestedType`, auto login <3s.
- `Given` JWT hết hạn `When` refresh cookie còn hạn `Then` rotation, reuse revoke cả family, không bắt login lại.
- `Given` chọn Login Google `When` OAuth OK `Then` tạo/link account (P2 nếu OAuth chặn: giữ email/pass, giảm scope theo PLAN §10 P2).

**API:** `POST /api/v1/auth/register | login | refresh | logout` · `GET/PATCH /api/v1/users/me`

**Edge:** Email trùng → `EMAIL_ALREADY_EXISTS` 409; Sai pass nhiều → lock + captcha; Mất mạng → giữ draft.

#### FR-U02 — Profile + BMI + Diet (Slice 1, Phase 02)

**AC:**

- `Given` nhập height/weight/age/sex/activity `When` save `Then` hiện BMI + phân loại châu Á + BMR + TDEE, FE <500ms, nguồn `MANUAL`.
- Công thức MVP: `BMI=kg/m²`; `BMR Nam=10×kg+6.25×cm−5×tuổi+5`, `Nữ −161`; `TDEE=BMR×[1.2|1.375|1.55|1.725|1.9]`, tròn 2 decimals. Thiếu age/sex/height/weight/activity → không generate meal plan, trả `HEALTH_PROFILE_INCOMPLETE`.
- `Given` bật allergy/exclusion/diet rule `Then` Search/Related/Meal Planner/Recommendation lọc hard trước ranking.

**API:** `GET/PATCH /api/v1/users/me` · `PUT /api/v1/users/me/health-profile` · `POST /api/v1/diet-rules/preview` · `PUT /api/v1/users/me/diet-preferences` · `PUT /api/v1/users/me/diet-schedule`

**Edge:** BMI <12 hoặc >45 → cảnh báo; BMI <16 hoặc >35 → disclaimer trong Meal Planner.

#### FR-U03 — Comment, Vote & Rating & Bookmark (Slice 2, Phase 06)

**AC:**

- Comment ≤1000 ký tự trên post `PUBLISHED` → hiện ngay. Edit khi còn visible, cập nhật `editedAt`. Delete soft-delete, giữ placeholder nếu có reply. Reply tối đa 1 tầng.
- Vote: upvote toggle only, unique `(userId,postId)`.
- Rating chỉ `type=recipe`: `taste` + `difficulty` 1–5, upsert. Average tính từ active ratings, không tin cached client.
- Bookmark chỉ recipe/video, unique `(userId,postId)`. Comment bị Admin hide không tự restore.
- Guest bấm → modal login, sau login điền lại. Report: enum + mô tả ≤300 ký tự.

**API:** `GET/POST /api/v1/posts/:id/comments` · `PATCH/DELETE /api/v1/comments/:id` · `PUT/DELETE /api/v1/posts/:id/vote|bookmark` · `PUT /api/v1/posts/:id/rating` · `POST /api/v1/reports`

**Anti-spam:** 10 comments/phút · strip HTML · blacklist → hidden (không hard-delete).

#### FR-U04 — Admin Moderation & Report (Slice 3, Phase 08)

**AC:**

- Admin `/admin/moderation` → review queue posts/reports/AI flags (reason codes + risk score + provider/model), bulk approve, ghi audit, noti tác giả.
- Quyết định: **No Violation / Warn / Hide / Restore / Demote / Ban**. Reject bắt buộc reason. Mọi quyết định cần actor/timestamp/related reports/flags.
- Report ≥5 reporter khác nhau → escalate đỏ, SLA 48h. **Không tự hide**.
- Ban user ẩn post/comment visible với `USER_BANNED`; unban chỉ restore nhóm này.

**API:** `GET /api/v1/review-queue/posts` · `PATCH /api/v1/review-queue/posts/:id/approve|reject` · `POST /api/v1/reports` · `GET/PATCH /api/v1/admin/reports*` · `GET/PATCH /api/v1/admin/users*` · `GET/PATCH /api/v1/admin/comments*`

#### FR-U05a — Contributor Apply (Slice 3, Phase 07)

**AC:**

- `/profile/apply-contributor` → `requestedType EXPERIENCED_PRACTITIONER|NUTRITION_EXPERT` + experience ≤1000 ký tự + referenceLinks → application `PENDING`, Admin noti. **MVP không có upload chứng chỉ.**
- Admin approve/reject kèm `approvalBasis` + `reviewNote` ≤200 ký tự trong 72h.
- Approved → `role=contributor` + badge ngay + rotate token. Rejected → apply lại sau 30 ngày.

**API:** `POST /api/v1/contributor-applications` · `GET /api/v1/admin/contributor-applications` · `PATCH /api/v1/admin/contributor-applications/:id/review`

#### FR-U05b — Kiểm chứng AI (Slice 6, Phase 12)

**AC:**

- Chỉ chat answer **public** + đã share từng message. Xóa/ẩn public answer làm verification hết public nhưng giữ audit. Original answer không sửa trực tiếp; correction là record riêng.
- Chỉ `NUTRITION_EXPERT` đã duyệt + Admin. 1 active verification/target (`409 VERIFICATION_ALREADY_EXISTS` nếu trùng). Không self-verify. Admin override/remove cần reason.
- Hiển thị `✅ Được kiểm chứng / ⚠️ Đính chính bởi [Tên]` + thời điểm. Demote giữ audit cũ kèm trạng thái reviewer tại thời điểm đó.

**API:** `POST /api/v1/chat/messages/:id/verification` · `PATCH /api/v1/chat/messages/:id/share` · `GET /api/v1/chat/public`

---

### Module 2: Recipe & Media

#### FR-C01 — Contributor Duyệt Bài Member

- `/contributor/review` → list `PENDING_REVIEW/FLAGGED` của Member (không phải của mình).
- Approve → `PUBLISHED` + `reviewedBy`; Reject → `REJECTED` + bắt buộc `moderationReason`; Member nhận noti kèm lý do + link edit/resubmit.

#### FR-C02 — Content lifecycle (BL-05)

- Member submit → `PENDING_REVIEW`. Contributor submit → moderation; không flag → `PUBLISHED`, có flag → `FLAGGED`. Admin tạo vẫn validation + audit.
- Member sửa published → revision mới `PENDING_REVIEW`, bản cũ vẫn hiển thị. Contributor sửa → moderation lại, không flag thì publish revision mới.
- Owner delete soft-delete; public 404/410, Admin vẫn audit. Admin hide không xóa revision, restore được.

#### FR-R01 — Recipe / Blog / Video CRUD (Slice 2, Phase 04)

| Trường                                                                    | recipe                                        | blog | video    |
| ------------------------------------------------------------------------- | --------------------------------------------- | ---- | -------- |
| ingredients[] (canonical + displayName/amount/unit)                       | **BẮT BUỘC**                                  | ❌   | Optional |
| steps[]                                                                   | **BẮT BUỘC**                                  | ❌   | Optional |
| servings/cookTime/difficulty/nutrition (calo/protein/carbs/fat/fiber/B12) | **BẮT BUỘC tối thiểu để mealPlannerEligible** | ❌   | ❌       |
| Rating 2 chiều                                                            | ✅                                            | ❌   | ❌       |
| Bookmark                                                                  | ✅                                            | ❌   | ✅       |
| Dùng trong Meal Planner                                                   | ✅ nếu `PUBLISHED + mealPlannerEligible=true` | ❌   | ❌       |

- Ingredient nhập phải normalize không dấu + alias resolve (`NONE/EXACT/AMBIGUOUS`). Nhiều candidate → author chọn, AI không tự quyết hard constraint.
- Member recipe chưa map → `PENDING_REVIEW`. Contributor chưa map → publish được nếu moderation cho phép nhưng `mealPlannerEligible=false`.
- Media: `POST /api/v1/uploads/signature` → upload Cloudinary → tạo post bằng `coverUrl/videoUrl/youtubeUrl`. Validate MIME/size ở cả FE + BE.

**API:** `GET/POST /api/v1/posts` · `GET/PATCH/DELETE /api/v1/posts/:id` · `POST /api/v1/uploads/signature`

#### FR-R02 — Search + Filter + Related (Slice 2, Phase 05)

**AC:**

- Search `dau hu` → `đậu hũ` (normalize BE), rank title 3× + ingredients 2× + tags, <800ms, pagination `limit<=100`.
- Filter hard allergy/exclusion/dietPattern/tradition đã bật trước ranking. Filter kết hợp type/category/cookTime/difficulty/ingredients.
- Detail → Related `{recipes[], blogs[], videos[]}` (cùng category + overlap nguyên liệu + cùng effective rules).
- 0 kết quả → empty-state + popular + nút Hỏi AI.

**API:** `GET /api/v1/posts?q=&type=&category=&...` · `GET /api/v1/posts/:id/related`

#### FR-R03 — Category (Slice 4, Phase 03)

- Type: `FOOD_TYPE|RECIPE_GROUP|CONTENT_TOPIC`. Tối đa 2 tầng; parent/child cùng type trừ migration duyệt.
- Slug unique trong parent/type. Contributor chỉ proposal; Admin tạo/approve thật.
- Xóa category đang dùng bắt buộc `replacementId` cùng type/tầng trong transaction; category cũ archive, không hard-delete.
- Seed: Món chính · Canh/Súp · Salad · Bún/Mì · Bánh · Đồ uống · Món chay giả mặn.

**API:** `GET /api/v1/categories` · `POST/PATCH/DELETE /api/v1/admin/categories*?replacementId=`

---

### Module 3: Location

#### FR-L01 — Quán Lân Cận (Slice 7, Phase 13)

**AC:**

- Bật GPS → map + list cùng result set <2s. Card: tên, km, rating, giờ mở (`source` + `fetchedAt`), loại chay, badge giao hàng.
- Từ chối GPS → nhập địa chỉ + `GET /api/v1/location/geocode`, default Q1 HCM.
- Internal đã duyệt = canonical; Google Places làm giàu; dedup `googlePlaceId` else normalized name + địa chỉ/tọa độ. Field Admin override thắng Google.
- Không có quán 5km → user chủ động mở 10/20km + gợi ý công thức tự nấu. Hết quota Google → list nội bộ + `externalDataUnavailable=true`, không block màn hình.

**API:** `GET /api/v1/restaurants/nearby?lat=&lng=&radius=` · `GET /api/v1/restaurants/search` · `GET /api/v1/restaurants/:id`

#### FR-L02 — Gợi ý Food-to-Shop

Search món X → Top3 quán có `menuTags` chứa X trong 10km + Top3 video cùng tag. Xếp hạng có món: `tag match → diet compatibility → open now → distance → rating`. Không món: `distance → verified → open now → rating`.

#### FR-L03 — Restaurant Submission & Moderation

- Member/Contributor submit → `PENDING`, Admin noti. Admin approve → hiện map; reject → noti lý do, được sửa/submit lại.

**API:** `POST /api/v1/restaurants` · `GET/PATCH /api/v1/admin/restaurants*`

---

### Module 4: AI & Meal Planner

#### FR-A01 — Chatbot (Slice 6, Phase 11)

**AC:**

- Guest signed cookie + IP rate limit, history 7 ngày. Member/Contributor/Admin theo quota config (không hard-code số trong domain).
- Có diet snapshot → AI cá nhân hóa, không gợi ý món vi phạm hard constraint.
- Mỗi answer có 👍/👎 → `POST /api/v1/chat/messages/:id/feedback`. **Disclaimer cố định UI/API, không phụ thuộc model.**
- Ngoài phạm vi chay → từ chối lịch sự. LLM lỗi → fallback tĩnh, không hỏng core. SSE events `message_start/content_delta/message_complete/quota/error`; chỉ commit khi `message_complete`.

**Luồng BE:** `POST /api/v1/chat/sessions/:id/messages + auth/guest → rate-limit → quota → PII redact → diet context tối thiểu có consent → provider stream → SSE → lưu async → trừ quota nếu success`.

**API:** `POST/GET /api/v1/chat/sessions*` · `POST /api/v1/chat/sessions/:id/messages (SSE)` · `POST /api/v1/chat/messages/:id/feedback`

#### FR-A02 — Meal Planner + Behavioral (Slice 5, Phase 09-10)

**AC:**

- Nhập nguyên liệu + goal (`MAINTAIN=TDEE, LOSE=TDEE×0.90, GAIN=TDEE×1.10`, hệ số trong config, review chuyên môn) + 7 ngày × 3 bữa → 21 món từ `PUBLISHED + mealPlannerEligible` <3s.
- Phân bổ Sáng 25% / Trưa 40% / Tối 35% TDEE, tolerance `±15% → ±20% + warning`. Tổng ngày `±15%`.
- Hard constraints không nới: allergy/exclusion/dietPattern + tradition đã bật theo ngày PERIODIC + calorie tolerance. Behavioral không đưa món vi phạm trở lại.
- Behavioral scoring MVP (lookback 30d, recency decay, consent riêng, tắt/xóa được): `+5 overlap, +4 bookmark similar, +3 rating>=4, +2 chat topic, +2 repeated view, +1 search, -4 recent plan, -3 reject/swap`. Trả ≤2 reason codes, không cần LLM để rank. Cold start: popular/rated sau hard filter. Đổi weight có `scoringVersion`, không đổi plan đã lưu.
- Không lặp nếu pool đủ; thiếu → tối đa 2 lần + warning. Hết candidate → slot `UNFILLED`, không vi phạm hard rule.
- Generate/regenerate tạo version mới (`supersedesMealPlanId`), không ghi đè. Swap giữ hard constraints + `±100kcal` else tolerance nới + warning. Shopping list theo canonical + cùng unit/conversion chắc chắn. Cảnh báo B12/micronutrient chỉ khi đủ dữ liệu, không suy từ calo.

**API:** `POST /api/v1/meal-plans/generate` · `GET /api/v1/meal-plans*` · `PATCH /api/v1/meal-plans/:id/items/:itemId/swap` · `POST /api/v1/behavior-events` · `GET /api/v1/recommendations/home`

#### FR-A03 — Chat Sharing

- Member share từng answer → `isPublic=true`, hiện `/chat/public`. Ẩn lại → verification ẩn theo nhưng giữ audit. Hiển `Thành viên ẩn danh` nếu chọn.

**API:** `PATCH /api/v1/chat/messages/:id/share` · `GET /api/v1/chat/public?page=`

#### FR-N01 — Notifications (Slice 8, Phase 14)

| Event                                          | Người nhận                        |
| ---------------------------------------------- | --------------------------------- |
| Bài approve/reject                             | Author                            |
| Report resolved                                | Reporter + Target (giấu reporter) |
| Application approved/rejected, warn/demote/ban | Applicant/Contributor             |
| Quán/category approved/rejected                | Người submit                      |
| Report/application mới                         | Admin                             |

- In-app only, 90 ngày, mark-one/all read, dedupe `eventKey`, không noti cho chính actor, chỉ summary + xem chi tiết qua endpoint auth.

**API:** `GET /api/v1/notifications` · `PATCH /api/v1/notifications/:id/read` · `PATCH /api/v1/notifications/read-all`

---

## 7. Yêu cầu phi chức năng (NFR)

### 7.1 Contract chung (bắt buộc)

Success: `{success:true, data:{}, meta:null}`. Error: `{success:false, error:{code,message,fields}}`. Pagination `{page,limit,total,totalPages}`, `limit<=100`. ID UUID. Timestamp ISO 8601 UTC; date-only `YYYY-MM-DD` không parse instant. Mutation lặp dùng idempotency key. Validation Zod ở boundary. FE branch theo `error.code`, không theo message.

### 7.2 Performance

| Chỉ số           | Mục tiêu |
| ---------------- | -------- |
| API thường (p95) | <800ms   |
| API detail       | <500ms   |
| LCP mobile       | <2.5s    |
| Chat first token | <2s      |
| Tạo Meal Plan    | <3s      |
| Tải map 50 quán  | <2s      |
| CCU demo         | 100 CCU  |

### 7.3 Security

- Bcrypt cost 12 · JWT access ngắn + refresh rotation HttpOnly cookie · `withCredentials:true`.
- Zod toàn bộ input · DOMPurify markdown output · Redact PII trước LLM · Encrypt chat at-rest · Xóa PII 30 ngày khi xóa account.
- API key AI/Cloudinary/Maps chỉ Backend `.env`. Signed upload hết hạn ngắn. Không log health/raw PII. Không commit secret.

### 7.4 Scalability & UX

- Stateless API · Cache search/nearby 5p · CDN Cloudinary.
- Mobile-first · Việt không dấu normalize BE · Dark mode ready · Empty/error tiếng Việt · Offline món đã lưu.

### 7.5 UX Accessibility (người trung niên)

| ID            | Yêu cầu                                                         |
| ------------- | --------------------------------------------------------------- |
| **NFR-UX-01** | Tối thiểu thao tác mỗi task                                     |
| **NFR-UX-02** | Font ≥16px · Contrast ≥4.5:1 (WCAG AA)                          |
| **NFR-UX-03** | Tối đa **2 tap** tới Search / Meal Planner / Chat / Restaurants |
| **NFR-UX-04** | BMI/TDEE/calo kèm diễn giải (`BMI 23 — Bình thường`)            |
| **NFR-UX-05** | Chatbot/form placeholder rõ, không cần biết thuật ngữ           |

---

## 8. Data và Tích hợp bên thứ ba

### 8.1 Prisma tables (tóm tắt từ PLAN §4, thay Mongo collections)

Identity/profile: `users, refresh_sessions, health_profiles, diet_preferences, diet_preference_rules, diet_schedule_dates, diet_rule_definitions, user_allergies, user_ingredient_exclusions, contributor_profiles, contributor_applications`.
Content/community: `categories, category_proposals, posts, post_revisions, recipe_details, ingredients, ingredient_aliases, allergen_definitions, ingredient_allergens, ingredient_diet_compatibilities, ingredient_tradition_warnings, recipe_ingredients, recipe_diet_rules, comments, votes, ratings, bookmarks`.
Moderation/AI/behavior: `reports, moderation_actions, ai_flags, chat_sessions, chat_messages, ai_verifications, behavior_events, ai_request_logs (redacted, không raw PII), ai_feedback, ai_feature_configs, notifications`.
Meal/location: `meal_plans, meal_plan_items, restaurants, restaurant_submissions`.
Indexes: `posts(status,type,publishedAt)`, `categories(type,slug)` + `(type,parentId,slug)`, `ingredients(normalizedName)`, `behavior_events(userId,createdAt)`, `restaurants(lat,lng)`, full-text title/ingredient/tags.

### 8.2 Third-party Services

| Dịch vụ                                 | Mục đích                                    | Gói free      | Tiết kiệm                                                                     |
| --------------------------------------- | ------------------------------------------- | ------------- | ----------------------------------------------------------------------------- |
| **AI Provider Adapter**                 | Chatbot + giải thích Meal Plan + moderation | Theo provider | Cache, giới hạn tokens, quota 3 cấp, tắt Guest khi >90% budget, model qua env |
| **Google Maps JS + Places + Geocoding** | Map + marker + tìm/làm giàu quán            | $200 credit   | Embed + lat/lng seed, Universal Link Directions, fallback nội bộ              |
| **Cloudinary**                          | Ảnh + video ≤100MB + YouTube embed          | 25GB          | Nén ảnh, ưu tiên YouTube, signature backend                                   |
| **PostgreSQL + Prisma**                 | DB chính                                    | —             | Index text + geo + normalized search                                          |
| **Google OAuth**                        | Login                                       | Free          | P2 nếu setup chặn                                                             |

### 8.3 Luồng Upload (thay S3 pre-signed)

```
FE → POST /api/v1/uploads/signature (auth) → upload thẳng Cloudinary → trả secure URL/publicId → tạo Post
Video: ưu tiên YouTube URL embed, không transcode riêng ở MVP.
```

---

## 9. Business Rules (đã chốt)

> Chi tiết bắt buộc xem `docs/IMPLEMENTATION_PLAN.md` §5 (BL-01..BL-15). Mọi đổi rule phải cập nhật PLAN + OpenAPI + integration guide cùng change. Tóm tắt:

| #     | Quyết định                                                                                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| BL-01 | Register/apply Contributor: luôn `MEMBER` trước, 1 `PENDING`, `requestedType` không vào JWT, 2 types, không cert MVP, approve rotate token, reject apply lại 30d                                             |
| BL-02 | Rule preview version + toggle + snapshot + priority Allergy>exclusion>dietPattern>tradition>schedule>behavior                                                                                                |
| BL-03 | `PERIODIC` lưu `Asia/Ho_Chi_Minh DATE`, thiếu ngày → `DIET_SCHEDULE_REQUIRED`, không lịch âm MVP                                                                                                             |
| BL-04 | Normalize alias canonical, author chọn ambiguous, tự tính allergen/compat/warning, `mealPlannerEligible` gate, đổi ingredient tính lại                                                                       |
| BL-05 | State `DRAFT→PENDING_REVIEW/FLAGGED→PUBLISHED/REJECTED→HIDDEN/DELETED`, revision giữ bản cũ, soft-delete, ban `USER_BANNED` + unban selective                                                                |
| BL-06 | Flag≠report≠violation, 1 active report/user/target, 5 reporters → HIGH, QUARANTINED không hard-delete, chỉ Admin quyết định + audit                                                                          |
| BL-07 | Calorie `TDEE×1/0.9/1.1` config, 7×3, 25/40/35%, ±15→±20%, overlap ranking, lặp ≤2, `UNFILLED`, swap ±100kcal, shopping cùng unit                                                                            |
| BL-08 | Consent riêng, chỉ event chính user, 30d decay, weights +5/+4/+3/+2/+2/+1/-4/-3, ≤2 reason codes, cold start popular, tắt/xóa được                                                                           |
| BL-09 | Quota sau success, reset 00:00 HCM, guest signed cookie, private default + share từng answer, 1 verification/target 409, chỉ `NUTRITION_EXPERT`/Admin, disclaimer cố định                                    |
| BL-10 | Internal canonical, Places làm giàu, dedup placeId, Admin override, rank tag→diet→open→distance→rating, 5→10→20km user-driven, `externalDataUnavailable` fallback                                            |
| BL-11 | Comment edit/soft-delete/reply 1 tầng, upvote toggle, rating recipe taste+difficulty upsert + avg từ active, bookmark recipe/video, hide không tự restore                                                    |
| BL-12 | Category `FOOD_TYPE                                                                                                                                                                                          | RECIPE_GROUP | CONTENT_TOPIC`, 2 tầng cùng type, slug scoped, proposal only, xóa cần replacement transaction + archive |
| BL-13 | `LOCKED` chặn login giữ visibility; `BANNED` chặn mutation + `USER_BANNED`; `DELETED` revoke + anonymize + xóa health/chat/behavior 30d; xóa history độc lập                                                 |
| BL-14 | In-app 90d, mark-one/all, dedupe eventKey, không noti actor, report noti giấu reporter, chỉ summary                                                                                                          |
| BL-15 | Metrics request/error/fallback/feedback/negative/override, cost estimate ghi `ước tính`, disable chat giữ history + `AI_FEATURE_DISABLED`, toggle cần reason+audit, không retrain/deploy/rollback binary MVP |

---

## 10. Luồng người dùng quan trọng

| Tình huống               | Luồng bắt buộc (aligned)                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------- |
| Guest muốn bookmark      | Click → modal login → redirect + bookmark                                                         |
| Member bị reject bài     | Noti + reason → link edit revision + resubmit                                                     |
| Tìm quán không có 5km    | Banner + user mở 10/20km + nút công thức tự nấu                                                   |
| Meal Planner thiếu data  | `HEALTH_PROFILE_INCOMPLETE` → link health profile; thiếu ngày PERIODIC → `DIET_SCHEDULE_REQUIRED` |
| Chatbot trả lời sai      | 👎 → lý do → feedback → queue verification nếu public                                             |
| Member thêm quán         | Noti approve/reject kèm lý do                                                                     |
| Bài published bị edit    | Member: revision pending + bản cũ hiển thị; Contributor: re-moderation                            |
| User bị ban/unban        | `hidden USER_BANNED` + noti; unban chỉ restore nhóm này                                           |
| Contributor apply reject | Noti lý do, apply lại 30 ngày                                                                     |
| Expert verify AI         | Badge ✅/⚠️ dưới answer public, audit giữ                                                         |
| Contributor demote       | Về Member, mất badge, giữ audit cũ                                                                |

**Bookmark:** toggle, chỉ recipe/video. **Vote:** upvote toggle. **Rating:** recipe taste+difficulty upsert.

---

## 11. Rủi ro và Roadmap

### 11.1 Risk Matrix (theo PLAN §14)

| Rủi ro                    | Mức      | Giảm thiểu                                                     |
| ------------------------- | -------- | -------------------------------------------------------------- |
| Scope vượt tuần           | 🔴 Cao   | Giữ P0, giảm P1, không kéo Phase 2 vào sprint                  |
| FE/BE lệch contract       | 🔴 Cao   | OpenAPI-first, `sync:swagger` mỗi ngày                         |
| AI hallucination sai calo | 🔴 Cao   | Temp thấp + disclaimer + báo sai + verification + validator DB |
| Hết quota AI khi demo     | 🔴 Cao   | Quota cấp, cache, fallback tĩnh, demo backup                   |
| Spam/pending tồn          | 🟡 Trung | Blacklist + Contributor duyệt + bulk approve                   |
| Map GPS/quota             | 🟡 Trung | Nhập tay + list view + `externalDataUnavailable`               |
| Video/Cloudinary đầy      | 🟡 Trung | 100MB + ưu tiên YouTube                                        |
| Permission bug            | 🟡 Trung | Matrix + backend auth review + E2E                             |
| Health/privacy            | 🟡 Trung | Manual MVP, consent, không log nhạy cảm                        |

### 11.2 Phase 2 direction

GenAI behavioral full (retrieval → hard filter → AI rank → LLM compose → validator), CV candidates + user confirm + freshness estimate, STT async `QUEUED/RUNNING/COMPLETED/FAILED`, HealthKit/Health Connect + sensor steps only, tradition catalog tables, credential upload + `credentialStatus` tách badge.

---

## 12. Hướng dẫn Dev và Definition of Done

- Tích hợp chỉ endpoint `READY` trong `BACKEND_INTEGRATION.md`. Chạy `npm run sync:swagger` trước consumer.
- Mọi path vào `src/common/constants/api-endpoints.ts`. Mỗi consumer: DTO request/response riêng + Model + Mapper + API + Query keys/hooks + mapper tests. Component chỉ Model, không `any`, không raw DTO.
- Xử lý business error codes + loading/error/empty/success. Sau xong cập nhật `FE integrated` + changelog.
- Backend gate: lint/typecheck/build + OpenAPI + migration/seed. Frontend: `tsc --noEmit`, tests, build.
- Slice done khi AC pass + OpenAPI cùng PR + migration từ DB rỗng + validation/auth/error code + DTO/Model/Mapper + mobile usable + không secret/PII log + demo seed được.
- Business-rule safety: allergy/exclusion/diet/tradition backend-enforce; requestedType không phải quyền; flag/report là signal không hard-delete; ranking không đưa món vi phạm trở lại; model qua env; không claim cert verified MVP.

---

## PHỤ LỤC A: TRACEABILITY (UC → Slice/Phase/BL)

| UC                                   | Slice                | Backend Phase | BL                  |
| ------------------------------------ | -------------------- | ------------- | ------------------- |
| UC-01 Auth + Contributor request     | Slice 1              | 01, 07        | BL-01, BL-13        |
| UC-02 CRUD Post + Cloudinary/YouTube | Slice 2              | 04            | BL-04, BL-05        |
| UC-03 Comment/Vote/Rating/Bookmark   | Slice 2              | 06            | BL-11               |
| UC-04 Search/Related Postgres        | Slice 2              | 05            | BL-02, BL-04        |
| UC-05 Upload Video                   | Slice 2              | 04            | BL-05               |
| UC-06 Menu rule-based + BMI MANUAL   | Slice 5              | 02, 10        | BL-02, BL-03, BL-07 |
| UC-07 Chatbot adapter + quota + SSE  | Slice 6              | 11            | BL-09, BL-15        |
| UC-08 Behavioral MVP scoring         | Slice 5              | 09            | BL-08, BL-07        |
| UC-09 CV                             | Phase 2              | —             | Phase 2 §13.2       |
| UC-10 STT Summary                    | Phase 2              | —             | Phase 2 §13.3       |
| UC-11 Moderation queue               | Slice 3              | 08            | BL-05, BL-06        |
| UC-12 Maps hybrid                    | Slice 7              | 13            | BL-10               |
| UC-13 Health MANUAL                  | Slice 1              | 02            | BL-07               |
| UC-14 Seasonal/regional              | Phase 2 / cold-start | 09            | BL-08               |
| UC-15 Admin AI metrics/toggle        | Slice 8              | 15            | BL-15               |
| UC-16 Contributor content            | Slice 3              | 07            | BL-01, BL-05        |
| UC-17 Verify AI + duyệt role         | Slice 6              | 12, 07        | BL-01, BL-09        |

## PHỤ LỤC B: PHẠM VI MVP DEMO (aligned PLAN Slice 0–8)

> Bản full cũ giữ làm roadmap. **Demo đạt Slice 0–8 + 8 E2E PLAN §11.3.** Web-only, Cloudinary, Postgres FTS, MANUAL health, AI adapter (không RAG bắt buộc), behavioral scoring MVP IN (không DEFER), CV/STT mock `demo_mock`.

| UC                                 | MVP                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------- |
| UC-01 Auth (+ contributorRequest)  | IN — MEMBER + PENDING, 3 role + Guest                                  |
| UC-02 CRUD + Cloudinary/YouTube    | IN                                                                     |
| UC-03 Comment/Vote/Rating/Bookmark | IN (upvote toggle, rating recipe, bookmark recipe/video, reply 1 tầng) |
| UC-04 Search Postgres              | IN                                                                     |
| UC-05 Video ≤100MB                 | IN — progress + retry đơn giản                                         |
| UC-06 Menu rule                    | IN — MANUAL + PERIODIC dates                                           |
| UC-07 Chatbot                      | IN — adapter + quota + disclaimer + SSE + feedback                     |
| UC-08 Behavioral MVP               | IN — scoring + reason codes + consent + 30d (không GenAI full)         |
| UC-09/10/14                        | DEFER/mock Phase 2                                                     |
| UC-11 Moderation                   | IN — flag/QUARANTINED + duyệt tay, không auto-delete                   |
| UC-12 Maps web                     | IN — Maps JS + Geocoding + Places, Universal Link, fallback nội bộ     |
| UC-13 Health                       | IN — MANUAL only                                                       |
| UC-15 AI gov                       | IN bản tối thiểu — metrics + toggle + audit                            |
| UC-16/17 Contributor               | IN — 2 types, không cert, `APPROVE/CORRECT/REJECT` + duyệt role tay    |

**NFR demo:** build + demo mượt, JWT + RBAC + ownership, seed 4 role + posts + recipes nutrition/allergen + quán. Không chấm SLA p95/200 QPS/uptime, bỏ SAST/DAST, AES chỉ design.

---

_Version 1.5-aligned — 15/09/2026 — Aligned to `docs/IMPLEMENTATION_PLAN.md` v1.1. Khi lệch, IMPLEMENTATION_PLAN thắng._
