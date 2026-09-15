# Vegan Support Backend

Production-shaped Express/TypeScript foundation for the Vegan Support Application. Phase 00 exposes
only service documentation and `GET /api/v1/health`; business modules begin in later phases.

## Prerequisites

- Node.js 20.19 or newer
- PostgreSQL 14 or newer
- npm 10 or newer

Redis is not used by Phase 00. Add a Redis-compatible service only when a later phase introduces a
cache or distributed rate limiter.

## Local setup

1. Copy `.env.example` to `.env` and adjust local values.
2. Start PostgreSQL. With Docker: `docker compose up -d postgres`. With Homebrew:
   `brew services start postgresql@14`, then create the user/database referenced by `DATABASE_URL`.
3. Install dependencies with `npm install`.
4. Run `npm run prisma:migrate:deploy` and `npm run seed`.
5. Start the API with `npm run dev`.

Local endpoints:

- API health: `http://localhost:4000/api/v1/health`
- Swagger UI: `http://localhost:4000/api-docs`
- OpenAPI JSON: `http://localhost:4000/api-docs.json`

## Quality gates

```bash
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
npm run openapi:generate
```

`test:integration` uses `TEST_DATABASE_URL` when provided. Otherwise, it creates and removes a
temporary local PostgreSQL cluster using `initdb`, `pg_ctl`, and `createdb`; it never migrates the
development database implicitly.

To verify the production entry point after building:

```bash
DATABASE_URL=postgresql://... FRONTEND_ORIGIN=http://localhost:3000 npm start
```

Graceful shutdown is handled for `SIGINT` and `SIGTERM`.
