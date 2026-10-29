# Implementation Plan — Vegan Support Application

**Version:** 4.17

**Updated:** 2026-10-29

**Status:** Approved implementation baseline

**Current backend baseline:** Phases 00–20 and 23–26 completed; Phases 21–22 and 27 in progress; sandbox billing is a separately approved extension.

## 1. Document authority

This plan translates `docs/SRS.md` into business rules, domain boundaries, state machines, and delivery phases. The exact execution order, completion gates, and standalone prompts are in `backend/docs/IMPLEMENTATION_PHASES.md`.

The current API contract may still contain legacy Contributor subtype fields until Phase 14. `frontend/docs/BACKEND_INTEGRATION.md` is authoritative for what is READY today. Post-MVP directions are retained in `docs/ROADMAP_PHASE_2.md`.

## 2. Approved decisions

| ID | Topic | Decision |
|---|---|---|
| D1 | Delivery | Implement vertical backend phases; every phase is independently verifiable and committed. |
| D2 | Personalization | MVP uses explainable behavioral scoring. Advanced embeddings/GenAI ranking remains in Roadmap Phase 2. |
| D3 | Contributor | One Contributor permission set. User applies during registration or later; Admin manually approves. Store approval basis only: `ORGANIZATION_AFFILIATION`, `PLATFORM_TRACK_RECORD`, `ADMIN_INVITED`. |
| D4 | Vegetarian rules | Keep `dietPattern`, `practiceSchedule`, and `tradition`. MVP traditions: Buddhist and Christian. The system proposes rules and the user confirms/toggles each rule. |
| D5 | Publication | Recipes, handbooks, and videos require manual Admin approval. AI flags and reports are evidence for review, never automatic deletion. |
| D6 | Health data | MVP web uses user-entered measurements. HealthKit/Health Connect/wearables/phone-sensor research remains in Roadmap Phase 2. |
| D7 | Persistence | MongoDB replica set + Prisma; UUID API identifiers retained. Approved by user on 2026-10-07; preservation of historical database data is not required. |
| D8 | Backend | Node.js + Express + TypeScript, OpenAPI-first. |
| D9 | Maps | Internal restaurant records plus a provider adapter for Google Maps/Places/Geocoding. |
| D10 | Media | Cloudinary and permitted external video URLs; enforce per-file and per-account quotas before payments. |
| D11 | AI | Provider adapters; no model ID or quota in domain logic. AI output is advisory and auditable. |
| D12 | Food data | Canonical internal ingredient/nutrient database with provenance. External providers bootstrap/import data; AI is fallback/suggestion only. |
| D13 | Recipe nutrition | Estimate nutrition using ingredients and cooking process. Deterministic calculation is the baseline; AI may infer missing mappings/factors and must return confidence/assumptions. |
| D14 | Compatibility | Store evidence-graded daily limits and ingredient interaction rules for a dish and across selected meals. Only reviewed data can create hard rules. |
| D15 | Custom meals | Users may add private meals outside the public catalog, photos, and arbitrary user-created tags such as `shopee`; no marketplace API is implied. |
| D16 | Planning horizon | Support weekly plans first, then multi-week programs with cumulative and repeated-pattern analysis. |
| D17 | Recognition | Fridge input supports multiple images and quantity estimates. User confirmation is required before pantry/plan changes. |
| D18 | Receipts | Extract candidate purchased ingredients, identify repeat photos by receipt number/merchant/date or exact complete metadata and line multiset when the number is absent, merge partial photos for user review, and only then update pantry on explicit confirmation. Different receipts accumulate. |
| D19 | Video | Enforce storage first. Videos use recipe/handbook review parity. Formal DMCA and advanced audio/frame moderation are Roadmap Phase 2. |
| D20 | Certificates | No certificate verification in MVP. Future evidence badges do not silently introduce Contributor permission tiers. |
| D21 | Documentation | `docs/SRS.md` is canonical; runtime capability status stays in frontend integration docs; roadmap is separate from implementation phases. |
| D22 | Safety | Nutrition, freshness, compatibility, BMI, and AI answers are educational support, not diagnosis or guaranteed safety. |
| D23 | Usage billing | User-approved 2026-10-13 and payOS conversion 2026-10-14: payOS exclusively for new one-time cumulative AI usage/Pantry capacity packages and, since 2026-10-27, a non-renewing combo with 1-month/3-month/1-year durations (BL-20.1). App rollout remains development/test; payOS checkout is real money, without sandbox or mock fallback. No recurring or media-storage purchase. |
| D24 | AI recipe draft | Accept title, description and ordered ingredient names without image analysis; return editable amount/unit/serving/time/step suggestions. The author edits and saves via the existing DRAFT content flow. AI output does not publish or become canonical nutrition data. Approved by user 2026-10-24. Refined 2026-10-29 (agreed with Ngô Gia Huy): servings, prep time and cook time entered in step 1 are sent to the generator (amounts sized for those servings) and are never overwritten when the draft is applied; the AI only fills blanks and its own timing is shown as a hint. |

## 3. MVP scope

### 3.1 Existing baseline — Phases 00–11

- Foundation, authentication, profile, health metrics, dietary rule configuration.
- Ingredient/category catalog, recipes/handbooks/videos, search, comments, votes/bookmarks.
- Legacy Contributor workflow, content moderation, behavioral recommendations.
- Weekly meal planner and AI nutrition chatbot.

These capabilities remain subject to the READY statuses in the frontend integration contract.

### 3.2 Reviewed MVP extension — Phases 12–27

