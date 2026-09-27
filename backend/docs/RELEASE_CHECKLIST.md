# Reviewed MVP release checklist

**Audit date:** 2026-09-27  
**Gate:** `IN_PROGRESS` — Phase 27 must not be marked complete or committed as the release commit while the P0 item below remains.

## Gate matrix

| Gate | Result | Evidence and limit |
| --- | --- | --- |
| Backend lint, typecheck, build | PASS | `npm run lint`, `npm run typecheck`, `npm run build` on Node 22. |
| Frontend contract consumer | PASS | Swagger synced from the generated backend document; TypeScript and 329 Vitest tests pass. Registration now sends the unified Contributor application fields. |
| Empty database migration and seed | PASS | All 33 migrations deployed to a separate empty PostgreSQL database; seed ran twice without failure. This does not prove every historical data migration shape. |
| OpenAPI | PASS with limit | Generated 168 operations; checked path/method entries, response IDs, references, and security declarations. A full schema/example semantic validator was not run. |
| Production image startup | PASS | Rebuilt Docker image applies migrations, seeds, starts, and serves health and `/api-docs.json`. Production configuration rejects enabled fake image and receipt providers; enabled OpenAI providers require a key. |
| Dietary and nutrition safety | PASS with limit | HTTP checks covered Contributor intent without privilege, diet/allergy exclusion, and cooking-aware estimates with source versions, assumptions, confidence, and partial coverage. The limited seed cannot validate all foods or clinical suitability. |
| Content, storage, planning | PASS | HTTP checks covered video review, custom meal and warnings, report without hard deletion, filtered storage pagination, and first-time concurrent quota reservation after the race fix. |
| Image/receipt workflow and OpenAI adapter | PASS locally with limit | Existing Phase 21 and 22 scripts covered job ownership, multi-image candidates, confirmation, duplicate retry, and shopping gaps with fixtures. A local OpenAI-compatible server verified image URL requests, strict schema mapping, receipt lines, and partial provider errors. No real OpenAI image call or accuracy evaluation was run. |
| AI boundaries and fallback | PASS with limit | Existing AI review and governance acceptance scripts passed; disabled-provider fallback was exercised. Live provider failure modes were not exercised. |
| Index/query review | PASS with limit | Schema/migration review found indexes for trigram search, aliases, plans, pantry, jobs, notifications, and storage/AI queues. Seed volumes are too small for production query-plan or load conclusions. |
| Privacy and operations | PARTIAL | `.dockerignore` excludes local secrets from image context; cleanup/reconciliation commands are documented. External backup, deletion, and retention execution are deployment responsibilities and were not tested here. |

## Critical scenarios

The ten scenarios in `docs/IMPLEMENTATION_PLAN.md` §10 were exercised at API/service level or by the repository's existing acceptance scripts. Scenarios 7 and 8 establish the **confirmation boundary with fake candidates**; the new OpenAI adapter was exercised against a local protocol stub, not real-image recognition or OCR quality. Scenario 4 used concurrent first-account reservations and confirmed a single winning reservation with quota responses for the rest. The clean-database run used only a temporary audit database.

## Unresolved items, by severity

| Severity | Item | Release action |
| --- | --- | --- |
| **P0** | OpenAI image adapters now send committed image URLs to a vision-capable model, but real fridge photos and Vietnamese receipts have not been evaluated. The job routes cannot yet be claimed production READY. | Run a representative consented image set through the configured OpenAI account, measure omissions/incorrect quantities and line prices, check partial failures and retention, then restore READY status if the gate passes. Keep the capabilities disabled in shared/production environments until then. |
| **P1** | Legacy Contributor migration was applied only to an empty database. A historical rejected application with a null reviewer may violate the new check constraint. | Rehearse the migration against a scrubbed legacy snapshot and repair data or migration if needed. |
| **P1** | OpenAPI was structurally checked, but examples and every error response were not semantically validated against the generated schemas. | Run a full contract validator and review the READY route error catalog before release signoff. |
| **P2** | The index review is static and demo data is small; high-volume latency, queue scans, and retention job scheduling were not measured in a production-like environment. | Capture `EXPLAIN ANALYZE` and load metrics with representative data, schedule cleanup/reconciliation, and verify backup/restore and retention operations. |

## Demo startup

From `backend/`, copy `.env.example` to `.env`, set distinct `SEED_MEMBER_PASSWORD` and `SEED_ADMIN_PASSWORD`, and replace the database, JWT, guest-cookie, and provider secrets before a shared deployment. Keep `VISION_ENABLED=false` and `RECEIPT_ENABLED=false` until a real-image evaluation passes. For an isolated OpenAI evaluation, set `VISION_PROVIDER=openai`, `RECEIPT_PROVIDER=openai`, enable the desired capability, and supply `OPENAI_API_KEY` plus a compatible `OPENAI_BASE_URL`. Use JPEG/PNG/WebP images; the fake adapter remains available for deterministic development checks.

```bash
docker compose -f docker-compose.yml up --build
```

The API is then at `http://localhost:4000/api/v1/health`, with Swagger at `http://localhost:4000/api-docs` and JSON at `http://localhost:4000/api-docs.json`. To use host processes instead, start PostgreSQL, then run `npm ci`, `npm run prisma:migrate:deploy`, `npm run seed`, and `npm run dev` from `backend/`. Daily maintenance: `npm run storage:cleanup`, `npm run notifications:cleanup`, `npm run ai-governance:cleanup`; inspect `npm run storage:reconcile` before any `-- --apply` run.
