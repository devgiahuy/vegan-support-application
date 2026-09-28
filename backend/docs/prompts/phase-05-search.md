# Prompt — Phase 05: Search & Related Content

Triển khai Phase 05 từ thư mục gốc của repository hiện tại; không phụ thuộc lịch sử chat.

Đọc `AGENTS.md`, BL-02/04 và Slice Search trong implementation plan, phase map, OpenAPI và integration guide. Xác minh Phase 04 đã merge.

## Mục tiêu

Thêm content discovery: search tiếng Việt có/không dấu, filter an toàn và related recipes/blogs/videos.

## Scope bắt buộc

- Normalized searchable fields/index hoặc PostgreSQL full-text strategy có migration rõ ràng.
- `GET /posts` hỗ trợ q, type, category, cook-time, difficulty, diet profile/ingredients và pagination.
- Guest chỉ thấy active published revision.
- Authenticated search áp dụng allergy, exclusions, diet pattern và enabled tradition rules từ backend; frontend query không được tự nới rule.
- Search ranking version 1: title > canonical ingredient > tags/body; deterministic tie-break.
- `GET /posts/:id/related` trả ba list riêng `recipes`, `blogs`, `videos`; chỉ published, loại current item, dedupe và limit rõ.
- Related score ưu tiên category/tag/ingredient overlap nhưng hard constraints luôn chạy trước.
- Ghi nhận query plan/index sanity check với seed dataset hợp lý làm performance evidence.

## Acceptance

- `dau hu` tìm được `đậu hũ`.
- Recipe chứa allergen/exclusion không xuất hiện cho user tương ứng dù score cao.
- Guest result không leak pending/hidden/rejected revision.
- Empty query/filter/pagination/error contract được xử lý đầy đủ.
- OpenAPI, integration guide, error catalog/changelog và phase record cập nhật.
- Lint/typecheck/build pass.

Không ghi behavior event hoặc xây home recommendation ở phase này.

Commit duy nhất:

```text
feat(search): add content discovery and related results
```

Final báo hash, index strategy, endpoint READY, performance evidence và gate.
