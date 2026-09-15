# Repository Instructions

These instructions apply to the entire repository.

## Required context

Before changing product behavior, backend APIs, database schemas, or frontend API integration, read:

1. `docs/IMPLEMENTATION_PLAN.md` — approved scope, business rules, state machines, sequencing, and Definition of Done.
2. `backend/docs/IMPLEMENTATION_PHASES.md` — backend phase dependency, completion gates, and prompt index.
3. The prompt for the active phase under `backend/docs/prompts/`, when phase-based implementation is requested.
4. `frontend/docs/BACKEND_INTEGRATION.md` — live backend capability status and frontend integration contract.
5. `frontend/docs/ARCHITECTURE.md` — mandatory frontend DTO/Model/Mapper and query-layer conventions.
6. `docs/SRS.md` once it exists. Until the SRS files are consolidated, do not silently resolve conflicting requirements; follow the decisions in the implementation plan and flag remaining conflicts.

## Backend contract synchronization — mandatory

Every backend change that adds or modifies a route, request, response, enum, error code, authorization rule, state transition, or externally observable business behavior must update all applicable artifacts in the same change:

- Backend OpenAPI schema served at `/api-docs.json`.
- `frontend/docs/BACKEND_INTEGRATION.md` endpoint status, notes, error catalog, and changelog.
- Prisma migration and seed data when persistence changes.
- Backend lint, typecheck, and build gates.
- `docs/IMPLEMENTATION_PLAN.md` when an approved business rule or scope decision changes.
- `backend/docs/IMPLEMENTATION_PHASES.md` completion record when the active phase gate passes.

Do not mark an endpoint `READY` in `BACKEND_INTEGRATION.md` until its OpenAPI schema, authorization, migration/seed requirements, and lint/typecheck/build gates are complete. A route existing in source code is not sufficient.

Backend phases do not maintain automated unit or integration test suites. Do not add test infrastructure unless this repository policy is explicitly changed again.

For phase-based backend work, implement only the active prompt's scope and create one scoped commit with its specified message after verification. Do not include work from a later phase merely because it is convenient.

If a backend change is breaking, set the affected endpoint status to `CHANGING`, document the frontend migration action, and return it to `READY` only after the consumer is updated.

## Frontend integration — mandatory

- Integrate only endpoints marked `READY` in `frontend/docs/BACKEND_INTEGRATION.md`.
- Run `npm run sync:swagger` from `frontend/` before implementing or updating an API consumer.
- Add every path to `src/common/constants/api-endpoints.ts`; do not hard-code endpoint strings inside features.
- Every API consumer requires separate request/response DTOs, UI Models, Mappers, API functions, TanStack Query keys/hooks, and mapper tests.
- Components must not consume raw backend DTOs and must not use `any`.
- Handle documented business error codes and loading/error/empty/success states.
- After successful integration, update the `FE integrated` column and changelog in `frontend/docs/BACKEND_INTEGRATION.md`.

## Business-rule safety

- Allergy, explicit ingredient exclusions, diet pattern, and enabled tradition rules are backend-enforced constraints. Frontend checks are UX only.
- Requested Contributor type never grants permission. Only the approved role/profile returned by backend authorization is authoritative.
- AI flags and user reports are signals, not final violations. Automated logic must not hard-delete content.
- Behavioral ranking must never reintroduce a recipe removed by dietary or allergy constraints.
- Do not hard-code an AI model ID or vendor quota in domain logic; use configuration/provider adapters.
- Do not claim certificates are verified in the MVP; certificate upload/verification is Phase 2.

## Documentation accuracy

- Clearly distinguish `PLANNED`, `IN_PROGRESS`, `READY`, `CHANGING`, `DEPRECATED`, and `REMOVED` capabilities.
- Do not document mocked UI as an implemented backend capability.
- Update dates and versions when modifying living documents.
- Preserve an audit-friendly changelog for contract or business behavior changes.

## Verification before handoff

For backend changes, run lint, typecheck, build, relevant OpenAPI generation/sync, and `git diff --check`. Frontend consumer changes still run their relevant type checks/tests. Report anything not run and why.
