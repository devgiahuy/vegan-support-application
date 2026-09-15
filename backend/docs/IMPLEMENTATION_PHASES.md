# Backend Implementation Phases

**Version:** 1.6

**Cập nhật:** 15/09/2026

**Stack baseline:** Node.js · Express · TypeScript · PostgreSQL · Prisma · Zod · OpenAPI

Tài liệu này chia backend thành các phase đủ nhỏ để triển khai, xác minh và commit riêng. Mỗi phase được thực hiện trong một session mới bằng prompt tương ứng trong `backend/docs/prompts/`.

## 1. Nguyên tắc thực hiện

- Phase có dependency về source code, nhưng không phụ thuộc lịch sử hội thoại. Session mới phải xác minh prerequisite trực tiếp từ repository.
- Một phase chỉ làm đúng scope được ghi; không kéo feature của phase sau vào commit.
- Mỗi phase kết thúc bằng đúng một commit riêng sau khi gate lint/typecheck/build pass.
- Không duy trì automated unit hoặc integration test trong các phase backend.
- Không đưa `.DS_Store`, secret hoặc thay đổi không liên quan vào commit.
- Mọi endpoint mới/đổi phải cập nhật OpenAPI và `frontend/docs/BACKEND_INTEGRATION.md` trong cùng commit.
- Chỉ chuyển endpoint sang `READY` khi route, validation, authorization, migration/seed, OpenAPI và gate lint/typecheck/build đều hoàn chỉnh.
- Nếu prerequisite chưa có hoặc repository đang có thay đổi chồng lấn không thể bảo toàn, dừng và báo rõ; không tự viết lại phase trước.

## 2. Phase map

| Phase | Tên                              | Dependency     | Kết quả chính                                                | Commit đề xuất                                                |
| ----- | -------------------------------- | -------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| 00    | Backend Foundation               | Không          | Express TS, config, Prisma, OpenAPI, health                  | `chore(backend): bootstrap service foundation`                |
| 01    | Authentication & Sessions        | 00             | Register/login/refresh/logout, RBAC primitives               | `feat(auth): implement authentication and sessions`           |
| 02    | Profile, Health & Diet Rules     | 01             | Profile, BMI/BMR/TDEE, rule preview/toggle, periodic dates   | `feat(profile): add health and diet preferences`              |
| 03    | Category & Ingredient Catalog    | 01             | Category tree, canonical ingredients, diet/allergen metadata | `feat(catalog): add categories and ingredients`               |
| 04    | Content Core & Media             | 01, 03         | Recipe/Blog/Video CRUD, revisions, Cloudinary contract       | `feat(content): implement posts recipes and media`            |
| 05    | Search & Related Content         | 04             | Search không dấu, filters, related mixed content             | `feat(search): add content discovery and related results`     |
| 06    | Community Interactions           | 01, 04         | Comment, upvote, rating, bookmark                            | `feat(community): add comments votes ratings and bookmarks`   |
| 07    | Contributor Applications         | 01             | Apply at registration/upgrade, Admin approval, subtype RBAC  | `feat(contributors): implement application and approval flow` |
| 08    | Moderation & Reports             | 04, 06, 07     | Review queue, AI flags, reports, hide/restore/ban, audit     | `feat(moderation): add review reports and audit workflow`     |
| 09    | Behavior Events & Recommendation | 02, 04, 06     | Consent-aware events, scoring v1, explanations               | `feat(recommendations): add behavioral ranking v1`            |
| 10    | Meal Planner                     | 02, 03, 04, 09 | Generate/version/swap/shopping list, hard constraints        | `feat(meal-plans): implement weekly planner`                  |
| 11    | AI Chat Gateway                  | 01, 02         | Provider adapter, quota, SSE, private history, feedback      | `feat(chat): implement nutrition ai gateway`                  |
| 12    | AI Sharing & Expert Verification | 07, 11         | Public answers, correction records, expert/Admin permissions | `feat(ai-review): add sharing and expert verification`        |
| 13    | Restaurants & Google Maps        | 01, 02         | Internal/Google hybrid, nearby/search/submission/review      | `feat(restaurants): add location and maps integration`        |
| 14    | Notifications                    | 01, 07, 08, 13 | In-app notifications, dedupe, read/read-all, retention       | `feat(notifications): add in-app event notifications`         |
| 15    | Admin AI Governance              | 08, 11, 12     | Metrics, redacted request logs, flags, feature toggle        | `feat(ai-admin): add governance metrics and controls`         |
| 16    | Hardening & MVP Release Gate     | 00–15          | Security, E2E, seed, build, docs, release checklist          | `test(backend): harden mvp release flows`                     |

## 3. Dependency graph

```text
00 Foundation
└── 01 Auth
    ├── 02 Profile/Diet
    │   ├── 09 Behavior ─────────────┐
    │   ├── 10 Meal Planner <── 03/04┤
    │   ├── 11 AI Chat ── 12 Review │
    │   └── 13 Restaurants           │
    ├── 03 Catalog ── 04 Content ────┤
    │                   ├── 05 Search│
    │                   ├── 06 Community
    │                   └── 08 Moderation <── 07 Contributor
    ├── 07 Contributor               │
    └── 14 Notifications <── 07/08/13

08 + 11 + 12 ── 15 AI Governance
00–15 ───────── 16 Hardening
```

Phase 02, 03 và 07 có thể được thực hiện song song sau Phase 01 nếu dùng worktree/branch riêng và phối hợp migration numbers. Phase 05, 06, 09, 11 và 13 cũng có thể song song sau khi dependency tương ứng đã merge.

