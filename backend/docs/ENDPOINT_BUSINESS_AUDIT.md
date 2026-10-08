# Endpoint business audit after MongoDB migration

**Date:** 2026-10-07  
**Branch:** `codex/migrate-postgres-to-mongodb`  
**Scope:** existing MVP endpoints and their frontend restaurant consumers. No historical PostgreSQL data migration required.

## Coverage and environment

The final HTTP sweep executed **526 requests**, covering all **168 OpenAPI operations**, with **zero unexpected statuses** and **31 business assertions passing**. **120 operations** were exercised in named business workflows (including rejection paths); the other 48 received route-level authorization, input validation or read checks. This is not a claim that every possible business branch or external integration has been exhaustively validated. The per-operation record is [endpoint-business-audit.csv](endpoint-business-audit.csv).

State-changing HTTP checks used the separate `vegan_support_endpoint_audit` Mongo replica-set database and fake AI/vision/receipt/maps providers on port 4001. Live maps were measured against the configured SerpApi adapter and rebuilt backend on port 4000. Only known seed invitation evidence and displayed canonical-name aliases were repaired in the main database; the main seed was not reset. Temporary check scripts were removed; no backend unit/integration test infrastructure was introduced.

| Business area | Verified behavior |
| --- | --- |
| Authentication and authorization | Guest denial, Member denial for Admin operations, registration/login, refresh/logout; private resource ownership; stale role token rejected after Contributor approval. |
| Profile and dietary rules | BMI calculation; strict SOY removal before search pagination; recommendation access; restaurant hard constraints, enabled periodic dates and vegan compatibility within LACTO_OVO. |
| Catalog and food provenance | Category/ingredient creation, duplicate rejection, alias resolution/deletion, archive; food-source CRUD, import preview/commit replay, nutrition preview/recalculation/current/history/status with provenance. |
| Content and community | New Blog/Recipe/Video persistence; resolved + unknown recipe ingredients; draft privacy, submit/manual approve, published revision immutability, new draft after edit, soft delete; comment ownership, vote/bookmark replay and ratings. |
| Contributor and moderation | Application intent grants no authority; duplicate application denied; manual approval/revocation, stale token rejection, report resolution, audit and notification effects. |
| Custom meals/plans/programs | Private ownership; 21-slot generation replay, swap/version conflict, manual insertion, analysis, referenced-meal delete protection and RETAIN_SNAPSHOT; two-week program creation/confirmation. |
| Pantry and storage | Create/consume/merge replay, balance and version checks, inclusive expiry filter; reservation quota counted once, cancel releases quota, owner privacy and adjustment replay. |
| Chat, artifacts and governance | SSE completion/disclaimer, history ownership, feedback, public artifact submission, Contributor-only human verification, Admin revoke; personalization event replay and history delete; configuration disable/fallback/restore. |
| Recognition and receipts | Async extraction readiness, ownership, explicit candidate edit/confirmation, replay and cancel; extraction does not change pantry before confirmation; shopping gaps. |
| Restaurants | Submission pending/public privacy, duplicate detection, Admin approval and repeated-review conflict, consent, radius, dietary claims, history, provider degradation and pagination. |

Existing acceptance entry points also passed after the adapter fix:

- `vision:acceptance`: deduplication, low confidence, unknown correction, partial failure/retry, cancellation, ownership rollback and pantry confirmation boundary.
- `receipts:acceptance`: extraction/confirmation, replay, ownership, conversion, mismatched units and shopping/pantry aggregation.
- `notifications:acceptance`: transaction triggers/rollback, deduplication, privacy, pagination, read-all race and retention.
- `ai-review:acceptance`: eligible source types, strict public DTO, equal Contributor bases, self/stale/concurrent conflicts and immutable audit.
- `ai-governance:acceptance`: RBAC/redaction, metrics, configuration/fallback, audit, version conflicts, retention and no automated sanction. Uses configured `openai` provider identity with a local controlled provider; no live chat completion required.
- `openai-images:acceptance`: local protocol fixture for image request/mapping and provider failure; this does not establish real image recognition accuracy.

## Bugs found and changes

