# Prompt — Phase 12: AI Sharing & Expert Verification

Triển khai Phase 12 trong repository `/Users/thienel/hhnthienn/fptu/sem8/wdp/vegan-support-application`. Không dùng memory hội thoại trước.

Đọc `AGENTS.md`, BL-01/09 và AI verification state machine trong implementation plan, phase map, Contributor/Chat code, OpenAPI và integration guide. Xác minh phases 07 và 11.

## Mục tiêu

Cho phép authenticated user share từng AI answer và cho Admin-approved Nutrition Expert/Admin verify hoặc correct với audit đầy đủ.

## Scope bắt buộc

- Model/migration `ai_verifications` với unique active target, decision, note/correction, reviewer type snapshot và audit timestamps.
- Share/unshare từng assistant answer; session/private user data không tự public.
- Guest không được share.
- Public list chỉ trả field allowlist và anonymize author theo lựa chọn.
- Original AI answer immutable; correction là record riêng và được UI ưu tiên trình bày.
- Chỉ approved `NUTRITION_EXPERT` và Admin được verify/correct/reject nutrition output; Experienced Contributor trả 403.
- Cấm self-verification theo actor/owner business rule.
- Concurrent verification thứ hai trả 409; Admin override/remove cần reason.
- Unshare làm verification không public nhưng giữ audit.
- Endpoints share, public list/detail nếu cần và verification create/override.

## Acceptance

- Xử lý đầy đủ private data leakage, Guest share, type permission, self-verify, concurrency, correction immutability, unshare và Admin override.
- Public DTO không chứa health profile, email, full private session hoặc raw request logs.
- OpenAPI/integration guide/errors/changelog/phase record cập nhật.
- Lint/typecheck/build pass.

Không thêm certificate verification; badge vẫn là Admin-approved.

Commit duy nhất:

```text
feat(ai-review): add sharing and expert verification
```

Final báo hash, endpoints READY, privacy review và gate.
