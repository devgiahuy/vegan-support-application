# MongoDB branch reconciliation with dev

**Updated:** 2026-10-08
**PR:** https://github.com/devgiahuy/vegan-support-application/pull/39
**Incoming dev revision:** `d1aa2bd`

Resolve 29 conflicting files by preserving both the MongoDB migration and incoming dev behavior. Keep dev's new meal macros/analysis, admin-content, mobile and restaurant redesign. Reapply restaurant pagination, account-scoped cache, cancellation, device consent, nearby coordinates for keyword search and provider notices for empty results. Review payloads use backend decisions `APPROVED`/`REJECTED` and a mandatory reason.

`CustomMeal.userFiberGrams` is a nullable MongoDB Float with precision 8/scale 2 in the shared adapter policy. Retain the incoming SQL migration under `prisma/legacy-postgresql/migrations/` for historical reference. Current deployments provision schema through `npm run prisma:push`. Content aggregation rejects missing canonical ingredient IDs as well as non-EXACT resolutions for planner candidates. Keep canonical seed aliases, invitation evidence and checked nested creation support alongside new curated recipe estimates. Restore UTF-8 strings corrupted upstream, which caused the existing vision acceptance assertion to fail.

## Verification

- Backend lint, typecheck, build and OpenAPI generation passed.
- Swagger sync: 168 operations, 39 groups, 150 schemas.
- Frontend typecheck, 47 test files / 577 tests and production build (46 routes) passed.
- MongoDB schema provision and full seed passed against a separate `vegan_support_merge_audit` database (100 collections); the shared application database was not seeded.
- Existing meal-plans, meal-analysis, vision and receipts acceptance commands passed. Vision/receipts use fake providers.
- 10-request HTTP smoke passed: health/login, custom meal fiber create/read/update with decimal rounding, seeded recipe nutrition/current, weekly generate/replay/detail with 21 distinct slots and 21 filled slots.
- All 25 comprehensive recipe estimates have the declared energy/protein/fiber and retained source/version provenance; AI is not marked as used.
- Scoped lint for files edited during conflict resolution: zero errors, two existing unused-icon warnings. Full restaurant feature lint still reports three pre-existing set-state-in-effect errors in unchanged dev map files.

This verifies the merge and affected persistence/workflows; it does not repeat the prior full endpoint audit, native mobile/export verification or live Cloudinary/OpenAI acceptance. The user requested PR merge into dev after verification.

## Seed text repair follow-up

The user also requested fixing damaged seed text such as replacement characters and question marks inside Vietnamese words. Existing source seed definitions are UTF-8; the previous backfill detected only historical mojibake in recipe/handbook titles and did not repair videos, independent excerpt/body damage or nested text.

`npm run seed` now restores damaged fields in known version-1 seed revisions from their definitions and regenerates normalized search fields. Recipe instructions, ingredient display names and damaged tags are included. It preserves healthy fields. A scratch DB regression injected six damaged fields across recipe/handbook/video, including nested step/ingredient/tag data. Reseeding restored all six; all 32 comprehensive revisions are clean and 25 current nutrition estimates remain. The existing local MongoDB presentation-data scan found no remaining matching corruption, so the shared database was not reseeded.

The user explicitly authorized merging PR #39 into dev after verification.