1. **Nearby calls accumulated latency.** Three keyword queries ran sequentially and each page/zoom received its own 5-second timeout. The exact supplied request took 30,747 ms, exceeding the frontend Axios timeout of 15 seconds. Nearby keywords now run concurrently with `Promise.allSettled`; each SerpApi query shares one `MAPS_TIMEOUT_MS` deadline across all pages/zooms. Later failures retain earlier results.
2. **Zoom searched too broad an area.** A 5 km request previously used a minimum 20 km discovery radius to choose zooms. Popular results outside the requested area could consume the provider page cap and then be discarded. Zoom now follows the requested radius. Explicit radius/bounds filtering still runs before pagination.
3. **Cached provider results bypassed hard dietary constraints.** Database provider cache was merged even when live provider retrieval was suppressed. Discovery no longer reads/writes that collection. Unreviewed external results stay excluded for diet/allergy/exclusion/tradition constraints, with `externalResultsSuppressed=true`. LACTO_OVO can accept reviewed VEGAN claims; periodic tradition rules apply only on enabled dates.
4. **Late failures discarded successful retrievals.** Partial page results now survive; `externalDataUnavailable=true` means any provider query/page failed. Successful empty searches are distinguished from provider errors and are not cached. Identical in-flight requests coalesce; complete positive SerpApi searches retain bounded RAM caching. Internal rows with unknown price/rating/opening assertions cannot satisfy those requested provider filters.
5. **SerpApi detail IDs were not recognized by service dispatch.** `serpapi:` now resolves through the configured provider, with dietary restrictions preserved.
6. **Frontend contract and state were inconsistent.** Submit now sends coordinates and supported `dietTags/categories`; review sends `APPROVED/REJECTED` and a reason for either decision. FE preserves metadata, attribution and source identity, supports actual pagination, separates cache by user identity and invalidates discovery when diet/schedule changes. UI distinguishes provider degradation and dietary suppression from no matching data.
7. **Frontend default proxy targeted port 8080.** Browser geocoding failed with ECONNREFUSED while backend ran at 4000. Defaults now match 4000, with server-only `BACKEND_API_URL` taking precedence in rewrites; explicit configured URLs remain supported.
8. **Mongo checked nested creates failed.** Nullable scalar FK injection conflicts with Prisma checked relation inputs, including arrays mixing resolved/free-text recipe ingredients. Nullable FK values are now materialized after the mutation in the same transaction; inverse nested creates are traversed. `createMany` retains safe scalar input normalization. Blog, Recipe, Video and nutrition flows now pass.
9. **Comprehensive seed produced invalid invitation evidence and ingredient labels.** ADMIN_INVITED evidence now contains actual inviter identity and required verification status. Deduplicated aliases include the canonical display label, so selecting the displayed ingredient ID/name pair is accepted while stable ingredient IDs and existing source metadata remain intact.

## Live nearby measurement

Request: `lat=10.875178124459689&lng=106.80076348780484&radiusMeters=5000&page=1&limit=20`.

| Version | Duration | Results |
| --- | --- | --- |
| Original backend | 30,747 ms | 3 results |
| Concurrent queries + shared deadlines, old wide zoom | 5,046 / 5,011 / 3,985 ms | Same 3 results each run; partial flag where appropriate |
| Concurrent queries + requested-radius zoom | 5,066 / 5,010 / 5,008 ms | 39 retrieved results each run; 20 on first page; partial/truncated flags retained |

After rebuilding port 4000, live HTTP returned page 1: 20/39 results in 667 ms; page 2: 19/39 in 25 ms with warm provider/application caches and no degradation flag. These warm timings are not cold-start guarantees. All returned distances in the latter measurement were within 5 km. Examples include Lẩu chay Thiện Vị (933 m), Quán THIÊN NHIÊN (1,319 m), and Lẩu chay An Nhiên (1,446 m). These are provider text matches, not verified dietary or allergy assertions. A provider can still time out before retrieving its first page, and upstream coverage/caps can still omit real places; metadata and UI now disclose that condition.

## Gates and practical limits

Backend lint, typecheck, build, OpenAPI generation; frontend ESLint on changed TS/TSX files; frontend typecheck, 42 test files / **412 tests**, build; Swagger sync **168 operations / 39 groups / 150 schemas**; and `git diff --check` were run. Browser checks exercise manual-address → geocode → nearby through the frontend proxy: a Dĩ An address produced 35 retrieved results, displayed 20 cards/markers on page 1 with source attribution, unreviewed/degradation notices and pagination. Page 2 was checked separately. These browser geocoded coordinates differ from the exact user request, which was validated by mapper/API tests and live HTTP. Mapper/API tests also verify exact supplied coordinates, radius, consent, request cancellation, pagination and business payloads.

Route checks using empty input, nonexistent IDs or documented rejection statuses are validation/authorization evidence, not successful fulfillment of those operations. External Cloudinary upload/commit/delete success, representative live AI accuracy, browser GPS permission/device location, production concurrency/failover and complete provider restaurant coverage are not certified by this audit. The existing image-production release limitations remain unchanged. No Phase 2 feature or business-rule relaxation was added.
