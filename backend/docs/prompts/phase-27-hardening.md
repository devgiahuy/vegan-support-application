# Prompt — Phase 27: Hardening & MVP Release Gate

Implement Phase 27 from the current repository root. This is a fresh audit session: do not trust completion labels without verifying code, migrations, OpenAPI, and integration status.

Read root `AGENTS.md`, all of `docs/SRS.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/ROADMAP_PHASE_2.md`, `backend/docs/IMPLEMENTATION_PHASES.md`, `frontend/docs/BACKEND_INTEGRATION.md`, backend README/OpenAPI, and relevant git history. Verify Phases 00–26. Preserve unrelated changes.

## Goal

Close the reviewed MVP release gate through security, consistency, migration/seed, failure-mode, OpenAPI, and documentation review. Add no new product feature.

## Required scope

- Audit every endpoint for authentication, unified Contributor authorization, ownership/IDOR, validation, pagination, request limits, error envelope, state transitions, idempotency, and sensitive-data leakage.
- Audit dietary hard-filter precedence; no recommendation may restore an excluded/allergenic item.
- Audit AI boundaries: no canonical rule auto-promotion, no auto-publication/deletion/ban, correct confidence/provenance, provider-down fallback, redacted governance logs.
- Audit storage reservation races/reconciliation, media ownership, multi-image/receipt confirmation boundaries, pantry accounting, meal-analysis invalidation, and multi-week version conflicts.
- Run migrations from an empty database and deterministic seed for demo accounts/data. Ensure legacy Contributor migration is safe.
- Exercise all critical E2E scenarios in the implementation plan at API/backend level using existing project mechanisms; do not introduce a new automated test framework.
- Review indexes/query paths for search, queues, food aliases, plans, pantry, jobs, notifications, and metrics.
- Ensure every READY endpoint has complete OpenAPI schema/examples/errors/security and frontend integration documentation.
- Review secrets, `.env.example`, logging, privacy/retention jobs, provider configuration, and production startup instructions.
- Update backend README and release checklist. Do not mark Phase 27 complete while a known P0 blocker remains.

## Explicit exclusions

Do not implement Roadmap Phase 2: payments, certificates, formal DMCA, STT/video summary, wearables, extra traditions, advanced moderation, or new GenAI ranking.

## Acceptance and handoff

- Lint, typecheck, build, clean migration + seed, OpenAPI validation, and `git diff --check` pass.
- Runtime contract statuses are truthful and all unresolved items are severity-ranked.
- Update phase record and changelogs only after the gate passes.
- Create exactly one commit when release-ready:

```text
test(backend): harden reviewed mvp release flows
```

Final report: hash, gate matrix, migration/seed status, endpoints not READY, residual risks, and exact demo startup steps.
