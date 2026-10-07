# MongoDB persistence migration

**Updated:** 2026-10-07
**Scope:** User-approved replacement of PostgreSQL with MongoDB for the current backend. Historical data preservation is optional and is not an acceptance gate. Product scope and existing release limitations remain unchanged.

## Architecture and affected behavior

The original backend contains 100 Prisma models, PostgreSQL-specific native types, composite primary keys, raw SQL searches/locks, 134 SQL CHECK constraints, five partial unique indexes, and transactional notification triggers. Replacing only `DATABASE_URL` would leave these behaviors broken.

The new backend retains Prisma 6.12 and maps the 100 models to MongoDB collections with their existing snake-case collection/field names. Public IDs remain UUID strings stored in `_id`; composite primary keys become an internal UUID `_id` plus the original compound unique key. Routes, request/response schemas, enums, business error codes, Contributor permissions, and confirmation boundaries retain their existing contracts. Frontend consumers require Swagger synchronization, with no DTO migration.

| PostgreSQL capability                  | MongoDB implementation                                                                                                                             |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary/compound/nullable unique keys  | `_id`, compound unique indexes, partial unique indexes that preserve multiple SQL nulls                                                            |
| CHECK, enum, length, integer bounds    | Strict collection JSON Schema plus compiled `$expr` validators for all 134 legacy checks                                                           |
| Foreign keys and delete actions        | Shared `createPrismaClient` adapter validates scalar/nested references and performs the original Cascade/Restrict/SetNull graph in one transaction |
| Concurrent reference creation/deletion | Internal reference counters force conflicts on the referenced document; timestamp fields are preserved                                             |
| Row/advisory locks                     | Internal document counters plus transaction retry; MealPlan uses a separate `transactionVersion`, preserving its public `lockVersion`              |
| Notification SQL triggers              | Application event dispatch in the same transaction, including bulk event writes, dedupe and rollback                                               |
| SQL content joins and ranking          | Native aggregation; normalized text, hard constraints before ranking/pagination, original weights and padded word trigram similarity               |
| Decimal native type                    | Prisma Float/BSON Double; direct writes round and check the previous decimal precision/scale; food-data decimal string responses retained          |
| BigInt/date-only                       | BSON Int64/UTC-midnight Date; Asia/Ho_Chi_Minh date semantics retained                                                                             |

MongoDB Float uses binary floating point, whereas PostgreSQL NUMERIC stores decimal values. Existing application rounding and tolerances remain necessary; this migration does not claim arbitrary exact decimal arithmetic. Nutrition source/license/version, assumptions, confidence, uncertainty, and reviewed promotion rules are preserved.

Referential integrity belongs to the shared adapter because MongoDB has no native foreign keys. API, seed, maintenance and acceptance entry points all use this factory. Direct database writes can bypass reference and event rules; use them only for reviewed administrative/schema operations. Native cascade deletes are issued only after validating the complete deletion graph and use the caller's transaction. Prisma relation actions are `NoAction` to avoid conflicting emulated cascades across cycles and multiple paths.

## Local Docker setup

```bash
cp .env.example .env
# Set distinct local seed passwords and application/provider secrets.
# For deterministic development, configure fake providers with NODE_ENV=development.
docker compose up -d --build
```

Compose starts MongoDB 7, initializes `rs0`, waits for a writable primary, provisions validators/indexes, then starts the API. Set `RUN_SEED=true` for a fresh demo; it defaults to false. MongoDB's published host port binds to `127.0.0.1`. This single-node replica set is local development infrastructure. Shared deployments should use an authenticated, protected replica set or Atlas and the appropriate MongoDB URI.

For a host API process:

```bash
docker compose up -d mongodb mongo-init
docker compose up -d --wait mongodb
npm ci
npm run prisma:generate
npm run prisma:push
npm run seed
npm run dev
```

Use `mongodb://localhost:27017/vegan_support?replicaSet=rs0&directConnection=true` with the default local port. If another service occupies that port, change `MONGODB_PORT` and the host `DATABASE_URL`. Container clients use the `mongodb` service hostname. Atlas uses its database-specific `mongodb+srv://` URI. Health returns the existing database-down response when the replica-set requirement is not met.