- Canonical food/nutrient knowledge base, reference intake limits, retention/yield data, and interaction rules.
- Cooking-aware nutrition calculation with AI-assisted fallback and explicit provenance.
- Migration from Contributor subtypes to one role with an approval basis.
- Account storage quota and reservation accounting.
- Video review parity.
- Private custom meals, multiple photos, and user-created tags.
- Portion, daily-limit, and cross-dish compatibility analysis.
- Multi-week programs.
- Pantry inventory, multi-image fridge recognition, quantity estimation, receipt analysis, and shopping gaps.
- AI draft sharing and unified Contributor verification.
- Restaurants/maps, notifications, AI governance, and final hardening.

### 3.3 Deferred

All deferred ideas are retained in `docs/ROADMAP_PHASE_2.md`, including advanced GenAI ranking, video transcription/summarization, wearable integration, regional seasonality, more traditions, credential verification, storage payments, formal DMCA operations, advanced moderation, and clinical-grade interactions.

## 4. Domain model direction

Names below express domain intent; each active phase must reconcile them with the current Prisma schema and migration history.

### 4.1 Identity, diet, and Contributor

```text
User
UserProfile
HealthMetric
DietPreference
DietRuleDefinition
UserDietRule
ContributorApplication
ContributorProfile
ContributorDecision

Role                     MEMBER | CONTRIBUTOR | ADMIN
ContributorApplication   PENDING | APPROVED | REJECTED | WITHDRAWN
ContributorApprovalBasis ORGANIZATION_AFFILIATION
                         | PLATFORM_TRACK_RECORD
                         | ADMIN_INVITED
```

Legacy `requestedContributorType`, `approvedContributorType`, and `contributorType` fields are removed or migrated in Phase 14. Approval basis is descriptive audit data, not authorization input.

### 4.2 Content, review, and community

```text
Post
PostRevision
RecipeDetail
RecipeIngredient
RecipeStep
PostMedia
PostReview
ModerationSignal
UserReport
Comment
Vote
Bookmark
Category
UserTag
```

`Post` supports `RECIPE`, `HANDBOOK`, and `VIDEO`. Publication state is separate from automated moderation signals.

### 4.3 Food knowledge and nutrition

```text
CanonicalIngredient
IngredientAlias
IngredientMeasureConversion
NutrientDefinition
IngredientNutrientValue
FoodDataSource
FoodDataImport
ReferenceIntake
IngredientIntakeGuideline
CookingMethod
NutrientRetentionFactor
CookingYieldFactor
IngredientInteractionRule
NutritionEstimate
NutritionEstimateLine
NutritionVerification
```

All imported or curated values carry source, version, locale/applicability, review state, and timestamps. Compatibility rules also carry evidence grade and severity.

### 4.4 Storage, pantry, and recognition

```text
StoragePolicy
StorageAccount
StorageReservation
MediaAsset
PantryItem
RecognitionJob
RecognitionInput
RecognitionCandidate
ReceiptJob
ReceiptCandidate
```

Recognition candidates are proposals. Only confirmed candidates create or update pantry items.

### 4.5 Planning

```text
MealPlan
MealPlanDay
MealPlanItem
CustomMeal
CustomMealIngredient
CustomMealMedia
CustomMealTag
MealAnalysis
MealWarning
MealProgram
MealProgramWeek
ShoppingList
ShoppingListItem
```

A meal item references either published content or a private custom meal through an explicit source type.

### 4.6 AI, behavior, restaurant, and notification

```text
AiRequestLog
AiArtifact
AiFeedback
BehaviorEvent
RecommendationSnapshot
Restaurant
RestaurantExternalRef
Notification
```

AI artifacts keep provider/model version, input/output trace metadata, prompt/template version, status, and relevant confidence/provenance without retaining unnecessary sensitive text.

## 5. Business logic baseline

### BL-01 — Contributor application and authorization

1. A user may request Contributor status during registration or from an existing Member account.
2. A user-initiated request records motivation and may claim `ORGANIZATION_AFFILIATION` or `PLATFORM_TRACK_RECORD`; it does not grant permission. `ADMIN_INVITED` is created only by an Admin invitation/approval path.
3. Certificates are neither required nor verified in MVP.
4. An Administrator manually approves or rejects with a reason. Approval records the final approval basis.
5. For `ORGANIZATION_AFFILIATION`, retain the organization claim and reference links; no certificate verification is implied. For `PLATFORM_TRACK_RECORD`, store an immutable review-time snapshot of relevant post history and interaction/quality aggregates. For `ADMIN_INVITED`, retain inviter and reason.
6. Approved users receive the single `CONTRIBUTOR` role/profile. Every Contributor has equal permissions.
7. Approval basis/evidence may be displayed as context but must never branch RBAC.
8. Rejection leaves the user as Member and follows an explicit reapplication policy.
9. Revocation is an audited Admin action and removes Contributor-only authorization.

### BL-02 — Diet rules and precedence

1. Selecting a diet pattern or tradition returns a versioned default rule set.
2. The user confirms and may toggle individual rules. Store enabled state and rule version.
3. Effective constraints use this precedence:
   - allergies and explicit ingredient exclusions;
   - enabled diet-pattern rules;
   - enabled tradition rules for the current practice schedule;
   - health/nutrition limits;
   - preferences and ranking signals.
4. Hard constraints remove candidates before scoring. Ranking cannot restore them.
5. MVP supports Buddhist and Christian traditions; the model remains extensible.
6. Restaurant directory discovery/details follow BL-16's explicit-search exception and do not inherit these personal profile constraints.
7. Recipe discovery may show profile-removed recipes only in an explicit, separately labelled "not suitable" view (`GET /posts?eligibility=INELIGIBLE`, user-approved 2026-10-26). Each item carries its reason codes and offending ingredients; the view never feeds ranking, recommendations or meal planning, and detail pages stay viewable as before.

