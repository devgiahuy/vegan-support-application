# Backend Implementation Phases

**Version:** 3.2

**Updated:** 2026-09-21

**Stack:** Node.js · Express · TypeScript · PostgreSQL · Prisma · Zod · OpenAPI

**Current baseline:** Phases 00–12 and 15–17 completed; Phases 13–14 are in progress

This document splits the backend into independently implementable, verifiable, and committable phases. Every new session uses the matching prompt under `backend/docs/prompts/` and derives current state from the repository, not from previous chat history.

## 1. Mandatory execution rules

- Read root `AGENTS.md`, `docs/SRS.md`, `docs/IMPLEMENTATION_PLAN.md`, this file, the active prompt, and `frontend/docs/BACKEND_INTEGRATION.md` before editing.
- Confirm dependencies from source, Prisma migrations, OpenAPI, and the completion table.
- Implement only the active phase. Do not pull later features forward.
- Preserve unrelated user changes and never commit `.DS_Store`, secrets, or unrelated files.
- Every route/enum/error/authorization/state change updates OpenAPI and frontend integration documentation in the same commit.
- Mark affected current endpoints `CHANGING` during a breaking migration and `READY` only after the documented gate is complete.
- Backend phases do not introduce automated unit/integration-test infrastructure unless repository policy changes.
- End with one scoped commit using the phase’s specified message.

## 2. Phase map

| Phase | Name | Dependencies | Main outcome | Required commit message |
|---:|---|---|---|---|
| 00 | Backend Foundation | — | Express/TS/config/Prisma/OpenAPI/health | `chore(backend): bootstrap service foundation` |
| 01 | Authentication & Sessions | 00 | Auth/session/RBAC primitives | `feat(auth): implement authentication and sessions` |
| 02 | Profile, Health & Diet Rules | 01 | BMI-related metrics and confirmable dietary rules | `feat(profile): add health and diet preferences` |
| 03 | Category & Ingredient Catalog | 01 | Category tree and initial canonical ingredients | `feat(catalog): add categories and ingredients` |
| 04 | Content Core & Media | 01, 03 | Recipe/handbook/video CRUD and revisions | `feat(content): implement posts recipes and media` |
| 05 | Search & Related Content | 04 | Search/filter/related content | `feat(search): add content discovery and related results` |
| 06 | Community Interactions | 01, 04 | Comments/votes/ratings/bookmarks | `feat(community): add comments votes ratings and bookmarks` |
| 07 | Contributor Applications (legacy subtype baseline) | 01 | Existing application/approval flow | `feat(contributors): implement application and approval flow` |
| 08 | Moderation & Reports | 04, 06, 07 | Review/report/audit workflow | `feat(moderation): add review reports and audit workflow` |
| 09 | Behavior & Recommendation v1 | 02, 04, 06 | Consent-aware explainable ranking | `feat(recommendations): add behavioral ranking v1` |
| 10 | Weekly Meal Planner | 02, 03, 04, 09 | Versioned plan/swap/basic shopping list | `feat(meal-plans): implement weekly planner` |
| 11 | AI Chat Gateway | 01, 02 | Provider adapter/quota/SSE/history/feedback | `feat(chat): implement nutrition ai gateway` |
| 12 | Food & Nutrient Knowledge Base | 03 | Nutrients, measures, intake limits, cooking factors, interaction rules | `feat(food-data): add nutrient knowledge base` |
| 13 | Cooking-aware Recipe Nutrition | 04, 11, 12 | Structured steps and calculation/AI fallback with provenance | `feat(recipe-nutrition): estimate cooking-aware nutrition` |
| 14 | Unified Contributor Trust | 01, 06, 07, 08 | Remove subtype RBAC; one role plus approval basis | `refactor(contributors): unify contributor permissions` |
| 15 | Storage Quota & Upload Accounting | 01, 04 | Account quota reservations, usage, cleanup | `feat(storage): enforce user media quotas` |
| 16 | Video Review Parity | 04, 08, 15 | Video submission/review/moderation parity | `feat(video): align review and moderation lifecycle` |
| 17 | Custom Meals, Photos & User Tags | 04, 12, 15 | Private custom meals usable in plans | `feat(custom-meals): add private meals photos and tags` |
| 18 | Meal Portion & Compatibility Analysis | 02, 10, 12, 13, 17 | Daily limits and within/cross-dish warnings | `feat(meal-analysis): add portion and compatibility rules` |
| 19 | Multi-week Meal Programs | 10, 17, 18 | Long-horizon plans and cumulative analysis | `feat(meal-programs): support multi-week planning` |
| 20 | Pantry Inventory | 03, 12, 15 | Confirmed user ingredient inventory | `feat(pantry): add user ingredient inventory` |
| 21 | Multi-image Fridge Recognition | 11, 15, 20 | Candidate recognition/quantity/freshness with confirmation | `feat(vision): recognize fridge ingredients` |
| 22 | Receipt Analysis & Shopping Gaps | 10, 12, 15, 20 | Confirmed receipt intake and pantry-aware shopping | `feat(receipts): analyze purchases and shopping gaps` |
| 23 | AI Sharing & Contributor Verification | 11, 13, 14, 21, 22 | Versioned shareable artifacts and unified verification | `feat(ai-review): add sharing and contributor verification` |
| 24 | Restaurants & Google Maps | 01, 02 | Internal/provider hybrid nearby discovery | `feat(restaurants): add location and maps integration` |
| 25 | In-app Notifications | 01, 08, 14, 16, 23, 24 | Idempotent event notifications | `feat(notifications): add in-app event notifications` |
| 26 | Admin AI Governance | 08, 11, 13, 16, 21, 22, 23 | Redacted logs, metrics, flags, provider toggles | `feat(ai-admin): add governance metrics and controls` |
| 27 | Hardening & MVP Release Gate | 00–26 | Security, docs, seed/demo, operational release checks | `test(backend): harden reviewed mvp release flows` |

