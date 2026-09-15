# SRS — Ứng Dụng Hỗ Trợ Người Ăn Chay (Vegan Support Application)

**Version:** 1.4 | **Ngày gốc:** 10/09/2026 | **Cập nhật:** 15/09/2026
**Trạng thái:** ✅ Ready for Dev — Conditional _(chờ sign-off toàn team)_
**Stack:** Next.js 16 · Node/Express · MongoDB Atlas · Gemini 1.5 Flash · Cloudinary · Google Maps JS

---

> **📌 Quy tắc vàng:** File này là **nguồn sự thật duy nhất (Single Source of Truth)**.
> Mọi thay đổi scope → cập nhật version ở đây → thông báo cả team trước khi code.

---

## Mục lục

1. [Tổng quan sản phẩm](#1-tổng-quan-sản-phẩm)
2. [Người dùng mục tiêu và Personas](#2-người-dùng-mục-tiêu-và-personas)
3. [Vai trò và Phân quyền RBAC](#3-vai-trò-và-phân-quyền-rbac)
4. [Phân loại người ăn chay veganType](#4-phân-loại-người-ăn-chay-vegantype)
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

| #   | Vấn đề                                                    | Giải pháp                                            |
| --- | --------------------------------------------------------- | ---------------------------------------------------- |
| 1   | Khó cân bằng dinh dưỡng, BMI khó hình dung                | Profile + BMI/BMR/TDEE + AI Chatbot giải thích       |
| 2   | Khó tìm công thức phù hợp loại chay và nguyên liệu sẵn có | Recipe Search + Filter theo veganType + Meal Planner |
| 3   | Thông tin ăn chay phân tán, khó kiểm chứng                | Cộng đồng + Contributor duyệt + Admin moderation     |

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

### 1.4 Kiến trúc kỹ thuật

```
[Web Next.js 16 : frontend/]
[Mobile React Native — Phase 2]  →  [API Gateway: backend/ Node/Express · /api/v1]
                                         ├─ MongoDB Atlas (data chính)
                                         ├─ Upstash Redis (cache + rate-limit AI)
                                         ├─ Gemini 1.5 Flash (AI-proxy, streaming SSE)
                                         ├─ Cloudinary (ảnh + video ≤100MB + YouTube embed)
                                         └─ Google Maps JS SDK + Geolocation browser
```

> ⚠️ **Bảo mật:** Frontend KHÔNG bao giờ gọi Gemini/Maps trực tiếp. Mọi API key ở Backend `.env`. Frontend chỉ gọi `backend/api`.

### 1.5 Cấu trúc thư mục

**Frontend (`frontend/src/`):**

| Thư mục            | Mục đích                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `app/`             | Routes: `(auth)/login,register` · `(main)/home,recipes,restaurants,meal-plan,chat` · `admin/` |
| `features/`        | Mỗi module có `api.ts`, `hooks.ts`, `components/`                                             |
| `store/` (zustand) | `authStore`, `chatStore`, `mealStore`                                                         |
| `lib/`             | `axios.ts` · `bmi.ts` · `gemini-prompt.ts`                                                    |
| `middleware.ts`    | Bảo vệ route `/admin/*`, redirect Guest khi vào `/meal-plan`                                  |

**Backend (`backend/src/`) — cần tạo:**

```
models/       User, Category, Post, Comment, Vote, Restaurant, MealPlan,
              ChatLog, Report, ModerationLog, Notification, ContributorApplication
routes/       auth, posts, categories, comments, restaurants, mealplans,
              chat, admin, notifications, reports
middlewares/  auth.js, isAdmin.js, isContributor.js, rateLimit.js, upload.js
services/     gemini.js, mealRule.js, maps.js
seed/         seed_restaurants.js (50 quán HCM), seed_categories.js
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

Được hỗ trợ đầy đủ nhưng không phải đối tượng định vị chính. Dùng được toàn bộ tính năng. Giúp sản phẩm không bị giới hạn thị trường vào một độ tuổi.

> Không ghi "giới trẻ ít ăn chay" nếu chưa có dữ liệu. Hệ thống không giới hạn tính năng theo tuổi.

### 2.3 Supporting Personas

| Persona         | Mô tả                                              |
| --------------- | -------------------------------------------------- |
| **Contributor** | Đóng góp nội dung, duyệt bài Member, kiểm chứng AI |
| **Admin**       | Quản lý hệ thống, quyết định moderation cuối cùng  |

---

## 3. Vai trò và Phân quyền RBAC

### 3.1 Sơ đồ vai trò

```
Guest ──(register)──► Member ──(apply + Admin duyệt)──► Contributor
                                                              (role độc lập)

Admin = system role riêng biệt, KHÔNG phải tiến hóa từ Contributor
```

### 3.2 Mô tả từng vai trò

#### Guest (Chưa đăng nhập)

- Xem content published (recipe, blog, video, quán ăn).
- AI Chatbot: **5 lần/ngày**.
- Xem chatlog công khai.
- Không thể: comment, vote, bookmark, tạo content, Meal Planner.

#### Member (Đã đăng ký)

- Comment, upvote, rating (recipe), bookmark (recipe + video).
- Tạo content → **status `pending`**, chờ Contributor/Admin duyệt.
- AI Chatbot: **50 lần/ngày**.
- Dùng Meal Planner, Report, Thêm nhà hàng (chờ duyệt).
- Chia sẻ chatlog AI ra công khai.

#### Contributor (Member được Admin duyệt)

Điều kiện apply — **một trong hai**:

- ≥3 năm kinh nghiệm ăn chay / nấu ăn / tư vấn dinh dưỡng.
- Bằng cấp/chứng chỉ liên quan (upload PDF/JPEG ≤5MB).

Quyền bổ sung so với Member:

- Tạo content → **auto-publish ngay**.
- **Duyệt content của Member** (không được duyệt bài của chính mình).
- AI Chatbot: **100 lần/ngày**.
- **Kiểm chứng câu trả lời AI** trên chatlog công khai.
- **Đề xuất category mới**.
- Badge **"Chuyên gia"** trên profile và bài viết.

#### Admin (System role)

- Duyệt/reject/hide bất kỳ content, restaurant, category, Contributor application.
- Review report → ra 5 loại quyết định.
- AI Chatbot: **không giới hạn**.
- **Không thể sửa nội dung bài** của người khác.

### 3.3 Permission Matrix

| Feature                       | Guest  | Member  | Contributor | Admin |
| ----------------------------- | :----: | :-----: | :---------: | :---: |
| Xem content published         |   ✅   |   ✅    |     ✅      |  ✅   |
| Đăng ký tài khoản             |   ✅   |   ❌    |     ❌      |  ❌   |
| Comment + Upvote              |   ❌   |   ✅    |     ✅      |  ✅   |
| Rating (chỉ recipe)           |   ❌   |   ✅    |     ✅      |  ✅   |
| Tạo content → Pending         |   ❌   |   ✅    |     ❌      |  ✅   |
| Tạo content → Auto-publish    |   ❌   |   ❌    |     ✅      |  ✅   |
| Duyệt content của Member      |   ❌   |   ❌    |     ✅      |  ✅   |
| Bookmark (recipe + video)     |   ❌   |   ✅    |     ✅      |  ✅   |
| AI Chatbot                    | 5/ngày | 50/ngày |  100/ngày   |   ∞   |
| Meal Planner                  |   ❌   |   ✅    |     ✅      |  ✅   |
| Kiểm chứng câu trả lời AI     |   ❌   |   ❌    |     ✅      |  ✅   |
| Badge "Chuyên gia"            |   ❌   |   ❌    |     ✅      |  ❌   |
| Đề xuất category mới          |   ❌   |   ❌    |     ✅      |  ✅   |
| Report content/user           |   ❌   |   ✅    |     ✅      |  ✅   |
| Thêm nhà hàng                 |   ❌   |   ✅    |     ✅      |  ✅   |
| Chia sẻ chatlog AI            |   ❌   |   ✅    |     ✅      |  ✅   |
| Review report / xử lý vi phạm |   ❌   |   ❌    |     ❌      |  ✅   |
| Demote Contributor / Ban user |   ❌   |   ❌    |     ❌      |  ✅   |
| Duyệt nhà hàng / category     |   ❌   |   ❌    |     ❌      |  ✅   |
| Duyệt Contributor application |   ❌   |   ❌    |     ❌      |  ✅   |

### 3.4 Luật cứng

- Mọi `POST/PUT/DELETE` cần `Authorization: Bearer <accessToken>` (JWT 15p + refresh 7d).
- **Report ≠ Violation.** Report chỉ là tín hiệu. Admin mới quyết định.
- Report ≥5 → escalate queue Admin (badge đỏ). **Không tự động hide content**.
- Contributor **không được** self-approve/self-verify.
- Admin **không thể** sửa nội dung bài.
- Xóa user (soft-delete): bài giữ nguyên, author = "Thành viên đã xóa". ChatLogs xóa sau 30 ngày.
- Ban user: bài `hidden` tạm. Gỡ ban → bài phục hồi.
- Quota AI reset lúc **0h00 UTC+7** mỗi ngày.
- **Admin là actor cuối cùng** trong mọi quyết định vi phạm.

---

## 4. Phân loại người ăn chay (veganType)

`veganType` trong Profile ảnh hưởng trực tiếp đến: **filter Search, Meal Planner, gợi ý AI**.

| veganType        | Mô tả                  | Ràng buộc                                       |
| ---------------- | ---------------------- | ----------------------------------------------- |
| `thuan-thuc-vat` | Thuần thực vật (Vegan) | Không trứng, sữa, mật ong                       |
| `chay-truong`    | Chay trường (tôn giáo) | Không thịt, cá + không hành, tỏi, kiệu, hẹ, nén |
| `chay-ky`        | Chay kỳ (rằm, mồng 1)  | Như chay trường, chỉ các ngày nhất định         |
| `lacto-ovo`      | Có trứng + sữa         | Không thịt/cá, có trứng và sữa _(default)_      |
| `eat-clean-chay` | Ăn sạch chay           | Hạn chế chế biến, không đường tinh              |

> ⚠️ **Luật filter BẮT BUỘC:** Recipe có `avoidTags` chứa `['hanh', 'toi', 'kieu', 'he', 'nen']` phải bị ẩn khỏi Search, Meal Planner, Related của user `chay-truong`/`chay-ky`.
> **Sai sót ảnh hưởng đến tín ngưỡng người dùng — không được để lọt.**

---

## 5. Scope MVP vs Phase 2

### 5.1 In-Scope MVP (bắt buộc theo đề cương)

| #   | Module             | Nội dung                                                                                                                    |
| --- | ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Auth & User**    | Email/pass + Google OAuth · Profile + BMI + veganType · Contributor apply + Admin duyệt                                     |
| 2   | **Community**      | Comment CRUD · Upvote + Rating 2 chiều · Report với SLA 48h                                                                 |
| 3   | **Recipe & Media** | Recipe/Blog/Video CRUD · Search full-text không dấu · Filter nâng cao · Category · Related 6 món · Contributor auto-publish |
| 4   | **Location**       | Quán lân cận 5km GPS · Thông tin quán · Member thêm quán chờ duyệt                                                          |
| 5   | **AI Chatbot**     | Gemini Flash · Quota 3 cấp · Streaming · Feedback · Kiểm chứng Contributor · Chat Sharing                                   |
| 6   | **Meal Planner**   | Rule-based + AI giải thích · 21 món/7 ngày · Quy tắc dinh dưỡng · Shopping list                                             |
| 7   | **Notifications**  | In-app: approve/reject, report, Contributor apply, restaurant                                                               |

### 5.2 Out-of-Scope (Phase 2)

- AI GenAI Meal Planner (behavioral analysis), Computer Vision, Video STT Summarization.
- Apple HealthKit / Google Fit sync.
- Thanh toán, chat realtime giữa users, push notification.
- Macro tracking chi tiết, export PDF, gợi ý theo mùa/vùng miền.

> Không upload video >100MB, không transcode HLS. Không tư vấn bệnh nặng — chỉ trả lời chung + disclaimer.

---

## 6. Yêu cầu chức năng chi tiết (FR)

> **Ký hiệu AC:** `Given [trạng thái] When [hành động] Then [kết quả mong đợi]`

---

### Module 1: User & Community

#### FR-U01 — Auth

**User Story:** As Guest, I want đăng ký/đăng nhập để dùng đầy đủ tính năng.

**AC:**

- `Given` `/register`, nhập email + pass ≥8 ký tự (1 hoa + 1 số) `When` submit `Then` tạo user, gửi verify (mock OK), auto login về `/home` <3s.
- `Given` JWT hết hạn `When` refresh còn hạn `Then` silent refresh, không bắt login lại.
- `Given` chọn "Login Google" `When` OAuth OK `Then` tạo hoặc link account.

**API:** `POST /api/v1/auth/register | login | google | refresh | logout | forgot-password`

**Edge:** Email trùng → 409; Sai pass 5 lần/15p → lock + captcha; Mất mạng → giữ draft.

---

#### FR-U02 — Profile + BMI

**User Story:** As Member, I want nhập thông tin cá nhân và chọn loại chay để nhận gợi ý phù hợp.

**AC:**

- `Given` nhập height 140–220cm + weight 30–200kg `When` save `Then` hiện BMI + phân loại WHO châu Á + BMR + TDEE, tính FE <500ms.
- `Given` chọn `veganType = 'chay-truong'` `Then` toàn bộ Search/Related/Meal Planner ẩn món có hành/tỏi/kiệu/hẹ/nén.
- `Given` đăng nhập lần đầu chưa chọn veganType `Then` hiện banner gợi ý (có thể skip, default `lacto-ovo`).

**Logic BMI (`lib/bmi.ts`):**

```
BMI = kg / m²
BMR (Nam) = 10×kg + 6.25×cm − 5×tuổi + 5
BMR (Nữ) = 10×kg + 6.25×cm − 5×tuổi − 161
TDEE = BMR × [1.2 | 1.375 | 1.55 | 1.725]
```

**Phân loại BMI châu Á:** <18.5 Thiếu cân · 18.5–22.9 Bình thường · 23–24.9 Thừa cân · ≥25 Béo phì

**API:** `GET/PUT /api/v1/users/me`

**Edge:** BMI <12 hoặc >45 → cảnh báo; BMI <16 hoặc >35 → disclaimer trong Meal Planner.

---

#### FR-U03 — Comment, Vote & Rating

**AC:**

- Comment ≤1000 ký tự trên post `published` → hiện ngay.
- Upvote: 1 user/1 post, toggle được.
- Rating (chỉ `type=recipe`): 2 thanh sao — ⭐ **Độ ngon** (1-5) và 🔪 **Độ dễ** (1-5); lưu `avgTasteRating` + `avgDifficultyRating`.
- Guest bấm → modal login, sau login tự điền lại.
- Report: chọn lý do enum + mô tả ≤300 ký tự.

**API:** `POST /api/v1/posts/:id/comments | votes | ratings` · `POST /api/v1/reports`

**Anti-spam:** 10 comments/phút · strip HTML · blacklist → auto hidden.

---

#### FR-U04 — Admin Moderation & Report

**AC:**

- Admin xem `/admin/moderation` → bulk approve, ghi ModerationLog, gửi notification tác giả.
- Mở 1 report → xem: target, reporter, reason, lịch sử.
- 5 kết luận: **No Violation / Warning / Hide Content / Demote Contributor / Ban User**.
- Resolve → `ModerationLog` + `Report.status = resolved` + notification cho reporter + target.
- Report ≥5 → auto-escalate (badge đỏ). Xử lý trong **48h**. **Không tự động hide**.

**API:**

```
GET    /api/v1/admin/moderation?status=pending
PATCH  /api/v1/admin/posts/:id/approve|reject|hide
PATCH  /api/v1/admin/users/:id/ban
PATCH  /api/v1/admin/users/:id/demote
GET    /api/v1/admin/reports?status=pending|reviewing|resolved
PATCH  /api/v1/admin/reports/:id/resolve { conclusion, action, note }
```

---

#### FR-U05a — Contributor Apply

**AC:**

- `/profile/apply-contributor` → điền kinh nghiệm ≤1000 ký tự + upload chứng chỉ (PDF/JPEG ≤5MB, optional) → tạo application, Admin nhận notification.
- Admin approve/reject kèm lý do ≤200 ký tự trong **72h**.
- Approved → `user.role = 'contributor'`, badge hiện ngay.
- Rejected → có thể apply lại sau **30 ngày**.

**Model:**

```js
ContributorApplication { userId, experience, certFileUrl,
  status: 'pending'|'approved'|'rejected', reviewNote, reviewedAt }
```

**API:** `POST /api/v1/contributor-applications` · `GET /api/v1/admin/contributor-applications?status=pending` · `PATCH /api/v1/admin/contributor-applications/:id/approve|reject`

---

#### FR-U05b — Kiểm chứng AI (Contributor)

**AC:**

- Contributor xem chatlog công khai → 2 nút:
  - **✅ Xác nhận đúng** → badge `✅ Được kiểm chứng bởi [Tên]`.
  - **✏️ Đính chính** → ghi chú ≤500 ký tự → badge `⚠️ Đính chính bởi [Tên]: [ghi chú]`.
- **1 kiểm chứng/câu trả lời** (first contributor wins).
- Chỉ với chatlog **công khai**. Không tự kiểm chứng bài của mình.

**API:** `POST /api/v1/chat/:messageId/verify { action, note? }` · `DELETE /api/v1/chat/:messageId/verify`

---

### Module 2: Recipe & Media

#### FR-C01 — Contributor Duyệt Bài Member

**AC:**

- `/contributor/review` → list recipe/blog/video `status=pending` của Member (không phải của mình).
- Approve → `published`, ghi `reviewedBy`, Member nhận notification.
- Reject → `rejected`, bắt nhập `moderationReason`, Member nhận notification kèm lý do.

**API:** `GET /api/v1/posts/pending` · `PATCH /api/v1/posts/:id/approve` · `PATCH /api/v1/posts/:id/reject`

---

#### FR-C02 — Contributor Auto-Publish

- Contributor submit bất kỳ content → BE check `role === 'contributor'` → `status = 'published'` ngay, `reviewedBy: 'system-auto'`.
- Edit bài đã published → `published` luôn (auto-republish).
- **Auto-publish ≠ miễn moderation:** vẫn có thể bị report.

---

#### FR-C03 — Report

**Model Report:**

```js
{
  reporterId, targetType: 'post'|'comment'|'user', targetId,
  reason,       // enum: Sai thông tin / Spam / Không phù hợp / Khác
  description,  // tùy chọn ≤300 ký tự
  status: 'pending'|'reviewing'|'resolved',
  resolution, resolvedBy, resolvedAt, createdAt
}
```

---

#### FR-C04 — Admin Xử lý Vi phạm Contributor

- Admin mở report → xem: nội dung, lý do, thông tin Contributor (tên, ngày approve, tổng bài, lịch sử).
- Demote → `role = 'member'`, badge biến mất, ghi ModerationLog.

**Model ModerationLog:**

```js
{
  adminId, action: 'approve'|'reject'|'hide'|'warn'|'demote'|'ban'|'restore',
  targetType: 'post'|'user'|'comment', targetId,
  reason, reportId, createdAt
}
```

---

#### FR-C05 — Category Proposal (Contributor)

- Contributor đề xuất tên + mô tả → Admin duyệt → category tạo thật.

**API:** `POST /api/v1/category-proposals` · `PATCH /api/v1/admin/category-proposals/:id/approve|reject`

---

#### FR-R01 — Recipe / Blog / Video CRUD

**Phân biệt 3 loại:**

| Trường                                                    |    recipe    | blog |  video   |
| --------------------------------------------------------- | :----------: | :--: | :------: |
| ingredients[]                                             | **BẮT BUỘC** |  ❌  | Optional |
| steps[]                                                   | **BẮT BUỘC** |  ❌  | Optional |
| cookTimeMinutes, estimatedCalories, difficulty, avoidTags | **BẮT BUỘC** |  ❌  |    ❌    |
| Rating 2 chiều                                            |      ✅      |  ❌  |    ❌    |
| Dùng trong Meal Planner                                   |      ✅      |  ❌  |    ❌    |

**Model Post:**

```js
{
  author, type: 'recipe'|'blog'|'video',
  title, slug, coverUrl, youtubeUrl, videoUrl,
  // recipe only:
  ingredients: [{name, amount}], steps, cookTimeMinutes, servings,
  estimatedCalories, difficulty: 'easy'|'medium'|'hard', avoidTags,
  // chung:
  tags, category,
  status: 'pending'|'published'|'rejected'|'hidden',
  views, upvotes, avgTasteRating, avgDifficultyRating,
  // traceability:
  reviewedBy, reviewedAt, moderationReason, version
}
```

**API:** `POST/PUT/DELETE /api/v1/posts` · `POST /api/v1/upload (→ Cloudinary signed)`

---

#### FR-R02 — Search + Filter + Related

**AC:**

- Search "dau hu" → ra "đậu hũ" (normalize không dấu ở BE), rank title 3× + ingredients 2× + tags, <800ms.
- Filter `veganType='chay-truong'` → ẩn bài có avoidTags không phù hợp.
- Filter kết hợp: type + category + cookTime + difficulty + veganType + ingredients.
- Detail recipe → 6 Related (cùng category + overlap ≥2 nguyên liệu + cùng veganType).
- 0 kết quả → empty-state + popular + nút "Hỏi AI".

**API:** `GET /api/v1/posts?q=&type=&category=&cookTime=&difficulty=&veganType=&ingredients=&page=`

---

#### FR-R03 — Category (Admin)

- CRUD category 2 tầng (parent → child).
- Xóa category có posts → bắt chọn category thay thế.
- **Seed:** Món chính · Canh/Súp · Salad · Bún/Mì · Bánh · Đồ uống · Món chay giả mặn.

---

### Module 3: Location

#### FR-L01 — Quán Lân Cận

**AC:**

- Bật GPS → map + list sorted by distance <2s. Card: tên, km, rating, giờ mở, loại chay, badge giao hàng.
- Từ chối GPS → nhập Quận/TP, default Q1 HCM.
- User `chay-truong` → mặc định chỉ hiện quán `'chay-truong'` hoặc `'thuan-thuc-vat'`.
- Không có quán 5km → nới 10/20km + gợi ý "Xem công thức tự nấu".

**Schema Restaurant:**

```js
{
  name, address,
  location: { type: 'Point', coordinates: [lng, lat] },  // 2dsphere index
  opening_hours, price_range,
  restaurantType: 'chay-truong'|'lacto-ovo'|'thuan-thuc-vat'|'chay-ky',
  menu_tags, phone, deliveryLinks, coverUrl, menuPhotos,
  rating_avg, rating_count,
  status: 'approved'|'pending'|'closed',
  submittedBy, reviewedBy, moderationReason
}
```

**API:** `GET /api/v1/restaurants/nearby?lat=&lng=&radius=5000&type=` (dùng `$near`)

---

#### FR-L02 — Gợi ý Food-to-Shop

Search món X → sidebar Top3 quán có `menu_tags` chứa X trong 10km + Top3 video cùng tag. (BE: overlap tags, không cần AI ở MVP)

---

#### FR-L03 — Restaurant Submission & Moderation

- Member/Contributor submit → `status = 'pending'`, Admin nhận notification.
- Admin approve → quán hiện map; Admin reject → notification kèm lý do, được sửa và submit lại.

**API:** `POST /api/v1/restaurants` · `PATCH /api/v1/admin/restaurants/:id/approve|reject`

---

### Module 4: AI & Meal Planner

#### FR-A01 — Chatbot Gemini Flash

**AC:**

- Guest: 5 lượt/ngày (reset 0h00 UTC+7), ẩn danh.
- Member: 50 lượt/ngày. Contributor: 100 lượt/ngày. Admin: không giới hạn.
- Có BMI + veganType → AI cá nhân hóa (không gợi ý món kiêng).
- Mỗi câu trả lời có nút 👍/👎 → lưu feedback.
- **Disclaimer bắt buộc:** "Thông tin mang tính tham khảo, không thay thế tư vấn chuyên gia."
- LLM lỗi → fallback "AI bận, thử lại sau".

**Luồng BE:**

```
POST /api/v1/chat + JWT/guest_id
  → rate-limit → quota check → PII redact → BMI context
  → Gemini Flash streaming → SSE về FE
  → lưu ChatLog async → trừ quota
Lỗi/timeout → thử lại 1 lần → fallback
```

**System prompt mẫu:**

```
Bạn là chuyên gia dinh dưỡng chay thân thiện, trả lời tiếng Việt.
Chỉ trả lời về chay/BMI/calo/nguyên liệu thay thế. Không chẩn đoán bệnh.
Mọi câu trả lời kèm: "Thông tin tham khảo, không thay thế bác sĩ."
User: veganType={veganType}, BMI={bmi}, TDEE={tdee} kcal/ngày.
```

**API:** `POST /api/v1/chat` · `GET /api/v1/chat/history` · `POST /api/v1/chat/feedback`

---

#### FR-A02 — Meal Planner (Rule-based + AI giải thích)

**AC:**

- Nhập nguyên liệu + mục tiêu (giữ/giảm/tăng) + 3 bữa/ngày → sinh 21 món từ DB `published+recipe` <3s.
- Không nhập nguyên liệu → chế độ "Tạo theo BMI".

**Quy tắc dinh dưỡng bắt buộc:**

| Quy tắc             | Chi tiết                                         |
| ------------------- | ------------------------------------------------ |
| Không lặp món       | Mỗi recipe xuất hiện 1 lần trong 21 bữa          |
| Phân bổ calo        | Sáng 25% / Trưa 40% / Tối 35% TDEE ±10%          |
| Đa dạng nhóm        | Mỗi ngày: ≥1 protein + ≥1 tinh bột + ≥1 rau xanh |
| Tổng calo/ngày      | ±15% TDEE                                        |
| Filter veganType    | Ẩn recipe avoidTags không phù hợp                |
| Overlap nguyên liệu | ≥60% nguyên liệu user nhập phải khớp             |

- Cảnh báo thiếu B12 → banner vàng.
- Swap món → gợi ý 3 món cùng calo ±100kcal.
- Shopping list + nút "Tìm quán có món này".
- Thực đơn lưu tự động.

**Logic (`services/mealRule.js`):**

```
lọc posts published+recipe → filter avoidTags
→ score overlap nguyên liệu → chia calo 3 bữa
→ kiểm tra đa dạng → check cảnh báo thiếu chất
→ gọi Gemini 1 lần để giải thích (tiết kiệm quota)
```

**API:** `POST /api/v1/mealplans {ingredients[], goal, mealsPerDay, veganType}` → `{week[], shoppingList[], nutritionWarnings[], aiExplanation}`

---

#### FR-A03 — Chat Sharing

- Member nhấn "Chia sẻ câu hỏi này" → `message.isPublic = true`, hiện tại `/chat/public`.
- Ẩn lại bất kỳ lúc nào → kiểm chứng hiện có ẩn theo.
- Hiển "Thành viên ẩn danh" nếu user muốn.

**API:** `PATCH /api/v1/chat/:messageId/share { isPublic }` · `GET /api/v1/chat/public?page=`

---

#### FR-N01 — Notifications (In-app)

| Event                                     | Người nhận        |
| ----------------------------------------- | ----------------- |
| Bài approve/reject                        | Author            |
| Report được xử lý                         | Reporter + Target |
| Contributor application approved/rejected | Applicant         |
| Contributor bị warn/demote/ban            | Contributor       |
| Quán / category approved/rejected         | Người submit      |
| Report mới / Contributor application mới  | Admin             |

**Model:**

```js
{ userId, type, message, isRead: Boolean,
  targetType, targetId, createdAt }
```

**API:** `GET /api/v1/notifications?page=1&limit=20` · `PATCH /api/v1/notifications/:id/read` · `PATCH /api/v1/notifications/read-all`

MVP: Chỉ in-app. Lưu 90 ngày.

---

## 7. Yêu cầu phi chức năng (NFR)

### 7.1 Performance

| Chỉ số                 | Mục tiêu |
| ---------------------- | -------- |
| API thông thường (p95) | <800ms   |
| API detail             | <500ms   |
| LCP mobile             | <2.5s    |
| Chat first token       | <2s      |
| Tạo Meal Plan          | <3s      |
| Tải map 50 quán        | <2s      |
| CCU demo               | 100 CCU  |

### 7.2 Security

- Bcrypt cost 12 · JWT access 15p + refresh 7d rotation · HttpOnly cookie.
- Zod validate toàn bộ input · DOMPurify markdown output.
- API key Gemini/Cloudinary/Maps **chỉ ở Backend `.env`**.
- Signed upload URL: hết hạn sau 15 phút.
- Redact PII trước LLM · Encrypt chat at-rest · Xóa PII sau 30 ngày khi xóa account.

### 7.3 Scalability & UX

- Stateless API · Cache search/nearby 5p · CDN Cloudinary.
- Mobile-first · Hỗ trợ tiếng Việt có dấu/không dấu (normalize BE).
- Dark mode ready · Empty/error state tiếng Việt · Offline xem món đã lưu (localStorage).

### 7.4 UX Accessibility (Primary Persona — người trung niên)

| ID            | Yêu cầu                                                                          |
| ------------- | -------------------------------------------------------------------------------- |
| **NFR-UX-01** | Giao diện đơn giản, tối thiểu hóa thao tác để hoàn thành mỗi task                |
| **NFR-UX-02** | Font size ≥16px · Contrast ratio ≥4.5:1 (WCAG AA)                                |
| **NFR-UX-03** | Tối đa **2 tap** để đến Recipe Search / Meal Planner / AI Chat / Restaurants     |
| **NFR-UX-04** | BMI/TDEE/calo phải kèm mô tả ý nghĩa (vd: "BMI 23 — Cân nặng bình thường")       |
| **NFR-UX-05** | Chatbot và form nhập liệu có placeholder/label rõ ràng, không cần biết thuật ngữ |

---

## 8. Data và Tích hợp bên thứ ba

### 8.1 MongoDB Collections (14 collections)

| Collection                | Mô tả                                    |
| ------------------------- | ---------------------------------------- |
| `Users`                   | Role, veganType, BMI                     |
| `Posts`                   | Recipe/Blog/Video (discriminator `type`) |
| `Categories`              | 2 tầng: parent → child                   |
| `Comments`                | Liên kết Post                            |
| `Votes`                   | Unique `(userId, postId)`                |
| `Restaurants`             | 2dsphere index trên `location`           |
| `MealPlans`               | Liên kết User                            |
| `ChatLogs`                | `isPublic`, `sharedAt`                   |
| `ChatVerifications`       | Kiểm chứng của Contributor               |
| `Reports`                 | pending → reviewing → resolved           |
| `ModerationLogs`          | Audit trail Admin                        |
| `Notifications`           | In-app, TTL 90 ngày                      |
| `ContributorApplications` | Hồ sơ apply                              |
| `CategoryProposals`       | Đề xuất category                         |

### 8.2 Third-party Services

| Dịch vụ                | Mục đích                       | Gói free      | Tiết kiệm                                         |
| ---------------------- | ------------------------------ | ------------- | ------------------------------------------------- |
| **Gemini 1.5 Flash**   | Chatbot + giải thích Meal Plan | 1500 req/ngày | Cache, giới hạn tokens, tắt Guest khi >90% budget |
| **Google Maps JS SDK** | Hiển thị map + marker          | $200 credit   | Embed + lat/lng seed, không gọi Places API        |
| **Cloudinary**         | Ảnh + video ≤100MB             | 25GB          | Nén ảnh, ưu tiên YouTube URL                      |
| **MongoDB Atlas**      | DB chính                       | 512MB         | Index text + 2dsphere                             |
| **Google OAuth**       | Login                          | Free          | —                                                 |

### 8.3 Luồng Upload

```
FE → xin signed URL từ BE → upload thẳng Cloudinary → trả URL → tạo Post
Video: ưu tiên YouTube URL embed, không transcode.
```

---

## 9. Business Rules (đã chốt)

> Mọi thay đổi → cập nhật version đầu file → thông báo toàn team.

### General Rules

| #     | Câu hỏi                                | Quyết định                                                                                                                                 |
| ----- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| BR-01 | Admin sửa nội dung bài được không?     | **Không.** Chỉ approve/reject/hide.                                                                                                        |
| BR-02 | Bài `published` bị edit → xử lý sao?   | Về `pending`. Bản cũ hiển cho đến khi bản mới được approve.                                                                                |
| BR-03 | Xóa user → bài viết sao?               | Soft-delete. Bài giữ, author = "Thành viên đã xóa". ChatLogs xóa sau 30 ngày.                                                              |
| BR-04 | Ban user → bài viết sao?               | `hidden` tạm. Gỡ ban → bài phục hồi.                                                                                                       |
| BR-05 | Upvote và Rating là 1 thứ?             | **Không.** Upvote = toggle. Rating = 2 thanh sao (chỉ recipe).                                                                             |
| BR-06 | Quota AI reset lúc nào?                | **0h00 UTC+7** mỗi ngày.                                                                                                                   |
| BR-07 | Meal Plan có lưu không?                | **Có.** Lưu tự động.                                                                                                                       |
| BR-08 | Ai đề xuất category?                   | **Contributor + Admin.** Member không được.                                                                                                |
| BR-09 | Report tự động hide?                   | **Không. Report ≠ Violation.** ≥5 report → escalate queue. Admin quyết định.                                                               |
| BR-10 | Filter veganType logic?                | **Filter loại trừ** avoidTags theo veganType.                                                                                              |
| BR-11 | Bookmark áp dụng loại nào?             | Recipe và Video. Blog không có.                                                                                                            |
| BR-12 | Report SLA?                            | Admin xử lý trong **48h**. Reporter nhận noti kết quả.                                                                                     |
| BR-13 | Contributor bị reject → apply lại?     | Được, sau **30 ngày**.                                                                                                                     |
| BR-14 | Auto-publish điều kiện?                | Recipe: `estimatedCalories` ≠ rỗng + ≥3 steps + Contributor có ≥5 bài published không bị report. Blog/Video: auto-publish không điều kiện. |
| BR-15 | 1 câu AI có mấy kiểm chứng?            | **1.** First contributor wins.                                                                                                             |
| BR-16 | Contributor bị demote → kiểm chứng cũ? | Giữ, hiển "[Thành viên]". Admin có thể xóa.                                                                                                |
| BR-17 | Kiểm chứng với chatlog nào?            | Chỉ chatlog **công khai**.                                                                                                                 |

### Content Moderation Rules

| #      | Quy tắc                                        | Quyết định                                                           |
| ------ | ---------------------------------------------- | -------------------------------------------------------------------- |
| BR-C01 | Member tạo content → status?                   | `pending`. Phải Contributor/Admin duyệt.                             |
| BR-C02 | Contributor tạo content → status?              | `published` ngay.                                                    |
| BR-C03 | Auto-publish miễn moderation?                  | **Không.** Vẫn có thể bị report.                                     |
| BR-C04 | Report = Violation?                            | **Không.** Admin mới xác nhận.                                       |
| BR-C05 | Report content Contributor → ai nhận noti?     | **Admin**.                                                           |
| BR-C06 | Ai quyết định cuối cùng?                       | **Admin.** 5 lựa chọn: No Violation / Warning / Hide / Demote / Ban. |
| BR-C07 | Contributor bị demote → role đổi?              | `contributor → member`. Badge biến mất. Ghi log.                     |
| BR-C08 | Self-approve/self-verify được không?           | **Không.** Tuyệt đối cấm.                                            |
| BR-C09 | Contributor có cần duyệt bài Contributor khác? | **Không.** Chỉ Member content mới cần.                               |

---

## 10. Luồng người dùng quan trọng

| Tình huống                        | Luồng bắt buộc                                         |
| --------------------------------- | ------------------------------------------------------ |
| Guest muốn bookmark               | Click → modal login → sau login tự redirect + bookmark |
| Member bị reject bài              | Noti + moderationReason → link edit + gợi ý sửa        |
| Tìm quán không có trong 5–20km    | Banner + nút "Xem công thức tự nấu"                    |
| Meal Planner không có nguyên liệu | Nút "Tạo theo BMI"                                     |
| Chatbot trả lời sai               | 👎 → dropdown lý do → lưu feedback                     |
| Member thêm quán                  | Noti khi approve/reject kèm lý do                      |
| Bài published bị edit             | Bản cũ vẫn hiển đến khi bản mới được duyệt             |
| User bị ban                       | Bài `hidden` tạm + noti lý do                          |
| Contributor apply bị reject       | Noti kèm lý do, apply lại sau 30 ngày                  |
| Contributor kiểm chứng AI         | Badge ✅/⚠️ bên dưới câu trả lời (chatlog công khai)   |
| Contributor bị demote             | Hạ về Member, bài giữ nhưng mất badge                  |

**Bookmark rules:** `POST /api/v1/bookmarks {postId}` — toggle. Chỉ recipe và video. Blog không có.

---

## 11. Rủi ro và Roadmap

### 11.1 Risk Matrix

| Rủi ro                      | Mức      | Giảm thiểu                                                   |
| --------------------------- | -------- | ------------------------------------------------------------ |
| Hết quota Gemini khi demo   | 🔴 Cao   | Quota Guest 5, cache, video demo backup                      |
| AI hallucination sai calo   | 🔴 Cao   | Temp 0.3 + disclaimer + nút báo sai + Contributor kiểm chứng |
| Spam / pending tồn đọng     | 🟡 Trung | blacklist + Contributor duyệt + bulk approve                 |
| Map GPS sai / hết quota     | 🟡 Trung | Fallback nhập tay + list view                                |
| Video nặng / Cloudinary đầy | 🟡 Trung | Giới hạn 100MB + ưu tiên YouTube                             |
| Render cold-start chậm      | 🟡 Trung | Warm-up cron + skeleton + cache                              |

---

_Version 1.4 — 15/09/2026 — Team Vegan Support Application_