### BL-03 — Practice schedule

- `ALWAYS` rules apply continuously.
- Periodic schedules use local date/time and explicit recurrence configuration.
- User overrides are versioned and explainable.
- Missing/ambiguous schedules fail safely by asking for confirmation rather than inferring religious observance.

### BL-04 — Canonical ingredients and compatibility

User-approved 2026-10-25 extension: use a public named allergen catalog for explicit selection and reject unknown/inactive preference codes. Ingredient composition has UNKNOWN/PARTIAL/COMPLETE status, SIMPLE/COMPOUND/UNSPECIFIED kind, canonical component edges, reviewed source/version/record/license and exact formulation scope. Admin-only, versioned, audited transactions reject cycles and excessive depth, including concurrent cross-parent cycles. Evaluate all descendants for allergies/exclusions/diet/tradition rules; every active hard dietary constraint rejects incomplete data. AI remains suggestion-only. Direct ingredient metadata edits invalidate the composition assessment. Current-plan fingerprints include composition semantics and profile constraints; confirmation rechecks current selected plans. Normalize demo catalog/aliases/profiles directly under the user's instruction, reporting unresolved selections for explicit correction; known positive constraints are never silently discarded.

1. Recipe ingredients map to canonical records; aliases are locale-aware.
2. Quantities normalize to mass where a reviewed conversion exists.
3. Nutrients use a known basis, normally per 100 g edible portion.
4. Daily reference/upper limits specify population, unit, source, and version.
5. Ingredient intake guidelines separately specify ingredient amount/frequency, period (for example per day), population/applicability, unit, evidence grade, source, severity, and review state.
6. Ingredient interaction rules identify scope (`SAME_DISH`, `SAME_MEAL`, `SAME_DAY`), direction, severity, applicability, evidence grade, source, and review status.
7. AI may propose a mapping or rule but cannot activate a hard rule. An authorized review action is required.
8. Unknown ingredients remain visible as unknown/estimated; they are not silently treated as zero nutrition.

### BL-05 — Cooking-aware recipe nutrition

1. Normalize ingredient quantities and calculate the raw canonical baseline.
2. Parse structured recipe steps into cooking method, duration, temperature, and yield context.
3. Apply reviewed yield and nutrient-retention factors when available.
4. AI may suggest mappings/factors for free text or missing data, using both ingredients and cooking process.
5. Store per-value origin: `CANONICAL_CALCULATED`, `AI_ESTIMATED`, `USER_PROVIDED`, or `VERIFIED_OVERRIDE`.
6. Return assumptions, confidence, uncertainty range, uncovered ingredients, source versions, and calculation version.
7. AI estimates never overwrite canonical food data. Corrections create versioned records.
8. Recalculate when ingredient quantities, serving count, cooking steps, or source/factor versions change.

#### BL-05.1 — Recipe nutrition on submit and reviewer confirmation (user-approved 2026-10-28)

1. Superseded by BL-05.2 on 2026-10-29 (authors may enter nutrition again). Draft revisions are not meal-planner eligible.
2. Submitting a recipe revision calculates a canonical estimate (BL-05 steps 1–3) and attaches it to that pending revision. When reviewed data is complete, AI is not called.
3. Insufficient data (free-text ingredient, missing canonical profile or any of the five review metrics, unit conversion unavailable, or a step that changes ingredients without a cooking method) never blocks submission. It queues one asynchronous AI job that sees the whole recipe and may suggest missing cooking methods, retention factors and whole-line estimates for the missing metrics. The job makes 1 attempt plus 3 automatic retries after 1, 5 and 15 minutes, then becomes `FAILED`; a startup sweep resumes interrupted jobs. A job that finishes after the revision is decided is discarded.
4. Recipe AI calls in this pipeline are system-paid: they never consume any user quota or credit, and every call is traced as a `NUTRITION` AI governance event.
5. Reviewers (Admin or Contributor, under the same eligibility as the publication decision) see five per-serving metrics — calories, protein, carbohydrate, fat, fiber; vitamin B12 is excluded — each with source label (`CANONICAL_CALCULATED`, `AI_ESTIMATED`, `VERIFIED_OVERRIDE` for reviewer edits), confidence, uncovered ingredients and job state. They may trigger a system-paid recalculation ("AI tính lại", overrides kept) and edit each value; every edit is audited with actor, role, time, reason and value/origin before and after.
6. A recipe revision can be approved only when all five values are present, even while a job runs or after it failed. A metric missing on any ingredient line is missing; partial sums are never presented as totals. Approval writes the final values into the revision's recipe detail used by cards and the meal planner, and cancels active jobs.
7. Editing a published recipe creates a new revision that is recalculated from scratch on submit and must be reviewed again. Values approved or overridden for the previous revision are shown for reference only and are never carried over.
8. AI suggestions apply only to that revision's estimate and remain labelled `AI_ESTIMATED`. They are never written to canonical ingredient data (`IngredientFoodProfile`, nutrient values, factors). Numbers become official for the recipe only through reviewer approval.

#### BL-05.2 — Author-entered nutrition and trusted-author recipe publication (user-approved 2026-10-29)

Agreed by the user with team member Ngô Gia Huy; refines BL-05.1.

