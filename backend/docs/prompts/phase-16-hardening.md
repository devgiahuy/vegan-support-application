# Prompt — Phase 16: Hardening & MVP Release Gate

Triển khai Phase 16 trong repository `/Users/thienel/hhnthienn/fptu/sem8/wdp/vegan-support-application`. Đây là session độc lập và không được giả định phase trước hoàn chỉnh chỉ vì tài liệu ghi completed.

Đọc toàn bộ `AGENTS.md`, `docs/IMPLEMENTATION_PLAN.md`, `backend/docs/IMPLEMENTATION_PHASES.md`, `frontend/docs/BACKEND_INTEGRATION.md`, backend README/OpenAPI và git history liên quan. Xác minh phases 00–15 bằng code, migrations và endpoint registry. Bảo toàn thay đổi user không liên quan.

## Mục tiêu

Đóng release gate backend MVP: security review, cross-module consistency, seed, build, documentation và failure modes. Không thêm feature mới.

## Scope bắt buộc

- Audit toàn bộ endpoint cho auth, role, subtype, ownership, pagination, validation, request limits và error envelope.
- Audit IDOR/broken access control, self-approve/self-verify, stale role token, forged guest identity, upload validation và sensitive log leakage.
- Chạy migrations từ database rỗng và seed deterministic accounts/content/recipes/restaurants/behavior/AI fixtures.
- Rà tám critical demo scenarios trong implementation plan ở backend/API level.
- Rà provider-down: AI và Maps degrade mà core vẫn chạy.
- Rà concurrency/idempotency: refresh rotation, votes/ratings/bookmarks, reports, verification, meal generation nếu applicable.
- Kiểm tra query/index cho search, nearby, moderation queue và AI metrics trên demo-sized dataset.
- Rà OpenAPI: không còn READY endpoint thiếu schema/example/error/auth description.
- Rà `frontend/docs/BACKEND_INTEGRATION.md`: status đúng với code, không khai READY sai; changelog đầy đủ.
- Rà secrets, `.env.example`, logging, health data/PII, retention jobs và production start instructions.
- Cập nhật backend README với setup, migrate, seed, lint/typecheck/build, run và demo accounts không chứa credential production.

## Acceptance

- Lint/typecheck/build đều pass từ clean checkout/setup được mô tả.
- Database rỗng migrate + seed thành công.
- Critical demo flow có blocker cụ thể phải được ghi; không đánh Phase 16 completed nếu còn P0 failure đã biết.
- `git diff --check` pass.
- Phase record và integration docs phản ánh trung thực trạng thái cuối.

Không refactor lớn ngoài những gì cần để sửa lỗi release; không triển khai CV/STT/HealthKit/full GenAI.

Khi và chỉ khi gate pass, tạo đúng một commit:

```text
test(backend): harden mvp release flows
```

Final báo commit hash, gate result, migrations/seed status, endpoint còn chưa READY, rủi ro còn lại và hướng chạy demo.