## 4. Deliverable bắt buộc của mọi phase

Mỗi phase phải tạo/cập nhật, nếu áp dụng:

1. Prisma schema và migration.
2. Zod request/query/response schemas.
3. Route/controller/service/repository.
4. Authorization và ownership rules.
5. OpenAPI schemas/examples/errors.
6. Seed/fixture phục vụ local validation và demo.
7. `frontend/docs/BACKEND_INTEGRATION.md`:
   - endpoint status;
   - backend update date/commit;
   - error codes;
   - changelog.
8. Một commit chỉ chứa scope của phase.

## 5. Gate trước khi commit

Chạy script tương ứng do Phase 00 thiết lập, tối thiểu:

```bash
npm run lint
npm run typecheck
npm run build
```

Sau đó:

```bash
git diff --check
git status --short
git diff --stat
```

Chỉ stage file thuộc phase. Xem staged diff trước khi commit. Nếu validation thủ công phụ thuộc service ngoài, dùng provider fake/local adapter khi có thể và ghi rõ live check nào chưa chạy.

## 6. Phase completion record

Cập nhật bảng này trong commit của phase. `Commit` phải là hash thật sau khi commit; nếu việc tự cập nhật hash vào cùng commit không khả thi, ghi hash vào changelog/integration guide ở phase kế tiếp hoặc dùng commit reference trong PR.

| Phase | Status        | Completed date | Commit            | Notes                                                    |
| ----- | ------------- | -------------- | ----------------- | -------------------------------------------------------- |
| 00    | `COMPLETED`   | 2026-09-15     | This phase commit | Foundation gate passed; hash reported in phase handoff   |
| 01    | `COMPLETED`   | 2026-09-15     | This phase commit | Auth/session gate passed; hash reported in phase handoff |
| 02    | `COMPLETED`   | 2026-09-15     | This phase commit | Profile/health/diet gates passed; rule set v1 seeded     |
| 03    | `COMPLETED`   | 2026-09-15     | This phase commit | Catalog gates passed; category/ingredient seed ready     |
| 04    | `COMPLETED`   | 2026-09-15     | This phase commit | Content/media gates passed; published demo seed ready    |
| 05    | `COMPLETED`   | 2026-09-15     | This phase commit | Search/related gates passed; pg_trgm plan evidence saved |
| 06    | `NOT_STARTED` | —              | —                 | —                                                        |
| 07    | `NOT_STARTED` | —              | —                 | —                                                        |
| 08    | `NOT_STARTED` | —              | —                 | —                                                        |
| 09    | `NOT_STARTED` | —              | —                 | —                                                        |
| 10    | `NOT_STARTED` | —              | —                 | —                                                        |
| 11    | `NOT_STARTED` | —              | —                 | —                                                        |
| 12    | `NOT_STARTED` | —              | —                 | —                                                        |
| 13    | `NOT_STARTED` | —              | —                 | —                                                        |
| 14    | `NOT_STARTED` | —              | —                 | —                                                        |
| 15    | `NOT_STARTED` | —              | —                 | —                                                        |
| 16    | `NOT_STARTED` | —              | —                 | —                                                        |

## 7. Prompt index

| Phase | Prompt                                                               |
| ----- | -------------------------------------------------------------------- |
| 00    | [`phase-00-foundation.md`](prompts/phase-00-foundation.md)           |
| 01    | [`phase-01-auth.md`](prompts/phase-01-auth.md)                       |
| 02    | [`phase-02-profile-diet.md`](prompts/phase-02-profile-diet.md)       |
| 03    | [`phase-03-catalog.md`](prompts/phase-03-catalog.md)                 |
| 04    | [`phase-04-content.md`](prompts/phase-04-content.md)                 |
| 05    | [`phase-05-search.md`](prompts/phase-05-search.md)                   |
| 06    | [`phase-06-community.md`](prompts/phase-06-community.md)             |
| 07    | [`phase-07-contributors.md`](prompts/phase-07-contributors.md)       |
| 08    | [`phase-08-moderation.md`](prompts/phase-08-moderation.md)           |
| 09    | [`phase-09-recommendations.md`](prompts/phase-09-recommendations.md) |
| 10    | [`phase-10-meal-planner.md`](prompts/phase-10-meal-planner.md)       |
| 11    | [`phase-11-ai-chat.md`](prompts/phase-11-ai-chat.md)                 |
| 12    | [`phase-12-ai-review.md`](prompts/phase-12-ai-review.md)             |
| 13    | [`phase-13-restaurants.md`](prompts/phase-13-restaurants.md)         |
| 14    | [`phase-14-notifications.md`](prompts/phase-14-notifications.md)     |
| 15    | [`phase-15-ai-governance.md`](prompts/phase-15-ai-governance.md)     |
| 16    | [`phase-16-hardening.md`](prompts/phase-16-hardening.md)             |

## 8. Cách dùng prompt trong session mới

1. Đảm bảo phase dependency đã được merge vào branch hiện tại.
2. Mở đúng file prompt và gửi nguyên nội dung cho session mới.
3. Không cần copy lịch sử chat cũ; prompt yêu cầu agent đọc các nguồn sự thật trong repo.
4. Sau khi session hoàn tất, kiểm tra commit và cập nhật branch trước khi chạy phase phụ thuộc.
5. Nếu muốn chạy song song, dùng worktree/branch riêng và không để hai phase cùng sửa một migration hoặc cùng endpoint contract.