1. The recipe form shows six per-serving fields: calories, protein, carbohydrate, fat, fiber and vitamin B12. The revision stores exactly what the author typed (`authorNutrition`) as `USER_PROVIDED` provenance.
2. Members may leave any field blank. On submit, typed values are kept and only blank metrics are calculated (BL-05.1 pipeline). The system estimate is still computed for comparison, including the AI gap-filling job when reviewed data is insufficient. Review still requires the five metrics of BL-05.1; vitamin B12 is optional, stored when typed and never estimated by AI.
3. Reviewer precedence per metric: reviewer override > author value > system estimate. The panel shows the author value, the system value and a warning when they differ by more than 30% of the system value. Clearing an override returns to the author value when present.
4. Approved Contributors (role and active profile authorised by the backend; all Contributors have the same permission) and Admins must declare all six values before a recipe can be submitted (`RECIPE_NUTRITION_REQUIRED`). Their recipe revision — including edits of a published recipe — is then published immediately with an audited moderation action, without the review queue. This is a user-approved exception to BL-06 for recipes only; articles and videos still go through review.
5. If automated moderation flags a trusted author's recipe, it is not auto-published and waits in the Admin queue.
6. Auto-published recipes store a canonical-only reference estimate (no AI call). The author-declared values become the published values.
7. Editors prefill only the author's own typed values, so values calculated or overridden for an earlier revision are never carried into a new revision (BL-05.1 rule 7 still holds).

### BL-06 — Content and video review lifecycle

Maintenance clarification 2026-10-26: titles and bodies need not be unique. Automatically generated URLs are unique and collision-safe; an explicitly requested URL must remain unique. Editing without a requested URL change preserves the current slug.

1. Author creates a draft and submits a specific immutable revision.
2. Automated moderation may attach signals but cannot publish, reject, or delete.
3. Admin approves or rejects with reason. Only approved revision becomes public.
4. Editing approved content creates a new draft revision; the last approved revision remains public until replacement approval.
5. Recipe, handbook, and video use the same state principles.
6. Ownership, moderation evidence, review events, and media references are retained according to policy.
7. DMCA-specific workflow is not claimed in MVP.

### BL-07 — Community and moderation

- Only authenticated users comment/vote/bookmark.
- Vote uniqueness and mutation idempotency are backend enforced.
- Reports and AI flags create moderation signals.
- Removal requires an Admin decision and reason; no signal performs hard deletion automatically.
- Contributor role can review and decide publication for submitted Member community content (recipes, articles, videos) that have no open AI flags or high-priority reports. Flagged/quarantined items, reports, comments, users, and content by non-Members remain Admin-exclusive. Anti-self-approval is strictly enforced.

### BL-08 — Storage quota

1. Validate MIME, extension, declared size, actual provider result, and per-file limit.
2. Atomically reserve account quota before upload; commit actual bytes after success.
3. Release expired/failed reservations and decrement committed use only after a valid asset deletion.
4. Prevent concurrent uploads from exceeding quota.
5. Return used, reserved, limit, and remaining bytes plus typed quota errors.
6. Admin may configure policy or grant audited adjustments. Media-storage payment remains deferred; the approved sandbox extension sells AI usage and Pantry capacity separately.

### BL-09 — Custom meals and user tags

- A custom meal is private to its owner unless a later approved flow publishes it.
- It may contain name, notes, servings, structured ingredients, nutrition estimate, multiple images, source note, and arbitrary tags.
- Tags such as `shopee` are normalized user text, not provider identities or API calls.
- A custom meal can be inserted into a plan and analyzed like a recipe when sufficient ingredient data exists.
- Create and nutrition-relevant edits recalculate the entire-meal estimate. Approved ingredient aliases resolve to canonical records; unresolved ingredients use the configured AI fallback when available, without replacing canonical food data. A recognizable meal name without ingredients may be estimated with explicit serving/preparation assumptions and low confidence. A missing metric for any ingredient requires a whole-meal fallback for that metric, rather than presenting a partial sum as the total. Preserve manual overrides, expose provenance/uncertainty, and retain nulls when estimation is unavailable. Clarified by user request on 2026-10-25.

### BL-10 — Meal planning and compatibility

1. Determine energy target from stored health/profile inputs and make assumptions explicit.
2. Apply dietary/allergy constraints before assembling candidates.
3. Use serving size, portion guidance, ingredient amounts, canonical nutrients, and cooking-aware estimates.
4. Check daily limits and interaction rules within a dish, meal, and day.
5. Return warning code, severity, evidence/source, affected items, explanation, and suggested adjustment.
6. Warnings support tooltip/dialog UX and do not claim medical certainty.
7. The user chooses among suggestions before final insertion; swap/regenerate preserves hard constraints.
8. Unknown data lowers confidence instead of being treated as safe or nutritionally zero.
9. Weekly-plan generation and user-facing nutrition comparison use four estimated dimensions only: protein, fiber, fat, and carbohydrates. Micronutrient completeness is not a generation blocker or weekly-plan warning.
10. Macro targets extend the existing health-profile target: stored TDEE is multiplied by the configured goal factor, then converted through the configured protein/fat/carbohydrate energy distribution and fiber-per-1000-kcal factor. The response identifies this source, tolerance, and estimate status; these values are guidance rather than measurements.
11. Manual insertion preserves a hard-compatible user choice and returns advisory over-target warnings after recalculating the day. Allergy, explicit exclusion, diet-pattern, and enabled-tradition violations remain blocking.
12. Generated plans attempt all Monday-through-Sunday breakfast/lunch/dinner slots. Calorie/macro tolerance and repetition are scoring preferences, not reasons to hide a hard-compatible candidate; a genuinely unresolved slot remains explicit with a reason.

