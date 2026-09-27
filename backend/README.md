# Vegan Support Backend

Express/TypeScript API for the Vegan Support Application. Phases 00–26 are present in source,
migrations, and OpenAPI. They cover accounts, dietary constraints, content and review, food data,
nutrition estimates, plans, pantry, storage, Contributor approval, AI workflows, restaurants,
notifications, and governance. Phase 27 release status and remaining risks are tracked in
[`docs/RELEASE_CHECKLIST.md`](docs/RELEASE_CHECKLIST.md).

Endpoint readiness is tracked in `frontend/docs/BACKEND_INTEGRATION.md` and phase completion in
`backend/docs/IMPLEMENTATION_PHASES.md`. The reviewed requirements are in `docs/SRS.md`.

## Prerequisites

- Node.js 22 or newer
- PostgreSQL 14 or newer
- npm 10 or newer

The current stack has no Redis dependency.

## Local setup

1. Copy `.env.example` to `.env` and adjust local values.
2. Set `SEED_MEMBER_PASSWORD` and `SEED_ADMIN_PASSWORD` to distinct local passwords. Change the
   database, JWT, guest-cookie, and provider credentials before any shared deployment.
3. For a Docker demo, run `docker compose -f docker-compose.yml up --build`. The backend image
   applies migrations, runs the idempotent seed, then starts the API. `prisma` is a runtime
   dependency so migration deployment works without a network download.
4. For a host demo, start PostgreSQL, run `npm ci`, `npm run prisma:migrate:deploy`, `npm run seed`,
   then `npm run dev` from `backend/`.

The Docker demo uses a fake maps provider and disables image recognition and receipt extraction by
default. To use real image analysis, set `VISION_PROVIDER=openai`, `RECEIPT_PROVIDER=openai`,
`VISION_ENABLED=true`, `RECEIPT_ENABLED=true`, and `OPENAI_API_KEY`. Both jobs use the configured
`OPENAI_BASE_URL` and configurable vision/receipt model IDs (default `gpt-5.6-terra` for OpenAI).
That endpoint must support Responses image inputs and strict JSON schema output. The OpenAI jobs
accept JPEG, PNG, and WebP; AVIF is accepted only by the fake development adapter. Receipt analysis
uses original image detail for small text; fridge analysis uses high detail. Model output is advisory
and can be wrong, so users must review candidates before Pantry changes. `fake` remains a
deterministic development fixture and cannot be enabled in production. Live OpenAI image accuracy
has not yet been validated on representative Vietnamese photos/receipts; see the release checklist.
Chat uses `AI_PROVIDER=openai` and needs an
API key for live answers; without one it returns a documented static advisory fallback. Google
Maps requires `MAPS_PROVIDER=google` and `GOOGLE_MAPS_API_KEY`.

Local endpoints:

- API health: `http://localhost:4000/api/v1/health`
- Swagger UI: `http://localhost:4000/api-docs`
- OpenAPI JSON: `http://localhost:4000/api-docs.json`

Profile calculations use manual height, weight, age, sex, and activity inputs. BMR follows the
Mifflin–St Jeor formula; TDEE factors are 1.2, 1.375, 1.55, 1.725, and 1.9 from sedentary through
extra-active. Diet rule set v1 is seeded by `npm run seed`, and `PERIODIC` dates are stored as
date-only values for `Asia/Ho_Chi_Minh`.

Phase 03 seeds a two-level category tree, allergen definitions, all food-group enum values through
demo ingredients, canonical ingredient metadata, and accent-insensitive aliases. Public catalog
routes hide archived items; catalog mutations require the backend-authoritative `ADMIN` role.

Phase 04 stores content as immutable revision snapshots. User submissions remain `PENDING_REVIEW`
until contributor approval and moderation phases are available; seeded demo content supplies published
Recipe, Blog, and Video examples. Cloudinary uploads use a server-generated signature, and persisted
media references are checked against the configured cloud, folder, MIME allowlist, and size limits.

Phase 05 adds accent-insensitive search, structured Recipe filters, deterministic related-content
groups, and backend-enforced profile constraints. Search persists normalized revision text and uses
PostgreSQL `pg_trgm` GIN indexes; local query-plan evidence is recorded in
`docs/SEARCH_PERFORMANCE.md`.

Phase 11 uses the official OpenAI SDK and Responses API behind an `AiProvider` boundary. Model IDs,
quotas, and the optional `OPENAI_BASE_URL` are configuration. Missing/unavailable access degrades to
a static safe response without consuming daily quota.

## Seed data for local API and frontend development

`npm run seed` is idempotent and uses only the existing `SEED_*` credentials. The two approved
Contributor fixtures use the same permission set with organization-affiliation and platform-track-record
approval bases. Basis/evidence is audit and presentation data only; it never participates in RBAC. In
addition to the configured Member, unified Contributor fixtures, and Admin, the seed derives
scenario accounts from `SEED_MEMBER_EMAIL` by adding the following suffixes before `@`; every
scenario account uses `SEED_MEMBER_PASSWORD`:

- `+seed-pending-contributor` and `+seed-rejected-contributor`
- `+seed-cold-start`, `+seed-reporter-two`, and `+seed-reporter-three`
- `+seed-locked`, `+seed-banned`, and `+seed-deleted`

The seed includes active and archived catalog records; published Recipe, Blog, and Video cards with
media; pending, rejected, flagged, quarantined, and published-with-pending-edit workflows; visible,
hidden, and deleted comment threads; votes, ratings, bookmarks; LOW/MEDIUM/HIGH AI moderation states;
five-report HIGH priority and resolved-report fixtures; personalization cold-start/disabled/history
states; and an active 21-slot Meal Plan with a shopping list for the configured Member.

Authentication refresh sessions, AI chat sessions/messages, quota buckets, and rate-limit buckets are
intentionally not seeded because they are runtime/session data.

## Quality gates

```bash
npm run lint
npm run typecheck
npm run build
npm run openapi:generate
```

The backend phase workflow does not maintain automated unit or integration test suites. Its required
completion gate is lint, typecheck, and build; OpenAPI generation is run whenever the contract changes.

To verify the production entry point after building:

```bash
DATABASE_URL=postgresql://... FRONTEND_ORIGIN=http://localhost:3000 npm start
```

Graceful shutdown is handled for `SIGINT` and `SIGTERM`.

Run `npm run storage:cleanup`, `npm run notifications:cleanup`, and
`npm run ai-governance:cleanup` daily. Run `npm run storage:reconcile` as a read-only drift check;
use `-- --apply` only after inspecting its report. Provider reconciliation additionally requires
`-- --provider` and working Cloudinary credentials. See the release checklist for gate evidence,
privacy limitations, and rollout requirements.