## 3. Dependency graph

```text
00 → 01 → 02/03/07
03 → 04 → 05/06
04 + 06 + 07 → 08
02 + 04 + 06 → 09 → 10
01 + 02 → 11

03 → 12 → 13 ← 04/11
01/06/07/08 → 14
01/04 → 15 → 16 ← 08
04/12/15 → 17 → 18 ← 02/10/12/13
10/17/18 → 19
03/12/15 → 20 → 21 ← 11/15
10/12/15/20 → 22
11/13/14/21/22 → 23
01/02 → 24
01/08/14/16/23/24 → 25
08/11/13/16/21/22/23 → 26
00–26 → 27
```

After Phase 11, safe parallel branches include 12, 14, 15, and 24, provided migrations use non-conflicting names and shared contracts are coordinated. Phases 13, 16, 17, and 20 begin after their data foundations merge.

## 4. Deliverables for every active phase

As applicable, the same commit includes:

1. Prisma schema and safe migration.
2. Seed/reference data with source/license/version metadata.
3. Zod request/query/response schemas.
4. Route, controller, service, repository, provider adapters, and jobs.
5. Authorization, ownership, state transitions, idempotency, pagination, and typed errors.
6. OpenAPI schemas, examples, error responses, and security requirements.
7. `frontend/docs/BACKEND_INTEGRATION.md` status, contract notes, error catalog, migration action, and changelog.
8. `docs/IMPLEMENTATION_PLAN.md` only if an approved business decision changes.
9. This completion table after the gate passes.
10. One scoped commit with the exact message above.

## 5. Verification gate

Run from `backend/` using repository-defined scripts:

```bash
npm run lint
npm run typecheck
npm run build
```

Also inspect:

```bash
git diff --check
git status --short
git diff --stat
```

Regenerate/validate OpenAPI using the repository workflow. Live external-provider checks may be replaced with the configured fake/local adapter; report anything not run. Do not add a backend test framework just to satisfy a phase.

## 6. Completion record