### BL-11 — Multi-week programs

- A program contains ordered weeks with dates/timezone and plan snapshots.
- Repeated-pattern and cumulative nutrient checks span the configured horizon.
- Editing one week invalidates affected later analyses and shopping projections.
- Generated programs are drafts until the user confirms them.
- Before starting/resuming missing weekly alternatives, validate health and periodic calendar coverage for every week to generate. Return all missing week starts/dates before creating new records; users explicitly save days for each week. Successful repair of the last failed week recomputes PARTIAL/FAILED → DRAFT in the same versioned mutation, allowing confirmation. Do not infer religious observance or weaken hard dietary constraints.

### BL-12 — Pantry, fridge images, and receipts

1. Pantry quantities retain unit, normalized amount when possible, source, confidence, and confirmation state.
2. One fridge-recognition job accepts multiple images; deduplicate candidates across images.
3. AI may estimate item, amount, unit, and freshness observation. Never state definitive food safety.
4. The user confirms/edits/rejects candidates before pantry update.
5. Receipt extraction follows the same confirmation boundary and records source image/job.
5a. Compare receipt identity before merging line items. Different visible receipt numbers remain separate even when a product line matches. When either photo lacks a number, an exact match requires merchant, date, total, currency and the full line multiset; partial matches require the user to choose same receipt or separate purchases before confirmation. Confirmed overlap never increments Pantry twice, including across jobs.
5b. Keep edible food, ready-to-eat products and drinks as receipt candidates. AI may initially exclude clearly non-food goods; persist the original line and reason, return an exclusion notice and allow the user to restore a mistaken exclusion before confirmation. Uncertain lines remain available for review. Excluded lines never affect Pantry unless restored and explicitly confirmed.
6. Meal suggestions use confirmed pantry state and offer multiple candidates.
7. Shopping gaps are computed only after recipe/custom-meal choice, servings, unit conversion, and confirmed pantry inventory.
8. Shopping items show required, available, missing, unit, conversion assumptions, and confidence.
9. A free-text pantry item counts toward a required ingredient only when its normalized text exactly equals the ingredient's canonical name or an approved alias (canonical name wins); there is no fuzzy matching. Pantry items whose expiry date is before today are not counted as available. Manual pantry entry links such exact matches to the canonical ingredient at creation; existing free-text items are matched at read time, not migrated.

### BL-13 — Behavioral recommendations

- Record only approved event types with retention and privacy controls.
- Explainable scoring may use searches, chats, views, saves, votes, plan selections, swaps, and skips.
- Hard constraints run before ranking.
- Guest ranking is contextual/non-personalized.
- Users can reset or opt out of behavioral history when implemented.

### BL-14 — Chatbot and AI artifacts

- Guest quota is smaller than authenticated quota and protected from trivial bypass.
- AI provider/model is configuration and logged per request.
- Health/profile context is used only for the requested purpose.
- Answers provide uncertainty/safety guidance and never mutate canonical data automatically.
- Saved/shareable outputs become versioned AI artifacts and enter the applicable review flow.

### BL-15 — Contributor verification

- Every approved Contributor may verify an eligible AI artifact; approval basis does not matter.
- Self-verification is prohibited; contributors cannot verify their own artifacts.
- Verification records conclusion, evidence note, scope, actor, time, artifact version, and supersession.
- Verification is a human opinion/audit event, not proof of scientific correctness.
- Admin can review/revoke verification without deleting the original audit event.

### BL-16 — Restaurants and maps

- Use internal and external-source records through adapters.
- Deduplicate using provider reference first, then normalized name/location heuristics.
- Location requires consent or explicit user entry.
- Restaurant discovery and details do not automatically apply the personal eating profile, allergies, ingredient exclusions or tradition rules (user-approved 2026-10-25). Location, keyword and explicitly selected search filters determine the results.
- An explicit `dietPattern` query filters reviewed internal dietary claims before ranking and suppresses unreviewed external places. Without it, signed-in users and guests can retrieve the same public provider results. Provider labels remain advisory and do not establish dietary/allergy compatibility.
- Respect provider caching, attribution, and retention terms.

### BL-17 — Notifications

- Domain events create idempotent in-app notifications.
- Users can list, paginate, mark read, and view an unread count.
- Required events include content/contributor decisions, reports, quota warnings, and AI-verification outcomes.
- Email/push/realtime delivery is post-MVP unless separately approved.

### BL-18 — AI governance

- Log capability, provider/model, prompt/template version, latency, status, token/cost metadata when available, safety result, and correlation ID.
- Minimize/redact sensitive content and restrict log access.
- Track feedback, failure rate, moderation outcomes, recognition/extraction corrections, estimate coverage, and verification outcomes.
- Admin feature toggles disable a capability/provider with a defined fallback.
- AI signals do not trigger permanent user/content sanctions automatically.

### BL-19 — Account lifecycle and retention

- Soft-delete or anonymize where legal/audit retention is required.
- Deletion jobs cover profile, health, behavior, AI, pantry, receipt, recognition, media, and location data according to policy.
- Public content ownership/display after account deletion follows an explicit policy and audit trail.

### BL-20 — Approved usage billing extension (2026-10-13; payOS conversion 2026-10-14)

