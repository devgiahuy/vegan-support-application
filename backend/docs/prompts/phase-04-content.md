# Prompt — Phase 04: Content Core & Media

Triển khai Phase 04 từ thư mục gốc của repository hiện tại. Không dùng memory từ session trước.

Đọc `AGENTS.md`, BL-04/05 trong implementation plan, phase map, integration guide và OpenAPI hiện tại. Xác minh Phase 01 và 03. Giữ thay đổi user không liên quan.

## Mục tiêu

Triển khai CRUD Recipe/Blog/Video, structured recipe data, revisions và Cloudinary/YouTube media contract.

## Scope bắt buộc

- Models/migration: posts, post revisions, recipe details, recipe ingredients, recipe diet compatibility/media references.
- Post types `RECIPE`, `BLOG`, `VIDEO`; validation field bắt buộc theo type.
- Ownership CRUD; Member submit pending; Contributor behavior chỉ dùng role/profile đã approved nếu Phase 07 đã có, nếu chưa thì Member path đầy đủ và policy hook rõ ràng, không giả cấp Contributor.
- Published edit tạo revision mới; public đọc active published revision.
- Ingredient canonicalization và `mealPlannerEligible`; unknown ingredient xử lý theo BL-04.
- Cloudinary signed upload endpoint chỉ trả signature/config an toàn; validate persisted public ID, secure URL, MIME/size metadata. Hỗ trợ YouTube URL allowlist/normalization.
- Endpoints posts CRUD, detail và upload signature. Không triển khai search ranking/related/community.
- Soft delete, optimistic version conflict và audit fields cơ bản.

## Acceptance

- Xử lý đầy đủ required fields theo type, owner/non-owner, Member state, revision visibility, unknown ingredient eligibility, delete và version conflict.
- Không nhận client-supplied author/status/publishedAt như authority.
- OpenAPI có polymorphic request/response schemas và examples.
- Integration guide/phase record cập nhật; endpoint chỉ READY khi hoàn chỉnh.
- Lint/typecheck/build pass.

Không triển khai comments, reports hoặc AI moderation trong phase này; giữ extension points rõ ràng.

Commit duy nhất:

```text
feat(content): implement posts recipes and media
```

Final báo hash, migration, endpoint READY và gate.
