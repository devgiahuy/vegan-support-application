# Leader task: verification statistics and multi-image fridge recognition

**Updated:** 2026-10-17  
**Scope:** Backend Phase 21 and Phase 23 maintenance only

## Existing behavior reused

- Phase 23 keeps the existing immutable `AiArtifact`, `AiVerification`, and `AiVerificationAdminAction` audit records, artifact-version checks, Contributor/Admin authorization, self-verification prohibition, public DTO allowlist, and admin override/revocation flow.
- Recipe usage reuses existing `MealPlan` and `MealPlanItem` records. Bookmarks, views, votes, and behavioral events are not treated as recipe use.
- Phase 21 keeps the existing multi-image asynchronous job, owner-scoped committed asset validation, per-image status, provider abstraction, retry/cancel rules, optimistic candidate versions, explicit confirmation boundary, Pantry transaction, and confirmation idempotency.
- Canonical matching reuses active `Ingredient` records and approved `IngredientAlias` records.

## Missing behavior implemented

- Phase 23 now permits one effective verification per artifact version per reviewer. The former MongoDB partial unique index allowed only one active verification for the whole artifact and made multi-reviewer statistics impossible.
- AI artifact responses now contain effective verification record and distinct human verifier counts.
- Recipe detail responses now contain a distinct meal-plan usage count and an explicit limitation that cooked/completed meals are not tracked.
- Phase 21 now resolves candidate names and approved aliases in two batched queries, deduplicates the full successful-image result set, never sums quantities merely because the same ingredient appears in multiple images, and exposes each evidence uncertainty note.

## Verification-count definition

An effective verification satisfies all of these rules:

1. `AiVerification.status` is `ACTIVE`.
2. `artifactVersion` equals the current immutable artifact version.
3. The reviewer is not the artifact owner.
4. The reviewer was an eligible human Contributor/Admin when the record was created under the existing authorization checks.

`verificationCount` counts effective verification records. `verifiedByUserCount` counts distinct reviewer IDs among those records. Reviewer IDs are used only inside the backend aggregation and are never added to public responses. A reviewer can hold at most one active verification for one artifact version. `SUPERSEDED` and `REVOKED` audit records remain in `verificationHistory` but do not contribute to either count.

Admin override marks the target record `SUPERSEDED` and creates an active replacement. Admin revoke marks the target `REVOKED` and creates no replacement. Neither action deletes audit history. This remains verification of an AI artifact; the backend does not implement a separate general-purpose recipe-verification state machine.

## Recipe-usage-count definition and limitation

`usageUserCount` is the number of distinct `MealPlan.userId` values connected through `MealPlanItem.recipeId` for non-deleted meal plans. Multiple placements, multiple weeks, and multiple plan versions from the same user count once. The database performs a MongoDB aggregation with `$group` on the user ID; it does not issue per-user queries.

The response labels this rule as `usageTracking: "MEAL_PLAN_ADDITION"`. `cookedUserCount` is `null`. The current schema has no completed/cooked meal event, so clients must use wording such as “Có N người đã thêm công thức này vào kế hoạch bữa ăn” and must not say that N people cooked it. Saves/bookmarks, likes/votes, and views are deliberately excluded.

## Multi-image processing and deduplication

1. Each submitted image remains an ordered `RecognitionInput` and is sent independently through the provider adapter.
2. Each input becomes `PROCESSED` or `FAILED`. A job becomes `READY`, `PARTIAL_FAILED`, or `FAILED` from the existing state machine.
3. Candidates from successful images are normalized. Active canonical names and approved aliases are resolved in batched queries.
4. The merge key is canonical ingredient ID when available; otherwise it is the normalized Vietnamese candidate name.
5. One editable `RecognitionCandidate` is persisted for each merge key. Evidence retains input/image reference, confidence, and an uncertainty note.
6. A failed image does not discard candidates produced by successful images.

No confidence threshold was added. Merged confidence is the confidence of the strongest retained evidence and is never arithmetically inflated.

## Quantity conflict handling

Quantities from duplicate observations are never summed automatically. This protects overlapping photos of the same physical objects.

- Equal quantity and unit: retain the estimate and add an overlap warning requiring review.
- Different quantity and/or unit: retain the quantity/unit from the higher-confidence evidence, preserve both image evidence entries, and add a conflict warning stating that the values were not added together.
- Unknown quantity/unit: retain uncertainty. Confirmation still requires the user to provide a complete quantity and unit.

