# Prompt — Phase 06: Community Interactions

Triển khai Phase 06 trong repository `/Users/thienel/hhnthienn/fptu/sem8/wdp/vegan-support-application`. Session mới phải đọc repo, không giả định context trước.

Đọc `AGENTS.md`, BL-11 trong implementation plan, phase map, OpenAPI và integration guide. Xác minh Auth và Content Core đã hoàn tất. Kiểm tra git status.

## Mục tiêu

Triển khai Comment, upvote, recipe rating và bookmark với ownership, uniqueness và aggregate đúng.

## Scope bắt buộc

- Models/migrations cho comments, votes, ratings, bookmarks và indexes/unique constraints.
- Comment chỉ trên published content; reply tối đa một tầng; edit owner; soft-delete giữ placeholder nếu có reply.
- Comment bị Admin hide không được author restore; chuẩn bị status cho Phase 08.
- Upvote create/delete idempotent, unique `(userId, postId)`.
- Rating Recipe only, taste/difficulty 1–5, upsert; averages tính server-side từ active records.
- Bookmark Recipe/Video only, create/delete idempotent.
- Pagination comments và list bookmark của current user nếu frontend cần; thêm contract/registry nếu tạo endpoint mới.
- Rate limit/anti-spam cơ bản có behavior deterministic.

## Acceptance

- Xử lý đầy đủ unauthenticated, owner/non-owner, wrong post type, duplicate concurrency/unique constraint, soft delete thread và aggregate rating.
- Counter/average không tin giá trị client gửi.
- OpenAPI/examples/errors và integration guide status/changelog cập nhật.
- Phase 06 completion record cập nhật.
- Lint/typecheck/build pass.

Không triển khai report/moderation quyết định trong phase này.

Commit duy nhất:

```text
feat(community): add comments votes ratings and bookmarks
```

Final báo hash, migrations, READY endpoints và gate.
