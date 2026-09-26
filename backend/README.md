# Vegan Support Backend

Express/TypeScript API for the Vegan Support Application. The implemented scope includes the service
foundation, authentication/sessions, user profiles, manual health metrics, versioned diet rules, and
the category/ingredient catalog, revisioned Recipe/Blog/Video content, and profile-safe content
discovery.

Runtime capability and future phase status are tracked in `frontend/docs/BACKEND_INTEGRATION.md` and
`backend/docs/IMPLEMENTATION_PHASES.md`. The reviewed requirements are in `docs/SRS.md`. Phases
12–27 are planned and must not be inferred as implemented from planning documents.

## Prerequisites

- Node.js 22 or newer
- PostgreSQL 14 or newer
- npm 10 or newer

Redis is not used by Phase 00. Add a Redis-compatible service only when a later phase introduces a
cache or distributed rate limiter.

## Local setup

1. Copy `.env.example` to `.env` and adjust local values.
2. Start the backend and PostgreSQL with Docker: `docker compose -f docker-compose.yml up --build`.
   The backend container applies migrations and runs the idempotent seed before starting the API. With
   Homebrew: `brew services start postgresql@14`, then create the user/database referenced by
   `DATABASE_URL`.
3. Install dependencies with `npm install`.
4. For a non-Docker backend, run `npm run prisma:migrate:deploy` and `npm run seed`.
5. Start the API with `npm run dev`.

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

Phase 11 uses the official OpenAI SDK and Responses API behind an `AiProvider` boundary. The live
default is `gpt-5.6-terra` with `omni-moderation-latest`; set `AI_PROVIDER=fake` for deterministic
local development or provide `OPENAI_API_KEY` for the live path. Missing/unavailable OpenAI access
degrades to a static safe response without consuming daily quota. `OPENAI_BASE_URL` optionally points
the same adapter at an OpenAI-compatible endpoint and defaults to `https://api.openai.com/v1` when it
is omitted; the configured endpoint must be a valid absolute URL.

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