Candidate IDs remain stable after consolidation, so the existing PATCH edit and POST confirm flows continue to work. Confirmation replay still returns the original Pantry result and does not add another item or adjustment.

## Additive API fields

No endpoint or HTTP method changed.

`GET /api/v1/ai-artifacts/public` and artifact mutation responses add:

```json
{
  "statistics": {
    "verificationCount": 5,
    "verifiedByUserCount": 5
  }
}
```

`GET /api/v1/posts/{idOrSlug}` adds `recipe.statistics` for recipes:

```json
{
  "recipe": {
    "statistics": {
      "usageUserCount": 120,
      "usageTracking": "MEAL_PLAN_ADDITION",
      "cookedUserCount": null,
      "limitation": "Hệ thống chỉ đo số người dùng riêng biệt đã thêm công thức vào kế hoạch bữa ăn; chưa theo dõi việc đã nấu hoặc hoàn thành món."
    }
  }
}
```

`GET /api/v1/ingredient-recognition/jobs/{id}` adds `uncertaintyNote` to every `candidates[].evidence[]` entry:

```json
{
  "candidates": [
    {
      "name": "Cà rốt tươi",
      "quantity": { "value": 3, "unit": "củ" },
      "uncertaintyNote": "Phát hiện cùng nguyên liệu trong 2 ảnh. Số lượng không được cộng dồn vì các ảnh có thể chụp trùng cùng vật thể; vui lòng kiểm tra trước khi xác nhận.",
      "evidence": [
        { "imageId": "...", "imagePosition": 0, "confidence": 0.94, "uncertaintyNote": "Ước tính trong ảnh: 3 củ." },
        { "imageId": "...", "imagePosition": 1, "confidence": 0.89, "uncertaintyNote": "Ước tính trong ảnh: 3 củ." }
      ]
    }
  ]
}
```

## FE/mobile integration guidance

- Use `statistics.verificationCount` for effective opinions and `statistics.verifiedByUserCount` for distinct people. Do not derive counts from `verificationHistory`.
- Do not expose or infer reviewer IDs. Existing reviewer display name/role remains presentation-only audit information.
- For recipes, render `usageUserCount` with meal-plan language. If `cookedUserCount` is `null`, do not show “đã nấu” or “đang nấu”.
- Render the consolidated recognition candidate list once. Use `evidence` to show which images contributed and surface candidate-level conflict/overlap text before confirmation.
- Keep quantity and unit editable. A non-null uncertainty note means user review is required; it is not a reason to add quantities.

## Migration

The forward-only MongoDB migration `scripts/migrate-ai-verification-reviewers.mjs` creates the new active-per-reviewer partial unique index before dropping the former active-per-artifact index. It is idempotent and has separate deploy/status commands. Existing verification documents and audit history are not rewritten.

## Test results

Passed on 2026-10-17:

- `npm run lint`
- `npm run typecheck`
- `npm run build` (with a non-connecting MongoDB URL used only so Prisma can validate/generate the Mongo client)
- `npx prisma validate` and `npm run prisma:generate` with the same validation-only MongoDB URL
- `npm run vision:dedup-acceptance`
- `npm run verification-statistics:acceptance`
- `npm run openapi:generate` plus JSON/OpenAPI version/path validation

Database-backed checks were invoked but could not run because the repository's active `.env` sets `DATABASE_URL` to a PostgreSQL URL while the current Prisma datasource requires MongoDB, and no compatible seeded MongoDB replica set was available:

- `npm run vision:acceptance`: blocked by `DATABASE_URL: must be a MongoDB URL`.
- `npm run ai-review:acceptance`: blocked because the configured URL does not start with the MongoDB protocol required by the datasource.
- `npm run statistics:acceptance`: blocked by the same MongoDB datasource URL validation error.
- `npm run prisma:migrate:verification-stats:status`: blocked by `DATABASE_URL must use MongoDB`.
- Migration deploy was not attempted after status proved that no compatible database was configured.

The deterministic tests cover the requested five-verifier count, duplicate/revoked/superseded/stale/self exclusion, privacy of reviewer IDs, one/multiple images, different ingredients, canonical/approved-alias merging, overlapping `3 + 3` carrots remaining `3`, conflicting quantity/unit uncertainty, evidence retention, and partial image failure. The existing database-backed Phase 21 acceptance was extended to cover merged-candidate edit/confirm, confirmation replay, and owner isolation; it remains pending the database blocker above.