- payOS checkout expires after configured TTL (default 15 minutes); expired application orders hide the checkout URL. Retired local/VNPAY checkout and notification routes are removed; the old expiry recovery behavior is historical only.
- Billing is opt-in and app rollout remains development/test. The provider is now payOS, whose transfers are real even from a development app. Missing Client ID/API key/checksum disables purchases, without mock fallback. Historical balances/orders retain original identity. Application production rollout remains deferred.
- Signed payOS webhooks trigger an authoritative signed payment-request query. PAID with sufficient received money grants once; UNDERPAID/PROCESSING map to PENDING. Expected order amount/link/reference must match. Extra payment does not change package benefits and requires manual merchant handling. Late fully verified payment may supersede an unfulfilled terminal order; PAID never downgrades.
- New payOS order code/link/checkout URL are persisted, distinct from application UUID. Ambiguous creates retry/recover the same code. Reconciliation uses an owner-scoped 30-second cooldown. Signed unknown webhook confirmation samples ACK without grants. Browser return/cancel claims are ignored for settlement.
- Sell one-time cumulative packages for chat credits, fridge jobs, receipt jobs and additional Pantry slots. Demo benefits do not expire or grant roles/media storage. Prices and benefits are snapshotted on each order.
- Only a verified provider IPN/query result (or guarded local simulation) may grant benefits. Browser return never grants. Duplicate payment events and concurrent callbacks grant once; a verified late success may upgrade an unpaid terminal order, while PAID never downgrades.
- Chat consumes daily free quota first, then purchased credits. Reserve before provider work; complete atomically with the successful answer. Failures/fallbacks release; replay and stale workers cannot charge again or overwrite a newer attempt.
- One bounded scan job costs one credit after any image succeeds, including a valid empty analysis. Total failure/cancellation before success releases it. Retries of an already charged job are free, with a configurable default maximum of three processing attempts. Expired queued/processing leases are fenced before release.
- Pantry capacity counts every undeleted item, including zero quantity. Enforce the limit transactionally for manual creation and both scan confirmations. Existing over-limit items remain readable/editable/deletable; deletion/merge frees capacity. Results require explicit user confirmation before Pantry mutation.
- Clients share account balances/history and use typed business errors. Mongo validators/indexes, additive queued timestamp backfill, idempotent seed, OpenAPI and consumer documentation are required release gates.

### BL-20.1 — Duration combo and Admin insights (user-approved 2026-10-27)

- Only the combo has durations; the four single packs remain one-time and permanent. Catalog: `combo-1m` 69.000đ, `combo-3m` 176.000đ (−15%, rounded from 175.950), `combo-12m` 580.000đ (−30%, rounded from 579.600). The former one-time `combo` is deactivated; historical/pending orders keep their snapshot (demo data, no migration).
- A paid duration order creates one subscription of N periods × 30 days from activation (1 year = 12 periods = 360 days). Each period grants 100 chat, 10 fridge and 10 receipt credits once; unused period credits expire at the boundary (ledger `SUBSCRIPTION_PERIOD_EXPIRED`). +50 Pantry slots apply while active, not multiplied; after expiry existing items remain and only new additions are blocked.
- Current-period credits are spent before permanent (trial and single-pack) credits. A release returns to the same period only while it is current; a release after the boundary is not refunded (`USAGE_RELEASED_PERIOD_EXPIRED`). Buying while active appends after the current end date. No auto-renewal.
- Admin revenue statistics: overview (revenue of PAID orders, paid orders, buyers, average), contiguous series by day/week/month and order-status counts with success rate. Asia/Ho_Chi_Minh buckets, weeks start Monday; revenue by `paidAt`, statuses by `createdAt`; default 30 days, maximum 731. Simulated sandbox history is excluded. No per-product breakdown or export.
- Admin AI usage trace: signed-in chat requests (free daily, combo period or permanent credits) and fridge/receipt reservations with user name/email, feature, time, allowance source, units charged, outcome (spent/released/held), AI status, provider/model, tokens, latency and error code. Filters: feature, outcome, user email/name, date range. Prompts, images, receipts and provider payloads are never returned; guests are excluded; chat rows follow AI request-log retention; chat rows created before 2026-10-27 report source `UNKNOWN`. No CSV export.

## 6. RBAC summary

| Capability | Guest | Member | Contributor | Admin |
|---|:---:|:---:|:---:|:---:|
| View/search published content | ✓ | ✓ | ✓ | ✓ |
| Limited chatbot | ✓ |  |  |  |
| Full member chatbot and planning |  | ✓ | ✓ | ✓ |
| Manage own content/comments/media |  | ✓ | ✓ | ✓ |
| Comment/vote/bookmark |  | ✓ | ✓ | ✓ |
| Apply for Contributor |  | ✓ |  |  |
| Verify eligible AI artifact |  |  | ✓ | ✓ |
| Final content/video publication decision |  |  |  | ✓ |
| Final moderation/removal decision |  |  |  | ✓ |
| Contributor approval/revocation |  |  |  | ✓ |
| Manage categories, food data, quotas, AI configuration |  |  |  | ✓ |

## 7. State machines

### 7.1 Content revision

```text
DRAFT -> SUBMITTED -> APPROVED
                   -> REJECTED -> DRAFT (new revision/resubmission)

APPROVED --edit--> DRAFT (new revision; previous approved revision remains public)
APPROVED --admin moderation decision--> HIDDEN/REMOVED
```

### 7.2 Contributor application

```text
PENDING -> APPROVED
        -> REJECTED
        -> WITHDRAWN

APPROVED -> REVOKED (audited account/profile transition)
```

Approval records one basis; no subtype is selected.

### 7.3 AI estimate and verification

```text
GENERATED -> USER_CONFIRMED (where applicable)
          -> CONTRIBUTOR_VERIFIED
          -> SUPERSEDED
          -> REJECTED
```

Canonical promotion is a separate Admin-reviewed operation, not an implicit verification result.