## Schema and development rules

Use `npm run prisma:push`, which calls `scripts/mongo-schema.mjs`. It provisions strict validators, unique/nullable/partial and relation indexes, and backfills missing literal defaults without overwriting existing fields. It rejects standalone MongoDB. The legacy script aliases `prisma:migrate` and `prisma:migrate:deploy` invoke this command for existing tooling.

**Do not run raw `prisma db push` or Prisma Migrate against MongoDB.** Raw push would omit the reviewed CHECK validators and create incorrect ordinary nullable unique indexes. Prisma Migrate SQL history is archived under `prisma/legacy-postgresql/`; it is not a MongoDB migration directory.

When schema/business constraints change, update `schema.prisma`, the applicable adapter policy/validators and OpenAPI/contract docs, regenerate Prisma, then provision a scratch database and verify seed and relevant behavior. `npm run db:validators:generate` rebuilds the reviewed PostgreSQL CHECK baseline. New MongoDB-only constraints must be added explicitly rather than silently omitted. Provisioning fails on invalid existing data or conflicting indexes; it does not silently erase collections or records. Index removal/renaming requires an explicit reviewed migration.

Always construct clients through `createPrismaClient` and use callback transactions. The adapter retries database-only callbacks for P2034/write conflict and P2002/competing creation, up to eight retries with jittered bounded backoff. Keep external provider calls and other non-database side effects outside retryable callbacks. Bulk insertion does not silently skip duplicate records. Public serializers must exclude internal persistence counters and preserve documented numeric types.

## Optional historical import and rollback

The application does not require PostgreSQL or historical data. For an optional import, set `POSTGRES_SOURCE_URL` and `MONGODB_TARGET_URL`, then run:

```bash
npm run db:migrate:postgres-to-mongo            # read-only snapshot/export
npm run db:migrate:postgres-to-mongo -- --apply # import into an empty target
```

The importer exports all collections from one read-only repeatable-read snapshot to private `backups/` NDJSON files. It preserves original decimal text, verifies document hashes/counts and all declared references, and refuses lossy decimal conversion or a nonempty target. `--resume` is restricted to an interrupted import with the same schema fingerprint; exported data are private and excluded from Git and Docker context. Normal application startup never imports PostgreSQL.

For rollback, retain the original PostgreSQL volume and use the original code/deployment revision with its PostgreSQL connection. MongoDB writes after cutover are not synchronized back to PostgreSQL. Snapshot and restore the new MongoDB database using deployment-managed tooling before upgrades; no production backup/restore rehearsal is claimed by local checks.

## Verification record

Verified on local MongoDB 7 `rs0` using a scratch database and configured fake providers:

- Prisma validation/generation; fresh Docker replica-set initialization, schema provisioning for all 100 collections and fresh seed; scratch seed re-run without duplicate failures.
- Backend lint, typecheck and build; OpenAPI generation and frontend Swagger sync (168 operations).
- Existing vision, receipts, AI review, AI governance and notifications acceptance scripts; OpenAI image adapter checked against its local protocol fixture.
- Search and SOY allergy exclusion before pagination; concurrent community rate limit, chat quota reservation/completion and first-account storage quota; filtered account pagination.
- Internal locking preserves timestamps; native cascade deletion rolls back with its transaction; missing foreign references and invalid native writes are rejected.
- Frontend typecheck, 42 test files / 408 tests, and production build.
- Docker image build and live HTTP health/OpenAPI/content/catalog checks plus authenticated Member/Admin profile, storage, pantry, meal plans, notifications, review queue and governance; PostgreSQL service is stopped and the API runs against MongoDB.

The backend retains the repository policy of no unit/integration test infrastructure. Existing acceptance scripts and temporary runtime checks were used. Production workload latency, multi-node failover, live AI accuracy and production backup/restore are outside these local verification claims. Search now uses aggregation expressions rather than a PostgreSQL GIN index; see [SEARCH_PERFORMANCE.md](SEARCH_PERFORMANCE.md).
