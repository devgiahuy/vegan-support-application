# Prompt — Phase 11: AI Chat Gateway

Triển khai Phase 11 từ thư mục gốc của repository hiện tại; không dựa vào chat session trước.

Đọc `AGENTS.md`, BL-08/09/15 trong implementation plan, phase map, Auth/Profile code, OpenAPI và integration guide. Xác minh phases 01 và 02.

## Mục tiêu

Triển khai OpenAI-backed nutrition chatbot với quota, SSE, private history, feedback, privacy và graceful fallback. OpenAI là live provider duy nhất của MVP; integration vẫn nằm sau `AiProvider` boundary để development/fallback không phụ thuộc external service.

## Scope bắt buộc

- Models/migrations: chat sessions/messages, AI request logs tối thiểu, feedback và quota accounting phù hợp concurrency.
- `AiProvider` adapter với OpenAI implementation dùng official SDK và Responses API streaming; không để OpenAI event shape rò ra API contract nội bộ.
- Config mặc định: `AI_PROVIDER=openai`, `AI_MODEL_CHAT=gpt-5.6-terra`, `AI_MODEL_MODERATION=omni-moderation-latest`; model/timeout/token vẫn đọc từ environment/database, không hard-code trong domain.
- Fake/local provider cho development. Live OpenAI path chỉ active khi có `OPENAI_API_KEY`; thiếu secret hoặc provider lỗi phải graceful fallback. Không thêm live LLM provider khác trong MVP.
- Chat session create/list/messages; SSE event contract `message_start/content_delta/message_complete/quota/error`.
- Quota chỉ trừ khi successful completed response; retry nội bộ không trừ thêm.
- Guest signed anonymous cookie + IP/device limit; history tối đa 7 ngày, không public/personalization.
- Authenticated history private; prompt dùng tối thiểu profile đã consent, redact PII.
- Topic boundary, fixed disclaimer, safety fallback và feature-disabled error hook.
- Feedback up/down + reason.
- Nếu personalization consent active, chỉ emit allowlisted CHAT_TOPIC code, không raw chat text.

## Acceptance

- Xử lý đầy đủ SSE success/partial error/abort, quota concurrency/reset Asia/Ho_Chi_Minh, retry accounting, guest spoof resistance, history ownership, provider timeout/fallback và redacted log.
- Core API không fail khi OpenAI unavailable.
- OpenAPI mô tả streaming events và business errors.
- Integration guide/status/changelog/phase record cập nhật.
- Lint/typecheck/build pass.

Không triển khai public sharing hoặc Contributor verification; dành cho Phase 23 theo phase map hiện hành.

Commit duy nhất:

```text
feat(chat): implement nutrition ai gateway
```

Final báo hash, provider adapter, quota logic, endpoints READY, gate và live-provider status.