### 7.4 Upload reservation

```text
RESERVED -> COMMITTED
         -> RELEASED
         -> EXPIRED
```

### 7.5 Recognition/receipt job

```text
QUEUED -> PROCESSING -> NEEDS_CONFIRMATION -> CONFIRMED
                    -> FAILED
                    -> CANCELLED
```

## 8. Delivery slices after Phase 11

| Phase | Vertical outcome | Main dependency |
|---:|---|---|
| 12 | Food and nutrient knowledge base | Phase 03 |
| 13 | Cooking-aware recipe nutrition | 04, 11, 12 |
| 14 | Unified Contributor trust migration | 01, 06, 07, 08 |
| 15 | Storage quota and upload accounting | 01, 04 |
| 16 | Video review parity | 04, 08, 15 |
| 17 | Custom meals, photos, user tags | 04, 12, 15 |
| 18 | Portion and compatibility analysis | 02, 10, 12, 13, 17 |
| 19 | Multi-week meal programs | 10, 17, 18 |
| 20 | Pantry inventory | 03, 12, 15 |
| 21 | Multi-image fridge recognition | 11, 15, 20 |
| 22 | Receipt analysis and shopping gaps | 10, 12, 15, 20 |
| 23 | AI sharing and Contributor verification | 11, 13, 14, 21, 22 |
| 24 | Restaurants and Google Maps | 01, 02 |
| 25 | In-app notifications | 01, 08, 14, 16, 23, 24 |
| 26 | Admin AI governance | 08, 11, 13, 16, 21, 22, 23 |
| 27 | Cross-cutting hardening/release gate | 00–26 |

Each phase owns its Prisma migration/seed, routes, OpenAPI, integration document update, lint/typecheck/build, and one scoped commit. Detailed prompts define exact endpoints without relying on session memory.

## 9. External data/provider strategy

Detailed source evaluation and links are maintained in `docs/FOOD_DATA_SOURCES.md`.

### 9.1 Food composition

- Prefer a provider-neutral import layer and a canonical internal schema.
- USDA FoodData Central is a suitable broad bootstrap source.
- The Vietnamese Food Composition Table is important for regional curation; licensing/access must be confirmed before digital import.
- Open Food Facts may supplement packaged/barcode data, but crowd-sourced records require validation and license compliance.
- Commercial providers such as Edamam or Nutritionix remain optional adapters, not domain dependencies.

### 9.2 Reference intake and cooking factors

- Reference intake/upper limits must identify authoritative source, population, unit, and revision.
- Nutrient retention and recipe yield use reviewed factor tables where possible.
- Recipe calculation remains an estimate because cooking time, temperature, water/fat transfer, and household technique vary.

### 9.3 AI boundary

AI may normalize text, propose ingredient matches, infer cooking methods, estimate missing values, and explain results. It may not silently author canonical nutrient facts, interaction rules, upper limits, or publication/moderation decisions.

## 10. Verification strategy

### Backend phase gate

- Prisma migration/seed requirements completed and reviewed.
- Authorization, ownership, validation, idempotency, pagination, and state transitions handled.
- OpenAPI `/api-docs.json` matches implementation.
- `frontend/docs/BACKEND_INTEGRATION.md` updated without marking incomplete endpoints READY.
- Backend lint, typecheck, build, and `git diff --check` pass.
- Repository policy currently does not require new automated backend test infrastructure.

### Frontend integration gate

- Integrate only READY endpoints after `npm run sync:swagger`.
- Use endpoint constants, DTO/Model/Mapper/API/Query layers, mapper tests, and typed business errors.
- Provide loading, error, empty, success, permission, quota, confidence, and partial-result states as relevant.
- Update FE-integrated status, progress, and work log.

### Critical end-to-end scenarios

1. User applies for Contributor; remains Member until manual approval; all approved Contributors receive identical permissions.
2. Diet/allergy rules remove prohibited items before recommendation ranking.
3. Recipe nutrition reflects ingredient data plus cooking steps and displays estimated/provenance fields.
4. Concurrent upload reservations cannot exceed account quota.
5. Video remains unpublished until Admin approval.
6. User adds a tagged custom meal and receives portion/compatibility warnings.
7. Multi-image fridge results require confirmation before pantry update.
8. Receipt candidates require confirmation; shopping gaps reflect confirmed pantry and selected servings.
9. AI flag/report cannot hard-delete content without Admin action.
10. AI provider is disabled and the capability follows its documented fallback.

## 11. Definition of Done

A phase is complete only when:

- all prompt acceptance criteria are met;
- no later-phase feature was partially smuggled into the phase;
- schema changes include safe migration and seed handling;
- observable contract, enums, errors, authorization, and state changes are documented;
- runtime status is honest (`PLANNED`, `IN_PROGRESS`, `CHANGING`, `READY`, `DEPRECATED`, or `REMOVED`);
- required quality gates pass;
- one scoped commit uses the specified message;
- the phase completion record and changelogs are updated.

## 12. Principal risks and controls

| Risk | Control |
|---|---|
| Nutrition estimate presented as exact | Provenance, uncertainty, assumptions, and educational disclaimer |
| AI invents ingredient facts/rules | Suggestion-only staging plus reviewed promotion |
| Poor local food coverage | Provider-neutral imports plus Vietnamese curation and aliases |
| Contributor basis becomes hidden RBAC | Single role; explicit review of authorization paths |
| Upload race exceeds quota | Transactional reservation/commit/release accounting |
| False freshness or compatibility certainty | Evidence grade, severity, confidence, and cautious language |
| Recognition/receipt corrupts pantry | Mandatory user confirmation boundary |
| Video abuse/copyright exposure | Manual review and storage controls now; formal legal workflow later |
| Behavioral personalization violates diet rules | Filter hard constraints before ranking |
| Phase 2 ideas are forgotten or accidentally claimed READY | Dedicated roadmap plus explicit status taxonomy |

