# Vegan Support Backend

Express/TypeScript API for the Vegan Support Application. The implemented scope includes the service
foundation, authentication/sessions, user profiles, manual health metrics, versioned diet rules, and
the category/ingredient catalog, revisioned Recipe/Blog/Video content, and profile-safe content
discovery.

## Prerequisites

- Node.js 20.19 or newer
- PostgreSQL 14 or newer
- npm 10 or newer

Redis is not used by Phase 00. Add a Redis-compatible service only when a later phase introduces a
cache or distributed rate limiter.

## Local setup

1. Copy `.env.example` to `.env` and adjust local values.
2. Start the backend and PostgreSQL with Docker: `docker compose -f docker-compose.yml up --build`. With Homebrew:
   `brew services start postgresql@14`, then create the user/database referenced by `DATABASE_URL`.
3. Install dependencies with `npm install`.
4. Run `npm run prisma:migrate:deploy` and `npm run seed`.
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
