# Prompt — Phase 26: Admin AI Governance

Implement Phase 26 from the current repository root using repository evidence only.

Read root `AGENTS.md`, `docs/SRS.md`, BL-18, every AI/moderation module, phase map, OpenAPI, and frontend integration guide. Verify Phases 08, 11, 13, 16, 21, 22, and 23.

## Goal

Give Administrators auditable visibility and safe control over AI capabilities without coupling domain logic to a provider/model.

## Required scope

- Normalize logs across chat, nutrition estimation, moderation, fridge vision, receipt extraction, and verification: capability, provider/model, template version, correlation ID, timestamps, latency, status/error class, quota/token/cost metadata when available, confidence/coverage, and safety outcome.
- Minimize/redact prompts, health data, images, receipts, credentials, and provider payloads; document retention and access controls.
- Admin endpoints for paginated/redacted logs, aggregate failure/latency/usage metrics, feedback, moderation false-positive signals, recognition/receipt correction rates, nutrition coverage/confidence, and verification outcomes.
- Configurable capability/provider feature toggles with audit reason, stale-config safety, and explicit fallback behavior.
- Do not hard-code model IDs or quotas in domain logic. No UI action can retrain a model or auto-sanction a user/content item.
- Add operational health summaries and retention cleanup.

## Acceptance and handoff

- Validate Admin-only access, redaction, pagination/filtering, disabled provider fallback, config audit, missing provider metrics, retention cleanup, and no automatic hard moderation.
- Update migration/config, OpenAPI, integration errors/status/changelog, and phase record.
- Run lint, typecheck, build, OpenAPI validation, sensitive-field audit, and `git diff --check`.
- Commit exactly:

```text
feat(ai-admin): add governance metrics and controls
```

Final report: hash, metric catalog, redaction/retention/toggle behavior, READY endpoints, and unrun checks.