## 13. Change record

- **4.17 — 2026-10-29:** D24 refinement: the AI recipe draft uses and preserves the author's servings/prep/cook times; blanks are filled by the AI; differing AI times are only hinted.

- **4.16 — 2026-10-29:** User approves BL-05.2 (agreed with Ngô Gia Huy): six optional author nutrition fields for Members (typed values kept, blanks calculated, >30% deviation warning for reviewers), six required fields for approved Contributors/Admins whose recipes and recipe edits are published immediately unless automated moderation flags them, canonical-only reference estimate for auto-published recipes; articles/videos unchanged.

- **4.15 — 2026-10-29:** User approves shopping-gap matching of free-text pantry items by exact canonical name/approved alias, excluding expired pantry items from availability, and auto-linking exact matches on manual pantry creation (BL-12 rule 9). No migration of existing items.

- **4.14 — 2026-10-28:** User approves BL-05.1: recipe nutrition calculated on submit, async system-paid AI gap filling (1 + 3 retries at 1/5/15 min, startup sweep, quota-free, governance-traced), reviewer panel with five metrics (B12 excluded), audited overrides kept across recalculation, approval gated on five values and written to recipe detail, no carry-over between revisions, and no AI write to canonical food data.

- **4.13 — 2026-10-26:** User clarifies that approved Contributors have review/moderation permissions for submitted community content (recipes, articles, videos) created by Members (excluding self-created content and items flagged with open AI flags or high report counts requiring Admin review). Content review endpoints (`/api/v1/admin/content-review*`) allow both Admin and Contributor roles.

- **4.13 — 2026-10-27:** User approves combo durations (1 month / 3 months / 1 year, per-30-day credits, −15%/−30%) and Admin revenue statistics plus per-user AI usage trace (BL-20.1). Single packs remain one-time.

- **4.12 — 2026-10-26:** User approves an explicit "not suitable" recipe-discovery view with per-recipe reasons (BL-02.7). Demo composition assertions extend to prepared foods used by seeded recipes.

- **4.11 — 2026-10-26:** Clarify duplicate content titles with unique/stable generated URLs; preflight full-horizon periodic schedules and recover partially generated programs to DRAFT after week repairs.

- **4.10 — 2026-10-25:** User approves named allergy selection, direct catalog normalization, reviewed transitive composition, fail-closed uncertain data, and current analysis/confirmation validation. No restaurant-directory or canonical-nutrition changes.

- **4.9 — 2026-10-25:** Custom-meal maintenance clarifies recalculation, approved-alias resolution, whole-meal fallback for free text/name-only meals, manual overrides and unknown-value handling. Recipe discovery, recommendations, weekly generation and manual insertion enforce allergies against both revision snapshots and current ingredient metadata. Weekly programs already generate dishes; consumers must read `days[].slots` in generated snapshots.

- **4.8 — 2026-10-25:** User explicitly excludes restaurant discovery and place details from automatic eating-profile filtering. Directory lookups use only requested location, keyword and explicit filters. A query `dietPattern` remains a reviewed-claim filter; external source attribution and unverified labels remain required. Recipe recommendations and meal planning retain their hard profile constraints.

- **4.5 — 2026-10-14:** User requests all billing moved to payOS and will configure credentials later. New purchases use hosted payOS QR/bank transfer, signed SDK create/query/webhook, persisted unique provider references, partial-payment handling and 30-second reconciliation. Retired providers are read-only history; their routes/configuration are removed. payOS is real money with no sandbox; app production rollout remains deferred.

- **4.4 — 2026-10-14:** Historical local-sandbox expiry fix; superseded for new purchases by payOS conversion 4.5. Retest distinguished 410 valid expiry from invalid signature and exercised repeated refresh rotation.

- **4.3 — 2026-10-13:** User-authorized sandbox billing. Snapshot VND catalog/orders; verified IPN/query reconciliation and idempotent grants; free-first chat; one bounded scan job credit after any successful image; total failures release; charged retries free, default three processing attempts; undeleted Pantry count with transactional enforcement on all insert paths. No production billing, role grants or storage upgrades. Mongo native validators, queued timestamp backfill and worker/credit fencing are required. Checkout returns wait for session restoration and preserve order context.

- **4.2 — 2026-10-08:** Reconcile dev estimated-macro planning/analysis updates with MongoDB persistence; preserve both approved decisions.

- **4.1 — 2026-10-07:** User-approved persistence replacement with MongoDB. Preserve existing API shapes, dietary constraints, authorization and state machines; move SQL checks/indexes, transactional event dispatch and concurrency controls to MongoDB/application equivalents. Fresh schema + seed is the acceptance baseline; historical PostgreSQL data is optional. See `backend/docs/MONGODB_MIGRATION.md`.
- **4.1 — 2026-09-28:** Clarified four-macro estimated weekly planning/analysis, target provenance, non-blocking manual over-target warnings, and explicit 21-slot/unresolved behavior.
- **4.0 — 2026-09-18:** Consolidated product decisions after Phase 11 review; added food database, cooking-aware nutrition, unified Contributor, quota, video parity, custom meals/tags, compatibility, multi-week planning, pantry, fridge and receipt workflows; expanded phases to 27; moved all deferred work into the complete Phase 2 roadmap.