| Phase | Status | Completed | Commit | Notes |
|---:|---|---|---|---|
| 00 | `COMPLETED` | 2026-09-15 | This phase commit | Foundation gate passed |
| 01 | `COMPLETED` | 2026-09-15 | This phase commit | Auth/session gate passed |
| 02 | `COMPLETED` | 2026-09-15 | This phase commit | Profile/health/diet rules seeded |
| 03 | `COMPLETED` | 2026-09-15 | This phase commit | Catalog and ingredient baseline ready |
| 04 | `COMPLETED` | 2026-09-15 | This phase commit | Content/media baseline ready |
| 05 | `COMPLETED` | 2026-09-15 | This phase commit | Search/related ready |
| 06 | `COMPLETED` | 2026-09-15 | This phase commit | Community interactions ready |
| 07 | `COMPLETED` | 2026-09-15 | This phase commit | Legacy subtype model; scheduled for Phase 14 migration |
| 08 | `COMPLETED` | 2026-09-16 | This phase commit | Review/report/audit ready |
| 09 | `COMPLETED` | 2026-09-16 | This phase commit | Explainable ranking v1 ready |
| 10 | `COMPLETED` | 2026-09-16 | This phase commit | Weekly planner/basic shopping ready |
| 11 | `COMPLETED` | 2026-09-16 | This phase commit | AI chat gateway ready |
| 12 | `COMPLETED` | 2026-09-19 | Not committed (review tree) | Food/nutrient knowledge base, reviewed rules and idempotent imports ready; commit intentionally deferred by user |
| 13 | `IN_PROGRESS` | — | Not committed (review tree) | Source/OpenAPI/docs implemented; final READY gate blocked by Windows Prisma query-engine DLL `EPERM` during `npm run build` |
| 14 | `IN_PROGRESS` | — | Not committed (review tree) | Source/migration/OpenAPI/docs implemented; breaking consumers remain `CHANGING` and final READY gate is blocked by Windows Prisma query-engine DLL `EPERM` during `npm run build` |
| 15 | `COMPLETED` | 2026-09-21 | `252b792` | Storage migration deployed locally; seed and reconciliation dry-run pass; source/OpenAPI gates pass |
| 16 | `COMPLETED` | 2026-09-21 | Not committed (user review tree) | Shared draft/submit/Admin review lifecycle, video storage validation, moderation signals, history/audit, OpenAPI and runtime acceptance checks pass; commit intentionally deferred by user |
| 17 | `COMPLETED` | 2026-09-21 | Not committed (user review tree) | Custom meals, photos (quota-checked MediaAsset ref), user tags, MealPlanItem sourceType/customMealId, delete-in-use guard, OpenAPI, lint/typecheck/build gates pass |
| 18 | `NOT_STARTED` | — | — | — |
| 19 | `NOT_STARTED` | — | — | — |
| 20 | `NOT_STARTED` | — | — | — |
| 21 | `NOT_STARTED` | — | — | — |
| 22 | `NOT_STARTED` | — | — | — |
| 23 | `NOT_STARTED` | — | — | — |
| 24 | `NOT_STARTED` | — | — | — |
| 25 | `NOT_STARTED` | — | — | — |
| 26 | `NOT_STARTED` | — | — | — |
| 27 | `NOT_STARTED` | — | — | — |

## 7. Prompt index

| Phase | Prompt |
|---:|---|
| 00 | [`phase-00-foundation.md`](prompts/phase-00-foundation.md) |
| 01 | [`phase-01-auth.md`](prompts/phase-01-auth.md) |
| 02 | [`phase-02-profile-diet.md`](prompts/phase-02-profile-diet.md) |
| 03 | [`phase-03-catalog.md`](prompts/phase-03-catalog.md) |
| 04 | [`phase-04-content.md`](prompts/phase-04-content.md) |
| 05 | [`phase-05-search.md`](prompts/phase-05-search.md) |
| 06 | [`phase-06-community.md`](prompts/phase-06-community.md) |
| 07 | [`phase-07-contributors.md`](prompts/phase-07-contributors.md) |
| 08 | [`phase-08-moderation.md`](prompts/phase-08-moderation.md) |
| 09 | [`phase-09-recommendations.md`](prompts/phase-09-recommendations.md) |
| 10 | [`phase-10-meal-planner.md`](prompts/phase-10-meal-planner.md) |
| 11 | [`phase-11-ai-chat.md`](prompts/phase-11-ai-chat.md) |
| 12 | [`phase-12-food-data.md`](prompts/phase-12-food-data.md) |
| 13 | [`phase-13-recipe-nutrition.md`](prompts/phase-13-recipe-nutrition.md) |
| 14 | [`phase-14-unified-contributors.md`](prompts/phase-14-unified-contributors.md) |
| 15 | [`phase-15-storage-quota.md`](prompts/phase-15-storage-quota.md) |
| 16 | [`phase-16-video-review.md`](prompts/phase-16-video-review.md) |
| 17 | [`phase-17-custom-meals.md`](prompts/phase-17-custom-meals.md) |
| 18 | [`phase-18-meal-analysis.md`](prompts/phase-18-meal-analysis.md) |
| 19 | [`phase-19-meal-programs.md`](prompts/phase-19-meal-programs.md) |
| 20 | [`phase-20-pantry.md`](prompts/phase-20-pantry.md) |
| 21 | [`phase-21-fridge-vision.md`](prompts/phase-21-fridge-vision.md) |
| 22 | [`phase-22-receipts-shopping.md`](prompts/phase-22-receipts-shopping.md) |
| 23 | [`phase-23-ai-review.md`](prompts/phase-23-ai-review.md) |
| 24 | [`phase-24-restaurants.md`](prompts/phase-24-restaurants.md) |
| 25 | [`phase-25-notifications.md`](prompts/phase-25-notifications.md) |
| 26 | [`phase-26-ai-governance.md`](prompts/phase-26-ai-governance.md) |
| 27 | [`phase-27-hardening.md`](prompts/phase-27-hardening.md) |

## 8. Starting a phase in a fresh session

1. Ensure every dependency is merged into the current branch.
2. Send the matching prompt file as the task; no previous conversation is required.
3. The agent must inspect current source and contracts before choosing exact field/table names.
4. If a dependency is incomplete, stop without pretending it exists.
5. After completion, review the single phase commit before beginning a dependent phase.
