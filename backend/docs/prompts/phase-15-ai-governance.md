# Prompt — Phase 15: Admin AI Governance

Triển khai Phase 15 trong repository `/Users/thienel/hhnthienn/fptu/sem8/wdp/vegan-support-application`; session độc lập.

Đọc `AGENTS.md`, BL-06/09/15 trong implementation plan, phase map, AI Chat/Moderation/Verification code, OpenAPI và integration guide. Xác minh phases 08, 11, 12.

## Mục tiêu

Triển khai dashboard backend contract cho AI metrics, redacted logs, flags và audited feature toggle.

## Scope bắt buộc

- Hoàn thiện `ai_request_logs`, `ai_feedback`, `ai_feature_configs` và indexes/retention cần thiết.
- Metrics đúng định nghĩa BL-15: requests, error/fallback, latency p50/p95, feedback/negative, override, verification decisions, token usage và cost estimate.
- Filter theo date range/feature/provider/model; timezone/query validation rõ.
- Log list chỉ trả payload đã redact/allowlist; không trả raw health/PII/prompt secret.
- Feature config read/update; Admin only; update cần reason và audit old/new.
- Disable Chatbot trả `AI_FEATURE_DISABLED` cho message mới nhưng history vẫn hoạt động.
- Disable AI explanation không làm hỏng rule Meal Planner.
- AI flags list liên kết moderation decision để tính override rate.
- Aggregation deterministic trên fixture/seed cố định; tránh N+1/full-table unbounded query.

## Acceptance

- Xử lý đầy đủ metric formulas/zero denominator/date filters, role denial, redaction, feature toggle behavior, audit và concurrency.
- Cost field ghi rõ estimate nếu không phải billing actual.
- OpenAPI/integration guide/changelog/phase record cập nhật.
- Lint/typecheck/build pass.

Không triển khai retrain, binary model deployment hoặc automatic rollback.

Commit duy nhất:

```text
feat(ai-admin): add governance metrics and controls
```

Final báo hash, metric definitions, endpoints READY, query/performance evidence và gate.
