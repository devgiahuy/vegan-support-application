# Tasks: payOS conversion

## Setup
- [x] T001 Record specification/research/contracts in `frontend/specs/031-payos-billing/`.
- [ ] T002 Update provider configuration and optional unique payment fields in `backend/src/config/env.ts` and `backend/prisma/schema.prisma`.

## US1 — payOS checkout
- [ ] T003 [US1] Replace provider adapter with signed SDK create/get in `backend/src/modules/billing/billing.providers.ts`.
- [ ] T004 [US1] Persist/recover checkout reference and link in `backend/src/modules/billing/billing.service.ts`.

## US2 — authoritative once-only settlement
- [ ] T005 [US2] Replace routes/OpenAPI, update maintenance and acceptance in `backend/src/modules/billing/`.

## US3 — history and client migration
- [ ] T006 [US3] Synchronize docs/OpenAPI, verify backend gates and commit on backend branch.
- [ ] T007 [US3] Merge backend commit into UI branch and sync Swagger before updating `frontend/src/features/billing/` and `mobile/src/features/billing/` DTO/models/mappers/queries/copy.
- [ ] T008 [US3] Verify mapper tests, web/mobile gates and browser unavailable/history states; update `frontend/docs/PROGRESS.md` and `WORK-LOG.md` and commit UI branch.

Dependencies: T002 → T003 → T004 → T005 → T006 → T007 → T008. Scope is implemented as one sequential conversion; no independent agent writes.
