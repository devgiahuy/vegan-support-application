# Prompt — Phase 09: Behavior Events & Recommendation

Triển khai Phase 09 trong repository `/Users/thienel/hhnthienn/fptu/sem8/wdp/vegan-support-application`; không dùng context chat cũ.

Đọc `AGENTS.md`, BL-02/04/08 trong implementation plan, phase map, Search/Community/Profile code, OpenAPI và integration guide. Xác minh phases 02, 04, 06.

## Mục tiêu

Triển khai consent-aware behavior collection và recommendation scoring version 1 có thể giải thích.

## Scope bắt buộc

- Models/migration cho behavior events và personalization consent/version nếu chưa có.
- Event types: SEARCH, VIEW_RECIPE, BOOKMARK, RATE, CHAT_TOPIC, ACCEPT_MEAL, SWAP_MEAL, REJECT_MEAL.
- Ingestion validate entity ownership/existence, metadata allowlist, idempotency/dedupe và consent.
- Chỉ dùng data của chính user; anonymous Guest events không dùng personalization.
- Lookback 30 ngày, recency decay và scoringVersion.
- Candidate retrieval sau hard-filter allergy/exclusion/diet/enabled tradition; ranking không thể reintroduce excluded recipe.
- Cold-start popular/rated fallback.
- Response trả tối đa hai stable reason codes cùng entity metadata cần cho UI.
- Endpoint recommendations home, event ingestion, personalization enable/disable và delete behavior history.
- Không log raw chat text làm event; Phase 11 chỉ gửi extracted topic codes.

## Acceptance

- Exact weights/tie-break/decay/negative signals/cold start, consent off, cross-user isolation, delete history và hard-constraint dominance được triển khai deterministic.
- Hai users với behavior khác nhau nhận ranking khác nhau trên seed fixture.
- OpenAPI/integration guide/error/changelog/phase record cập nhật.
- Lint/typecheck/build pass.

Không dùng embeddings/vector DB/LLM ranking trong MVP.

Commit duy nhất:

```text
feat(recommendations): add behavioral ranking v1
```

Final báo hash, scoring version/weights, endpoint READY và gate.
